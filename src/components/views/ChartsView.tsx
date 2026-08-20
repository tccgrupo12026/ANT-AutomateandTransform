/**
 * ANT — Automate and Transform
 * Módulo de Gráficos Gerenciais
 *
 * Gráficos implementados com dados 100% reais:
 * 1. Faturamento por mês
 * 2. Lucro por mês
 * 3. Entradas x Saídas de estoque
 * 4. Produtos mais movimentados
 * 5. Produtos com estoque crítico
 * 6. Distribuição de produtos por categoria
 *
 * SEM Inteligência Artificial (IA), Gemini, OpenAI ou Chatbot.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart as LineChartIcon,
  BarChart3,
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeftRight,
  Package,
  AlertTriangle,
  PieChart,
  DollarSign,
  Calendar,
  RefreshCw,
  FileText,
  Layers,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useAuth } from '../../contexts/AuthContext';
import { reportService, ChartsData } from '../../services/reportService';
import { NavigationSection } from '../../types';

interface ChartsViewProps {
  onNavigate?: (section: NavigationSection) => void;
}

export const ChartsView: React.FC<ChartsViewProps> = ({ onNavigate }) => {
  const { user, companyName } = useAuth();
  const [data, setData] = useState<ChartsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeWindow, setTimeWindow] = useState<'6m' | '12m' | 'all'>('6m');
  const [hoveredPoint, setHoveredPoint] = useState<string | null>(null);

  const loadChartsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await reportService.getChartsData(user.id);
      setData(res);
    } catch (err) {
      console.error('Erro ao carregar dados dos gráficos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChartsData();
  }, [user]);

  // Filtragem de dados por janela de tempo
  const filteredFinancials = useMemo(() => {
    if (!data?.monthlyFinancials) return [];
    if (timeWindow === '6m') return data.monthlyFinancials.slice(-6);
    if (timeWindow === '12m') return data.monthlyFinancials.slice(-12);
    return data.monthlyFinancials;
  }, [data?.monthlyFinancials, timeWindow]);

  const filteredMovements = useMemo(() => {
    if (!data?.monthlyMovements) return [];
    if (timeWindow === '6m') return data.monthlyMovements.slice(-6);
    if (timeWindow === '12m') return data.monthlyMovements.slice(-12);
    return data.monthlyMovements;
  }, [data?.monthlyMovements, timeWindow]);

  // Cálculo de máximos para escalas de gráficos
  const maxRevenue = useMemo(() => {
    const max = Math.max(...filteredFinancials.map((f) => f.revenue), 100);
    return Math.ceil(max * 1.15);
  }, [filteredFinancials]);

  const maxProfitAbs = useMemo(() => {
    const max = Math.max(...filteredFinancials.map((f) => Math.abs(f.profit)), 100);
    return Math.ceil(max * 1.2);
  }, [filteredFinancials]);

  const maxMovementQty = useMemo(() => {
    const max = Math.max(
      ...filteredMovements.map((m) => Math.max(m.entriesQty, m.exitsQty)),
      10
    );
    return Math.ceil(max * 1.15);
  }, [filteredMovements]);

  const maxMovedProductQty = useMemo(() => {
    if (!data?.topMovedProducts?.length) return 10;
    const max = Math.max(...data.topMovedProducts.map((p) => p.totalQuantityMoved));
    return Math.max(max, 10);
  }, [data?.topMovedProducts]);

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Carregando indicadores visuais do ANT...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <LineChartIcon className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Gráficos &amp; Evolução Visual
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Métricas de faturamento, rentabilidade, giro de estoque e distribuição por categorias em tempo real.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Período */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              onClick={() => setTimeWindow('6m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeWindow === '6m'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              6 Meses
            </button>
            <button
              onClick={() => setTimeWindow('12m')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeWindow === '12m'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              12 Meses
            </button>
            <button
              onClick={() => setTimeWindow('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                timeWindow === 'all'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Tudo
            </button>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadChartsData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          {onNavigate && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('relatorios')}
              leftIcon={<FileText className="w-3.5 h-3.5" />}
            >
              Ver Relatórios
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Resumo Executivo */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card id="kpi-rev-total" className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Faturamento Acumulado</span>
            <DollarSign className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatBRL(data?.totals.totalRevenueLast12M || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Receita total no período selecionado
          </p>
        </Card>

        <Card id="kpi-profit-total" className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Lucro Líquido do Período</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div
            className={`text-xl font-bold ${
              (data?.totals.totalProfitLast12M || 0) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-red-600 dark:text-red-400'
            }`}
          >
            {formatBRL(data?.totals.totalProfitLast12M || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Receitas menos despesas operacionais
          </p>
        </Card>

        <Card id="kpi-inventory-val" className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Capital Imobilizado</span>
            <Package className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
            {formatBRL(data?.totals.totalInventoryCost || 0)}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Valor em custo das mercadorias estocadas
          </p>
        </Card>

        <Card id="kpi-crit-alert" className="p-4">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold mb-1">
            <span>Estoque em Alerta</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {data?.totals.criticalCount || 0} produtos
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Itens no limite mínimo ou zerados
          </p>
        </Card>
      </div>

      {/* Grid de Gráficos Principais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GRÁFICO 1: Faturamento por Mês */}
        <Card
          id="chart-revenue-month"
          title="1. Faturamento por Mês"
          subtitle="Evolução das receitas brutas mês a mês"
          badge={
            <Badge variant="purple">
              {filteredFinancials.length} meses analisados
            </Badge>
          }
        >
          <div className="mt-4">
            {filteredFinancials.length === 0 || filteredFinancials.every((f) => f.revenue === 0) ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nenhuma receita registrada no período selecionado.
              </div>
            ) : (
              <div className="space-y-4">
                {/* SVG Visual Bars */}
                <div className="h-48 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 px-2">
                  {filteredFinancials.map((pt) => {
                    const heightPercent = maxRevenue > 0 ? (pt.revenue / maxRevenue) * 100 : 0;
                    const isHovered = hoveredPoint === `rev-${pt.monthKey}`;

                    return (
                      <div
                        key={pt.monthKey}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                        onMouseEnter={() => setHoveredPoint(`rev-${pt.monthKey}`)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Tooltip */}
                        {isHovered && (
                          <div className="absolute -top-12 z-20 bg-slate-900 text-white text-[10px] py-1 px-2 rounded shadow-lg whitespace-nowrap font-mono pointer-events-none">
                            <div className="font-bold">{pt.monthLabel}</div>
                            <div>Faturamento: {formatBRL(pt.revenue)}</div>
                          </div>
                        )}

                        <div className="text-[10px] font-semibold text-purple-700 dark:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity">
                          {formatBRL(pt.revenue).replace('R$', '').trim()}
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full max-w-[42px] bg-linear-to-t from-purple-700 to-purple-500 rounded-t-lg transition-all duration-300 group-hover:brightness-110 shadow-xs"
                          style={{
                            height: `${Math.max(heightPercent, 4)}%`,
                          }}
                        />

                        {/* Label */}
                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-2">
                          {pt.monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <span>Pico do período: {formatBRL(maxRevenue)}</span>
                  <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600 inline-block" />
                    Receitas Realizadas
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* GRÁFICO 2: Lucro por Mês */}
        <Card
          id="chart-profit-month"
          title="2. Lucro Líquido por Mês"
          subtitle="Resultado líquido (Receitas - Despesas)"
          badge={
            <Badge variant="green">
              {filteredFinancials.filter((f) => f.profit > 0).length} meses com lucro
            </Badge>
          }
        >
          <div className="mt-4">
            {filteredFinancials.length === 0 ||
            filteredFinancials.every((f) => f.revenue === 0 && f.expense === 0) ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nenhum lançamento financeiro para cálculo de lucro no período.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 px-2">
                  {filteredFinancials.map((pt) => {
                    const isPositive = pt.profit >= 0;
                    const heightPercent = maxProfitAbs > 0 ? (Math.abs(pt.profit) / maxProfitAbs) * 100 : 0;
                    const isHovered = hoveredPoint === `prof-${pt.monthKey}`;

                    return (
                      <div
                        key={pt.monthKey}
                        className="flex-1 flex flex-col items-center gap-1 group relative h-full justify-end"
                        onMouseEnter={() => setHoveredPoint(`prof-${pt.monthKey}`)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {isHovered && (
                          <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap font-mono pointer-events-none">
                            <div className="font-bold">{pt.monthLabel}</div>
                            <div className={isPositive ? 'text-emerald-400' : 'text-red-400'}>
                              Lucro: {formatBRL(pt.profit)}
                            </div>
                            <div className="text-slate-300">
                              Receita: {formatBRL(pt.revenue)} | Despesa: {formatBRL(pt.expense)}
                            </div>
                          </div>
                        )}

                        <div
                          className={`text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity ${
                            isPositive ? 'text-emerald-600' : 'text-red-600'
                          }`}
                        >
                          {formatBRL(pt.profit).replace('R$', '').trim()}
                        </div>

                        {/* Dual colored Bar */}
                        <div
                          className={`w-full max-w-[42px] rounded-t-lg transition-all duration-300 shadow-xs ${
                            isPositive
                              ? 'bg-linear-to-t from-emerald-600 to-emerald-400'
                              : 'bg-linear-to-t from-red-600 to-red-400'
                          }`}
                          style={{
                            height: `${Math.max(heightPercent, 4)}%`,
                          }}
                        />

                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-2">
                          {pt.monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                      Superávit
                    </span>
                    <span className="flex items-center gap-1 font-medium text-red-600 dark:text-red-400">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                      Déficit
                    </span>
                  </div>
                  <span>Escala máx: {formatBRL(maxProfitAbs)}</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* GRÁFICO 3: Entradas x Saídas de Estoque */}
        <Card
          id="chart-movements-comparison"
          title="3. Entradas x Saídas de Estoque"
          subtitle="Volume mensal de unidades repostas vs vendidas"
          badge={
            <Badge variant="purple">
              Fluxo Físico
            </Badge>
          }
        >
          <div className="mt-4">
            {filteredMovements.length === 0 ||
            filteredMovements.every((m) => m.entriesQty === 0 && m.exitsQty === 0) ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nenhuma movimentação de estoque registrada no período.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="h-48 flex items-end gap-2 sm:gap-4 pt-6 pb-2 border-b border-slate-100 dark:border-slate-800 px-2">
                  {filteredMovements.map((pt) => {
                    const entriesHeight = maxMovementQty > 0 ? (pt.entriesQty / maxMovementQty) * 100 : 0;
                    const exitsHeight = maxMovementQty > 0 ? (pt.exitsQty / maxMovementQty) * 100 : 0;
                    const isHovered = hoveredPoint === `mov-${pt.monthKey}`;

                    return (
                      <div
                        key={pt.monthKey}
                        className="flex-1 flex flex-col items-center group relative h-full justify-end"
                        onMouseEnter={() => setHoveredPoint(`mov-${pt.monthKey}`)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {isHovered && (
                          <div className="absolute -top-14 z-20 bg-slate-900 text-white text-[10px] py-1.5 px-2.5 rounded shadow-lg whitespace-nowrap font-mono pointer-events-none">
                            <div className="font-bold">{pt.monthLabel}</div>
                            <div className="text-emerald-400">Entradas: +{pt.entriesQty} un</div>
                            <div className="text-purple-400">Saídas: -{pt.exitsQty} un</div>
                            <div className="text-slate-300">
                              Saldo Líquido: {pt.balanceQty >= 0 ? `+${pt.balanceQty}` : pt.balanceQty} un
                            </div>
                          </div>
                        )}

                        {/* Dual Bars Container */}
                        <div className="w-full flex items-end justify-center gap-1 h-full pb-1">
                          {/* Entrada Bar */}
                          <div
                            className="flex-1 max-w-[18px] bg-emerald-500 hover:bg-emerald-400 rounded-t transition-all"
                            style={{ height: `${Math.max(entriesHeight, 4)}%` }}
                            title={`Entradas: ${pt.entriesQty}`}
                          />
                          {/* Saída Bar */}
                          <div
                            className="flex-1 max-w-[18px] bg-purple-600 hover:bg-purple-500 rounded-t transition-all"
                            style={{ height: `${Math.max(exitsHeight, 4)}%` }}
                            title={`Saídas: ${pt.exitsQty}`}
                          />
                        </div>

                        <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-400 mt-2">
                          {pt.monthLabel}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 font-medium text-emerald-600 dark:text-emerald-400">
                      <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500 inline-block" />
                      Entradas (Compras/Reposição)
                    </span>
                    <span className="flex items-center gap-1 font-medium text-purple-600 dark:text-purple-400">
                      <span className="w-2.5 h-2.5 rounded-xs bg-purple-600 inline-block" />
                      Saídas (Vendas/Baixas)
                    </span>
                  </div>
                  <span>Máx: {maxMovementQty} un</span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* GRÁFICO 4: Produtos Mais Movimentados */}
        <Card
          id="chart-top-moved-products"
          title="4. Produtos Mais Movimentados"
          subtitle="Top itens com maior fluxo de unidades"
          badge={
            <Badge variant="purple">
              Top {data?.topMovedProducts.length || 0}
            </Badge>
          }
        >
          <div className="mt-4">
            {!data?.topMovedProducts.length ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nenhum produto com histórico de movimentação.
              </div>
            ) : (
              <div className="space-y-3">
                {data.topMovedProducts.slice(0, 6).map((p, idx) => {
                  const percent = (p.totalQuantityMoved / maxMovedProductQty) * 100;
                  return (
                    <div key={p.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 truncate max-w-[200px] sm:max-w-[260px]">
                          <span className="text-[10px] font-mono text-slate-400 w-4">
                            #{idx + 1}
                          </span>
                          <span className="truncate">{p.name}</span>
                        </span>
                        <div className="flex items-center gap-2 font-mono text-[11px]">
                          <span className="text-purple-600 dark:text-purple-400 font-bold">
                            {p.totalQuantityMoved} un
                          </span>
                          <span className="text-slate-400 hidden sm:inline">
                            (Saídas: {p.totalExitsQty})
                          </span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-purple-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(percent, 3)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* GRÁFICO 5: Produtos com Estoque Crítico */}
        <Card
          id="chart-critical-stock"
          title="5. Produtos com Estoque Crítico"
          subtitle="Itens zerados ou abaixo do limite mínimo de segurança"
          badge={
            <Badge variant={data?.criticalStockProducts.length ? 'red' : 'green'}>
              {data?.criticalStockProducts.length || 0} em Alerta
            </Badge>
          }
        >
          <div className="mt-4">
            {!data?.criticalStockProducts.length ? (
              <div className="py-10 text-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                ✓ Todos os produtos do catálogo estão com estoque acima do mínimo de segurança.
              </div>
            ) : (
              <div className="space-y-3">
                {data.criticalStockProducts.slice(0, 6).map((item) => {
                  const isZero = item.currentStock <= 0;
                  const ratioPercent = item.minStock > 0 ? (item.currentStock / item.minStock) * 100 : 0;

                  return (
                    <div
                      key={item.id}
                      className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${
                              isZero ? 'bg-red-500 animate-pulse' : 'bg-amber-500'
                            }`}
                          />
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {item.name}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>Categoria: {item.category}</span>
                          <span>•</span>
                          <span>Reposição: {item.deficit} un</span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-bold">
                          <span className={isZero ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                            {item.currentStock}
                          </span>
                          <span className="text-slate-400"> / {item.minStock} un</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Custo: {formatBRL(item.replacementCost)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Card>

        {/* GRÁFICO 6: Distribuição por Categoria */}
        <Card
          id="chart-category-distribution"
          title="6. Distribuição por Categoria"
          subtitle="Composição do catálogo de produtos e capital imobilizado"
          badge={
            <Badge variant="purple">
              {data?.categoryDistribution.length || 0} Categorias
            </Badge>
          }
        >
          <div className="mt-4">
            {!data?.categoryDistribution.length ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nenhuma categoria cadastrada no catálogo.
              </div>
            ) : (
              <div className="space-y-4">
                {/* Horizontal Stacked Multi-bar */}
                <div className="h-4 w-full flex rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {data.categoryDistribution.map((cat) => (
                    <div
                      key={cat.category}
                      className="h-full transition-all hover:opacity-80"
                      style={{
                        width: `${cat.percentage}%`,
                        backgroundColor: cat.color,
                      }}
                      title={`${cat.category}: ${cat.productCount} itens (${cat.percentage}%)`}
                    />
                  ))}
                </div>

                {/* Categorias Legend and Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                  {data.categoryDistribution.map((cat) => (
                    <div
                      key={cat.category}
                      className="p-2 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-3 h-3 rounded-xs shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {cat.category}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {cat.productCount} produtos ({cat.percentage}%)
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-bold font-mono text-purple-700 dark:text-purple-300">
                          {formatBRL(cat.totalCostValue)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {cat.totalStockUnits} un em estoque
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Rodapé Informativo */}
      <div className="p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-100 dark:border-purple-900/50 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="text-xs text-purple-950 dark:text-purple-200">
            <span className="font-bold">Dados 100% Determinísticos:</span> Todos os gráficos são gerados
            em tempo real a partir dos lançamentos das tabelas de produtos, movimentações e transações financeiras.
          </div>
        </div>

        {onNavigate && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => onNavigate('relatorios')}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            Exportar Relatórios Detalhados
          </Button>
        )}
      </div>
    </div>
  );
};
