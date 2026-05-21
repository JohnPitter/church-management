import React from 'react';
import {
  PublicPageConfig,
  PublicPage,
  PublicPageManager
} from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';

interface PublicPagesTabProps {
  publicPageConfigs: PublicPageConfig[];
  saving: boolean;
  onTogglePublic: (page: PublicPage, isPublic: boolean) => void;
  onToggleRegistration: (page: PublicPage, allowRegistration: boolean) => void;
}

const PAGE_ICONS: Partial<Record<PublicPage, string>> = {
  [PublicPage.Home]: '🏠',
  [PublicPage.Events]: '📅',
  [PublicPage.Blog]: '📝',
  [PublicPage.Projects]: '🎯',
  [PublicPage.Devotionals]: '📖',
  [PublicPage.Forum]: '💬',
  [PublicPage.Live]: '📺'
};

export const PublicPagesTab: React.FC<PublicPagesTabProps> = ({
  publicPageConfigs,
  saving,
  onTogglePublic,
  onToggleRegistration
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">Páginas Públicas</h2>
      <div className="text-sm text-gray-600">
        Configure quais páginas podem ser acessadas por usuários não logados
      </div>
    </div>

    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Configurações de Acesso Público</h3>
        <p className="mt-1 text-sm text-gray-600">
          Defina quais páginas podem ser visualizadas por visitantes não autenticados
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Página
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acesso Público
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Registro Anônimo
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {publicPageConfigs.map(config => (
              <tr key={config.page} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{PAGE_ICONS[config.page] ?? '📄'}</span>
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {PublicPageManager.getPageLabel(config.page)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {PublicPageManager.getPageRoute(config.page)}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{config.description}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.isPublic}
                      onChange={e => onTogglePublic(config.page, e.target.checked)}
                      disabled={saving || config.page === PublicPage.Home}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                  {config.page === PublicPage.Home && (
                    <div className="mt-1 text-xs text-gray-500">Sempre público</div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {config.allowRegistration !== undefined ? (
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={config.allowRegistration && config.isPublic}
                        onChange={e => onToggleRegistration(config.page, e.target.checked)}
                        disabled={saving || !config.isPublic}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                    </label>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                  {!config.isPublic && config.allowRegistration !== undefined && (
                    <div className="mt-1 text-xs text-gray-500">Requer acesso público</div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <div className="flex items-start">
        <svg className="h-6 w-6 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
            clipRule="evenodd"
          />
        </svg>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">Como funciona o acesso público</h3>
          <div className="mt-2 text-sm text-blue-700">
            <ul className="list-disc list-inside space-y-1">
              <li>
                <strong>Acesso Público:</strong> Permite que usuários não logados visualizem a
                página
              </li>
              <li>
                <strong>Registro Anônimo:</strong> Permite que usuários não logados se inscrevam em
                eventos ou participem de fóruns
              </li>
              <li>
                <strong>Página Inicial:</strong> Sempre pública para permitir acesso aos formulários
                de login e registro
              </li>
              <li>
                <strong>Segurança:</strong> Mesmo com acesso público, dados sensíveis permanecem
                protegidos
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
);
