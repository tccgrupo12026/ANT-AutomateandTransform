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
 * Limpa qualquer resquício de papéis simulados gravados anteriormente no localStorage.
 */
export function clearLegacySimulatedRoles(): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(SIMULATED_ROLE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch (err) {
    console.warn('Erro ao limpar papéis simulados legados:', err);
  }
}

/**
 * Retorna o membro proprietário padrão para o usuário autenticado.
 */
export function createDefaultOwnerMember(
  companyId: string,
  user?: { id?: string; email?: string; name?: string }
): CompanyMember {
  const now = new Date().toISOString();
  return {
    id: user?.id || 'owner-account-id',
    company_id: companyId,
    user_id: user?.id || null,
    email: user?.email || 'proprietario@ant.app',
    name: user?.name || 'Proprietário',
    role: 'owner',
    status: 'active',
    invited_at: now,
    joined_at: now,
    created_at: now,
    updated_at: now,
  };
}

/**
 * Salva a lista de membros no cache local, filtrando quaisquer dados fictícios/mock antigos.
 */
function saveMembersToCache(companyId: string, members: CompanyMember[]): void {
  try {
    const sanitized = members.filter(
      (m) => m.id !== 'emp-sample-1' && m.email !== 'operacao.estoque@ant.app'
    );
    localStorage.setItem(`${MEMBERS_CACHE_PREFIX}${companyId}`, JSON.stringify(sanitized));
  } catch (err) {
    console.warn('Erro ao salvar membros no cache local:', err);
  }
}

/**
 * Lê os membros do cache local, limpando registros de exemplo legados.
 */
