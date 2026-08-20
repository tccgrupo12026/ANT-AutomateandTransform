import React from 'react';

interface FooterProps {
  id?: string;
}

export const Footer: React.FC<FooterProps> = ({ id }) => {
  return (
    <footer
      id={id}
      className="border-t border-slate-200/80 dark:border-slate-800 bg-white/60 dark:bg-slate-900/60 py-5 px-4 sm:px-8 mt-auto"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            ANT — Automate and Transform
          </span>
          <span>&bull; Gestão simples, moderna e acessível para microempresas</span>
        </div>

        <div className="flex items-center gap-4 text-[11px] text-slate-400">
          <span>Decisões baseadas em regras e dados reais</span>
        </div>
      </div>
    </footer>
  );
};
