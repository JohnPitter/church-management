// Presentation Component - PageShell
// Layout padrão das páginas do painel (header branco + container max-w-7xl)

import React from 'react';

interface PageShellProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  children: React.ReactNode;
  /** Extra classes on the content region under the header */
  contentClassName?: string;
  /** Sticky header (ex.: home builder) */
  stickyHeader?: boolean;
  /** Full-bleed content (no max-w-7xl / vertical padding) for tools like home builder */
  fullBleed?: boolean;
}

export const PageShell: React.FC<PageShellProps> = ({
  title,
  subtitle,
  actions,
  children,
  contentClassName = '',
  stickyHeader = false,
  fullBleed = false,
}) => {
  const headerShell = stickyHeader
    ? 'bg-white shadow sticky top-0 z-50'
    : 'bg-white shadow';
  const headerPad = stickyHeader
    ? 'max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8'
    : 'max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8';
  const contentShell = fullBleed
    ? contentClassName
    : `max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 ${contentClassName}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={headerShell}>
        <div className={headerPad}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
              {subtitle != null && subtitle !== false && (
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

      <div className={contentShell} role="main">
        {children}
      </div>
    </div>
  );
};

export default PageShell;
