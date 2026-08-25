/**
 * ANT — Automate and Transform
 * Serviço de Gerenciamento da Empresa (Supabase Database & RLS)
 *
 * O Supabase PostgreSQL é a fonte primária e oficial de dados.
 * LocalStorage é utilizado estritamente como cache de leitura temporário.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { Company, CompanyFormData } from '../types';

const CACHE_KEY_PREFIX = 'ant_company_cache_';

export const companyService = {
  /**
   * Obtém os dados da empresa do usuário autenticado no Supabase com Row Level Security (RLS).
   */
  async getCompany(userId: string): Promise<{ data: Company | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Identificador do usuário não informado.' };
    }

    const supabase = getSupabaseClient();

    // 1. Consulta primária no Supabase com recuperação de JWT
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('companies')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        });

        if (error) {
          console.warn('Aviso ao consultar tabela companies no Supabase:', error.message);
          // Tenta ler do cache local para manter a interface funcional
          try {
            const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
            if (cached) {
              return { data: JSON.parse(cached) as Company, error: null };
            }
          } catch {
            // Ignora erro
          }
          return { data: null, error: error.message };
        }

        if (data) {
          // Atualiza o cache temporário com o registro real do banco de dados
          try {
            localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(data));
          } catch {
            // Ignora falha de cache
          }
          return { data: data as Company, error: null };
        }

        // Se não houver empresa cadastrada para o usuário
        return { data: null, error: null };
      } catch (err: any) {
        console.warn('Falha de conexão com Supabase:', err?.message || err);
      }
    }

    // 2. Cache temporário caso o cliente Supabase não esteja disponível ou ocorra falha
    try {
      const cached = localStorage.getItem(`${CACHE_KEY_PREFIX}${userId}`);
      if (cached) {
        return { data: JSON.parse(cached) as Company, error: null };
      }
    } catch {
      // Ignora erro de leitura do cache
    }

    return { data: null, error: null };
  },

  /**
   * Salva ou atualiza os dados da empresa no Supabase (Upsert).
   * O registro é associado obrigatoriamente ao user_id do usuário autenticado.
   */
  async saveCompany(
    userId: string,
    formData: CompanyFormData
  ): Promise<{ data: Company | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Usuário não autenticado.' };
    }

    const companyPayload = {
      user_id: userId,
      company_name: formData.company_name.trim(),
      responsible_name: formData.responsible_name.trim(),
      cnpj: formData.cnpj.trim() || null,
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      city: formData.city.trim() || null,
      state: formData.state.trim() || null,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('companies')
          .upsert(companyPayload, { onConflict: 'user_id' })
          .select()
          .single();

        if (error) {
          console.error('Erro ao salvar empresa no Supabase (RLS):', error.message);
          return { data: null, error: error.message };
        }

        if (data) {
          // Atualiza metadados do usuário autenticado no Supabase Auth
          try {
            await supabase.auth.updateUser({
              data: {
                company_name: formData.company_name.trim(),
                full_name: formData.responsible_name.trim(),
              },
            });
          } catch {
            // Ignora falha não-crítica de sincronização de metadados
          }

          // Atualiza o cache temporário com o registro persistido no banco
          try {
            localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(data));
          } catch {
            // Ignora falha de cache
          }

          return { data: data as Company, error: null };
        }
      } catch (err: any) {
        console.error('Falha de conexão ao salvar empresa no Supabase:', err?.message || err);
        return { data: null, error: err?.message || 'Falha ao salvar dados no Supabase.' };
      }
    }

    // Fallback apenas se o Supabase não estiver configurado no ambiente
    const fallbackRecord: Company = {
      id: `company_${userId}`,
      user_id: userId,
      company_name: formData.company_name.trim(),
      responsible_name: formData.responsible_name.trim(),
      cnpj: formData.cnpj.trim(),
      phone: formData.phone.trim(),
      email: formData.email.trim(),
      address: formData.address.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(`${CACHE_KEY_PREFIX}${userId}`, JSON.stringify(fallbackRecord));
    } catch {
      // Ignora erro de cache
    }

    return { data: fallbackRecord, error: null };
  },
};
