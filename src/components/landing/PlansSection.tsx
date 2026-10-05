import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building2,
  Users,
  Package,
  Zap,
} from 'lucide-react';
import { getActivePlans } from '../../services/subscriptionService';
import { loadPlatformPlans } from '../../services/adminService';
import { PlanDetails, PlanId } from '../../types';

interface PlansSectionProps {
  onSignUpClick: () => void;
}

export const PlansSection: React.FC<PlansSectionProps> = ({ onSignUpClick }) => {
  const [plans, setPlans] = useState<Record<PlanId, PlanDetails>>(getActivePlans());

  useEffect(() => {
    let isMounted = true;

    // Carrega os planos sincronizados do banco de dados (platform_plans)
    const initPlans = async () => {
      try {
        await loadPlatformPlans();
        if (isMounted) {
          setPlans(getActivePlans());
        }
      } catch (err) {
        console.warn('Erro ao carregar planos remotos na landing page:', err);
      }
    };
    initPlans();

    const handlePlansUpdated = () => {
      if (isMounted) {
        setPlans(getActivePlans());
      }
    };

    window.addEventListener('ant_plans_updated', handlePlansUpdated);
    window.addEventListener('storage', handlePlansUpdated);
    return () => {
      isMounted = false;
      window.removeEventListener('ant_plans_updated', handlePlansUpdated);
      window.removeEventListener('storage', handlePlansUpdated);
    };
  }, []);

  return (
    <section id="planos" className="py-20 sm:py-28 bg-slate-50 dark:bg-slate-900/50 relative overflow-hidden">
      {/* Decorative gradient blur */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-7xl h-96 bg-purple-500/5 dark:bg-purple-600/10 blur-3xl pointer-events-none rounded-full" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-16">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-100 dark:bg-purple-950/80 border border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 text-xs font-bold shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Planos Transparentes & Acessíveis</span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight">
            Escolha o plano ideal para a sua microempresa
          </h2>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Comece hoje mesmo com <strong>30 dias de teste grátis</strong> em qualquer plano. Sem taxa de adesão, sem fidelidade e sem necessidade de cartão de crédito.
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Garantia de 30 dias grátis em todos os planos</span>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto items-stretch">
          {/* 1. Starter */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative group">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {plans.starter.name}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                  Plano Starter
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[34px]">
                  {plans.starter.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                    {plans.starter.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{plans.starter.period}</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>30 dias grátis para testar</span>
                </div>
              </div>

              {/* Core Limits */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Building2 className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">1 Empresa</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Users className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {plans.starter.maxUsers === 'unlimited' ? 'Ilimitado' : `${plans.starter.maxUsers} Usuários`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Package className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {plans.starter.maxProducts === 'unlimited' ? 'Ilimitado' : `${plans.starter.maxProducts} Produtos`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Benefícios inclusos:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {plans.starter.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={onSignUpClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-purple-700 dark:bg-slate-800 dark:hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Começar 30 Dias Grátis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Business (Destaque Mais Escolhido) */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border-2 border-purple-600 dark:border-purple-500 shadow-2xl relative flex flex-col justify-between transform md:-translate-y-3">
            {/* Badge Mais Escolhido */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-extrabold px-4 py-1 rounded-full shadow-md flex items-center gap-1.5 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mais Escolhido</span>
            </div>

            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 uppercase tracking-wider">
                  {plans.business.name}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                  Plano Business
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[34px]">
                  {plans.business.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-purple-700 dark:text-purple-400">
                    {plans.business.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{plans.business.period}</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>30 dias grátis para testar</span>
                </div>
              </div>

              {/* Core Limits */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 text-center">
                  <Building2 className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">1 Empresa</span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 text-center">
                  <Users className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {plans.business.maxUsers === 'unlimited' ? 'Ilimitado' : `Até ${plans.business.maxUsers} Usuários`}
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/80 text-center">
                  <Package className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">
                    {plans.business.maxProducts === 'unlimited' ? 'Ilimitado' : `${plans.business.maxProducts} Produtos`}
                  </span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
                  Tudo do Starter, mais:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-200">
                  {plans.business.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 font-medium">
                      <Check className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={onSignUpClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-lg shadow-purple-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer transform hover:-translate-y-0.5"
              >
                <span>Experimentar 30 Dias Grátis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Enterprise */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-md hover:shadow-xl transition-all flex flex-col justify-between relative group">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  {plans.enterprise.name}
                </span>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white mt-3">
                  Plano Enterprise
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 min-h-[34px]">
                  {plans.enterprise.tagline}
                </p>
              </div>

              {/* Price */}
              <div className="pb-6 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white">
                    {plans.enterprise.priceFormatted}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">{plans.enterprise.period}</span>
                </div>
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>30 dias grátis para testar</span>
                </div>
              </div>

              {/* Core Limits */}
              <div className="grid grid-cols-3 gap-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Building2 className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Ilimitado</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Users className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Ilimitado</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center">
                  <Package className="w-3.5 h-3.5 mx-auto text-purple-600 mb-0.5" />
                  <span className="block text-[11px] font-bold text-slate-800 dark:text-slate-200">Ilimitado</span>
                </div>
              </div>

              {/* Features List */}
              <div className="space-y-3 pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Benefícios avançados:
                </span>
                <ul className="space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                  {plans.enterprise.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="pt-8">
              <button
                type="button"
                onClick={onSignUpClick}
                className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-purple-700 dark:bg-slate-800 dark:hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Começar 30 Dias Grátis</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Guarantee */}
        <div className="text-center pt-6 text-xs text-slate-500 max-w-xl mx-auto space-y-1">
          <p>
            🛡️ <strong>Garantia de Satisfação:</strong> Cancele a qualquer momento durante os 30 dias de teste sem qualquer cobrança.
          </p>
          <p className="text-[11px] text-slate-400">
            Dúvidas sobre o plano ideal para seu comércio? Entre em contato pelo e-mail de suporte.
          </p>
        </div>
      </div>
    </section>
  );
};
