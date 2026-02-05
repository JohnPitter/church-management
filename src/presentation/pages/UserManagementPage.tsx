// Presentation Page - User Management
// Admin interface for managing user roles and permissions

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { User as DomainUser, UserRole, UserRegistration } from '@/domain/entities/User';
import { CreateUserModal } from '../components/CreateUserModal';
import { PermissionService } from '@modules/user-management/permissions/application/services/PermissionService';
import { PermissionGuard } from '../components/PermissionGuard';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';

// Presentation interface that maps to domain entities
interface PresentationUser {
  id: string;
  name: string;
  email: string;
  role: string; // Allow any role string to support custom roles
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

// Helper functions to map between domain and presentation layers
const mapDomainRoleToPresentation = (domainRole: UserRole | string): string => {
  // If it's already a string (custom role), return it as-is
  if (typeof domainRole === 'string' && !Object.values(UserRole).includes(domainRole as UserRole)) {
    return domainRole;
  }

  // Map enum values to presentation strings
  switch (domainRole) {
    case UserRole.Admin:
      return 'admin';
    case UserRole.Secretary:
      return 'secretary';
    case UserRole.Professional:
      return 'professional';
    case UserRole.Member:
    default:
      return 'member';
  }
};

const _mapPresentationRoleToDomain = (presentationRole: string): UserRole | string => {
  // If it's a custom role (not in standard list), return as-is
  const standardRoles = ['admin', 'secretary', 'professional', 'leader', 'member'];
  if (!standardRoles.includes(presentationRole)) {
    return presentationRole;
  }

  // Map presentation strings to enum values
  switch (presentationRole) {
    case 'admin':
      return UserRole.Admin;
    case 'secretary':
      return UserRole.Secretary;
    case 'professional':
      return UserRole.Professional;
    case 'leader':
    case 'member':
    default:
      return UserRole.Member;
  }
};

const mapDomainUserToPresentation = (domainUser: DomainUser): PresentationUser => {
  return {
    id: domainUser.id,
    name: domainUser.displayName,
    email: domainUser.email,
    role: mapDomainRoleToPresentation(domainUser.role) as any, // Preserve custom roles as strings
    createdAt: domainUser.createdAt,
    lastLogin: domainUser.updatedAt, // Using updatedAt as last activity indicator
    isActive: domainUser.status === 'approved'
  };
};

export const UserManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState<PresentationUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const userRepository = useMemo(() => new FirebaseUserRepository(), []);
  const permissionService = useMemo(() => new PermissionService(), []);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');

  // Helper function to get role colors
  const getRoleColorStatic = (role: string) => {
    const colorMap: Record<string, string> = {
      member: 'bg-gray-100 text-gray-800',
      professional: 'bg-purple-100 text-purple-800',
      leader: 'bg-blue-100 text-blue-800',
      secretary: 'bg-green-100 text-green-800',
      finance: 'bg-yellow-100 text-yellow-800',
      admin: 'bg-red-100 text-red-800'
    };
    return colorMap[role] || 'bg-gray-100 text-gray-800';
  };

  const [roles, setRoles] = useState<Array<{ value: string; label: string; color: string }>>([]);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || user.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  // Load roles (including custom roles) on component mount
  useEffect(() => {
    const loadRoles = async () => {
      try {
        const allRoles = await permissionService.getAllRoles();
        const rolesData = allRoles.map(role => ({
          value: role,
          label: permissionService.getRoleDisplayNameSync(role),
          color: getRoleColorStatic(role)
        }));
        setRoles(rolesData);
      } catch (error) {
        console.error('Error loading roles:', error);
        // Fallback to default roles
        const defaultRoles = permissionService.getAllRolesSync();
        const rolesData = defaultRoles.map(role => ({
          value: role,
          label: permissionService.getRoleDisplayNameSync(role),
          color: getRoleColorStatic(role)
        }));
        setRoles(rolesData);
      }
    };

    loadRoles();
  }, [permissionService]);

