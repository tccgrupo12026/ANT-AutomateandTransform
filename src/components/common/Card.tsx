import React from 'react';

interface CardProps {
  id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
  headerAction?: React.ReactNode;
  accent?: 'purple' | 'green' | 'none';
}

export function Card({
  id,
  title,
  subtitle,
  description,
  children,
  className = '',
  badge,
  headerAction,
  accent = 'none',
}: CardProps) {
  const accentStyles = {
    none: '',
    purple: 'border-t-4 border-t-purple-600',
    green: 'border-t-4 border-t-emerald-500',
  };

  return (
    <div
      id={id}
      className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xs transition-all duration-200 ${accentStyles[accent]} ${className}`}
    >
      {(title || subtitle || badge || headerAction) && (
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            {title && (
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                {subtitle}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {badge}
            {headerAction}
          </div>
        </div>
      )}
      {description && (
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {children}
    </div>
  );
}
