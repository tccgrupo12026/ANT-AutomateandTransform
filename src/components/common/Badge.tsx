import React from 'react';

interface BadgeProps {
  id?: string;
  variant?: 'neutral' | 'success' | 'warning' | 'info';
  children: React.ReactNode;
}

export function Badge({ id, variant = 'neutral', children }: BadgeProps) {
  const variantStyles = {
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border whitespace-nowrap uppercase tracking-wider ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
