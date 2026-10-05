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
    canAccessQuickSale: boolean;
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
    canAccessAdminPlatform: boolean;
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
      canAccessQuickSale: true,
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
      canAccessAdminPlatform: false,
    },
  },
  employee: {
    id: 'employee',
    name: 'Funcionário',
    badge: 'Operacional',
    description: 'Acesso operacional: Venda Rápida (PDV/Código de Barras), cadastro e consulta de produtos, estoque e movimentações.',
    isAvailable: true,
    color: 'emerald',
    permissions: {
      canViewDashboard: true,
      canAccessQuickSale: true,
      canViewFinancialMetrics: false,
      canManageProducts: true,
      canViewProducts: true,
      canManageMovements: true,
      canViewStock: true,
      canAccessPricing: false,
      canAccessFinancial: false,
      canAccessBusinessHealth: false,
      canAccessReports: false,
      canAccessCharts: false,
      canManageCompany: false,
      canManageSettings: true,
      canManageSubscription: false,
      canManageUsers: false,
      canAccessAdminPlatform: false,
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
      canAccessQuickSale: true,
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
      canAccessAdminPlatform: false,
    },
  },
  ant_admin: {
    id: 'ant_admin',
    name: 'Admin ANT',
    badge: 'Gestão da Plataforma',
    description: 'Administrador global da plataforma SaaS ANT (painel executivo, métricas agregadas de empresas, gestão de usuários e cobranças da plataforma, sem acesso a dados confidenciais dos clientes por LGPD).',
    isAvailable: true,
    color: 'slate',
    permissions: {
      canViewDashboard: true,
      canAccessQuickSale: false,
      canViewFinancialMetrics: false,
      canManageProducts: false,
      canViewProducts: false,
      canManageMovements: false,
      canViewStock: false,
      canAccessPricing: false,
      canAccessFinancial: false,
      canAccessBusinessHealth: false,
      canAccessReports: false,
      canAccessCharts: false,
      canManageCompany: true,
      canManageSettings: true,
      canManageSubscription: true,
      canManageUsers: true,
      canAccessAdminPlatform: true,
    },
  },
};

/**
 * Verifica se um papel tem permissão para acessar uma seção de navegação específica.
 * Garante o acesso total aos módulos administrativos para o Admin ANT e isolamento de dados de clientes.
 */
export function checkSectionPermission(role: UserRole, section: NavigationSection): boolean {
  const roleDef = ANT_ROLES[role] || ANT_ROLES.owner;

  // Seções administrativas da plataforma SaaS
  const isAdminSection =
    section.startsWith('admin_') ||
    section === 'admin_dashboard' ||
    section === 'admin_companies' ||
    section === 'admin_users' ||
    section === 'admin_subscriptions' ||
    section === 'admin_platform' ||
    section === 'admin_support';

  if (role === 'ant_admin') {
    if (isAdminSection) return true;
    if (section === 'perfil') return true;
    // Atalhos e rotas equivalentes para o painel Admin ANT
    if (
      section === 'usuarios' ||
      section === 'planos' ||
      section === 'configuracoes' ||
      section === 'empresa' ||
      section === 'inicio'
    ) {
      return true;
    }
    // Admin ANT não acessa diretamente módulos operacionais de estoque e vendas de clientes por LGPD
    return false;
  }

  // Usuários não administradores não acessam áreas de administração global da plataforma
  if (isAdminSection) {
    return false;
  }

  switch (section) {
    case 'inicio':
      return roleDef.permissions.canViewDashboard;
    case 'venda_rapida':
      return roleDef.permissions.canAccessQuickSale;
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
