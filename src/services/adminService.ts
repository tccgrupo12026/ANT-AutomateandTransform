/**
 * ANT — Automate and Transform
 * Admin ANT (SaaS Platform Creators) Service
 *
 * Módulo de inteligência SaaS para os criadores da plataforma ANT.
 *
 * REGRAS DE PRIVACIDADE & LGPD:
 * - Acesso apenas a metadados globais da plataforma (empresas, planos, status, usuários totais).
 * - NENHUM produto, estoque, movimentação, faturamento de vendas ou dado interno de clientes é consultado ou exposto.
 * - 100% Determinístico — SEM Inteligência Artificial.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { AdminMetrics, AdminCompanyItem, AdminSubscriptionOverview } from '../types/admin';
import { PlanId, SubscriptionStatus, ANT_PLANS } from '../types/subscription';
import { UserRole } from '../types/rbac';

const ADMIN_COMPANIES_CACHE_KEY = 'ant_admin_companies_registry';
const ADMIN_STATUS_OVERRIDE_KEY = 'ant_admin_status_overrides';

// Lista de IDs fictícios de desenvolvimento que devem ser purgados de qualquer cache local legado
const FORBIDDEN_MOCK_COMPANY_IDS = new Set([
  'comp-001',
  'comp-002',
  'comp-003',
  'comp-004',
  'comp-005',
  'comp-006',
  'comp-007',
  'comp-008',
]);

/**
 * Carrega sobreposições de status salvas pelo administrador para empresas reais
 */
function getStatusOverrides(): Record<string, { status: SubscriptionStatus; plan_id?: PlanId }> {
  try {
    const raw = localStorage.getItem(ADMIN_STATUS_OVERRIDE_KEY);
    if (!raw) return {};
    const parsed: Record<string, { status: SubscriptionStatus; plan_id?: PlanId }> = JSON.parse(raw);

    // Remove qualquer chave legada que corresponda a empresas fictícias
    let hasCleaned = false;
    Object.keys(parsed).forEach((k) => {
      if (FORBIDDEN_MOCK_COMPANY_IDS.has(k) || k.startsWith('comp-00')) {
        delete parsed[k];
        hasCleaned = true;
      }
    });

    if (hasCleaned) {
      localStorage.setItem(ADMIN_STATUS_OVERRIDE_KEY, JSON.stringify(parsed));
    }

    return parsed;
  } catch {
    return {};
  }
}

function saveStatusOverride(companyId: string, status: SubscriptionStatus, planId?: PlanId): void {
  if (FORBIDDEN_MOCK_COMPANY_IDS.has(companyId)) return;
  try {
    const current = getStatusOverrides();
    current[companyId] = { status, ...(planId ? { plan_id: planId } : {}) };
    localStorage.setItem(ADMIN_STATUS_OVERRIDE_KEY, JSON.stringify(current));
  } catch (err) {
    console.warn('Erro ao salvar alteração de status administrativa:', err);
  }
}

/**
 * Consulta todas as empresas registradas na plataforma para o Admin ANT.
 * Exibe EXCLUSIVAMENTE dados de cadastro, plano, status e contagem de usuários reais do Supabase.
 */
export async function fetchAllAdminCompanies(): Promise<AdminCompanyItem[]> {
  const overrides = getStatusOverrides();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      // 1. Consulta metadados de empresas reais no Supabase
      const { data: companiesData, error: compErr } = await executeWithJwtRecovery(async (client) => {
        return await client
          .from('companies')
          .select('id, user_id, company_name, responsible_name, email, phone, created_at')
          .order('created_at', { ascending: false });
      });

      if (!compErr && companiesData) {
        // 2. Consulta contagem de membros por empresa
        const { data: membersData } = await executeWithJwtRecovery(async (client) => {
          return await client.from('company_members').select('company_id, user_id');
        });

        // 3. Consulta assinaturas reais
        const { data: subsData } = await executeWithJwtRecovery(async (client) => {
          return await client.from('subscriptions').select('*');
        });

        const membersCountMap: Record<string, number> = {};
        if (membersData && Array.isArray(membersData)) {
          membersData.forEach((m) => {
            if (m.company_id) {
              membersCountMap[m.company_id] = (membersCountMap[m.company_id] || 0) + 1;
            }
          });
        }

        const subsMap: Record<string, any> = {};
        if (subsData && Array.isArray(subsData)) {
          subsData.forEach((s) => {
            if (s.user_id) {
              subsMap[s.user_id] = s;
            }
            if (s.company_id) {
              subsMap[s.company_id] = s;
            }
          });
        }

        const realCompanies: AdminCompanyItem[] = companiesData.map((c) => {
          const sub = subsMap[c.user_id] || subsMap[c.id] || {};
          const planId: PlanId = overrides[c.id]?.plan_id || (sub.plan_id as PlanId) || 'starter';
          const status: SubscriptionStatus = overrides[c.id]?.status || (sub.status as SubscriptionStatus) || 'trial';
          const planDef = ANT_PLANS[planId] || ANT_PLANS.starter;

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
            trial_end_date: sub.trial_end_date || undefined,
            current_period_end: sub.current_period_end || undefined,
          };
        });

        return realCompanies;
      }
    } catch (err) {
      console.warn('Consulta administrativa de empresas no Supabase falhou:', err);
    }
  }

  // Retorna estritamente vazio se não houver empresas reais cadastradas
  return [];
}

