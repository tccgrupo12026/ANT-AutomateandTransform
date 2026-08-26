/**
 * ANT — Automate and Transform
 * RBAC & Team Members Service
 *
 * Gerencia os membros da equipe da empresa, papéis (Proprietário / Funcionário),
 * convites com links únicos e seguros, expiração (7 dias) e controle de permissões.
 * Integração com Supabase (tabela `company_members`) com fallback seguro em LocalStorage.
 * 100% Determinístico — SEM Inteligência Artificial.
 */

import { getSupabaseClient, executeWithJwtRecovery } from '../lib/supabase';
import { CompanyMember, UserRole, MemberStatus, isInviteExpired, getMemberEffectiveStatus } from '../types/rbac';
import { getAppBaseUrl } from '../lib/config';
import { sendInvitationEmail } from './emailService';

const MEMBERS_CACHE_PREFIX = 'ant_company_members_';
const SIMULATED_ROLE_PREFIX = 'ant_simulated_role_';
const INVITATIONS_CACHE_KEY = 'ant_company_invitations_global';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Valida se uma string possui o formato padrão de UUID v4.
 */
export function isValidUuid(str: string | null | undefined): boolean {
  if (!str) return false;
  return UUID_REGEX.test(str.trim());
}

/**
 * Gera um UUID v4 válido compatível com PostgreSQL UUID.
 */
export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    try {
      return crypto.randomUUID();
    } catch {
      // Fallback
    }
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gera um token de convite seguro e criptograficamente aleatório.
 */
export function generateInviteToken(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '') + Math.random().toString(36).substring(2, 10);
  }
  return 'inv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

/**
 * Monta o link único e seguro de aceite de convite.
 */
