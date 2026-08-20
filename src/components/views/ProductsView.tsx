import React, { useState, useEffect, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  Barcode,
  Tag,
  DollarSign,
  Boxes,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Building2,
  Save,
  Filter,
} from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { AntLogo } from '../common/AntLogo';
import { useAuth } from '../../contexts/AuthContext';
import { productService } from '../../services/productService';
import { Product, ProductFormData } from '../../types';

const INITIAL_FORM_STATE: ProductFormData = {
  name: '',
  category: '',
  barcode: '',
  cost_price: '',
  sale_price: '',
  current_stock: '',
  min_stock: '',
};

const COMMON_CATEGORIES = [
  'Alimentos & Bebidas',
  'Limpeza & Higiene',
  'Mercearia',
  'Eletrônicos & Acessórios',
  'Vestuário & Calçados',
  'Papelaria & Escritório',
  'Beleza & Cuidados',
  'Construção & Ferramentas',
  'Outros',
];

export const ProductsView: React.FC = () => {
  const { user, companyName } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState<ProductFormData>(INITIAL_FORM_STATE);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Delete Confirmation State
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Notification feedback
  const [feedback, setFeedback] = useState<{
    type: 'success' | 'error' | null;
    message: string;
  }>({ type: null, message: '' });

  // Load products on mount
  const loadProducts = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data } = await productService.getProducts(user.id);
      setProducts(data || []);
    } catch (err) {
      console.error('Erro ao carregar lista de produtos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [user?.id]);

  // Open modal for new product
  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData(INITIAL_FORM_STATE);
    setFeedback({ type: null, message: '' });
    setIsModalOpen(true);
  };

  // Open modal for editing product
  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      category: product.category,
      barcode: product.barcode || '',
      cost_price: product.cost_price.toString(),
      sale_price: product.sale_price.toString(),
      current_stock: product.current_stock.toString(),
      min_stock: product.min_stock.toString(),
    });
    setFeedback({ type: null, message: '' });
    setIsModalOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setFormData(INITIAL_FORM_STATE);
  };

  // Handle form change
  const handleFormChange = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Submit create or edit
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.id) {
      setFeedback({ type: 'error', message: 'Usuário não autenticado.' });
      return;
    }

    if (!formData.name.trim()) {
      setFeedback({ type: 'error', message: 'O Nome do produto é obrigatório.' });
      return;
    }

    if (!formData.category.trim()) {
      setFeedback({ type: 'error', message: 'A Categoria do produto é obrigatória.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback({ type: null, message: '' });

    try {
      if (editingProduct && editingProduct.id) {
        // Update product
        const { data, error } = await productService.updateProduct(
          user.id,
          editingProduct.id,
          formData
        );

        if (error) {
          setFeedback({ type: 'error', message: error });
        } else if (data) {
          setProducts((prev) =>
            prev.map((item) => (item.id === editingProduct.id ? data : item))
          );
          setIsModalOpen(false);
          setFeedback({
            type: 'success',
            message: `Produto "${data.name}" atualizado com sucesso!`,
          });
        }
      } else {
        // Create product
        const { data, error } = await productService.createProduct(user.id, formData);

        if (error) {
          setFeedback({ type: 'error', message: error });
        } else if (data) {
          setProducts((prev) => [data, ...prev]);
          setIsModalOpen(false);
          setFeedback({
            type: 'success',
            message: `Produto "${data.name}" cadastrado com sucesso!`,
          });
        }
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao processar produto.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!user?.id || !productToDelete?.id) return;

    setIsDeleting(true);
    try {
      const { success, error } = await productService.deleteProduct(
        user.id,
        productToDelete.id
      );

      if (error) {
        setFeedback({ type: 'error', message: error });
      } else if (success) {
        setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
        setFeedback({
          type: 'success',
          message: `Produto "${productToDelete.name}" excluído com sucesso.`,
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err?.message || 'Erro ao excluir produto.',
      });
    } finally {
      setIsDeleting(false);
      setProductToDelete(null);
    }
  };

  // Format currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(val || 0);
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.barcode && p.barcode.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || p.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, selectedCategory]);

  // List of unique categories for filtering
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400">
              <Package className="w-5 h-5" />
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              Produtos
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Cadastro, listagem, edição e exclusão de mercadorias da empresa{' '}
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              {companyName}
            </span>.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="purple" size="md">
            <ShieldCheck className="w-3.5 h-3.5 mr-1 inline text-purple-600 dark:text-purple-400" />
            Supabase RLS
          </Badge>

          <button
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-xs shadow-purple-200 dark:shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Produto</span>
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
            className="text-emerald-600 hover:text-emerald-800 dark:text-emerald-400"
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
            className="text-rose-600 hover:text-rose-800 dark:text-rose-400"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Barcode Notice Card (Manual Digitation Only - No Camera) */}
      <div className="p-4 rounded-2xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-900/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-purple-600 text-white shrink-0">
            <Barcode className="w-4 h-4" />
          </div>
          <div className="text-xs text-purple-900 dark:text-purple-300 leading-relaxed">
            <span className="font-bold">Digitação Manual de Código de Barras:</span> O código de barras dos produtos é inserido e consultado manualmente, com total privacidade e sem requisição de permissões de câmera.
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase">
              Total Cadastrado
            </div>
            <div className="text-base font-black text-purple-700 dark:text-purple-300">
              {products.length} {products.length === 1 ? 'produto' : 'produtos'}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, categoria ou código de barras digitado..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Category Filter Select */}
        {categoriesList.length > 0 && (
          <div className="sm:w-56 shrink-0">
            <div className="relative">
              <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs appearance-none"
              >
                <option value="all">Todas as Categorias</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Main Content: Products Table / Cards / Empty State */}
      <Card
        id="products-list-card"
        title="Catálogo de Produtos"
        subtitle={`Exibindo ${filteredProducts.length} de ${products.length} produtos`}
      >
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
            <span className="text-xs font-medium">Carregando catálogo de produtos...</span>
          </div>
        ) : products.length === 0 ? (
          /* Empty state when no products created yet */
          <div className="text-center py-16 px-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/40 dark:bg-slate-900/40 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto shadow-2xs">
              <Package className="w-7 h-7" />
            </div>
            <div className="max-w-md mx-auto">
              <h4 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Nenhum produto cadastrado ainda
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Comece adicionando os itens que sua empresa comercializa para gerenciar preços, categorias e estoques com segurança.
              </p>
            </div>
            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Produto</span>
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          /* Empty state when search filters yield no results */
          <div className="text-center py-12 px-4 text-slate-400 space-y-2">
            <Search className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p className="text-xs font-semibold text-slate-600 dark:text-slate-300">
              Nenhum produto encontrado para &quot;{searchTerm}&quot;
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('all');
              }}
              className="text-xs text-purple-600 font-bold hover:underline"
            >
              Limpar filtros
            </button>
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
                    <th className="pb-3 px-3">Produto</th>
                    <th className="pb-3 px-3">Categoria</th>
                    <th className="pb-3 px-3">Cód. Barras</th>
                    <th className="pb-3 px-3 text-right">Preço Custo</th>
                    <th className="pb-3 px-3 text-right">Preço Venda</th>
                    <th className="pb-3 px-3 text-center">Estoque Atual</th>
                    <th className="pb-3 px-3 text-center">Estoque Mín.</th>
                    <th className="pb-3 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                  {filteredProducts.map((product) => (
                    <tr
                      key={product.id}
                      className="hover:bg-purple-50/30 dark:hover:bg-purple-950/10 transition-colors"
                    >
                      {/* Product Name */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100 max-w-[200px] truncate">
                        {product.name}
                      </td>

                      {/* Category */}
                      <td className="py-3 px-3">
                        <Badge variant="purple" size="sm">
                          {product.category}
                        </Badge>
                      </td>

                      {/* Barcode */}
                      <td className="py-3 px-3 font-mono text-slate-500 dark:text-slate-400">
                        {product.barcode ? (
                          <span className="inline-flex items-center gap-1">
                            <Barcode className="w-3.5 h-3.5 text-purple-600" />
                            {product.barcode}
                          </span>
                        ) : (
                          <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>

                      {/* Cost Price */}
                      <td className="py-3 px-3 text-right font-medium text-slate-600 dark:text-slate-400">
                        {formatCurrency(product.cost_price)}
                      </td>

                      {/* Sale Price */}
                      <td className="py-3 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                        {formatCurrency(product.sale_price)}
                      </td>

                      {/* Current Stock */}
                      <td className="py-3 px-3 text-center font-bold text-slate-800 dark:text-slate-200">
                        {product.current_stock} un.
                      </td>

                      {/* Min Stock */}
                      <td className="py-3 px-3 text-center text-slate-500 dark:text-slate-400">
                        {product.min_stock} un.
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1 justify-end">
                          <button
                            onClick={() => handleOpenEditModal(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-colors"
                            title="Editar Produto"
                            aria-label={`Editar ${product.name}`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setProductToDelete(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Excluir Produto"
                            aria-label={`Excluir ${product.name}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile / Tablet Cards View */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 lg:hidden">
              {filteredProducts.map((product) => (
                <div
                  key={product.id}
                  className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3 shadow-2xs"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {product.name}
                      </h4>
                      <div className="mt-1">
                        <Badge variant="purple" size="sm">
                          {product.category}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-2 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/40"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setProductToDelete(product)}
                        className="p-2 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {product.barcode && (
                    <div className="flex items-center gap-1.5 text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-100 dark:border-slate-800">
                      <Barcode className="w-3.5 h-3.5 text-purple-600" />
                      <span>{product.barcode}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Preço Venda
                      </span>
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(product.sale_price)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Preço Custo
                      </span>
                      <span className="text-slate-600 dark:text-slate-400 font-medium">
                        {formatCurrency(product.cost_price)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Estoque Atual
                      </span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {product.current_stock} un.
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">
                        Estoque Mín.
                      </span>
                      <span className="text-slate-500 dark:text-slate-400">
                        {product.min_stock} un.
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* ========================================================================= */}
      {/* Product Create / Edit Modal */}
      {/* ========================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-400">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {editingProduct ? 'Editar Produto' : 'Cadastrar Novo Produto'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha os campos para salvar no catálogo do ANT.
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

            {/* Modal Body: Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4">
              {/* Field 1: Nome do Produto */}
              <div>
                <label
                  htmlFor="modal_product_name"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                >
                  <Tag className="w-3.5 h-3.5 text-purple-600" />
                  Nome do Produto <span className="text-purple-600">*</span>
                </label>
                <input
                  id="modal_product_name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleFormChange('name', e.target.value)}
                  placeholder="Ex: Arroz Tipo 1 - 5kg"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                />
              </div>

              {/* Field 2: Categoria */}
              <div>
                <label
                  htmlFor="modal_product_category"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                >
                  <Boxes className="w-3.5 h-3.5 text-purple-600" />
                  Categoria <span className="text-purple-600">*</span>
                </label>
                <div className="space-y-2">
                  <input
                    id="modal_product_category"
                    type="text"
                    required
                    list="category_options"
                    value={formData.category}
                    onChange={(e) => handleFormChange('category', e.target.value)}
                    placeholder="Selecione ou digite a categoria..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all shadow-2xs"
                  />
                  <datalist id="category_options">
                    {COMMON_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Field 3: Código de Barras Digitado Manualmente */}
              <div>
                <label
                  htmlFor="modal_product_barcode"
                  className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                >
                  <Barcode className="w-3.5 h-3.5 text-purple-600" />
                  Código de Barras (Digitado Manualmente)
                </label>
                <input
                  id="modal_product_barcode"
                  type="text"
                  value={formData.barcode}
                  onChange={(e) => handleFormChange('barcode', e.target.value)}
                  placeholder="Ex: 7891234567890"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                />
                <span className="text-[11px] text-slate-400 mt-1 block">
                  Digite os números do código de barras sem necessidade de leitura por câmera.
                </span>
              </div>

              {/* Fields 4 & 5: Preço de Custo & Preço de Venda */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="modal_cost_price"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-purple-600" />
                    Preço de Custo (R$)
                  </label>
                  <input
                    id="modal_cost_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cost_price}
                    onChange={(e) => handleFormChange('cost_price', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal_sale_price"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                  >
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Preço de Venda (R$)
                  </label>
                  <input
                    id="modal_sale_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.sale_price}
                    onChange={(e) => handleFormChange('sale_price', e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                  />
                </div>
              </div>

              {/* Fields 6 & 7: Estoque Atual & Estoque Mínimo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="modal_current_stock"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                  >
                    <Package className="w-3.5 h-3.5 text-purple-600" />
                    Estoque Atual (Qtd)
                  </label>
                  <input
                    id="modal_current_stock"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.current_stock}
                    onChange={(e) => handleFormChange('current_stock', e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                  />
                </div>

                <div>
                  <label
                    htmlFor="modal_min_stock"
                    className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase mb-1.5 flex items-center gap-1.5"
                  >
                    <Boxes className="w-3.5 h-3.5 text-purple-600" />
                    Estoque Mínimo (Qtd)
                  </label>
                  <input
                    id="modal_min_stock"
                    type="number"
                    step="1"
                    min="0"
                    value={formData.min_stock}
                    onChange={(e) => handleFormChange('min_stock', e.target.value)}
                    placeholder="0"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-purple-600 focus:border-transparent transition-all font-mono shadow-2xs"
                  />
                </div>
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
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>{editingProduct ? 'Atualizar Produto' : 'Cadastrar Produto'}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* Delete Confirmation Modal */}
      {/* ========================================================================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Excluir Produto?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Tem certeza que deseja remover o produto{' '}
                <strong className="text-slate-800 dark:text-slate-200">
                  &quot;{productToDelete.name}&quot;
                </strong>
                ? Esta ação não poderá ser desfeita.
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Excluindo...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirmar Exclusão</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
