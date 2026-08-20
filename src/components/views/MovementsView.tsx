import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeftRight,
  ArrowDownLeft,
  ArrowUpRight,
  Plus,
  Search,
  Filter,
  Calendar,
  Package,
  Boxes,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  ShieldCheck,
  Building2,
  Save,
  RotateCcw,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { movementService } from '../../services/movementService';
import { productService } from '../../services/productService';
import { StockMovement, MovementFormData, MovementType, Product } from '../../types';

// Helper to get local ISO string for datetime-local input
const getLocalCurrentDateTimeString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

const INITIAL_FORM_STATE: MovementFormData = {
  product_id: '',
  type: 'entrada',
  quantity: '',
  movement_date: getLocalCurrentDateTimeString(),
  notes: '',
};

export const MovementsView: React.FC = () => {
  const { user, companyName } = useAuth();

  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters state
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<'all' | MovementType>('all');
  const [selectedProductId, setSelectedProductId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formData, setFormData] = useState<MovementFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Feedback notification
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load data
  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [movRes, prodRes] = await Promise.all([
        movementService.getMovements(user.id),
        productService.getProducts(user.id),
      ]);

      setMovements(movRes.data || []);
      setProducts(prodRes.data || []);
    } catch (err) {
      console.error('Erro ao carregar movimentações e produtos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Open modal
  const handleOpenModal = (defaultType: MovementType = 'entrada') => {
    const defaultProduct = products.length > 0 ? products[0].id || '' : '';
    setFormData({
      product_id: defaultProduct,
      type: defaultType,
      quantity: '',
      movement_date: getLocalCurrentDateTimeString(),
      notes: '',
    });
    setFeedback({ type: null, message: '' });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setFormData(INITIAL_FORM_STATE);
  };

  // Selected product object for real-time validation in form
  const currentSelectedProduct = useMemo(() => {
    return products.find((p) => p.id === formData.product_id) || null;
  }, [products, formData.product_id]);

  // Calculated stock preview
  const stockPreview = useMemo(() => {
    if (!currentSelectedProduct) return null;
    const current = Number(currentSelectedProduct.current_stock) || 0;
    const qty = Number(formData.quantity);

    if (isNaN(qty) || qty <= 0) {
      return {
        current,
        after: current,
        isValid: true,
        diff: 0,
      };
    }

    if (formData.type === 'entrada') {
      return {
        current,
        after: current + qty,
        isValid: true,
        diff: +qty,
      };
    } else {
      const after = current - qty;
      return {
        current,
        after,
        isValid: after >= 0,
        diff: -qty,
      };
    }
  }, [currentSelectedProduct, formData.quantity, formData.type]);

  // Submit new movement
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Usuário não autenticado.' });
      return;
    }

    if (!formData.product_id) {
      setFeedback({ type: 'error', message: 'Selecione um produto cadastrado.' });
      return;
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      setFeedback({ type: 'error', message: 'A quantidade deve ser um número maior que zero.' });
      return;
    }

    if (formData.type === 'saida' && currentSelectedProduct) {
      const currentStock = Number(currentSelectedProduct.current_stock) || 0;
      if (qty > currentStock) {
        setFeedback({
          type: 'error',
          message: `Estoque insuficiente para saída. Saldo atual: ${currentStock} un. (Solicitado: ${qty} un.)`,
        });
        return;
      }
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      const { data, error } = await movementService.createMovement(user.id, formData);

      if (error) {
        setFeedback({ type: 'error', message: error });
      } else if (data) {
        // Atualiza a lista de movimentações
        setMovements((prev) => [data, ...prev]);

        // Atualiza a lista de produtos com o novo estoque
        setProducts((prev) =>
          prev.map((p) => {
            if (p.id === formData.product_id) {
              const prevStock = Number(p.current_stock) || 0;
              const newStock = formData.type === 'entrada' ? prevStock + qty : prevStock - qty;
              return { ...p, current_stock: newStock };
            }
            return p;
          })
        );

        setIsModalOpen(false);
        const actionLabel = formData.type === 'entrada' ? 'Entrada de' : 'Saída de';
        setFeedback({
          type: 'success',
          message: `${actionLabel} ${qty} un. do produto "${currentSelectedProduct?.name || 'Item'}" registrada com sucesso!`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao registrar movimentação.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered movements list
  const filteredMovements = useMemo(() => {
    return movements.filter((item) => {
      // Filter by type
      if (selectedType !== 'all' && item.type !== selectedType) {
        return false;
      }

      // Filter by product
      if (selectedProductId !== 'all' && item.product_id !== selectedProductId) {
        return false;
      }

      // Filter by search term
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const prodName = (item.product_name || item.product?.name || '').toLowerCase();
        const notes = (item.notes || '').toLowerCase();
        if (!prodName.includes(term) && !notes.includes(term)) {
          return false;
        }
      }

      // Filter by date range
      if (startDate) {
        const movDate = new Date(item.movement_date).toISOString().slice(0, 10);
        if (movDate < startDate) return false;
      }
      if (endDate) {
        const movDate = new Date(item.movement_date).toISOString().slice(0, 10);
        if (movDate > endDate) return false;
      }

      return true;
    });
  }, [movements, selectedType, selectedProductId, searchTerm, startDate, endDate]);

  // Format date helper
  const formatDate = (dateStr: string) => {
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

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedType('all');
    setSelectedProductId('all');
    setStartDate('');
    setEndDate('');
  };

  const hasActiveFilters =
    searchTerm || selectedType !== 'all' || selectedProductId !== 'all' || startDate || endDate;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
              <ArrowLeftRight className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Movimentações de Estoque
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro e histórico de entradas e saídas com atualização automática de saldo da empresa{' '}
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              {companyName}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <Badge variant="purple" size="md">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 inline text-purple-600 dark:text-purple-400" />
            Supabase RLS
          </Badge>

          <button
            onClick={() => handleOpenModal('entrada')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs sm:text-sm font-bold shadow-xs shadow-emerald-200 dark:shadow-none transition-all cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Registrar Entrada</span>
          </button>

          <button
            onClick={() => handleOpenModal('saida')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs shadow-purple-200 dark:shadow-none transition-all cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Registrar Saída</span>
          </button>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback.type === 'success' && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-xs sm:text-sm text-emerald-800 dark:text-emerald-300 flex items-start gap-2.5 justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: null, message: '' })}
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {feedback.type === 'error' && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/40 text-xs sm:text-sm text-rose-800 dark:text-rose-300 flex items-start gap-2.5 justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback({ type: null, message: '' })}
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400 p-0.5"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Filters Section */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">
            <Filter className="w-3.5 h-3.5 text-purple-600" />
            <span>Filtros de Movimentações</span>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1 text-xs text-purple-600 hover:text-purple-700 dark:text-purple-400 font-semibold"
            >
              <RotateCcw className="w-3 h-3" />
              Limpar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search by name/notes */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por produto ou observação..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">Todos os Tipos (Entradas & Saídas)</option>
              <option value="entrada">Apenas Entradas (+)</option>
              <option value="saida">Apenas Saídas (-)</option>
            </select>
          </div>

          {/* Product Filter */}
          <div>
            <select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
            >
              <option value="all">Todos os Produtos</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} (Estoque: {p.current_stock} un.)
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-1.5">
            <div className="relative">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Data Inicial"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              />
            </div>
            <div className="relative">
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                title="Data Final"
                className="w-full px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: History Card */}
      <Card
        id="movements-history-card"
        title="Histórico de Movimentações"
        subtitle={`Exibindo ${filteredMovements.length} de ${movements.length} movimentações registradas`}
      >
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-xs font-medium">Carregando histórico de movimentações...</span>
          </div>
        ) : products.length === 0 ? (
          /* Notice when no products are available to move */
          <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
              <Package className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Nenhum produto cadastrado no catálogo
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Para registrar entradas e saídas de estoque, cadastre primeiro os produtos no módulo de Produtos.
            </p>
          </div>
        ) : movements.length === 0 ? (
          /* Empty state when no movements yet */
          <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-2xs">
              <ArrowLeftRight className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Nenhuma movimentação registrada
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Registre entradas de novas compras ou saídas de vendas para que o ANT mantenha o estoque da empresa sempre atualizado.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => handleOpenModal('entrada')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Registrar Entrada</span>
              </button>
              <button
                onClick={() => handleOpenModal('saida')}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Registrar Saída</span>
              </button>
            </div>
          </div>
        ) : filteredMovements.length === 0 ? (
          /* Empty state when search filters yield no results */
          <div className="text-center py-12 px-4 text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nenhuma movimentação encontrada com os filtros selecionados.
            </p>
            <button
              onClick={handleResetFilters}
              className="text-xs text-purple-600 font-bold hover:underline"
            >
              Limpar filtros de busca
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Tipo</th>
                    <th className="pb-3 px-3">Produto</th>
                    <th className="pb-3 px-3 text-center">Quantidade</th>
                    <th className="pb-3 px-3">Data e Hora</th>
                    <th className="pb-3 px-3">Observação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredMovements.map((mov) => {
                    const isEntrada = mov.type === 'entrada';
                    const productName = mov.product_name || mov.product?.name || 'Produto';

                    return (
                      <tr
                        key={mov.id}
                        className="hover:bg-purple-50/30 dark:hover:bg-purple-950/10 transition-colors"
                      >
                        {/* Tipo Badge */}
                        <td className="py-3 px-3">
                          {isEntrada ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[11px]">
                              <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                              Entrada
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[11px]">
                              <ArrowUpRight className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                              Saída
                            </span>
                          )}
                        </td>

                        {/* Produto */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {productName}
                          </div>
                          {mov.product?.category && (
                            <span className="text-[10px] text-slate-400">
                              {mov.product.category}
                            </span>
                          )}
                        </td>

                        {/* Quantidade */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`font-black font-mono text-xs ${
                              isEntrada
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-purple-700 dark:text-purple-400'
                            }`}
                          >
                            {isEntrada ? `+${mov.quantity}` : `-${mov.quantity}`} un.
                          </span>
                        </td>

                        {/* Data e Hora */}
                        <td className="py-3 px-3 text-slate-600 dark:text-slate-400 font-medium">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(mov.movement_date)}</span>
                          </div>
                        </td>

                        {/* Observação */}
                        <td className="py-3 px-3 text-slate-500 dark:text-slate-400 max-w-[250px] truncate">
                          {mov.notes ? (
                            <span>{mov.notes}</span>
                          ) : (
                            <span className="text-slate-300 dark:text-slate-600 italic">
                              Sem observações
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:hidden">
              {filteredMovements.map((mov) => {
                const isEntrada = mov.type === 'entrada';
                const productName = mov.product_name || mov.product?.name || 'Produto';

                return (
                  <div
                    key={mov.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        {isEntrada ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 font-bold text-[10px]">
                            <ArrowDownLeft className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                            Entrada
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 font-bold text-[10px]">
                            <ArrowUpRight className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                            Saída
                          </span>
                        )}
                        <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-1">
                          {productName}
                        </h4>
                      </div>

                      <div className="text-right">
                        <span
                          className={`font-black font-mono text-sm ${
                            isEntrada
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-purple-700 dark:text-purple-400'
                          }`}
                        >
                          {isEntrada ? `+${mov.quantity}` : `-${mov.quantity}`} un.
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatDate(mov.movement_date)}</span>
                      </div>
                    </div>

                    {mov.notes && (
                      <p className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                        {mov.notes}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* Movement Registration Modal */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div
                  className={`p-2 rounded-xl ${
                    formData.type === 'entrada'
                      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                      : 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-400'
                  }`}
                >
                  {formData.type === 'entrada' ? (
                    <ArrowDownLeft className="w-5 h-5" />
                  ) : (
                    <ArrowUpRight className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    Registrar {formData.type === 'entrada' ? 'Entrada de Estoque' : 'Saída de Estoque'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    O saldo do produto será atualizado automaticamente.
                  </p>
                </div>
              </div>

              <button
                onClick={handleCloseModal}
                disabled={isSubmitting}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Type Switcher Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5">
                  Tipo de Movimentação
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60">
                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'entrada' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.type === 'entrada'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                    <span>Entrada (+)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, type: 'saida' }))}
                    className={`py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      formData.type === 'saida'
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-400 shadow-xs'
                        : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 text-purple-600" />
                    <span>Saída (-)</span>
                  </button>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label
                  htmlFor="modal_mov_product"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                >
                  <Package className="w-3.5 h-3.5 text-purple-600" />
                  Produto <span className="text-purple-600">*</span>
                </label>
                <select
                  id="modal_mov_product"
                  required
                  value={formData.product_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, product_id: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                >
                  <option value="" disabled>
                    Selecione o produto...
                  </option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} (Estoque atual: {p.current_stock} un.)
                    </option>
                  ))}
                </select>
              </div>

              {/* Quantity & Datetime */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Quantity */}
                <div>
                  <label
                    htmlFor="modal_mov_qty"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                  >
                    <Boxes className="w-3.5 h-3.5 text-purple-600" />
                    Quantidade <span className="text-purple-600">*</span>
                  </label>
                  <input
                    id="modal_mov_qty"
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                    placeholder="Ex: 5"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-mono shadow-2xs"
                  />
                </div>

                {/* Date and Time */}
                <div>
                  <label
                    htmlFor="modal_mov_date"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5 text-purple-600" />
                    Data e Hora <span className="text-purple-600">*</span>
                  </label>
                  <input
                    id="modal_mov_date"
                    type="datetime-local"
                    required
                    value={formData.movement_date}
                    onChange={(e) => setFormData((prev) => ({ ...prev, movement_date: e.target.value }))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 shadow-2xs"
                  />
                </div>
              </div>

              {/* Stock Preview Calculation Box */}
              {stockPreview && currentSelectedProduct && (
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    stockPreview.isValid
                      ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700'
                      : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      Estoque Atual:
                    </span>
                    <span className="font-bold font-mono text-slate-900 dark:text-slate-100">
                      {stockPreview.current} un.
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60">
                    <span className="font-bold text-slate-700 dark:text-slate-300">
                      Estoque Previsto Após Movimentação:
                    </span>
                    <span
                      className={`font-black font-mono ${
                        !stockPreview.isValid
                          ? 'text-rose-600 font-black'
                          : formData.type === 'entrada'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-purple-700 dark:text-purple-400'
                      }`}
                    >
                      {stockPreview.after} un.
                    </span>
                  </div>

                  {!stockPreview.isValid && (
                    <div className="mt-2 text-rose-600 dark:text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Saldo insuficiente para efetuar esta saída de estoque.</span>
                    </div>
                  )}
                </div>
              )}

              {/* Optional Notes */}
              <div>
                <label
                  htmlFor="modal_mov_notes"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-purple-600" />
                  Observação (Opcional)
                </label>
                <input
                  id="modal_mov_notes"
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Ex: Compra NF 1029 / Venda balcão / Ajuste de inventário"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 shadow-2xs"
                />
              </div>

              {/* Modal Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  disabled={isSubmitting || (stockPreview ? !stockPreview.isValid : false)}
                  className={`inline-flex items-center gap-2 px-5 py-2 rounded-xl text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.type === 'entrada'
                      ? 'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800'
                      : 'bg-purple-600 hover:bg-purple-700 active:bg-purple-800'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>
                        Confirmar {formData.type === 'entrada' ? 'Entrada' : 'Saída'}
                      </span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