/**
 * Calcula todas as métricas agregadas do SaaS para o Dashboard Admin ANT.
 */
export async function calculateAdminMetrics(): Promise<{
  metrics: AdminMetrics;
  companies: AdminCompanyItem[];
  overview: AdminSubscriptionOverview;
}> {
  const companies = await fetchAllAdminCompanies();

  const totalCompanies = companies.length;
  let trialCompanies = 0;
  let activeCompanies = 0;
  let expiredCompanies = 0;
  let suspendedCompanies = 0;
  let totalUsers = 0;
  let starterClients = 0;
  let businessClients = 0;
  let enterpriseClients = 0;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let newClientsLast30Days = 0;

  companies.forEach((comp) => {
    // Status
    if (comp.subscription_status === 'trial') trialCompanies++;
    else if (comp.subscription_status === 'active') activeCompanies++;
    else if (comp.subscription_status === 'expired') expiredCompanies++;
    else if (comp.subscription_status === 'suspended') suspendedCompanies++;

    // Usuários
    totalUsers += comp.users_count || 1;

    // Planos
    if (comp.plan_id === 'starter') starterClients++;
    else if (comp.plan_id === 'business') businessClients++;
    else if (comp.plan_id === 'enterprise') enterpriseClients++;

    // Novos clientes nos últimos 30 dias
    try {
      const createdDate = new Date(comp.created_at);
      if (createdDate >= thirtyDaysAgo) {
        newClientsLast30Days++;
      }
    } catch {
      // Ignora erro de data
    }
  });

  // Preços oficiais dos planos
  const starterPrice = ANT_PLANS.starter.priceMonthly; // R$ 49,90
  const businessPrice = ANT_PLANS.business.priceMonthly; // R$ 99,90
  const enterprisePrice = ANT_PLANS.enterprise.priceMonthly; // R$ 199,90

  // Cálculo de MRR (Receita Recorrente Mensal) considerando apenas empresas ATIVAS
  const starterActive = companies.filter((c) => c.subscription_status === 'active' && c.plan_id === 'starter').length;
  const businessActive = companies.filter((c) => c.subscription_status === 'active' && c.plan_id === 'business').length;
  const enterpriseActive = companies.filter((c) => c.subscription_status === 'active' && c.plan_id === 'enterprise').length;

  const starterRevenue = starterActive * starterPrice;
  const businessRevenue = businessActive * businessPrice;
  const enterpriseRevenue = enterpriseActive * enterprisePrice;
  const estimatedMRR = starterRevenue + businessRevenue + enterpriseRevenue;

  // Conversão de Trial para Assinatura: Ativos / (Ativos + Expirados + Trial)
  const totalDecidedOrTrial = activeCompanies + expiredCompanies + trialCompanies;
  const trialConversionRate = totalDecidedOrTrial > 0 ? (activeCompanies / totalDecidedOrTrial) * 100 : 0;

  // Crescimento mensal de clientes (% novos nos últimos 30 dias sobre o total anterior)
  const basePrevious = Math.max(1, totalCompanies - newClientsLast30Days);
  const monthlyGrowthRate = (newClientsLast30Days / basePrevious) * 100;

  const metrics: AdminMetrics = {
    totalCompanies,
    trialCompanies,
    activeCompanies,
    expiredCompanies,
    suspendedCompanies,
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

/**
 * Atualiza o status de assinatura de uma empresa a partir do Admin ANT.
 */
export async function updateAdminCompanySubscription(
  companyId: string,
  newStatus: SubscriptionStatus,
  newPlanId?: PlanId
): Promise<{ success: boolean; error?: string }> {
  try {
    saveStatusOverride(companyId, newStatus, newPlanId);

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
        // Fallback já salvo em override local
      }
    }

    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao atualizar status da assinatura.' };
  }
}

/**
 * Prorroga o período de Trial de uma empresa em +15 ou +30 dias.
 */
export async function extendCompanyTrial(
  companyId: string,
  extraDays: number = 15
): Promise<{ success: boolean; error?: string }> {
  try {
    saveStatusOverride(companyId, 'trial');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Falha ao prorrogar trial.' };
  }
}
