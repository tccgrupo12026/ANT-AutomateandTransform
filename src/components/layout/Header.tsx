import { Layers, Terminal } from 'lucide-react';
import { Badge } from '../common/Badge';

interface HeaderProps {
  id?: string;
}

export function Header({ id }: HeaderProps) {
  return (
    <header
      id={id}
      className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-30 shadow-xs"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Layers className="w-4 h-4" />
          </div>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-slate-900 dark:text-slate-100 text-sm sm:text-base tracking-tight">
              Base Project Starter
            </span>
            <span className="hidden sm:inline-block px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-medium rounded border border-slate-200 dark:border-slate-700 uppercase tracking-wider">
              Scaffold
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Badge variant="success">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse" />
            Vite + React Active
          </Badge>
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded border border-slate-200 dark:border-slate-700">
            <Terminal className="w-3.5 h-3.5 text-slate-400" />
            <span>TS 5.8+</span>
          </div>
        </div>
      </div>
    </header>
  );
}
