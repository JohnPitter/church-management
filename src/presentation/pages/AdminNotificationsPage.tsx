// Presentation Page - Admin Notifications Management
// Administrative interface for managing and creating custom notifications

import React, { useState, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { usePagination } from '../hooks/usePagination';
import { Pagination } from '../components/common/Pagination';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { NotificationPriority } from '@modules/shared-kernel/notifications/domain/entities/Notification';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import toast from 'react-hot-toast';
import PageShell from '../components/common/PageShell';

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
  const { currentUser } = useAuth();
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
      toast.error('Título e mensagem são obrigatórios');
      return;
    }

    if (form.targetUsers === 'roles' && form.roles.length === 0) {
      toast.error('Selecione pelo menos uma função');
      return;
    }

    if (form.targetUsers === 'specific' && form.userIds.length === 0) {
      toast.error('Selecione pelo menos um usuário');
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

      toast.success(`Notificação enviada para ${notificationCount} usuários com sucesso!`);

      await loggingService.logApi('info', 'Custom notification sent',
        `Title: ${form.title}, Target: ${form.targetUsers}`, currentUser as any);

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
      await loggingService.logApi('error', 'Failed to send notification',
        `Title: ${form.title}, Target: ${form.targetUsers}, Error: ${error}`, currentUser as any);
      toast.error(`Erro ao criar notificação: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
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

  const {
    currentPage,
    pageSize,
    totalItems,
    totalPages,
    paginatedItems,
    setCurrentPage,
    setPageSize,
  } = usePagination(filteredUsers);

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
    <PageShell
      title="Gerenciar Notificações"
      subtitle="Crie e envie notificações personalizadas para os usuários"
      actions={
        <>
          {canCreate && (
                        <button
                          onClick={() => setShowCreateForm(true)}
                          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                        >
                          <span className="mr-2">➕</span>
                          Nova Notificação
                        </button>
                      )}
        </>
      }
    >
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
      
    </PageShell>
  );
};