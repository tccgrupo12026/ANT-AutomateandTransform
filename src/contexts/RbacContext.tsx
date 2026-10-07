/**
 * ANT — Automate and Transform
 * RBAC (Role-Based Access Control) Context & Hook
 *
 * Gerencia o papel real do usuário ativo (Proprietário ou Funcionário),
 * controle de acesso aos módulos do sistema e gestão da equipe da empresa.
 * Suporta o ciclo completo de convites (envio real por e-mail, tokens seguros,
 * expiração e aceite com criação de senha).
 * 100% Determinístico — SEM Inteligência Artificial.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getSupabaseClient } from '../lib/supabase';
import {
  UserRole,
  MemberStatus,
  CompanyMember,
  RoleDefinition,
  ANT_ROLES,
  CustomUserPermissions,
  getDefaultOwnerPermissions,
  getDefaultEmployeePermissions,
  getEmptyPermissions,
  checkSectionPermission,
} from '../types/rbac';
import { NavigationSection } from '../types';
import {
  fetchCompanyMembers,
  inviteCompanyMember,
  updateCompanyMember,
  updateMemberRole,
  removeCompanyMember,
  resendMemberInvitation,
  findMemberMembership,
  clearLegacySimulatedRoles,
  InviteMemberResult,
} from '../services/rbacService';

interface RbacContextType {
  currentRole: UserRole;
  roleDefinition: RoleDefinition;
  members: CompanyMember[];
  currentUserMember: CompanyMember | null;
  currentPermissions: CustomUserPermissions;
  currentJobTitle: string;
  isLoading: boolean;
  isOwner: boolean;
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;
  effectiveCompanyId: string;
  effectiveCompanyName: string;
  canAccess: (section: NavigationSection) => boolean;
  hasPermission: (permission: keyof RoleDefinition['permissions']) => boolean;
  hasCustomPermission: (key: keyof CustomUserPermissions) => boolean;
  inviteMember: (
    name: string,
    email: string,
    role: UserRole,
    jobTitle?: string,
    permissions?: CustomUserPermissions
  ) => Promise<InviteMemberResult>;
  editMember: (
    memberId: string,
    data: {
      name: string;
      email: string;
      role: UserRole;
      status?: MemberStatus;
      job_title?: string;
      permissions?: CustomUserPermissions;
    }
  ) => Promise<{ success: boolean; error?: string }>;
  updateRole: (memberId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  resendInvite: (memberId: string) => Promise<InviteMemberResult>;
  refreshMembers: () => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
}

const defaultRoleDef = ANT_ROLES.employee;
const defaultOwnerPerms = getDefaultOwnerPermissions();
const defaultEmptyPerms = getEmptyPermissions();

const RbacContext = createContext<RbacContextType>({
  currentRole: 'employee',
  roleDefinition: defaultRoleDef,
  members: [],
  currentUserMember: null,
  currentPermissions: defaultEmptyPerms,
  currentJobTitle: 'Carregando...',
  isLoading: true,
  isOwner: false,
  isEmployee: true,
  isManager: false,
  isAdmin: false,
  effectiveCompanyId: 'default_company',
  effectiveCompanyName: 'Minha Empresa',
  canAccess: () => false,
  hasPermission: () => false,
  hasCustomPermission: () => false,
  inviteMember: async () => ({ success: false, inviteLink: '', emailSent: false }),
  editMember: async () => ({ success: false }),
  updateRole: async () => ({ success: false }),
  removeMember: async () => ({ success: false }),
  resendInvite: async () => ({ success: false, inviteLink: '', emailSent: false }),
  refreshMembers: async () => {},
  switchUserRole: async () => {},
});

export const RbacProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, fullName, companyName } = useAuth();

  const [effectiveCompanyId, setEffectiveCompanyId] = useState<string>(() => {
    return companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default_company';
  });
  const [effectiveCompanyName, setEffectiveCompanyName] = useState<string>(companyName || 'Minha Empresa');
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [currentUserMember, setCurrentUserMember] = useState<CompanyMember | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('employee');
  const [currentPermissions, setCurrentPermissions] = useState<CustomUserPermissions>(defaultEmptyPerms);
  const [currentJobTitle, setCurrentJobTitle] = useState<string>('Carregando...');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega membros e define o papel ativo REAL do usuário autenticado
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      // Metadados do Supabase Auth
      const metaRole = (user?.user_metadata?.role || (user as any)?.app_metadata?.role) as UserRole | undefined;
      const isInvitedMeta = Boolean(user?.user_metadata?.is_invited);
      const metaCompanyId = user?.user_metadata?.company_id as string | undefined;

      let resolvedRole: UserRole = 'employee';
      let resolvedPermissions: CustomUserPermissions = defaultEmptyPerms;
      let resolvedJobTitle = 'Funcionário';
      let targetCompanyId = metaCompanyId || (companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default_company');
      let targetCompanyName = companyName || 'Minha Empresa';
      let foundMember: CompanyMember | null = null;

      // 0. Superadministrador da plataforma SaaS ANT
      if (metaRole === 'ant_admin') {
        resolvedRole = 'ant_admin';
        targetCompanyName = 'ANT Gestão — Plataforma SaaS';
        resolvedJobTitle = 'Administrador Global ANT';
        resolvedPermissions = defaultOwnerPerms;
      } else {
        // 1. Busca vínculo direto na tabela company_members pelo user_id ou e-mail
        const membership = await findMemberMembership(user.id, user.email || undefined);
        if (membership) {
          foundMember = membership;
          targetCompanyId = membership.company_id;
          targetCompanyName = membership.company_name || targetCompanyName;
          resolvedRole = membership.role;
          resolvedJobTitle = membership.job_title || (membership.role === 'owner' ? 'Proprietário' : 'Funcionário');

          if (membership.role === 'owner') {
            resolvedPermissions = defaultOwnerPerms;
          } else {
            // Funcionário: carrega EXCLUSIVAMENTE as permissões gravadas na tabela company_members
            resolvedPermissions =
              membership.permissions && Object.keys(membership.permissions).length > 0
                ? membership.permissions
                : getDefaultEmployeePermissions();
          }
        } else {
          // 2. Não possui registro em company_members:
          // Verifica se o usuário autenticado cadastrou uma empresa própria na tabela companies (Proprietário legítimo)
          const supabase = getSupabaseClient();
          let isCompanyOwner = false;
          if (supabase) {
            try {
              const { data: compData } = await supabase
                .from('companies')
                .select('id, company_name, user_id')
                .eq('user_id', user.id)
                .limit(1);

              if (compData && compData.length > 0) {
                isCompanyOwner = true;
                targetCompanyName = compData[0].company_name || targetCompanyName;
                targetCompanyId = compData[0].company_name.toLowerCase().replace(/[^a-z0-9]/g, '_');
              }
            } catch (compErr) {
              console.warn('Erro ao consultar empresa do usuário:', compErr);
            }
          }

          if (isCompanyOwner) {
            resolvedRole = 'owner';
            resolvedJobTitle = 'Proprietário';
            resolvedPermissions = defaultOwnerPerms;
          } else if (metaRole === 'employee' || isInvitedMeta) {
            // Usuário autenticado como convidado/funcionário
            resolvedRole = 'employee';
            resolvedJobTitle = 'Funcionário';
            resolvedPermissions = getDefaultEmployeePermissions();
          } else {
            // Novo cadastro padrão direto de empreendedor (proprietário)
            resolvedRole = 'owner';
            resolvedJobTitle = 'Proprietário';
            resolvedPermissions = defaultOwnerPerms;
          }
        }
      }

      // 3. Carrega lista de membros da empresa (sem auto-injeção de proprietário para funcionários)
      if (resolvedRole !== 'ant_admin') {
        const data = await fetchCompanyMembers(targetCompanyId, {
          id: user.id,
          email: user.email || undefined,
          name: fullName,
          companyName: targetCompanyName,
          role: resolvedRole,
        });
        setMembers(data);

        // Se encontrou o membro na listagem da empresa, assegura os dados finais
        const matched = data.find(
          (m) =>
            m.user_id === user.id ||
            (user.email && m.email.toLowerCase() === user.email.toLowerCase())
        );

        if (matched) {
          foundMember = matched;
          resolvedRole = matched.role;
          resolvedJobTitle = matched.job_title || (matched.role === 'owner' ? 'Proprietário' : 'Funcionário');
          if (matched.role === 'owner') {
            resolvedPermissions = defaultOwnerPerms;
          } else {
            resolvedPermissions =
              matched.permissions && Object.keys(matched.permissions).length > 0
                ? matched.permissions
                : getDefaultEmployeePermissions();
          }
        }
      } else {
        setMembers([]);
      }

      // Persiste cache local do usuário logado
      if (user?.id) {
        try {
          localStorage.setItem(`ant_user_role_${user.id}`, resolvedRole);
          localStorage.setItem(`ant_user_job_title_${user.id}`, resolvedJobTitle);
          localStorage.setItem(`ant_user_permissions_${user.id}`, JSON.stringify(resolvedPermissions));
        } catch {
          // Ignora
        }
      }

      setEffectiveCompanyId(targetCompanyId);
      setEffectiveCompanyName(targetCompanyName);
      setCurrentRole(resolvedRole);
      setCurrentPermissions(resolvedPermissions);
      setCurrentJobTitle(resolvedJobTitle);
      setCurrentUserMember(foundMember);
    } catch (err) {
      console.warn('Erro ao carregar permissões e membros:', err);
      // Fallback seguro: se o usuário for convidado ou funcionário, NUNCA concede permissão de dono!
      if (user?.user_metadata?.role === 'employee' || user?.user_metadata?.is_invited) {
        setCurrentRole('employee');
        setCurrentPermissions(getDefaultEmployeePermissions());
        setCurrentJobTitle('Funcionário');
      } else {
        setCurrentRole('owner');
        setCurrentPermissions(defaultOwnerPerms);
        setCurrentJobTitle('Proprietário');
      }
    } finally {
      setIsLoading(false);
    }
  }, [companyName, user, fullName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const switchUserRole = useCallback(async (role: UserRole) => {
    if (user?.id) {
      localStorage.setItem(`ant_user_role_${user.id}`, role);
    }
    setCurrentRole(role);
    await loadData();
  }, [user?.id, loadData]);

  const roleDefinition = ANT_ROLES[currentRole] || ANT_ROLES.owner;

  const isOwner = currentRole === 'owner';
  const isEmployee = currentRole === 'employee';
  const isManager = currentRole === 'manager';
  const isAdmin = currentRole === 'ant_admin';

  const canAccess = useCallback(
    (section: NavigationSection): boolean => {
      return checkSectionPermission(currentRole, section, currentPermissions);
    },
    [currentRole, currentPermissions]
  );

  const hasPermission = useCallback(
    (permission: keyof RoleDefinition['permissions']): boolean => {
      return !!roleDefinition.permissions[permission];
    },
    [roleDefinition]
  );

  const hasCustomPermission = useCallback(
    (key: keyof CustomUserPermissions | string): boolean => {
      if (currentRole === 'owner') return true;
      if (currentRole === 'ant_admin') return true;
      if (!currentPermissions) return false;
      if (key === 'quicksale_execute') return Boolean(currentPermissions.quick_sale_create);
      if (key === 'quicksale_history') return Boolean(currentPermissions.quick_sale_view);
      if (key === 'quicksale_cancel') return Boolean(currentPermissions.quick_sale_cancel);
      return Boolean((currentPermissions as any)[key]);
    },
    [currentRole, currentPermissions]
  );

  const handleInviteMember = useCallback(
    async (
      name: string,
      email: string,
      role: UserRole,
      jobTitle?: string,
      permissions?: CustomUserPermissions
    ): Promise<InviteMemberResult> => {
      const res = await inviteCompanyMember(effectiveCompanyId, {
        name,
        email,
        role,
        job_title: jobTitle,
        permissions,
        companyName: effectiveCompanyName,
        inviterName: fullName,
        inviterUserId: user?.id,
      });
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [effectiveCompanyId, effectiveCompanyName, fullName, user?.id, loadData]
  );

  const handleEditMember = useCallback(
    async (
      memberId: string,
      data: {
        name: string;
        email: string;
        role: UserRole;
        status?: MemberStatus;
        job_title?: string;
        permissions?: CustomUserPermissions;
      }
    ) => {
      const res = await updateCompanyMember(effectiveCompanyId, memberId, data);
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [effectiveCompanyId, loadData]
  );

  const handleUpdateRole = useCallback(
    async (memberId: string, role: UserRole) => {
      const res = await updateMemberRole(effectiveCompanyId, memberId, role);
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [effectiveCompanyId, loadData]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      const res = await removeCompanyMember(effectiveCompanyId, memberId);
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [effectiveCompanyId, loadData]
  );

  const handleResendInvite = useCallback(
    async (memberId: string): Promise<InviteMemberResult> => {
      const res = await resendMemberInvitation(effectiveCompanyId, memberId, {
        companyName: effectiveCompanyName,
        inviterName: fullName,
      });
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [effectiveCompanyId, effectiveCompanyName, fullName, loadData]
  );

  return (
    <RbacContext.Provider
      value={{
        currentRole,
        roleDefinition,
        members,
        currentUserMember,
        currentPermissions,
        currentJobTitle,
        isLoading,
        isOwner,
        isEmployee,
        isManager,
        isAdmin,
        effectiveCompanyId,
        effectiveCompanyName,
        canAccess,
        hasPermission,
        hasCustomPermission,
        inviteMember: handleInviteMember,
        editMember: handleEditMember,
        updateRole: handleUpdateRole,
        removeMember: handleRemoveMember,
        resendInvite: handleResendInvite,
        refreshMembers: loadData,
        switchUserRole,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = () => useContext(RbacContext);

