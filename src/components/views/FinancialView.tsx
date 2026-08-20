import React, { useState, useEffect, useMemo } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Plus,
  Minus,
  Search,
  Filter,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wallet,
  Coins,
  Receipt,
  Building2,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  Sparkles,
  PieChart,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { MetricCardSkeleton, CardSkeleton, TableSkeleton } from '../common/Skeleton';
import { useAuth } from '../../contexts/AuthContext';
import { financialService } from '../../services/financialService';
import { companyService } from '../../services/companyService';
import {
  FinancialTransaction,
  FinancialTransactionFormData,
  TransactionType,
  Company,
} from '../../types';

// Helper to get today's date formatted as YYYY-MM-DD
const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const PRESET_RECEITA_CATEGORIES = [
  'Vendas de Produtos',
  'Prestação de Serviços',
  'Rendimentos Financeiros',
  'Reembolsos & Estornos',
  'Outras Receitas',
];

const PRESET_DESPESA_CATEGORIES = [
  'Fornecedores & Mercadorias',
  'Aluguel & Condomínio',
  'Energia, Água & Internet',
  'Salários & Pró-labore',
  'Impostos, MEI & Taxas',
  'Embalagens, Fretes & Entregas',
  'Manutenção & Equipamentos',
  'Marketing & Divulgação',
  'Tarifas Bancárias & Máquina de Cartão',
  'Outras Despesas',
];

const INITIAL_FORM_STATE: FinancialTransactionFormData = {
  type: 'receita',
  description: '',
  amount: '',
  transaction_date: getTodayDateString(),
  category: PRESET_RECEITA_CATEGORIES[0],
  notes: '',
};

type PeriodPreset = 'este_mes' | 'mes_anterior' | 'ultimos_30' | 'ano_atual' | 'todos' | 'customizado';

