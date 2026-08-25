import React, { useState } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  Clock,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Building2,
  Users,
  Package,
  DollarSign,
  Activity,
  ArrowRight,
  RotateCcw,
  CheckCircle2,
  Zap,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { AntLogo } from '../common/AntLogo';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { ANT_PLANS, PlanId, SubscriptionStatus, BillingCycle } from '../../types';

export const PlansView: React.FC = () => {
  const {
    subscription,
    summary,
    isLoading,
    isSaving,
    changePlan,
    activateSubscription,
    updateStatus,
    resetTrial,
  } = useSubscription();

  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [selectedCycle, setSelectedCycle] = useState<BillingCycle>('monthly');

  const showFeedback = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMessage({ text, type });
    setTimeout(() => {
      setFeedbackMessage(null);
    }, 4000);
  };

  const handleSelectPlan = async (planId: PlanId) => {
    if (subscription?.plan_id === planId) {
      showFeedback(`Você já está no plano ${ANT_PLANS[planId].name}.`, 'success');
      return;
    }
    const success = await changePlan(planId);
    if (success) {
      showFeedback(`Plano alterado com sucesso para ${ANT_PLANS[planId].name}!`, 'success');
    } else {
      showFeedback('Não foi possível alterar o plano. Tente novamente.', 'error');
    }
  };

  const handleActivateSubscription = async (planId: PlanId) => {
    const success = await activateSubscription(planId, selectedCycle);
    if (success) {
      showFeedback(`Assinatura ativada com sucesso no plano ${ANT_PLANS[planId].name}!`, 'success');
    } else {
      showFeedback('Não foi possível ativar a assinatura. Tente novamente.', 'error');
    }
  };

  const handleSimulateStatus = async (status: SubscriptionStatus) => {
    const success = await updateStatus(status);
    if (success) {
      showFeedback(`Status da assinatura alterado para: "${status.toUpperCase()}".`, 'success');
    } else {
      showFeedback('Erro ao atualizar status.', 'error');
    }
  };

  const handleResetTrial = async () => {
    const success = await resetTrial();
    if (success) {
      showFeedback('Período de teste de 30 dias reiniciado com sucesso!', 'success');
    } else {
      showFeedback('Erro ao reiniciar trial.', 'error');
    }
  };

  if (isLoading || !summary) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-purple-600 border-t-transparent animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Carregando planos e assinatura...</span>
      </div>
    );
  }

  const {
    subscription: currentSub,
    plan: currentPlan,
    daysRemaining,
    isTrial,
    isActive,
    isExpired,
    isSuspended,
    formattedExpirationDate,
    formattedStartDate,
  } = summary;

  // Status visual badge helper
  const getStatusBadge = () => {
    if (isTrial) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200 dark:border-purple-800">
          <Clock className="w-3.5 h-3.5" />
          Trial ({daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'} restantes)
        </span>
      );
    }
    if (isActive) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200 dark:border-emerald-800">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Assinatura Ativa
        </span>
      );
    }
    if (isExpired) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300 text-xs font-bold border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5" />
          Expirado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="w-3.5 h-3.5" />
        Suspenso
      </span>
    );
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Toast Feedback */}
      {feedbackMessage && (
        <div
          className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border text-sm font-semibold flex items-center gap-2.5 transition-all ${
            feedbackMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-200'
              : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950 dark:border-rose-800 dark:text-rose-200'
          }`}
        >
          {feedbackMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
          )}
          <span>{feedbackMessage.text}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Crown className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Planos e Assinatura
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Escolha o plano ideal para impulsionar a gestão da sua microempresa com previsibilidade e controle.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 uppercase font-bold tracking-wider">Status Atual</div>
            <div className="mt-0.5">{getStatusBadge()}</div>
          </div>
        </div>
      </div>

      {/* Current Subscription Card Summary */}
      <Card id="current-subscription-summary-card" accent="purple">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          <div className="md:col-span-4 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-800 pb-4 md:pb-0 md:pr-6">
            <div className="text-[11px] uppercase font-bold text-slate-400 dark:text-slate-500 tracking-wider">
              Seu Plano Vigente
            </div>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Plano {currentPlan.name}
              </span>
              <span className="text-xs text-purple-600 dark:text-purple-400 font-bold">
                {currentPlan.priceFormatted}/mês
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {currentPlan.tagline}
            </p>
          </div>

          <div className="md:col-span-5 grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">Data de Início</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {formattedStartDate}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                {isTrial ? 'Expiração Trial' : 'Renovação'}
              </div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {formattedExpirationDate}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-800 col-span-2 sm:col-span-1">
              <div className="text-[10px] uppercase font-bold text-slate-400">Dias Restantes</div>
              <div className={`text-xs font-black mt-0.5 ${daysRemaining <= 5 ? 'text-rose-600' : 'text-purple-600 dark:text-purple-400'}`}>
                {daysRemaining} dias
              </div>
            </div>
          </div>

          <div className="md:col-span-3 flex flex-col justify-center gap-2">
            {isTrial && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] font-semibold text-slate-500">
                  <span>Progresso do Trial</span>
                  <span>{Math.min(100, Math.round(((30 - daysRemaining) / 30) * 100))}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 to-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.max(5, Math.min(100, ((30 - daysRemaining) / 30) * 100))}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>Garantia de 30 dias grátis sem cartão</span>
            </div>
          </div>

        </div>
      </Card>

      {/* Plans Pricing Grid */}
      <div>
        <div className="text-center max-w-2xl mx-auto mb-8 space-y-2">
          <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            Planos sob medida para o tamanho da sua empresa
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Todos os novos cadastros iniciam com 30 dias gratuitos para teste completo de todas as ferramentas.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          {/* 1. PLANO STARTER */}
          <div
            id="plan-starter-card"
            className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all ${
              currentSub.plan_id === 'starter'
                ? 'bg-white dark:bg-slate-900 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {ANT_PLANS.starter.name}
                </h4>
                {currentSub.plan_id === 'starter' && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Plano Atual
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px]">
                {ANT_PLANS.starter.tagline}
              </p>

              {/* Price */}
              <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                    {ANT_PLANS.starter.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{ANT_PLANS.starter.period}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Cobrança mensal simplificada</div>
              </div>

              {/* Core Limits Badges */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Building2 className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">1 Empresa</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Users className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">2 Usuários</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Package className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">200 Produtos</span>
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-8">
                {ANT_PLANS.starter.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSelectPlan('starter')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentSub.plan_id === 'starter'
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-slate-900 dark:bg-slate-100 hover:bg-purple-700 dark:hover:bg-purple-300 text-white dark:text-slate-900 shadow-xs'
                }`}
              >
                {currentSub.plan_id === 'starter' ? 'Plano Selecionado' : 'Mudar para Starter'}
              </button>

              {isTrial && currentSub.plan_id === 'starter' && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleActivateSubscription('starter')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800/60 transition-colors cursor-pointer"
                >
                  Simular Ativação (Tornar Ativo)
                </button>
              )}
            </div>
          </div>

          {/* 2. PLANO BUSINESS (DESTACADO) */}
          <div
            id="plan-business-card"
            className="rounded-3xl p-6 sm:p-7 flex flex-col justify-between border-2 border-purple-600 bg-gradient-to-b from-purple-50/50 via-white to-purple-50/20 dark:from-purple-950/40 dark:via-slate-900 dark:to-slate-900 shadow-xl relative scale-100 lg:-translate-y-2"
          >
            {/* Top Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-purple-600 text-white text-[11px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Mais Escolhido</span>
            </div>

            <div>
              <div className="flex items-center justify-between gap-2 mb-3 mt-1">
                <h4 className="text-lg font-black text-purple-900 dark:text-purple-200">
                  {ANT_PLANS.business.name}
                </h4>
                {currentSub.plan_id === 'business' && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-purple-600 text-white">
                    Plano Atual
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 min-h-[36px]">
                {ANT_PLANS.business.tagline}
              </p>

              {/* Price */}
              <div className="my-6 pb-6 border-b border-purple-100 dark:border-purple-900/50">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-purple-700 dark:text-purple-300">
                    {ANT_PLANS.business.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{ANT_PLANS.business.period}</span>
                </div>
                <div className="text-[11px] text-purple-700 dark:text-purple-400 font-medium mt-1">
                  Melhor custo-benefício para microempresas
                </div>
              </div>

              {/* Core Limits Badges */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-2 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 text-center">
                  <Building2 className="w-3.5 h-3.5 mx-auto text-purple-700 dark:text-purple-300 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-900 dark:text-slate-100">1 Empresa</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 text-center">
                  <Users className="w-3.5 h-3.5 mx-auto text-purple-700 dark:text-purple-300 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-900 dark:text-slate-100">5 Usuários</span>
                </div>
                <div className="p-2 rounded-xl bg-purple-100/70 dark:bg-purple-900/40 border border-purple-200 dark:border-purple-800 text-center">
                  <Package className="w-3.5 h-3.5 mx-auto text-purple-700 dark:text-purple-300 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-900 dark:text-slate-100">2.000 Itens</span>
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200 mb-8">
                {ANT_PLANS.business.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 font-medium">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t border-purple-100 dark:border-purple-900/50">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSelectPlan('business')}
                className="w-full py-3 px-4 rounded-xl text-xs font-black bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white shadow-md shadow-purple-200 dark:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>{currentSub.plan_id === 'business' ? 'Plano Selecionado' : 'Fazer Upgrade para Business'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              {isTrial && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleActivateSubscription('business')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 border border-purple-300 dark:border-purple-800 transition-colors cursor-pointer"
                >
                  Simular Ativação (Business)
                </button>
              )}
            </div>
          </div>

          {/* 3. PLANO ENTERPRISE */}
          <div
            id="plan-enterprise-card"
            className={`rounded-3xl p-6 sm:p-7 flex flex-col justify-between border transition-all ${
              currentSub.plan_id === 'enterprise'
                ? 'bg-white dark:bg-slate-900 border-purple-500 shadow-md ring-2 ring-purple-500/20'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 shadow-xs'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-3">
                <h4 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  {ANT_PLANS.enterprise.name}
                </h4>
                {currentSub.plan_id === 'enterprise' && (
                  <span className="text-[10px] uppercase tracking-wider font-extrabold px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                    Plano Atual
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 dark:text-slate-400 min-h-[36px]">
                {ANT_PLANS.enterprise.tagline}
              </p>

              {/* Price */}
              <div className="my-6 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-slate-100">
                    {ANT_PLANS.enterprise.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{ANT_PLANS.enterprise.period}</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Sem limites operacionais</div>
              </div>

              {/* Core Limits Badges */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Building2 className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Ilimitadas</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Users className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Ilimitados</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Package className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Ilimitados</span>
                </div>
              </div>

              {/* Feature List */}
              <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300 mb-8">
                {ANT_PLANS.enterprise.features.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSelectPlan('enterprise')}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  currentSub.plan_id === 'enterprise'
                    ? 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : 'bg-slate-900 dark:bg-slate-100 hover:bg-purple-700 dark:hover:bg-purple-300 text-white dark:text-slate-900 shadow-xs'
                }`}
              >
                {currentSub.plan_id === 'enterprise' ? 'Plano Selecionado' : 'Mudar para Enterprise'}
              </button>

              {isTrial && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => handleActivateSubscription('enterprise')}
                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold text-purple-800 dark:text-purple-300 bg-purple-100 dark:bg-purple-950/60 hover:bg-purple-200 border border-purple-300 dark:border-purple-800 transition-colors cursor-pointer"
                >
                  Simular Ativação (Enterprise)
                </button>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Comparison Feature Table */}
      <Card id="plans-comparison-table-card">
        <div className="mb-4">
          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
            Comparativo Detalhado de Recursos
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Visualize as capacidades técnicas e limites operacionais de cada nível de assinatura.
          </p>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <table className="w-full text-left text-xs border-collapse min-w-[500px]">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70">
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300">Recurso / Limite</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Starter (R$ 29,90)</th>
                <th className="py-3 px-4 font-bold text-purple-700 dark:text-purple-400 text-center bg-purple-50/50 dark:bg-purple-950/20">Business (R$ 59,90)</th>
                <th className="py-3 px-4 font-bold text-slate-700 dark:text-slate-300 text-center">Enterprise (R$ 149,90)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Empresas Gerenciadas</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">1 Empresa</td>
                <td className="py-3 px-4 text-center font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/10">1 Empresa</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Ilimitadas</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Usuários Simultâneos</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">Até 2</td>
                <td className="py-3 px-4 text-center font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/10">Até 5</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Ilimitados</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Limite de Produtos Cadastrados</td>
                <td className="py-3 px-4 text-center text-slate-600 dark:text-slate-400">Até 200</td>
                <td className="py-3 px-4 text-center font-semibold text-purple-700 dark:text-purple-300 bg-purple-50/30 dark:bg-purple-950/10">Até 2.000</td>
                <td className="py-3 px-4 text-center font-bold text-emerald-600 dark:text-emerald-400">Ilimitados</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Financeiro Completo (DRE/Categorias)</td>
                <td className="py-3 px-4 text-center text-slate-400">—</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-purple-50/30 dark:bg-purple-950/10">✓ Completo</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Completo</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Diagnóstico Saúde do Negócio</td>
                <td className="py-3 px-4 text-center text-slate-400">—</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold bg-purple-50/30 dark:bg-purple-950/10">✓ Incluído</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Incluído</td>
              </tr>
              <tr>
                <td className="py-3 px-4 font-medium text-slate-800 dark:text-slate-200">Recursos Avançados e API</td>
                <td className="py-3 px-4 text-center text-slate-400">—</td>
                <td className="py-3 px-4 text-center text-slate-400 bg-purple-50/30 dark:bg-purple-950/10">—</td>
                <td className="py-3 px-4 text-center text-emerald-600 font-bold">✓ Incluído</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Subscription Simulator Sandbox (As required: no payment gateways yet) */}
      <Card id="subscription-simulation-sandbox-card" className="border-dashed border-2 border-purple-200 dark:border-purple-800/80 bg-purple-50/30 dark:bg-purple-950/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-purple-900/50">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-600 text-white text-xs">
              <Zap className="w-4 h-4" />
            </span>
            <div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                Painel de Testes e Simulação de Assinatura
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Alterne os estados da assinatura para validar o comportamento do sistema sem gateways de pagamento reais.
              </p>
            </div>
          </div>

          <Badge variant="purple" size="sm">
            Modo Simulação SaaS
          </Badge>
        </div>

        <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={() => handleSimulateStatus('trial')}
            className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 hover:bg-purple-50 dark:hover:bg-purple-950/40 text-left transition-colors cursor-pointer"
          >
            <div className="text-[10px] uppercase font-bold text-purple-700 dark:text-purple-300">Simular</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Status: Trial</div>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateStatus('active')}
            className="p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition-colors cursor-pointer"
          >
            <div className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300">Simular</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Status: Ativo</div>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateStatus('expired')}
            className="p-2.5 rounded-xl border border-rose-200 dark:border-rose-800 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-colors cursor-pointer"
          >
            <div className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-300">Simular</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Status: Expirado</div>
          </button>

          <button
            type="button"
            onClick={() => handleSimulateStatus('suspended')}
            className="p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition-colors cursor-pointer"
          >
            <div className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">Simular</div>
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Status: Suspenso</div>
          </button>
        </div>

        <div className="mt-4 pt-3 border-t border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Deseja restaurar os 30 dias de trial a partir de hoje?
          </span>
          <button
            type="button"
            onClick={handleResetTrial}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-purple-700 dark:text-purple-300 hover:bg-purple-100/70 dark:hover:bg-purple-900/40 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reiniciar 30 dias de Trial</span>
          </button>
        </div>
      </Card>
    </div>
  );
};
