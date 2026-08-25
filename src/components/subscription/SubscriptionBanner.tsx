import React from 'react';
import { Sparkles, Clock, AlertTriangle, AlertCircle, ShieldCheck, ArrowRight } from 'lucide-react';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { NavigationSection } from '../../types';

interface SubscriptionBannerProps {
  onNavigateToPlans: () => void;
}

export const SubscriptionBanner: React.FC<SubscriptionBannerProps> = ({ onNavigateToPlans }) => {
  const { summary, isLoading } = useSubscription();

  if (isLoading || !summary) return null;

  const { subscription, plan, daysRemaining, isTrial, isActive, isExpired, isSuspended } = summary;

  // Se o plano está ativo normalmente e não está expirado, podemos exibir um aviso bem discreto ou nada
  if (isActive && !isExpired) {
    return null;
  }

  // 1. Estado: Trial Expirado
  if (isExpired) {
    return (
      <div
        id="subscription-expired-banner"
        className="mb-6 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-900 dark:text-rose-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-300 shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>Seu período de teste ou assinatura expirou</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
                Expirado
              </span>
            </div>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              Escolha um dos planos ANT (Starter, Business ou Enterprise) para continuar gerindo sua microempresa com total autonomia.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToPlans}
          className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Escolher Plano</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 2. Estado: Suspenso
  if (isSuspended) {
    return (
      <div
        id="subscription-suspended-banner"
        className="mb-6 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-4 sm:p-4.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900 dark:text-amber-200"
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300 shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs sm:text-sm font-bold flex items-center gap-2">
              <span>Assinatura Suspensa</span>
              <span className="text-[10px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                Aguardando Renovação
              </span>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Regularize sua assinatura para manter todos os relatórios e limites de produtos ativos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onNavigateToPlans}
          className="w-full sm:w-auto shrink-0 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
        >
          <span>Renovar Assinatura</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  // 3. Estado: Trial Ativo (Contador de dias restantes)
  return (
    <div
      id="subscription-trial-banner"
      className="mb-6 rounded-2xl bg-gradient-to-r from-purple-50 via-white to-emerald-50/60 dark:from-purple-950/40 dark:via-slate-900 dark:to-emerald-950/30 border border-purple-200/70 dark:border-purple-800/60 p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-purple-600 text-white shadow-xs shrink-0">
          <Clock className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
              Período de Testes Gratuito:
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300 text-xs font-extrabold">
              {daysRemaining} {daysRemaining === 1 ? 'dia restante' : 'dias restantes'}
            </span>
            <span className="hidden sm:inline-block text-[11px] text-slate-500 dark:text-slate-400">
              • Plano {plan.name}
            </span>
          </div>
          <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Você tem 30 dias grátis para explorar todos os recursos de estoque, finanças e saúde do negócio sem compromisso.
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onNavigateToPlans}
        className="w-full sm:w-auto shrink-0 px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all hover:scale-[1.01] cursor-pointer"
      >
        <span>Ver Planos</span>
        <ArrowRight className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