export const FinancialView: React.FC = () => {
  const { user, companyName } = useAuth();

  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | TransactionType>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<PeriodPreset>('este_mes');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');

  // Modal State (Create / Edit)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FinancialTransactionFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation Modal State
  const [transactionToDelete, setTransactionToDelete] = useState<FinancialTransaction | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Feedback Notification
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load Transactions & Company Data
  const loadFinancialData = async (showRefreshIndicator = false) => {
    if (!user?.id) return;
    if (showRefreshIndicator) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    try {
      const [txRes, compRes] = await Promise.all([
        financialService.getTransactions(user.id),
        companyService.getCompany(user.id),
      ]);

      setTransactions(txRes.data || []);
      setCompany(compRes.data || null);
    } catch (err) {
      console.error('Erro ao carregar dados financeiros:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFinancialData();
  }, [user?.id]);

  // Consolidated Month & Comparative Metrics
  const monthlyMetrics = useMemo(() => {
    return financialService.calculateMetrics(transactions);
  }, [transactions]);

  // Current Month Name in Portuguese
  const currentMonthLabel = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const now = new Date();
    return `${months[now.getMonth()]} de ${now.getFullYear()}`;
  }, []);

  const previousMonthLabel = useMemo(() => {
    const months = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const now = new Date();
    const prevMonthIdx = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
    const prevYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    return `${months[prevMonthIdx]} de ${prevYear}`;
  }, []);

  // Filtered Transactions
  const filteredTransactions = useMemo(() => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // Calculate dates based on period preset
    let startLimit: string | null = null;
    let endLimit: string | null = null;

    if (periodPreset === 'este_mes') {
      const start = new Date(currentYear, currentMonth, 1);
      const end = new Date(currentYear, currentMonth + 1, 0);
      startLimit = start.toISOString().split('T')[0];
      endLimit = end.toISOString().split('T')[0];
    } else if (periodPreset === 'mes_anterior') {
      const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const start = new Date(prevYear, prevMonth, 1);
      const end = new Date(prevYear, prevMonth + 1, 0);
      startLimit = start.toISOString().split('T')[0];
      endLimit = end.toISOString().split('T')[0];
    } else if (periodPreset === 'ultimos_30') {
      const past30 = new Date();
      past30.setDate(past30.getDate() - 30);
      startLimit = past30.toISOString().split('T')[0];
      endLimit = now.toISOString().split('T')[0];
    } else if (periodPreset === 'ano_atual') {
      startLimit = `${currentYear}-01-01`;
      endLimit = `${currentYear}-12-31`;
    } else if (periodPreset === 'customizado') {
      startLimit = customStartDate || null;
      endLimit = customEndDate || null;
    }

    return transactions.filter((tx) => {
      // 1. Type Filter
      if (selectedType !== 'all' && tx.type !== selectedType) {
        return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all' && tx.category !== selectedCategory) {
        return false;
      }

      // 3. Date Range Filter
      if (startLimit && tx.transaction_date < startLimit) {
        return false;
      }
      if (endLimit && tx.transaction_date > endLimit) {
        return false;
      }

      // 4. Search Filter (description, notes, category)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const descMatch = tx.description.toLowerCase().includes(query);
        const catMatch = tx.category.toLowerCase().includes(query);
        const notesMatch = tx.notes ? tx.notes.toLowerCase().includes(query) : false;
        if (!descMatch && !catMatch && !notesMatch) {
          return false;
        }
      }

      return true;
    });
  }, [transactions, selectedType, selectedCategory, periodPreset, customStartDate, customEndDate, searchTerm]);

  // Filtered Period Totals (for filtered summary)
  const filteredSummary = useMemo(() => {
    let totalReceitas = 0;
    let totalDespesas = 0;
    let receitasCount = 0;
    let despesasCount = 0;

    filteredTransactions.forEach((tx) => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'receita') {
        totalReceitas += amt;
        receitasCount += 1;
      } else if (tx.type === 'despesa') {
        totalDespesas += amt;
        despesasCount += 1;
      }
    });

    const saldoLiquido = totalReceitas - totalDespesas;

    // Categories breakdown
    const categoryTotals: { [key: string]: { type: TransactionType; amount: number } } = {};
    filteredTransactions.forEach((tx) => {
      if (!categoryTotals[tx.category]) {
        categoryTotals[tx.category] = { type: tx.type, amount: 0 };
      }
      categoryTotals[tx.category].amount += Number(tx.amount) || 0;
    });

    const topCategories = Object.entries(categoryTotals)
      .map(([name, data]) => ({ name, type: data.type, amount: data.amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return {
      totalReceitas,
      totalDespesas,
      saldoLiquido,
      receitasCount,
      despesasCount,
      totalCount: filteredTransactions.length,
      topCategories,
    };
  }, [filteredTransactions]);

  // Unique Categories for Filter Dropdown
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    transactions.forEach((tx) => {
      if (tx.category) cats.add(tx.category);
    });
    return Array.from(cats).sort();
  }, [transactions]);

  // Open Modal to Create
  const handleOpenCreateModal = (defaultType: TransactionType = 'receita') => {
    setEditingTransactionId(null);
    setFormData({
      type: defaultType,
      description: '',
      amount: '',
      transaction_date: getTodayDateString(),
      category: defaultType === 'receita' ? PRESET_RECEITA_CATEGORIES[0] : PRESET_DESPESA_CATEGORIES[0],
      notes: '',
    });
    setFeedback({ type: null, message: '' });
    setIsModalOpen(true);
  };

  // Open Modal to Edit
  const handleOpenEditModal = (tx: FinancialTransaction) => {
    setEditingTransactionId(tx.id || null);
    setFormData({
      type: tx.type,
      description: tx.description,
      amount: tx.amount,
      transaction_date: tx.transaction_date,
      category: tx.category,
      notes: tx.notes || '',
    });
    setFeedback({ type: null, message: '' });
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingTransactionId(null);
    setFormData(INITIAL_FORM_STATE);
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;

    // Validation
    if (!formData.description.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, informe a descrição do lançamento.' });
      return;
    }

    const numAmount = Number(formData.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFeedback({ type: 'error', message: 'O valor do lançamento deve ser maior que zero (R$ 0,01).' });
      return;
    }

    if (!formData.transaction_date) {
      setFeedback({ type: 'error', message: 'Por favor, informe a data do lançamento.' });
      return;
    }

    if (!formData.category.trim()) {
      setFeedback({ type: 'error', message: 'Por favor, selecione ou informe a categoria.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      if (editingTransactionId) {
        // Update existing transaction
        const { data, error } = await financialService.updateTransaction(
          user.id,
          editingTransactionId,
          formData
        );

        if (error) {
          setFeedback({ type: 'error', message: `Erro ao atualizar: ${error}` });
          setIsSubmitting(false);
          return;
        }

        // Update local state
        setTransactions((prev) =>
          prev.map((t) => (t.id === editingTransactionId ? { ...t, ...data! } : t))
        );
      } else {
        // Create new transaction
        const { data, error } = await financialService.createTransaction(
          user.id,
          formData,
          company?.id
        );

        if (error) {
          setFeedback({ type: 'error', message: `Erro ao salvar: ${error}` });
          setIsSubmitting(false);
          return;
        }

        if (data) {
          setTransactions((prev) => [data, ...prev]);
        }
      }

      setIsModalOpen(false);
      setEditingTransactionId(null);
      setFormData(INITIAL_FORM_STATE);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err?.message || 'Erro inesperado ao salvar lançamento.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleDeleteTransaction = async () => {
    if (!user?.id || !transactionToDelete?.id) return;
    setIsDeleting(true);

    try {
      const { success, error } = await financialService.deleteTransaction(
        user.id,
        transactionToDelete.id
      );

      if (error || !success) {
        alert(`Erro ao excluir lançamento: ${error || 'Falha na exclusão.'}`);
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== transactionToDelete.id));
      }
    } catch (err: any) {
      alert(`Falha ao excluir: ${err?.message || 'Erro desconhecido.'}`);
    } finally {
      setIsDeleting(false);
      setTransactionToDelete(null);
    }
  };

  // Helper currency formatter (R$ 1.234,56)
  const formatCurrency = (val: number): string => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  // Helper date formatter (DD/MM/YYYY)
  const formatDateBR = (dateStr: string): string => {
    try {
      if (!dateStr) return '';
      const [year, month, day] = dateStr.split('-');
      if (year && month && day) {
        return `${day}/${month}/${year}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. HEADER BANNER DA IDENTIDADE VISUAL ANT */}
      {/* ========================================================================= */}
      <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 rounded-3xl p-5 sm:p-7 text-white shadow-md relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-white/5 rounded-full blur-2xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute right-1/3 bottom-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-lg bg-white/10 backdrop-blur-md text-[11px] font-bold tracking-wider uppercase text-purple-200 border border-white/15 inline-flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Gestão Financeira
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Supabase RLS Protegido
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-white flex items-center gap-2.5">
              <span>Financeiro: {company?.company_name || companyName || 'Minha Microempresa'}</span>
            </h1>
            <p className="text-xs sm:text-sm text-purple-100/80 max-w-2xl leading-relaxed">
              Registre receitas e despesas, acompanhe a lucratividade do mês atual e compare o desempenho de faturamento com o período anterior com precisão determinística.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => loadFinancialData(true)}
              disabled={isRefreshing || isLoading}
              title="Atualizar dados do Supabase"
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 active:bg-white/30 text-white transition-all cursor-pointer border border-white/15"
            >
              <RotateCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={() => handleOpenCreateModal('receita')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Receita</span>
            </button>

            <button
              onClick={() => handleOpenCreateModal('despesa')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer border border-purple-500/40"
            >
              <Minus className="w-4 h-4" />
              <span>Nova Despesa</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. INDICADORES DO MÊS & COMPARATIVOS (KPIS) */}
      {/* ========================================================================= */}
      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <MetricCardSkeleton />
            <MetricCardSkeleton />
          </div>
          <CardSkeleton rows={5} />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* KPI 1: Receita Total do Mês */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-300 dark:hover:border-emerald-700 rounded-2xl p-5 shadow-2xs transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Receita do Mês
                </span>
                <span className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <ArrowDownLeft className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {formatCurrency(monthlyMetrics.currentMonthRevenue)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>{currentMonthLabel}</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {monthlyMetrics.currentMonthRevenueCount} {monthlyMetrics.currentMonthRevenueCount === 1 ? 'entrada' : 'entradas'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 2: Despesa Total do Mês */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 rounded-2xl p-5 shadow-2xs transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Despesas do Mês
                </span>
                <span className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 tracking-tight">
                  {formatCurrency(monthlyMetrics.currentMonthExpense)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>{currentMonthLabel}</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                    {monthlyMetrics.currentMonthExpenseCount} {monthlyMetrics.currentMonthExpenseCount === 1 ? 'saída' : 'saídas'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 3: Lucro do Mês */}
            <div
              className={`bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-2xs transition-all ${
                monthlyMetrics.currentMonthProfit >= 0
                  ? 'border-emerald-200 dark:border-emerald-900/60 hover:border-emerald-400'
                  : 'border-rose-200 dark:border-rose-900/60 hover:border-rose-400'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Lucro do Mês
                </span>
                <span
                  className={`p-2 rounded-xl ${
                    monthlyMetrics.currentMonthProfit >= 0
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div
                  className={`text-2xl sm:text-3xl font-black tracking-tight ${
                    monthlyMetrics.currentMonthProfit >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(monthlyMetrics.currentMonthProfit)}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-400 flex items-center justify-between">
                  <span>Resultado Líquido</span>
                  <span
                    className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                      monthlyMetrics.currentMonthProfit >= 0
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300'
                    }`}
                  >
                    {monthlyMetrics.currentMonthProfit >= 0 ? 'Superávit' : 'Déficit'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI 4: Comparação com Mês Anterior */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 rounded-2xl p-5 shadow-2xs transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Mês Anterior
                </span>
                <span className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
              </div>
              <div className="mt-3">
                <div className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-200 tracking-tight">
                  {formatCurrency(monthlyMetrics.previousMonthRevenue)}
                </div>
                <div className="mt-1 text-xs font-medium flex items-center justify-between">
                  <span className="text-slate-400 text-[11px] truncate max-w-[100px]" title={previousMonthLabel}>
                    {previousMonthLabel}
                  </span>
                  {monthlyMetrics.revenueGrowthPercentage !== null && (
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-black px-1.5 py-0.5 rounded ${
                        monthlyMetrics.revenueGrowthPercentage > 0
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                          : monthlyMetrics.revenueGrowthPercentage < 0
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                          : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {monthlyMetrics.revenueGrowthPercentage > 0 ? (
                        <TrendingUp className="w-3 h-3" />
                      ) : monthlyMetrics.revenueGrowthPercentage < 0 ? (
                        <TrendingDown className="w-3 h-3" />
                      ) : null}
                      {monthlyMetrics.revenueGrowthPercentage >= 0 ? '+' : ''}
                      {monthlyMetrics.revenueGrowthPercentage.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. FILTROS POR PERÍODO, TIPO, CATEGORIA E BUSCA */}
          {/* ========================================================================= */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-2xs space-y-4">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              {/* Presets de Período */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-purple-600" />
                  Período:
                </span>

                <button
                  onClick={() => setPeriodPreset('este_mes')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    periodPreset === 'este_mes'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Este Mês
                </button>

                <button
                  onClick={() => setPeriodPreset('mes_anterior')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    periodPreset === 'mes_anterior'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Mês Anterior
                </button>

                <button
                  onClick={() => setPeriodPreset('ultimos_30')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    periodPreset === 'ultimos_30'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Últimos 30 Dias
                </button>

                <button
                  onClick={() => setPeriodPreset('ano_atual')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    periodPreset === 'ano_atual'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Ano Atual
                </button>

                <button
                  onClick={() => setPeriodPreset('todos')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    periodPreset === 'todos'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Todos
                </button>

                <button
                  onClick={() => setPeriodPreset('customizado')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    periodPreset === 'customizado'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-50 hover:text-purple-700'
                  }`}
                >
                  Personalizado
                </button>
              </div>

              {/* Filtro por Tipo de Lançamento (Abas) */}
              <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
                <button
                  onClick={() => setSelectedType('all')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedType === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                  }`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setSelectedType('receita')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedType === 'receita'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                  }`}
                >
                  <ArrowDownLeft className="w-3 h-3" />
                  Receitas
                </button>
                <button
                  onClick={() => setSelectedType('despesa')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    selectedType === 'despesa'
                      ? 'bg-rose-600 text-white shadow-2xs'
                      : 'text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30'
                  }`}
                >
                  <ArrowUpRight className="w-3 h-3" />
                  Despesas
                </button>
              </div>
            </div>

            {/* Segunda Linha de Filtros: Datas Personalizadas, Categoria e Busca */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800/80">
              {/* Campo de Busca */}
              <div className="lg:col-span-4 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por descrição ou observação..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filtro de Categoria */}
              <div className="lg:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="all">Todas as Categorias</option>
                  {uniqueCategories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Datas customizadas (quando selecionado "personalizado" ou como atalho adicional) */}
              {periodPreset === 'customizado' && (
                <>
                  <div className="lg:col-span-2">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      placeholder="Data Inicial"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div className="lg:col-span-2">
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      placeholder="Data Final"
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                    />
                  </div>
                  <div className="lg:col-span-1 flex items-center">
                    <button
                      onClick={() => {
                        setCustomStartDate('');
                        setCustomEndDate('');
                      }}
                      title="Limpar datas"
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 text-xs font-semibold"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 4. RESUMO DO PERÍODO FILTRADO */}
          {/* ========================================================================= */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Receitas do Filtro */}
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                  Receitas no Filtro
                </span>
                <div className="text-xl font-black text-emerald-700 dark:text-emerald-400 mt-1">
                  {formatCurrency(filteredSummary.totalReceitas)}
                </div>
                <div className="text-[11px] text-emerald-600/80 font-medium">
                  {filteredSummary.receitasCount} {filteredSummary.receitasCount === 1 ? 'lançamento' : 'lançamentos'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
                <ArrowDownLeft className="w-5 h-5" />
              </div>
            </div>

            {/* Total Despesas do Filtro */}
            <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-rose-800 dark:text-rose-300 uppercase tracking-wider">
                  Despesas no Filtro
                </span>
                <div className="text-xl font-black text-rose-700 dark:text-rose-400 mt-1">
                  {formatCurrency(filteredSummary.totalDespesas)}
                </div>
                <div className="text-[11px] text-rose-600/80 font-medium">
                  {filteredSummary.despesasCount} {filteredSummary.despesasCount === 1 ? 'lançamento' : 'lançamentos'}
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-900/50 dark:text-rose-300">
                <ArrowUpRight className="w-5 h-5" />
              </div>
            </div>

            {/* Saldo Líquido do Filtro */}
            <div
              className={`p-4 rounded-2xl border flex items-center justify-between ${
                filteredSummary.saldoLiquido >= 0
                  ? 'bg-purple-50/60 dark:bg-purple-950/20 border-purple-200 dark:border-purple-900/50'
                  : 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
              }`}
            >
              <div>
                <span className="text-[11px] font-bold text-purple-800 dark:text-purple-300 uppercase tracking-wider">
                  Saldo Líquido no Filtro
                </span>
                <div
                  className={`text-xl font-black mt-1 ${
                    filteredSummary.saldoLiquido >= 0
                      ? 'text-purple-700 dark:text-purple-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatCurrency(filteredSummary.saldoLiquido)}
                </div>
                <div className="text-[11px] text-purple-600/80 font-medium">
                  Total de {filteredSummary.totalCount} lançamentos
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                <Wallet className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 5. HISTÓRICO FINANCEIRO (TABELA & CARDS) */}
          {/* ========================================================================= */}
          <Card
            id="financial-history-card"
            title="Histórico de Lançamentos"
            subtitle={`${filteredTransactions.length} lançamentos encontrados no período selecionado`}
            headerAction={
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenCreateModal('receita')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Receita</span>
                </button>
                <button
                  onClick={() => handleOpenCreateModal('despesa')}
                  className="px-2.5 py-1 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                >
                  <Minus className="w-3.5 h-3.5" />
                  <span>Despesa</span>
                </button>
              </div>
            }
          >
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
                <Receipt className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Nenhum lançamento financeiro encontrado
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  Não existem receitas ou despesas para o período e filtros selecionados. Cadastre uma nova movimentação para iniciar seu fluxo de caixa.
                </p>
                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={() => handleOpenCreateModal('receita')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Registrar Receita</span>
                  </button>
                  <button
                    onClick={() => handleOpenCreateModal('despesa')}
                    className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-xs"
                  >
                    <Minus className="w-4 h-4" />
                    <span>Registrar Despesa</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="pb-3 px-3">Tipo</th>
                      <th className="pb-3 px-3">Descrição</th>
                      <th className="pb-3 px-3">Categoria</th>
                      <th className="pb-3 px-3">Data</th>
                      <th className="pb-3 px-3 text-right">Valor</th>
                      <th className="pb-3 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs sm:text-sm">
                    {filteredTransactions.map((tx) => {
                      const isReceita = tx.type === 'receita';

                      return (
                        <tr
                          key={tx.id}
                          className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors group"
                        >
                          {/* Tipo */}
                          <td className="py-3 px-3 align-middle">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold ${
                                isReceita
                                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300'
                              }`}
                            >
                              {isReceita ? (
                                <>
                                  <ArrowDownLeft className="w-3.5 h-3.5" />
                                  Receita
                                </>
                              ) : (
                                <>
                                  <ArrowUpRight className="w-3.5 h-3.5" />
                                  Despesa
                                </>
                              )}
                            </span>
                          </td>

                          {/* Descrição & Observação */}
                          <td className="py-3 px-3 align-middle">
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {tx.description}
                            </div>
                            {tx.notes && (
                              <div className="text-[11px] text-slate-400 mt-0.5 italic flex items-center gap-1">
                                <span>Obs: {tx.notes}</span>
                              </div>
                            )}
                          </td>

                          {/* Categoria */}
                          <td className="py-3 px-3 align-middle">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
                              {tx.category}
                            </span>
                          </td>

                          {/* Data */}
                          <td className="py-3 px-3 align-middle text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-slate-400" />
                              {formatDateBR(tx.transaction_date)}
                            </span>
                          </td>

                          {/* Valor */}
                          <td className="py-3 px-3 align-middle text-right font-mono font-black text-sm whitespace-nowrap">
                            <span
                              className={
                                isReceita
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }
                            >
                              {isReceita ? '+' : '-'}
                              {formatCurrency(tx.amount)}
                            </span>
                          </td>

                          {/* Ações */}
                          <td className="py-3 px-3 align-middle text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleOpenEditModal(tx)}
                                title="Editar lançamento"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setTransactionToDelete(tx)}
                                title="Excluir lançamento"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </>
      )}

      {/* ========================================================================= */}
      {/* 6. MODAL DE CADASTRO / EDIÇÃO DE RECEITA OU DESPESA */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  {formData.type === 'receita' ? (
                    <span className="p-1.5 rounded-xl bg-emerald-100 text-emerald-700">
                      <ArrowDownLeft className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1.5 rounded-xl bg-rose-100 text-rose-700">
                      <ArrowUpRight className="w-4 h-4" />
                    </span>
                  )}
                  <span>
                    {editingTransactionId
                      ? `Editar ${formData.type === 'receita' ? 'Receita' : 'Despesa'}`
                      : `Nova ${formData.type === 'receita' ? 'Receita' : 'Despesa'}`}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Preencha os campos para salvar a movimentação no Supabase.
                </p>
              </div>

              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {/* Type Switcher (only if creating new) */}
              {!editingTransactionId && (
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        type: 'receita',
                        category: PRESET_RECEITA_CATEGORIES[0],
                      }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.type === 'receita'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-emerald-700'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Receita (Entrada)
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({
                        ...prev,
                        type: 'despesa',
                        category: PRESET_DESPESA_CATEGORIES[0],
                      }));
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.type === 'despesa'
                        ? 'bg-rose-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-300 hover:text-rose-700'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4" />
                    Despesa (Saída)
                  </button>
                </div>
              )}

              {/* Feedback Alert */}
              {feedback.type && (
                <div
                  className={`p-3 rounded-2xl text-xs font-medium flex items-center gap-2 ${
                    feedback.type === 'error'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:border-rose-900'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900'
                  }`}
                >
                  {feedback.type === 'error' ? (
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  )}
                  <span>{feedback.message}</span>
                </div>
              )}

              {/* Campo: Descrição */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Descrição do Lançamento *
                </label>
                <input
                  type="text"
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={
                    formData.type === 'receita'
                      ? 'Ex: Venda no balcão, Contrato de serviço...'
                      : 'Ex: Compra de mercadorias, Conta de luz, Aluguel...'
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-medium"
                />
              </div>

              {/* Grid: Valor e Data */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Campo: Valor (R$) */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Valor (R$) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0,00"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono font-bold"
                    />
                  </div>
                </div>

                {/* Campo: Data */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                    Data do Lançamento *
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.transaction_date}
                    onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 font-mono"
                  />
                </div>
              </div>

              {/* Campo: Categoria */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Categoria *
                </label>
                <div className="space-y-2">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600"
                  >
                    {(formData.type === 'receita'
                      ? PRESET_RECEITA_CATEGORIES
                      : PRESET_DESPESA_CATEGORIES
                    ).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  {/* Sugestões rápidas em chips */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {(formData.type === 'receita'
                      ? PRESET_RECEITA_CATEGORIES.slice(0, 3)
                      : PRESET_DESPESA_CATEGORIES.slice(0, 4)
                    ).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setFormData({ ...formData, category: cat })}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md transition-all cursor-pointer ${
                          formData.category === cat
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-purple-50 hover:text-purple-700'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Campo: Observação Opcional */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  Observação <span className="text-slate-400 font-normal lowercase">(opcional)</span>
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Informações adicionais, número de nota fiscal, forma de pagamento..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs sm:text-sm font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer ${
                    formData.type === 'receita'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>
                    {isSubmitting
                      ? 'Salvando...'
                      : editingTransactionId
                      ? 'Salvar Alterações'
                      : formData.type === 'receita'
                      ? 'Registrar Receita'
                      : 'Registrar Despesa'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {/* ========================================================================= */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-md w-full p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                  Excluir Lançamento Financeiro?
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Esta ação removerá o registro permanentemente do Supabase.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-slate-100">
                {transactionToDelete.description}
              </div>
              <div className="flex items-center justify-between text-slate-500">
                <span>{transactionToDelete.category}</span>
                <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                  {formatCurrency(transactionToDelete.amount)}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Data: {formatDateBR(transactionToDelete.transaction_date)}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 text-xs font-bold transition-all cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteTransaction}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>{isDeleting ? 'Excluindo...' : 'Sim, Excluir'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
