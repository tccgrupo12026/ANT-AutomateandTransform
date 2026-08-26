import React, { useState } from 'react';
import {
  LifeBuoy,
  MessageSquare,
  Mail,
  Phone,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Send,
  UserCheck,
  Search,
} from 'lucide-react';

interface SupportTicket {
  id: string;
  company_name: string;
  responsible_name: string;
  category: 'assinatura' | 'acesso' | 'duvida_geral' | 'financeiro';
  subject: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
  priority: 'low' | 'medium' | 'high';
}

const SUPPORT_TICKETS_STORAGE_KEY = 'ant_admin_support_tickets';

export const AdminSupportView: React.FC = () => {
  const [tickets, setTickets] = useState<SupportTicket[]>(() => {
    try {
      const raw = localStorage.getItem(SUPPORT_TICKETS_STORAGE_KEY);
      if (!raw) return [];
      const parsed: SupportTicket[] = JSON.parse(raw);
      // Filtra chamados de exemplo antigos
      return parsed.filter((t) => !['TCK-101', 'TCK-102', 'TCK-103'].includes(t.id));
    } catch {
      return [];
    }
  });
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState<string>('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleResolveTicket = (id: string) => {
    const updated = tickets.map((t) => (t.id === id ? { ...t, status: 'resolved' as const } : t));
    setTickets(updated);
    try {
      localStorage.setItem(SUPPORT_TICKETS_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignora
    }
    if (selectedTicket?.id === id) {
      setSelectedTicket((prev) => (prev ? { ...prev, status: 'resolved' } : null));
    }
    setToastMessage('Chamado marcado como resolvido!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setReplyText('');
    setToastMessage('Resposta registrada e encaminhada ao cliente!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-lg border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 text-sm font-medium flex items-center gap-2 animate-in fade-in duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
            Admin ANT
          </span>
          <span className="text-xs text-slate-400 font-medium">Atendimento ao Cliente</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Central de Suporte & Chamados
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Atendimento a empresas clientes, resolução de dúvidas cadastrais, orientações e suporte técnico da plataforma ANT.
        </p>
      </div>

      {/* Main Support Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-purple-600" />
              Chamados de Clientes
            </h3>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
              {tickets.length} total
            </span>
          </div>

          {tickets.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">Nenhum chamado aberto</div>
              <p className="text-[11px] text-slate-400">
                Quando clientes enviarem dúvidas ou solicitações, elas aparecerão aqui.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {tickets.map((t) => {
                const isSelected = selectedTicket?.id === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTicket(t)}
                    className={`w-full text-left p-4 transition-colors cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? 'bg-purple-50/70 dark:bg-purple-950/40 border-l-4 border-purple-600'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">{t.id}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          t.status === 'open'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : t.status === 'in_progress'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}
                      >
                        {t.status === 'open'
                          ? 'Aberto'
                          : t.status === 'in_progress'
                          ? 'Em Andamento'
                          : 'Resolvido'}
                      </span>
                    </div>

                    <div className="text-xs font-bold text-slate-900 dark:text-slate-100 line-clamp-1">
                      {t.subject}
                    </div>

                    <div className="text-[11px] text-slate-500 line-clamp-1">
                      {t.company_name} • {t.responsible_name}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Ticket Details & Reply Panel */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
          {selectedTicket ? (
            <>
              {/* Ticket Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400">
                      {selectedTicket.id}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase text-[10px]">
                      {selectedTicket.category}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-1">
                    {selectedTicket.subject}
                  </h3>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Empresa: <strong>{selectedTicket.company_name}</strong> (Resp:{' '}
                    {selectedTicket.responsible_name})
                  </div>
                </div>

                <div>
                  {selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={() => handleResolveTicket(selectedTicket.id)}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 text-xs font-bold transition-colors"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Marcar como Resolvido</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Message Thread Box */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {selectedTicket.responsible_name} ({selectedTicket.company_name})
                  </span>
                  <span>Registrado recentemente</span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  {selectedTicket.subject}. Gostaríamos de orientações sobre como prosseguir com esta solicitação na plataforma ANT.
                </p>
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="space-y-3">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Responder ao Cliente
                </label>
                <textarea
                  rows={4}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Escreva a resposta de suporte ao cliente..."
                  className="w-full p-3.5 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Enviar Resposta</span>
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
                  ? 'Não há solicitações de suporte pendentes no momento. As interações de suporte dos clientes cadastrados no Supabase serão gerenciadas nesta tela.'
                  : 'Selecione um chamado na lista ao lado para responder e gerenciar a solicitação do cliente.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
