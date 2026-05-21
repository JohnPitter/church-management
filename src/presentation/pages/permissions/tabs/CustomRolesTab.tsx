import React from 'react';
import { CustomRoleConfig } from '@modules/user-management/permissions/application/services/PermissionService';
import { PermissionManager } from '../../../../domain/entities/Permission';

interface CustomRolesTabProps {
  customRoles: CustomRoleConfig[];
  saving: boolean;
  onCreate: () => void;
  onEdit: (role: CustomRoleConfig) => void;
  onDelete: (role: CustomRoleConfig) => void;
}

export const CustomRolesTab: React.FC<CustomRolesTabProps> = ({
  customRoles,
  saving,
  onCreate,
  onEdit,
  onDelete
}) => {
  const activeRoles = customRoles.filter(role => role.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Funções Personalizadas</h2>
        <button
          onClick={onCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Criar Nova Função</span>
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {customRoles.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              Nenhuma função personalizada criada
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Crie funções personalizadas com permissões específicas para sua organização.
            </p>
            <div className="mt-6">
              <button
                onClick={onCreate}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg
                  className="-ml-1 mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Criar Primeira Função
              </button>
            </div>
          </div>
        ) : (
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeRoles.map(role => (
                <div key={role.roleId} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">🏷️</span>
                        <h3 className="text-lg font-medium text-gray-900">{role.displayName}</h3>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{role.description}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <p className="text-xs text-gray-500">
                          ID: <code className="bg-gray-100 px-1 rounded">{role.roleId}</code>
                        </p>
                        <p className="text-xs text-gray-500">Criado por: {role.createdBy}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✓ Ativa
                    </span>
                  </div>

                  <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <svg
                        className="w-4 h-4 mr-1 text-indigo-600"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                        />
                      </svg>
                      Permissões ({role.modules.length} módulos)
                    </h4>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {role.modules.map(moduleConfig => (
                        <div key={moduleConfig.module} className="flex items-start gap-2 text-xs">
                          <span className="inline-block w-2 h-2 mt-1 bg-indigo-500 rounded-full flex-shrink-0"></span>
                          <div>
                            <span className="font-medium text-gray-800">
                              {PermissionManager.getModuleLabel(moduleConfig.module)}
                            </span>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {moduleConfig.actions.map(action => (
                                <span
                                  key={action}
                                  className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                  {PermissionManager.getActionLabel(action)}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => onEdit(role)}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2.5 rounded-md transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                      Editar
                    </button>
                    <button
                      onClick={() => onDelete(role)}
                      disabled={saving}
                      className="flex-1 flex items-center justify-center gap-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2.5 rounded-md transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                      {saving ? 'Desativando...' : 'Desativar'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
