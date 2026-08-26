import React, { useState, useEffect } from 'react';
import {
  Crown,
  DollarSign,
  TrendingUp,
  CreditCard,
  Layers,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';
import { calculateAdminMetrics } from '../../services/adminService';
import { AdminMetrics, AdminSubscriptionOverview } from '../../types/admin';
import { ANT_PLANS } from '../../types/subscription';

export const AdminSubscriptionsView: React.FC = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [overview, setOverview] = useState<AdminSubscriptionOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await calculateAdminMetrics();
        setMetrics(res.metrics);
        setOverview(res.overview);
      } catch (err) {
        console.warn('Erro ao carregar dados de assinaturas:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
            Admin ANT
          </span>
          <span className="text-xs text-slate-400 font-medium">Gestão Financeira do SaaS</span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
          Assinaturas & Planos da Plataforma
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Estrutura de precificação, métricas financeiras recorrentes da plataforma SaaS e regras de planos para clientes.
        </p>
      </div>

      {/* Financial SaaS Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            MRR Atual (Mensal)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(overview?.mrr || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            Receita recorrente gerada por empresas ativas.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ARR Projetado (Anual)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-600 dark:text-purple-400">
            {formatCurrency(overview?.arr || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            Projeção anual de faturamento da plataforma ANT.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Ticket Médio (ARPU)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {formatCurrency(overview?.arpu || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            Receita média mensal por empresa pagante.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Assinantes Pagantes
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {overview?.activePaidCount || 0}
            <span className="text-xs font-medium text-slate-400 ml-1.5">empresas</span>
          </div>
          <p className="text-[11px] text-slate-500">
            +{overview?.trialCount || 0} em período de teste gratuito.
          </p>
        </div>
      </div>

      {/* Plans Comparison Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
        <div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-600" />
            Configuração dos Planos Comerciais ANT
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Grade oficial de produtos comercializados pela plataforma ANT para micro e pequenos negócios.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Starter Plan Card */}
          <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 dark:text-slate-100">
                {ANT_PLANS.starter.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                Microempresas
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {formatCurrency(ANT_PLANS.starter.priceMonthly)}
                <span className="text-xs font-medium text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{ANT_PLANS.starter.tagline}</p>
            </div>
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Até 100 produtos cadastrados</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Até 2 usuários por empresa</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Módulos de estoque e precificação</span>
              </div>
            </div>
            <div className="pt-2 text-xs text-slate-500 font-medium">
              Base atual: <strong>{metrics?.starterClients || 0} empresas</strong> (
              {formatCurrency(metrics?.revenueByPlan.starter || 0)}/mês)
            </div>
          </div>

          {/* Business Plan Card */}
          <div className="p-5 rounded-2xl border-2 border-purple-500 dark:border-purple-600 bg-purple-50/20 dark:bg-purple-950/20 space-y-4 relative">
            <div className="absolute -top-3 right-4">
              <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-purple-600 text-white shadow-xs">
                Mais Popular
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-purple-700 dark:text-purple-300">
                {ANT_PLANS.business.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                Crescimento
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                {formatCurrency(ANT_PLANS.business.priceMonthly)}
                <span className="text-xs font-medium text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{ANT_PLANS.business.tagline}</p>
            </div>
            <div className="pt-3 border-t border-purple-200 dark:border-purple-900/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Até 1.000 produtos cadastrados</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Até 5 usuários por empresa</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-purple-600 shrink-0" />
                <span>Relatórios avançados e DRE</span>
              </div>
            </div>
            <div className="pt-2 text-xs text-purple-700 dark:text-purple-300 font-medium">
              Base atual: <strong>{metrics?.businessClients || 0} empresas</strong> (
              {formatCurrency(metrics?.revenueByPlan.business || 0)}/mês)
            </div>
          </div>

          {/* Enterprise Plan Card */}
          <div className="p-5 rounded-2xl border border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-800 dark:text-amber-300">
                {ANT_PLANS.enterprise.name}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                Escala
              </span>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                {formatCurrency(ANT_PLANS.enterprise.priceMonthly)}
                <span className="text-xs font-medium text-slate-400">/mês</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">{ANT_PLANS.enterprise.tagline}</p>
            </div>
            <div className="pt-3 border-t border-amber-200 dark:border-amber-900/60 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Produtos e estoque ilimitados</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Usuários ilimitados na equipe</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Check className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Suporte prioritário via WhatsApp</span>
              </div>
            </div>
            <div className="pt-2 text-xs text-amber-800 dark:text-amber-300 font-medium">
              Base atual: <strong>{metrics?.enterpriseClients || 0} empresas</strong> (
              {formatCurrency(metrics?.revenueByPlan.enterprise || 0)}/mês)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
