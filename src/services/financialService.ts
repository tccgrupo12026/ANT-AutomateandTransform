/**
 * ANT — Automate and Transform
 * Serviço de Gestão Financeira (Receitas, Despesas, Histórico e Indicadores)
 *
 * Persistência primária no Supabase PostgreSQL com RLS na tabela `financial_transactions`.
 * LocalStorage utilizado estritamente como cache temporário de leitura/fallback.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import {
  FinancialTransaction,
  FinancialTransactionFormData,
  FinancialSummaryMetrics,
  TransactionType,
} from '../types';

const CACHE_FINANCIAL_KEY_PREFIX = 'ant_financial_cache_';

export const financialService = {
  /**
   * Obtém o histórico financeiro do usuário autenticado no Supabase com RLS.
   */
  async getTransactions(userId: string): Promise<{ data: FinancialTransaction[]; error: string | null }> {
    if (!userId) {
      return { data: [], error: 'Identificador do usuário não informado.' };
    }

    const supabase = getSupabaseClient();

    // 1. Consulta primária no Supabase com RLS e recuperação de JWT
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('financial_transactions')
            .select(`
              id,
              user_id,
              company_id,
              type,
              description,
              amount,
              transaction_date,
              category,
              notes,
              created_at,
              updated_at
            `)
            .eq('user_id', userId)
            .order('transaction_date', { ascending: false })
            .order('created_at', { ascending: false });
        });

        if (error) {
          console.warn('Aviso ao consultar tabela financial_transactions no Supabase:', error.message);
          // Tenta ler do cache local para manter a interface funcional
          try {
            const cached = localStorage.getItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`);
            if (cached) {
              return { data: JSON.parse(cached) as FinancialTransaction[], error: null };
            }
          } catch {
            // Ignora erro
          }
          return { data: [], error: error.message };
        }

        if (data) {
          const transactions: FinancialTransaction[] = data.map((item: any) => ({
            id: item.id,
            user_id: item.user_id,
            company_id: item.company_id,
            type: item.type as TransactionType,
            description: item.description,
            amount: Number(item.amount) || 0,
            transaction_date: item.transaction_date,
            category: item.category,
            notes: item.notes || '',
            created_at: item.created_at,
            updated_at: item.updated_at,
          }));

          // Atualiza cache temporário
          try {
            localStorage.setItem(
              `${CACHE_FINANCIAL_KEY_PREFIX}${userId}`,
              JSON.stringify(transactions)
            );
          } catch {
            // Ignora falha de cache
          }

          return { data: transactions, error: null };
        }
      } catch (err: any) {
        console.warn('Falha de conexão ao buscar transações no Supabase:', err?.message || err);
      }
    }

    // 2. Cache temporário de leitura caso o cliente não esteja disponível ou ocorra falha
    try {
      const cached = localStorage.getItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`);
      if (cached) {
        return { data: JSON.parse(cached) as FinancialTransaction[], error: null };
      }
    } catch {
      // Ignora erro
    }

    return { data: [], error: null };
  },

  /**
   * Registra uma nova receita ou despesa.
   */
  async createTransaction(
    userId: string,
    formData: FinancialTransactionFormData,
    companyId?: string
  ): Promise<{ data: FinancialTransaction | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Usuário não autenticado.' };
    }

    const description = formData.description?.trim();
    if (!description) {
      return { data: null, error: 'A descrição do lançamento é obrigatória.' };
    }

    const amount = Number(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      return { data: null, error: 'O valor deve ser maior que zero (R$ 0,01).' };
    }

    if (!formData.transaction_date) {
      return { data: null, error: 'A data do lançamento é obrigatória.' };
    }

    const category = formData.category?.trim();
    if (!category) {
      return { data: null, error: 'Selecione ou informe uma categoria para o lançamento.' };
    }

    if (!['receita', 'despesa'].includes(formData.type)) {
      return { data: null, error: 'Tipo de movimentação financeira inválido.' };
    }

    const supabase = getSupabaseClient();
    const payload = {
      user_id: userId,
      company_id: companyId || null,
      type: formData.type,
      description,
      amount,
      transaction_date: formData.transaction_date,
      category,
      notes: formData.notes?.trim() || null,
    };

    let insertedTransaction: FinancialTransaction | null = null;

    // 1. Inserir no Supabase com RLS
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .insert([payload])
          .select(`
            id,
            user_id,
            company_id,
            type,
            description,
            amount,
            transaction_date,
            category,
            notes,
            created_at,
            updated_at
          `)
          .single();

        if (error) {
          console.error('Erro ao inserir transação financeira no Supabase:', error.message);
          return { data: null, error: error.message };
        }

        if (data) {
          insertedTransaction = {
            id: data.id,
            user_id: data.user_id,
            company_id: data.company_id,
            type: data.type as TransactionType,
            description: data.description,
            amount: Number(data.amount) || 0,
            transaction_date: data.transaction_date,
            category: data.category,
            notes: data.notes || '',
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err: any) {
        console.error('Falha ao processar lançamento no Supabase:', err?.message || err);
        return { data: null, error: err?.message || 'Falha ao salvar lançamento financeiro.' };
      }
    }

    // 2. Fallback local caso Supabase não esteja disponível
    if (!insertedTransaction) {
      insertedTransaction = {
        id: `fin_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        user_id: userId,
        company_id: companyId,
        type: formData.type,
        description,
        amount,
        transaction_date: formData.transaction_date,
        category,
        notes: formData.notes?.trim() || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // 3. Atualizar cache de transações
    try {
      const cacheStr = localStorage.getItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`);
      const currentList: FinancialTransaction[] = cacheStr ? JSON.parse(cacheStr) : [];
      localStorage.setItem(
        `${CACHE_FINANCIAL_KEY_PREFIX}${userId}`,
        JSON.stringify([insertedTransaction, ...currentList])
      );
    } catch {
      // Ignora falha de cache
    }

    return { data: insertedTransaction, error: null };
  },

  /**
   * Atualiza um lançamento financeiro existente.
   */
  async updateTransaction(
    userId: string,
    id: string,
    formData: Partial<FinancialTransactionFormData>
  ): Promise<{ data: FinancialTransaction | null; error: string | null }> {
    if (!userId || !id) {
      return { data: null, error: 'Identificador inválido.' };
    }

    const payload: any = {};
    if (formData.description !== undefined) payload.description = formData.description.trim();
    if (formData.amount !== undefined) {
      const amt = Number(formData.amount);
      if (isNaN(amt) || amt <= 0) {
        return { data: null, error: 'O valor deve ser maior que zero.' };
      }
      payload.amount = amt;
    }
    if (formData.transaction_date !== undefined) payload.transaction_date = formData.transaction_date;
    if (formData.category !== undefined) payload.category = formData.category.trim();
    if (formData.notes !== undefined) payload.notes = formData.notes.trim() || null;
    if (formData.type !== undefined) payload.type = formData.type;
    payload.updated_at = new Date().toISOString();

    const supabase = getSupabaseClient();
    let updatedTransaction: FinancialTransaction | null = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('financial_transactions')
          .update(payload)
          .eq('id', id)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) {
          console.error('Erro ao atualizar lançamento no Supabase:', error.message);
          return { data: null, error: error.message };
        }

        if (data) {
          updatedTransaction = {
            id: data.id,
            user_id: data.user_id,
            company_id: data.company_id,
            type: data.type as TransactionType,
            description: data.description,
            amount: Number(data.amount) || 0,
            transaction_date: data.transaction_date,
            category: data.category,
            notes: data.notes || '',
            created_at: data.created_at,
            updated_at: data.updated_at,
          };
        }
      } catch (err: any) {
        return { data: null, error: err?.message || 'Erro ao atualizar no banco de dados.' };
      }
    }

    // Atualiza cache
    try {
      const cacheStr = localStorage.getItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`);
      if (cacheStr) {
        const list: FinancialTransaction[] = JSON.parse(cacheStr);
        const updatedList = list.map((t) => (t.id === id ? { ...t, ...payload, ...updatedTransaction } : t));
        localStorage.setItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`, JSON.stringify(updatedList));
      }
    } catch {
      // Ignora falha de cache
    }

    return { data: updatedTransaction, error: null };
  },

  /**
   * Exclui um lançamento financeiro.
   */
  async deleteTransaction(userId: string, id: string): Promise<{ success: boolean; error: string | null }> {
    if (!userId || !id) {
      return { success: false, error: 'Identificador inválido.' };
    }

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { error } = await supabase
          .from('financial_transactions')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (error) {
          console.error('Erro ao excluir lançamento financeiro no Supabase:', error.message);
          return { success: false, error: error.message };
        }
      } catch (err: any) {
        return { success: false, error: err?.message || 'Erro ao excluir no banco de dados.' };
      }
    }

    // Remove do cache
    try {
      const cacheStr = localStorage.getItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`);
      if (cacheStr) {
        const list: FinancialTransaction[] = JSON.parse(cacheStr);
        const updatedList = list.filter((t) => t.id !== id);
        localStorage.setItem(`${CACHE_FINANCIAL_KEY_PREFIX}${userId}`, JSON.stringify(updatedList));
      }
    } catch {
      // Ignora falha de cache
    }

    return { success: true, error: null };
  },

  /**
   * Calcula todos os indicadores consolidados para o mês atual e compara com o mês anterior.
   */
  calculateMetrics(transactions: FinancialTransaction[], referenceDate: Date = new Date()): FinancialSummaryMetrics {
    const currentYear = referenceDate.getFullYear();
    const currentMonth = referenceDate.getMonth(); // 0-indexed (0 = Jan, 7 = Ago, etc.)

    // Mês anterior (considerando virada de ano)
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;

    let currentMonthRevenue = 0;
    let currentMonthExpense = 0;
    let currentMonthRevenueCount = 0;
    let currentMonthExpenseCount = 0;
    let previousMonthRevenue = 0;

    transactions.forEach((tx) => {
      if (!tx.transaction_date) return;
      const [yStr, mStr] = tx.transaction_date.split('-');
      const txYear = parseInt(yStr, 10);
      const txMonth = parseInt(mStr, 10) - 1; // 0-indexed

      const amount = Number(tx.amount) || 0;

      // Verifica se pertence ao mês atual
      if (txYear === currentYear && txMonth === currentMonth) {
        if (tx.type === 'receita') {
          currentMonthRevenue += amount;
          currentMonthRevenueCount += 1;
        } else if (tx.type === 'despesa') {
          currentMonthExpense += amount;
          currentMonthExpenseCount += 1;
        }
      }

      // Verifica se pertence ao mês anterior
      if (txYear === prevYear && txMonth === prevMonth) {
        if (tx.type === 'receita') {
          previousMonthRevenue += amount;
        }
      }
    });

    const currentMonthProfit = currentMonthRevenue - currentMonthExpense;

    // Comparação percentual entre receita do mês atual e do mês anterior
    let revenueGrowthPercentage: number | null = null;
    if (previousMonthRevenue > 0) {
      revenueGrowthPercentage = ((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100;
    } else if (currentMonthRevenue > 0) {
      revenueGrowthPercentage = 100; // Crescimento inicial caso o mês anterior fosse zero
    } else {
      revenueGrowthPercentage = 0;
    }

    return {
      currentMonthRevenue,
      currentMonthExpense,
      currentMonthProfit,
      previousMonthRevenue,
      revenueGrowthPercentage,
      currentMonthTransactionsCount: currentMonthRevenueCount + currentMonthExpenseCount,
      currentMonthRevenueCount,
      currentMonthExpenseCount,
    };
  },
};
