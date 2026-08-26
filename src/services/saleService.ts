/**
 * ANT — Automate and Transform
 * Serviço de Venda Rápida (PDV / Leitor de Código de Barras / Balcão)
 *
 * Realiza a persistência de vendas no Supabase, dedução automática de estoque,
 * registro de movimentação de saída e sincronização financeira em tempo real.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { Sale, SaleFormData, SaleSummaryMetrics, Product } from '../types';
import { productService } from './productService';
import { movementService } from './movementService';
import { financialService } from './financialService';

const CACHE_SALES_KEY_PREFIX = 'ant_sales_cache_';

export const saleService = {
  /**
   * Registra uma Venda Rápida completa com:
   * 1. Validação estrita de estoque (sem estoque negativo)
   * 2. Baixa automática no estoque do produto
   * 3. Registro de movimentação operacional de saída
   * 4. Lançamento financeiro de receita correspondente
   * 5. Persistência do registro de venda no Supabase e cache local
   */
  async createSale(
    userId: string,
    companyId: string,
    companyName: string,
    userName: string,
    userEmail: string,
    product: Product,
    formData: SaleFormData
  ): Promise<{ data: Sale | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Usuário não autenticado.' };
    }

    const qty = Number(formData.quantity);
    if (!qty || qty <= 0) {
      return { data: null, error: 'A quantidade da venda deve ser maior que zero.' };
    }

    const currentStock = Number(product.current_stock) || 0;
    if (qty > currentStock) {
      return {
        data: null,
        error: `Estoque insuficiente! O produto "${product.name}" possui apenas ${currentStock} unidade(s) disponível(is).`,
      };
    }

    const unitPrice = Number(product.sale_price) || 0;
    const totalPrice = Number((qty * unitPrice).toFixed(2));
    const nowIso = new Date().toISOString();

    const newSale: Sale = {
      company_id: companyId || userId,
      company_name: companyName || 'Minha Empresa',
      product_id: product.id,
      product_name: product.name,
      product_category: product.category || 'Geral',
      barcode: product.barcode || '',
      quantity: qty,
      unit_price: unitPrice,
      total_price: totalPrice,
      payment_method: formData.payment_method || 'dinheiro',
      user_id: userId,
      user_name: userName || 'Operador',
      user_email: userEmail || '',
      notes: formData.notes?.trim() || `Venda Rápida (PDV) - Pagamento: ${formData.payment_method}`,
      sale_date: nowIso,
      created_at: nowIso,
    };

    const supabase = getSupabaseClient();
    let savedSale: Sale = newSale;

    // 1. Persistência da Venda no Supabase
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('sales')
            .insert({
              company_id: newSale.company_id,
              company_name: newSale.company_name,
              product_id: newSale.product_id,
              product_name: newSale.product_name,
              product_category: newSale.product_category,
              barcode: newSale.barcode,
              quantity: newSale.quantity,
              unit_price: newSale.unit_price,
              total_price: newSale.total_price,
              payment_method: newSale.payment_method,
              user_id: newSale.user_id,
              user_name: newSale.user_name,
              user_email: newSale.user_email,
              notes: newSale.notes,
              sale_date: newSale.sale_date,
            })
            .select()
            .single();
        });

        if (error) {
          console.warn('Aviso ao inserir venda na tabela sales:', error.message);
        } else if (data) {
          savedSale = {
            id: data.id,
            company_id: data.company_id,
            company_name: data.company_name,
            product_id: data.product_id,
            product_name: data.product_name,
            product_category: data.product_category,
            barcode: data.barcode,
            quantity: Number(data.quantity),
            unit_price: Number(data.unit_price),
            total_price: Number(data.total_price),
            payment_method: data.payment_method,
            user_id: data.user_id,
            user_name: data.user_name,
            user_email: data.user_email,
            notes: data.notes,
            sale_date: data.sale_date,
            created_at: data.created_at,
          };
        }
      } catch (err) {
        console.warn('Erro ao salvar venda no Supabase:', err);
      }
    }

    if (!savedSale.id) {
      savedSale.id = 'sale_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    }

    // 2. Baixa no Estoque e Atualização do Produto
    const updatedStock = currentStock - qty;
    if (product.id) {
      try {
        await productService.updateProduct(userId, product.id, {
          name: product.name,
          category: product.category,
          barcode: product.barcode,
          cost_price: String(product.cost_price),
          sale_price: String(product.sale_price),
          current_stock: String(updatedStock),
          min_stock: String(product.min_stock || 0),
        });
      } catch (err) {
        console.warn('Erro ao atualizar estoque do produto:', err);
      }
    }

    // 3. Registro de Movimentação de Saída
    try {
      await movementService.createMovement(userId, {
        product_id: product.id || '',
        type: 'saida',
        quantity: qty,
        movement_date: nowIso.split('T')[0],
        notes: `Venda Rápida #${savedSale.id?.substring(0, 8) || 'PDV'} (${formData.payment_method})`,
      });
    } catch (err) {
      console.warn('Erro ao registrar movimentação de saída:', err);
    }

    // 4. Registro Financeiro da Receita
    try {
      await financialService.createTransaction(userId, {
        type: 'receita',
        description: `Venda: ${product.name} (${qty}x)`,
        amount: totalPrice,
        transaction_date: nowIso.split('T')[0],
        category: 'Vendas',
        notes: `PDV Venda Rápida - Pagamento em ${formData.payment_method.toUpperCase()}`,
      });
    } catch (err) {
      console.warn('Erro ao sincronizar receita financeira:', err);
    }

    // 5. Atualização do Cache Local de Vendas
    try {
      const cacheKey = `${CACHE_SALES_KEY_PREFIX}${companyId || userId}`;
      const existingRaw = localStorage.getItem(cacheKey);
      const salesList: Sale[] = existingRaw ? JSON.parse(existingRaw) : [];
      salesList.unshift(savedSale);
      localStorage.setItem(cacheKey, JSON.stringify(salesList.slice(0, 200)));
    } catch {
      // Ignora erro no localStorage
    }

    return { data: savedSale, error: null };
  },

  /**
   * Obtém o histórico de vendas recentes do estabelecimento/usuário.
   */
  async getSales(
    userId: string,
    companyId?: string
  ): Promise<{ data: Sale[]; error: string | null }> {
    if (!userId && !companyId) {
      return { data: [], error: 'Identificador não fornecido.' };
    }

    const effectiveId = companyId || userId;
    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          let query = client.from('sales').select('*');
          if (companyId) {
            query = query.or(`company_id.eq.${companyId},user_id.eq.${userId}`);
          } else {
            query = query.eq('user_id', userId);
          }
          return await query.order('sale_date', { ascending: false }).limit(100);
        });

        if (!error && data) {
          const sales: Sale[] = data.map((item: any) => ({
            id: item.id,
            company_id: item.company_id,
            company_name: item.company_name,
            product_id: item.product_id,
            product_name: item.product_name,
            product_category: item.product_category,
            barcode: item.barcode,
            quantity: Number(item.quantity) || 0,
            unit_price: Number(item.unit_price) || 0,
            total_price: Number(item.total_price) || 0,
            payment_method: item.payment_method,
            user_id: item.user_id,
            user_name: item.user_name,
            user_email: item.user_email,
            notes: item.notes,
            sale_date: item.sale_date,
            created_at: item.created_at,
          }));

          try {
            localStorage.setItem(`${CACHE_SALES_KEY_PREFIX}${effectiveId}`, JSON.stringify(sales));
          } catch {}

          return { data: sales, error: null };
        }
      } catch (err) {
        console.warn('Erro ao carregar vendas do Supabase:', err);
      }
    }

    // Fallback para cache local
    try {
      const cached = localStorage.getItem(`${CACHE_SALES_KEY_PREFIX}${effectiveId}`);
      if (cached) {
        return { data: JSON.parse(cached) as Sale[], error: null };
      }
    } catch {}

    return { data: [], error: null };
  },

  /**
   * Calcula métricas agregadas de vendas realizadas hoje
   */
  calculateTodaySummary(sales: Sale[]): SaleSummaryMetrics {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaySales = sales.filter((s) => s.sale_date.startsWith(todayStr));

    const totalSalesToday = todaySales.length;
    const revenueToday = todaySales.reduce((acc, s) => acc + (s.total_price || 0), 0);
    const itemsSoldToday = todaySales.reduce((acc, s) => acc + (s.quantity || 0), 0);
    const averageTicketToday = totalSalesToday > 0 ? revenueToday / totalSalesToday : 0;

    return {
      totalSalesToday,
      revenueToday,
      itemsSoldToday,
      averageTicketToday,
    };
  },
};
