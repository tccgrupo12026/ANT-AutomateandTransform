/**
 * ANT — Automate and Transform
 * Admin ANT — Central de Suporte & Chamados SaaS
 *
 * Módulo administrativo para a equipe do ANT atender, responder e gerenciar chamados
 * de todas as empresas e usuários da plataforma.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  Send,
  Search,
  RefreshCw,
  Filter,
  Shield,
  User,
  CheckCircle,
  XCircle,
  Sparkles,
} from 'lucide-react';
import { supportService } from '../../services/supportService';
import { useAuth } from '../../contexts/AuthContext';
import {
  SupportTicket,
  SupportTicketMessage,
  TicketStatus,
  SUPPORT_STATUSES,
} from '../../types/support';

export const AdminSupportView: React.FC = () => {
  const { user, fullName } = useAuth();

  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Chamado Selecionado
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<SupportTicketMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>('');
  const [isSendingReply, setIsSendingReply] = useState<boolean>(false);

  // Carrega todos os chamados da plataforma
  const loadTickets = async (quiet = false) => {
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const all = await supportService.getAllTicketsForAdmin();
      setTickets(all);

      // Se há um selecionado, sincroniza
      if (selectedTicket) {
        const found = all.find((t) => t.id === selectedTicket.id);
        if (found) setSelectedTicket(found);
      }
    } catch (err) {
      console.error('Erro ao carregar chamados para o admin:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  // Seleciona chamado e carrega histórico
  const handleSelectTicket = async (ticket: SupportTicket) => {
    setSelectedTicket(ticket);
    setIsLoadingMessages(true);
    setReplyText('');

    try {
      const details = await supportService.getTicketWithMessages(ticket.id);
      if (details.ticket) setSelectedTicket(details.ticket);
      setMessages(details.messages);

      // Marca como lido pelo admin
      if (ticket.has_unread_admin_response) {
        await supportService.markAsRead(ticket.id, 'admin');
        setTickets((prev) =>
          prev.map((t) => (t.id === ticket.id ? { ...t, has_unread_admin_response: false } : t))
        );
      }
    } catch (err) {
      console.error('Erro ao carregar detalhes do chamado no admin:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Enviar resposta do Admin ANT
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSendingReply(true);
    try {
      const res = await supportService.sendMessage(
        selectedTicket.id,
        {
          type: 'admin',
          userId: user?.id || 'ant_admin_support',
          name: fullName || 'Suporte Oficial ANT',
          email: user?.email || 'suporte@ant.com',
          role: 'Admin ANT',
        },
        replyText.trim()
      );

      if (res.success && res.message) {
        setMessages((prev) => [...prev, res.message!]);
        setReplyText('');
        // Atualiza status do chamado selecionado para Respondido
        const now = new Date().toISOString();
        setSelectedTicket((prev) =>
          prev
            ? {
                ...prev,
                status: 'Respondido',
                has_unread_client_response: true,
                has_unread_admin_response: false,
                updated_at: now,
              }
            : null
        );
        setTickets((prev) =>
          prev.map((t) =>
            t.id === selectedTicket.id
              ? {
                  ...t,
                  status: 'Respondido',
                  has_unread_client_response: true,
                  has_unread_admin_response: false,
                  updated_at: now,
                }
              : t
          )
        );

        setToastMessage('Resposta registrada e encaminhada ao cliente com sucesso!');
        setTimeout(() => setToastMessage(null), 3500);
      }
    } catch (err) {
      console.error('Erro ao responder chamado:', err);
    } finally {
      setIsSendingReply(false);
    }
  };

  // Alterar Status do Chamado pelo Admin ANT
  const handleUpdateStatus = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await supportService.updateTicketStatus(ticketId, newStatus);
      const now = new Date().toISOString();

      if (selectedTicket?.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, status: newStatus, updated_at: now } : null));
      }

      setTickets((prev) =>
        prev.map((t) => (t.id === ticketId ? { ...t, status: newStatus, updated_at: now } : t))
      );

      setToastMessage(`Status do chamado atualizado para "${newStatus}"!`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
    }
  };

  // Formatação de data
  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      return new Date(isoString).toLocaleDateString('pt-BR', {
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

  // Filtragem
  const filteredTickets = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.ticket_number?.toLowerCase().includes(q) ||
          t.title?.toLowerCase().includes(q) ||
          t.company_name?.toLowerCase().includes(q) ||
          t.created_by_name?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, statusFilter, searchQuery]);

  // Contadores
  const metrics = useMemo(() => {
    const total = tickets.length;
    const open = tickets.filter((t) => t.status === 'Aberto').length;
    const inAnalysis = tickets.filter((t) => t.status === 'Em Análise').length;
    const answered = tickets.filter((t) => t.status === 'Respondido').length;
    const resolved = tickets.filter((t) => t.status === 'Resolvido' || t.status === 'Fechado').length;
    const unreadByAdmin = tickets.filter((t) => t.has_unread_admin_response).length;
    return { total, open, inAnalysis, answered, resolved, unreadByAdmin };
  }, [tickets]);

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 text-xs sm:text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Admin ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">Gestão Global da Plataforma</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <LifeBuoy className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Central de Suporte & Chamados
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Atendimento aos clientes da plataforma ANT, respostas técnicas, dúvidas operacionais e encerramento de chamados.
          </p>
        </div>

        <button
          onClick={() => loadTickets(true)}
          disabled={isRefreshing}
          className="self-start sm:self-auto p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar Fila</span>
        </button>
      </div>

      {/* Métricas do Painel Admin */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold mb-1">Aguardando Atendimento</div>
          <div className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {metrics.open}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Chamados abertos novos</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs relative">
          {metrics.unreadByAdmin > 0 && (
            <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-bold animate-pulse">
              {metrics.unreadByAdmin} novas
            </span>
          )}
          <div className="text-xs text-slate-400 font-semibold mb-1">Em Análise / Interação</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
            {metrics.inAnalysis}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Em atendimento ativo</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold mb-1">Respondidos</div>
          <div className="text-2xl font-black text-purple-600 dark:text-purple-400">
            {metrics.answered}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Aguardando retorno do cliente</div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs">
          <div className="text-xs text-slate-400 font-semibold mb-1">Solucionados / Encerrados</div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {metrics.resolved}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">De {metrics.total} no total</div>
        </div>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Lista de Chamados */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden flex flex-col">
          {/* Top Bar da Fila */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                Fila de Chamados ({filteredTickets.length})
              </h3>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                {tickets.length} total
              </span>
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filtrar por empresa, número ou assunto..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium cursor-pointer"
              >
                <option value="all">Todos os Status</option>
                {SUPPORT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items da Lista */}
          {isLoading ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <RefreshCw className="w-5 h-5 animate-spin mx-auto text-purple-600" />
              <p className="text-xs">Carregando fila de chamados...</p>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Nenhum chamado pendente
              </div>
              <p className="text-[11px] text-slate-400">
                Quando os clientes abrirem chamados ou mandarem dúvidas, eles aparecerão aqui automaticamente.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-[600px] overflow-y-auto">
              {filteredTickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelectTicket(t)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer flex flex-col gap-1.5 relative ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-l-4 border-purple-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    {t.has_unread_admin_response && (
                      <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300">
                          {t.ticket_number}
                        </span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {t.category}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'Aberto'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.status === 'Em Análise'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : t.status === 'Respondido'
                            ? 'bg-purple-50 text-purple-700 border border-purple-200'
                            : t.status === 'Resolvido'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {t.status}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {t.title}
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {t.company_name} • {t.created_by_name}
                    </div>

                    <div className="text-[10px] text-slate-400 flex items-center justify-between pt-0.5">
                      <span>Criado: {formatDate(t.created_at)}</span>
                      <span>Atualizado: {formatDate(t.updated_at)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalhes do Chamado & Painel de Resposta */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-2xs space-y-6">
          {selectedTicket ? (
            <>
              {/* Header do Chamado Selecionado */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {selectedTicket.ticket_number}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px]">
                      {selectedTicket.category}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        selectedTicket.status === 'Aberto'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : selectedTicket.status === 'Em Análise'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : selectedTicket.status === 'Respondido'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : selectedTicket.status === 'Resolvido'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}
                    >
                      {selectedTicket.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedTicket.title}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Empresa: <strong>{selectedTicket.company_name}</strong> (Solicitante:{' '}
                    {selectedTicket.created_by_name} {selectedTicket.created_by_email && `• ${selectedTicket.created_by_email}`})
                  </div>
                </div>

                {/* Controles de Status do Admin */}
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedTicket.status}
                    onChange={(e) =>
                      handleUpdateStatus(selectedTicket.id, e.target.value as TicketStatus)
                    }
                    className="px-2.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-bold text-slate-800 dark:text-slate-200 cursor-pointer focus:ring-2 focus:ring-purple-600"
                  >
                    {SUPPORT_STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>

                  {selectedTicket.status !== 'Resolvido' && selectedTicket.status !== 'Fechado' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Resolvido')}
                      className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                      title="Marcar como Resolvido"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Resolver</span>
                    </button>
                  )}

                  {selectedTicket.status !== 'Fechado' && (
                    <button
                      onClick={() => handleUpdateStatus(selectedTicket.id, 'Fechado')}
                      className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-bold transition-colors"
                      title="Encerrar chamado"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Encerrar</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Histórico Completo de Mensagens */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-4 max-h-[420px] overflow-y-auto">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Histórico de Interações
                </div>

                {isLoadingMessages ? (
                  <div className="py-6 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin text-purple-600" />
                    <span>Carregando histórico...</span>
                  </div>
                ) : (
                  <>
                    {/* Mensagem Inicial do Cliente */}
                    <div className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {selectedTicket.created_by_name} ({selectedTicket.company_name}) — Abertura
                        </span>
                        <span>{formatDate(selectedTicket.created_at)}</span>
                      </div>
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Respostas subsequentes */}
                    {messages
                      .filter((m) => m.message !== selectedTicket.description)
                      .map((msg) => {
                        const isAdmin = msg.sender_type === 'admin';
                        return (
                          <div
                            key={msg.id}
                            className={`p-3.5 rounded-xl border space-y-1.5 ${
                              isAdmin
                                ? 'bg-purple-50/80 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60 ml-4'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 mr-4'
                            }`}
                          >
                            <div className="flex items-center justify-between text-xs">
                              <span
                                className={`font-bold flex items-center gap-1.5 ${
                                  isAdmin
                                    ? 'text-purple-700 dark:text-purple-300'
                                    : 'text-slate-800 dark:text-slate-200'
                                }`}
                              >
                                {isAdmin ? (
                                  <Shield className="w-3.5 h-3.5 text-purple-600" />
                                ) : (
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                )}
                                {msg.sender_name} {isAdmin ? '(Admin ANT)' : ''}
                              </span>
                              <span className="text-[11px] text-slate-400">
                                {formatDate(msg.created_at)}
                              </span>
                            </div>
                            <p className="text-xs text-slate-700 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                              {msg.message}
                            </p>
                          </div>
                        );
                      })}
                  </>
                )}
              </div>

              {/* Formulário de Resposta do Admin ANT */}
              <form onSubmit={handleSendReply} className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Responder ao Cliente ({selectedTicket.company_name})
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva a resposta de suporte ao cliente com instruções detalhadas..."
                  className="w-full p-3.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    O status mudará automaticamente para "Respondido" ao enviar.
                  </span>
                  <button
                    type="submit"
                    disabled={!replyText.trim() || isSendingReply}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    {isSendingReply ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Enviar Resposta ao Cliente</span>
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 mx-auto flex items-center justify-center">
                <LifeBuoy className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                {tickets.length === 0 ? 'Fila de Atendimento Zerada' : 'Nenhum chamado selecionado'}
              </h4>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {tickets.length === 0
                  ? 'Não há solicitações de suporte no momento. Todas as interações de clientes da plataforma ANT serão gerenciadas aqui.'
                  : 'Selecione um chamado na lista ao lado para responder, alterar o status e acompanhar o cliente.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
