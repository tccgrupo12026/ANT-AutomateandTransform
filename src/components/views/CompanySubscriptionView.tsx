/**
 * ANT — Automate and Transform
 * Tela de Assinatura da Empresa (Fase 3)
 *
 * Exibe o plano atual, status comercial, valor, vencimento, último pagamento
 * e botões de ação (Alterar Plano, Renovar Assinatura, Pagar Agora) com checkout Mercado Pago.
 */

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Calendar,
  DollarSign,
  CreditCard,
  Clock,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
  ArrowRight,
  ShieldCheck,
  Zap,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Receipt,
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { getActivePlans } from '../../services/subscriptionService';
import { mercadoPagoService } from '../../services/mercadoPagoService';
import {
  PlanId,
  PlanDetails,
  SubscriptionPayment,
  SubscriptionStatus,
} from '../../types/subscription';
import { MercadoPagoCheckoutModal } from '../subscription/MercadoPagoCheckoutModal';

interface CompanySubscriptionViewProps {
  onNavigate?: (section: any) => void;
  onOpenPaymentsHistory?: () => void;
  onChangePlanClick?: () => void;
}

export const CompanySubscriptionView: React.FC<CompanySubscriptionViewProps> = ({
  onNavigate,
  onOpenPaymentsHistory,
  onChangePlanClick,
}) => {
  const { user, companyName } = useAuth();
  const { summary, subscription, isLoading, refreshSubscription } = useSubscription();

  const [activePlans, setActivePlans] = useState<Record<PlanId, PlanDetails>>(getActivePlans());
  const [recentPayments, setRecentPayments] = useState<SubscriptionPayment[]>([]);
  const [isLoadingPayments, setIsLoadingPayments] = useState<boolean>(true);

  // Modal Checkout Mercado Pago
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<PlanDetails>(
    summary?.plan || activePlans.business
  );

  useEffect(() => {
    setActivePlans(getActivePlans());
    if (user?.id) {
      loadRecentPayments();
    }
  }, [user?.id]);

  const loadRecentPayments = async () => {
    if (!user?.id) return;
    setIsLoadingPayments(true);
    try {
      const history = await mercadoPagoService.getPaymentHistory(user.id);
      setRecentPayments(history.slice(0, 5));
    } catch (err) {
      console.warn('Erro ao carregar pagamentos recentes:', err);
    } finally {
      setIsLoadingPayments(false);
    }
  };

  const handleOpenCheckout = (plan?: PlanDetails) => {
    setSelectedPlanForCheckout(plan || summary?.plan || activePlans.business);
    setIsCheckoutOpen(true);
  };

  // Badge de Status Comercial (7 estados oficiais)
  const renderStatusBadge = (status?: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ativa (Em dia)
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
            <Sparkles className="w-3.5 h-3.5" />
            Período de Testes ({summary?.daysRemaining || 0} dias restantes)
          </span>
        );
      case 'pending_payment':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <Clock className="w-3.5 h-3.5" />
            Aguardando Pagamento
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse">
            <AlertTriangle className="w-3.5 h-3.5" />
            Pagamento Vencido
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300 dark:bg-amber-950/80 dark:text-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Assinatura Suspensa
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300 dark:bg-rose-950 dark:text-rose-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Expirada
          </span>
        );
      case 'canceled':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Cancelada
          </span>
        );
      default:
        return null;
    }
  };

  const currentPlan = summary?.plan || activePlans.starter;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Gestão de Assinatura
            </span>
            <span className="text-xs text-slate-400 font-medium">Empresa: {companyName || 'Minha Empresa'}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2.5">
            <Crown className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            Assinatura da Empresa
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Acompanhe a vigência do seu plano ANT, status financeiro, renovações automáticas e faturamento via Mercado Pago.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              refreshSubscription();
              loadRecentPayments();
            }}
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-600 dark:text-slate-400 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Atualizar Status</span>
          </button>
        </div>
      </div>

      {/* Alerta de Regularização se estiver Bloqueado/Inadimplente */}
      {summary?.isBlocked && (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs sm:text-sm font-bold">
                Acesso aos módulos operacionais suspenso para regularização
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Sua assinatura encontra-se com pendência de pagamento ou expirada. Regularize via PIX ou Cartão de Crédito para reativar seu acesso imediato.
              </p>
            </div>
          </div>

          <button
            onClick={() => handleOpenCheckout(currentPlan)}
            className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Pagar Agora com Mercado Pago</span>
          </button>
        </div>
      )}

      {/* Card Principal de Visão Geral da Assinatura */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel do Plano Atual */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Plano Contratado
                </span>
                {currentPlan.badge && (
                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300">
                    {currentPlan.badge}
                  </span>
                )}
              </div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                Plano {currentPlan.name}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">{currentPlan.tagline}</p>
            </div>

            <div>{renderStatusBadge(summary?.subscription?.status)}</div>
          </div>

          {/* Grid de Informações de Faturamento */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Valor do Plano</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {currentPlan.priceFormatted}
              </span>
              <span className="text-[10px] text-slate-400 block">/mês</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Próximo Vencimento</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {summary?.formattedNextBillingDate || summary?.formattedExpirationDate || '—'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {summary?.isTrial ? `${summary.daysRemaining} dias de teste` : 'Renovação'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Último Pagamento</span>
              <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                {subscription?.last_payment_amount
                  ? `R$ ${subscription.last_payment_amount.toFixed(2).replace('.', ',')}`
                  : 'Nenhum'}
              </span>
              <span className="text-[10px] text-slate-400 block">
                {summary?.formattedLastPaymentDate || '—'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 font-semibold block">Gateway</span>
              <span className="text-base font-bold text-sky-600 dark:text-sky-400 flex items-center gap-1">
                <span>Mercado Pago</span>
              </span>
              <span className="text-[10px] text-slate-400 block">PIX, Cartão & Boleto</span>
            </div>
          </div>

          {/* Botões de Ação do Cliente */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            {/* 1. Pagar Agora */}
            <button
              onClick={() => handleOpenCheckout(currentPlan)}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-200 transition-all cursor-pointer flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              <span>Pagar Agora</span>
            </button>

            {/* 2. Renovar Assinatura */}
            <button
              onClick={() => handleOpenCheckout(currentPlan)}
              className="px-4 py-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Renovar Assinatura</span>
            </button>

            {/* 3. Alterar Plano */}
            <button
              onClick={() => {
                if (onChangePlanClick) onChangePlanClick();
                else if (onNavigate) onNavigate('planos');
              }}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Alterar Plano</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>

            {/* 4. Histórico de Cobranças */}
            {onOpenPaymentsHistory && (
              <button
                onClick={onOpenPaymentsHistory}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Histórico de Cobranças</span>
              </button>
            )}
          </div>
        </div>

        {/* Recursos Inclusos no Plano Atual */}
        <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <ShieldCheck className="w-5 h-5 text-purple-600" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Recursos Ativos no seu Plano
            </h4>
          </div>

          <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
            {currentPlan.features.map((feature, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="p-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400 shrink-0 mt-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Histórico Recente de Pagamentos */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Receipt className="w-4 h-4 text-purple-600" />
              Histórico Recente de Cobranças
            </h3>
            <p className="text-xs text-slate-400">
              Todas as transações registradas via Mercado Pago para esta empresa.
            </p>
          </div>

          {onOpenPaymentsHistory && (
            <button
              onClick={onOpenPaymentsHistory}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Ver todos</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {isLoadingPayments ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Carregando cobranças...
          </div>
        ) : recentPayments.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <p className="text-xs text-slate-400">
              Nenhuma cobrança registrada até o momento. Seu período de testes de 30 dias está em vigor.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentPayments.map((pay) => (
              <div
                key={pay.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-slate-100">
                      R$ {pay.amount.toFixed(2).replace('.', ',')} •{' '}
                      {pay.payment_method === 'pix'
                        ? 'PIX'
                        : pay.payment_method === 'credit_card'
                        ? 'Cartão de Crédito'
                        : 'Boleto Bancário'}
                    </div>
                    <div className="text-[11px] text-slate-400">
                      Ref MP: <span className="font-mono">{pay.mp_payment_id || '—'}</span> • Data:{' '}
                      {new Date(pay.created_at).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      pay.status === 'pago'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : pay.status === 'pendente'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : pay.status === 'vencido'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {pay.status === 'pago'
                      ? 'Pago'
                      : pay.status === 'pendente'
                      ? 'Pendente'
                      : pay.status === 'vencido'
                      ? 'Vencido'
                      : 'Cancelado'}
                  </span>

                  {pay.status === 'pendente' && (
                    <button
                      onClick={() => handleOpenCheckout(currentPlan)}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-bold transition-all cursor-pointer"
                    >
                      Pagar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Checkout Mercado Pago */}
      <MercadoPagoCheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        selectedPlan={selectedPlanForCheckout}
        onSuccess={() => {
          refreshSubscription();
          loadRecentPayments();
        }}
      />
    </div>
  );
};
