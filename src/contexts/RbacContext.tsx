/**
 * ANT — Automate and Transform
 * RBAC (Role-Based Access Control) Context & Hook
 *
 * Gerencia o papel do usuário ativo (Proprietário ou Funcionário),
 * controle de acesso a módulos, listas de membros e simulador de perfis.
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
  updateMemberRole,
  removeCompanyMember,
  resendMemberInvitation,
  getStoredSimulatedRole,
  setStoredSimulatedRole,
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
  updateRole: (memberId: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  removeMember: (memberId: string) => Promise<{ success: boolean; error?: string }>;
  resendInvite: (memberId: string) => Promise<{ success: boolean; message: string }>;
  switchRole: (role: UserRole) => void;
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
  updateRole: async () => ({ success: false }),
  removeMember: async () => ({ success: false }),
  resendInvite: async () => ({ success: false, message: '' }),
  switchRole: () => {},
  refreshMembers: async () => {},
});

export const RbacProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, fullName, companyName } = useAuth();
  const companyId = companyName ? companyName.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'default_company';

  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [currentRole, setCurrentRole] = useState<UserRole>('owner');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Carrega membros e define o papel ativo
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await fetchCompanyMembers(companyId, {
        id: user?.id,
        email: user?.email,
        name: fullName,
      });
      setMembers(data);

      // Verifica se há papel simulado persistido
      const simulated = getStoredSimulatedRole(companyId);
      if (simulated) {
        setCurrentRole(simulated);
      } else {
        // Encontra o papel do usuário atual
        const currentMember = data.find((m) => m.email.toLowerCase() === (user?.email || '').toLowerCase());
        if (currentMember) {
          setCurrentRole(currentMember.role);
        } else {
          setCurrentRole('owner'); // Default para criador
        }
      }
    } catch (err) {
      console.warn('Erro ao carregar permissões e membros:', err);
    } finally {
      setIsLoading(false);
    }
  }, [companyId, user?.id, user?.email, fullName]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para alternar o papel (simulação / sandbox)
  const switchRole = useCallback(
    (role: UserRole) => {
      setCurrentRole(role);
      setStoredSimulatedRole(companyId, role);
    },
    [companyId]
  );

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
        updateRole: handleUpdateRole,
        removeMember: handleRemoveMember,
        resendInvite: handleResendInvite,
        switchRole,
        refreshMembers: loadData,
      }}
    >
      {children}
    </RbacContext.Provider>
  );
};

export const useRbac = () => useContext(RbacContext);
