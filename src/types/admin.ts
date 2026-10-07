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
import { UserRole, MemberStatus } from './rbac';

export type AdminNavigationSection =
  | 'admin_dashboard'
  | 'admin_companies'
  | 'admin_users'
  | 'admin_subscriptions'
  | 'admin_platform'
  | 'admin_support';

export interface AdminMetrics {
  totalCompanies: number;
  trialCompanies: number;
  activeCompanies: number;
  expiredCompanies: number;
  suspendedCompanies: number;
  canceledCompanies: number;
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
  totalNfeImports?: number; // Total de NF-e importadas na plataforma
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
  days_remaining: number;
  trial_end_date?: string;
  current_period_end?: string;
  next_billing_date?: string;
  billing_status?: 'paid' | 'pending' | 'overdue' | 'canceled';
  notes?: string;
}

export interface AdminSubscriptionOverview {
  mrr: number;
  arr: number;
  arpu: number; // Average Revenue Per User/Company
  activePaidCount: number;
  trialCount: number;
  churnRate: number;
}

/**
 * Usuário da plataforma para o painel Admin ANT.
 */
export interface PlatformUserItem {
  id: string;
  name: string;
  email: string;
  company_id: string;
  company_name: string;
  role: UserRole;
  status: MemberStatus;
  created_at: string;
  joined_at?: string | null;
  last_sign_in_at?: string | null;
}

/**
 * Indicadores agregados de usuários da plataforma.
 */
export interface PlatformUsersMetrics {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  pendingUsers: number;
  avgUsersPerCompany: number;
  companyUsersCount: Record<string, { companyName: string; count: number }>;
}

/**
 * Recursos configuráveis por plano.
 */
export interface PlanFeaturesConfig {
  canManageStock: boolean;
  canManageMovements: boolean;
  canAccessPricing: boolean;
  canAccessFinancial: boolean;
  canAccessBusinessHealth: boolean;
  canAccessCharts: boolean;
  canAccessReports: boolean;
  canManageUsers: boolean;
}

/**
 * Estrutura de personalização administrativa dos planos.
 * Editável diretamente pela interface Admin ANT sem alterar código.
 */
export interface CustomPlanConfig {
  id: PlanId;
  name: string;
  description: string;
  priceMonthly: number;
  maxUsers: number; // 999 = Ilimitado
  maxProducts: number; // 99999 = Ilimitado
  badge?: string;
  isPopular?: boolean;
  features: PlanFeaturesConfig;
}

/**
 * Configurações globais da plataforma ANT.
 */
export interface PlatformGeneralSettings {
  platformName: string;
  supportEmail: string;
  defaultTrialDays: number;
  allowNewSignups: boolean;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  institutionalNotice: string;
  showNoticeBanner: boolean;
  updatedAt?: string;
}

/**
 * Estrutura preparada para Histórico e Projeção de Cobranças (Mercado Pago Ready).
 */
export interface BillingHistoryItem {
  id: string;
  company_id: string;
  company_name: string;
  plan_id: PlanId;
  plan_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'canceled' | 'refunded';
  due_date: string;
  paid_at?: string;
  payment_method_preview: 'pix' | 'credit_card' | 'boleto';
  gateway_preview: 'mercadopago';
  external_reference?: string;
  mercado_pago_preference_id?: string;
  created_at: string;
}
