import React from 'react';

interface CardProps {
  id?: string;
  title?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export function Card({ id, title, description, children, className = '', badge }: CardProps) {
  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm transition-all duration-200 ${className}`}
    >
      {(title || badge) && (
        <div className="flex items-center justify-between gap-4 mb-3">
          {title && (
            <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
              {title}
            </h3>
          )}
          {badge}
        </div>
      )}
      {description && (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
