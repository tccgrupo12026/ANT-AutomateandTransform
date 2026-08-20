/**
 * ANT — Automate and Transform
 * Módulo de Relatórios e Exportação (PDF e CSV)
 *
 * Relatórios implementados com dados 100% reais:
 * 1. Estoque atual
 * 2. Movimentações
 * 3. Financeiro
 * 4. Produtos com estoque baixo
 * 5. Saúde do Negócio resumida
 *
 * Exportação em:
 * - PDF (com layout limpo de impressão e logo oficial do ANT com fundo branco original)
 * - CSV (formato padrão com UTF-8 BOM e delimitador ;)
 *
 * SEM Inteligência Artificial (IA), Gemini, OpenAI ou Chatbot.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Download,
  Printer,
  FileSpreadsheet,
  Search,
  Filter,
  RefreshCw,
  Package,
  ArrowLeftRight,
  DollarSign,
  AlertTriangle,
  Activity,
  LineChart as LineChartIcon,
  ChevronRight,
  Building2,
  Calendar,
  Layers,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { AntLogo } from '../common/AntLogo';
import { useAuth } from '../../contexts/AuthContext';
import {
  reportService,
  ReportType,
  ConsolidatedReportsData,
} from '../../services/reportService';
import { NavigationSection } from '../../types';

interface ReportsViewProps {
  onNavigate?: (section: NavigationSection) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ onNavigate }) => {
  const { user, companyName } = useAuth();
  const [activeReport, setActiveReport] = useState<ReportType>('estoque_atual');
  const [data, setData] = useState<ConsolidatedReportsData | null>(null);
  const [loading, setLoading] = useState(true);

  // Filtros de busca
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('todos');

  const loadReportsData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await reportService.getConsolidatedReports(user.id);
      setData(res);
    } catch (err) {
      console.error('Erro ao carregar relatórios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReportsData();
  }, [user]);

  // Lista de categorias únicas para filtros
  const categoriesList = useMemo(() => {
    if (!data) return [];
    const set = new Set<string>();
    data.estoqueAtual.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }, [data]);

  // Filtragem dos dados conforme a aba ativa
  const filteredEstoque = useMemo(() => {
    if (!data) return [];
    return data.estoqueAtual.filter((p) => {
      const matchSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.barcode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === 'todos' || p.category === selectedCategory;
      const matchStatus =
        selectedStatusFilter === 'todos' ||
        (selectedStatusFilter === 'zerado' && p.status === 'zerado') ||
        (selectedStatusFilter === 'baixo' && p.status === 'baixo') ||
        (selectedStatusFilter === 'normal' && p.status === 'normal');

      return matchSearch && matchCategory && matchStatus;
    });
  }, [data, searchTerm, selectedCategory, selectedStatusFilter]);

  const filteredMovimentacoes = useMemo(() => {
    if (!data) return [];
    return data.movimentacoes.filter((m) => {
      const matchSearch =
        m.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchType =
        selectedStatusFilter === 'todos' || m.type === selectedStatusFilter;

      return matchSearch && matchType;
    });
  }, [data, searchTerm, selectedStatusFilter]);

  const filteredFinanceiro = useMemo(() => {
    if (!data) return [];
    return data.financeiro.filter((f) => {
      const matchSearch =
        f.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchType =
        selectedStatusFilter === 'todos' || f.type === selectedStatusFilter;

      return matchSearch && matchType;
    });
  }, [data, searchTerm, selectedStatusFilter]);

  const filteredEstoqueBaixo = useMemo(() => {
    if (!data) return [];
    return data.estoqueBaixo.filter((b) => {
      const matchSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.barcode.toLowerCase().includes(searchTerm.toLowerCase());
      const matchCategory =
        selectedCategory === 'todos' || b.category === selectedCategory;

      return matchSearch && matchCategory;
    });
  }, [data, searchTerm, selectedCategory]);

  const formatBRL = (val: number) =>
    val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Handlers de Exportação
  const handleExportCsv = () => {
    if (!data) return;
    reportService.exportToCsv(activeReport, data, companyName || 'Minha Empresa');
  };

  const handlePrintPdf = () => {
    reportService.triggerPrintView();
  };

  const getReportTitle = (type: ReportType) => {
    switch (type) {
      case 'estoque_atual':
        return 'Relatório de Estoque Atual';
      case 'movimentacoes':
        return 'Relatório de Movimentações de Estoque';
      case 'financeiro':
        return 'Relatório Financeiro de Receitas e Despesas';
      case 'estoque_baixo':
        return 'Relatório de Produtos com Estoque Baixo & Reposição';
      case 'saude_resumida':
        return 'Relatório Executivo de Saúde do Negócio';
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin" />
        <p className="text-sm font-medium text-slate-500">
          Consolidando relatórios do ANT...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* SEÇÃO OCULTA NA TELA, VISÍVEL APENAS NA IMPRESSÃO / SALVAR COMO PDF */}
      <div className="hidden print:block mb-8 border-b-2 border-purple-600 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <AntLogo size={52} />
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                ANT — Automate and Transform
              </h1>
              <p className="text-xs text-slate-600">
                Sistema Integrado de Gestão Comercial e Diagnóstico Determinístico
              </p>
            </div>
          </div>
          <div className="text-right text-xs text-slate-600">
            <div className="font-bold text-slate-900">{companyName || 'Empresa'}</div>
            <div>Emitido em: {data?.generatedAt}</div>
            <div>Documento Gerencial Oficial</div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="font-bold text-purple-700 uppercase">
            {getReportTitle(activeReport)}
          </span>
          <span className="text-slate-500">
            Exportação Gerada pelo Módulo de Relatórios do ANT
          </span>
        </div>
      </div>

      {/* Header Principal (Oculto na impressão) */}
      <div className="print:hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Relatórios Operacionais &amp; Executivos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Consolidação de dados reais, auditoria de inventário, extrato financeiro e exportação em PDF e CSV.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigate && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigate('graficos')}
              leftIcon={<LineChartIcon className="w-4 h-4 text-purple-600" />}
            >
              Ver Gráficos
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={loadReportsData}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
          >
            Atualizar
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCsv}
            leftIcon={<FileSpreadsheet className="w-4 h-4 text-emerald-600" />}
          >
            Exportar CSV
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handlePrintPdf}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            Imprimir / Salvar PDF
          </Button>
        </div>
      </div>

      {/* Abas de Navegação entre os 5 Relatórios (Ocultas na Impressão) */}
      <div className="print:hidden flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
        <button
          onClick={() => {
            setActiveReport('estoque_atual');
            setSelectedStatusFilter('todos');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeReport === 'estoque_atual'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Estoque Atual
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {data?.summary.totalProducts || 0}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('movimentacoes');
            setSelectedStatusFilter('todos');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeReport === 'movimentacoes'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-4 h-4" />
          Movimentações
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {data?.summary.totalMovements || 0}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('financeiro');
            setSelectedStatusFilter('todos');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeReport === 'financeiro'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Financeiro
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white/20">
            {data?.financeiro.length || 0}
          </span>
        </button>

        <button
          onClick={() => {
            setActiveReport('estoque_baixo');
            setSelectedStatusFilter('todos');
          }}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeReport === 'estoque_baixo'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Estoque Baixo
          {data?.summary.criticalStockItemsCount ? (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
              {data.summary.criticalStockItemsCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveReport('saude_resumida')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
            activeReport === 'saude_resumida'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Saúde do Negócio Resumida
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-emerald-400 text-slate-950 font-black">
            {data?.saudeResumida.healthScore || 0} pts
          </span>
        </button>
      </div>

      {/* Barra de Filtros e Busca (Oculta na Impressão) */}
      {activeReport !== 'saude_resumida' && (
        <div className="print:hidden flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Pesquisar por nome, código de barras, motivo ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Filtro por Categoria (quando aplicável) */}
            {(activeReport === 'estoque_atual' || activeReport === 'estoque_baixo') && (
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              >
                <option value="todos">Todas Categorias</option>
                {categoriesList.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            )}

            {/* Filtro de Status para Estoque Atual */}
            {activeReport === 'estoque_atual' && (
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              >
                <option value="todos">Todos Status</option>
                <option value="normal">Normal / Seguro</option>
                <option value="baixo">Abaixo do Mínimo</option>
                <option value="zerado">Estoque Zerado</option>
              </select>
            )}

            {/* Filtro de Tipo para Movimentações */}
            {activeReport === 'movimentacoes' && (
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              >
                <option value="todos">Todos os Tipos</option>
                <option value="entrada">Entradas (+)</option>
                <option value="saida">Saídas (-)</option>
                <option value="ajuste">Ajustes</option>
              </select>
            )}

            {/* Filtro de Tipo para Financeiro */}
            {activeReport === 'financeiro' && (
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              >
                <option value="todos">Receitas e Despesas</option>
                <option value="receita">Apenas Receitas (+)</option>
                <option value="despesa">Apenas Despesas (-)</option>
              </select>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. RELATÓRIO: ESTOQUE ATUAL */}
      {/* ========================================================================= */}
      {activeReport === 'estoque_atual' && (
        <div className="space-y-4">
          {/* Métricas do Relatório */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Total de Itens</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {filteredEstoque.length} produtos
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Saldo de Unidades</div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
                {filteredEstoque.reduce((acc, p) => acc + p.currentStock, 0)} un
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Capital Imobilizado (Custo)</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                {formatBRL(filteredEstoque.reduce((acc, p) => acc + p.totalCostValue, 0))}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Potencial de Venda (Bruto)</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                {formatBRL(filteredEstoque.reduce((acc, p) => acc + p.totalSaleValue, 0))}
              </div>
            </div>
          </div>

          {/* Tabela de Estoque Atual */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Mínimo</th>
                    <th className="py-3 px-4 text-right">Custo Unit.</th>
                    <th className="py-3 px-4 text-right">Venda Unit.</th>
                    <th className="py-3 px-4 text-right">Total Custo</th>
                    <th className="py-3 px-4 text-right">Margem %</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                  {filteredEstoque.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-xs text-slate-400 font-sans">
                        Nenhum produto localizado com os filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredEstoque.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-[11px] text-slate-400">
                          {p.barcode}
                        </td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {p.name}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-500">
                          {p.category}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          <span
                            className={
                              p.status === 'zerado'
                                ? 'text-red-600 dark:text-red-400'
                                : p.status === 'baixo'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }
                          >
                            {p.currentStock} un
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-400">
                          {p.minStock} un
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {formatBRL(p.costPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-purple-700 dark:text-purple-400">
                          {formatBRL(p.salePrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold">
                          {formatBRL(p.totalCostValue)}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              p.marginPercent < 20
                                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
                                : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400'
                            }`}
                          >
                            {p.marginPercent.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center font-sans">
                          {p.status === 'zerado' ? (
                            <Badge variant="red" size="sm">Zerado</Badge>
                          ) : p.status === 'baixo' ? (
                            <Badge variant="warning" size="sm">Abaixo Mínimo</Badge>
                          ) : (
                            <Badge variant="green" size="sm">Normal</Badge>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. RELATÓRIO: MOVIMENTAÇÕES DE ESTOQUE */}
      {/* ========================================================================= */}
      {activeReport === 'movimentacoes' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Total de Lançamentos</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {filteredMovimentacoes.length} registros
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Unidades em Entrada</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                +{filteredMovimentacoes.filter((m) => m.type === 'entrada').reduce((acc, m) => acc + m.quantity, 0)} un
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Unidades em Saída</div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
                -{filteredMovimentacoes.filter((m) => m.type === 'saida').reduce((acc, m) => acc + m.quantity, 0)} un
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Volume Financeiro Total</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5 font-mono">
                {formatBRL(filteredMovimentacoes.reduce((acc, m) => acc + m.totalValue, 0))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Data/Hora</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Qtd</th>
                    <th className="py-3 px-4 text-right">Valor Unit.</th>
                    <th className="py-3 px-4 text-right">Valor Total</th>
                    <th className="py-3 px-4">Motivo</th>
                    <th className="py-3 px-4">Obs.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                  {filteredMovimentacoes.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-slate-400 font-sans">
                        Nenhuma movimentação encontrada para os critérios selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredMovimentacoes.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-[11px] text-slate-500 whitespace-nowrap font-sans">
                          {new Date(m.date).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          {m.type === 'entrada' ? (
                            <Badge variant="green" size="sm">Entrada (+)</Badge>
                          ) : m.type === 'saida' ? (
                            <Badge variant="purple" size="sm">Saída (-)</Badge>
                          ) : (
                            <Badge variant="neutral" size="sm">Ajuste</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {m.productName}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-500">
                          {m.category}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          <span className={m.type === 'entrada' ? 'text-emerald-600' : 'text-purple-600'}>
                            {m.type === 'entrada' ? `+${m.quantity}` : `-${m.quantity}`} un
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {formatBRL(m.unitPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatBRL(m.totalValue)}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                          {m.reason}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-[11px] text-slate-400 truncate max-w-[140px]">
                          {m.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. RELATÓRIO: FINANCEIRO */}
      {/* ========================================================================= */}
      {activeReport === 'financeiro' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Total Receitas</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400 mt-0.5 font-mono">
                {formatBRL(data?.summary.totalRevenues || 0)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Total Despesas</div>
              <div className="text-lg font-black text-red-600 dark:text-red-400 mt-0.5 font-mono">
                {formatBRL(data?.summary.totalExpenses || 0)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Saldo Operacional</div>
              <div
                className={`text-lg font-black mt-0.5 font-mono ${
                  (data?.summary.netBalance || 0) >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-red-600 dark:text-red-400'
                }`}
              >
                {formatBRL(data?.summary.netBalance || 0)}
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Qtd de Lançamentos</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-0.5">
                {filteredFinanceiro.length} transações
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Data</th>
                    <th className="py-3 px-4">Tipo</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Descrição</th>
                    <th className="py-3 px-4">Forma de Pagamento</th>
                    <th className="py-3 px-4 text-right">Valor (R$)</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                  {filteredFinanceiro.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-xs text-slate-400 font-sans">
                        Nenhum lançamento financeiro encontrado com os filtros selecionados.
                      </td>
                    </tr>
                  ) : (
                    filteredFinanceiro.map((f) => (
                      <tr key={f.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 text-[11px] text-slate-500 whitespace-nowrap font-sans">
                          {new Date(f.date).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="py-2.5 px-4 font-sans">
                          {f.type === 'receita' ? (
                            <Badge variant="green" size="sm">Receita (+)</Badge>
                          ) : (
                            <Badge variant="red" size="sm">Despesa (-)</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-600 dark:text-slate-400">
                          {f.category}
                        </td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {f.description}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-500">
                          {f.paymentMethod || 'Outro'}
                        </td>
                        <td
                          className={`py-2.5 px-4 text-right font-bold text-sm ${
                            f.type === 'receita'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {f.type === 'receita' ? `+ ${formatBRL(f.amount)}` : `- ${formatBRL(f.amount)}`}
                        </td>
                        <td className="py-2.5 px-4 text-center font-sans">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-medium">
                            {f.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RELATÓRIO: PRODUTOS COM ESTOQUE BAIXO & REPOSIÇÃO */}
      {/* ========================================================================= */}
      {activeReport === 'estoque_baixo' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:grid-cols-4">
            <div className="p-3.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20">
              <div className="text-[11px] text-red-600 dark:text-red-400 font-semibold">Itens Críticos / Zerados</div>
              <div className="text-lg font-black text-red-700 dark:text-red-300 mt-0.5">
                {filteredEstoqueBaixo.filter((p) => p.currentStock <= 0).length} produtos
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20">
              <div className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Itens Abaixo do Mínimo</div>
              <div className="text-lg font-black text-amber-700 dark:text-amber-300 mt-0.5">
                {filteredEstoqueBaixo.filter((p) => p.currentStock > 0).length} produtos
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <div className="text-[11px] text-slate-500 font-semibold">Unidades a Comprar</div>
              <div className="text-lg font-black text-purple-600 dark:text-purple-400 mt-0.5 font-mono">
                {filteredEstoqueBaixo.reduce((acc, p) => acc + p.deficit, 0)} un
              </div>
            </div>
            <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900/60 bg-purple-50/50 dark:bg-purple-950/20">
              <div className="text-[11px] text-purple-700 dark:text-purple-300 font-semibold">Orçamento para Reposição</div>
              <div className="text-lg font-black text-purple-700 dark:text-purple-300 mt-0.5 font-mono">
                {formatBRL(filteredEstoqueBaixo.reduce((acc, p) => acc + p.replacementCost, 0))}
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <tr>
                    <th className="py-3 px-4">Gravidade</th>
                    <th className="py-3 px-4">Produto</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4 text-center">Estoque Atual</th>
                    <th className="py-3 px-4 text-center">Estoque Mínimo</th>
                    <th className="py-3 px-4 text-center">Déficit (Comprar)</th>
                    <th className="py-3 px-4 text-right">Custo Unitário</th>
                    <th className="py-3 px-4 text-right">Custo Reposição</th>
                    <th className="py-3 px-4 print:hidden text-center">Ação Recomendada</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono text-slate-700 dark:text-slate-300">
                  {filteredEstoqueBaixo.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-xs text-emerald-600 dark:text-emerald-400 font-sans font-medium">
                        ✓ Nenhum produto com estoque abaixo do mínimo de segurança no momento.
                      </td>
                    </tr>
                  ) : (
                    filteredEstoqueBaixo.map((b) => (
                      <tr key={b.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-2.5 px-4 font-sans">
                          {b.currentStock <= 0 ? (
                            <Badge variant="red" size="sm">Crítico (Zerado)</Badge>
                          ) : (
                            <Badge variant="warning" size="sm">Abaixo Mínimo</Badge>
                          )}
                        </td>
                        <td className="py-2.5 px-4 font-sans font-bold text-slate-900 dark:text-slate-100">
                          {b.name}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-slate-500">
                          {b.category}
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold">
                          <span className={b.currentStock <= 0 ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                            {b.currentStock} un
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-center text-slate-400">
                          {b.minStock} un
                        </td>
                        <td className="py-2.5 px-4 text-center font-bold text-purple-600 dark:text-purple-400">
                          +{b.deficit} un
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {formatBRL(b.costPrice)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-bold text-slate-900 dark:text-slate-100">
                          {formatBRL(b.replacementCost)}
                        </td>
                        <td className="py-2.5 px-4 print:hidden text-center font-sans">
                          {onNavigate && (
                            <button
                              onClick={() => onNavigate('movimentacoes')}
                              className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
                            >
                              Dar Entrada
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. RELATÓRIO: SAÚDE DO NEGÓCIO RESUMIDA */}
      {/* ========================================================================= */}
      {activeReport === 'saude_resumida' && data && (
        <div className="space-y-6">
          {/* Cabeçalho do Score */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-purple-100 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 flex flex-col items-center justify-center font-black text-purple-700 dark:text-purple-300 shrink-0">
                <span className="text-2xl leading-none">{data.saudeResumida.healthScore}</span>
                <span className="text-[9px] uppercase tracking-wider text-purple-500">pts</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                    Diagnóstico Executivo de Saúde
                  </h3>
                  <Badge
                    variant={
                      data.saudeResumida.healthStatus === 'excelente' ||
                      data.saudeResumida.healthStatus === 'saudavel'
                        ? 'green'
                        : data.saudeResumida.healthStatus === 'atencao'
                        ? 'warning'
                        : 'red'
                    }
                  >
                    {data.saudeResumida.healthStatus.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Avaliação automatizada 100% determinística através de 4 pilares de gestão.
                </p>
              </div>
            </div>

            {onNavigate && (
              <Button
                variant="outline"
                size="sm"
                className="print:hidden"
                onClick={() => onNavigate('saude_negocio')}
                rightIcon={<ChevronRight className="w-4 h-4" />}
              >
                Abrir Diagnóstico Completo
              </Button>
            )}
          </div>

          {/* 4 Pilares de Pontuação */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Saúde Financeira
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {data.saudeResumida.healthScorePillars.financialHealth.score}/
                  {data.saudeResumida.healthScorePillars.financialHealth.max}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-purple-600 h-full rounded-full"
                  style={{
                    width: `${(data.saudeResumida.healthScorePillars.financialHealth.score / data.saudeResumida.healthScorePillars.financialHealth.max) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {data.saudeResumida.healthScorePillars.financialHealth.details}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Gestão de Estoque
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {data.saudeResumida.healthScorePillars.inventoryHealth.score}/
                  {data.saudeResumida.healthScorePillars.inventoryHealth.max}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full"
                  style={{
                    width: `${(data.saudeResumida.healthScorePillars.inventoryHealth.score / data.saudeResumida.healthScorePillars.inventoryHealth.max) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {data.saudeResumida.healthScorePillars.inventoryHealth.details}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Margens &amp; Preços
                </span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {data.saudeResumida.healthScorePillars.pricingHealth.score}/
                  {data.saudeResumida.healthScorePillars.pricingHealth.max}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-500 h-full rounded-full"
                  style={{
                    width: `${(data.saudeResumida.healthScorePillars.pricingHealth.score / data.saudeResumida.healthScorePillars.pricingHealth.max) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {data.saudeResumida.healthScorePillars.pricingHealth.details}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Giro Operacional
                </span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                  {data.saudeResumida.healthScorePillars.operationalHealth.score}/
                  {data.saudeResumida.healthScorePillars.operationalHealth.max}
                </span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full"
                  style={{
                    width: `${(data.saudeResumida.healthScorePillars.operationalHealth.score / data.saudeResumida.healthScorePillars.operationalHealth.max) * 100}%`,
                  }}
                />
              </div>
              <p className="text-[11px] text-slate-500">
                {data.saudeResumida.healthScorePillars.operationalHealth.details}
              </p>
            </div>
          </div>

          {/* Destaques e Recomendações em 2 Colunas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* O que vai bem e Pontos de Atenção */}
            <Card id="health-report-highlights" title="Destaques &amp; Alertas da Operação">
              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    O que está indo bem
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {data.saudeResumida.goodPoints.length === 0 ? (
                      <li className="text-slate-400">Sem destaques no período.</li>
                    ) : (
                      data.saudeResumida.goodPoints.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>
                            <strong>{item.title}:</strong> {item.description}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    O que precisa de atenção
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    {data.saudeResumida.attentionPoints.length === 0 ? (
                      <li className="text-slate-400">Nenhum alerta pendente.</li>
                    ) : (
                      data.saudeResumida.attentionPoints.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>
                            <strong>{item.title}:</strong> {item.description}
                          </span>
                        </li>
                      ))
                    )}
                  </ul>
                </div>
              </div>
            </Card>

            {/* Recomendações Práticas */}
            <Card id="health-report-recs" title="Recomendações Práticas Imediatas">
              <div className="space-y-3">
                {data.saudeResumida.recommendations.length === 0 ? (
                  <div className="text-xs text-slate-400 py-6 text-center">
                    Empresa operando de forma equilibrada sem ações urgentes pendentes.
                  </div>
                ) : (
                  data.saudeResumida.recommendations.map((rec) => (
                    <div
                      key={rec.id}
                      className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                          {rec.title}
                        </span>
                        <Badge
                          variant={
                            rec.priority === 'alta'
                              ? 'red'
                              : rec.priority === 'media'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {rec.priority.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {rec.description}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};
