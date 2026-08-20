/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { ProjectStatus } from './components/ProjectStatus';
import { StructureGuide } from './components/StructureGuide';
import { Card } from './components/common/Card';
import { Badge } from './components/common/Badge';
import { GitBranch, Database } from 'lucide-react';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-600 selection:text-white">
      <Header id="main-header" />

      <main id="main-content" className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-8">
        {/* Foundation Introduction */}
        <section id="hero-summary" className="space-y-2.5">
          <div className="flex items-center gap-2">
            <Badge variant="neutral">Starter Scaffold</Badge>
            <span className="text-xs text-slate-400 font-mono">TypeScript &bull; React &bull; Tailwind</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Clean &amp; Scalable Application Base
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
            Project initialized with a structured layout designed for incremental development, ready for GitHub synchronization and Supabase connectivity.
          </p>
        </section>

        {/* System & Integration Status */}
        <section id="system-status-section" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            System Environment
          </h2>
          <ProjectStatus />
        </section>

        {/* Scalable Architecture Map */}
        <section id="architecture-map-section" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Project Structure
          </h2>
          <StructureGuide />
        </section>

        {/* Integration Readiness Checklist */}
        <section id="integration-readiness-section" className="space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
            Next Development Steps
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card
              id="next-step-github"
              title="GitHub Connection"
              description="Push to your GitHub repository to enable CI/CD, version tracking, and team collaboration."
              badge={<Badge variant="info">Step 1</Badge>}
            >
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <GitBranch className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                <span>Export via Settings &rarr; Export to GitHub</span>
              </div>
            </Card>

            <Card
              id="next-step-supabase"
              title="Supabase Integration"
              description="Configure your Supabase project URL and anonymous key in environment variables to enable persistence and authentication."
              badge={<Badge variant="info">Step 2</Badge>}
            >
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 font-mono bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Add VITE_SUPABASE_URL &amp; VITE_SUPABASE_ANON_KEY</span>
              </div>
            </Card>
          </div>
        </section>
      </main>

      <Footer id="main-footer" />
    </div>
  );
}

