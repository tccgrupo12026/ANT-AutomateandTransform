import React, { useState, useEffect } from 'react';
import {
  Building2,
  Users,
  TrendingUp,
  DollarSign,
  Crown,
  Clock,
  AlertTriangle,
  ShieldCheck,
  ArrowUpRight,
  Sparkles,
  RefreshCw,
  EyeOff,
  Briefcase,
  Layers,
  ChevronRight,
  CheckCircle2,
} from 'lucide-react';
import { calculateAdminMetrics } from '../../services/adminService';
import { AdminMetrics, AdminCompanyItem, AdminSubscriptionOverview } from '../../types/admin';
import { ANT_PLANS, SubscriptionStatus, PlanId } from '../../types/subscription';
import { NavigationSection } from '../../types';

interface AdminDashboardViewProps {
  onNavigate: (section: NavigationSection) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [recentCompanies, setRecentCompanies] = useState<AdminCompanyItem[]>([]);
  const [overview, setOverview] = useState<AdminSubscriptionOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await calculateAdminMetrics();
      setMetrics(res.metrics);
      setRecentCompanies(res.companies.slice(0, 5));
      setOverview(res.overview);
    } catch (err) {
      console.warn('Erro ao carregar métricas administrativas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val);
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: SubscriptionStatus) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Ativo
          </span>
        );
      case 'trial':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800">
            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
            Trial
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            Expirado
          </span>
        );
      case 'suspended':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Suspenso
          </span>
        );
    }
  };

  const getPlanBadge = (planId: PlanId) => {
    switch (planId) {
      case 'enterprise':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/60 dark:text-amber-300">
            Enterprise
          </span>
        );
      case 'business':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
            Business
          </span>
        );
      case 'starter':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300">
            Starter
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-400/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Painel Admin ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">
              Gestão Global da Plataforma SaaS
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard dos Criadores ANT
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
            Acompanhe a saúde do negócio SaaS, evolução da base de clientes, receita recorrente (MRR) e métricas operacionais da plataforma.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition-all border border-white/10"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar Métricas
          </button>
          <button
            onClick={() => onNavigate('admin_companies')}
            className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white transition-all shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5" />
            Gerenciar Empresas
          </button>
        </div>
      </div>

      {/* LGPD & Privacy Notice Banner */}
      <div className="flex items-center gap-3 p-3.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
        <EyeOff className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
        <div>
          <span className="font-bold text-slate-900 dark:text-slate-200">Isolamento & Privacidade LGPD Ativa: </span>
          O painel dos criadores visualiza estritamente indicadores agregados de SaaS e metadados cadastrais. Produtos, estoque, movimentações e fluxo financeiro das empresas clientes são 100% privados e inacessíveis.
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Empresas */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Empresas Cadastradas
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics?.totalCompanies || 0}
            </div>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-slate-500">
              <span className="font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" />
                +{metrics?.newClientsLast30Days || 0} nos últimos 30d
              </span>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>{metrics?.activeCompanies || 0} ativas</span>
            <span>•</span>
            <span>{metrics?.trialCompanies || 0} trial</span>
            <span>•</span>
            <span>{metrics?.expiredCompanies || 0} expiradas</span>
          </div>
        </div>

        {/* Card 2: MRR Estimado */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              MRR Estimado (Mensal)
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {formatCurrency(metrics?.estimatedMRR || 0)}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span>Projeção ARR anual: </span>
              <strong className="text-slate-700 dark:text-slate-300 font-bold">
                {formatCurrency(overview?.arr || 0)}
              </strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Ticket Médio (ARPU):</span>
            <strong className="text-slate-700 dark:text-slate-300 font-bold">
              {formatCurrency(overview?.arpu || 0)}/mês
            </strong>
          </div>
        </div>

        {/* Card 3: Usuários Totais */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Total de Usuários
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              {metrics?.totalUsers || 0}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span>Média de usuários por empresa: </span>
              <strong className="text-slate-700 dark:text-slate-300 font-bold">
                {metrics?.totalCompanies
                  ? (metrics.totalUsers / metrics.totalCompanies).toFixed(1)
                  : '1.0'}
              </strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Proprietários e colaboradores</span>
            <span className="font-semibold text-purple-600">Base Ativa</span>
          </div>
        </div>

        {/* Card 4: Conversão de Trial */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Conversão de Trial
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400 tracking-tight">
              {metrics?.trialConversionRate || 0}%
            </div>
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-500">
              <span>Crescimento mensal: </span>
              <strong className="text-emerald-600 font-bold">
                +{metrics?.monthlyGrowthRate || 0}%
              </strong>
            </div>
          </div>
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
            <span>Taxa de Churn:</span>
            <strong className="text-slate-700 dark:text-slate-300 font-bold">
              {overview?.churnRate || 0}%
            </strong>
          </div>
        </div>
      </div>

      {/* Plan Breakdown & SaaS Indicators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Plan Breakdown Cards */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Crown className="w-4 h-4 text-purple-600" />
                Distribuição de Clientes por Plano
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Quantidade de empresas e faturamento mensal estimado por categoria.
              </p>
            </div>
            <button
              onClick={() => onNavigate('admin_subscriptions')}
              className="cursor-pointer text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
            >
              Ver Detalhes <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Starter */}
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/30 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Starter
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  R$ 49,90/mês
                </span>
              </div>
              <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                {metrics?.starterClients || 0}
                <span className="text-xs font-medium text-slate-500 ml-1">empresas</span>
              </div>
              <div className="text-xs text-slate-500">
                Receita Estimada:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(metrics?.revenueByPlan.starter || 0)}
                </strong>
              </div>
            </div>

            {/* Business */}
            <div className="p-4 rounded-xl border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  Business
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                  R$ 99,90/mês
                </span>
              </div>
              <div className="text-2xl font-extrabold text-purple-700 dark:text-purple-300">
                {metrics?.businessClients || 0}
                <span className="text-xs font-medium text-slate-500 ml-1">empresas</span>
              </div>
              <div className="text-xs text-slate-500">
                Receita Estimada:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(metrics?.revenueByPlan.business || 0)}
                </strong>
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/30 dark:bg-amber-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
                  Enterprise
                </span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
                  R$ 199,90/mês
                </span>
              </div>
              <div className="text-2xl font-extrabold text-amber-700 dark:text-amber-300">
                {metrics?.enterpriseClients || 0}
                <span className="text-xs font-medium text-slate-500 ml-1">empresas</span>
              </div>
              <div className="text-xs text-slate-500">
                Receita Estimada:{' '}
                <strong className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {formatCurrency(metrics?.revenueByPlan.enterprise || 0)}
                </strong>
              </div>
            </div>
          </div>

          {/* Revenue Distribution Bar */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                Proporção da Receita por Plano:
              </span>
              <span className="font-bold text-emerald-600">
                Total: {formatCurrency(metrics?.estimatedMRR || 0)}/mês
              </span>
            </div>

            {metrics?.estimatedMRR && metrics.estimatedMRR > 0 ? (
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
                <div
                  className="bg-slate-400 h-full transition-all"
                  style={{
                    width: `${((metrics.revenueByPlan.starter / metrics.estimatedMRR) * 100).toFixed(1)}%`,
                  }}
                  title={`Starter: ${formatCurrency(metrics.revenueByPlan.starter)}`}
                />
                <div
                  className="bg-purple-600 h-full transition-all"
                  style={{
                    width: `${((metrics.revenueByPlan.business / metrics.estimatedMRR) * 100).toFixed(1)}%`,
                  }}
                  title={`Business: ${formatCurrency(metrics.revenueByPlan.business)}`}
                />
                <div
                  className="bg-amber-500 h-full transition-all"
                  style={{
                    width: `${((metrics.revenueByPlan.enterprise / metrics.estimatedMRR) * 100).toFixed(1)}%`,
                  }}
                  title={`Enterprise: ${formatCurrency(metrics.revenueByPlan.enterprise)}`}
                />
              </div>
            ) : (
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                <span className="text-[10px] font-medium text-slate-400">Nenhuma assinatura paga ativa no momento</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
                <span>Starter</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-purple-600" />
                <span>Business</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span>Enterprise</span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Platform Status & Operations */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-600" />
            Status Operacional da Plataforma
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Banco de Dados PostgreSQL
                  </div>
                  <div className="text-[10px] text-slate-500">Supabase RLS Ativo & Seguro</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">100% OK</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/50">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Serviço de E-mail (Resend)
                  </div>
                  <div className="text-[10px] text-slate-500">Envio de Convites Operacional</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-purple-700 dark:text-purple-300">Ativo</span>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-500 shrink-0" />
                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Trial Padrão de Novos Cadastros
                  </div>
                  <div className="text-[10px] text-slate-500">30 dias gratuitos com acesso total</div>
                </div>
              </div>
              <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300">30 Dias</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onNavigate('admin_platform')}
              className="cursor-pointer w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 text-xs font-bold text-slate-700 dark:text-slate-300 transition-colors"
            >
              Ver Configurações da Plataforma
            </button>
          </div>
        </div>
      </div>

      {/* Recent Companies Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              Empresas Cadastradas Recentemente
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Exibindo as últimas empresas registradas na plataforma ANT.
            </p>
          </div>
          <button
            onClick={() => onNavigate('admin_companies')}
            className="cursor-pointer text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1"
          >
            Ver Todas ({metrics?.totalCompanies || 0}) <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Nome da Empresa</th>
                <th className="py-3 px-4">Data de Cadastro</th>
                <th className="py-3 px-4">Plano Atual</th>
                <th className="py-3 px-4">Status da Assinatura</th>
                <th className="py-3 px-4 text-center">Usuários</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
              {recentCompanies.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Nenhuma empresa cadastrada no momento.
                  </td>
                </tr>
              ) : (
                recentCompanies.map((comp) => (
                  <tr
                    key={comp.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {comp.company_name}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">
                        {comp.responsible_name} {comp.email ? `• ${comp.email}` : ''}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                      {formatDate(comp.created_at)}
                    </td>
                    <td className="py-3.5 px-4">{getPlanBadge(comp.plan_id)}</td>
                    <td className="py-3.5 px-4">{getStatusBadge(comp.subscription_status)}</td>
                    <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                      {comp.users_count}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => onNavigate('admin_companies')}
                        className="cursor-pointer text-xs font-semibold text-purple-600 hover:text-purple-700"
                      >
                        Gerenciar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
