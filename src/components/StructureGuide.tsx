import { Folder, CheckCircle2 } from 'lucide-react';
import { Card } from './common/Card';
import { Badge } from './common/Badge';

interface StructureItem {
  directory: string;
  role: string;
  description: string;
  status: 'initialized' | 'ready';
}

const structureItems: StructureItem[] = [
  {
    directory: 'src/components/',
    role: 'UI Components',
    description: 'Divided into layout, common primitives, and future domain feature components.',
    status: 'initialized',
  },
  {
    directory: 'src/lib/',
    role: 'Core Utilities & SDKs',
    description: 'Centralized configurations and client initializers (including Supabase integration).',
    status: 'initialized',
  },
  {
    directory: 'src/types/',
    role: 'Type System',
    description: 'Shared TypeScript types, data contracts, and domain models.',
    status: 'initialized',
  },
  {
    directory: 'src/services/',
    role: 'Service Layer',
    description: 'Modular API and data access handlers when business logic is implemented.',
    status: 'ready',
  },
  {
    directory: 'src/hooks/',
    role: 'Custom Hooks',
    description: 'Encapsulated state logic and client-side lifecycle handlers.',
    status: 'ready',
  },
];

export function StructureGuide() {
  return (
    <Card
      id="structure-guide-card"
      title="Modular Project Architecture"
      description="Clean foundation established to support incremental additions without refactoring base code."
      badge={<Badge variant="neutral">Architecture v1.0</Badge>}
    >
      <div className="space-y-3">
        {structureItems.map((item) => (
          <div
            key={item.directory}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 gap-2 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-indigo-600 dark:text-indigo-400 mt-0.5 sm:mt-0 shadow-xs">
                <Folder className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {item.directory}
                  </span>
                  <span className="text-xs text-slate-400">&bull;</span>
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    {item.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {item.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center pl-9 sm:pl-0">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {item.status === 'initialized' ? 'Configured' : 'Ready'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
