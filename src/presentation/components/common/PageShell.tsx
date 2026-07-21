// Presentation Component - PageShell
// Layout padrão das páginas do painel (header branco + container max-w-7xl)

import React from 'react';

interface PageShellProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Conteúdo abaixo do header (ex.: stats); se false, children ocupam a área principal */
  contentClassName?: string;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  contentClassName = ''
}) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
              )}
            </div>
            {actions && (
              <div className="flex-shrink-0 flex flex-wrap items-center gap-3">
                {actions}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={`max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 ${contentClassName}`}>
        {children}
      </div>
    </div>
  );
};

export default PageShell;
