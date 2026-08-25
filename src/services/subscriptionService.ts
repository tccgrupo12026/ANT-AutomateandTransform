/**
 * ANT — Automate and Transform
 * Subscription Service (Planos e Trial)
 *
 * Gerencia a assinatura SaaS, período de teste gratuito de 30 dias, status e planos.
 * Comunicação com Supabase com fallback seguro em LocalStorage.
 * 100% Determinístico — SEM Inteligência Artificial.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import {
  UserSubscription,
  SubscriptionSummary,
  PlanId,
  SubscriptionStatus,
  BillingCycle,
  ANT_PLANS,
} from '../types';

const SUBSCRIPTION_CACHE_PREFIX = 'ant_subscription_cache_';
const DEFAULT_TRIAL_DAYS = 30;

/**
 * Cria uma assinatura padrão de 30 dias grátis (Trial) para o usuário.
 */
export function createDefaultTrialSubscription(userId: string): UserSubscription {
  const now = new Date();
  const trialEnd = new Date(now.getTime() + DEFAULT_TRIAL_DAYS * 24 * 60 * 60 * 1000);

  return {
    user_id: userId,
    plan_id: 'starter',
    status: 'trial',
    billing_cycle: 'monthly',
    start_date: now.toISOString(),
    trial_end_date: trialEnd.toISOString(),
    current_period_start: now.toISOString(),
    current_period_end: trialEnd.toISOString(),
    canceled_at: null,
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
  };
}

/**
 * Calcula métricas e datas formatadas da assinatura.
 */
export function buildSubscriptionSummary(subscription: UserSubscription): SubscriptionSummary {
  const now = new Date().getTime();
  const trialEndDate = new Date(subscription.trial_end_date).getTime();
  const periodEndDate = new Date(subscription.current_period_end).getTime();

  // Se o status for trial, consideramos a expiração do trial. Se for ativo, consideramos o final do período atual.
  const targetEndDate = subscription.status === 'trial' ? trialEndDate : periodEndDate;
  const diffMs = targetEndDate - now;
  const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

  // Determina se expirou por tempo decorrido
  let effectiveStatus = subscription.status;
  if (diffMs <= 0 && (subscription.status === 'trial' || subscription.status === 'active')) {
    effectiveStatus = 'expired';
  }

  const effectiveSubscription: UserSubscription = {
    ...subscription,
    status: effectiveStatus,
  };

  const plan = ANT_PLANS[subscription.plan_id] || ANT_PLANS.starter;

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  return {
    subscription: effectiveSubscription,
    plan,
    daysRemaining,
    isTrial: effectiveStatus === 'trial',
    isActive: effectiveStatus === 'active',
    isExpired: effectiveStatus === 'expired',
    isSuspended: effectiveStatus === 'suspended',
    formattedExpirationDate: formatDate(subscription.status === 'trial' ? subscription.trial_end_date : subscription.current_period_end),
    formattedStartDate: formatDate(subscription.start_date),
  };
}

