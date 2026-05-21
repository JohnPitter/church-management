// Presentation Page - Permissions Management
// Admin interface for managing role permissions and user overrides

import React, { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionManager } from '../../domain/entities/Permission';
import { CreateRoleModal } from '../components/CreateRoleModal';
import { usePagination } from '../hooks/usePagination';
import { useConfirmDialog } from '../components/ConfirmDialog';
import { CustomRoleConfig } from '@modules/user-management/permissions/application/services/PermissionService';
import { permissionService } from '@modules/user-management/permissions/application/services/PermissionService';

import { TAB_CONFIG, TabId } from './permissions/utils';
import { usePermissionsData } from './permissions/usePermissionsData';
import { RolesTab } from './permissions/tabs/RolesTab';
import { UsersTab } from './permissions/tabs/UsersTab';
import { CustomRolesTab } from './permissions/tabs/CustomRolesTab';
import { PublicPagesTab } from './permissions/tabs/PublicPagesTab';

export const PermissionsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { confirm } = useConfirmDialog();
  const { refreshPermissions } = usePermissions();

  const data = usePermissionsData({
    currentUserEmail: currentUser?.email,
    currentUser,
    refreshPermissions
  });

  const [activeTab, setActiveTab] = useState<TabId>('roles');
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [createRoleLoading, setCreateRoleLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRoleConfig | null>(null);

  const modules = useMemo(() => PermissionManager.getAllModules(), []);
  const actions = useMemo(() => PermissionManager.getAllActions(), []);

  const filteredUsers = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return data.users.filter(
      user =>
        (user.displayName?.toLowerCase() || '').includes(term) ||
        user.email.toLowerCase().includes(term)
    );
  }, [data.users, searchTerm]);

  const {
    currentPage: usersCurrentPage,
    totalPages: usersTotalPages,
    totalItems: usersTotalItems,
    pageSize: usersPageSize,
    paginatedItems: paginatedUsers,
    setCurrentPage: setUsersCurrentPage,
    setPageSize: setUsersPageSize
  } = usePagination(filteredUsers);

  const handleResetRole = async (role: string) => {
    const confirmed = await confirm({
      title: 'Confirmacao',
      message: `Tem certeza que deseja resetar as permissoes de ${permissionService.getRoleDisplayNameSync(role)} para o padrao?`,
      variant: 'warning'
    });
    if (!confirmed) return;
    await data.resetRolePermissions(role, permissionService.getRoleDisplayNameSync(role));
  };

  const handleDeleteCustomRole = async (role: CustomRoleConfig) => {
    const confirmed = await confirm({
      title: 'Confirmacao',
      message: `Tem certeza que deseja desativar a funcao "${role.displayName}"?\n\nUsuarios com esta funcao perderao suas permissoes associadas.`,
      variant: 'danger'
    });
    if (!confirmed) return;
    await data.deleteCustomRole(role);
  };

  const handleCreateRole = async (roleData: Parameters<typeof data.createCustomRole>[0]) => {
    setCreateRoleLoading(true);
    try {
      await data.createCustomRole(roleData);
      setShowCreateRoleModal(false);
    } finally {
      setCreateRoleLoading(false);
    }
  };

  const handleUpdateRole = async (
    roleId: string,
    roleData: Parameters<typeof data.updateCustomRole>[1]
  ) => {
    setCreateRoleLoading(true);
    try {
      await data.updateCustomRole(roleId, roleData);
      setShowCreateRoleModal(false);
      setEditingRole(null);
    } finally {
      setCreateRoleLoading(false);
    }
  };

  if (data.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Permissões</h1>
              <p className="mt-1 text-sm text-gray-600">
                Configure permissões de funções e usuários específicos
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {TAB_CONFIG.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2 text-lg">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {data.showFirestoreWarning && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Configuração do Firestore Necessária
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Para salvar permissões personalizadas, você precisa configurar as regras do
                    Firestore:
                  </p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>
                      Acesse o{' '}
                      <a
                        href="https://console.firebase.google.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline font-medium"
                      >
                        Firebase Console
                      </a>
                    </li>
                    <li>Vá para Firestore Database → Rules</li>
                    <li>
                      Adicione as regras do arquivo{' '}
                      <code className="bg-yellow-100 px-1 rounded">SETUP_PERMISSIONS.md</code>
                    </li>
                    <li>Clique em "Publish" para aplicar as regras</li>
                  </ol>
                  <p className="mt-2 font-medium">
                    Nota: O sistema está funcionando com permissões padrão até que as regras sejam
                    configuradas.
                  </p>
                </div>
              </div>
              <div className="ml-3">
                <button
                  onClick={data.dismissFirestoreWarning}
                  className="text-yellow-400 hover:text-yellow-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'roles' && (
          <RolesTab
            rolePermissions={data.rolePermissions}
            selectedRole={selectedRole}
            onSelectRole={setSelectedRole}
            modules={modules}
            actions={actions}
            saving={data.saving}
            onToggle={data.handleRolePermissionToggle}
            onSave={data.saveRolePermissions}
            onReset={handleResetRole}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={data.users}
            paginatedUsers={paginatedUsers}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            pagination={{
              currentPage: usersCurrentPage,
              totalPages: usersTotalPages,
              totalItems: usersTotalItems,
              pageSize: usersPageSize,
              onPageChange: setUsersCurrentPage,
              onPageSizeChange: setUsersPageSize
            }}
            modules={modules}
            actions={actions}
            saving={data.saving}
            onSave={data.saveUserOverrides}
            onToggle={data.handleUserOverrideToggle}
            getStatus={data.getUserPermissionStatus}
          />
        )}

        {activeTab === 'custom-roles' && (
          <CustomRolesTab
            customRoles={data.customRoles}
            saving={data.saving}
            onCreate={() => setShowCreateRoleModal(true)}
            onEdit={role => {
              setEditingRole(role);
              setShowCreateRoleModal(true);
            }}
            onDelete={handleDeleteCustomRole}
          />
        )}

        {activeTab === 'public-pages' && (
          <PublicPagesTab
            publicPageConfigs={data.publicPageConfigs}
            saving={data.saving}
            onTogglePublic={data.togglePublicPage}
            onToggleRegistration={data.toggleRegistration}
          />
        )}

        <CreateRoleModal
          isOpen={showCreateRoleModal}
          onClose={() => {
            setShowCreateRoleModal(false);
            setEditingRole(null);
          }}
          onCreateRole={handleCreateRole}
          onUpdateRole={handleUpdateRole}
          loading={createRoleLoading}
          editingRole={editingRole}
        />

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="h-6 w-6 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Como funciona o sistema de permissões
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li>
                    <strong>Permissões por Função:</strong> Define as permissões padrão para todos
                    os usuários de uma função
                  </li>
                  <li>
                    <strong>Permissões por Usuário:</strong> Permite conceder ou revogar permissões
                    específicas para usuários individuais
                  </li>
                  <li>
                    <strong>Funções Personalizadas:</strong> Crie funções específicas para sua
                    organização com permissões customizadas
                  </li>
                  <li>
                    <strong>Páginas Públicas:</strong> Configure quais páginas podem ser acessadas
                    por usuários não logados
                  </li>
                  <li>
                    <strong>Prioridade:</strong> Permissões de usuário têm prioridade sobre
                    permissões de função
                  </li>
                  <li>
                    <strong>Conceder:</strong> Adiciona uma permissão mesmo que a função não a tenha
                  </li>
                  <li>
                    <strong>Revogar:</strong> Remove uma permissão mesmo que a função a tenha
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
