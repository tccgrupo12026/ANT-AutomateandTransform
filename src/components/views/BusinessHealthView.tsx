import React, { useState, useEffect } from 'react';
import {
  Activity,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Package,
  ArrowRight,
  RefreshCw,
  Clock,
  HelpCircle,
  BarChart3,
  Layers,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  LineChart,
  FileText,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AntLogo } from '../common/AntLogo';
import { useAuth } from '../../contexts/AuthContext';
import {
  businessHealthService,
  BusinessHealthData,
  BusinessHealthInsight,
  BusinessRecommendation,
} from '../../services/businessHealthService';
import { NavigationSection } from '../../types';

interface BusinessHealthViewProps {
  onNavigate?: (section: NavigationSection) => void;
}

export const BusinessHealthView: React.FC<BusinessHealthViewProps> = ({ onNavigate }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthData, setHealthData] = useState<BusinessHealthData>(
    businessHealthService.getEmptyHealthData()
  );
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'geral' | 'recomendacoes' | 'estoque_critico' | 'capital_parado'>('geral');

  const loadHealthData = async (isManualRefresh = false) => {
    if (!user?.id) return;
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    setError(null);
    try {
      const { data, error: serviceError } = await businessHealthService.getBusinessHealth(user.id);
      if (serviceError) {
        setError(serviceError);
      }
      setHealthData(data);
    } catch (err: any) {
      console.error('Falha ao carregar Saúde do Negócio:', err);
      setError(err?.message || 'Erro ao carregar dados da Saúde do Negócio.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHealthData();
  }, [user?.id]);

  const getStatusBadge = (status: BusinessHealthData['healthStatus']) => {
    switch (status) {
      case 'excelente':
        return <Badge variant="green">Excelente (Saúde Plena)</Badge>;
      case 'saudavel':
        return <Badge variant="green">Saudável &amp; Estável</Badge>;
      case 'atencao':
        return <Badge variant="warning">Atenção Requerida</Badge>;
      case 'critico':
        return <Badge variant="red">Risco Crítico Identificado</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-600 dark:text-emerald-400 border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30';
    if (score >= 60) return 'text-purple-600 dark:text-purple-400 border-purple-500 bg-purple-50 dark:bg-purple-950/30';
    if (score >= 40) return 'text-amber-600 dark:text-amber-400 border-amber-500 bg-amber-50 dark:bg-amber-950/30';
    return 'text-rose-600 dark:text-rose-400 border-rose-500 bg-rose-50 dark:bg-rose-950/30';
  };

  const handleActionClick = (targetSection?: NavigationSection) => {
    if (targetSection && onNavigate) {
      onNavigate(targetSection);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="w-10 h-10 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
          Calculando diagnóstico da saúde do negócio via regras e dados reais...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner com Logo Oficial ANT em fundo branco */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          {/* Logo Oficial do ANT com fundo branco obrigatório */}
          <div className="shrink-0 p-1.5 bg-white rounded-xl shadow-xs border border-slate-100 flex items-center justify-center">
            <AntLogo size={38} showText={false} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                Saúde do Negócio
              </h2>
              {getStatusBadge(healthData.healthStatus)}
            </div>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Diagnóstico financeiro e operacional fundamentado exclusivamente em regras, cálculos matemáticos e dados reais da sua empresa (sem IA).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {onNavigate && (
            <>
              <button
                onClick={() => onNavigate('graficos')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                title="Ver gráficos visuais"
              >
                <LineChart className="w-3.5 h-3.5 text-purple-600" />
                <span>Gráficos</span>
              </button>
              <button
                onClick={() => onNavigate('relatorios')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all cursor-pointer"
                title="Exportar relatórios em PDF e CSV"
              >
                <FileText className="w-3.5 h-3.5 text-emerald-600" />
                <span>Relatórios</span>
              </button>
            </>
          )}
          <button
            onClick={() => loadHealthData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all disabled:opacity-50 cursor-pointer"
            title="Recalcular métricas em tempo real"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Atualizando...' : 'Recalcular'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs">
          <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Aviso:</span> {error}
          </div>
        </div>
      )}

      {/* Resumo Executivo: Índice de Saúde & 4 Pilares Determinísticos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Card do Score Geral */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Índice Geral de Saúde
              </span>
              <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-md">
                100% Determinístico
              </span>
            </div>

            <div className="flex items-baseline gap-3 my-2">
              <div className={`text-4xl sm:text-5xl font-black tracking-tight px-3 py-1 rounded-xl border-2 ${getScoreColor(healthData.healthScore)}`}>
                {healthData.healthScore}
              </div>
              <div>
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">
                  de 100 pontos
                </div>
                <div className="text-[11px] text-slate-500 capitalize">
                  Classificação: <strong>{healthData.healthStatus}</strong>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 leading-relaxed">
              {healthData.healthScore >= 80 &&
                'Operação altamente sustentável com boa liquidez, margens positivas e baixo risco de ruptura.'}
              {healthData.healthScore >= 60 && healthData.healthScore < 80 &&
                'Operação equilibrada e saudável, com pequenos pontos de atenção em estoque ou despesas a monitorar.'}
              {healthData.healthScore >= 40 && healthData.healthScore < 60 &&
                'Atenção necessária: existem mercadorias paradas ou margens apertadas que requerem ação rápida.'}
              {healthData.healthScore < 40 &&
                'Risco crítico identificado: ruptura de estoque, déficit operacional ou capital imobilizado excessivo.'}
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>Auditoria sem IA: baseada em contabilidade de gestão e regras ANT.</span>
          </div>
        </div>

        {/* Breakdown dos 4 Pilares */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-purple-600" />
              Pontuação dos 4 Pilares da Empresa
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Pilar Financeiro */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">1. Saúde Financeira</span>
                  <span className="font-black text-purple-600 dark:text-purple-400">
                    {healthData.healthScorePillars.financialHealth.score} / {healthData.healthScorePillars.financialHealth.max} pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(healthData.healthScorePillars.financialHealth.score / healthData.healthScorePillars.financialHealth.max) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {healthData.healthScorePillars.financialHealth.details}
                </p>
              </div>

              {/* Pilar Estoque */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">2. Gestão de Estoque</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {healthData.healthScorePillars.inventoryHealth.score} / {healthData.healthScorePillars.inventoryHealth.max} pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(healthData.healthScorePillars.inventoryHealth.score / healthData.healthScorePillars.inventoryHealth.max) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {healthData.healthScorePillars.inventoryHealth.details}
                </p>
              </div>

              {/* Pilar Precificação */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">3. Margens &amp; Preços</span>
                  <span className="font-black text-purple-600 dark:text-purple-400">
                    {healthData.healthScorePillars.pricingHealth.score} / {healthData.healthScorePillars.pricingHealth.max} pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-purple-600 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(healthData.healthScorePillars.pricingHealth.score / healthData.healthScorePillars.pricingHealth.max) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {healthData.healthScorePillars.pricingHealth.details}
                </p>
              </div>

              {/* Pilar Operacional */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="font-bold text-slate-800 dark:text-slate-200">4. Atividade Operacional</span>
                  <span className="font-black text-emerald-600 dark:text-emerald-400">
                    {healthData.healthScorePillars.operationalHealth.score} / {healthData.healthScorePillars.operationalHealth.max} pts
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden mb-1.5">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${(healthData.healthScorePillars.operationalHealth.score / healthData.healthScorePillars.operationalHealth.max) * 100}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 line-clamp-1">
                  {healthData.healthScorePillars.operationalHealth.details}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2 text-right">
            <button
              onClick={() => setActiveTab('recomendacoes')}
              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline inline-flex items-center gap-1"
            >
              Ver recomendações de melhoria para sua pontuação <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grade de 4 Métricas Chave com Comparativos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Faturamento Comparativo */}
        <Card id="health-metric-revenue" accent="purple">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase">Faturamento Mês</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            R$ {healthData.currentMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs">
            {healthData.revenueGrowthPercent !== null ? (
              healthData.revenueGrowthPercent >= 0 ? (
                <span className="inline-flex items-center text-emerald-600 dark:text-emerald-400 font-bold">
                  <TrendingUp className="w-3.5 h-3.5 mr-0.5" />
                  +{healthData.revenueGrowthPercent.toFixed(1)}% vs anterior
                </span>
              ) : (
                <span className="inline-flex items-center text-rose-600 dark:text-rose-400 font-bold">
                  <TrendingDown className="w-3.5 h-3.5 mr-0.5" />
                  {healthData.revenueGrowthPercent.toFixed(1)}% vs anterior
                </span>
              )
            ) : (
              <span className="text-slate-400">Primeiro mês registrado</span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Mês anterior: R$ {healthData.previousMonthRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        {/* Lucro Líquido & Margem */}
        <Card id="health-metric-profit" accent="green">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase">Lucro Líquido Mês</span>
            <Activity className="w-4 h-4 text-emerald-500" />
          </div>
          <div
            className={`text-xl sm:text-2xl font-black ${
              healthData.currentMonthProfit >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {healthData.currentMonthProfit < 0 && '- '}R${' '}
            {Math.abs(healthData.currentMonthProfit).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">
              Margem Líquida:{' '}
              <strong className={healthData.profitMarginPercent >= 20 ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-300'}>
                {healthData.profitMarginPercent.toFixed(1)}%
              </strong>
            </span>
            <span className="text-[11px] text-slate-400">
              Despesas: R$ {healthData.currentMonthExpense.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
            </span>
          </div>
        </Card>

        {/* Capital Parado em Estoque */}
        <Card id="health-metric-stock-capital" accent="purple">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase">Capital em Estoque</span>
            <Package className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            R$ {healthData.totalInventoryCapitalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Valor Venda:</span>
            <span className="font-bold text-slate-700 dark:text-slate-300">
              R$ {healthData.totalInventoryRetailValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">
            Lucro Bruto Potencial: R$ {healthData.potentialGrossProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
        </Card>

        {/* Estoque Crítico & Ruptura */}
        <Card id="health-metric-critical-stock" accent="green">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-bold uppercase">Abaixo do Mínimo</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100">
            {healthData.belowMinStockTotalCount}{' '}
            <span className="text-xs font-normal text-slate-500">de {healthData.totalProducts} produtos</span>
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-rose-600 dark:text-rose-400 font-bold">
              {healthData.outOfStockProductsCount} zerados
            </span>
            <span className="text-slate-300 dark:text-slate-700">•</span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">
              {healthData.criticalStockProductsCount} críticos
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {healthData.healthyStockProductsCount} itens em nível seguro
          </div>
        </Card>
      </div>

      {/* Navegação por Abas do Diagnóstico */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'geral'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Visão Geral do Diagnóstico</span>
        </button>

        <button
          onClick={() => setActiveTab('recomendacoes')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'recomendacoes'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          <span>Recomendações Práticas</span>
          {healthData.recommendations.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'recomendacoes' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300'
            }`}>
              {healthData.recommendations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('estoque_critico')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'estoque_critico'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Produtos para Repor</span>
          {healthData.belowMinStockTotalCount > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'estoque_critico' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300'
            }`}>
              {healthData.belowMinStockTotalCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('capital_parado')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'capital_parado'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mercadorias Sem Movimentação</span>
          {healthData.stagnantProducts.length > 0 && (
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              activeTab === 'capital_parado' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
            }`}>
              {healthData.stagnantProducts.length}
            </span>
          )}
        </button>
      </div>

      {/* ABA 1: VISÃO GERAL (OS 4 QUADRANTES EXIGIDOS) */}
      {activeTab === 'geral' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* QUADRANTE 1: O QUE ESTÁ INDO BEM */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    O que está indo bem
                  </h3>
                </div>
                <Badge variant="green" size="sm">
                  {healthData.positivePoints.length} Destaques
                </Badge>
              </div>

              <div className="space-y-3">
                {healthData.positivePoints.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs transition-all hover:border-emerald-300"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <span className="font-bold text-emerald-900 dark:text-emerald-300">
                        {item.title}
                      </span>
                      {item.metric && (
                        <span className="font-black text-emerald-700 dark:text-emerald-400 shrink-0">
                          {item.metric}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                      {item.description}
                    </p>
                    {item.targetSection && onNavigate && (
                      <button
                        onClick={() => handleActionClick(item.targetSection)}
                        className="mt-2 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                      >
                        Ver no módulo <ChevronRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* QUADRANTE 2: O QUE PRECISA DE ATENÇÃO */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    O que precisa de atenção
                  </h3>
                </div>
                <Badge variant="warning" size="sm">
                  {healthData.attentionPoints.length} Alertas
                </Badge>
              </div>

              <div className="space-y-3">
                {healthData.attentionPoints.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 text-center text-xs text-slate-500">
                    Nenhum alerta de atenção imediato detectado.
                  </div>
                ) : (
                  healthData.attentionPoints.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40 text-xs transition-all hover:border-amber-300"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-amber-900 dark:text-amber-300">
                          {item.title}
                        </span>
                        {item.metric && (
                          <span className="font-black text-amber-700 dark:text-amber-400 shrink-0">
                            {item.metric}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                        {item.description}
                      </p>
                      {item.targetSection && onNavigate && (
                        <button
                          onClick={() => handleActionClick(item.targetSection)}
                          className="mt-2 text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline inline-flex items-center gap-1"
                        >
                          Resolver no módulo <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* QUADRANTE 3: POSSÍVEIS RISCOS */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 rounded-lg bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400">
                    <AlertOctagon className="w-4 h-4" />
                  </span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Possíveis riscos
                  </h3>
                </div>
                <Badge variant={healthData.riskPoints.length > 0 ? 'red' : 'green'} size="sm">
                  {healthData.riskPoints.length} Riscos
                </Badge>
              </div>

              <div className="space-y-3">
                {healthData.riskPoints.length === 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-center text-xs text-emerald-800 dark:text-emerald-300">
                    Nenhum risco crítico ou ruptura identificado no momento.
                  </div>
                ) : (
                  healthData.riskPoints.map((item) => (
                    <div
                      key={item.id}
                      className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/40 text-xs transition-all hover:border-rose-300"
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className="font-bold text-rose-900 dark:text-rose-300">
                          {item.title}
                        </span>
                        {item.metric && (
                          <span className="font-black text-rose-700 dark:text-rose-400 shrink-0">
                            {item.metric}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-[11px]">
                        {item.description}
                      </p>
                      {item.targetSection && onNavigate && (
                        <button
                          onClick={() => handleActionClick(item.targetSection)}
                          className="mt-2 text-[10px] font-bold text-rose-700 dark:text-rose-400 hover:underline inline-flex items-center gap-1"
                        >
                          Corrigir agora <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* QUADRANTE 4 EM DESTAQUE: RECOMENDAÇÕES PRÁTICAS */}
          <Card
            id="health-practical-recommendations-card"
            title="Recomendações Práticas para o Empreendedor"
            subtitle="Plano de ação direto gerado por regras determinísticas"
            badge={<Badge variant="purple">Ações Prioritárias</Badge>}
            accent="purple"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {healthData.recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="font-bold text-slate-900 dark:text-slate-100 text-xs flex items-center gap-1.5">
                        <Lightbulb className="w-4 h-4 text-purple-600 shrink-0" />
                        {rec.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          rec.priority === 'alta'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : rec.priority === 'media'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {rec.priority}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                      {rec.description}
                    </p>

                    {rec.affectedItems && rec.affectedItems.length > 0 && (
                      <div className="mb-3 p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[11px] space-y-1">
                        <span className="font-bold text-slate-700 dark:text-slate-300 block text-[10px] uppercase text-slate-400">
                          Itens afetados:
                        </span>
                        {rec.affectedItems.map((it, idx) => (
                          <div key={idx} className="flex justify-between text-slate-600 dark:text-slate-400">
                            <span className="truncate max-w-[200px]">{it.name}</span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{it.detail}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => handleActionClick(rec.targetSection)}
                    className="w-full mt-2 py-2 px-3 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Comparativo de Giro: Mais Movimentados vs Menos Movimentados */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Mais Movimentados */}
            <Card
              id="top-moved-products-card"
              title="Produtos Mais Movimentados (Maior Giro)"
              subtitle="Itens com maior liquidez e saída recente"
              accent="green"
            >
              {healthData.topMovedProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Nenhuma movimentação de saída registrada ainda.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {healthData.topMovedProducts.map((stat, i) => (
                    <div key={stat.product.id || i} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{stat.product.name}</div>
                          <div className="text-[11px] text-slate-400">{stat.product.category}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-emerald-600 dark:text-emerald-400">
                          {stat.totalQuantityOut} un. saídas
                        </div>
                        <div className="text-[10px] text-slate-400">{stat.movementCount} movimentações</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Menos Movimentados / Baixo Giro */}
            <Card
              id="least-moved-products-card"
              title="Produtos Menos Movimentados (Baixo Giro)"
              subtitle="Itens com estoque ativo mas pouca ou nenhuma saída"
              accent="purple"
            >
              {healthData.leastMovedProducts.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">
                  Nenhum produto cadastrado com estoque.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {healthData.leastMovedProducts.map((stat, i) => (
                    <div key={stat.product.id || i} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-bold flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">{stat.product.name}</div>
                          <div className="text-[11px] text-slate-400">
                            Estoque: {stat.product.current_stock} un. (R$ {stat.capitalTiedUp.toFixed(2)})
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-amber-600 dark:text-amber-400">
                          {stat.daysSinceLastMovement} dias sem saída
                        </div>
                        <div className="text-[10px] text-slate-400">{stat.movementCount} movs no total</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ABA 2: TODAS AS RECOMENDAÇÕES PRÁTICAS */}
      {activeTab === 'recomendacoes' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
              Plano de Ação Recomendado para Sua Empresa
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              Recomendações automáticas calculadas pelas regras de contabilidade e gestão do ANT para alavancar sua pontuação de saúde.
            </p>

            <div className="space-y-4">
              {healthData.recommendations.map((rec, index) => (
                <div
                  key={rec.id}
                  className="p-4 sm:p-5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {index + 1}
                      </span>
                      <h4 className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                        {rec.title}
                      </h4>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          rec.priority === 'alta'
                            ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        Prioridade {rec.priority}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-8">
                      {rec.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleActionClick(rec.targetSection)}
                    className="shrink-0 py-2.5 px-4 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>{rec.actionText}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ABA 3: PRODUTOS PARA REPOR (ESTOQUE CRÍTICO / ZERADO) */}
      {activeTab === 'estoque_critico' && (
        <Card
          id="critical-stock-table-card"
          title="Produtos Abaixo do Estoque Mínimo &amp; Zerados"
          subtitle="Itens com risco de ruptura ou esgotados que necessitam de pedido de compra"
          badge={<Badge variant="red">{healthData.belowMinStockTotalCount} Itens</Badge>}
        >
          {healthData.belowMinStockTotalCount === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              Parabéns! Todos os produtos cadastrados estão com estoque acima do mínimo de segurança.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Produto</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3 text-right">Estoque Atual</th>
                    <th className="py-3 px-3 text-right">Estoque Mínimo</th>
                    <th className="py-3 px-3 text-right">Custo Unitário</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {[...healthData.outOfStockProducts, ...healthData.criticalStockProducts].map((p) => {
                    const isZero = (p.current_stock || 0) <= 0;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </td>
                        <td className="py-3 px-3 text-slate-500">{p.category || 'Geral'}</td>
                        <td className={`py-3 px-3 text-right font-bold ${isZero ? 'text-rose-600' : 'text-amber-600'}`}>
                          {p.current_stock} un.
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                          {p.min_stock} un.
                        </td>
                        <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                          R$ {Number(p.cost_price).toFixed(2)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isZero
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                            }`}
                          >
                            {isZero ? 'Esgotado (Zerado)' : 'Estoque Crítico'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => handleActionClick('movimentacoes')}
                            className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                          >
                            Dar Entrada
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ABA 4: CAPITAL PARADO EM ESTOQUE SEM MOVIMENTAÇÃO */}
      {activeTab === 'capital_parado' && (
        <Card
          id="stagnant-stock-table-card"
          title="Mercadorias Sem Movimentação (> 30 dias)"
          subtitle="Identificação de capital imobilizado para criação de promoções ou queima de estoque"
          badge={<Badge variant="warning">{healthData.stagnantProducts.length} Itens Parados</Badge>}
        >
          {healthData.stagnantProducts.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              Excelente! Não há mercadorias estagnadas com estoque parado há mais de 30 dias.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-bold uppercase text-[10px]">
                    <th className="py-3 px-3">Produto</th>
                    <th className="py-3 px-3 text-right">Estoque Parado</th>
                    <th className="py-3 px-3 text-right">Capital Imobilizado</th>
                    <th className="py-3 px-3 text-right">Preço de Venda</th>
                    <th className="py-3 px-3 text-center">Dias Sem Saída</th>
                    <th className="py-3 px-3 text-center">Gravidade</th>
                    <th className="py-3 px-3 text-right">Ação Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {healthData.stagnantProducts.map((stat) => (
                    <tr key={stat.product.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {stat.product.name}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700 dark:text-slate-300">
                        {stat.product.current_stock} un.
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-purple-600 dark:text-purple-400">
                        R$ {stat.capitalTiedUp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                        R$ {Number(stat.product.sale_price).toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {stat.daysSinceLastMovement} dias
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            stat.isCriticallyStagnant
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {stat.isCriticallyStagnant ? 'Crítico (> 60d)' : 'Atenção (> 30d)'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleActionClick('precificacao')}
                          className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Criar Promoção
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Rodapé de Auditoria e Conformidade de Regras */}
      <Card
        id="health-rules-audit-footer"
        title="Estrutura de Regras de Negócio do ANT"
        subtitle="Auditoria transparente baseada em fórmulas de contabilidade e gestão"
        badge={<Badge variant="green">100% Sem IA</Badge>}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-400">
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">Cálculos Determinísticos</span>
            <p className="leading-relaxed">
              O ANT calcula a lucratividade mensal, giro de estoque e margens brutas utilizando fórmulas exatas sobre os lançamentos financeiros e de estoque.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">Rastreabilidade Total</span>
            <p className="leading-relaxed">
              Cada alerta de estoque crítico, capital parado ou despesa elevada aponta diretamente para o produto ou lançamento correspondente no banco de dados.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="font-bold text-slate-900 dark:text-slate-100 block">Autonomia do Empreendedor</span>
            <p className="leading-relaxed">
              As recomendações práticas oferecem atalhos diretos para que o próprio gestor execute decisões estratégicas com velocidade e segurança.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
