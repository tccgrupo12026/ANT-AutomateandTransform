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
  PlanDetails,
  ANT_PLANS,
} from '../types';
import { fetchCustomPlansConfig } from './adminService';

const SUBSCRIPTION_CACHE_PREFIX = 'ant_subscription_cache_';
const DEFAULT_TRIAL_DAYS = 30;

/**
 * Retorna os planos ativos na plataforma, refletindo imediatamente
 * qualquer alteração de preços, limites ou recursos realizada pelo Admin ANT.
 */
export function getActivePlans(): Record<PlanId, PlanDetails> {
  const custom = fetchCustomPlansConfig();

  // 1. Benefícios dinâmicos Starter
  const starterUsersText =
    custom.starter.maxUsers >= 999
      ? 'Usuários ilimitados'
      : `Até ${custom.starter.maxUsers} ${custom.starter.maxUsers === 1 ? 'usuário' : 'usuários'} com acesso`;
  const starterProductsText =
    custom.starter.maxProducts >= 99999
      ? 'Catálogo com produtos ilimitados'
      : `Até ${custom.starter.maxProducts.toLocaleString('pt-BR')} produtos no catálogo`;

  const starterFeatures: string[] = [
    '1 empresa cadastrada',
    starterUsersText,
    starterProductsText,
    '30 dias de teste grátis (sem cartão)',
  ];
  if (custom.starter.features.canManageStock) starterFeatures.push('Controle e conferência de estoque');
  if (custom.starter.features.canManageMovements) starterFeatures.push('Registro de entradas e saídas de mercadorias');
  if (custom.starter.features.canAccessPricing) starterFeatures.push('Cálculo de margens e precificação de venda');
  if (custom.starter.features.canAccessFinancial) starterFeatures.push('Módulo financeiro com contas e fluxo de caixa');
  if (custom.starter.features.canAccessBusinessHealth) starterFeatures.push('Diagnóstico de Saúde do Negócio');
  if (custom.starter.features.canAccessCharts) starterFeatures.push('Gráficos operacionais de vendas');
  if (custom.starter.features.canAccessReports) starterFeatures.push('Exportação de relatórios em CSV e PDF');
  if (custom.starter.features.canManageUsers) starterFeatures.push('Gestão de equipe com links seguros');

  // 2. Benefícios dinâmicos Business
  const businessUsersText =
    custom.business.maxUsers >= 999
      ? 'Usuários ilimitados'
      : `Até ${custom.business.maxUsers} usuários com acesso`;
  const businessProductsText =
    custom.business.maxProducts >= 99999
      ? 'Catálogo com produtos ilimitados'
      : `Até ${custom.business.maxProducts.toLocaleString('pt-BR')} produtos no catálogo`;

  const businessFeatures: string[] = [
    '1 empresa cadastrada',
    businessUsersText,
    businessProductsText,
    '30 dias de teste grátis (sem cartão)',
  ];
  if (custom.business.features.canAccessFinancial) businessFeatures.push('Financeiro completo com categorias e DRE');
  if (custom.business.features.canAccessBusinessHealth) businessFeatures.push('Diagnóstico de Saúde do Negócio (Score 0-100)');
  if (custom.business.features.canManageStock) businessFeatures.push('Alertas preventivos de estoque mínimo');
  if (custom.business.features.canManageMovements) businessFeatures.push('Histórico consolidado de movimentações');
  if (custom.business.features.canAccessPricing) businessFeatures.push('Simulador inteligente de mark-up e margens');
  if (custom.business.features.canAccessCharts) businessFeatures.push('Gráficos analíticos de faturamento');
  if (custom.business.features.canAccessReports) businessFeatures.push('Exportação completa de relatórios gerenciais');
  if (custom.business.features.canManageUsers) businessFeatures.push('Gestão de equipe e colaboradores com links seguros');
  businessFeatures.push('Suporte prioritário via e-mail');

  // 3. Benefícios dinâmicos Enterprise
  const enterpriseUsersText =
    custom.enterprise.maxUsers >= 999
      ? 'Usuários ilimitados'
      : `Até ${custom.enterprise.maxUsers} usuários com acesso`;
  const enterpriseProductsText =
    custom.enterprise.maxProducts >= 99999
      ? 'Produtos ilimitados no catálogo'
      : `Até ${custom.enterprise.maxProducts.toLocaleString('pt-BR')} produtos no catálogo`;

  const enterpriseFeatures: string[] = [
    'Empresas ilimitadas',
    enterpriseUsersText,
    enterpriseProductsText,
    '30 dias de teste grátis (sem cartão)',
    'Módulo financeiro executivo e relatórios consolidados',
    'Diagnóstico de sustentabilidade e lucratividade',
    'Histórico permanente sem restrição de volume',
    'Gestão multiusuário completa com perfis personalizados',
    'Atendimento e consultoria de implantação dedicada',
    'Acesso antecipado a novos módulos da plataforma',
  ];

  return {
    starter: {
      ...ANT_PLANS.starter,
      name: custom.starter.name || 'Starter',
      badge: custom.starter.badge || ANT_PLANS.starter.badge,
      tagline: custom.starter.description || ANT_PLANS.starter.tagline,
      priceMonthly: custom.starter.priceMonthly,
      priceFormatted: `R$ ${custom.starter.priceMonthly.toFixed(2).replace('.', ',')}`,
      maxUsers: custom.starter.maxUsers >= 999 ? 'unlimited' : custom.starter.maxUsers,
      maxProducts: custom.starter.maxProducts >= 99999 ? 'unlimited' : custom.starter.maxProducts,
      hasCompleteFinancial: Boolean(custom.starter.features.canAccessFinancial),
      features: starterFeatures,
    },
    business: {
      ...ANT_PLANS.business,
      name: custom.business.name || 'Business',
      badge: custom.business.badge || 'Mais Escolhido',
      tagline: custom.business.description || ANT_PLANS.business.tagline,
      priceMonthly: custom.business.priceMonthly,
      priceFormatted: `R$ ${custom.business.priceMonthly.toFixed(2).replace('.', ',')}`,
      maxUsers: custom.business.maxUsers >= 999 ? 'unlimited' : custom.business.maxUsers,
      maxProducts: custom.business.maxProducts >= 99999 ? 'unlimited' : custom.business.maxProducts,
      hasCompleteFinancial: Boolean(custom.business.features.canAccessFinancial),
      features: businessFeatures,
    },
    enterprise: {
      ...ANT_PLANS.enterprise,
      name: custom.enterprise.name || 'Enterprise',
      badge: custom.enterprise.badge || 'Ilimitado',
      tagline: custom.enterprise.description || ANT_PLANS.enterprise.tagline,
      priceMonthly: custom.enterprise.priceMonthly,
      priceFormatted: `R$ ${custom.enterprise.priceMonthly.toFixed(2).replace('.', ',')}`,
      maxUsers: custom.enterprise.maxUsers >= 999 ? 'unlimited' : custom.enterprise.maxUsers,
      maxProducts: custom.enterprise.maxProducts >= 99999 ? 'unlimited' : custom.enterprise.maxProducts,
      hasCompleteFinancial: true,
      hasAdvancedFeatures: true,
      features: enterpriseFeatures,
    },
  };
}

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

  const plans = getActivePlans();
  const plan = plans[subscription.plan_id] || plans.starter;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
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

  const isBlocked =
    effectiveStatus === 'expired' ||
    effectiveStatus === 'overdue' ||
    effectiveStatus === 'suspended' ||
    effectiveStatus === 'canceled';

  return {
    subscription: effectiveSubscription,
    plan,
    daysRemaining,
    isTrial: effectiveStatus === 'trial',
    isActive: effectiveStatus === 'active',
    isPendingPayment: effectiveStatus === 'pending_payment',
    isOverdue: effectiveStatus === 'overdue',
    isExpired: effectiveStatus === 'expired',
    isSuspended: effectiveStatus === 'suspended',
    isCanceled: effectiveStatus === 'canceled',
    isBlocked,
    formattedExpirationDate: formatDate(
      subscription.status === 'trial' ? subscription.trial_end_date : subscription.current_period_end
    ),
    formattedStartDate: formatDate(subscription.start_date),
    formattedNextBillingDate: formatDate(
      subscription.next_billing_date || subscription.current_period_end
    ),
    formattedLastPaymentDate: formatDate(subscription.last_payment_date),
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

  /**
   * Atualiza campos arbitrários da assinatura (datas de vigência, status, pagamento, etc.)
   */
  async updateSubscriptionDetails(
    userId: string,
    partial: Partial<UserSubscription>
  ): Promise<{ data: UserSubscription | null; error: string | null }> {
    if (!userId) {
      return { data: null, error: 'Identificador do usuário não informado.' };
    }

    const { data: current } = await this.getSubscription(userId);
    const updated: UserSubscription = {
      ...(current || createDefaultTrialSubscription(userId)),
      ...partial,
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
          window.dispatchEvent(new Event('ant_plans_updated'));
          return { data: saved, error: null };
        }
      } catch (err: any) {
        console.warn('Erro ao atualizar detalhes da assinatura no Supabase:', err?.message || err);
      }
    }

    localStorage.setItem(`${SUBSCRIPTION_CACHE_PREFIX}${userId}`, JSON.stringify(updated));
    window.dispatchEvent(new Event('ant_plans_updated'));
    return { data: updated, error: null };
  },
};
