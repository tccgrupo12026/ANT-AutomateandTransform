/**
 * ANT — Automate and Transform
 * Central de Suporte & Chamados Types
 */

export type TicketStatus =
  | 'Aberto'
  | 'Em Análise'
  | 'Respondido'
  | 'Resolvido'
  | 'Fechado';

export type TicketCategory =
  | 'Problema Técnico'
  | 'Erro no Sistema'
  | 'Financeiro'
  | 'Assinaturas'
  | 'Dúvida'
  | 'Sugestão'
  | 'Outro';

export const SUPPORT_CATEGORIES: TicketCategory[] = [
  'Problema Técnico',
  'Erro no Sistema',
  'Financeiro',
  'Assinaturas',
  'Dúvida',
  'Sugestão',
  'Outro',
];

export const SUPPORT_STATUSES: TicketStatus[] = [
  'Aberto',
  'Em Análise',
  'Respondido',
  'Resolvido',
  'Fechado',
];

export interface SupportTicketMessage {
  id: string;
  ticket_id: string;
  sender_type: 'client' | 'admin';
  sender_user_id: string;
  sender_name: string;
  sender_email?: string;
  sender_role?: string;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  company_id: string;
  company_name: string;
  created_by_user_id: string;
  created_by_name: string;
  created_by_email?: string;
  created_by_role?: string;
  title: string;
  category: TicketCategory;
  description: string;
  status: TicketStatus;
  has_unread_client_response?: boolean;
  has_unread_admin_response?: boolean;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
  messages?: SupportTicketMessage[];
}

export interface CreateTicketDTO {
  title: string;
  category: TicketCategory;
  description: string;
}

export interface SupportMetrics {
  totalTickets: number;
  openTickets: number;
  inAnalysisTickets: number;
  answeredTickets: number;
  resolvedTickets: number;
  closedTickets: number;
  unreadCount: number;
}
