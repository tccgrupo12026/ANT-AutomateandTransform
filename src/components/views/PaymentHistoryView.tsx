/**
 * ANT — Automate and Transform
 * Tela de Histórico de Pagamentos (Fase 3)
 *
 * Exibe todas as transações, faturas e cobranças Mercado Pago da empresa,
 * com status, método, referências e opções de quitação para pagamentos pendentes.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  CreditCard,
  QrCode,
  FileText,
  Search,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  ChevronLeft,
  Calendar,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { mercadoPagoService } from '../../services/mercadoPagoService';
import { SubscriptionPayment, PaymentStatus, PaymentMethodType } from '../../types/subscription';

interface PaymentHistoryViewProps {
  onBackToSubscription?: () => void;
}

export const PaymentHistoryView: React.FC<PaymentHistoryViewProps> = ({
  onBackToSubscription,
}) => {
  const { user, companyName } = useAuth();
  const { refreshSubscription } = useSubscription();

  const [payments, setPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filtros
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const loadPayments = async (quiet = false) => {
    if (!user?.id) return;
    if (!quiet) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const data = await mercadoPagoService.getPaymentHistory(user.id);
      setPayments(data);
    } catch (err) {
      console.warn('Erro ao carregar histórico de pagamentos:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [user?.id]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleSimulateApprove = async (paymentId: string) => {
    const success = await mercadoPagoService.simulatePaymentApproval(paymentId);
    if (success) {
      await loadPayments(true);
      await refreshSubscription();
    }
  };

  // Filtragem da lista
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      if (statusFilter !== 'all' && p.status !== statusFilter) return false;
      if (methodFilter !== 'all' && p.payment_method !== methodFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          p.mp_payment_id?.toLowerCase().includes(q) ||
          p.mp_preference_id?.toLowerCase().includes(q) ||
          p.amount.toString().includes(q)
        );
      }
      return true;
    });
  }, [payments, statusFilter, methodFilter, searchQuery]);

  const renderStatusBadge = (status: PaymentStatus) => {
    switch (status) {
      case 'pago':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3" />
            Pago
          </span>
        );
      case 'pendente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3 h-3" />
            Pendente
          </span>
        );
      case 'vencido':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <AlertTriangle className="w-3 h-3" />
            Vencido
          </span>
        );
      case 'cancelado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            <XCircle className="w-3 h-3" />
            Cancelado
          </span>
        );
    }
  };

  const renderMethodBadge = (method: PaymentMethodType) => {
    switch (method) {
      case 'pix':
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
            <QrCode className="w-3.5 h-3.5 text-purple-600" />
            <span>PIX</span>
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
            <CreditCard className="w-3.5 h-3.5 text-sky-600" />
            <span>Cartão de Crédito</span>
          </span>
        );
      case 'boleto':
        return (
          <span className="inline-flex items-center gap-1 text-slate-700 dark:text-slate-300 font-semibold">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            <span>Boleto Bancário</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          {onBackToSubscription && (
            <button
              onClick={onBackToSubscription}
              className="inline-flex items-center gap-1 text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline mb-2 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar para Assinatura</span>
            </button>
          )}

          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Faturamento
            </span>
            <span className="text-xs text-slate-400 font-medium">{companyName || 'Minha Empresa'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Receipt className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Histórico de Pagamentos
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Histórico completo de faturas, comprovantes e simulações de pagamento registradas na plataforma.
          </p>
        </div>

        <button
          onClick={() => loadPayments(true)}
          disabled={isRefreshing}
          className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>Atualizar Faturas</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por referência MP ou valor..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">Todos os Status</option>
              <option value="pago">Pago</option>
              <option value="pendente">Pendente</option>
              <option value="vencido">Vencido</option>
              <option value="cancelado">Cancelado</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-medium cursor-pointer"
            >
              <option value="all">Todos os Métodos</option>
              <option value="pix">PIX</option>
              <option value="credit_card">Cartão</option>
              <option value="boleto">Boleto</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela de Pagamentos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            Carregando histórico de pagamentos...
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Receipt className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Nenhuma cobrança encontrada
            </h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Quando faturas forem processadas via Mercado Pago, os comprovantes e status aparecerão listados aqui.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold">
                <tr>
                  <th className="p-4">Data / Vencimento</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Método</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Referência Gateway (Simulado)</th>
                  <th className="p-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredPayments.map((pay) => (
                  <tr key={pay.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {new Date(pay.created_at).toLocaleDateString('pt-BR')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Venc: {pay.due_date ? new Date(pay.due_date).toLocaleDateString('pt-BR') : '—'}
                      </div>
                    </td>

                    <td className="p-4 font-bold text-slate-900 dark:text-slate-100">
                      R$ {pay.amount.toFixed(2).replace('.', ',')}
                    </td>

                    <td className="p-4">{renderMethodBadge(pay.payment_method)}</td>

                    <td className="p-4">{renderStatusBadge(pay.status)}</td>

                    <td className="p-4 font-mono text-[11px] text-slate-500">
                      {pay.mp_payment_id || pay.mp_preference_id || '—'}
                    </td>

                    <td className="p-4 text-right">
                      {pay.status === 'pendente' && (
                        <div className="flex items-center justify-end gap-2">
                          {pay.pix_copy_paste && (
                            <button
                              onClick={() => handleCopy(pay.pix_copy_paste!, pay.id)}
                              className="px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 text-[11px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                              title="Copiar Código PIX"
                            >
                              {copiedId === pay.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedId === pay.id ? 'Copiado!' : 'Copiar PIX'}</span>
                            </button>
                          )}

                          {pay.boleto_url && (
                            <a
                              href={pay.boleto_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Ver Boleto Bancário"
                            >
                              <span>Ver Boleto</span>
                            </a>
                          )}

                          <button
                            onClick={() => handleSimulateApprove(pay.id)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors cursor-pointer"
                            title="Simular confirmação de pagamento para teste"
                          >
                            Simular Aprovação
                          </button>
                        </div>
                      )}
                      {pay.status === 'pago' && (
                        <span className="text-[11px] text-emerald-600 font-semibold">
                          Confirmado
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
