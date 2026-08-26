import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Zap,
  Barcode,
  Search,
  ShoppingCart,
  DollarSign,
  Package,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Clock,
  User,
  CreditCard,
  Banknote,
  QrCode,
  Layers,
  Printer,
  RotateCcw,
  Tag,
  ArrowRight,
  TrendingUp,
  Boxes,
  HelpCircle,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { AntLogo } from '../common/AntLogo';
import { useAuth } from '../../contexts/AuthContext';
import { useRbac } from '../../contexts/RbacContext';
import { productService } from '../../services/productService';
import { saleService } from '../../services/saleService';
import { settingsService } from '../../services/settingsService';
import { Product, Sale, PaymentMethod, SaleFormData, SaleSummaryMetrics } from '../../types';

export const QuickSaleView: React.FC = () => {
  const { user, fullName, companyName } = useAuth();
  const { effectiveCompanyId, currentRole } = useRbac();

  const [products, setProducts] = useState<Product[]>([]);
  const [salesHistory, setSalesHistory] = useState<Sale[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Search & Barcode Input
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Active Selected Product for Sale
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Sale Form State
  const [quantity, setQuantity] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('');

  // Feedbacks & Last Completed Sale Modal
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Load initial products and sales history
  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const [prodRes, salesRes] = await Promise.all([
        productService.getProducts(user.id),
        saleService.getSales(user.id, effectiveCompanyId),
      ]);
      setProducts(prodRes.data || []);
      setSalesHistory(salesRes.data || []);
    } catch (err) {
      console.warn('Erro ao carregar dados para Venda Rápida:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id, effectiveCompanyId]);

  // Focus on barcode input when loaded or when reset
  useEffect(() => {
    if (!isLoading && searchInputRef.current && !selectedProduct) {
      searchInputRef.current.focus();
    }
  }, [isLoading, selectedProduct]);

  // Categories list derived from products
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) set.add(p.category.trim());
    });
    return Array.from(set);
  }, [products]);

  // Filtered products list
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === 'all' || p.category?.toLowerCase() === selectedCategory.toLowerCase();

      if (!matchesCategory) return false;
      if (!q) return true;

      const matchesName = p.name.toLowerCase().includes(q);
      const matchesBarcode = p.barcode ? p.barcode.toLowerCase().includes(q) : false;
      const matchesId = p.id ? p.id.toLowerCase().includes(q) : false;

      return matchesName || matchesBarcode || matchesId;
    });
  }, [products, searchQuery, selectedCategory]);

  // Handle barcode reader submission (Enter key in search)
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim();
      if (!q) return;

      // 1. Try exact barcode match first
      const exactBarcodeMatch = products.find(
        (p) => p.barcode && p.barcode.trim().toLowerCase() === q.toLowerCase()
      );

      if (exactBarcodeMatch) {
        handleSelectProduct(exactBarcodeMatch);
        return;
      }

      // 2. Try first item in filtered list if available
      if (filteredProducts.length > 0) {
        handleSelectProduct(filteredProducts[0]);
      } else {
        setFeedback({
          type: 'error',
          message: `Nenhum produto encontrado com o código ou termo "${q}".`,
        });
      }
    }
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setQuantity(1);
    setCashTendered('');
    setSaleNotes('');
    setFeedback({ type: null, message: '' });

    // Focus quantity input for speed
    setTimeout(() => {
      if (quantityInputRef.current) {
        quantityInputRef.current.focus();
        quantityInputRef.current.select();
      }
    }, 100);
  };

  const handleCancelSelection = () => {
    setSelectedProduct(null);
    setQuantity(1);
    setCashTendered('');
    setSaleNotes('');
    setSearchQuery('');
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);
  };

  // Calculations for current selection
  const currentStock = selectedProduct ? Number(selectedProduct.current_stock) || 0 : 0;
  const unitPrice = selectedProduct ? Number(selectedProduct.sale_price) || 0 : 0;
  const totalPrice = Number((quantity * unitPrice).toFixed(2));
  const isStockSufficient = currentStock >= quantity && quantity > 0;
  const isZeroStock = currentStock <= 0;

  // Change calculation (Troco)
  const numericCashTendered = parseFloat(cashTendered.replace(',', '.')) || 0;
  const changeDue =
    paymentMethod === 'dinheiro' && numericCashTendered > totalPrice
      ? Number((numericCashTendered - totalPrice).toFixed(2))
      : 0;

  // Summary Metrics of Today
  const todayMetrics: SaleSummaryMetrics = useMemo(() => {
    return saleService.calculateTodaySummary(salesHistory);
  }, [salesHistory]);

  // Execute Sale Submission
  const handleConfirmSale = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user?.id || !selectedProduct) {
      setFeedback({ type: 'error', message: 'Selecione um produto para concluir a venda.' });
      return;
    }

    if (quantity <= 0) {
      setFeedback({ type: 'error', message: 'A quantidade precisa ser de no mínimo 1 unidade.' });
      return;
    }

    if (quantity > currentStock) {
      setFeedback({
        type: 'error',
        message: `Venda bloqueada: Estoque insuficiente! Saldo disponível: ${currentStock} un.`,
      });
      return;
    }

    if (paymentMethod === 'dinheiro' && numericCashTendered > 0 && numericCashTendered < totalPrice) {
      setFeedback({
        type: 'error',
        message: `Valor recebido em dinheiro (R$ ${numericCashTendered.toFixed(
          2
        )}) é menor que o total da venda (R$ ${totalPrice.toFixed(2)}).`,
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      const formData: SaleFormData = {
        product_id: selectedProduct.id || '',
        quantity,
        payment_method: paymentMethod,
        notes: saleNotes,
        cash_tendered: numericCashTendered,
      };

      const result = await saleService.createSale(
        user.id,
        effectiveCompanyId || user.id,
        companyName || 'Minha Empresa',
        fullName || 'Operador',
        user.email || '',
        selectedProduct,
        formData
      );

      if (result.error) {
        setFeedback({ type: 'error', message: result.error });
        return;
      }

      if (result.data) {
        const recordedSale = result.data;
        // Update local product stock in state immediately for real-time smoothness
        setProducts((prev) =>
          prev.map((p) =>
            p.id === selectedProduct.id
              ? { ...p, current_stock: Math.max(0, Number(p.current_stock) - quantity) }
              : p
          )
        );

        // Update sales history list
        setSalesHistory((prev) => [recordedSale, ...prev]);

        // Open completed receipt popup
        setCompletedSale(recordedSale);
        setIsReceiptModalOpen(true);

        // Reset state for next item
        setSelectedProduct(null);
        setQuantity(1);
        setSearchQuery('');
        setCashTendered('');
        setSaleNotes('');

        setFeedback({
          type: 'success',
          message: `Venda de R$ ${recordedSale.total_price.toFixed(2)} registrada com sucesso!`,
        });

        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 150);
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Falha ao processar a venda.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Keyboard shortcut listener (F2 to confirm sale if product selected)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && selectedProduct && isStockSufficient && !isSubmitting) {
        e.preventDefault();
        handleConfirmSale();
      } else if (e.key === 'Escape' && selectedProduct) {
        e.preventDefault();
        handleCancelSelection();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [selectedProduct, isStockSufficient, isSubmitting, quantity, paymentMethod, numericCashTendered]);

  const formatBrl = (val: number) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Fast Metrics */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-purple-600 text-white shadow-xs">
              <Zap className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Venda Rápida (PDV)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Registro ágil de vendas por código de barras ou busca rápida com baixa automática de estoque.
          </p>
        </div>

        {/* Quick Shift Summary Cards */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Vendido Hoje</div>
              <div className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatBrl(todayMetrics.revenueToday)}
              </div>
            </div>
          </div>

          <div className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xs flex items-center gap-2.5">
            <span className="p-1.5 rounded-lg bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <ShoppingCart className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-400">Vendas do Turno</div>
              <div className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
                {todayMetrics.totalSalesToday} vendas ({todayMetrics.itemsSoldToday} itens)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main POS Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN (7 cols): PRODUCT SEARCH, BARCODE SCANNER & SELECTION GRID   */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-5">
          {/* Barcode & Search Input Card */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border-2 border-purple-500/40 dark:border-purple-600/40 shadow-sm relative">
            <div className="flex items-center justify-between gap-2 mb-2">
              <label
                htmlFor="barcode-search-input"
                className="text-xs font-black uppercase tracking-wider text-purple-700 dark:text-purple-400 flex items-center gap-1.5"
              >
                <Barcode className="w-4 h-4" />
                Leitor de Código de Barras / Busca de Produto
              </label>
              <span className="text-[11px] font-semibold text-slate-400 hidden sm:inline">
                Pressione <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono">Enter</kbd> após bipar
              </span>
            </div>

            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-purple-600">
                <Search className="w-5 h-5" />
              </span>
              <input
                id="barcode-search-input"
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Escaneie o código de barras ou digite o nome do produto..."
                className="w-full pl-11 pr-24 py-3 text-sm sm:text-base font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-purple-50/30 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent placeholder:text-slate-400"
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                <Badge variant="purple" size="sm">
                  Leitor Ativo
                </Badge>
              </div>
            </div>

            {/* Category Quick Filters */}
            {categories.length > 0 && (
              <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                    selectedCategory === 'all'
                      ? 'bg-purple-600 text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  Todas ({products.length})
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                      selectedCategory === cat
                        ? 'bg-purple-600 text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Quick Catalog List */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-purple-600" />
                Produtos no Catálogo ({filteredProducts.length})
              </h3>
              <span className="text-[11px] text-slate-400">Clique para selecionar</span>
            </div>

            {isLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2">
                <div className="animate-spin rounded-full h-7 w-7 border-b-2 border-purple-600" />
                <span className="text-xs text-slate-400">Carregando catálogo...</span>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="py-10 text-center space-y-2 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Package className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
                  Nenhum produto encontrado
                </p>
                <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                  Cadastre produtos no módulo de Produtos ou verifique os termos da busca.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
                {filteredProducts.map((prod) => {
                  const stock = Number(prod.current_stock) || 0;
                  const price = Number(prod.sale_price) || 0;
                  const isSelected = selectedProduct?.id === prod.id;
                  const isOutOfStock = stock <= 0;

                  return (
                    <button
                      key={prod.id || prod.name}
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleSelectProduct(prod)}
                      className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between gap-3 cursor-pointer ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50/70 dark:bg-purple-950/40 ring-2 ring-purple-600'
                          : isOutOfStock
                          ? 'border-slate-200 dark:border-slate-800 opacity-60 bg-slate-50 dark:bg-slate-900/50 cursor-not-allowed'
                          : 'border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700 bg-white dark:bg-slate-900 hover:shadow-xs'
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                          {prod.name}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                          <span className="truncate">{prod.category || 'Geral'}</span>
                          {prod.barcode && (
                            <span className="text-[10px] font-mono text-slate-400 truncate">
                              • #{prod.barcode}
                            </span>
                          )}
                        </div>
                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="text-xs font-extrabold text-purple-700 dark:text-purple-400">
                            {formatBrl(price)}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                              stock <= 0
                                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                : stock <= (prod.min_stock || 3)
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            }`}
                          >
                            {stock} un
                          </span>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {isSelected ? (
                          <span className="p-1 rounded-full bg-purple-600 text-white">
                            <CheckCircle2 className="w-4 h-4" />
                          </span>
                        ) : (
                          <span className="p-1 rounded-full text-slate-300 hover:text-purple-600">
                            <Plus className="w-4 h-4" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN (5 cols): ACTIVE SALE CHECKOUT FORM & VALIDATION            */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-purple-600" />
                Caixa &amp; Finalização da Venda
              </h3>
              {selectedProduct && (
                <button
                  type="button"
                  onClick={handleCancelSelection}
                  className="text-xs font-semibold text-rose-600 hover:underline cursor-pointer"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Notification Banner */}
            {feedback.type === 'error' && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs font-semibold text-rose-800 dark:text-rose-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <span>{feedback.message}</span>
              </div>
            )}

            {feedback.type === 'success' && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>{feedback.message}</span>
              </div>
            )}

            {/* Selected Product Details */}
            {selectedProduct ? (
              <form onSubmit={handleConfirmSale} className="space-y-4">
                <div className="p-4 rounded-xl bg-purple-50/50 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/80 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase tracking-wider font-extrabold text-purple-700 dark:text-purple-400">
                        Produto Selecionado
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-slate-100">
                        {selectedProduct.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Categoria: {selectedProduct.category || 'Geral'}
                        {selectedProduct.barcode ? ` • Código: ${selectedProduct.barcode}` : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400">Preço Unitário</div>
                      <div className="text-base font-black text-purple-700 dark:text-purple-400">
                        {formatBrl(unitPrice)}
                      </div>
                    </div>
                  </div>

                  {/* Stock validation badge */}
                  <div className="pt-2 border-t border-purple-200/60 dark:border-purple-800/60 flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-600 dark:text-slate-400">
                      Estoque Disponível:
                    </span>
                    <span
                      className={`font-black px-2 py-0.5 rounded-md ${
                        currentStock <= 0
                          ? 'bg-rose-100 text-rose-700'
                          : currentStock < quantity
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      {currentStock} unidades
                    </span>
                  </div>
                </div>

                {/* Quantity Controls */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Quantidade da Venda
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <input
                      ref={quantityInputRef}
                      type="number"
                      min="1"
                      max={currentStock || 1}
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center py-2.5 text-lg font-black rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-mono"
                    />
                    <button
                      type="button"
                      disabled={quantity >= currentStock}
                      onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-50 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Quick Quantity Shortcuts */}
                  <div className="flex items-center gap-1.5 mt-2">
                    {[1, 2, 5, 10].map((step) => (
                      <button
                        key={step}
                        type="button"
                        disabled={step > currentStock}
                        onClick={() => setQuantity(Math.min(currentStock, step))}
                        className={`flex-1 py-1 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                          quantity === step
                            ? 'bg-purple-600 text-white border-purple-600'
                            : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                        } disabled:opacity-40 disabled:cursor-not-allowed`}
                      >
                        +{step}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Forma de Pagamento
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('dinheiro')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'dinheiro'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <Banknote className="w-4 h-4 text-emerald-600" />
                      Dinheiro
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('pix')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'pix'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <QrCode className="w-4 h-4 text-teal-600" />
                      PIX
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cartao_debito')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'cartao_debito'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-blue-600" />
                      Cartão Débito
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cartao_credito')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-all ${
                        paymentMethod === 'cartao_credito'
                          ? 'border-purple-600 bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 ring-1 ring-purple-600'
                          : 'border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <CreditCard className="w-4 h-4 text-indigo-600" />
                      Cartão Crédito
                    </button>
                  </div>
                </div>

                {/* Cash Tendered & Change (If Dinheiro) */}
                {paymentMethod === 'dinheiro' && (
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Valor Recebido (R$)
                      </label>
                      <input
                        type="text"
                        placeholder="Ex: 50.00"
                        value={cashTendered}
                        onChange={(e) => setCashTendered(e.target.value)}
                        className="w-28 text-right px-2.5 py-1 text-xs sm:text-sm font-bold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    {changeDue > 0 && (
                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200 dark:border-slate-700 text-emerald-700 dark:text-emerald-400 font-extrabold">
                        <span>Troco a Devolver:</span>
                        <span className="text-sm">{formatBrl(changeDue)}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Total Summary Block */}
                <div className="p-4 rounded-xl bg-slate-900 text-white dark:bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">
                      Total a Pagar
                    </div>
                    <div className="text-xs text-slate-400">
                      {quantity}x de {formatBrl(unitPrice)}
                    </div>
                  </div>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {formatBrl(totalPrice)}
                  </div>
                </div>

                {/* Confirm Sale Button */}
                <div className="space-y-2 pt-1">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    isLoading={isSubmitting}
                    disabled={!isStockSufficient || isZeroStock}
                    className="w-full justify-center text-sm sm:text-base font-extrabold py-3.5 shadow-md"
                    leftIcon={<Zap className="w-5 h-5" />}
                  >
                    Confirmar Venda • {formatBrl(totalPrice)}
                  </Button>

                  <p className="text-[11px] text-center text-slate-400">
                    Atalho rápido: pressione <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono">F2</kbd> para confirmar ou <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border font-mono">Esc</kbd> para cancelar.
                  </p>
                </div>
              </form>
            ) : (
              <div className="py-12 text-center space-y-3">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center mx-auto border border-purple-200 dark:border-purple-800">
                  <Barcode className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Aguardando Leitura
                  </h4>
                  <p className="text-xs text-slate-400 max-w-xs mx-auto mt-1">
                    Passe o leitor de código de barras ou selecione um produto no catálogo ao lado para abrir a venda.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BOTTOM SECTION: RECENT SALES OPERATIONAL HISTORY TABLE                    */}
      {/* ========================================================================= */}
      <Card
        id="quick-sales-history"
        title="Histórico Operacional de Vendas Recentes"
        description="Registro das saídas e vendas realizadas no terminal de caixa do ANT."
        badge={<Badge variant="purple">Tempo Real</Badge>}
      >
        {salesHistory.length === 0 ? (
          <div className="py-10 text-center space-y-2">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              Nenhuma venda registrada até o momento
            </p>
            <p className="text-[11px] text-slate-400">
              As vendas finalizadas aparecerão listadas aqui com data, valor e operador.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto mt-2">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase tracking-wider font-extrabold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3 px-3">Data / Hora</th>
                  <th className="py-3 px-3">Produto</th>
                  <th className="py-3 px-3">Qtd</th>
                  <th className="py-3 px-3">Unitário</th>
                  <th className="py-3 px-3">Total</th>
                  <th className="py-3 px-3">Pagamento</th>
                  <th className="py-3 px-3">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs">
                {salesHistory.slice(0, 15).map((sale) => {
                  const saleTime = new Date(sale.sale_date).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const saleDate = new Date(sale.sale_date).toLocaleDateString('pt-BR');

                  return (
                    <tr
                      key={sale.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                        {saleDate} às {saleTime}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900 dark:text-slate-100">
                        {sale.product_name}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-700 dark:text-slate-300">
                        {sale.quantity} un
                      </td>
                      <td className="py-3 px-3 text-slate-500 font-mono">
                        {formatBrl(sale.unit_price)}
                      </td>
                      <td className="py-3 px-3 font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatBrl(sale.total_price)}
                      </td>
                      <td className="py-3 px-3">
                        <span className="capitalize font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md text-[10px]">
                          {sale.payment_method.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-purple-600" />
                        <span className="truncate max-w-[120px]">{sale.user_name || 'Operador'}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* RECEIPT MODAL CONFIRMATION                                                */}
      {/* ========================================================================= */}
      {isReceiptModalOpen && completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-slate-100">
                Venda Concluída!
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Estoque atualizado e receita contabilizada no ANT.
              </p>
            </div>

            {/* Receipt Summary Box */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 text-left text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Produto:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {completedSale.product_name}
                </span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Quantidade:</span>
                <span className="font-bold">{completedSale.quantity} un</span>
              </div>
              <div className="flex justify-between text-slate-600 dark:text-slate-300">
                <span>Pagamento:</span>
                <span className="font-bold capitalize">
                  {completedSale.payment_method.replace('_', ' ')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-black text-emerald-600 dark:text-emerald-400">
                <span>Total:</span>
                <span>{formatBrl(completedSale.total_price)}</span>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center font-bold"
                onClick={() => setIsReceiptModalOpen(false)}
              >
                Próxima Venda (Enter)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