  // Load users from Firebase
  const loadUsers = async () => {
    try {
      setLoading(true);
      const domainUsers = await userRepository.findAll();

      // Convert domain users to presentation interface
      const presentationUsers: PresentationUser[] = domainUsers.map(mapDomainUserToPresentation);

      setUsers(presentationUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      // Keep empty array on error rather than falling back to mock data
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  // Load users on component mount
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userRepository]);

  const handleRoleChange = async (userId: string, newRole: string) => {
    if (!window.confirm(`Tem certeza que deseja alterar a função deste usuário?`)) {
      return;
    }

    setLoading(true);
    try {
      console.log(`[UserManagementPage] Changing user ${userId} role to: ${newRole}`);

      // Pass the role directly without conversion to support custom roles
      await userRepository.updateRole(userId, newRole, currentUser?.email || 'Admin');

      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, role: newRole as any } : user
        )
      );

      alert('Função do usuário atualizada com sucesso!');

      // Reload users to get fresh data from the database
      await loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Erro ao atualizar função do usuário.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (userId: string, isActive: boolean) => {
    const action = isActive ? 'ativar' : 'desativar';
    if (!window.confirm(`Tem certeza que deseja ${action} este usuário?`)) {
      return;
    }

    setLoading(true);
    try {
      // Update user status via repository
      if (isActive) {
        await userRepository.approveUser(userId, currentUser?.email || 'Admin');
      } else {
        await userRepository.suspendUser(userId, currentUser?.email || 'Admin', 'Suspenso pelo administrador');
      }
      
      // Update local state
      setUsers(prevUsers =>
        prevUsers.map(user =>
          user.id === userId ? { ...user, isActive } : user
        )
      );
      
      alert(`Usuário ${action}do com sucesso!`);
    } catch (error) {
      console.error('Error updating user status:', error);
      alert(`Erro ao ${action} usuário.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    // Prevent admin from deleting themselves
    if (userId === currentUser?.id) {
      alert('Você não pode deletar sua própria conta!');
      return;
    }

    // Double confirmation for delete action
    const firstConfirm = window.confirm(
      `⚠️ ATENÇÃO: Você está prestes a deletar permanentemente o usuário "${userName}".\n\n` +
      `Esta ação irá:\n` +
      `• Remover o usuário do Firebase Auth\n` +
      `• Deletar todos os dados do usuário\n` +
      `• Esta ação NÃO pode ser desfeita\n\n` +
      `Tem certeza que deseja continuar?`
    );

    if (!firstConfirm) return;

    const finalConfirm = window.confirm(
      `🚨 CONFIRMAÇÃO FINAL:\n\n` +
      `Digite "DELETAR" no próximo prompt para confirmar a exclusão permanente do usuário "${userName}"`
    );

    if (!finalConfirm) return;

    const confirmationText = prompt(
      `Para confirmar a exclusão permanente do usuário "${userName}", digite exatamente: DELETAR`
    );

    if (confirmationText !== 'DELETAR') {
      alert('Texto de confirmação incorreto. Exclusão cancelada.');
      return;
    }

    setLoading(true);
    try {
      await userRepository.delete(userId);
      
      // Remove user from local state
      setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
      
      alert(`Usuário "${userName}" deletado permanentemente com sucesso!`);
    } catch (error) {
      console.error('Error deleting user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar usuário';
      alert(`Erro ao deletar usuário: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (userData: UserRegistration) => {
    try {
      setCreateLoading(true);
      const newUser = await userRepository.create(userData);
      
      // Add to local state
      const presentationUser = mapDomainUserToPresentation(newUser);
      setUsers(prevUsers => [presentationUser, ...prevUsers]);
      
      alert('Usuário criado com sucesso!');
      setCreateModalOpen(false);
    } catch (error) {
      console.error('Error creating user:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao criar usuário';
      alert(errorMessage);
      throw error; // Re-throw to let the modal handle it
    } finally {
      setCreateLoading(false);
    }
  };

  const getRoleLabel = (role: string) => {
    return permissionService.getRoleDisplayNameSync(role);
  };

  const getRoleColor = (role: string) => {
    return getRoleColorStatic(role);
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      member: 'Acesso básico ao sistema',
      professional: 'Acesso ao painel de assistência profissional',
      leader: 'Pode gerenciar eventos e projetos',
      secretary: 'Pode gerenciar membros e conteúdo',
      finance: 'Acesso completo ao módulo financeiro',
      admin: 'Acesso total ao sistema'
    };
    return descriptions[role] || 'Função personalizada';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Usuários</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie funções e permissões dos usuários do sistema
              </p>
            </div>
            <PermissionGuard 
              module={SystemModule.Users} 
              action={PermissionAction.Create}
            >
              <button
                onClick={() => setCreateModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Criar Usuário</span>
              </button>
            </PermissionGuard>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Search and Filters */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar usuários por nome ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas as Funções</option>
              {roles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Usuários ({filteredUsers.length})
            </h3>
          </div>
          
          {loading && users.length === 0 && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
              <p className="mt-2 text-sm text-gray-500">Carregando usuários...</p>
            </div>
          )}
          
          {(!loading || users.length > 0) && (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Usuário
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Função Atual
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Alterar Função
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Último Login
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className={!user.isActive ? 'opacity-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-indigo-400 to-purple-500 flex items-center justify-center">
                              <span className="text-sm font-medium text-white">
                                {user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                              </span>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{user.name}</div>
                              <div className="text-sm text-gray-500">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <PermissionGuard 
                            module={SystemModule.Users} 
                            action={PermissionAction.Update}
                            fallback={
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                                {getRoleLabel(user.role)} (Somente leitura)
                              </span>
                            }
                          >
                            <select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              disabled={loading || user.id === currentUser?.id}
                              className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-50"
                            >
                              {roles.map(role => (
                                <option key={role.value} value={role.value}>
                                  {role.label}
                                </option>
                              ))}
                            </select>
                          </PermissionGuard>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            user.isActive 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {user.id !== currentUser?.id && (
                            <PermissionGuard 
                              module={SystemModule.Users} 
                              action={PermissionAction.Update}
                              fallback={
                                <span className="text-gray-400 text-sm">Sem permissão</span>
                              }
                            >
                              <div className="flex space-x-3">
                                <button
                                  onClick={() => handleToggleStatus(user.id, !user.isActive)}
                                  disabled={loading}
                                  className={`text-sm font-medium disabled:opacity-50 ${
                                    user.isActive 
                                      ? 'text-yellow-600 hover:text-yellow-800' 
                                      : 'text-green-600 hover:text-green-800'
                                  }`}
                                >
                                  {user.isActive ? 'Desativar' : 'Ativar'}
                                </button>
                                
                                <PermissionGuard 
                                  module={SystemModule.Users} 
                                  action={PermissionAction.Delete}
                                  fallback={null}
                                >
                                  <button
                                    onClick={() => handleDeleteUser(user.id, user.name)}
                                    disabled={loading}
                                    className="text-sm font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                                    title="Deletar usuário permanentemente"
                                  >
                                    🗑️ Deletar
                                  </button>
                                </PermissionGuard>
                              </div>
                            </PermissionGuard>
                          )}
                          
                          {user.id === currentUser?.id && (
                            <span className="text-gray-400 text-sm">Você mesmo</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && !loading && (
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
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Tente ajustar os filtros ou fazer uma nova busca.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="h-6 w-6 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Informações sobre Funções</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  {permissionService.getAllRolesSync().map(role => (
                    <li key={role}>
                      <strong>{permissionService.getRoleDisplayNameSync(role)}:</strong> {getRoleDescription(role)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onCreateUser={handleCreateUser}
        loading={createLoading}
        availableRoles={roles.map(r => ({ value: r.value, label: r.label }))}
      />
    </div>
  );
};