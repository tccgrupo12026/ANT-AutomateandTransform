/**
 * ANT — Automate and Transform
 * Serviço de Gerenciamento de Produtos (Supabase Database & RLS)
 *
 * O Supabase PostgreSQL é a fonte primária e oficial de dados.
 * LocalStorage é utilizado estritamente como cache de leitura temporário.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { Product, ProductFormData } from '../types';

const CACHE_PRODUCTS_KEY_PREFIX = 'ant_products_cache_';

export const productService = {
  /**
   * Obtém a lista de produtos do usuário autenticado no Supabase com Row Level Security (RLS).
   */
  async getProducts(userId: string): Promise<{ data: Product[]; error: string | null }> {
    if (!userId) {
      return { data: [], error: 'Identificador do usuário não informado.' };
    }

    const supabase = getSupabaseClient();

    // 1. Consulta primária no Supabase com recuperação de JWT
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('products')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });
        });

        if (error) {
          console.warn('Aviso ao consultar tabela products no Supabase:', error.message);
          // Tenta ler do cache local para manter a interface funcional
          try {
            const cached = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
            if (cached) {
              return { data: JSON.parse(cached) as Product[], error: null };
            }
          } catch {
            // Ignora erro
          }
          return { data: [], error: error.message };
        }

        if (data) {
          // Atualiza cache temporário
          try {
            localStorage.setItem(
              `${CACHE_PRODUCTS_KEY_PREFIX}${userId}`,
              JSON.stringify(data)
            );
          } catch {
            // Ignora falha de cache
          }
          return { data: data as Product[], error: null };
        }
      } catch (err: any) {
        console.warn('Falha de conexão ao buscar produtos no Supabase:', err?.message || err);
      }
    }

    // 2. Cache temporário caso cliente Supabase não esteja disponível ou ocorra falha
    try {
      const cached = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
      if (cached) {
        return { data: JSON.parse(cached) as Product[], error: null };
      }
    } catch {
      // Ignora erro
    }

    return { data: [], error: null };
  },

  /**
   * Cadastra um novo produto vinculado ao usuário autenticado diretamente no Supabase.
   */
  async createProduct(
    userId: string,
    formData: ProductFormData,
    companyId?: string
  ): Promise<{ data: Product | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Usuário não autenticado.' };
    }

    const costPrice = Number(formData.cost_price) || 0;
    const salePrice = Number(formData.sale_price) || 0;
    const currentStock = Number(formData.current_stock) || 0;
    const minStock = Number(formData.min_stock) || 0;

    const newProductPayload = {
      user_id: userId,
      company_id: companyId || null,
      name: formData.name.trim(),
      category: formData.category.trim() || 'Geral',
      barcode: formData.barcode.trim() || null,
      cost_price: costPrice,
      sale_price: salePrice,
      current_stock: currentStock,
      min_stock: minStock,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();

    // 1. Inserção primária no Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .insert([newProductPayload])
          .select()
          .single();

        if (error) {
          console.error('Erro ao inserir produto no Supabase (RLS):', error.message);
          return { data: null, error: error.message };
        }

        if (data) {
          const insertedProduct = data as Product;
          // Atualiza cache temporário
          try {
            const currentCacheStr = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
            const currentList: Product[] = currentCacheStr ? JSON.parse(currentCacheStr) : [];
            const updatedList = [insertedProduct, ...currentList.filter((p) => p.id !== insertedProduct.id)];
            localStorage.setItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`, JSON.stringify(updatedList));
          } catch {
            // Ignora falha de cache
          }

          return { data: insertedProduct, error: null };
        }
      } catch (err: any) {
        console.error('Falha de conexão ao inserir produto no Supabase:', err?.message || err);
        return { data: null, error: err?.message || 'Falha ao cadastrar produto no Supabase.' };
      }
    }

    // Fallback apenas se Supabase não estiver configurado
    const fallbackItem: Product = {
      ...newProductPayload,
      id: `prod_${Date.now()}`,
      barcode: newProductPayload.barcode || undefined,
      company_id: newProductPayload.company_id || undefined,
      created_at: new Date().toISOString(),
    };

    try {
      const currentCacheStr = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
      const currentList: Product[] = currentCacheStr ? JSON.parse(currentCacheStr) : [];
      localStorage.setItem(
        `${CACHE_PRODUCTS_KEY_PREFIX}${userId}`,
        JSON.stringify([fallbackItem, ...currentList])
      );
    } catch {
      // Ignora erro
    }

    return { data: fallbackItem, error: null };
  },

  /**
   * Atualiza os dados de um produto existente diretamente no Supabase.
   */
  async updateProduct(
    userId: string,
    productId: string,
    formData: ProductFormData
  ): Promise<{ data: Product | null; error: string | null }> {
    if (!userId || !productId) {
      return { data: null, error: 'Identificador inválido para atualização.' };
    }

    const costPrice = Number(formData.cost_price) || 0;
    const salePrice = Number(formData.sale_price) || 0;
    const currentStock = Number(formData.current_stock) || 0;
    const minStock = Number(formData.min_stock) || 0;

    const updatePayload = {
      name: formData.name.trim(),
      category: formData.category.trim() || 'Geral',
      barcode: formData.barcode.trim() || null,
      cost_price: costPrice,
      sale_price: salePrice,
      current_stock: currentStock,
      min_stock: minStock,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();

    // 1. Atualização primária no Supabase
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('products')
          .update(updatePayload)
          .eq('id', productId)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar produto no Supabase (RLS):', error.message);
          return { data: null, error: error.message };
        }

        if (data) {
          const updatedProduct = data as Product;
          // Atualiza cache temporário
          try {
            const currentCacheStr = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
            if (currentCacheStr) {
              const currentList: Product[] = JSON.parse(currentCacheStr);
              const updatedList = currentList.map((p) => (p.id === productId ? updatedProduct : p));
              localStorage.setItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`, JSON.stringify(updatedList));
            }
          } catch {
            // Ignora falha de cache
          }

          return { data: updatedProduct, error: null };
        }
      } catch (err: any) {
        console.error('Falha de conexão ao atualizar produto no Supabase:', err?.message || err);
        return { data: null, error: err?.message || 'Falha ao atualizar produto no Supabase.' };
      }
    }

    // Fallback se não configurado
    return { data: null, error: 'Serviço de banco de dados não disponível.' };
  },

  /**
   * Remove um produto do banco de dados no Supabase.
   */
  async deleteProduct(userId: string, productId: string): Promise<{ success: boolean; error: string | null }> {
    if (!userId || !productId) {
      return { success: false, error: 'Identificador inválido para exclusão.' };
    }

    const supabase = getSupabaseClient();

    // 1. Exclusão primária no Supabase
    if (supabase) {
      try {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId)
          .eq('user_id', userId);

        if (error) {
          console.error('Erro ao excluir produto no Supabase (RLS):', error.message);
          return { success: false, error: error.message };
        }

        // Atualiza cache temporário
        try {
          const currentCacheStr = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
          if (currentCacheStr) {
            const currentList: Product[] = JSON.parse(currentCacheStr);
            const filtered = currentList.filter((p) => p.id !== productId);
            localStorage.setItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`, JSON.stringify(filtered));
          }
        } catch {
          // Ignora erro
        }

        return { success: true, error: null };
      } catch (err: any) {
        console.error('Falha de conexão ao excluir produto no Supabase:', err?.message || err);
        return { success: false, error: err?.message || 'Falha ao excluir produto no Supabase.' };
      }
    }

    return { success: false, error: 'Serviço de banco de dados não disponível.' };
  },
};