export function buildInviteLink(token: string): string {
  const baseUrl = getAppBaseUrl();
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}invite_token=${token}`;
}

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
  user?: { id?: string; email?: string; name?: string; companyName?: string }
): CompanyMember {
  const now = new Date().toISOString();
  return {
    id: user?.id || 'owner-account-id',
    company_id: companyId,
    company_name: user?.companyName || 'Minha Empresa',
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

    // Salva também no cache global de convites para resolução rápida por token
    saveGlobalInvitationsCache(sanitized);
  } catch (err) {
    console.warn('Erro ao salvar membros no cache local:', err);
  }
}

/**
 * Sincroniza convites no cache global para leitura rápida por token.
 */
function saveGlobalInvitationsCache(members: CompanyMember[]): void {
  try {
    const raw = localStorage.getItem(INVITATIONS_CACHE_KEY);
    const map: Record<string, CompanyMember> = raw ? JSON.parse(raw) : {};
    members.forEach((m) => {
      if (m.invite_token) {
        map[m.invite_token] = m;
      }
    });
    localStorage.setItem(INVITATIONS_CACHE_KEY, JSON.stringify(map));
  } catch (err) {
    console.warn('Erro ao salvar índice global de convites:', err);
  }
}

/**
 * Lê os membros do cache local, recalculando status efetivos de expiração.
 */
function loadMembersFromCache(companyId: string): CompanyMember[] | null {
  try {
    const raw = localStorage.getItem(`${MEMBERS_CACHE_PREFIX}${companyId}`);
    if (raw) {
      const parsed = JSON.parse(raw) as CompanyMember[];
      const clean = parsed
        .filter((m) => m.id !== 'emp-sample-1' && m.email !== 'operacao.estoque@ant.app')
        .map((m) => ({
          ...m,
          status: getMemberEffectiveStatus(m),
        }));
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
  currentUser?: { id?: string; email?: string; name?: string; companyName?: string }
): Promise<CompanyMember[]> {
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
        let members = (data as CompanyMember[])
          .filter((m) => m.id !== 'emp-sample-1' && m.email !== 'operacao.estoque@ant.app')
          .map((m) => ({
            ...m,
            status: getMemberEffectiveStatus(m),
          }));

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

  // Se não houver nada, inicializa apenas com o proprietário real autenticado
  const initial = [createDefaultOwnerMember(companyId, currentUser)];
  saveMembersToCache(companyId, initial);
  return initial;
}

/**
 * Busca os dados de um membro/convite a partir do token único de convite.
 */
export async function getInvitationByToken(token: string): Promise<CompanyMember | null> {
  if (!token || typeof token !== 'string') return null;
  const cleanToken = token.trim();

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('invite_token', cleanToken)
        .maybeSingle();

      if (!error && data) {
        const member = data as CompanyMember;
        member.status = getMemberEffectiveStatus(member);
        return member;
      }
    } catch (err) {
      console.warn('Erro ao consultar convite por token no Supabase:', err);
    }
  }

  // Fallback para cache global de convites
  try {
    const raw = localStorage.getItem(INVITATIONS_CACHE_KEY);
    if (raw) {
      const map: Record<string, CompanyMember> = JSON.parse(raw);
      if (map[cleanToken]) {
        const member = map[cleanToken];
        member.status = getMemberEffectiveStatus(member);
        return member;
      }
    }

    // Busca iterativa em todos os caches de membros
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MEMBERS_CACHE_PREFIX)) {
        const items = JSON.parse(localStorage.getItem(key) || '[]') as CompanyMember[];
        const found = items.find((m) => m.invite_token === cleanToken);
        if (found) {
          found.status = getMemberEffectiveStatus(found);
          return found;
        }
      }
    }
  } catch (err) {
    console.warn('Erro ao buscar convite no cache local:', err);
  }

  return null;
}

export interface InviteMemberResult {
  success: boolean;
  member?: CompanyMember;
  inviteLink: string;
  emailSent: boolean;
  emailError?: string;
  error?: string;
}

/**
 * Convida um novo colaborador gerando token único, link seguro, data de expiração (7 dias)
 * e realiza o disparo do e-mail real (se o serviço estiver configurado).
 */
export async function inviteCompanyMember(
  companyId: string,
  data: {
    name: string;
    email: string;
    role: UserRole;
    companyName?: string;
    inviterName?: string;
    inviterUserId?: string;
  }
): Promise<InviteMemberResult> {
  const emailClean = data.email.trim().toLowerCase();
  const nameClean = data.name.trim();
  const companyNameClean = data.companyName?.trim() || 'Sua Empresa';
  const inviterNameClean = data.inviterName?.trim() || 'O Proprietário';

  // Verifica duplicação no cache local da empresa
  const current = loadMembersFromCache(companyId) || [];
  const exists = current.some((m) => m.email.toLowerCase() === emailClean && m.status !== 'inactive');
  if (exists) {
    return {
      success: false,
      inviteLink: '',
      emailSent: false,
      error: 'Este e-mail já possui um cadastro ou convite ativo nesta empresa.',
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  // Expiração: 7 dias a partir de agora
  const expiresDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiresAtIso = expiresDate.toISOString();

  const inviteToken = generateInviteToken();
  const inviteLink = buildInviteLink(inviteToken);

  const memberId = generateUUID();
  const validInviterId = isValidUuid(data.inviterUserId) ? data.inviterUserId : null;

  const newMember: CompanyMember = {
    id: memberId,
    company_id: companyId,
    company_name: companyNameClean,
    user_id: null,
    name: nameClean,
    email: emailClean,
    role: data.role,
    status: 'pending',
    invite_token: inviteToken,
    expires_at: expiresAtIso,
    invited_at: nowIso,
    joined_at: null,
    invited_by: validInviterId,
    created_at: nowIso,
    updated_at: nowIso,
  };

  const supabase = getSupabaseClient();
  let persistedMember = newMember;

  if (supabase) {
    try {
      const { data: inserted, error } = await executeWithJwtRecovery(async (client) => {
        return await client.from('company_members').insert([newMember]).select().single();
      });

      if (!error && inserted) {
        persistedMember = inserted as CompanyMember;
      } else if (error) {
        console.warn('Aviso ao inserir convite no Supabase:', error.message);
      }
    } catch (err: any) {
      console.warn('Erro de rede ao persistir convite no Supabase:', err);
    }
  }

  // Atualiza cache local
  const updated = [...current.filter((m) => m.email.toLowerCase() !== emailClean), persistedMember];
  saveMembersToCache(companyId, updated);

  // Tenta disparo REAL do e-mail
  const roleLabel = data.role === 'owner' ? 'Proprietário' : 'Funcionário (Operacional)';
  const emailResult = await sendInvitationEmail({
    toEmail: emailClean,
    toName: nameClean,
    companyName: companyNameClean,
    inviterName: inviterNameClean,
    roleName: roleLabel,
    inviteLink: inviteLink,
    expiresAt: expiresAtIso,
  });

  return {
    success: true,
    member: persistedMember,
    inviteLink: inviteLink,
    emailSent: emailResult.sent,
    emailError: emailResult.sent ? undefined : emailResult.error,
  };
}

/**
 * Reenvia / Renova o convite para um colaborador pendente ou expirado.
 * Gera novo token e nova data de validade de 7 dias.
 */
export async function resendMemberInvitation(
  companyId: string,
  memberId: string,
  options?: { companyName?: string; inviterName?: string }
): Promise<InviteMemberResult> {
  const current = loadMembersFromCache(companyId) || [];
  const target = current.find((m) => m.id === memberId);
  if (!target) {
    return {
      success: false,
      inviteLink: '',
      emailSent: false,
      error: 'Colaborador não encontrado na equipe.',
    };
  }

  const now = new Date();
  const nowIso = now.toISOString();
  const expiresDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const expiresAtIso = expiresDate.toISOString();
  const newInviteToken = generateInviteToken();
  const inviteLink = buildInviteLink(newInviteToken);

  const updatedTarget: CompanyMember = {
    ...target,
    invite_token: newInviteToken,
    expires_at: expiresAtIso,
    invited_at: nowIso,
    status: 'pending',
    updated_at: nowIso,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      await executeWithJwtRecovery(async (client) => {
        return await client
          .from('company_members')
          .update({
            invite_token: newInviteToken,
            expires_at: expiresAtIso,
            invited_at: nowIso,
            status: 'pending',
            updated_at: nowIso,
          })
          .eq('id', memberId);
      });
    } catch (err) {
      console.warn('Erro ao renovar convite no Supabase:', err);
    }
  }

  const updated = current.map((m) => (m.id === memberId ? updatedTarget : m));
  saveMembersToCache(companyId, updated);

  const companyName = options?.companyName || target.company_name || 'Sua Empresa';
  const inviterName = options?.inviterName || 'O Proprietário';
  const roleLabel = target.role === 'owner' ? 'Proprietário' : 'Funcionário';

  const emailResult = await sendInvitationEmail({
    toEmail: target.email,
    toName: target.name,
    companyName: companyName,
    inviterName: inviterName,
    roleName: roleLabel,
    inviteLink: inviteLink,
    expiresAt: expiresAtIso,
  });

  return {
    success: true,
    member: updatedTarget,
    inviteLink: inviteLink,
    emailSent: emailResult.sent,
    emailError: emailResult.sent ? undefined : emailResult.error,
  };
}

/**
 * Aceita o convite e vincula o usuário autenticado à empresa com status 'active'.
 */
export async function acceptInvitation(
  token: string,
  userId: string
): Promise<{ success: boolean; member?: CompanyMember; error?: string }> {
  const invitation = await getInvitationByToken(token);
  if (!invitation) {
    return { success: false, error: 'Convite não encontrado ou token inválido.' };
  }

  if (invitation.status === 'active' && invitation.user_id) {
    return { success: true, member: invitation };
  }

  if (isInviteExpired(invitation)) {
    return {
      success: false,
      error: 'Este convite expirou. Solicite ao proprietário da empresa um novo convite.',
    };
  }

  const nowIso = new Date().toISOString();
  const validUserId = isValidUuid(userId) ? userId : null;

  const updatedMember: CompanyMember = {
    ...invitation,
    user_id: validUserId || invitation.user_id || userId,
    status: 'active',
    joined_at: nowIso,
    updated_at: nowIso,
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    try {
      const { error } = await supabase
        .from('company_members')
        .update({
          user_id: validUserId,
          status: 'active',
          joined_at: nowIso,
          updated_at: nowIso,
        })
        .eq('invite_token', token);

      if (error) {
        console.warn('Erro ao atualizar status do convite no Supabase:', error.message);
      }
    } catch (err) {
      console.warn('Erro ao persistir aceite de convite no Supabase:', err);
    }
  }

  // Atualiza cache local
  const current = loadMembersFromCache(invitation.company_id) || [];
  const updated = current.map((m) =>
    m.invite_token === token || m.email.toLowerCase() === invitation.email.toLowerCase()
      ? updatedMember
      : m
  );
  saveMembersToCache(invitation.company_id, updated);

  return { success: true, member: updatedMember };
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

  if (emailClean !== target.email.toLowerCase()) {
    const duplicate = current.some(
      (m) => m.id !== memberId && m.email.toLowerCase() === emailClean
    );
    if (duplicate) {
      return { success: false, error: 'Este e-mail já está sendo utilizado por outro membro da equipe.' };
    }
  }

  // Validação de segurança: Não permitir que a empresa fique sem nenhum proprietário ativo
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

  const updated = current.filter((m) => m.id !== memberId);
  saveMembersToCache(companyId, updated);
  return { success: true };
}

/**
 * Busca se o usuário autenticado possui vínculo com alguma empresa como membro.
 */
export async function findMemberMembership(
  userId: string,
  userEmail?: string
): Promise<CompanyMember | null> {
  const supabase = getSupabaseClient();

  if (supabase && userId) {
    try {
      const { data, error } = await supabase
        .from('company_members')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return data as CompanyMember;
      }

      if (userEmail) {
        const { data: emailData, error: emailErr } = await supabase
          .from('company_members')
          .select('*')
          .eq('email', userEmail.toLowerCase())
          .maybeSingle();

        if (!emailErr && emailData) {
          return emailData as CompanyMember;
        }
      }
    } catch (err) {
      console.warn('Erro ao buscar vínculo de empresa do membro:', err);
    }
  }

  // Fallback local
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(MEMBERS_CACHE_PREFIX)) {
        const list = JSON.parse(localStorage.getItem(key) || '[]') as CompanyMember[];
        const found = list.find(
          (m) =>
            (userId && m.user_id === userId) ||
            (userEmail && m.email.toLowerCase() === userEmail.toLowerCase())
        );
        if (found) return found;
      }
    }
  } catch {
    // Ignora
  }

  return null;
}
