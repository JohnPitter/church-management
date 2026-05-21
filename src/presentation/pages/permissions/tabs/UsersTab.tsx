import React from 'react';
import { permissionService } from '@modules/user-management/permissions/application/services/PermissionService';
import {
  SystemModule,
  PermissionAction,
  PermissionManager
} from '../../../../domain/entities/Permission';
import { User } from '@/domain/entities/User';
import { Pagination } from '../../../components/common/Pagination';
import { getModuleIcon } from '../utils';

interface UsersTabProps {
  users: User[];
  paginatedUsers: User[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedUserId: string;
  onSelectUser: (userId: string) => void;
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: number) => void;
  };
  modules: SystemModule[];
  actions: PermissionAction[];
  saving: boolean;
  onSave: (userId: string) => void;
  onToggle: (
    userId: string,
    module: SystemModule,
    action: PermissionAction,
    type: 'grant' | 'revoke'
  ) => void;
  getStatus: (
    userId: string,
    module: SystemModule,
    action: PermissionAction
  ) => 'default' | 'granted' | 'revoked';
}

export const UsersTab: React.FC<UsersTabProps> = ({
  users,
  paginatedUsers,
  searchTerm,
  onSearchChange,
  selectedUserId,
  onSelectUser,
  pagination,
  modules,
  actions,
  saving,
  onSave,
  onToggle,
  getStatus
}) => {
  const selectedUser = users.find(u => u.id === selectedUserId);
  const userRole = selectedUser?.role || 'member';

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Buscar Usuário</label>
            <input
              type="text"
              value={searchTerm}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Nome ou email..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Usuário</label>
            <select
              value={selectedUserId}
              onChange={e => onSelectUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Selecione um usuário...</option>
              {paginatedUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.displayName} ({user.email}) - {permissionService.getRoleDisplayNameSync(user.role)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalItems={pagination.totalItems}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onPageSizeChange={pagination.onPageSizeChange}
          itemLabel="usuários"
        />
      </div>

      {selectedUserId && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Permissões Personalizadas</h3>
              <p className="text-sm text-gray-600 mt-1">
                {selectedUser?.displayName} - Função:{' '}
                {permissionService.getRoleDisplayNameSync(userRole)}
              </p>
            </div>
            <button
              onClick={() => onSave(selectedUserId)}
              disabled={saving}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>

          <div className="p-4 bg-yellow-50 border-b border-yellow-200">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-yellow-400 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Legenda:</strong> ✅ Concedido (override) | ❌ Revogado (override) | ⬜
                  Padrão da função
                </p>
              </div>
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
                {modules.map(module => (
                  <tr key={module} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      <div className="flex items-center">
                        <span className="mr-2 text-base">{getModuleIcon(module)}</span>
                        {PermissionManager.getModuleLabel(module)}
                      </div>
                    </td>
                    {actions.map(action => {
                      const status = getStatus(selectedUserId, module, action);
                      const hasDefaultPermission = PermissionManager.hasPermission(userRole, module, action);
                      return (
                        <td key={action} className="px-3 py-4 text-center">
                          <div className="flex justify-center space-x-1">
                            <button
                              onClick={() => onToggle(selectedUserId, module, action, 'grant')}
                              className={`p-1 rounded ${
                                status === 'granted'
                                  ? 'bg-green-100 text-green-600'
                                  : 'bg-gray-100 text-gray-400 hover:bg-green-50 hover:text-green-500'
                              }`}
                              title="Conceder"
                            >
                              ✅
                            </button>
                            <button
                              onClick={() => onToggle(selectedUserId, module, action, 'revoke')}
                              className={`p-1 rounded ${
                                status === 'revoked'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                              }`}
                              title="Revogar"
                            >
                              ❌
                            </button>
                            <span
                              className={`p-1 rounded ${
                                hasDefaultPermission
                                  ? 'bg-blue-100 text-blue-600'
                                  : 'bg-gray-100 text-gray-400'
                              }`}
                            >
                              ⬜
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
