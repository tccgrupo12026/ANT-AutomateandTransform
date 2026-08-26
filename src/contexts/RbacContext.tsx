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
import {
  UserRole,
  MemberStatus,
  CompanyMember,
  RoleDefinition,
  ANT_ROLES,
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
  isLoading: boolean;
  isOwner: boolean;
  isEmployee: boolean;
  isManager: boolean;
  isAdmin: boolean;
  effectiveCompanyId: string;
  effectiveCompanyName: string;
  canAccess: (section: NavigationSection) => boolean;
  hasPermission: (permission: keyof RoleDefinition['permissions']) => boolean;
  inviteMember: (
    name: string,
    email: string,
    role: UserRole
  ) => Promise<InviteMemberResult>;
  editMember: (
    memberId: string,
    data: { name: string; email: string; role: UserRole; status?: MemberStatus }
  ) => Promise<{ success: boolean; error?: string }>;
  updateRole: (memberId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  resendInvite: (memberId: string) => Promise<InviteMemberResult>;
  refreshMembers: () => Promise<void>;
  switchUserRole: (role: UserRole) => Promise<void>;
}

const defaultRoleDef = ANT_ROLES.owner;

const RbacContext = createContext<RbacContextType>({
  currentRole: 'owner',
  roleDefinition: defaultRoleDef,
  members: [],
  isLoading: true,
  isOwner: true,
  isEmployee: false,
  isManager: false,
  isAdmin: false,
  effectiveCompanyId: 'default_company',
  effectiveCompanyName: 'Minha Empresa',
  canAccess: () => true,
  hasPermission: () => true,
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
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega membros e define o papel ativo REAL do usuário autenticado
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let targetCompanyId = companyName
        ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '_')
        : 'default_company';
      let targetCompanyName = companyName || 'Minha Empresa';
      let resolvedRole: UserRole = 'owner';

      // 0. Verifica se o usuário autenticado possui role definida nos metadados do Supabase ou override local
      const metaRole = (user?.user_metadata?.role || (user as any)?.app_metadata?.role) as UserRole | undefined;
      const storedRole = user?.id ? (localStorage.getItem(`ant_user_role_${user.id}`) as UserRole | null) : null;

      if (metaRole === 'ant_admin' || storedRole === 'ant_admin') {
        resolvedRole = 'ant_admin';
        targetCompanyName = 'ANT Gestão — Plataforma SaaS';
      } else if (storedRole && (storedRole === 'owner' || storedRole === 'employee' || storedRole === 'manager')) {
        resolvedRole = storedRole;
      }

      // 1. Se não for ant_admin, verifica se o usuário autenticado foi convidado e pertence a uma empresa existente
      if (resolvedRole !== 'ant_admin' && user?.id) {
        const membership = await findMemberMembership(user.id, user.email);
        if (membership) {
          targetCompanyId = membership.company_id;
          targetCompanyName = membership.company_name || targetCompanyName;
          resolvedRole = membership.role;
        }
      }

      setEffectiveCompanyId(targetCompanyId);
      setEffectiveCompanyName(targetCompanyName);
      setCurrentRole(resolvedRole);

      // 2. Carrega todos os membros da empresa
      if (resolvedRole !== 'ant_admin') {
        const data = await fetchCompanyMembers(targetCompanyId, {
          id: user?.id,
          email: user?.email,
          name: fullName,
          companyName: targetCompanyName,
        });
        setMembers(data);

        // Se encontrou o membro na lista da empresa, atualiza o papel
        if (user?.email && !storedRole) {
          const currentMember = data.find(
            (m) => m.email.toLowerCase() === user.email!.toLowerCase()
          );
          if (currentMember) {
            setCurrentRole(currentMember.role);
          }
        }
      } else {
        setMembers([]);
      }
    } catch (err) {
      console.warn('Erro ao carregar permissões e membros:', err);
      setCurrentRole('owner');
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
      return checkSectionPermission(currentRole, section);
    },
    [currentRole]
  );

  const hasPermission = useCallback(
    (permission: keyof RoleDefinition['permissions']): boolean => {
      return !!roleDefinition.permissions[permission];
    },
    [roleDefinition]
  );

  const handleInviteMember = useCallback(
    async (name: string, email: string, role: UserRole): Promise<InviteMemberResult> => {
      const res = await inviteCompanyMember(effectiveCompanyId, {
        name,
        email,
        role,
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
      data: { name: string; email: string; role: UserRole; status?: MemberStatus }
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
        isLoading,
        isOwner,
        isEmployee,
        isManager,
        isAdmin,
        effectiveCompanyId,
        effectiveCompanyName,
        canAccess,
        hasPermission,
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
