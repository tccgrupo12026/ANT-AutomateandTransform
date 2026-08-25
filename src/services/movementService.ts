/**
 * ANT — Automate and Transform
 * Serviço de Movimentações de Estoque (Entradas e Saídas)
 *
 * Persistência primária no Supabase PostgreSQL com RLS e atualização de estoque.
 * LocalStorage utilizado estritamente como cache temporário de leitura.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { StockMovement, MovementFormData, Product } from '../types';

const CACHE_MOVEMENTS_KEY_PREFIX = 'ant_movements_cache_';
const CACHE_PRODUCTS_KEY_PREFIX = 'ant_products_cache_';

export const movementService = {
  /**
   * Obtém o histórico de movimentações do usuário autenticado no Supabase com RLS.
   */
  async getMovements(userId: string): Promise<{ data: StockMovement[]; error: string | null }> {
    if (!userId) {
      return { data: [], error: 'Identificador do usuário não informado.' };
    }

    const supabase = getSupabaseClient();

    // 1. Consulta primária no Supabase com Join em Produtos e recuperação de JWT
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('stock_movements')
            .select(`
              id,
              user_id,
              company_id,
              product_id,
              type,
              quantity,
              movement_date,
              notes,
              created_at,
              product:products (
                name,
                category,
                current_stock,
                sale_price,
                cost_price
              )
            `)
            .eq('user_id', userId)
            .order('movement_date', { ascending: false });
        });

        if (error) {
          console.warn('Aviso ao consultar tabela stock_movements no Supabase:', error.message);
          // Tenta ler do cache local para manter a interface funcional
          try {
            const cached = localStorage.getItem(`${CACHE_MOVEMENTS_KEY_PREFIX}${userId}`);
            if (cached) {
              return { data: JSON.parse(cached) as StockMovement[], error: null };
            }
          } catch {
            // Ignora erro
          }
          return { data: [], error: error.message };
        }

        if (data) {
          const movements: StockMovement[] = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            company_id: item.company_id,
            product_id: item.product_id,
            product_name: item.product?.name || 'Produto',
            type: item.type,
            quantity: Number(item.quantity) || 0,
            movement_date: item.movement_date,
            notes: item.notes,
            created_at: item.created_at,
            product: item.product,
          }));

          // Atualiza cache temporário
          try {
            localStorage.setItem(
              `${CACHE_MOVEMENTS_KEY_PREFIX}${userId}`,
              JSON.stringify(movements)
            );
          } catch {
            // Ignora falha de cache
          }

          return { data: movements, error: null };
        }
      } catch (err: any) {
        console.warn('Falha de conexão ao buscar movimentações no Supabase:', err?.message || err);
      }
    }

    // 2. Cache temporário de leitura caso o cliente não esteja disponível ou ocorra falha
    try {
      const cached = localStorage.getItem(`${CACHE_MOVEMENTS_KEY_PREFIX}${userId}`);
      if (cached) {
        return { data: JSON.parse(cached) as StockMovement[], error: null };
      }
    } catch {
      // Ignora erro
    }

    return { data: [], error: null };
  },

  /**
   * Registra uma nova movimentação (Entrada ou Saída) e atualiza o estoque do produto.
   */
  async createMovement(
    userId: string,
    formData: MovementFormData,
    companyId?: string
  ): Promise<{ data: StockMovement | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Usuário não autenticado.' };
    }

    const qty = Number(formData.quantity);
    if (isNaN(qty) || qty <= 0) {
      return { data: null, error: 'A quantidade movimentada deve ser um número maior que zero.' };
    }

    if (!formData.product_id) {
      return { data: null, error: 'Selecione um produto para movimentar.' };
    }

    if (!['entrada', 'saida'].includes(formData.type)) {
      return { data: null, error: 'Tipo de movimentação inválido.' };
    }

    const supabase = getSupabaseClient();

    // 1. Obter o produto atual para validação de saldo e cálculo
    let targetProduct: Product | null = null;

    if (supabase) {
      try {
        const { data: prodData, error: prodErr } = await supabase
          .from('products')
          .select('*')
          .eq('id', formData.product_id)
          .eq('user_id', userId)
          .single();

        if (prodErr || !prodData) {
          return { data: null, error: 'Produto não encontrado para esta empresa.' };
        }
        targetProduct = prodData as Product;
      } catch (err: any) {
        console.error('Erro ao verificar produto no Supabase:', err);
      }
    }

    // Fallback para buscar o produto no cache local se offline
    if (!targetProduct) {
      try {
        const prodCache = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
        if (prodCache) {
          const prods: Product[] = JSON.parse(prodCache);
          targetProduct = prods.find((p) => p.id === formData.product_id) || null;
        }
      } catch {
        // Ignora
      }
    }

    if (!targetProduct) {
      return { data: null, error: 'Produto não encontrado.' };
    }

    const currentStock = Number(targetProduct.current_stock) || 0;

    // Regra: Não permitir estoque negativo na saída
    if (formData.type === 'saida' && currentStock < qty) {
      return {
        data: null,
        error: `Estoque insuficiente para saída. Estoque disponível: ${currentStock} un. (Solicitado: ${qty} un.)`,
      };
    }

    // Calcular novo estoque
    const newStock = formData.type === 'entrada' ? currentStock + qty : currentStock - qty;

    const movementPayload = {
      user_id: userId,
      company_id: companyId || targetProduct.company_id || null,
      product_id: formData.product_id,
      type: formData.type,
      quantity: qty,
      movement_date: formData.movement_date || new Date().toISOString(),
      notes: formData.notes?.trim() || null,
    };

    let insertedMovement: StockMovement | null = null;

    // 2. Persistir no Supabase
    if (supabase) {
      try {
        // Inserir registro na tabela stock_movements
        const { data: movData, error: movErr } = await supabase
          .from('stock_movements')
          .insert([movementPayload])
          .select(`
            id,
            user_id,
            company_id,
            product_id,
            type,
            quantity,
            movement_date,
            notes,
            created_at
          `)
          .single();

        if (movErr) {
          console.error('Erro ao inserir movimentação no Supabase (RLS):', movErr.message);
          return { data: null, error: movErr.message };
        }

        if (movData) {
          // Atualizar o estoque na tabela products
          await supabase
            .from('products')
            .update({
              current_stock: newStock,
              updated_at: new Date().toISOString(),
            })
            .eq('id', formData.product_id)
            .eq('user_id', userId);

          insertedMovement = {
            ...movData,
            product_name: targetProduct.name,
            product: {
              name: targetProduct.name,
              category: targetProduct.category,
              current_stock: newStock,
              sale_price: targetProduct.sale_price,
              cost_price: targetProduct.cost_price,
            },
          };
        }
      } catch (err: any) {
        console.error('Falha ao processar movimentação no Supabase:', err?.message || err);
        return { data: null, error: err?.message || 'Falha ao salvar movimentação no Supabase.' };
      }
    }

    // Fallback caso Supabase não esteja disponível
    if (!insertedMovement) {
      insertedMovement = {
        id: `mov_${Date.now()}`,
        user_id: userId,
        company_id: companyId || targetProduct.company_id,
        product_id: formData.product_id,
        product_name: targetProduct.name,
        type: formData.type,
        quantity: qty,
        movement_date: formData.movement_date || new Date().toISOString(),
        notes: formData.notes?.trim() || undefined,
        created_at: new Date().toISOString(),
        product: {
          name: targetProduct.name,
          category: targetProduct.category,
          current_stock: newStock,
          sale_price: targetProduct.sale_price,
          cost_price: targetProduct.cost_price,
        },
      };
    }

    // 3. Atualizar cache de produtos com o novo estoque
    try {
      const prodCacheStr = localStorage.getItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`);
      if (prodCacheStr) {
        const prods: Product[] = JSON.parse(prodCacheStr);
        const updatedProds = prods.map((p) =>
          p.id === formData.product_id ? { ...p, current_stock: newStock } : p
        );
        localStorage.setItem(`${CACHE_PRODUCTS_KEY_PREFIX}${userId}`, JSON.stringify(updatedProds));
      }
    } catch {
      // Ignora falha de cache
    }

    // 4. Atualizar cache de movimentações
    try {
      const movCacheStr = localStorage.getItem(`${CACHE_MOVEMENTS_KEY_PREFIX}${userId}`);
      const currentMovs: StockMovement[] = movCacheStr ? JSON.parse(movCacheStr) : [];
      localStorage.setItem(
        `${CACHE_MOVEMENTS_KEY_PREFIX}${userId}`,
        JSON.stringify([insertedMovement, ...currentMovs])
      );
    } catch {
      // Ignora falha de cache
    }

    return { data: insertedMovement, error: null };
  },
};
