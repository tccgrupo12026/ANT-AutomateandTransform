/**
 * ANT — Automate and Transform
 * Role-Based Access Control (RBAC) & Team Members Contracts
 *
 * Papéis suportados:
 * - owner (Proprietário): Acesso irrestrito a todos os módulos, financeiro, relatórios, configurações e gestão de usuários.
 * - employee (Funcionário): Acesso operacional a produtos, estoque, movimentações (entradas/saídas) e precificação.
 *
 * Papéis preparados para futura expansão:
 * - manager (Gerente): Operacional expandido + relatórios operacionais sem acesso à propriedade e assinatura.
 * - ant_admin (Admin ANT): Painel administrativo global da plataforma SaaS.
 */

import { NavigationSection } from './index';

export type UserRole = 'owner' | 'employee' | 'manager' | 'ant_admin';

export type MemberStatus = 'active' | 'pending' | 'expired' | 'inactive';

export interface CompanyMember {
  id: string;
  company_id: string;
  company_name?: string;
  user_id?: string | null;
  email: string;
  name: string;
  role: UserRole;
  status: MemberStatus;
  invite_token?: string | null;
  expires_at?: string | null;
  invited_at: string;
  joined_at?: string | null;
  invited_by?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * Verifica se um convite está expirado baseado na data de expiração.
 */
export function isInviteExpired(member: CompanyMember): boolean {
  if (member.status === 'active' || member.status === 'inactive') return false;
  if (member.status === 'expired') return true;
  if (member.expires_at) {
    return new Date(member.expires_at).getTime() < Date.now();
  }
  // Se não tem expires_at definido mas tem invited_at, assume 7 dias de validade
  if (member.invited_at) {
    const inviteDate = new Date(member.invited_at).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    return inviteDate + sevenDaysMs < Date.now();
  }
  return false;
}

/**
 * Retorna o status efetivo do membro levando em consideração a expiração.
 */
export function getMemberEffectiveStatus(member: CompanyMember): MemberStatus {
  if (member.status === 'active') return 'active';
  if (member.status === 'inactive') return 'inactive';
  if (isInviteExpired(member)) return 'expired';
  return 'pending';
}


export interface RoleDefinition {
  id: UserRole;
  name: string;
  badge: string;
  description: string;
  isAvailable: boolean;
  color: 'purple' | 'emerald' | 'blue' | 'slate';
  permissions: {
    canViewDashboard: boolean;
    canViewFinancialMetrics: boolean;
    canManageProducts: boolean;
    canViewProducts: boolean;
    canManageMovements: boolean;
    canViewStock: boolean;
    canAccessPricing: boolean;
    canAccessFinancial: boolean;
    canAccessBusinessHealth: boolean;
    canAccessReports: boolean;
    canAccessCharts: boolean;
    canManageCompany: boolean;
    canManageSettings: boolean;
    canManageSubscription: boolean;
    canManageUsers: boolean;
  };
}

export const ANT_ROLES: Record<UserRole, RoleDefinition> = {
  owner: {
    id: 'owner',
    name: 'Proprietário',
    badge: 'Acesso Total',
    description: 'Controle irrestrito da empresa, finanças, estoque, relatórios, plano e gestão de equipe.',
    isAvailable: true,
    color: 'purple',
    permissions: {
      canViewDashboard: true,
      canViewFinancialMetrics: true,
      canManageProducts: true,
      canViewProducts: true,
      canManageMovements: true,
      canViewStock: true,
      canAccessPricing: true,
      canAccessFinancial: true,
      canAccessBusinessHealth: true,
      canAccessReports: true,
      canAccessCharts: true,
      canManageCompany: true,
      canManageSettings: true,
      canManageSubscription: true,
      canManageUsers: true,
    },
  },
  employee: {
    id: 'employee',
    name: 'Funcionário',
    badge: 'Operacional',
    description: 'Acesso às rotinas diárias: consulta e cadastro de produtos, controle de estoque e registro de entradas/saídas.',
    isAvailable: true,
    color: 'emerald',
    permissions: {
      canViewDashboard: true,
      canViewFinancialMetrics: false,
      canManageProducts: true,
      canViewProducts: true,
      canManageMovements: true,
      canViewStock: true,
      canAccessPricing: true,
      canAccessFinancial: false,
      canAccessBusinessHealth: false,
      canAccessReports: false,
      canAccessCharts: false,
      canManageCompany: false,
      canManageSettings: false,
      canManageSubscription: false,
      canManageUsers: false,
    },
  },
  manager: {
    id: 'manager',
    name: 'Gerente',
    badge: 'Em Breve',
    description: 'Gestão operacional expandida com relatórios de vendas e metas (Preparado na arquitetura).',
    isAvailable: false,
    color: 'blue',
    permissions: {
      canViewDashboard: true,
      canViewFinancialMetrics: true,
      canManageProducts: true,
      canViewProducts: true,
      canManageMovements: true,
      canViewStock: true,
      canAccessPricing: true,
      canAccessFinancial: true,
      canAccessBusinessHealth: true,
      canAccessReports: true,
      canAccessCharts: true,
      canManageCompany: false,
      canManageSettings: false,
      canManageSubscription: false,
      canManageUsers: false,
    },
  },
  ant_admin: {
    id: 'ant_admin',
    name: 'Admin ANT',
    badge: 'Em Breve',
    description: 'Super Administrador da plataforma SaaS global (Preparado na arquitetura).',
    isAvailable: false,
    color: 'slate',
    permissions: {
      canViewDashboard: true,
      canViewFinancialMetrics: true,
      canManageProducts: true,
      canViewProducts: true,
      canManageMovements: true,
      canViewStock: true,
      canAccessPricing: true,
      canAccessFinancial: true,
      canAccessBusinessHealth: true,
      canAccessReports: true,
      canAccessCharts: true,
      canManageCompany: true,
      canManageSettings: true,
      canManageSubscription: true,
      canManageUsers: true,
    },
  },
};

/**
 * Verifica se um papel tem permissão para acessar uma seção de navegação específica.
 */
export function checkSectionPermission(role: UserRole, section: NavigationSection): boolean {
  const roleDef = ANT_ROLES[role] || ANT_ROLES.owner;

  switch (section) {
    case 'inicio':
      return roleDef.permissions.canViewDashboard;
    case 'produtos':
      return roleDef.permissions.canViewProducts;
    case 'estoque':
      return roleDef.permissions.canViewStock;
    case 'movimentacoes':
      return roleDef.permissions.canManageMovements;
    case 'precificacao':
      return roleDef.permissions.canAccessPricing;
    case 'financeiro':
      return roleDef.permissions.canAccessFinancial;
    case 'saude_negocio':
      return roleDef.permissions.canAccessBusinessHealth;
    case 'graficos':
      return roleDef.permissions.canAccessCharts;
    case 'relatorios':
      return roleDef.permissions.canAccessReports;
    case 'empresa':
      return roleDef.permissions.canManageCompany;
    case 'planos':
      return roleDef.permissions.canManageSubscription;
    case 'configuracoes':
      return roleDef.permissions.canManageSettings;
    case 'usuarios':
      return roleDef.permissions.canManageUsers;
    case 'perfil':
      return true; // Perfil pessoal sempre acessível
    default:
      return true;
  }
}
