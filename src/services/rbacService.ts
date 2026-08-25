/**
 * ANT — Automate and Transform
 * RBAC & Team Members Service
 *
 * Gerencia os membros da equipe da empresa, papéis (Proprietário / Funcionário),
 * convites e controle de permissões.
 * Integração com Supabase (tabela `company_members`) com fallback seguro em LocalStorage.
 * 100% Determinístico — SEM Inteligência Artificial.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { CompanyMember, UserRole, MemberStatus } from '../types/rbac';

const MEMBERS_CACHE_PREFIX = 'ant_company_members_';
const SIMULATED_ROLE_PREFIX = 'ant_simulated_role_';

/**
 * Retorna os membros iniciais padrão quando ainda não há dados no banco.
 */
export function createDefaultOwnerMember(companyId: string, user?: { id?: string; email?: string; name?: string }): CompanyMember {
  const now = new Date().toISOString();
  return {
    id: user?.id || 'owner-default-id',
    company_id: companyId,
    user_id: user?.id || null,
    email: user?.email || 'proprietario@ant.app',
    name: user?.name || 'Proprietário da Empresa',
    role: 'owner',
    status: 'active',
    invited_at: now,
    joined_at: now,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Cria lista inicial com o proprietário e um funcionário de exemplo caso desejado.
 */
export function createInitialSeedMembers(companyId: string, user?: { id?: string; email?: string; name?: string }): CompanyMember[] {
  const owner = createDefaultOwnerMember(companyId, user);
  const now = new Date().toISOString();
  const sampleEmployee: CompanyMember = {
    id: 'emp-sample-1',
    company_id: companyId,
    user_id: null,
    email: 'operacao.estoque@ant.app',
    name: 'Carlos Oliveira (Operacional)',
    role: 'employee',
    status: 'active',
    invited_at: now,
    joined_at: now,
    created_at: now,
    updated_at: now,
  };

  return [owner, sampleEmployee];
}

/**
 * Salva a lista de membros no cache local.
 */
function saveMembersToCache(companyId: string, members: CompanyMember[]): void {
  try {
    localStorage.setItem(`${MEMBERS_CACHE_PREFIX}${companyId}`, JSON.stringify(members));
  } catch (err) {
    console.warn('Erro ao salvar membros no cache local:', err);
  }
}

/**
 * Lê os membros do cache local.
 */
function loadMembersFromCache(companyId: string): CompanyMember[] | null {
  try {
    const raw = localStorage.getItem(`${MEMBERS_CACHE_PREFIX}${companyId}`);
    if (raw) {
      return JSON.parse(raw) as CompanyMember[];
    }
  } catch (err) {
    console.warn('Erro ao carregar membros do cache local:', err);
  }
  return null;
}

/**
 * Carrega todos os membros da empresa do Supabase ou Cache.
 */
export async function fetchCompanyMembers(
  companyId: string,
  currentUser?: { id?: string; email?: string; name?: string }
): Promise<CompanyMember[]> {
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { data, error } = await executeWithJwtRecovery(async (client) => {
        return await client
          .from('company_members')
          .select('*')
          .eq('company_id', companyId)
          .order('created_at', { ascending: true });
      });

      if (!error && data && Array.isArray(data) && data.length > 0) {
        const members = data as CompanyMember[];
        saveMembersToCache(companyId, members);
        return members;
      }
    } catch (err) {
      console.warn('Falha na consulta remota de membros da empresa:', err);
    }
  }

  // Fallback para cache local ou seed inicial
  const cached = loadMembersFromCache(companyId);
  if (cached && cached.length > 0) {
    return cached;
  }

  const initial = createInitialSeedMembers(companyId, currentUser);
  saveMembersToCache(companyId, initial);
  return initial;
}

/**
 * Convida / Adiciona um novo membro à equipe da empresa.
 */
export async function inviteCompanyMember(
  companyId: string,
  data: { name: string; email: string; role: UserRole }
): Promise<{ success: boolean; member?: CompanyMember; error?: string }> {
  const now = new Date().toISOString();
  const newMember: CompanyMember = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `member_${Date.now()}`,
    company_id: companyId,
    user_id: null,
    name: data.name.trim(),
    email: data.email.trim().toLowerCase(),
    role: data.role,
    status: 'pending',
    invited_at: now,
    joined_at: null,
    created_at: now,
    updated_at: now,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data: inserted, error } = await executeWithJwtRecovery(async (client) => {
        return await client.from('company_members').insert([newMember]).select().single();
      });

      if (!error && inserted) {
        // Atualiza cache
        const current = loadMembersFromCache(companyId) || [];
        const updated = [...current, inserted as CompanyMember];
        saveMembersToCache(companyId, updated);
        return { success: true, member: inserted as CompanyMember };
      }
    } catch (err: any) {
      console.warn('Erro ao inserir membro no Supabase:', err);
    }
  }

  // Fallback Local
  const current = loadMembersFromCache(companyId) || [];
  // Verifica se email já existe
  const exists = current.some((m) => m.email.toLowerCase() === newMember.email.toLowerCase());
  if (exists) {
    return { success: false, error: 'Este e-mail já faz parte da equipe da empresa.' };
  }

  const updated = [...current, newMember];
  saveMembersToCache(companyId, updated);
  return { success: true, member: newMember };
}

