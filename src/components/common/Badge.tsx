import React from 'react';

interface BadgeProps {
  id?: string;
  variant?: 'purple' | 'green' | 'neutral' | 'warning' | 'info';
  children: React.ReactNode;
  size?: 'sm' | 'md';
}

export function Badge({ id, variant = 'neutral', children, size = 'sm' }: BadgeProps) {
  const variantStyles = {
    purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
    neutral: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
    info: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs',
    md: 'px-3 py-1 text-xs font-semibold',
  };

  return (
    <span
      id={id}
      className={`inline-flex items-center rounded-lg font-medium border whitespace-nowrap tracking-wide transition-colors ${sizeStyles[size]} ${variantStyles[variant]}`}
    >
      {children}
    </span>
  );
}
