/**
 * ANT — Automate and Transform
 * Subscription & SaaS Plans Contracts
 */

export type PlanId = 'starter' | 'business' | 'enterprise';

export type SubscriptionStatus = 'trial' | 'active' | 'expired' | 'suspended';

export type BillingCycle = 'monthly' | 'yearly';

export interface PlanFeature {
  text: string;
  included: boolean;
  highlight?: boolean;
}

export interface PlanDetails {
  id: PlanId;
  name: string;
  badge?: string;
  tagline: string;
  priceMonthly: number;
  priceFormatted: string;
  period: string;
  maxCompanies: number | 'unlimited';
  maxUsers: number | 'unlimited';
  maxProducts: number | 'unlimited';
  hasCompleteFinancial: boolean;
  hasAdvancedFeatures: boolean;
  features: string[];
  recommended?: boolean;
}

export interface UserSubscription {
  id?: string;
  user_id: string;
  company_id?: string;
  plan_id: PlanId;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  start_date: string;
  trial_end_date: string;
  current_period_start: string;
  current_period_end: string;
  canceled_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SubscriptionSummary {
  subscription: UserSubscription;
  plan: PlanDetails;
  daysRemaining: number;
  isTrial: boolean;
  isActive: boolean;
  isExpired: boolean;
  isSuspended: boolean;
  formattedExpirationDate: string;
  formattedStartDate: string;
}

export const ANT_PLANS: Record<PlanId, PlanDetails> = {
  starter: {
    id: 'starter',
    name: 'Starter',
    tagline: 'Ideal para autônomos e pequenos negócios iniciando a organização.',
    priceMonthly: 29.9,
    priceFormatted: 'R$ 29,90',
    period: '/mês',
    maxCompanies: 1,
    maxUsers: 2,
    maxProducts: 200,
    hasCompleteFinancial: false,
    hasAdvancedFeatures: false,
    features: [
      '1 empresa cadastrada',
      'Até 2 usuários com acesso',
      'Até 200 produtos no catálogo',
      'Controle básico de estoque',
      'Registro de entradas e saídas',
      'Cálculo de margens e precificação',
      'Acesso web desktop e mobile',
      'Exportação de relatórios em CSV/PDF',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    badge: 'Mais Escolhido',
    tagline: 'O plano completo para microempresas que buscam controle financeiro e crescimento.',
    priceMonthly: 59.9,
    priceFormatted: 'R$ 59,90',
    period: '/mês',
    maxCompanies: 1,
    maxUsers: 5,
    maxProducts: 2000,
    hasCompleteFinancial: true,
    hasAdvancedFeatures: false,
    recommended: true,
    features: [
      '1 empresa cadastrada',
      'Até 5 usuários com acesso',
      'Até 2.000 produtos no catálogo',
      'Financeiro completo com categorias e DRE',
      'Controle de fluxo de caixa em tempo real',
      'Diagnóstico de Saúde do Negócio (Score 0-100)',
      'Alertas de estoque mínimo preventivo',
      'Relatórios e gráficos analíticos de vendas',
      'Suporte prioritário via e-mail',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    badge: 'Ilimitado',
    tagline: 'Máxima potência, volume ilimitado e recursos avançados de gestão.',
    priceMonthly: 149.9,
    priceFormatted: 'R$ 149,90',
    period: '/mês',
    maxCompanies: 'unlimited',
    maxUsers: 'unlimited',
    maxProducts: 'unlimited',
    hasCompleteFinancial: true,
    hasAdvancedFeatures: true,
    features: [
      'Empresas ilimitadas',
      'Usuários ilimitados',
      'Produtos ilimitados no catálogo',
      'Recursos avançados de gestão integrada',
      'Módulo financeiro executivo completo',
      'Diagnóstico de sustentabilidade empresarial',
      'Histórico completo de movimentações sem expiração',
      'Suporte prioritário e consultoria de implantação',
      'Acesso antecipado a novos módulos',
    ],
  },
};
