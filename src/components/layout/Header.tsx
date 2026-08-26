import React from 'react';
import { Menu, ShieldCheck, LogOut, Crown, Clock, AlertCircle, Briefcase, Users } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useSubscription } from '../../contexts/SubscriptionContext';
import { useRbac } from '../../contexts/RbacContext';
import { NavigationSection } from '../../types';

interface HeaderProps {
  id?: string;
  onOpenMobileMenu: () => void;
  onNavigate?: (section: NavigationSection) => void;
}

export const Header: React.FC<HeaderProps> = ({ id, onOpenMobileMenu, onNavigate }) => {
  const { user, fullName, companyName, signOut } = useAuth();
  const { summary } = useSubscription();
  const { currentRole, roleDefinition, isOwner, isAdmin } = useRbac();
  const isAntAdmin = currentRole === 'ant_admin' || isAdmin;
  const initial = (fullName || user?.email || 'E').charAt(0).toUpperCase();

  const handleGoToPlans = () => {
    if (onNavigate) {
      if (isAntAdmin) {
        onNavigate('admin_subscriptions');
      } else {
        onNavigate('planos');
      }
    }
  };

  const handleGoToUsers = () => {
    if (onNavigate) {
      if (isAntAdmin) {
        onNavigate('admin_companies');
      } else if (isOwner) {
        onNavigate('usuarios');
      }
    }
  };

  return (
    <header
      id={id}
      className="border-b border-slate-200/80 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between"
    >
      {/* Left Greeting & Info */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          className="lg:hidden p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-none"
          aria-label="Abrir navegação"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-1.5">
              Olá, {fullName}! <span className="text-base sm:text-lg">👋</span>
            </h1>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="font-semibold text-purple-700 dark:text-purple-400">
              {isAntAdmin ? 'ANT Plataforma SaaS' : companyName}
            </span>{' '}
            • {isAntAdmin ? 'Painel dos Fundadores' : 'ANT Gestão'}
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Role Badge */}
        <button
          type="button"
          onClick={handleGoToUsers}
          disabled={!isOwner && !isAntAdmin}
          className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
            isOwner || isAntAdmin ? 'cursor-pointer' : 'cursor-default'
          } ${
            isAntAdmin
              ? 'bg-purple-600 text-white border-purple-500 shadow-xs'
              : currentRole === 'owner'
              ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
              : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
          }`}
          title={
            isAntAdmin
              ? 'Papel: Admin ANT (Acesso Global da Plataforma)'
              : isOwner
              ? 'Papel: Proprietário (Clique para gerenciar usuários)'
              : 'Papel: Funcionário (Acesso Operacional)'
          }
        >
          {isAntAdmin ? (
            <>
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>Admin ANT</span>
            </>
          ) : currentRole === 'owner' ? (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              <span>Proprietário</span>
            </>
          ) : (
            <>
              <Briefcase className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Funcionário</span>
            </>
          )}
        </button>

        {/* Subscription / Trial Status Badge (for clients only) */}
        {!isAntAdmin && summary && isOwner && (
          <button
            type="button"
            onClick={handleGoToPlans}
            className={`cursor-pointer px-2.5 py-1 rounded-full text-xs font-bold transition-all hidden sm:flex items-center gap-1.5 border shadow-2xs ${
              summary.isTrial
                ? 'bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800'
                : summary.isActive
                ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                : summary.isExpired
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800 animate-pulse'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800'
            }`}
            title="Clique para gerenciar seu plano e assinatura"
          >
            {summary.isTrial ? (
              <>
                <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                <span>{summary.daysRemaining}d Trial</span>
              </>
            ) : summary.isActive ? (
              <>
                <Crown className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Plano {summary.plan.name}</span>
              </>
            ) : summary.isExpired ? (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                <span>Expirado</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>Suspenso</span>
              </>
            )}
          </button>
        )}

        {/* User / Company Avatar Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {initial}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[130px]">
              {isAntAdmin ? 'Criador da Plataforma' : companyName}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {user?.email || (isAntAdmin ? 'admin@ant.app' : 'Microempresa')}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => signOut()}
            className="ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            title="Sair da Conta (Logout)"
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
