/**
 * ANT — Automate and Transform
 * Admin ANT (SaaS Platform Creators) Types & Domain Contracts
 *
 * Módulo exclusivo para os fundadores/criadores da plataforma ANT.
 *
 * REGRAS DE PRIVACIDADE & LGPD:
 * O Admin ANT gerencia a plataforma SaaS e métricas agregadas de clientes.
 * É ESTRITAMENTE PROIBIDO o acesso aos seguintes dados dos clientes:
 * - Produtos dos clientes
 * - Estoque dos clientes
 * - Movimentações de estoque dos clientes
 * - Dados financeiros/DRE/vendas dos clientes
 * - Relatórios internos dos clientes
 * - Saúde do negócio dos clientes
 */

import { PlanId, SubscriptionStatus } from './subscription';

export type AdminNavigationSection =
  | 'admin_dashboard'
  | 'admin_companies'
  | 'admin_subscriptions'
  | 'admin_platform'
  | 'admin_support';

export interface AdminMetrics {
  totalCompanies: number;
  trialCompanies: number;
  activeCompanies: number;
  expiredCompanies: number;
  suspendedCompanies: number;
  totalUsers: number;
  newClientsLast30Days: number;
  starterClients: number;
  businessClients: number;
  enterpriseClients: number;
  estimatedMRR: number;
  revenueByPlan: {
    starter: number;
    business: number;
    enterprise: number;
  };
  trialConversionRate: number; // Porcentagem (0-100)
  monthlyGrowthRate: number; // Porcentagem (0-100)
}

/**
 * Registro de empresa higienizado para o painel Admin ANT.
 * Exibe apenas dados cadastrais e de assinatura da plataforma.
 */
export interface AdminCompanyItem {
  id: string;
  user_id?: string;
  company_name: string;
  responsible_name: string;
  email?: string;
  phone?: string;
  created_at: string;
  plan_id: PlanId;
  plan_name: string;
  subscription_status: SubscriptionStatus;
  users_count: number;
  days_remaining?: number;
  trial_end_date?: string;
  current_period_end?: string;
}

export interface AdminSubscriptionOverview {
  mrr: number;
  arr: number;
  arpu: number; // Average Revenue Per User/Company
  activePaidCount: number;
  trialCount: number;
  churnRate: number;
}
