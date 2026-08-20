import React from 'react';
import { Menu, ShieldCheck, LogOut } from 'lucide-react';
import { Badge } from '../common/Badge';
import { useAuth } from '../../contexts/AuthContext';

interface HeaderProps {
  id?: string;
  onOpenMobileMenu: () => void;
}

export const Header: React.FC<HeaderProps> = ({ id, onOpenMobileMenu }) => {
  const { user, fullName, companyName, signOut } = useAuth();
  const initial = (fullName || user?.email || 'E').charAt(0).toUpperCase();

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
            <span className="font-semibold text-purple-700 dark:text-purple-400">{companyName}</span> • ANT Gestão
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-4">
        {/* Access Badge */}
        <Badge variant="purple" size="md">
          <ShieldCheck className="w-3.5 h-3.5 mr-1 text-purple-600 inline" />
          Autenticado
        </Badge>

        {/* User / Company Avatar Pill */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
            {initial}
          </div>
          <div className="hidden md:block text-left">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight truncate max-w-[130px]">
              {companyName}
            </div>
            <div className="text-[10px] text-slate-400 font-medium truncate max-w-[130px]">
              {user?.email || 'Microempresa'}
            </div>
          </div>

          {/* Logout button */}
          <button
            onClick={() => signOut()}
            className="ml-1 p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
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
