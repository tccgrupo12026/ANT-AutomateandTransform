/**
 * ANT — Automate and Transform
 * RBAC (Role-Based Access Control) Context & Hook
 *
 * Gerencia o papel real do usuário ativo (Proprietário ou Funcionário),
 * controle de acesso aos módulos do sistema e gestão da equipe da empresa.
 * 100% Determinístico — SEM Inteligência Artificial.
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import {
  UserRole,
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
  clearLegacySimulatedRoles,
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
  canAccess: (section: NavigationSection) => boolean;
  hasPermission: (permission: keyof RoleDefinition['permissions']) => boolean;
  inviteMember: (name: string, email: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  editMember: (memberId: string, data: { name: string; email: string; role: UserRole }) => Promise<{ success: boolean; error?: string }>;
  updateRole: (memberId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  resendInvite: (memberId: string) => Promise<{ success: boolean; message: string }>;
  refreshMembers: () => Promise<void>;
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
  canAccess: () => true,
  hasPermission: () => true,
  inviteMember: async () => ({ success: false }),
  editMember: async () => ({ success: false }),
  updateRole: async () => ({ success: false }),
  removeMember: async () => ({ success: false }),
  resendInvite: async () => ({ success: false, message: '' }),
  refreshMembers: async () => {},
});

export const RbacProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, fullName, companyName } = useAuth();
  const companyId = companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default_company';

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega membros e define o papel ativo REAL do usuário autenticado
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Limpeza de segurança para remover qualquer flag antiga de simulação
      clearLegacySimulatedRoles();

      const data = await fetchCompanyMembers(companyId, {
        id: user?.id,
        email: user?.email,
        name: fullName,
      });
      setMembers(data);

      // Encontra o papel real do usuário atual no time
      if (user?.email) {
        const currentMember = data.find(
          (m) => m.email.toLowerCase() === user.email!.toLowerCase()
        );
        if (currentMember) {
          setCurrentRole(currentMember.role);
        } else {
          // O criador/usuário da conta é sempre Proprietário
          setCurrentRole('owner');
        }
      } else {
        setCurrentRole('owner');
      }
    } catch (err) {
      console.warn('Erro ao carregar permissões e membros:', err);
      setCurrentRole('owner');
    } finally {
      setIsLoading(false);
    }
  }, [companyId, user?.id, user?.email, fullName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    async (name: string, email: string, role: UserRole) => {
      const res = await inviteCompanyMember(companyId, { name, email, role });
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [companyId, loadData]
  );

  const handleEditMember = useCallback(
    async (memberId: string, data: { name: string; email: string; role: UserRole }) => {
      const res = await updateCompanyMember(companyId, memberId, data);
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [companyId, loadData]
  );

  const handleUpdateRole = useCallback(
    async (memberId: string, role: UserRole) => {
      const res = await updateMemberRole(companyId, memberId, role);
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [companyId, loadData]
  );

  const handleRemoveMember = useCallback(
    async (memberId: string) => {
      const res = await removeCompanyMember(companyId, memberId);
      if (res.success) {
        await loadData();
      }
      return res;
    },
    [companyId, loadData]
  );

  const handleResendInvite = useCallback(
    async (memberId: string) => {
      return await resendMemberInvitation(companyId, memberId);
    },
    [companyId]
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
        canAccess,
        hasPermission,
        inviteMember: handleInviteMember,
        editMember: handleEditMember,
        updateRole: handleUpdateRole,
        removeMember: handleRemoveMember,
        resendInvite: handleResendInvite,
        refreshMembers: loadData,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = () => useContext(RbacContext);

