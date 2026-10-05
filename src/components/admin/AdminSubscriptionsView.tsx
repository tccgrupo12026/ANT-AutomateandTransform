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
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Eye,
  X,
  FileText,
  Calendar,
  Building2,
  Sliders,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import {
  calculateAdminMetrics,
  fetchCustomPlansConfig,
  loadPlatformPlans,
  saveCustomPlansConfig,
  saveCustomPlansConfigAsync,
  resetCustomPlansConfig,
  fetchBillingHistory,
} from '../../services/adminService';
import { AdminMetrics, AdminSubscriptionOverview, CustomPlanConfig, BillingHistoryItem } from '../../types/admin';
import { PlanId } from '../../types/subscription';

export const AdminSubscriptionsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'plans' | 'billing'>('plans');
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [overview, setOverview] = useState<AdminSubscriptionOverview | null>(null);
  const [plansConfig, setPlansConfig] = useState<Record<PlanId, CustomPlanConfig>>(fetchCustomPlansConfig());
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Modal de Detalhes da Fatura (Mercado Pago Ready)
  const [selectedInvoice, setSelectedInvoice] = useState<BillingHistoryItem | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [resMetrics, history, remotePlans] = await Promise.all([
        calculateAdminMetrics(),
        fetchBillingHistory(),
        loadPlatformPlans(),
      ]);
      setMetrics(resMetrics.metrics);
      setOverview(resMetrics.overview);
      setBillingHistory(history);
      setPlansConfig(remotePlans || fetchCustomPlansConfig());
    } catch (err) {
      console.warn('Erro ao carregar dados:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
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

  // Alteração nos valores dos planos
  const handlePlanPriceChange = (planId: PlanId, newPrice: number) => {
    setPlansConfig((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        priceMonthly: Math.max(0, newPrice),
      },
    }));
  };

  // Alteração nos limites de usuários e produtos
  const handleLimitChange = (planId: PlanId, field: 'maxUsers' | 'maxProducts', value: number) => {
    setPlansConfig((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        [field]: Math.max(1, value),
      },
    }));
  };

  // Alteração nas features (toggles)
  const handleFeatureToggle = (planId: PlanId, featureKey: keyof CustomPlanConfig['features']) => {
    setPlansConfig((prev) => ({
      ...prev,
      [planId]: {
        ...prev[planId],
        features: {
          ...prev[planId].features,
          [featureKey]: !prev[planId].features[featureKey],
        },
      },
    }));
  };

  // Salvar configurações de planos
  const handleSavePlans = async () => {
    setIsSaving(true);
    try {
      const res = await saveCustomPlansConfigAsync(plansConfig);
      if (res.success) {
        showToast('Configurações dos planos salvas e sincronizadas com o banco de dados com sucesso!');
      } else {
        showToast('Configurações salvas no cache local. Aviso: ' + (res.error || 'Aguardando sincronização.'), 'error');
      }
      await loadData();
    } catch {
      showToast('Erro ao salvar configurações.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Restaurar padrões
  const handleResetPlans = async () => {
    if (confirm('Deseja restaurar os preços, limites e recursos padrões de fábrica dos planos?')) {
      setIsSaving(true);
      try {
        const restored = resetCustomPlansConfig();
        setPlansConfig(restored);
        await saveCustomPlansConfigAsync(restored);
        showToast('Planos restaurados para o padrão de fábrica e salvos no banco.');
        await loadData();
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs font-bold transition-all animate-fadeIn ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950 dark:text-rose-200 dark:border-rose-800'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/60 dark:text-purple-300">
              Admin ANT
            </span>
            <span className="text-xs text-slate-400 font-medium">Gestão Financeira & SaaS</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Gestão de Planos & Cobranças
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Edite valores e limites dos planos sem alterar código e visualize a projeção de cobranças preparada para Mercado Pago.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 self-start">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'plans'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Gestão de Planos
          </button>
          <button
            onClick={() => setActiveTab('billing')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Cobranças & Faturas
          </button>
        </div>
      </div>

      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            MRR Estimado (Mensal)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(overview?.mrr || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            Receita mensal recorrente gerada pelas empresas ativas.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            ARR Projetado (Anual)
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-700 dark:text-purple-400">
            {formatCurrency(overview?.arr || 0)}
          </div>
          <p className="text-[11px] text-slate-500">
            Projeção anual de receita com a base atual.
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
            Receita média por empresa ativa pagante.
          </p>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-2">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Empresas Pagantes
          </span>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-slate-100">
            {overview?.activePaidCount || 0}
          </div>
          <p className="text-[11px] text-slate-500">
            Assinaturas ativas no momento.
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* ABA 1: GESTÃO DE PLANOS (EDIÇÃO SEM CÓDIGO) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'plans' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Barra de Ações de Planos */}
          <div className="p-4 bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-purple-900 dark:text-purple-200">
                  Edição Dinâmica de Planos
                </h4>
                <p className="text-[11px] text-purple-700/80 dark:text-purple-300/80">
                  Altere preços, limites de usuários e recursos. Salve para aplicar em tempo real na plataforma.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={handleResetPlans}
                className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={handleSavePlans}
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>

          {/* Cards de Edição dos 3 Planos */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {(['starter', 'business', 'enterprise'] as PlanId[]).map((planId) => {
              const plan = plansConfig[planId];
              if (!plan) return null;

              return (
                <div
                  key={planId}
                  className={`p-6 bg-white dark:bg-slate-900 rounded-3xl border shadow-xs space-y-5 transition-all ${
                    plan.isPopular
                      ? 'border-purple-500 ring-2 ring-purple-500/20'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 uppercase tracking-wider">
                        {plan.badge || plan.name}
                      </span>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mt-1">
                        Plano {plan.name}
                      </h3>
                    </div>
                    <Crown className="w-6 h-6 text-purple-600" />
                  </div>

                  <p className="text-xs text-slate-500 min-h-[32px]">{plan.description}</p>

                  {/* Edição de Preço Mensal */}
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Preço Mensal (R$)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        R$
                      </span>
                      <input
                        type="number"
                        step="0.10"
                        min="0"
                        value={plan.priceMonthly}
                        onChange={(e) => handlePlanPriceChange(planId, parseFloat(e.target.value) || 0)}
                        className="w-full pl-9 pr-3 py-2 text-base font-extrabold rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                      />
                    </div>
                  </div>

                  {/* Limites de Usuários e Produtos */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Limite de Usuários
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={plan.maxUsers}
                        onChange={(e) => handleLimitChange(planId, 'maxUsers', parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-[10px] text-slate-400">999 = Ilimitado</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1">
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400">
                        Limite de Produtos
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={plan.maxProducts}
                        onChange={(e) => handleLimitChange(planId, 'maxProducts', parseInt(e.target.value) || 1)}
                        className="w-full px-2.5 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                      <span className="text-[10px] text-slate-400">99999 = Ilimitado</span>
                    </div>
                  </div>

                  {/* Toggles de Recursos Disponíveis */}
                  <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Recursos Habilitados no Plano
                    </span>

                    <div className="space-y-1.5">
                      {[
                        { key: 'canManageStock', label: 'Controle de Estoque' },
                        { key: 'canManageMovements', label: 'Movimentações (Entrada/Saída)' },
                        { key: 'canAccessPricing', label: 'Precificação Inteligente' },
                        { key: 'canAccessFinancial', label: 'Financeiro Completo & DRE' },
                        { key: 'canAccessBusinessHealth', label: 'Saúde do Negócio (Score)' },
                        { key: 'canAccessCharts', label: 'Gráficos e Indicadores' },
                        { key: 'canAccessReports', label: 'Relatórios Completos' },
                        { key: 'canManageUsers', label: 'Múltiplos Usuários' },
                      ].map(({ key, label }) => {
                        const isEnabled = plan.features[key as keyof CustomPlanConfig['features']];

                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleFeatureToggle(planId, key as keyof CustomPlanConfig['features'])}
                            className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-left transition-colors cursor-pointer text-xs"
                          >
                            <span className={isEnabled ? 'font-medium text-slate-900 dark:text-slate-100' : 'text-slate-400 line-through'}>
                              {label}
                            </span>
                            <span
                              className={`w-7 h-4 rounded-full flex items-center transition-colors px-0.5 ${
                                isEnabled ? 'bg-purple-600 justify-end' : 'bg-slate-300 dark:bg-slate-700 justify-start'
                              }`}
                            >
                              <span className="w-3 h-3 rounded-full bg-white shadow-xs" />
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* ABA 2: COBRANÇAS & FATURAS FUTURAS (MERCADO PAGO READY) */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'billing' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Info Card de Preparação para Mercado Pago */}
          <div className="p-4 bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800/60 rounded-2xl flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
            <div className="text-xs text-sky-900 dark:text-sky-200 leading-relaxed">
              <strong className="block font-bold mb-0.5 text-sm">
                Módulo Preparado para Integração com Mercado Pago
              </strong>
              As faturas e históricos de cobrança abaixo já contam com identificadores, status (<code className="font-mono bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded">paid</code>, <code className="font-mono bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded">pending</code>, <code className="font-mono bg-sky-100 dark:bg-sky-900 px-1 py-0.5 rounded">overdue</code>) e métodos previstos (PIX, Cartão e Boleto) prontos para receber o Checkout Transparente e Webhooks do Mercado Pago sem retrabalho estrutural.
            </div>
          </div>

          {/* Tabela de Histórico e Projeção de Faturas */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            {billingHistory.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <FileText className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-700" />
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Nenhuma fatura registrada</p>
                <p className="text-xs text-slate-500">As cobranças serão geradas automaticamente conforme as empresas utilizam a plataforma.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 text-xs font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3.5 px-4 sm:px-6">Fatura / Ref</th>
                      <th className="py-3.5 px-4">Empresa</th>
                      <th className="py-3.5 px-4">Plano</th>
                      <th className="py-3.5 px-4">Valor</th>
                      <th className="py-3.5 px-4">Vencimento</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Método Previsto</th>
                      <th className="py-3.5 px-4 sm:px-6 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                    {billingHistory.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-4 sm:px-6 font-mono text-xs font-bold text-purple-700 dark:text-purple-300">
                          {inv.id}
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {inv.company_name}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                            {inv.plan_name}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                          {formatCurrency(inv.amount)}
                        </td>

                        <td className="py-3.5 px-4 text-xs text-slate-500 font-medium">
                          {formatDate(inv.due_date)}
                        </td>

                        <td className="py-3.5 px-4">
                          {inv.status === 'paid' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              Paga
                            </span>
                          ) : inv.status === 'overdue' ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950 dark:text-rose-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                              Atrasada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950 dark:text-amber-300">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              Pendente
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                          {inv.payment_method_preview === 'pix' ? 'PIX (Imediato)' : 'Cartão de Crédito'}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right">
                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(inv)}
                            className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-purple-50 text-slate-600 dark:text-slate-400 hover:text-purple-600 transition-colors cursor-pointer"
                            title="Ver Detalhes Técnicos da Fatura"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal de Detalhes da Fatura (Mercado Pago Ready) */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Detalhes da Cobrança</h3>
                  <p className="text-xs text-slate-500 font-mono">{selectedInvoice.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Empresa Cliente:</span>
                <strong className="text-slate-900 dark:text-white">{selectedInvoice.company_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Plano Contratado:</span>
                <strong className="text-purple-700 dark:text-purple-300">{selectedInvoice.plan_name}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Valor Cobrado:</span>
                <strong className="text-emerald-600 text-sm font-extrabold">{formatCurrency(selectedInvoice.amount)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Data de Vencimento:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{formatDate(selectedInvoice.due_date)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Atual:</span>
                <span className="font-bold uppercase text-purple-700 dark:text-purple-400">{selectedInvoice.status}</span>
              </div>
            </div>

            {/* Estrutura Técnica Mercado Pago */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Payload Preparado para Mercado Pago:
              </span>
              <pre className="p-3 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-xl overflow-x-auto border border-slate-800">
{JSON.stringify(
  {
    external_reference: selectedInvoice.external_reference,
    gateway: selectedInvoice.gateway_preview,
    items: [
      {
        title: `Assinatura Plano ${selectedInvoice.plan_name} — ANT`,
        quantity: 1,
        unit_price: selectedInvoice.amount,
        currency_id: 'BRL',
      },
    ],
    payer_company_id: selectedInvoice.company_id,
    metadata: {
      platform: 'ANT Gestão SaaS',
      status_target: selectedInvoice.status,
    },
  },
  null,
  2
)}
              </pre>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