function loadMembersFromCache(companyId: string): CompanyMember[] | null {
  try {
    const raw = localStorage.getItem(`${MEMBERS_CACHE_PREFIX}${companyId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as CompanyMember[];
      // Filtra usuários mock/fictícios legados
      const clean = parsed.filter(
        (m) => m.id !== 'emp-sample-1' && m.email !== 'operacao.estoque@ant.app'
      );
      if (clean.length !== parsed.length) {
        saveMembersToCache(companyId, clean);
      }
      return clean;
    }
  } catch (err) {
    console.warn('Erro ao carregar membros do cache local:', err);
  }
  return null;
}

/**
 * Carrega todos os membros da empresa do Supabase ou Cache local.
 * Garante que apenas usuários reais façam parte da listagem.
 */
export async function fetchCompanyMembers(
  companyId: string,
  currentUser?: { id?: string; email?: string; name?: string }
): Promise<CompanyMember[]> {
  // Limpeza de papéis simulados para garantir integridade
  clearLegacySimulatedRoles();

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

      if (!error && data && Array.isArray(data)) {
        // Filtra possíveis registros de exemplo do banco
        let members = (data as CompanyMember[]).filter(
          (m) => m.id !== 'emp-sample-1' && m.email !== 'operacao.estoque@ant.app'
        );

        // Se o usuário atual logado não estiver na lista, garante o proprietário
        if (currentUser?.email) {
          const hasCurrentUser = members.some(
            (m) => m.email.toLowerCase() === currentUser.email!.toLowerCase()
          );
          if (!hasCurrentUser) {
            const ownerMember = createDefaultOwnerMember(companyId, currentUser);
            members = [ownerMember, ...members];
          }
        } else if (members.length === 0) {
          const ownerMember = createDefaultOwnerMember(companyId, currentUser);
          members = [ownerMember];
        }

        saveMembersToCache(companyId, members);
        return members;
      }
    } catch (err) {
      console.warn('Falha na consulta remota de membros da empresa:', err);
    }
  }

  // Fallback para cache local
  const cached = loadMembersFromCache(companyId);
  if (cached && cached.length > 0) {
    // Garante que o usuário logado está presente como proprietário se for o único ou se for o dono
    if (currentUser?.email) {
      const hasCurrentUser = cached.some(
        (m) => m.email.toLowerCase() === currentUser.email!.toLowerCase()
      );
      if (!hasCurrentUser) {
        const ownerMember = createDefaultOwnerMember(companyId, currentUser);
        const merged = [ownerMember, ...cached];
        saveMembersToCache(companyId, merged);
        return merged;
      }
    }
    return cached;
  }

  // Se não houver nada, inicializa apenas com o proprietário real autenticado (SEM usuários de exemplo)
  const initial = [createDefaultOwnerMember(companyId, currentUser)];
  saveMembersToCache(companyId, initial);
  return initial;
}

/**
 * Convida / Adiciona um novo colaborador à equipe da empresa.
 */
export async function inviteCompanyMember(
  companyId: string,
  data: { name: string; email: string; role: UserRole }
): Promise<{ success: boolean; member?: CompanyMember; error?: string }> {
  const emailClean = data.email.trim().toLowerCase();
  const nameClean = data.name.trim();

  // Verifica duplicação no cache local
  const current = loadMembersFromCache(companyId) || [];
  const exists = current.some((m) => m.email.toLowerCase() === emailClean);
  if (exists) {
    return { success: false, error: 'Este e-mail já faz parte da equipe da empresa.' };
  }

  const now = new Date().toISOString();
  const newMember: CompanyMember = {
    id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `member_${Date.now()}`,
    company_id: companyId,
    user_id: null,
    name: nameClean,
    email: emailClean,
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
        const updated = [...current, inserted as CompanyMember];
        saveMembersToCache(companyId, updated);
        return { success: true, member: inserted as CompanyMember };
      } else if (error) {
        console.warn('Erro do Supabase ao inserir membro:', error.message);
      }
    } catch (err: any) {
      console.warn('Erro ao inserir membro no Supabase:', err);
    }
  }

  // Fallback Local
  const updated = [...current, newMember];
  saveMembersToCache(companyId, updated);
  return { success: true, member: newMember };
}

/**
 * Edita informações completas de um colaborador (Nome, E-mail, Papel, Status).
 */
export async function updateCompanyMember(
  companyId: string,
  memberId: string,
  data: { name: string; email: string; role: UserRole; status?: MemberStatus }
): Promise<{ success: boolean; error?: string }> {
  const current = loadMembersFromCache(companyId) || [];
  const target = current.find((m) => m.id === memberId);

  if (!target) {
    return { success: false, error: 'Colaborador não encontrado.' };
  }

  const emailClean = data.email.trim().toLowerCase();
  const nameClean = data.name.trim();
  const nextStatus = data.status || target.status;

  // Se alterou o email, verifica se outro membro já usa
  if (emailClean !== target.email.toLowerCase()) {
    const duplicate = current.some(
      (m) => m.id !== memberId && m.email.toLowerCase() === emailClean
    );
    if (duplicate) {
      return { success: false, error: 'Este e-mail já está sendo utilizado por outro membro da equipe.' };
    }
  }

  // Validação de segurança: Não permitir que a empresa fique sem nenhum proprietário
  if (target.role === 'owner' && (data.role !== 'owner' || nextStatus === 'inactive')) {
    const activeOwners = current.filter(
      (m) => m.role === 'owner' && m.id !== memberId && m.status === 'active'
    );
    if (activeOwners.length === 0) {
      return {
        success: false,
        error: 'A empresa precisa de pelo menos 1 Proprietário ativo. Promova ou mantenha outro proprietário ativo antes desta alteração.',
      };
    }
  }

  const now = new Date().toISOString();
  const supabase = getSupabaseClient();

  if (supabase) {
    try {
      const { error } = await executeWithJwtRecovery(async (client) => {
        return await client
          .from('company_members')
          .update({
            name: nameClean,
            email: emailClean,
            role: data.role,
            status: nextStatus,
            updated_at: now,
          })
          .eq('id', memberId);
      });

      if (!error) {
        const updated = current.map((m) =>
          m.id === memberId
            ? { ...m, name: nameClean, email: emailClean, role: data.role, status: nextStatus, updated_at: now }
            : m
        );
        saveMembersToCache(companyId, updated);
        return { success: true };
      }
    } catch (err: any) {
      console.warn('Erro ao atualizar membro no Supabase:', err);
    }
  }

  // Fallback Local
  const updated = current.map((m) =>
    m.id === memberId
      ? { ...m, name: nameClean, email: emailClean, role: data.role, status: nextStatus, updated_at: now }
      : m
  );
  saveMembersToCache(companyId, updated);
  return { success: true };
}

/**
 * Altera apenas o papel (role) de um membro da equipe.
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

  return await updateCompanyMember(companyId, memberId, {
    name: target.name,
    email: target.email,
    role: newRole,
  });
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
    const remainingOwners = current.filter(
      (m) => m.role === 'owner' && m.id !== memberId && m.status === 'active'
    );
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

  const now = new Date().toISOString();
  const updated = current.map((m) =>
    m.id === memberId ? { ...m, invited_at: now, updated_at: now } : m
  );
  saveMembersToCache(companyId, updated);
  return {
    success: true,
    message: `Convite de ${target.name} (${target.email}) renovado no sistema. (Nota: Envio automático de e-mail ainda não configurado).`,
  };
}