export const subscriptionService = {
  /**
   * Obtém a assinatura atual do usuário. Se não existir, gera o Trial de 30 dias automaticamente.
   */
  async getSubscription(userId: string): Promise<{ data: UserSubscription | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Identificador do usuário não informado.' };
    }

    const defaultSub = createDefaultTrialSubscription(userId);
    const supabase = getSupabaseClient();

    // 1. Tentar buscar no Supabase
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();
        });

        if (error) {
          console.warn('Aviso ao consultar tabela subscriptions no Supabase:', error.message);
          // Recorrer ao cache local se falhar a tabela
          try {
            const cached = localStorage.getItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`);
            if (cached) {
              return { data: JSON.parse(cached) as UserSubscription, error: null };
            }
          } catch {
            // Ignora
          }
          // Salva padrão
          localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(defaultSub));
          return { data: defaultSub, error: null };
        }

        if (data) {
          const sub = data as UserSubscription;
          try {
            localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(sub));
          } catch {
            // Ignora
          }
          return { data: sub, error: null };
        }

        // Se não tem registro no banco, insere o Trial de 30 dias inicial
        const { data: inserted, error: insertErr } = await supabase
          .from('subscriptions')
          .insert(defaultSub)
          .select()
          .single();

        if (!insertErr && inserted) {
          const newSub = inserted as UserSubscription;
          localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(newSub));
          return { data: newSub, error: null };
        }
      } catch (err: any) {
        console.warn('Falha de conexão com Supabase ao buscar assinatura:', err?.message || err);
      }
    }

    // 2. Cache local como fallback
    try {
      const cached = localStorage.getItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`);
      if (cached) {
        return { data: JSON.parse(cached) as UserSubscription, error: null };
      }
    } catch {
      // Ignora
    }

    try {
      localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(defaultSub));
    } catch {
      // Ignora
    }
    return { data: defaultSub, error: null };
  },

  /**
   * Obtém o resumo consolidado da assinatura (status, plano, dias restantes e datas formatadas).
   */
  async getSubscriptionSummary(userId: string): Promise<{ data: SubscriptionSummary | null; error: string | null }> {
    const { data: sub, error } = await this.getSubscription(userId);
    if (error || !sub) {
      const fallbackSub = createDefaultTrialSubscription(userId);
      return { data: buildSubscriptionSummary(fallbackSub), error };
    }
    return { data: buildSubscriptionSummary(sub), error: null };
  },

  /**
   * Altera o plano do usuário (Upgrade ou Downgrade).
   */
  async changePlan(userId: string, planId: PlanId): Promise<{ data: UserSubscription | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Identificador do usuário não informado.' };
    }

    const { data: current } = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...(current || createDefaultTrialSubscription(userId)),
      plan_id: planId,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .upsert(updated, { onConflict: 'user_id' })
            .select()
            .single();
        });

        if (!error && data) {
          const saved = data as UserSubscription;
          localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(saved));
          return { data: saved, error: null };
        }
      } catch (err: any) {
        console.warn('Erro ao atualizar plano no Supabase:', err?.message || err);
      }
    }

    localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(updated));
    return { data: updated, error: null };
  },

  /**
   * Simula a ativação/assinatura formal do plano (passando do Trial para Ativo).
   */
  async activateSubscription(
    userId: string,
    planId: PlanId,
    billingCycle: BillingCycle = 'monthly'
  ): Promise<{ data: UserSubscription | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Identificador do usuário não informado.' };
    }

    const now = new Date();
    const durationDays = billingCycle === 'yearly' ? 365 : 30;
    const periodEnd = new Date(now.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const { data: current } = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...(current || createDefaultTrialSubscription(userId)),
      plan_id: planId,
      status: 'active',
      billing_cycle: billingCycle,
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      updated_at: now.toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .upsert(updated, { onConflict: 'user_id' })
            .select()
            .single();
        });

        if (!error && data) {
          const saved = data as UserSubscription;
          localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(saved));
          return { data: saved, error: null };
        }
      } catch (err: any) {
        console.warn('Erro ao ativar assinatura no Supabase:', err?.message || err);
      }
    }

    localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(updated));
    return { data: updated, error: null };
  },

  /**
   * Simula a mudança de status da assinatura ('trial' | 'active' | 'expired' | 'suspended').
   */
  async updateStatus(
    userId: string,
    status: SubscriptionStatus
  ): Promise<{ data: UserSubscription | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Identificador do usuário não informado.' };
    }

    const { data: current } = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...(current || createDefaultTrialSubscription(userId)),
      status,
      updated_at: new Date().toISOString(),
    };

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        const { data, error } = await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .upsert(updated, { onConflict: 'user_id' })
            .select()
            .single();
        });

        if (!error && data) {
          const saved = data as UserSubscription;
          localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(saved));
          return { data: saved, error: null };
        }
      } catch (err: any) {
        console.warn('Erro ao atualizar status no Supabase:', err?.message || err);
      }
    }

    localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(updated));
    return { data: updated, error: null };
  },

  /**
   * Reinicia o período de teste de 30 dias para fins de teste e demonstração.
   */
  async resetTrial(userId: string): Promise<{ data: UserSubscription | null; error: string | null }> {
    const defaultSub = createDefaultTrialSubscription(userId);
    return await this.updateStatus(userId, 'trial');
  },
};
