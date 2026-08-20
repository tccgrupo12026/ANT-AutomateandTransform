import { Database, GitBranch, Cpu } from 'lucide-react';
import { Card } from './common/Card';
import { Badge } from './common/Badge';
import { isSupabaseConnected } from '../lib/supabase';

export function ProjectStatus() {
  const supabaseConnected = isSupabaseConnected();

  return (
    <div id="project-status-section" className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <Card
        id="status-runtime-card"
        badge={<Badge variant="success">Online</Badge>}
        className="p-5"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Core Runtime</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">React + Vite</div>
          </div>
        </div>
      </Card>

      <Card
        id="status-supabase-card"
        badge={
          supabaseConnected ? (
            <Badge variant="success">Connected</Badge>
          ) : (
            <Badge variant="neutral">Ready to configure</Badge>
          )
        }
        className="p-5"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Database Layer</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">Supabase Client</div>
          </div>
        </div>
      </Card>

      <Card
        id="status-git-card"
        badge={<Badge variant="info">Ready</Badge>}
        className="p-5"
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <GitBranch className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Source Control</div>
            <div className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">GitHub Ready</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
