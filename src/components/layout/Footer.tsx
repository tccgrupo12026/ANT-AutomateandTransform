interface FooterProps {
  id?: string;
}

export function Footer({ id }: FooterProps) {
  return (
    <footer id={id} className="border-t border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 py-6 mt-auto">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span>
          <span>Scalable Application Base &bull; Ready for GitHub &amp; Supabase integration</span>
        </div>
        <div className="font-mono text-slate-400 dark:text-slate-500">
          Incremental Architecture &bull; Clean Foundation
        </div>
      </div>
    </footer>
  );
}
