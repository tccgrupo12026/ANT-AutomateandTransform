/**
 * ANT — Automate and Transform
 * Central de Suporte & Chamados Service
 *
 * Integração completa com Supabase (tabelas support_tickets e support_ticket_messages)
 * com fallback e sincronização automática com LocalStorage para resiliência total.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import {
  SupportTicket,
  SupportTicketMessage,
  CreateTicketDTO,
  TicketStatus,
  SupportMetrics,
} from '../types/support';

const LOCAL_STORAGE_TICKETS_KEY = 'ant_support_tickets_v1';
const LOCAL_STORAGE_MESSAGES_KEY = 'ant_support_messages_v1';

// Seed inicial caso não existam chamados no LocalStorage
const INITIAL_SAMPLE_TICKETS: SupportTicket[] = [];

// -------------------------------------------------------------
// Helpers de Armazenamento Local (Offline-first & Resiliência)
// -------------------------------------------------------------

function getLocalTickets(): SupportTicket[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_TICKETS_KEY);
    if (!raw) return INITIAL_SAMPLE_TICKETS;
    return JSON.parse(raw);
  } catch {
    return INITIAL_SAMPLE_TICKETS;
  }
}

function saveLocalTickets(tickets: SupportTicket[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_TICKETS_KEY, JSON.stringify(tickets));
  } catch (err) {
    console.warn('Erro ao salvar chamados localmente:', err);
  }
}

function getLocalMessages(): SupportTicketMessage[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalMessages(messages: SupportTicketMessage[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_MESSAGES_KEY, JSON.stringify(messages));
  } catch (err) {
    console.warn('Erro ao salvar mensagens localmente:', err);
  }
}

// -------------------------------------------------------------
// Serviço de Suporte
// -------------------------------------------------------------

export const supportService = {
  /**
   * Busca todos os chamados de uma determinada empresa (para o cliente / proprietário / funcionário)
   */
  async getTicketsByCompany(companyId: string): Promise<SupportTicket[]> {
    const supabase = getSupabaseClient();
    const localTickets = getLocalTickets().filter(
      (t) => t.company_id === companyId || t.company_id === 'default'
    );

    if (!supabase) {
      return localTickets;
    }

    try {
      const { data, error } = await executeWithJwtRecovery<any[]>(async (client) => {
        return await client
          .from('support_tickets')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: false });
      });

      if (error || !data || !Array.isArray(data)) {
        return localTickets;
      }

      // Mescla com chamados locais caso algum ainda não tenha sido replicado
      const cloudIds = new Set(data.map((d: any) => d.id));
      const pendingLocal = localTickets.filter((lt) => !cloudIds.has(lt.id));
      const merged = [...(data as SupportTicket[]), ...pendingLocal];
      saveLocalTickets(merged);
      return merged;
    } catch {
      return localTickets;
    }
  },

  /**
   * Busca todos os chamados da plataforma (para o Admin ANT)
   */
  async getAllTicketsForAdmin(): Promise<SupportTicket[]> {
    const supabase = getSupabaseClient();
    const localTickets = getLocalTickets();

    if (!supabase) {
      return localTickets;
    }

    try {
      const { data, error } = await executeWithJwtRecovery<any[]>(async (client) => {
        return await client
          .from('support_tickets')
          .select('*')
          .order('created_at', { ascending: false });
      });

      if (error || !data || !Array.isArray(data)) {
        return localTickets;
      }

      const cloudIds = new Set(data.map((d: any) => d.id));
      const pendingLocal = localTickets.filter((lt) => !cloudIds.has(lt.id));
      const merged = [...(data as SupportTicket[]), ...pendingLocal];
      saveLocalTickets(merged);
      return merged;
    } catch {
      return localTickets;
    }
  },

  /**
   * Busca os detalhes completos de um chamado, incluindo todas as mensagens/respostas
   */
  async getTicketWithMessages(ticketId: string): Promise<{
    ticket: SupportTicket | null;
    messages: SupportTicketMessage[];
  }> {
    const supabase = getSupabaseClient();
    const localTickets = getLocalTickets();
    const localMessages = getLocalMessages().filter((m) => m.ticket_id === ticketId);
    const localTicket = localTickets.find((t) => t.id === ticketId) || null;

    if (!supabase) {
      return {
        ticket: localTicket,
        messages: localMessages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      };
    }

    try {
      // 1. Busca chamado
      const { data: ticketData, error: ticketError } = await executeWithJwtRecovery<any>(
        async (client) => {
          return await client.from('support_tickets').select('*').eq('id', ticketId).maybeSingle();
        }
      );

      // 2. Busca mensagens
      const { data: messagesData, error: messagesError } = await executeWithJwtRecovery<any[]>(
        async (client) => {
          return await client
            .from('support_ticket_messages')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });
        }
      );

      const resolvedTicket: SupportTicket | null =
        (!ticketError && ticketData) ? (ticketData as SupportTicket) : localTicket;

      let resolvedMessages: SupportTicketMessage[] =
        (!messagesError && messagesData && Array.isArray(messagesData))
          ? (messagesData as SupportTicketMessage[])
          : localMessages;

      // Se mensagens na nuvem vieram vazias mas temos localmente, usa local
      if (resolvedMessages.length === 0 && localMessages.length > 0) {
        resolvedMessages = localMessages;
      }

      return {
        ticket: resolvedTicket,
        messages: resolvedMessages,
      };
    } catch {
      return {
        ticket: localTicket,
        messages: localMessages.sort(
          (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        ),
      };
    }
  },

  /**
   * Cria um novo chamado aberto pelo cliente
   */
  async createTicket(
    companyId: string,
    companyName: string,
    user: { id: string; name: string; email?: string; role?: string },
    dto: CreateTicketDTO
  ): Promise<{ success: boolean; ticket?: SupportTicket; error?: string }> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const generatedTicketId = crypto.randomUUID ? crypto.randomUUID() : `tck_${Date.now()}`;
    const generatedNumber = `TCK-${Math.floor(1000 + Math.random() * 9000)}`;

    const newTicket: SupportTicket = {
      id: generatedTicketId,
      ticket_number: generatedNumber,
      company_id: companyId,
      company_name: companyName || 'Minha Empresa',
      created_by_user_id: user.id,
      created_by_name: user.name || 'Usuário',
      created_by_email: user.email || '',
      created_by_role: user.role || 'employee',
      title: dto.title.trim(),
      category: dto.category,
      description: dto.description.trim(),
      status: 'Aberto',
      has_unread_client_response: false,
      has_unread_admin_response: true,
      created_at: now,
      updated_at: now,
      last_message_at: now,
    };

    const initialMessage: SupportTicketMessage = {
      id: crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`,
      ticket_id: generatedTicketId,
      sender_type: 'client',
      sender_user_id: user.id,
      sender_name: user.name || 'Usuário',
      sender_email: user.email || '',
      sender_role: user.role || 'employee',
      message: dto.description.trim(),
      created_at: now,
    };

    // Salva localmente de imediato (optimistic update & offline support)
    const localTickets = getLocalTickets();
    saveLocalTickets([newTicket, ...localTickets]);

    const localMessages = getLocalMessages();
    saveLocalMessages([...localMessages, initialMessage]);

    if (!supabase) {
      return { success: true, ticket: newTicket };
    }

    try {
      const { data: insertedTicket, error: insertError } = await executeWithJwtRecovery<any>(
        async (client) => {
          return await client
            .from('support_tickets')
            .insert({
              id: newTicket.id,
              ticket_number: newTicket.ticket_number,
              company_id: newTicket.company_id,
              company_name: newTicket.company_name,
              created_by_user_id: newTicket.created_by_user_id,
              created_by_name: newTicket.created_by_name,
              created_by_email: newTicket.created_by_email,
              created_by_role: newTicket.created_by_role,
              title: newTicket.title,
              category: newTicket.category,
              description: newTicket.description,
              status: newTicket.status,
              has_unread_client_response: false,
              has_unread_admin_response: true,
              created_at: newTicket.created_at,
              updated_at: newTicket.updated_at,
              last_message_at: newTicket.last_message_at,
            })
            .select()
            .maybeSingle();
        }
      );

      if (insertError) {
        console.warn('Aviso ao inserir chamado no Supabase (mantido em cache local):', insertError);
      }

      // Insere mensagem inicial
      await executeWithJwtRecovery(async (client) => {
        return await client.from('support_ticket_messages').insert({
          id: initialMessage.id,
          ticket_id: newTicket.id,
          sender_type: initialMessage.sender_type,
          sender_user_id: initialMessage.sender_user_id,
          sender_name: initialMessage.sender_name,
          sender_email: initialMessage.sender_email,
          sender_role: initialMessage.sender_role,
          message: initialMessage.message,
          created_at: initialMessage.created_at,
        });
      });

      const returnedTicket = (insertedTicket as SupportTicket) || newTicket;
      return { success: true, ticket: returnedTicket };
    } catch (err: any) {
      console.warn('Exceção ao persistir chamado no Supabase:', err);
      return { success: true, ticket: newTicket };
    }
  },

  /**
   * Adiciona uma nova mensagem/resposta a um chamado existente
   */
  async sendMessage(
    ticketId: string,
    sender: {
      type: 'client' | 'admin';
      userId: string;
      name: string;
      email?: string;
      role?: string;
    },
    messageText: string
  ): Promise<{ success: boolean; message?: SupportTicketMessage; error?: string }> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();
    const messageId = crypto.randomUUID ? crypto.randomUUID() : `msg_${Date.now()}`;

    const newMessage: SupportTicketMessage = {
      id: messageId,
      ticket_id: ticketId,
      sender_type: sender.type,
      sender_user_id: sender.userId,
      sender_name: sender.name,
      sender_email: sender.email || '',
      sender_role: sender.role || (sender.type === 'admin' ? 'ant_admin' : 'employee'),
      message: messageText.trim(),
      created_at: now,
    };

    // Atualiza status local
    const localMessages = getLocalMessages();
    saveLocalMessages([...localMessages, newMessage]);

    const localTickets = getLocalTickets();
    const updatedTickets = localTickets.map((t) => {
      if (t.id === ticketId) {
        const nextStatus: TicketStatus =
          sender.type === 'admin'
            ? 'Respondido'
            : t.status === 'Resolvido' || t.status === 'Fechado'
            ? 'Em Análise'
            : 'Em Análise';

        return {
          ...t,
          status: nextStatus,
          has_unread_client_response: sender.type === 'admin' ? true : false,
          has_unread_admin_response: sender.type === 'client' ? true : false,
          updated_at: now,
          last_message_at: now,
        };
      }
      return t;
    });
    saveLocalTickets(updatedTickets);

    if (!supabase) {
      return { success: true, message: newMessage };
    }

    try {
      // 1. Grava a mensagem
      await executeWithJwtRecovery(async (client) => {
        return await client.from('support_ticket_messages').insert({
          id: newMessage.id,
          ticket_id: ticketId,
          sender_type: newMessage.sender_type,
          sender_user_id: newMessage.sender_user_id,
          sender_name: newMessage.sender_name,
          sender_email: newMessage.sender_email,
          sender_role: newMessage.sender_role,
          message: newMessage.message,
          created_at: newMessage.created_at,
        });
      });

      // 2. Atualiza status do chamado
      const nextStatus: TicketStatus =
        sender.type === 'admin' ? 'Respondido' : 'Em Análise';

      await executeWithJwtRecovery(async (client) => {
        return await client
          .from('support_tickets')
          .update({
            status: nextStatus,
            has_unread_client_response: sender.type === 'admin' ? true : false,
            has_unread_admin_response: sender.type === 'client' ? true : false,
            updated_at: now,
            last_message_at: now,
          })
          .eq('id', ticketId);
      });

      return { success: true, message: newMessage };
    } catch (err: any) {
      console.warn('Erro ao sincronizar mensagem com o Supabase:', err);
      return { success: true, message: newMessage };
    }
  },

  /**
   * Altera o status do chamado (ex: Aberto, Em Análise, Respondido, Resolvido, Fechado)
   */
  async updateTicketStatus(
    ticketId: string,
    newStatus: TicketStatus
  ): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();
    const now = new Date().toISOString();

    const localTickets = getLocalTickets();
    const updated = localTickets.map((t) =>
      t.id === ticketId ? { ...t, status: newStatus, updated_at: now } : t
    );
    saveLocalTickets(updated);

    if (!supabase) {
      return { success: true };
    }

    try {
      await executeWithJwtRecovery(async (client) => {
        return await client
          .from('support_tickets')
          .update({
            status: newStatus,
            updated_at: now,
          })
          .eq('id', ticketId);
      });
      return { success: true };
    } catch (err: any) {
      console.warn('Erro ao atualizar status do chamado no Supabase:', err);
      return { success: true };
    }
  },

  /**
   * Marca as respostas do chamado como lidas pelo visualizador
   */
  async markAsRead(
    ticketId: string,
    viewer: 'client' | 'admin'
  ): Promise<void> {
    const supabase = getSupabaseClient();
    const localTickets = getLocalTickets();
    const updated = localTickets.map((t) => {
      if (t.id === ticketId) {
        return viewer === 'client'
          ? { ...t, has_unread_client_response: false }
          : { ...t, has_unread_admin_response: false };
      }
      return t;
    });
    saveLocalTickets(updated);

    if (!supabase) return;

    try {
      const updateData =
        viewer === 'client'
          ? { has_unread_client_response: false }
          : { has_unread_admin_response: false };

      await executeWithJwtRecovery(async (client) => {
        return await client.from('support_tickets').update(updateData).eq('id', ticketId);
      });
    } catch {
      // Ignora erro silenciosamente
    }
  },

  /**
   * Calcula métricas agregadas de chamados para badges e cards de resumo
   */
  calculateMetrics(tickets: SupportTicket[]): SupportMetrics {
    const totalTickets = tickets.length;
    let openTickets = 0;
    let inAnalysisTickets = 0;
    let answeredTickets = 0;
    let resolvedTickets = 0;
    let closedTickets = 0;
    let unreadCount = 0;

    for (const t of tickets) {
      if (t.status === 'Aberto') openTickets++;
      else if (t.status === 'Em Análise') inAnalysisTickets++;
      else if (t.status === 'Respondido') answeredTickets++;
      else if (t.status === 'Resolvido') resolvedTickets++;
      else if (t.status === 'Fechado') closedTickets++;

      if (t.has_unread_client_response) unreadCount++;
    }

    return {
      totalTickets,
      openTickets,
      inAnalysisTickets,
      answeredTickets,
      resolvedTickets,
      closedTickets,
      unreadCount,
    };
  },
};
