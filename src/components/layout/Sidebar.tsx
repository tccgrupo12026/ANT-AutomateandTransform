import React from 'react';
import {
  LayoutDashboard,
  Package,
  ArrowLeftRight,
  DollarSign,
  Calculator,
  Activity,
  BarChart3,
  LineChart,
  FileText,
  Building2,
  Users,
  Settings,
  X,
  LogOut,
  Crown,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { AntLogo } from '../common/AntLogo';
import { NavigationSection } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useRbac } from '../../contexts/RbacContext';

interface SidebarProps {
  currentSection: NavigationSection;
  onSelectSection: (section: NavigationSection) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

interface NavItem {
  id: NavigationSection;
  label: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: 'green' | 'purple' | 'amber' | 'rose';
}

const staticNavItems: NavItem[] = [
  { id: 'inicio', label: 'Início', icon: LayoutDashboard },
  { id: 'empresa', label: 'Empresa', icon: Building2 },
  { id: 'produtos', label: 'Produtos', icon: Package },
  { id: 'movimentacoes', label: 'Movimentações', icon: ArrowLeftRight },
  { id: 'financeiro', label: 'Financeiro', icon: DollarSign },
  { id: 'precificacao', label: 'Precificação', icon: Calculator },
  { id: 'saude_negocio', label: 'Saúde do Negócio', icon: Activity, badge: 'Regras', badgeColor: 'green' },
  { id: 'graficos', label: 'Gráficos', icon: LineChart },
  { id: 'relatorios', label: 'Relatórios', icon: FileText },
  { id: 'usuarios', label: 'Usuários', icon: Users },
  { id: 'planos', label: 'Planos & Assinatura', icon: Crown },
  { id: 'configuracoes', label: 'Configurações', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  isOpenMobile,
  onCloseMobile,
}) => {
  const { companyName, fullName, signOut } = useAuth();
  const { summary } = useSubscription();
  const { canAccess, currentRole, roleDefinition } = useRbac();

  const filteredNavItems = staticNavItems.filter((item) => canAccess(item.id));

  const planBadgeText = summary
    ? summary.isTrial
      ? `${summary.daysRemaining}d Trial`
      : summary.isActive
      ? 'Ativo'
      : summary.isExpired
      ? 'Expirado'
      : 'Suspenso'
    : '30d Trial';

  const planBadgeColor: 'green' | 'purple' | 'amber' | 'rose' = summary
    ? summary.isActive
      ? 'green'
      : summary.isTrial
      ? 'purple'
      : summary.isExpired
      ? 'rose'
      : 'amber'
    : 'purple';

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 z-40 lg:hidden backdrop-blur-xs"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand / Logo Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-100 dark:border-slate-800/80">
          <AntLogo size={38} showText={true} textVariant="sidebar" subtitle={true} />
          <button
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Módulos de Gestão
            </span>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                currentRole === 'owner'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
              }`}
            >
              {roleDefinition.name}
            </span>
          </div>

          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentSection === item.id;
            const badge = item.id === 'planos' ? planBadgeText : item.badge;
            const badgeColor = item.id === 'planos' ? planBadgeColor : item.badgeColor;

            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectSection(item.id);
                  onCloseMobile();
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-sm shadow-purple-200 dark:shadow-none'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-purple-50 dark:hover:bg-purple-950/30 hover:text-purple-700 dark:hover:text-purple-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive
                        ? 'text-white'
                        : 'text-slate-400 group-hover:text-purple-600'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {badge && (
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : badgeColor === 'green'
                        ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        : badgeColor === 'rose'
                        ? 'bg-rose-50 text-rose-600 border border-rose-200'
                        : badgeColor === 'amber'
                        ? 'bg-amber-50 text-amber-600 border border-amber-200'
                        : 'bg-purple-100 text-purple-700'
                    }`}
                  >
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Bottom Business Info Card & Logout */}
        <div className="p-3.5 border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-950/40 space-y-2">
          <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[110px]">
                {companyName}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                {summary?.plan.name || 'Starter'}
              </span>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
              <span className="truncate max-w-[110px]">{fullName}</span>
              <span className={`font-semibold flex items-center gap-1 ${
                currentRole === 'owner' ? 'text-purple-600 dark:text-purple-400' : 'text-emerald-600 dark:text-emerald-400'
              }`}>
                {currentRole === 'owner' ? <ShieldCheck className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                {roleDefinition.name}
              </span>
            </div>
          </div>

          <button
            onClick={() => {
              signOut();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sair da Conta</span>
          </button>
        </div>
      </aside>
    </>
  );
};
