import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Boxes,
  AlertTriangle,
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  Building2,
  Clock,
  CheckCircle2,
  Plus,
  Loader2,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { productService } from '../../services/productService';
import { movementService } from '../../services/movementService';
import { companyService } from '../../services/companyService';
import { Product, StockMovement, Company, NavigationSection } from '../../types';

interface OverviewViewProps {
  onNavigate: (section: NavigationSection) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({ onNavigate }) => {
  const { user, companyName } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch all dashboard data from Supabase
  const loadDashboardData = async (showRefreshIndicator = false) => {
    if (!user?.id) return;
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [prodsRes, movsRes, compRes] = await Promise.all([
        productService.getProducts(user.id),
        movementService.getMovements(user.id),
        companyService.getCompany(user.id),
      ]);

      setProducts(prodsRes.data || []);
      setMovements(movsRes.data || []);
      setCompany(compRes.data || null);
    } catch (err) {
      console.error('Erro ao carregar dados do Dashboard no Supabase:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [user?.id]);

  // Derived Real Metrics
  const metrics = useMemo(() => {
    // 1. Total de produtos cadastrados
    const totalProductsCount = products.length;

    // 2. Total de itens em estoque (soma de todas as quantidades de current_stock)
    const totalItemsInStock = products.reduce((acc, p) => {
      const qty = Number(p.current_stock) || 0;
      return acc + qty;
    }, 0);

    // 3. Produtos sem estoque (current_stock <= 0)
    const outOfStockProducts = products.filter((p) => (Number(p.current_stock) || 0) <= 0);

    // 4. Produtos com estoque baixo (0 < current_stock <= min_stock)
    const lowStockProducts = products.filter((p) => {
      const current = Number(p.current_stock) || 0;
      const min = Number(p.min_stock) || 0;
      return current > 0 && current <= min;
    });

    // 5. Entradas realizadas
    const entradas = movements.filter((m) => m.type === 'entrada');
    const totalEntradasCount = entradas.length;
    const totalEntradasUnits = entradas.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);

    // 6. Saídas realizadas
    const saidas = movements.filter((m) => m.type === 'saida');
    const totalSaidasCount = saidas.length;
    const totalSaidasUnits = saidas.reduce((acc, m) => acc + (Number(m.quantity) || 0), 0);

    // 7. Últimas 6 movimentações
    const latestMovements = movements.slice(0, 6);

    // 8. Valor estimado do estoque (Preço de custo x Estoque)
    const totalCostValue = products.reduce((acc, p) => {
      const qty = Number(p.current_stock) || 0;
      const cost = Number(p.cost_price) || 0;
      return acc + qty * cost;
    }, 0);

    return {
      totalProductsCount,
      totalItemsInStock,
      outOfStockProducts,
      outOfStockCount: outOfStockProducts.length,
      lowStockProducts,
      lowStockCount: lowStockProducts.length,
      totalEntradasCount,
      totalEntradasUnits,
      totalSaidasCount,
      totalSaidasUnits,
      latestMovements,
      totalCostValue,
    };
  }, [products, movements]);

  // Formatter for date and time
  const formatDateTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute right-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase text-purple-200 border border-white/15 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Painel Geral
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Supabase PostgreSQL
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white">
              Visão Geral: {company?.company_name || companyName || 'Minha Microempresa'}
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 max-w-2xl leading-relaxed">
              Acompanhe os principais indicadores de estoque, reposição e fluxo de movimentações em tempo real com dados sincronizados diretamente no banco de dados da sua empresa.
            </p>
          </div>

          {/* Header Quick Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadDashboardData(true)}
              disabled={isRefreshing || isLoading}
              title="Atualizar dados do Supabase"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer border border-white/15"
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => onNavigate('produtos')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white text-purple-900 hover:bg-purple-50 text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-purple-700" />
              <span>Novo Produto</span>
            </button>

            <button
              onClick={() => onNavigate('movimentacoes')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Movimentar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Loading Skeleton or Stats Grid */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <span className="text-xs font-semibold">Carregando indicadores em tempo real...</span>
        </div>
      ) : (
        <>
          {/* ========================================================================= */}
          {/* 1. PRINCIPAIS INDICADORES (KPIs) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Total de Produtos Cadastrados */}
            <div
              onClick={() => onNavigate('produtos')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 rounded-2xl p-5 shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Total de Produtos
                </span>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Package className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
                  {metrics.totalProductsCount}
                </span>
                <span className="text-xs font-bold text-slate-400">itens cadastrados</span>
              </div>
              <div className="mt-2 text-[11px] text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1">
                <span>Gerenciar catálogo de produtos</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* KPI 2: Total de Itens em Estoque */}
            <div
              onClick={() => onNavigate('produtos')}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-2xl p-5 shadow-2xs transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Itens em Estoque
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <Boxes className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
                  {metrics.totalItemsInStock}
                </span>
                <span className="text-xs font-bold text-slate-400">unidades físicas</span>
              </div>
              <div className="mt-2 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <span>Saldo físico consolidado</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* KPI 3: Produtos com Estoque Baixo */}
            <div
              onClick={() => onNavigate('produtos')}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer group ${
                metrics.lowStockCount > 0
                  ? 'border-amber-200 dark:border-amber-900/60 hover:border-amber-400'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Estoque Baixo
                </span>
                <span
                  className={`p-2 rounded-xl ${
                    metrics.lowStockCount > 0
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    metrics.lowStockCount > 0
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {metrics.lowStockCount}
                </span>
                <span className="text-xs font-bold text-slate-400">abaixo do mínimo</span>
              </div>
              <div className="mt-2 text-[11px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1">
                <span>{metrics.lowStockCount > 0 ? 'Requer atenção para compra' : 'Nenhum item em alerta'}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* KPI 4: Produtos Sem Estoque */}
            <div
              onClick={() => onNavigate('produtos')}
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all cursor-pointer group ${
                metrics.outOfStockCount > 0
                  ? 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sem Estoque
                </span>
                <span
                  className={`p-2 rounded-xl ${
                    metrics.outOfStockCount > 0
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <AlertCircle className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span
                  className={`text-2xl sm:text-3xl font-black ${
                    metrics.outOfStockCount > 0
                      ? 'text-rose-600 dark:text-rose-400'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}
                >
                  {metrics.outOfStockCount}
                </span>
                <span className="text-xs font-bold text-slate-400">itens esgotados</span>
              </div>
              <div className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <span>{metrics.outOfStockCount > 0 ? 'Indisponíveis para venda' : 'Nenhum item zerado'}</span>
                <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 2. FLUXO DE ENTRADAS E SAÍDAS (RESUMO DE MOVIMENTAÇÕES) */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Total de Entradas Realizadas */}
            <div
              onClick={() => onNavigate('movimentacoes')}
              className="bg-white dark:bg-slate-900 border border-emerald-100 dark:border-emerald-950/60 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-emerald-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                  <ArrowDownLeft className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Entradas Realizadas
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {metrics.totalEntradasCount}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      registros ({metrics.totalEntradasUnits} un.)
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                Ver <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            {/* Total de Saídas Realizadas */}
            <div
              onClick={() => onNavigate('movimentacoes')}
              className="bg-white dark:bg-slate-900 border border-purple-100 dark:border-purple-950/60 rounded-2xl p-4 sm:p-5 shadow-2xs hover:border-purple-300 transition-all cursor-pointer flex items-center justify-between"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400">
                  <ArrowUpRight className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Saídas Realizadas
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-purple-700 dark:text-purple-400 mt-0.5">
                    {metrics.totalSaidasCount}{' '}
                    <span className="text-xs font-semibold text-slate-400">
                      registros ({metrics.totalSaidasUnits} un.)
                    </span>
                  </div>
                </div>
              </div>
              <span className="text-xs font-bold text-purple-700 dark:text-purple-400 flex items-center gap-1">
                Ver <ChevronRight className="w-4 h-4" />
              </span>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. GRID PRINCIPAL: ALERTAS DE ESTOQUE + ÚLTIMAS MOVIMENTAÇÕES */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Alertas de Estoque Baixo / Esgotado (5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <Card
                id="stock-alerts-card"
                title="Itens que Requerem Atenção"
                subtitle="Alertas de reposição e ruptura de estoque"
                headerAction={
                  metrics.lowStockCount + metrics.outOfStockCount > 0 ? (
                    <Badge variant="purple" size="sm">
                      {metrics.lowStockCount + metrics.outOfStockCount} itens
                    </Badge>
                  ) : (
                    <Badge variant="green" size="sm">
                      Estoque Saudável
                    </Badge>
                  )
                }
              >
                {metrics.lowStockCount === 0 && metrics.outOfStockCount === 0 ? (
                  <div className="text-center py-8 px-4 border border-dashed border-emerald-200 dark:border-emerald-900/40 rounded-2xl bg-emerald-50/40 dark:bg-emerald-950/20 space-y-2">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Nenhum produto em nível crítico
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Todos os produtos cadastrados estão com estoque acima da quantidade mínima de segurança.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                    {/* Esgotados Primeiro */}
                    {metrics.outOfStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white font-bold text-[9px] uppercase">
                              Esgotado
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {p.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-rose-700 dark:text-rose-400 mt-0.5">
                            Estoque: <strong className="font-mono">0 un.</strong> (Mínimo: {p.min_stock} un.)
                          </div>
                        </div>

                        <button
                          onClick={() => onNavigate('movimentacoes')}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                        >
                          Repor
                        </button>
                      </div>
                    ))}

                    {/* Estoque Baixo */}
                    {metrics.lowStockProducts.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/30 flex items-center justify-between gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-bold text-[9px] uppercase">
                              Estoque Baixo
                            </span>
                            <span className="font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                              {p.name}
                            </span>
                          </div>
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-0.5">
                            Atual: <strong className="font-mono">{p.current_stock} un.</strong> (Mínimo: {p.min_stock} un.)
                          </div>
                        </div>

                        <button
                          onClick={() => onNavigate('movimentacoes')}
                          className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold shrink-0 transition-colors cursor-pointer"
                        >
                          Entrada
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              {/* Informações Cadastrais da Empresa */}
              <Card
                id="company-summary-card"
                title="Dados da Microempresa"
                subtitle="Identificação cadastral ativa no Supabase"
                headerAction={
                  <button
                    onClick={() => onNavigate('empresa')}
                    className="text-xs text-purple-600 hover:text-purple-700 font-bold"
                  >
                    Editar &rarr;
                  </button>
                }
              >
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Razão Social / Nome:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 text-right truncate max-w-[200px]">
                      {company?.company_name || companyName || 'Não informado'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">Responsável:</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {company?.responsible_name || 'Responsável'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">CNPJ:</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">
                      {company?.cnpj || 'Não cadastrado'}
                    </span>
                  </div>

                  {company?.city && (
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                      <span className="text-slate-500 dark:text-slate-400 font-medium">Localização:</span>
                      <span className="text-slate-800 dark:text-slate-200">
                        {company.city} {company.state ? `- ${company.state}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Últimas Movimentações (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              <Card
                id="recent-movements-card"
                title="Últimas Movimentações de Estoque"
                subtitle="Registro cronológico das entradas e saídas mais recentes"
                headerAction={
                  <button
                    onClick={() => onNavigate('movimentacoes')}
                    className="text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <span>Ver todas</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                }
              >
                {metrics.latestMovements.length === 0 ? (
                  <div className="text-center py-12 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
                    <ArrowLeftRight className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                      Nenhuma movimentação registrada
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                      Registre entradas de compras ou saídas de vendas para começar a acompanhar o fluxo.
                    </p>
                    <button
                      onClick={() => onNavigate('movimentacoes')}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer"
                    >
                      Registrar Primeira Movimentação
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {metrics.latestMovements.map((mov) => {
                      const isEntrada = mov.type === 'entrada';
                      const productName = mov.product_name || mov.product?.name || 'Produto';

                      return (
                        <div
                          key={mov.id}
                          className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`p-2 rounded-xl shrink-0 ${
                                isEntrada
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                  : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                              }`}
                            >
                              {isEntrada ? (
                                <ArrowDownLeft className="w-4 h-4" />
                              ) : (
                                <ArrowUpRight className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100 truncate">
                                {productName}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-400" />
                                  {formatDateTime(mov.movement_date)}
                                </span>
                                {mov.notes && (
                                  <>
                                    <span>&bull;</span>
                                    <span className="truncate max-w-[150px] italic">
                                      {mov.notes}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`font-black font-mono text-xs sm:text-sm ${
                                isEntrada
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-purple-700 dark:text-purple-400'
                              }`}
                            >
                              {isEntrada ? `+${mov.quantity}` : `-${mov.quantity}`} un.
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>

              {/* Acesso Rápido aos Módulos Principais */}
              <Card
                id="quick-nav-card"
                title="Acesso Rápido"
                subtitle="Navegação ágil para a gestão do dia a dia"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    onClick={() => onNavigate('produtos')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Catálogo de Produtos
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {metrics.totalProductsCount} itens cadastrados
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
                  </button>

                  <button
                    onClick={() => onNavigate('movimentacoes')}
                    className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-left transition-all group cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                        <ArrowLeftRight className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          Movimentações
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Entradas e saídas de estoque
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                  </button>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
