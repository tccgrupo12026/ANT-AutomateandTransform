/**
 * ANT — Automate and Transform
 * Admin ANT (SaaS Platform Creators) Service
 *
 * Módulo de inteligência e gestão SaaS para os criadores da plataforma ANT.
 *
 * REGRAS DE PRIVACIDADE & LGPD:
 * - Acesso apenas a metadados globais da plataforma (empresas, planos, status, usuários totais).
 * - NENHUM produto, estoque, movimentação, faturamento de vendas ou dado interno de clientes é consultado ou exposto.
 * - 100% Determinístico — SEM Inteligência Artificial.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import {
  AdminMetrics,
  AdminCompanyItem,
  AdminSubscriptionOverview,
  PlatformUserItem,
  PlatformUsersMetrics,
  CustomPlanConfig,
  PlatformGeneralSettings,
  BillingHistoryItem,
} from '../types/admin';
import { PlanId, SubscriptionStatus, ANT_PLANS } from '../types/subscription';
import { UserRole, MemberStatus } from '../types/rbac';

const ADMIN_STATUS_OVERRIDE_KEY = 'ant_admin_status_overrides';
const ADMIN_DELETED_COMPANIES_KEY = 'ant_admin_deleted_companies';
const ADMIN_CUSTOM_PLANS_KEY = 'ant_admin_custom_plans';
const ADMIN_PLATFORM_SETTINGS_KEY = 'ant_admin_platform_settings';
const ADMIN_BILLING_HISTORY_KEY = 'ant_admin_billing_history';

// -------------------------------------------------------------
// 1. Gestão de Overrides de Empresas
// -------------------------------------------------------------

interface CompanyOverride {
  status?: SubscriptionStatus;
  plan_id?: PlanId;
  trial_end_date?: string;
  notes?: string;
}

function getStatusOverrides(): Record<string, CompanyOverride> {
  try {
    const raw = localStorage.getItem(ADMIN_STATUS_OVERRIDE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveStatusOverride(companyId: string, override: CompanyOverride): void {
  try {
    const current = getStatusOverrides();
    current[companyId] = { ...(current[companyId] || {}), ...override };
    localStorage.setItem(ADMIN_STATUS_OVERRIDE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Erro ao salvar alteração administrativa:', err);
  }
}

function getDeletedCompanyIds(): Set<string> {
  try {
    const raw = localStorage.getItem(ADMIN_DELETED_COMPANIES_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function markCompanyAsDeleted(companyId: string): void {
  try {
    const deleted = getDeletedCompanyIds();
    deleted.add(companyId);
    localStorage.setItem(ADMIN_DELETED_COMPANIES_KEY, JSON.stringify(Array.from(deleted)));
  } catch (err) {
    console.warn('Erro ao salvar empresa excluída:', err);
  }
}

// -------------------------------------------------------------
// 2. Consulta e Métricas de Empresas
// -------------------------------------------------------------

export async function fetchAllAdminCompanies(): Promise<AdminCompanyItem[]> {
  const overrides = getStatusOverrides();
  const deletedIds = getDeletedCompanyIds();
  const supabase = getSupabaseClient();
  const customPlans = fetchCustomPlansConfig();

  let companiesList: AdminCompanyItem[] = [];

  if (supabase) {
    try {
      // Consulta empresas reais no Supabase
      const { data: companiesData, error: compErr } = await executeWithJwtRecovery(async (client) => {
        return await client
          .from('companies')
          .select('id, user_id, company_name, responsible_name, email, phone, created_at')
          .order('created_at', { ascending: false });
      });

      if (!compErr && companiesData) {
        // Consulta contagem de membros por empresa
        const { data: membersData } = await executeWithJwtRecovery(async (client) => {
          return await client.from('company_members').select('company_id, user_id, status');
        });

        // Consulta assinaturas reais
        const { data: subsData } = await executeWithJwtRecovery(async (client) => {
          return await client.from('subscriptions').select('*');
        });

        const membersCountMap: Record<string, number> = {};
        if (membersData && Array.isArray(membersData)) {
          membersData.forEach((m) => {
            if (m.company_id && m.status !== 'inactive') {
              membersCountMap[m.company_id] = (membersCountMap[m.company_id] || 0) + 1;
            }
          });
        }

        const subsMap: Record<string, any> = {};
        if (subsData && Array.isArray(subsData)) {
          subsData.forEach((s) => {
            if (s.user_id) subsMap[s.user_id] = s;
            if (s.company_id) subsMap[s.company_id] = s;
          });
        }

        const nowMs = Date.now();

        companiesList = companiesData
          .filter((c) => !deletedIds.has(c.id))
          .map((c) => {
            const sub = subsMap[c.user_id] || subsMap[c.id] || {};
            const override = overrides[c.id] || {};

            const planId: PlanId = override.plan_id || (sub.plan_id as PlanId) || 'starter';
            let status: SubscriptionStatus = override.status || (sub.status as SubscriptionStatus) || 'trial';

            // Cálculo dos dias restantes de trial
            const createdMs = new Date(c.created_at || Date.now()).getTime();
            const platformSettings = fetchPlatformSettings();
            const defaultTrialMs = (platformSettings.defaultTrialDays || 14) * 24 * 60 * 60 * 1000;

            const trialEndStr = override.trial_end_date || sub.trial_end_date;
            const trialEndMs = trialEndStr ? new Date(trialEndStr).getTime() : createdMs + defaultTrialMs;

            const daysRemaining = Math.max(0, Math.ceil((trialEndMs - nowMs) / (1000 * 60 * 60 * 24)));

            // Se for trial e os dias esgotaram, atualiza para expirado
            if (status === 'trial' && daysRemaining === 0) {
              status = 'expired';
            }

            const planDef = customPlans[planId] || customPlans.starter;

            // Próximo vencimento projetado (30 dias após criação ou fim do período atual)
            const nextBillingMs = sub.current_period_end
              ? new Date(sub.current_period_end).getTime()
              : createdMs + 30 * 24 * 60 * 60 * 1000;

            return {
              id: c.id,
              user_id: c.user_id,
              company_name: c.company_name || 'Empresa Cadastrada',
              responsible_name: c.responsible_name || 'Responsável',
              email: c.email || undefined,
              phone: c.phone || undefined,
              created_at: c.created_at || new Date().toISOString(),
              plan_id: planId,
              plan_name: planDef.name,
              subscription_status: status,
              users_count: Math.max(1, membersCountMap[c.id] || 1),
              days_remaining: status === 'trial' ? daysRemaining : 0,
              trial_end_date: new Date(trialEndMs).toISOString(),
              current_period_end: sub.current_period_end || new Date(nextBillingMs).toISOString(),
              next_billing_date: new Date(nextBillingMs).toISOString(),
              billing_status: status === 'active' ? 'paid' : status === 'suspended' ? 'overdue' : 'pending',
              notes: override.notes,
            };
          });

        return companiesList;
      }
    } catch (err) {
      console.warn('Consulta administrativa de empresas falhou no Supabase:', err);
    }
  }

  return [];
}

// -------------------------------------------------------------
// 3. Ações Administrativas de Empresas
// -------------------------------------------------------------

export async function suspendCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    saveStatusOverride(companyId, { status: 'suspended' });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .update({ status: 'suspended', updated_at: new Date().toISOString() })
            .eq('company_id', companyId);
        });
      } catch {
        // Fallback já salvo em overrides
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao suspender empresa.' };
  }
}

export async function reactivateCompany(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    saveStatusOverride(companyId, { status: 'active' });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .update({ status: 'active', updated_at: new Date().toISOString() })
            .eq('company_id', companyId);
        });
      } catch {
        // Fallback já salvo em overrides
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao reativar empresa.' };
  }
}

export async function extendCompanyTrial(
  companyId: string,
  extraDays: 7 | 15 | 30 = 15
): Promise<{ success: boolean; newEndDate?: string; error?: string }> {
  try {
    const currentOverrides = getStatusOverrides();
    const existingEnd = currentOverrides[companyId]?.trial_end_date;

    const baseDate = existingEnd && new Date(existingEnd) > new Date() ? new Date(existingEnd) : new Date();
    const newEnd = new Date(baseDate.getTime() + extraDays * 24 * 60 * 60 * 1000);
    const newEndIso = newEnd.toISOString();

    saveStatusOverride(companyId, {
      status: 'trial',
      trial_end_date: newEndIso,
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .update({
              status: 'trial',
              trial_end_date: newEndIso,
              updated_at: new Date().toISOString(),
            })
            .eq('company_id', companyId);
        });
      } catch {
        // Fallback local
      }
    }

    return { success: true, newEndDate: newEndIso };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao renovar trial.' };
  }
}

export async function updateAdminCompanySubscription(
  companyId: string,
  newStatus: SubscriptionStatus,
  newPlanId?: PlanId,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    saveStatusOverride(companyId, {
      status: newStatus,
      ...(newPlanId ? { plan_id: newPlanId } : {}),
      ...(notes !== undefined ? { notes } : {}),
    });

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          return await client
            .from('subscriptions')
            .update({
              status: newStatus,
              ...(newPlanId ? { plan_id: newPlanId } : {}),
              updated_at: new Date().toISOString(),
            })
            .eq('company_id', companyId);
        });
      } catch {
        // Fallback local
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao atualizar assinatura da empresa.' };
  }
}

export async function deleteCompanyPermanently(companyId: string): Promise<{ success: boolean; error?: string }> {
  try {
    markCompanyAsDeleted(companyId);

    const supabase = getSupabaseClient();
    if (supabase) {
      try {
        await executeWithJwtRecovery(async (client) => {
          // Deleta membros e empresa no Supabase
          await client.from('company_members').delete().eq('company_id', companyId);
          await client.from('subscriptions').delete().eq('company_id', companyId);
          return await client.from('companies').delete().eq('id', companyId);
        });
      } catch (err) {
        console.warn('Exclusão física no Supabase restrita, mantido tombamento em cache:', err);
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Erro ao excluir empresa.' };
  }
}

// -------------------------------------------------------------
// 4. Gestão de Usuários da Plataforma
// -------------------------------------------------------------

export async function fetchAllPlatformUsers(): Promise<{
  users: PlatformUserItem[];
  metrics: PlatformUsersMetrics;
}> {
  const supabase = getSupabaseClient();
  const deletedCompanyIds = getDeletedCompanyIds();
  const userList: PlatformUserItem[] = [];

  if (supabase) {
    try {
      const { data: members, error } = await executeWithJwtRecovery(async (client) => {
        return await client
          .from('company_members')
          .select('id, user_id, email, name, role, status, company_id, company_name, created_at, joined_at')
          .order('created_at', { ascending: false });
      });

      if (!error && members && Array.isArray(members)) {
        members.forEach((m) => {
          if (m.company_id && deletedCompanyIds.has(m.company_id)) return;
          userList.push({
            id: m.id || m.user_id || `user-${Math.random()}`,
            name: m.name || 'Usuário Sem Nome',
            email: m.email || 'sem-email@ant.app',
            company_id: m.company_id || '',
            company_name: m.company_name || 'Empresa Cadastrada',
            role: (m.role as UserRole) || 'employee',
            status: (m.status as MemberStatus) || 'active',
            created_at: m.created_at || new Date().toISOString(),
            joined_at: m.joined_at,
          });
        });
      }
    } catch (err) {
      console.warn('Erro ao consultar usuários da plataforma no Supabase:', err);
    }
  }

  // Agrupamento de métricas
  const totalUsers = userList.length;
  const activeUsers = userList.filter((u) => u.status === 'active').length;
  const inactiveUsers = userList.filter((u) => u.status === 'inactive' || u.status === 'expired').length;
  const pendingUsers = userList.filter((u) => u.status === 'pending').length;

  const companyUsersCount: Record<string, { companyName: string; count: number }> = {};
  userList.forEach((u) => {
    if (u.company_id) {
      if (!companyUsersCount[u.company_id]) {
        companyUsersCount[u.company_id] = { companyName: u.company_name, count: 0 };
      }
      companyUsersCount[u.company_id].count++;
    }
  });

  const uniqueCompaniesCount = Math.max(1, Object.keys(companyUsersCount).length);
  const avgUsersPerCompany = totalUsers > 0 ? Number((totalUsers / uniqueCompaniesCount).toFixed(1)) : 0;

  const metrics: PlatformUsersMetrics = {
    totalUsers,
    activeUsers,
    inactiveUsers,
    pendingUsers,
    avgUsersPerCompany,
    companyUsersCount,
  };

  return { users: userList, metrics };
}

// -------------------------------------------------------------
// 5. Gestão de Planos Customizados (Sem alterar código)
// -------------------------------------------------------------

export function getDefaultCustomPlans(): Record<PlanId, CustomPlanConfig> {
  return {
    starter: {
      id: 'starter',
      name: 'Starter',
      description: 'Ideal para autônomos e pequenos negócios iniciando a organização.',
      priceMonthly: 29.9,
      maxUsers: 2,
      maxProducts: 200,
      badge: 'Básico',
      features: {
        canManageStock: true,
        canManageMovements: true,
        canAccessPricing: true,
        canAccessFinancial: false,
        canAccessBusinessHealth: false,
        canAccessCharts: true,
        canAccessReports: true,
        canManageUsers: false,
      },
    },
    business: {
      id: 'business',
      name: 'Business',
      description: 'O plano completo para microempresas que buscam controle financeiro e crescimento.',
      priceMonthly: 59.9,
      maxUsers: 5,
      maxProducts: 2000,
      badge: 'Mais Escolhido',
      isPopular: true,
      features: {
        canManageStock: true,
        canManageMovements: true,
        canAccessPricing: true,
        canAccessFinancial: true,
        canAccessBusinessHealth: true,
        canAccessCharts: true,
        canAccessReports: true,
        canManageUsers: true,
      },
    },
    enterprise: {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'Máxima potência, volume ilimitado e recursos avançados de gestão.',
      priceMonthly: 149.9,
      maxUsers: 999, // Ilimitado
      maxProducts: 99999, // Ilimitado
      badge: 'Ilimitado',
      features: {
        canManageStock: true,
        canManageMovements: true,
        canAccessPricing: true,
        canAccessFinancial: true,
        canAccessBusinessHealth: true,
        canAccessCharts: true,
        canAccessReports: true,
        canManageUsers: true,
      },
    },
  };
}

export function fetchCustomPlansConfig(): Record<PlanId, CustomPlanConfig> {
  try {
    const raw = localStorage.getItem(ADMIN_CUSTOM_PLANS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.starter && parsed.business && parsed.enterprise) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Erro ao carregar planos customizados:', err);
  }
  return getDefaultCustomPlans();
}

export function saveCustomPlansConfig(configs: Record<PlanId, CustomPlanConfig>): void {
  try {
    localStorage.setItem(ADMIN_CUSTOM_PLANS_KEY, JSON.stringify(configs));
    window.dispatchEvent(new CustomEvent('ant_plans_updated', { detail: configs }));
  } catch (err) {
    console.warn('Erro ao salvar planos customizados:', err);
  }
}

export function resetCustomPlansConfig(): Record<PlanId, CustomPlanConfig> {
  const defaults = getDefaultCustomPlans();
  saveCustomPlansConfig(defaults);
  return defaults;
}

// -------------------------------------------------------------
// 6. Configurações da Plataforma ANT
// -------------------------------------------------------------

export function getDefaultPlatformSettings(): PlatformGeneralSettings {
  return {
    platformName: 'ANT — Automate and Transform',
    supportEmail: 'suporte@antgestao.com.br',
    defaultTrialDays: 14,
    allowNewSignups: true,
    maintenanceMode: false,
    maintenanceMessage: 'Estamos realizando uma breve manutenção preventiva. Retornaremos em breve.',
    institutionalNotice: 'Bem-vindo ao ANT! Conheça as atualizações e melhorias da plataforma.',
    showNoticeBanner: false,
  };
}

export function fetchPlatformSettings(): PlatformGeneralSettings {
  try {
    const raw = localStorage.getItem(ADMIN_PLATFORM_SETTINGS_KEY);
    if (raw) {
      return { ...getDefaultPlatformSettings(), ...JSON.parse(raw) };
    }
  } catch {
    // fallback
  }
  return getDefaultPlatformSettings();
}

export function savePlatformSettings(settings: Partial<PlatformGeneralSettings>): PlatformGeneralSettings {
  try {
    const current = fetchPlatformSettings();
    const updated: PlatformGeneralSettings = {
      ...current,
      ...settings,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(ADMIN_PLATFORM_SETTINGS_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('ant_settings_updated', { detail: updated }));
    return updated;
  } catch (err) {
    console.warn('Erro ao salvar configurações da plataforma:', err);
    return fetchPlatformSettings();
  }
}

// -------------------------------------------------------------
// 7. Preparação para Cobranças Futuras (Mercado Pago Ready)
// -------------------------------------------------------------

export async function fetchBillingHistory(targetCompanyId?: string): Promise<BillingHistoryItem[]> {
  const companies = await fetchAllAdminCompanies();
  const plans = fetchCustomPlansConfig();

  // Histórico estruturado para exibição e futuro processamento via Mercado Pago
  const history: BillingHistoryItem[] = [];

  companies.forEach((comp, idx) => {
    if (targetCompanyId && comp.id !== targetCompanyId) return;

    const plan = plans[comp.plan_id] || plans.starter;
    const createdDate = new Date(comp.created_at);

    // Registro da fatura atual / recente
    history.push({
      id: `FAT-${createdDate.getFullYear()}${(createdDate.getMonth() + 1).toString().padStart(2, '0')}-${comp.id.substring(0, 6).toUpperCase()}`,
      company_id: comp.id,
      company_name: comp.company_name,
      plan_id: comp.plan_id,
      plan_name: plan.name,
      amount: plan.priceMonthly,
      status: comp.subscription_status === 'active' ? 'paid' : comp.subscription_status === 'suspended' ? 'overdue' : 'pending',
      due_date: comp.next_billing_date || new Date().toISOString(),
      paid_at: comp.subscription_status === 'active' ? comp.created_at : undefined,
      payment_method_preview: idx % 2 === 0 ? 'pix' : 'credit_card',
      gateway_preview: 'mercadopago',
      external_reference: `MP-ANT-${comp.id.substring(0, 8)}`,
      created_at: comp.created_at,
    });
  });

  return history;
}

// -------------------------------------------------------------
// 8. Cálculo de Métricas Executivas do SaaS
// -------------------------------------------------------------

export async function calculateAdminMetrics(): Promise<{
  metrics: AdminMetrics;
  companies: AdminCompanyItem[];
  overview: AdminSubscriptionOverview;
}> {
  const companies = await fetchAllAdminCompanies();
  const customPlans = fetchCustomPlansConfig();

  const totalCompanies = companies.length;
  let trialCompanies = 0;
  let activeCompanies = 0;
  let expiredCompanies = 0;
  let suspendedCompanies = 0;
  let canceledCompanies = 0;
  let totalUsers = 0;
  let starterClients = 0;
  let businessClients = 0;
  let enterpriseClients = 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let newClientsLast30Days = 0;

  companies.forEach((comp) => {
    if (comp.subscription_status === 'trial') trialCompanies++;
    else if (comp.subscription_status === 'active') activeCompanies++;
    else if (comp.subscription_status === 'expired') expiredCompanies++;
    else if (comp.subscription_status === 'suspended') suspendedCompanies++;
    else if (comp.subscription_status === 'canceled') canceledCompanies++;

    totalUsers += comp.users_count || 1;

    if (comp.plan_id === 'starter') starterClients++;
    else if (comp.plan_id === 'business') businessClients++;
    else if (comp.plan_id === 'enterprise') enterpriseClients++;

    try {
      const createdDate = new Date(comp.created_at);
      if (createdDate >= thirtyDaysAgo) {
        newClientsLast30Days++;
      }
    } catch {
      // ignore
    }
  });

  // Preços configurados na plataforma
  const starterPrice = customPlans.starter.priceMonthly;
  const businessPrice = customPlans.business.priceMonthly;
  const enterprisePrice = customPlans.enterprise.priceMonthly;

  const starterActive = companies.filter((c) => c.subscription_status === 'active' && c.plan_id === 'starter').length;
  const businessActive = companies.filter((c) => c.subscription_status === 'active' && c.plan_id === 'business').length;
  const enterpriseActive = companies.filter((c) => c.subscription_status === 'active' && c.plan_id === 'enterprise').length;

  const starterRevenue = starterActive * starterPrice;
  const businessRevenue = businessActive * businessPrice;
  const enterpriseRevenue = enterpriseActive * enterprisePrice;
  const estimatedMRR = starterRevenue + businessRevenue + enterpriseRevenue;

  const totalDecidedOrTrial = activeCompanies + expiredCompanies + trialCompanies;
  const trialConversionRate = totalDecidedOrTrial > 0 ? (activeCompanies / totalDecidedOrTrial) * 100 : 0;

  const basePrevious = Math.max(1, totalCompanies - newClientsLast30Days);
  const monthlyGrowthRate = (newClientsLast30Days / basePrevious) * 100;

  const metrics: AdminMetrics = {
    totalCompanies,
    trialCompanies,
    activeCompanies,
    expiredCompanies,
    suspendedCompanies,
    canceledCompanies,
    totalUsers,
    newClientsLast30Days,
    starterClients,
    businessClients,
    enterpriseClients,
    estimatedMRR,
    revenueByPlan: {
      starter: starterRevenue,
      business: businessRevenue,
      enterprise: enterpriseRevenue,
    },
    trialConversionRate: Number(trialConversionRate.toFixed(1)),
    monthlyGrowthRate: Number(monthlyGrowthRate.toFixed(1)),
  };

  const overview: AdminSubscriptionOverview = {
    mrr: estimatedMRR,
    arr: estimatedMRR * 12,
    arpu: activeCompanies > 0 ? estimatedMRR / activeCompanies : 0,
    activePaidCount: activeCompanies,
    trialCount: trialCompanies,
    churnRate: totalCompanies > 0 ? Number(((expiredCompanies / totalCompanies) * 100).toFixed(1)) : 0,
  };

  return { metrics, companies, overview };
}