/**
 * Altera o papel (role) de um membro da equipe.
 */
export async function updateMemberRole(
  companyId: string,
  memberId: string,
  newRole: UserRole
): Promise<{ success: boolean; error?: string }> {
  const current = loadMembersFromCache(companyId) || [];
  const target = current.find((m) => m.id === memberId);

  if (!target) {
    return { success: false, error: 'Membro não encontrado.' };
  }

  // Validação de segurança: Não permitir que a empresa fique sem nenhum proprietário
  if (target.role === 'owner' && newRole !== 'owner') {
    const activeOwners = current.filter((m) => m.role === 'owner' && m.id !== memberId && m.status === 'active');
    if (activeOwners.length === 0) {
      return {
        success: false,
        error: 'A empresa precisa de pelo menos 1 Proprietário ativo. Promova outro membro antes de alterar este papel.',
      };
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await executeWithJwtRecovery(async (client) => {
        return await client
          .from('company_members')
          .update({ role: newRole, updated_at: new Date().toISOString() })
          .eq('id', memberId);
      });
      if (!error) {
        const updated = current.map((m) => (m.id === memberId ? { ...m, role: newRole, updated_at: new Date().toISOString() } : m));
        saveMembersToCache(companyId, updated);
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Erro ao atualizar membro no Supabase:', err);
    }
  }

  // Fallback Local
  const updated = current.map((m) => (m.id === memberId ? { ...m, role: newRole, updated_at: new Date().toISOString() } : m));
  saveMembersToCache(companyId, updated);
  return { success: true };
}

/**
 * Remove um membro da empresa.
 */
export async function removeCompanyMember(
  companyId: string,
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const current = loadMembersFromCache(companyId) || [];
  const target = current.find((m) => m.id === memberId);

  if (!target) {
    return { success: false, error: 'Membro não encontrado.' };
  }

  // Validação: Não permitir remover o único proprietário
  if (target.role === 'owner') {
    const remainingOwners = current.filter((m) => m.role === 'owner' && m.id !== memberId && m.status === 'active');
    if (remainingOwners.length === 0) {
      return {
        success: false,
        error: 'Não é possível remover o único Proprietário da empresa.',
      };
    }
  }

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await executeWithJwtRecovery(async (client) => {
        return await client.from('company_members').delete().eq('id', memberId);
      });
      if (!error) {
        const updated = current.filter((m) => m.id !== memberId);
        saveMembersToCache(companyId, updated);
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Erro ao remover membro no Supabase:', err);
    }
  }

  // Fallback Local
  const updated = current.filter((m) => m.id !== memberId);
  saveMembersToCache(companyId, updated);
  return { success: true };
}

/**
 * Reenvia o convite para um membro pendente.
 */
export async function resendMemberInvitation(
  companyId: string,
  memberId: string
): Promise<{ success: boolean; message: string }> {
  const current = loadMembersFromCache(companyId) || [];
  const target = current.find((m) => m.id === memberId);
  if (!target) {
    return { success: false, message: 'Membro não encontrado.' };
  }

  const updated = current.map((m) =>
    m.id === memberId ? { ...m, invited_at: new Date().toISOString(), updated_at: new Date().toISOString() } : m
  );
  saveMembersToCache(companyId, updated);
  return { success: true, message: `Convite reenviado com sucesso para ${target.email}` };
}

/**
 * Persistência do papel simulado para testes rápidos no ambiente de desenvolvimento.
 */
export function getStoredSimulatedRole(companyId: string): UserRole | null {
  try {
    const raw = localStorage.getItem(`${SIMULATED_ROLE_PREFIX}${companyId}`);
    if (raw === 'owner' || raw === 'employee' || raw === 'manager' || raw === 'ant_admin') {
      return raw as UserRole;
    }
  } catch (err) {
    console.warn('Erro ao recuperar papel simulado:', err);
  }
  return null;
}

export function setStoredSimulatedRole(companyId: string, role: UserRole | null): void {
  try {
    if (role) {
      localStorage.setItem(`${SIMULATED_ROLE_PREFIX}${companyId}`, role);
    } else {
      localStorage.removeItem(`${SIMULATED_ROLE_PREFIX}${companyId}`);
    }
  } catch (err) {
    console.warn('Erro ao salvar papel simulado:', err);
  }
}
