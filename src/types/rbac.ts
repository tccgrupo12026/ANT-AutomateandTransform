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

/**
 * Matriz granular de permissões por usuário (checkboxes configuráveis pelo proprietário)
 */
export interface CustomUserPermissions {
  // Produtos
  products_view: boolean;
  products_create: boolean;
  products_edit: boolean;
  products_delete: boolean;

  // Estoque
  stock_view: boolean;
  stock_manage: boolean;

  // Movimentações
  movements_view: boolean;
  movements_in: boolean;
  movements_out: boolean;

  // Venda Rápida
  quick_sale_create: boolean;
  quick_sale_view: boolean;
  quick_sale_cancel: boolean;

  // Financeiro
  financial_view: boolean;
  financial_create: boolean;
  financial_edit: boolean;
  financial_delete: boolean;

  // Relatórios
  reports_view: boolean;
  reports_export_pdf: boolean;
  reports_export_csv: boolean;

  // Saúde do Negócio
  business_health_view: boolean;

  // Equipe
  team_invite: boolean;
  team_edit: boolean;
  team_remove: boolean;

  // Configurações
  settings_view: boolean;
  settings_edit: boolean;

  // Precificação e Gráficos
  pricing_view?: boolean;
  charts_view?: boolean;

  // Suporte & Chamados
  support_view?: boolean;
  support_create?: boolean;
}

/**
 * Permissões completas padrão para o Proprietário (Acesso Total)
 */
export function getDefaultOwnerPermissions(): CustomUserPermissions {
  return {
    products_view: true,
    products_create: true,
    products_edit: true,
    products_delete: true,
    stock_view: true,
    stock_manage: true,
    movements_view: true,
    movements_in: true,
    movements_out: true,
    quick_sale_create: true,
    quick_sale_view: true,
    quick_sale_cancel: true,
    financial_view: true,
    financial_create: true,
    financial_edit: true,
    financial_delete: true,
    reports_view: true,
    reports_export_pdf: true,
    reports_export_csv: true,
    business_health_view: true,
    team_invite: true,
    team_edit: true,
    team_remove: true,
    settings_view: true,
    settings_edit: true,
    pricing_view: true,
    charts_view: true,
    support_view: true,
    support_create: true,
  };
}

/**
 * Permissões operacionais sugeridas para novo Funcionário
 */
export function getDefaultEmployeePermissions(): CustomUserPermissions {
  return {
    products_view: true,
    products_create: true,
    products_edit: true,
    products_delete: false,
    stock_view: true,
    stock_manage: true,
    movements_view: true,
    movements_in: true,
    movements_out: true,
    quick_sale_create: true,
    quick_sale_view: true,
    quick_sale_cancel: false,
    financial_view: false,
    financial_create: false,
    financial_edit: false,
    financial_delete: false,
    reports_view: false,
    reports_export_pdf: false,
    reports_export_csv: false,
    business_health_view: false,
    team_invite: false,
    team_edit: false,
    team_remove: false,
    settings_view: false,
    settings_edit: false,
    pricing_view: false,
    charts_view: false,
    support_view: true,
    support_create: true,
  };
}

/**
 * Retorna uma matriz limpa com todas as permissões desmarcadas (false)
 */
export function getEmptyPermissions(): CustomUserPermissions {
  return {
    products_view: false,
    products_create: false,
    products_edit: false,
    products_delete: false,
    stock_view: false,
    stock_manage: false,
    movements_view: false,
    movements_in: false,
    movements_out: false,
    quick_sale_create: false,
    quick_sale_view: false,
    quick_sale_cancel: false,
    financial_view: false,
    financial_create: false,
    financial_edit: false,
    financial_delete: false,
    reports_view: false,
    reports_export_pdf: false,
    reports_export_csv: false,
    business_health_view: false,
    team_invite: false,
    team_edit: false,
    team_remove: false,
    settings_view: false,
    settings_edit: false,
    pricing_view: false,
    charts_view: false,
    support_view: false,
    support_create: false,
  };
}

export interface PermissionDefinition {
  key: keyof CustomUserPermissions;
  label: string;
}

export interface PermissionGroup {
  id: string;
  title: string;
  iconName: string;
  permissions: PermissionDefinition[];
}

