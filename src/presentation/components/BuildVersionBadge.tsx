import React from 'react';
import { buildInfo } from '@/config/buildInfo';

const VERSION_LABEL = 'Versão';
const UPDATED_LABEL = 'Build';

const formatBuildTime = (value: string): string => {
  if (!value || value === 'dev' || value === 'development') {
    return value;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(date);
};

export const BuildVersionBadge: React.FC = () => {
  const title = `${VERSION_LABEL} ${buildInfo.buildVersion} | ${UPDATED_LABEL} ${formatBuildTime(buildInfo.buildTime)}`;

  return (
    <div
      aria-label={title}
      title={title}
      className="fixed bottom-2 right-2 z-50 rounded bg-black/70 px-2 py-1 text-[10px] font-medium text-white shadow-sm print:hidden"
    >
      v{buildInfo.buildVersion}
    </div>
  );
};
