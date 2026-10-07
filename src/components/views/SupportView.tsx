/**
 * ANT — Automate and Transform
 * Tela de Suporte & Chamados para Empresas e Colaboradores
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Search,
  RefreshCw,
  Filter,
  Calendar,
  X,
  FileQuestion,
  Sparkles,
  ChevronRight,
  Shield,
  User,
  ArrowLeft,
  CheckCircle,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRbac } from '../../contexts/RbacContext';
import { supportService } from '../../services/supportService';
import {
  SupportTicket,
  SupportTicketMessage,
  TicketCategory,
  TicketStatus,
  SUPPORT_CATEGORIES,
  SUPPORT_STATUSES,
} from '../../types/support';

interface SupportViewProps {
  onNavigate?: (section: any) => void;
}

export const SupportView: React.FC<SupportViewProps> = () => {
  const { user, companyName, fullName } = useAuth();
  const { effectiveCompanyId, isOwner, hasCustomPermission, currentRole, currentJobTitle } =
    useRbac();

  const canCreateTicket = isOwner || hasCustomPermission('support_create');

  // Estados principais
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modal de abertura de chamado
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Problema Técnico');
  const [newDescription, setNewDescription] = useState<string>('');
  const [isSubmittingTicket, setIsSubmittingTicket] = useState<boolean>(false);

  // Chamado Selecionado para Detalhes / Conversa
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false);

  const effectiveId = effectiveCompanyId || user?.id || 'default';
  const effectiveName = companyName || 'Minha Empresa';

  // Carrega lista de chamados
  const loadTickets = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await supportService.getTicketsByCompany(effectiveId);
      setTickets(data);
    } catch (err) {
      console.error('Erro ao carregar chamados:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, [effectiveId]);

  // Carrega detalhes e mensagens quando um chamado for selecionado
  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsLoadingDetails(true);
    setReplyText('');

    try {
      const details = await supportService.getTicketWithMessages(ticket.id);
      if (details.ticket) {
        setSelectedTicket(details.ticket);
      }
      setMessages(details.messages);

      // Se havia notificação de resposta não lida do suporte, marca como lida
      if (ticket.has_unread_client_response) {
        await supportService.markAsRead(ticket.id, 'client');
        // Atualiza na lista local
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, has_unread_client_response: false } : t))
        );
      }
    } catch (err) {
      console.error('Erro ao abrir detalhes do chamado:', err);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  // Submissão do novo chamado
  const handleCreateTicketSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDescription.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, preencha todos os campos obrigatórios.' });
      return;
    }

    setIsSubmittingTicket(true);
    setFeedback(null);

    try {
      const res = await supportService.createTicket(
        effectiveId,
        effectiveName,
        {
          id: user?.id || 'anonymous',
          name: fullName || user?.email || 'Usuário',
          email: user?.email || '',
          role: currentJobTitle || currentRole,
        },
        {
          title: newTitle,
          category: newCategory,
          description: newDescription,
        }
      );

      if (res.success && res.ticket) {
        setTickets((prev) => [res.ticket!, ...prev]);
        setIsCreateModalOpen(false);
        setNewTitle('');
        setNewDescription('');
        setNewCategory('Problema Técnico');
        setFeedback({
          type: 'success',
          message: `Chamado ${res.ticket.ticket_number} criado com sucesso! Nossa equipe do Admin ANT já foi notificada.`,
        });
        setTimeout(() => setFeedback(null), 5000);
      } else {
        setFeedback({ type: 'error', message: res.error || 'Erro ao registrar chamado.' });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Erro inesperado ao criar chamado.' });
    } finally {
      setIsSubmittingTicket(false);
    }
  };

  // Envio de réplica/mensagem no chamado
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSendingReply(true);
    try {
      const res = await supportService.sendMessage(
        selectedTicket.id,
        {
          type: 'client',
          userId: user?.id || 'anonymous',
          name: fullName || user?.email || 'Usuário',
          email: user?.email || '',
          role: currentJobTitle || currentRole,
        },
        replyText.trim()
      );

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message!]);
        setReplyText('');
        // Atualiza status do chamado selecionado para Em Análise
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: 'Em Análise',
                has_unread_admin_response: true,
                has_unread_client_response: false,
                updated_at: new Date().toISOString(),
              }
            : null
        );
        // Atualiza na lista de chamados
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? {
                  ...t,
                  status: 'Em Análise',
                  has_unread_admin_response: true,
                  has_unread_client_response: false,
                  updated_at: new Date().toISOString(),
                }
              : t
          )
        );
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Encerramento / Resolução do chamado pelo cliente
  const handleCloseTicketByClient = async () => {
    if (!selectedTicket) return;
    const confirm = window.confirm(
      'Deseja marcar este chamado como Resolvido? Caso precise de nova ajuda futuramente, você poderá abrir outro chamado.'
    );
    if (!confirm) return;

    try {
      await supportService.updateTicketStatus(selectedTicket.id, 'Resolvido');
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'Resolvido' } : null));
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'Resolvido' } : t))
      );
      setFeedback({ type: 'success', message: 'Chamado marcado como Resolvido com sucesso!' });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err) {
      console.error('Erro ao resolver chamado:', err);
    }
  };

  // Métricas
  const metrics = useMemo(() => supportService.calculateMetrics(tickets), [tickets]);

  // Filtragem da lista
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      // Filtro de status
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      // Filtro de categoria
      if (categoryFilter !== 'all' && t.category !== categoryFilter) {
        return false;
      }
      // Busca por texto
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = t.ticket_number?.toLowerCase().includes(q);
        const matchesTitle = t.title?.toLowerCase().includes(q);
        const matchesDesc = t.description?.toLowerCase().includes(q);
        const matchesCat = t.category?.toLowerCase().includes(q);
        return matchesNumber || matchesTitle || matchesDesc || matchesCat;
      }
      return true;
    });
  }, [tickets, statusFilter, categoryFilter, searchQuery]);

  // Formatação de data amigável
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Badge de Status Colorida
  const renderStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Aberto':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Aberto
          </span>
        );
      case 'Em Análise':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800">
            <RefreshCw className="w-3 h-3 animate-spin" />
            Em Análise
          </span>
        );
      case 'Respondido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
            <MessageSquare className="w-3 h-3" />
            Respondido
          </span>
        );
      case 'Resolvido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Resolvido
          </span>
        );
      case 'Fechado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
            <CheckCircle className="w-3 h-3" />
            Fechado
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedback && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border text-xs sm:text-sm font-semibold flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-200 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Header Principal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Atendimento Oficial ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">Empresa: {effectiveName}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Central de Suporte & Chamados
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Abra chamados, tire dúvidas financeiras ou técnicas e acompanhe as respostas da equipe ANT diretamente nesta tela.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => loadTickets(true)}
            disabled={isRefreshing}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            title="Atualizar lista"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Atualizar</span>
          </button>

          {canCreateTicket && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-200 dark:shadow-none transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Abrir Novo Chamado</span>
            </button>
          )}
        </div>
      </div>

      {/* Cards de Métricas e Notificações Visuais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Chamados Abertos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Chamados Abertos</span>
            <span className="p-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.openTickets + metrics.inAnalysisTickets}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {metrics.openTickets} em espera, {metrics.inAnalysisTickets} em análise
          </p>
        </div>

        {/* Respostas da Equipe ANT */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative overflow-hidden">
          {metrics.unreadCount > 0 && (
            <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              Nova Resposta!
            </div>
          )}
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Respondidos pelo ANT</span>
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <MessageSquare className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.answeredTickets}
          </div>
          <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium mt-0.5">
            {metrics.unreadCount > 0
              ? `${metrics.unreadCount} aguardando sua leitura`
              : 'Atendimento em andamento'}
          </p>
        </div>

        {/* Resolvidos */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Resolvidos / Fechados</span>
            <span className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.resolvedTickets + metrics.closedTickets}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Chamados solucionados com sucesso
          </p>
        </div>

        {/* Total Geral */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Histórico</span>
            <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              <LifeBuoy className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {metrics.totalTickets}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Total de interações da empresa
          </p>
        </div>
      </div>

      {/* Área Principal: Lista de Chamados + Painel de Detalhes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Coluna Esquerda: Lista de Chamados (ou ocupa largura total em mobile se não selecionado) */}
        <div
          className={`space-y-4 ${
            selectedTicket ? 'lg:col-span-5 hidden lg:block' : 'col-span-12'
          }`}
        >
          {/* Barra de Filtros e Busca */}
          <div className="bg-white dark:bg-slate-900 p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por número, título ou descrição..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Filtro Status */}
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium cursor-pointer"
                >
                  <option value="all">Todos os Status</option>
                  {SUPPORT_STATUSES.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>

                {/* Filtro Categoria */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium cursor-pointer"
                >
                  <option value="all">Todas as Categorias</option>
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Lista de Chamados */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Meus Chamados ({filteredTickets.length})
              </h3>
              {filteredTickets.length > 0 && (
                <span className="text-[11px] text-slate-400">
                  Clique para abrir a conversa
                </span>
              )}
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin mx-auto text-purple-600" />
                <p className="text-xs">Carregando chamados...</p>
              </div>
            ) : filteredTickets.length === 0 ? (
              <div className="p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                  <LifeBuoy className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Nenhum chamado encontrado
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                    ? 'Nenhum chamado corresponde aos filtros selecionados. Tente limpar os filtros de busca.'
                    : 'Você ainda não possui chamados abertos. Quando precisar de orientações ou suporte técnico, clique em "Abrir Novo Chamado".'}
                </p>
                {canCreateTicket && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Abrir Chamado Agora</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {filteredTickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTicket(t)}
                      className={`w-full text-left p-4 transition-all cursor-pointer flex flex-col gap-2 relative ${
                        isSelected
                          ? 'bg-purple-50/80 dark:bg-purple-950/40 border-l-4 border-purple-600'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      {/* Indicador de Nova Resposta do Suporte */}
                      {t.has_unread_client_response && (
                        <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-600 text-white text-[10px] font-bold shadow-xs animate-bounce">
                          <Sparkles className="w-3 h-3" />
                          <span>Nova Resposta</span>
                        </div>
                      )}

                      <div className="flex items-center justify-between pr-24">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                            {t.ticket_number}
                          </span>
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {t.category}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                        {t.title}
                      </div>

                      <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                        {t.description}
                      </p>

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                        <div className="flex items-center gap-1.5">
                          {renderStatusBadge(t.status)}
                          <span className="text-slate-300 dark:text-slate-600">•</span>
                          <span>Aberto em {formatDate(t.created_at)}</span>
                        </div>

                        <span className="text-[10px] text-slate-400">
                          Atualizado: {formatDate(t.updated_at)}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Coluna Direita: Detalhes do Chamado & Conversa */}
        {selectedTicket ? (
          <div className="col-span-12 lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
            {/* Header do Chamado Selecionado */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => setSelectedTicket(null)}
                  className="lg:hidden inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 mb-2 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para lista</span>
                </button>

                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold text-purple-700 dark:text-purple-300 px-2 py-1 bg-purple-50 dark:bg-purple-950/60 rounded-md">
                    {selectedTicket.ticket_number}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {selectedTicket.category}
                  </span>
                  {renderStatusBadge(selectedTicket.status)}
                </div>

                {selectedTicket.status !== 'Resolvido' && selectedTicket.status !== 'Fechado' && (
                  <button
                    onClick={handleCloseTicketByClient}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 text-xs font-bold transition-colors cursor-pointer"
                    title="Encerrar chamado caso sua dúvida tenha sido resolvida"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Marcar como Resolvido</span>
                  </button>
                )}
              </div>

              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  {selectedTicket.title}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>Aberto por: <strong>{selectedTicket.created_by_name}</strong></span>
                  <span>•</span>
                  <span>Data: {formatDate(selectedTicket.created_at)}</span>
                  <span>•</span>
                  <span>Última atualização: {formatDate(selectedTicket.updated_at)}</span>
                </div>
              </div>
            </div>

            {/* Timeline de Mensagens / Conversa */}
            <div className="p-4 sm:p-6 space-y-4 max-h-[500px] overflow-y-auto bg-slate-50/50 dark:bg-slate-950/30">
              {isLoadingDetails ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600" />
                  <p className="text-xs">Carregando histórico do chamado...</p>
                </div>
              ) : (
                <>
                  {/* Descrição inicial do chamado */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2 shadow-2xs">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 flex items-center justify-center font-bold text-[10px]">
                          {selectedTicket.created_by_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {selectedTicket.created_by_name} (Solicitação Inicial)
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDate(selectedTicket.created_at)}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                      {selectedTicket.description}
                    </p>
                  </div>

                  {/* Respostas subsequentes */}
                  {messages
                    .filter((m) => m.message !== selectedTicket.description)
                    .map((msg) => {
                      const isAdminMsg = msg.sender_type === 'admin';
                      return (
                        <div
                          key={msg.id}
                          className={`p-4 rounded-xl border space-y-2 shadow-2xs ${
                            isAdminMsg
                              ? 'bg-purple-50/90 dark:bg-purple-950/50 border-purple-200 dark:border-purple-800/80 ml-4 sm:ml-8'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 mr-4 sm:mr-8'
                          }`}
                        >
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              {isAdminMsg ? (
                                <div className="w-6 h-6 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-[10px] shadow-xs">
                                  <Shield className="w-3.5 h-3.5" />
                                </div>
                              ) : (
                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center font-bold text-[10px]">
                                  {msg.sender_name?.charAt(0).toUpperCase() || 'U'}
                                </div>
                              )}
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-slate-900 dark:text-slate-100">
                                  {msg.sender_name}
                                </span>
                                {isAdminMsg && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-purple-600 text-white tracking-wide">
                                    ADMIN ANT
                                  </span>
                                )}
                              </div>
                            </div>

                            <span className="text-[11px] text-slate-400">
                              {formatDate(msg.created_at)}
                            </span>
                          </div>

                          <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                            {msg.message}
                          </p>
                        </div>
                      );
                    })}

                  {messages.length === 0 && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                      Aguardando primeira resposta da equipe de suporte do ANT.
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Caixa de Resposta / Envio pelo Cliente */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              {selectedTicket.status === 'Resolvido' || selectedTicket.status === 'Fechado' ? (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    Este chamado está marcado como <strong>{selectedTicket.status}</strong>.
                  </p>
                  <button
                    onClick={() => {
                      setSelectedTicket((prev) => (prev ? { ...prev, status: 'Em Análise' } : null));
                    }}
                    className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                  >
                    Deseja enviar uma nova mensagem e reabrir este chamado?
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSendReply} className="space-y-3">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Adicionar resposta ou esclarecimento:
                  </label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Escreva sua mensagem para a equipe ANT..."
                    className="w-full p-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">
                      Suas mensagens são sincronizadas instantaneamente com o Admin ANT.
                    </span>
                    <button
                      type="submit"
                      disabled={isSendingReply || !replyText.trim()}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs"
                    >
                      {isSendingReply ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      <span>Enviar Mensagem</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* Placeholder se nenhum chamado estiver selecionado em Desktop */
          <div className="hidden lg:flex col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-12 text-center flex-col items-center justify-center space-y-3 min-h-[420px] shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <MessageSquare className="w-7 h-7" />
            </div>
            <h4 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Selecione um chamado ao lado
            </h4>
            <p className="text-xs text-slate-400 max-w-sm">
              Clique em qualquer chamado da lista para ver o histórico completo da conversa, mensagens e orientações da equipe ANT.
            </p>
            {canCreateTicket && (
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Abrir Novo Chamado</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Modal de Abertura de Chamado */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden my-8">
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Abrir Novo Chamado
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Preencha os detalhes para atendimento pela equipe ANT.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTicketSubmit} className="p-4 sm:p-6 space-y-4">
              {/* Título */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Título do Chamado <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Ex: Dúvida sobre emissão de relatório ou erro ao salvar produto"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              {/* Categoria */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Categoria <span className="text-rose-500">*</span>
                </label>
                <select
                  required
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as TicketCategory)}
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium cursor-pointer"
                >
                  {SUPPORT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Descrição detalhada <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="Descreva detalhadamente o ocorrido, dúvidas, passos para reproduzir ou a solicitação..."
                  className="w-full p-3.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div className="p-3 bg-purple-50/70 dark:bg-purple-950/40 rounded-xl border border-purple-200/60 dark:border-purple-800/60 text-[11px] text-purple-900 dark:text-purple-300 space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                  Privacidade e Atendimento
                </div>
                <p>
                  Este chamado será encaminhado à equipe de administração do ANT. O histórico de mensagens e respostas ficará salvo na sua empresa.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingTicket}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingTicket ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Enviando...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Enviar Chamado</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
