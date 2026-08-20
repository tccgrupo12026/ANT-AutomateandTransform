import React from 'react';
import { AlertCircle, ArrowLeft, Home } from 'lucide-react';
import { AntLogo } from '../common/AntLogo';
import { NavigationSection } from '../../types';

interface NotFoundViewProps {
  onNavigate: (section: NavigationSection) => void;
}

export const NotFoundView: React.FC<NotFoundViewProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
      {/* Visual Icon / Logo Container with mandatory white background */}
      <div className="p-4 bg-white rounded-3xl shadow-xs border border-slate-200 dark:border-slate-800">
        <AntLogo size={64} showText={false} />
      </div>

      <div className="space-y-2 max-w-md">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
          <AlertCircle className="w-3.5 h-3.5" />
          Erro 404 — Página Não Encontrada
        </span>

        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
          Conteúdo Indisponível
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          A seção ou recurso solicitado não foi encontrado ou não está cadastrado no sistema da sua empresa. Retorne ao início para navegar pelos módulos disponíveis.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <button
          onClick={() => onNavigate('inicio')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-200 dark:shadow-none transition-all cursor-pointer"
        >
          <Home className="w-4 h-4" />
          <span>Voltar ao Início</span>
        </button>

        <button
          onClick={() => onNavigate('produtos')}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs sm:text-sm font-semibold transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Ver Catálogo de Produtos</span>
        </button>
      </div>
    </div>
  );
};
