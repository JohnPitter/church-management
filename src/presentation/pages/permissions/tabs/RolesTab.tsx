import React from 'react';
import { permissionService } from '@modules/user-management/permissions/application/services/PermissionService';
import {
  SystemModule,
  PermissionAction,
  PermissionManager
} from '../../../../domain/entities/Permission';
import { getModuleIcon, RolePermissionsMatrix } from '../utils';

interface RolesTabProps {
  rolePermissions: RolePermissionsMatrix;
  selectedRole: string;
  onSelectRole: (role: string) => void;
  modules: SystemModule[];
  actions: PermissionAction[];
  saving: boolean;
  onToggle: (role: string, module: SystemModule, action: PermissionAction) => void;
  onSave: (role: string) => void;
  onReset: (role: string) => void;
}

export const RolesTab: React.FC<RolesTabProps> = ({
  rolePermissions,
  selectedRole,
  onSelectRole,
  modules,
  actions,
  saving,
  onToggle,
  onSave,
  onReset
}) => {
  const roleMap = rolePermissions.get(selectedRole) || new Map<SystemModule, PermissionAction[]>();

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Selecionar Função</h3>
        <div className="flex flex-wrap gap-2">
          {permissionService.getAllRolesSync().map(role => (
            <button
              key={role}
              onClick={() => onSelectRole(role)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedRole === role
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {permissionService.getRoleDisplayNameSync(role)}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            Permissões: {permissionService.getRoleDisplayNameSync(selectedRole)}
          </h3>
          <div className="flex space-x-3">
            <button
              onClick={() => onReset(selectedRole)}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              Resetar Padrão
            </button>
            <button
              onClick={() => onSave(selectedRole)}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Módulo
                </th>
                {actions.map(action => (
                  <th
                    key={action}
                    className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {PermissionManager.getActionLabel(action)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {modules.map(module => {
                const moduleActions = roleMap.get(module) || [];
                return (
                  <tr key={module} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2 text-base">{getModuleIcon(module)}</span>
                        {PermissionManager.getModuleLabel(module)}
                      </div>
                    </td>
                    {actions.map(action => (
                      <td key={action} className="px-3 py-4 text-center">
                        <input
                          type="checkbox"
                          checked={moduleActions.includes(action)}
                          onChange={() => onToggle(selectedRole, module, action)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                        />
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
