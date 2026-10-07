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
  PlusCircle,
  Pause,
  Play,
} from 'lucide-react';
import {
  calculateAdminMetrics,
  extendCompanyTrial,
} from '../../services/adminService';
import { AdminMetrics, AdminCompanyItem, AdminSubscriptionOverview } from '../../types/admin';
import { NavigationSection } from '../../types';

interface AdminDashboardViewProps {
  onNavigate: (section: NavigationSection) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [companies, setCompanies] = useState<AdminCompanyItem[]>([]);
  const [overview, setOverview] = useState<AdminSubscriptionOverview | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [quickExtendId, setQuickExtendId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await calculateAdminMetrics();
      setMetrics(res.metrics);
      setCompanies(res.companies);
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

  const showToast = (text: string) => {
    setToastMessage(text);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleQuickExtend = async (companyId: string, companyName: string) => {
    setQuickExtendId(companyId);
    try {
      const res = await extendCompanyTrial(companyId, 15);
      if (res.success) {
        showToast(`Trial de "${companyName}" prorrogado em +15 dias com sucesso!`);
        await loadData();
      }
    } finally {
      setQuickExtendId(null);
    }
  };

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

  // Empresas com trial perto de vencer (<= 3 dias)
  const expiringTrials = companies.filter(
    (c) => c.subscription_status === 'trial' && c.days_remaining <= 3
  );

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800 flex items-center gap-2 text-xs font-bold animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Painel Admin ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">Controle Executivo SaaS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Executivo da Plataforma
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Visão consolidada de empresas, crescimento de novos clientes, usuários cadastrados e receita recorrente projetada.
          </p>
        </div>
        <button
          onClick={loadData}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer self-start"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Atualizar Dados</span>
        </button>
      </div>

      {/* Indicadores Executivos em Destaque */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total de Empresas */}
        <button
          type="button"
          onClick={() => onNavigate('admin_companies')}
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-left cursor-pointer hover:border-purple-300 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Empresas</span>
            <Building2 className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics?.totalCompanies || 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-400 font-bold mt-1">
            <span>Ver empresas</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        {/* Total de Usuários */}
        <button
          type="button"
          onClick={() => onNavigate('admin_users')}
          className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs text-left cursor-pointer hover:border-purple-300 transition-all group"
        >
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Total Usuários</span>
            <Users className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1.5">
            {metrics?.totalUsers || 0}
          </div>
          <div className="flex items-center gap-1 text-[11px] text-purple-700 dark:text-purple-400 font-bold mt-1">
            <span>Gerenciar acessos</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </button>

        {/* Empresas Ativas */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Empresas Ativas</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics?.activeCompanies || 0}
          </div>
          <p className="text-[11px] text-slate-500">Operando regularmente</p>
        </div>

        {/* Empresas em Trial */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Empresas Trial</span>
            <Clock className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
            {metrics?.trialCompanies || 0}
          </div>
          <p className="text-[11px] text-slate-500">Período de avaliação</p>
        </div>

        {/* Empresas Suspensas */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Empresas Suspensas</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
            {metrics?.suspendedCompanies || 0}
          </div>
          <p className="text-[11px] text-slate-500">Bloqueio administrativo</p>
        </div>

        {/* Novas Empresas nos Últimos 30 Dias */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Novas (Últimos 30d)</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
            {metrics?.newClientsLast30Days || 0}
          </div>
          <p className="text-[11px] text-slate-500">Novos cadastros no mês</p>
        </div>

        {/* Crescimento Mensal */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>Crescimento Mensal</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            +{metrics?.monthlyGrowthRate || 0}%
          </div>
          <p className="text-[11px] text-slate-500">Novos vs base anterior</p>
        </div>

        {/* MRR Estimado */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>MRR Projetado</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(metrics?.estimatedMRR || 0)}
          </div>
          <p className="text-[11px] text-slate-500">Receita mensal recorrente</p>
        </div>

        {/* Total de NF-e Importadas (Fase 4 / TCC) */}
        <div className="p-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-400 text-xs font-bold uppercase tracking-wider">
            <span>NF-e Importadas</span>
            <FileText className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-3xl font-extrabold text-purple-700 dark:text-purple-300 mt-1">
            {metrics?.totalNfeImports || 0}
          </div>
          <p className="text-[11px] text-slate-500">Módulo fiscal da plataforma</p>
        </div>
      </div>

      {/* Alertas de Trials Próximos de Expirar */}
      {expiringTrials.length > 0 && (
        <div className="p-5 rounded-3xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Clock className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                  Atenção: {expiringTrials.length} {expiringTrials.length === 1 ? 'empresa com Trial prestes a vencer' : 'empresas com Trial prestes a vencer'} (≤ 3 dias)
                </h4>
                <p className="text-xs text-amber-800/80 dark:text-amber-300/80">
                  Você pode prorrogar o período de teste em +15 dias com 1 clique para apoiar a conversão do cliente.
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
            {expiringTrials.map((comp) => (
              <div
                key={comp.id}
                className="p-3 bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-800/80 flex items-center justify-between gap-3 shadow-xs"
              >
                <div>
                  <div className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {comp.company_name}
                  </div>
                  <div className="text-[11px] text-rose-600 font-bold">
                    {comp.days_remaining} {comp.days_remaining === 1 ? 'dia restante' : 'dias restantes'}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleQuickExtend(comp.id, comp.company_name)}
                  disabled={quickExtendId === comp.id}
                  className="px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {quickExtendId === comp.id ? 'Renovando...' : '+15 dias'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid: Distribuição de Planos & Últimas Empresas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribuição por Planos */}
        <div className="p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Crown className="w-4 h-4 text-purple-600" />
              <span>Distribuição por Planos</span>
            </h3>
            <button
              onClick={() => onNavigate('admin_subscriptions')}
              className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Gerenciar
            </button>
          </div>

          <div className="space-y-3">
            {/* Starter */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Starter</span>
                <span className="text-purple-700 dark:text-purple-300">{metrics?.starterClients || 0} empresas</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${metrics?.totalCompanies ? ((metrics.starterClients / metrics.totalCompanies) * 100).toFixed(0) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Business */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Business</span>
                <span className="text-purple-700 dark:text-purple-300">{metrics?.businessClients || 0} empresas</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${metrics?.totalCompanies ? ((metrics.businessClients / metrics.totalCompanies) * 100).toFixed(0) : 0}%`,
                  }}
                />
              </div>
            </div>

            {/* Enterprise */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-slate-700 dark:text-slate-300">Enterprise</span>
                <span className="text-purple-700 dark:text-purple-300">{metrics?.enterpriseClients || 0} empresas</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-purple-600 rounded-full"
                  style={{
                    width: `${metrics?.totalCompanies ? ((metrics.enterpriseClients / metrics.totalCompanies) * 100).toFixed(0) : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Últimas Empresas Cadastradas */}
        <div className="lg:col-span-2 p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-purple-600" />
              <span>Últimas Empresas Cadastradas</span>
            </h3>
            <button
              onClick={() => onNavigate('admin_companies')}
              className="text-xs font-bold text-purple-700 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Ver Todas ({companies.length})
            </button>
          </div>

          {companies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Nenhuma empresa registrada no sistema.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {companies.slice(0, 5).map((comp) => (
                <div key={comp.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 flex items-center justify-center font-bold text-xs">
                      {comp.company_name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-slate-900 dark:text-white">
                        {comp.company_name}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {comp.responsible_name} • {formatDate(comp.created_at)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                      {comp.plan_name}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        comp.subscription_status === 'active'
                          ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : comp.subscription_status === 'trial'
                          ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                          : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                      }`}
                    >
                      {comp.subscription_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
