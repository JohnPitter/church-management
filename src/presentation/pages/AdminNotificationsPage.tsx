// Presentation Page - Admin Notifications Management
// Administrative interface for managing and creating custom notifications

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { NotificationPriority } from '@modules/shared-kernel/notifications/domain/entities/Notification';

interface CustomNotificationForm {
  title: string;
  message: string;
  targetUsers: 'all' | 'roles' | 'specific';
  roles: string[];
  userIds: string[];
  priority: NotificationPriority;
  actionUrl: string;
  actionText: string;
  imageUrl: string;
  expiresAt: string;
}

interface UserOption {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const AdminNotificationsPage: React.FC = () => {
  const { createCustomNotification } = useNotifications();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Permission checks
  const canView = hasPermission(SystemModule.Notifications, PermissionAction.View);
  const canCreate = hasPermission(SystemModule.Notifications, PermissionAction.Create);

  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [form, setForm] = useState<CustomNotificationForm>({
    title: '',
    message: '',
    targetUsers: 'all',
    roles: [],
    userIds: [],
    priority: NotificationPriority.Medium,
    actionUrl: '',
    actionText: '',
    imageUrl: '',
    expiresAt: ''
  });

  const userRepository = new FirebaseUserRepository();

  // Load users for targeting specific users
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await userRepository.findAll();
        const userOptions = allUsers
          .filter(user => user.status === 'approved')
          .map(user => ({
            id: user.id,
            name: user.displayName || user.email,
            email: user.email,
            role: user.role
          }));
        setUsers(userOptions);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };

    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInputChange = (field: keyof CustomNotificationForm, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleRoleToggle = (role: string) => {
    setForm(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  };

  const handleUserToggle = (userId: string) => {
    setForm(prev => ({
      ...prev,
      userIds: prev.userIds.includes(userId)
        ? prev.userIds.filter(id => id !== userId)
        : [...prev.userIds, userId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim() || !form.message.trim()) {
      alert('Título e mensagem são obrigatórios');
      return;
    }

    if (form.targetUsers === 'roles' && form.roles.length === 0) {
      alert('Selecione pelo menos uma função');
      return;
    }

    if (form.targetUsers === 'specific' && form.userIds.length === 0) {
      alert('Selecione pelo menos um usuário');
      return;
    }

    setLoading(true);
    try {
      
      const options: any = {
        priority: form.priority,
        actionUrl: form.actionUrl || undefined,
        actionText: form.actionText || undefined,
        imageUrl: form.imageUrl || undefined,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : undefined
      };

      if (form.targetUsers === 'roles') {
        options.roles = form.roles;
      } else if (form.targetUsers === 'specific') {
        options.userIds = form.userIds;
      }

      const notificationCount = await createCustomNotification(
        form.title,
        form.message,
        form.targetUsers,
        options
      );

      alert(`Notificação enviada para ${notificationCount} usuários com sucesso!`);
      
      // Reset form
      setForm({
        title: '',
        message: '',
        targetUsers: 'all',
        roles: [],
        userIds: [],
        priority: NotificationPriority.Medium,
        actionUrl: '',
        actionText: '',
        imageUrl: '',
        expiresAt: ''
      });
      
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating notification:', error);
      alert(`Erro ao criar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  const availableRoles = [
    { key: 'admin', label: 'Administradores' },
    { key: 'secretary', label: 'Secretários' },
    { key: 'leader', label: 'Líderes' },
    { key: 'member', label: 'Membros' }
  ];

  const roleStats = users.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Filtered users based on search and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // Permission loading state
  if (permissionsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        <span className="ml-2 text-gray-600">Verificando permissões...</span>
      </div>
    );
  }

  // Access denied if user cannot view notifications
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para gerenciar notificações.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gerenciar Notificações</h1>
              <p className="mt-1 text-sm text-gray-600">
                Crie e envie notificações personalizadas para os usuários
              </p>
            </div>
            
            {canCreate && (
              <button
                onClick={() => setShowCreateForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <span className="mr-2">➕</span>
                Nova Notificação
              </button>
            )}
          </div>

        </div>
      </div>

      {/* User Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Buscar Usuários para Notificação
          </h2>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            {/* Search by name/email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por nome ou email
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Digite o nome ou email..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter by role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por função
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">Todas as funções</option>
                {availableRoles.map(role => (
                  <option key={role.key} value={role.key}>
                    {role.label} ({roleStats[role.key] || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results summary */}
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Exibindo <span className="font-semibold">{filteredUsers.length}</span> de{' '}
              <span className="font-semibold">{users.length}</span> usuários
            </p>
          </div>

          {/* Users list */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nome
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Função
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-8 text-center text-sm text-gray-500">
                        Nenhum usuário encontrado
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'secretary' ? 'bg-blue-100 text-blue-800' :
                            user.role === 'leader' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {availableRoles.find(r => r.key === user.role)?.label || user.role}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Create Notification Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowCreateForm(false)}></div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
              <form onSubmit={handleSubmit}>
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="sm:flex sm:items-start">
                    <div className="w-full">
                      <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
                        Criar Nova Notificação
                      </h3>

                      <div className="space-y-4">
                        {/* Title */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Título *
                          </label>
                          <input
                            type="text"
                            value={form.title}
                            onChange={(e) => handleInputChange('title', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Título da notificação"
                            required
                          />
                        </div>

                        {/* Message */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Mensagem *
                          </label>
                          <textarea
                            value={form.message}
                            onChange={(e) => handleInputChange('message', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Conteúdo da notificação"
                            required
                          />
                        </div>

                        {/* Target Users */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Destinatários
                          </label>
                          <div className="space-y-2">
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="all"
                                checked={form.targetUsers === 'all'}
                                onChange={(e) => handleInputChange('targetUsers', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">Todos os usuários ({users.length} usuários)</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="roles"
                                checked={form.targetUsers === 'roles'}
                                onChange={(e) => handleInputChange('targetUsers', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">Por função</span>
                            </label>
                            <label className="flex items-center">
                              <input
                                type="radio"
                                value="specific"
                                checked={form.targetUsers === 'specific'}
                                onChange={(e) => handleInputChange('targetUsers', e.target.value)}
                                className="mr-2"
                              />
                              <span className="text-sm">Usuários específicos</span>
                            </label>
                          </div>
                        </div>

                        {/* Role Selection */}
                        {form.targetUsers === 'roles' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Selecionar Funções
                            </label>
                            <div className="space-y-2">
                              {availableRoles.map((role) => (
                                <label key={role.key} className="flex items-center justify-between">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={form.roles.includes(role.key)}
                                      onChange={() => handleRoleToggle(role.key)}
                                      className="mr-2"
                                    />
                                    <span className="text-sm">{role.label}</span>
                                  </div>
                                  <span className="text-xs text-gray-500">
                                    {roleStats[role.key] || 0} usuários
                                  </span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* User Selection */}
                        {form.targetUsers === 'specific' && (
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Selecionar Usuários ({form.userIds.length} selecionados)
                            </label>
                            <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-2 space-y-1">
                              {users.map((user) => (
                                <label key={user.id} className="flex items-center justify-between hover:bg-gray-50 p-1 rounded">
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      checked={form.userIds.includes(user.id)}
                                      onChange={() => handleUserToggle(user.id)}
                                      className="mr-2"
                                    />
                                    <div>
                                      <div className="text-sm font-medium">{user.name}</div>
                                      <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                  </div>
                                  <span className="text-xs text-gray-400 capitalize">{user.role}</span>
                                </label>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Priority */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Prioridade
                          </label>
                          <select
                            value={form.priority}
                            onChange={(e) => handleInputChange('priority', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value={NotificationPriority.Low}>Baixa</option>
                            <option value={NotificationPriority.Medium}>Média</option>
                            <option value={NotificationPriority.High}>Alta</option>
                            <option value={NotificationPriority.Urgent}>Urgente</option>
                          </select>
                        </div>

                        {/* Action URL */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            URL de Ação (opcional)
                          </label>
                          <input
                            type="url"
                            value={form.actionUrl}
                            onChange={(e) => handleInputChange('actionUrl', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="https://exemplo.com/pagina"
                          />
                        </div>

                        {/* Action Text */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Texto do Botão (opcional)
                          </label>
                          <input
                            type="text"
                            value={form.actionText}
                            onChange={(e) => handleInputChange('actionText', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            placeholder="Ver mais"
                          />
                        </div>

                        {/* Expires At */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Data de Expiração (opcional)
                          </label>
                          <input
                            type="datetime-local"
                            value={form.expiresAt}
                            onChange={(e) => handleInputChange('expiresAt', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50"
                  >
                    {loading ? 'Enviando...' : 'Enviar Notificação'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <span className="text-2xl">👥</span>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total de Usuários</p>
                <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
              </div>
            </div>
          </div>

          {availableRoles.map((role) => (
            <div key={role.key} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <span className="text-2xl">👤</span>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">{role.label}</p>
                  <p className="text-2xl font-semibold text-gray-900">{roleStats[role.key] || 0}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Templates */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Modelos Rápidos</h3>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                title: 'Aviso Geral',
                message: 'Comunicado importante para todos os membros da igreja.',
                priority: NotificationPriority.Medium,
                targetUsers: 'all' as const
              },
              {
                title: 'Reunião de Liderança',
                message: 'Convocação para reunião de liderança na próxima semana.',
                priority: NotificationPriority.High,
                targetUsers: 'roles' as const,
                roles: ['leader', 'admin']
              },
              {
                title: 'Urgente - Administração',
                message: 'Assunto urgente que requer atenção imediata da administração.',
                priority: NotificationPriority.Urgent,
                targetUsers: 'roles' as const,
                roles: ['admin']
              }
            ].map((template, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <h3 className="font-medium text-gray-900">{template.title}</h3>
                <p className="text-sm text-gray-600 mt-1">{template.message}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    template.priority === NotificationPriority.Urgent ? 'bg-red-100 text-red-800' :
                    template.priority === NotificationPriority.High ? 'bg-yellow-100 text-yellow-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {template.priority}
                  </span>
                  {canCreate && (
                    <button
                      onClick={() => {
                        setForm({ ...form, ...template, roles: template.roles || [] });
                        setShowCreateForm(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                    >
                      Usar modelo
                    </button>
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};