export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    id: 'produtos',
    title: 'Produtos',
    iconName: 'Package',
    permissions: [
      { key: 'products_view', label: 'Visualizar produtos' },
      { key: 'products_create', label: 'Criar produtos' },
      { key: 'products_edit', label: 'Editar produtos' },
      { key: 'products_delete', label: 'Excluir produtos' },
    ],
  },
  {
    id: 'estoque',
    title: 'Estoque',
    iconName: 'Boxes',
    permissions: [
      { key: 'stock_view', label: 'Visualizar estoque' },
      { key: 'stock_manage', label: 'Gerenciar estoque' },
    ],
  },
  {
    id: 'movimentacoes',
    title: 'Movimentações',
    iconName: 'ArrowLeftRight',
    permissions: [
      { key: 'movements_view', label: 'Visualizar movimentações' },
      { key: 'movements_in', label: 'Registrar entradas' },
      { key: 'movements_out', label: 'Registrar saídas' },
    ],
  },
  {
    id: 'venda_rapida',
    title: 'Venda Rápida',
    iconName: 'Zap',
    permissions: [
      { key: 'quick_sale_create', label: 'Realizar vendas' },
      { key: 'quick_sale_view', label: 'Visualizar histórico de vendas' },
      { key: 'quick_sale_cancel', label: 'Cancelar vendas' },
    ],
  },
  {
    id: 'financeiro',
    title: 'Financeiro',
    iconName: 'DollarSign',
    permissions: [
      { key: 'financial_view', label: 'Visualizar financeiro' },
      { key: 'financial_create', label: 'Criar lançamentos' },
      { key: 'financial_edit', label: 'Editar lançamentos' },
      { key: 'financial_delete', label: 'Excluir lançamentos' },
    ],
  },
  {
    id: 'relatorios',
    title: 'Relatórios',
    iconName: 'FileText',
    permissions: [
      { key: 'reports_view', label: 'Visualizar relatórios' },
      { key: 'reports_export_pdf', label: 'Exportar PDF' },
      { key: 'reports_export_csv', label: 'Exportar CSV' },
    ],
  },
  {
    id: 'saude_negocio',
    title: 'Saúde do Negócio',
    iconName: 'Activity',
    permissions: [
      { key: 'business_health_view', label: 'Visualizar módulo' },
    ],
  },
  {
    id: 'equipe',
    title: 'Equipe',
    iconName: 'Users',
    permissions: [
      { key: 'team_invite', label: 'Convidar usuários' },
      { key: 'team_edit', label: 'Editar usuários' },
      { key: 'team_remove', label: 'Remover usuários' },
    ],
  },
  {
    id: 'configuracoes',
    title: 'Configurações',
    iconName: 'Settings',
    permissions: [
      { key: 'settings_view', label: 'Visualizar configurações' },
      { key: 'settings_edit', label: 'Editar configurações' },
    ],
  },
  {
    id: 'suporte',
    title: 'Suporte',
    iconName: 'LifeBuoy',
    permissions: [
      { key: 'support_view', label: 'Visualizar chamados' },
      { key: 'support_create', label: 'Abrir chamados' },
    ],
  },
];


export interface CompanyMember {
  id: string;
  company_id: string;
  company_name?: string;
  user_id?: string | null;
  email: string;
  name: string;
  role: UserRole;
  job_title?: string;
  permissions?: CustomUserPermissions;
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
 * Verifica se um papel e suas permissões granulares permitem acessar uma seção de navegação específica.
 * - Proprietário tem acesso total a todos os módulos.
 * - Funcionários utilizam as permissões customizadas selecionadas via checkboxes pelo proprietário.
 * - Admin ANT tem acesso aos módulos administrativos da plataforma.
 */
export function checkSectionPermission(
  role: UserRole,
  section: NavigationSection,
  permissions?: CustomUserPermissions
): boolean {
  if (role === 'owner') {
    return true;
  }

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
      section === 'inicio' ||
      section === 'suporte'
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

  // Perfil pessoal e tela inicial sempre acessíveis
  if (section === 'perfil' || section === 'inicio') {
    return true;
  }

  // Módulos restritos exclusivamente ao proprietário da conta
  if (section === 'empresa' || section === 'planos') {
    return false;
  }

  // Permissões granulares do colaborador
  const perms = permissions || getDefaultEmployeePermissions();

  switch (section) {
    case 'produtos':
      return Boolean(
        perms.products_view || perms.products_create || perms.products_edit || perms.products_delete
      );
    case 'estoque':
      return Boolean(perms.stock_view || perms.stock_manage);
    case 'movimentacoes':
      return Boolean(perms.movements_view || perms.movements_in || perms.movements_out);
    case 'venda_rapida':
      return Boolean(
        perms.quick_sale_create || perms.quick_sale_view || perms.quick_sale_cancel
      );
    case 'financeiro':
      return Boolean(
        perms.financial_view ||
          perms.financial_create ||
          perms.financial_edit ||
          perms.financial_delete
      );
    case 'saude_negocio':
      return Boolean(perms.business_health_view);
    case 'relatorios':
      return Boolean(
        perms.reports_view || perms.reports_export_pdf || perms.reports_export_csv
      );
    case 'usuarios':
      return Boolean(perms.team_invite || perms.team_edit || perms.team_remove);
    case 'configuracoes':
      return Boolean(perms.settings_view || perms.settings_edit);
    case 'precificacao':
      return Boolean(perms.pricing_view && perms.products_view);
    case 'graficos':
      return Boolean(
        perms.charts_view &&
          (perms.financial_view || perms.quick_sale_view || perms.products_view)
      );
    case 'suporte':
      return Boolean(perms.support_view);
    default:
      return false;
  }
}
