import React from 'react';
import { ShieldAlert, ArrowLeft, Briefcase, Lock, HelpCircle } from 'lucide-react';
import { useRbac } from '../../contexts/RbacContext';
import { NavigationSection } from '../../types';

interface AccessDeniedViewProps {
  onNavigateHome: () => void;
  sectionName?: string;
}

export const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({
  onNavigateHome,
  sectionName = 'este módulo',
}) => {
  const { currentRole, roleDefinition } = useRbac();

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center animate-fadeIn">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 shadow-xl space-y-6">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
          <Lock className="w-8 h-8" />
        </div>

        {/* Title & Description */}
        <div className="space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800">
            <ShieldAlert className="w-3.5 h-3.5" />
            Acesso Restrito
          </span>
          <h2 className="text-xl font-black text-slate-900 dark:text-white">
            Permissão Insuficiente
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Seu perfil atual (<strong className="text-slate-900 dark:text-white">{roleDefinition.name}</strong>) não possui permissão para acessar {sectionName}.
          </p>
        </div>

        {/* Explanation Box */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
          <div className="flex items-center gap-2 font-bold text-slate-700 dark:text-slate-300">
            <Briefcase className="w-4 h-4 text-emerald-600" />
            <span>Perfil Operacional:</span>
          </div>
          <p className="text-slate-600 dark:text-slate-400 text-[11px] leading-relaxed">
            Usuários com papel <strong>Funcionário</strong> têm acesso liberado para <strong>Produtos, Estoque e Registro de Movimentações</strong>. Informações financeiras, relatórios gerenciais e configurações são restritas a <strong>Proprietários</strong>.
          </p>
        </div>

        {/* CTA */}
        <button
          onClick={onNavigateHome}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar para Início</span>
        </button>
      </div>
    </div>
  );
};
