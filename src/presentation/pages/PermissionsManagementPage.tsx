// Presentation Page - Permissions Management
// Admin interface for managing role permissions and user overrides

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionService, RolePermissionConfig, UserPermissionConfig, CustomRoleConfig } from '@modules/user-management/permissions/application/services/PermissionService';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { PublicPageService } from '@modules/content-management/public-pages/application/services/PublicPageService';
import { 
  SystemModule, 
  PermissionAction, 
  PermissionManager 
} from '../../domain/entities/Permission';
import { 
  PublicPageConfig, 
  PublicPage, 
  PublicPageManager 
} from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';
import { User } from '@/domain/entities/User';
import { CreateRoleModal } from '../components/CreateRoleModal';

export const PermissionsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { refreshPermissions } = usePermissions();
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'custom-roles' | 'public-pages'>('roles');
  const [selectedRole, setSelectedRole] = useState<string>('member');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [rolePermissions, setRolePermissions] = useState<Map<string, Map<SystemModule, PermissionAction[]>>>(new Map());
  const [userOverrides, setUserOverrides] = useState<UserPermissionConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRoleConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFirestoreWarning, setShowFirestoreWarning] = useState(false);
  const [showCreateRoleModal, setShowCreateRoleModal] = useState(false);
  const [createRoleLoading, setCreateRoleLoading] = useState(false);
  const [editingRole, setEditingRole] = useState<CustomRoleConfig | null>(null);
  const [publicPageConfigs, setPublicPageConfigs] = useState<PublicPageConfig[]>([]);

  // Use singleton instances to share cache
  const permissionService = new PermissionService();
  const userRepository = new FirebaseUserRepository();
  const publicPageService = new PublicPageService();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load permission matrix
      const matrix = await permissionService.getPermissionMatrix();
      setRolePermissions(matrix);

      // Load user overrides
      const overrides = await permissionService.getAllUserOverrides();
      setUserOverrides(overrides);

      // Load users
      const allUsers = await userRepository.findAll();
      setUsers(allUsers);

      // Load custom roles
      const customRolesList = await permissionService.getAllCustomRoles();
      setCustomRoles(customRolesList);

      // Load public page configurations
      const publicConfigs = await publicPageService.getPublicPageConfigs();
      setPublicPageConfigs(publicConfigs);
    } catch (error) {
      console.error('Error loading permissions data:', error);
      alert('Erro ao carregar dados de permissões');
    } finally {
      setLoading(false);
    }
  };

  const handleRolePermissionToggle = (role: string, module: SystemModule, action: PermissionAction) => {
    const newMatrix = new Map(rolePermissions);
    const roleMap = newMatrix.get(role) || new Map();
    const actions = roleMap.get(module) || [];
    
    const actionIndex = actions.indexOf(action);
    let newActions: PermissionAction[];
    
    if (actionIndex >= 0) {
      // Remove action
      newActions = actions.filter((a: PermissionAction) => a !== action);
    } else {
      // Add action
      newActions = [...actions, action];
    }
    
    if (newActions.length === 0) {
      roleMap.delete(module);
    } else {
      roleMap.set(module, newActions);
    }
    
    newMatrix.set(role, roleMap);
    setRolePermissions(newMatrix);
  };

  const saveRolePermissions = async (role: string) => {
    setSaving(true);
    try {
      const roleMap = rolePermissions.get(role) || new Map();
      const modules: { module: SystemModule; actions: PermissionAction[] }[] = [];
      
      roleMap.forEach((actions, module) => {
        if (actions.length > 0) {
          modules.push({ module, actions });
        }
      });
      
      await permissionService.updateRolePermissions(
        role,
        modules,
        currentUser?.email || 'Admin'
      );
      
      // Clear service cache and force reload to ensure everything is fresh
      permissionService.clearAllCache();
      
      alert('Permissões da função atualizadas com sucesso! Recarregando página...');
      
      // Force complete page reload
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving role permissions:', error);
      
      // Check if it's a Firestore permission error
      if (error?.message?.includes('permissions') || error?.message?.includes('Firestore')) {
        setShowFirestoreWarning(true);
        alert('Não foi possível salvar as permissões. Configure as regras do Firestore primeiro (veja as instruções abaixo).');
      } else {
        alert('Erro ao salvar permissões da função');
      }
    } finally {
      setSaving(false);
    }
  };

  const resetRoleToDefaults = async (role: string) => {
    if (!window.confirm(`Tem certeza que deseja resetar as permissões de ${permissionService.getRoleDisplayNameSync(role)} para o padrão?`)) {
      return;
    }

    setSaving(true);
    try {
      await permissionService.resetRolePermissionsToDefault(role, currentUser?.email || 'Admin');
      
      // Clear cache and force reload
      permissionService.clearAllCache();
      
      alert('Permissões resetadas com sucesso! Recarregando página...');
      
      // Force complete page reload
      window.location.reload();
    } catch (error) {
      console.error('Error resetting permissions:', error);
      alert('Erro ao resetar permissões');
    } finally {
      setSaving(false);
    }
  };

  const handleUserOverrideToggle = (
    userId: string,
    module: SystemModule,
    action: PermissionAction,
    type: 'grant' | 'revoke'
  ) => {
    const override = userOverrides.find(o => o.userId === userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    let newOverride: UserPermissionConfig;
    
    if (override) {
      newOverride = { ...override };
    } else {
      newOverride = {
        userId,
        userEmail: user.email,
        userName: user.displayName,
        grantedModules: [],
        revokedModules: []
      };
    }
    
    if (type === 'grant') {
      // Toggle grant
      const moduleConfig = newOverride.grantedModules.find(m => m.module === module);
      
      if (moduleConfig) {
        const actionIndex = moduleConfig.actions.indexOf(action);
        if (actionIndex >= 0) {
          moduleConfig.actions = moduleConfig.actions.filter(a => a !== action);
          if (moduleConfig.actions.length === 0) {
            newOverride.grantedModules = newOverride.grantedModules.filter(m => m.module !== module);
          }
        } else {
          moduleConfig.actions.push(action);
        }
      } else {
        newOverride.grantedModules.push({ module, actions: [action] });
      }
      
      // Remove from revoked if exists
      const revokedModule = newOverride.revokedModules.find(m => m.module === module);
      if (revokedModule) {
        revokedModule.actions = revokedModule.actions.filter(a => a !== action);
        if (revokedModule.actions.length === 0) {
          newOverride.revokedModules = newOverride.revokedModules.filter(m => m.module !== module);
        }
      }
    } else {
      // Toggle revoke
      const moduleConfig = newOverride.revokedModules.find(m => m.module === module);
      
      if (moduleConfig) {
        const actionIndex = moduleConfig.actions.indexOf(action);
        if (actionIndex >= 0) {
          moduleConfig.actions = moduleConfig.actions.filter(a => a !== action);
          if (moduleConfig.actions.length === 0) {
            newOverride.revokedModules = newOverride.revokedModules.filter(m => m.module !== module);
          }
        } else {
          moduleConfig.actions.push(action);
        }
      } else {
        newOverride.revokedModules.push({ module, actions: [action] });
      }
      
      // Remove from granted if exists
      const grantedModule = newOverride.grantedModules.find(m => m.module === module);
      if (grantedModule) {
        grantedModule.actions = grantedModule.actions.filter(a => a !== action);
        if (grantedModule.actions.length === 0) {
          newOverride.grantedModules = newOverride.grantedModules.filter(m => m.module !== module);
        }
      }
    }
    
    // Update or add override
    const existingIndex = userOverrides.findIndex(o => o.userId === userId);
    const newOverrides = [...userOverrides];
    
    if (existingIndex >= 0) {
      newOverrides[existingIndex] = newOverride;
    } else {
      newOverrides.push(newOverride);
    }
    
    setUserOverrides(newOverrides);
  };

  const saveUserOverrides = async (userId: string) => {
    const override = userOverrides.find(o => o.userId === userId);
    const user = users.find(u => u.id === userId);
    
    if (!user) return;
    
    setSaving(true);
    try {
      if (override) {
        await permissionService.updateUserPermissionOverrides(
          userId,
          user.email,
          user.displayName,
          override.grantedModules,
          override.revokedModules,
          currentUser?.email || 'Admin'
        );
      } else {
        await permissionService.updateUserPermissionOverrides(
          userId,
          user.email,
          user.displayName,
          [],
          [],
          currentUser?.email || 'Admin'
        );
      }
      
      // Clear service cache and force reload to ensure everything is fresh
      permissionService.clearAllCache();
      
      alert('Permissões do usuário atualizadas com sucesso! Recarregando página...');
      
      // Force complete page reload
      window.location.reload();
    } catch (error) {
      console.error('Error saving user overrides:', error);
      alert('Erro ao salvar permissões do usuário');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateRole = async (roleData: {
    roleName: string;
    displayName: string;
    description: string;
    modules: { module: SystemModule; actions: PermissionAction[] }[];
  }) => {
    setCreateRoleLoading(true);
    try {
      await permissionService.createCustomRole(
        roleData.roleName,
        roleData.displayName,
        roleData.description,
        roleData.modules,
        currentUser?.email || 'Admin'
      );

      alert('Função personalizada criada com sucesso!');
      await loadData(); // Reload data to show new role
      setShowCreateRoleModal(false);
    } catch (error: any) {
      console.error('Error creating custom role:', error);
      const errorMessage = error.message || 'Erro ao criar função personalizada';
      alert(errorMessage);
      throw error; // Re-throw to prevent modal from closing on error
    } finally {
      setCreateRoleLoading(false);
    }
  };

  const handleUpdateRole = async (roleId: string, roleData: {
    displayName: string;
    description: string;
    modules: { module: SystemModule; actions: PermissionAction[] }[];
  }) => {
    setCreateRoleLoading(true);
    try {
      await permissionService.updateCustomRole(
        roleId,
        {
          displayName: roleData.displayName,
          description: roleData.description,
          modules: roleData.modules
        },
        currentUser?.email || 'Admin'
      );

      alert('✓ Função personalizada atualizada com sucesso!');
      await loadData(); // Reload data to show updated role
      await refreshPermissions(); // Refresh user permissions
      setShowCreateRoleModal(false);
      setEditingRole(null);
    } catch (error: any) {
      console.error('Error updating custom role:', error);
      const errorMessage = error.message || 'Erro ao atualizar função personalizada';
      alert(errorMessage);
      throw error; // Re-throw to prevent modal from closing on error
    } finally {
      setCreateRoleLoading(false);
    }
  };

  const getUserPermissionStatus = (
    userId: string,
    userRole: string,
    module: SystemModule,
    action: PermissionAction
  ): 'default' | 'granted' | 'revoked' => {
    const override = userOverrides.find(o => o.userId === userId);
    
    if (override) {
      const granted = override.grantedModules.find(m => m.module === module);
      if (granted && granted.actions.includes(action)) {
        return 'granted';
      }
      
      const revoked = override.revokedModules.find(m => m.module === module);
      if (revoked && revoked.actions.includes(action)) {
        return 'revoked';
      }
    }
    
    return 'default';
  };

  const handlePublicPageToggle = async (page: PublicPage, isPublic: boolean) => {
    try {
      setSaving(true);
      await publicPageService.updatePageVisibility(page, isPublic);
      
      // Update local state
      const updatedConfigs = publicPageConfigs.map(config => 
        config.page === page ? { ...config, isPublic } : config
      );
      setPublicPageConfigs(updatedConfigs);
    } catch (error) {
      console.error('Error updating public page visibility:', error);
      alert('Erro ao atualizar visibilidade da página');
    } finally {
      setSaving(false);
    }
  };

  const handleRegistrationToggle = async (page: PublicPage, allowRegistration: boolean) => {
    try {
      setSaving(true);
      await publicPageService.updatePageRegistrationSetting(page, allowRegistration);
      
      // Update local state
      const updatedConfigs = publicPageConfigs.map(config => 
        config.page === page ? { ...config, allowRegistration } : config
      );
      setPublicPageConfigs(updatedConfigs);
    } catch (error) {
      console.error('Error updating registration setting:', error);
      alert('Erro ao atualizar configuração de registro');
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const modules = PermissionManager.getAllModules();
  const actions = PermissionManager.getAllActions();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
        {/* ONG Integration Notice */}
        <div className="mb-8 bg-indigo-50 border border-indigo-200 rounded-lg p-4">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <span className="text-2xl">🏢</span>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-indigo-800">
                Gestão de ONG Integrada
              </h3>
              <div className="mt-1 text-sm text-indigo-700">
                <p>O módulo de <strong>Gerenciamento ONG</strong> agora está integrado ao painel administrativo. 
                Configure as permissões abaixo para controlar quem pode gerenciar voluntários, atividades, doações e relatórios da ONG.</p>
              </div>
              <div className="mt-3">
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    👥 Voluntários
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    📅 Atividades
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    💝 Doações
                  </span>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    📊 Relatórios
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('roles')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'roles'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">🔐</span>
              Permissões por Função
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">👤</span>
              Permissões por Usuário
            </button>
            <button
              onClick={() => setActiveTab('custom-roles')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'custom-roles'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">🏷️</span>
              Funções Personalizadas
            </button>
            <button
              onClick={() => setActiveTab('public-pages')}
              className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'public-pages'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2 text-lg">🌐</span>
              Páginas Públicas
            </button>
          </nav>
        </div>
        {/* Firestore Warning Banner */}
        {showFirestoreWarning && (
          <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-yellow-800">
                  Configuração do Firestore Necessária
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Para salvar permissões personalizadas, você precisa configurar as regras do Firestore:</p>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Acesse o <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="underline font-medium">Firebase Console</a></li>
                    <li>Vá para Firestore Database → Rules</li>
                    <li>Adicione as regras do arquivo <code className="bg-yellow-100 px-1 rounded">SETUP_PERMISSIONS.md</code></li>
                    <li>Clique em "Publish" para aplicar as regras</li>
                  </ol>
                  <p className="mt-2 font-medium">Nota: O sistema está funcionando com permissões padrão até que as regras sejam configuradas.</p>
                </div>
              </div>
              <div className="ml-3">
                <button
                  onClick={() => setShowFirestoreWarning(false)}
                  className="text-yellow-400 hover:text-yellow-500"
                >
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
        {/* Role Permissions Tab */}
        {activeTab === 'roles' && (
          <div className="space-y-6">
            {/* Role Selector */}
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Selecionar Função</h3>
              <div className="flex flex-wrap gap-2">
                {permissionService.getAllRolesSync().map(role => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
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

            {/* Permissions Matrix */}
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  Permissões: {permissionService.getRoleDisplayNameSync(selectedRole)}
                </h3>
                <div className="flex space-x-3">
                  <button
                    onClick={() => resetRoleToDefaults(selectedRole)}
                    disabled={saving}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Resetar Padrão
                  </button>
                  <button
                    onClick={() => saveRolePermissions(selectedRole)}
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
                        <th key={action} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {PermissionManager.getActionLabel(action)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {modules.map(module => {
                      const roleMap = rolePermissions.get(selectedRole) || new Map();
                      const moduleActions = roleMap.get(module) || [];
                      
                      return (
                        <tr key={module} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            <div className="flex items-center">
                              <span className="mr-2 text-base">
                                {module === SystemModule.Dashboard ? '🏠' :
                                 module === SystemModule.Users ? '👥' :
                                 module === SystemModule.Members ? '👤' :
                                 module === SystemModule.Blog ? '✍️' :
                                 module === SystemModule.Events ? '📅' :
                                 module === SystemModule.Devotionals ? '📖' :
                                 module === SystemModule.Transmissions ? '📺' :
                                 module === SystemModule.Projects ? '🎯' :
                                 module === SystemModule.Forum ? '💬' :
                                 module === SystemModule.Visitors ? '🚪' :
                                 module === SystemModule.Calendar ? '📆' :
                                 module === SystemModule.Assistance ? '🩺' :
                                 module === SystemModule.Assistidos ? '🤝' :
                                 module === SystemModule.Notifications ? '🔔' :
                                 module === SystemModule.Communication ? '📢' :
                                 module === SystemModule.ONG ? '🏢' :
                                 module === SystemModule.Finance ? '💰' :
                                 module === SystemModule.Donations ? '🎁' :
                                 module === SystemModule.Reports ? '📊' :
                                 module === SystemModule.Settings ? '⚙️' :
                                 module === SystemModule.Permissions ? '🔐' :
                                 module === SystemModule.Audit ? '📋' :
                                 module === SystemModule.Backup ? '💾' :
                                 module === SystemModule.HomeBuilder ? '🏗️' : '📄'}
                              </span>
                              {PermissionManager.getModuleLabel(module)}
                            </div>
                          </td>
                          {actions.map(action => (
                            <td key={action} className="px-3 py-4 text-center">
                              <input
                                type="checkbox"
                                checked={moduleActions.includes(action)}
                                onChange={() => handleRolePermissionToggle(selectedRole, module, action)}
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
        )}

        {/* User Permissions Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User Search */}
            <div className="bg-white rounded-lg shadow p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Buscar Usuário
                  </label>
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Nome ou email..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Selecionar Usuário
                  </label>
                  <select
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Selecione um usuário...</option>
                    {filteredUsers.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.displayName} ({user.email}) - {permissionService.getRoleDisplayNameSync(user.role)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* User Permissions Matrix */}
            {selectedUserId && (
              <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      Permissões Personalizadas
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {users.find(u => u.id === selectedUserId)?.displayName} - 
                      Função: {permissionService.getRoleDisplayNameSync(users.find(u => u.id === selectedUserId)?.role || '')}
                    </p>
                  </div>
                  <button
                    onClick={() => saveUserOverrides(selectedUserId)}
                    disabled={saving}
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>

                <div className="p-4 bg-yellow-50 border-b border-yellow-200">
                  <div className="flex items-start">
                    <svg className="h-5 w-5 text-yellow-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        <strong>Legenda:</strong> ✅ Concedido (override) | ❌ Revogado (override) | ⬜ Padrão da função
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
                          <th key={action} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {PermissionManager.getActionLabel(action)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {modules.map(module => {
                        const selectedUser = users.find(u => u.id === selectedUserId);
                        const userRole = selectedUser?.role || 'member';
                        
                        return (
                          <tr key={module} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              <div className="flex items-center">
                                <span className="mr-2 text-base">
                                  {module === SystemModule.ONG ? '🏢' : 
                                   module === SystemModule.Users ? '👥' :
                                   module === SystemModule.Members ? '👤' :
                                   module === SystemModule.Blog ? '✍️' :
                                   module === SystemModule.Events ? '📅' :
                                   module === SystemModule.Devotionals ? '📖' :
                                   module === SystemModule.Transmissions ? '📺' :
                                   module === SystemModule.Projects ? '🎯' :
                                   module === SystemModule.Forum ? '💬' :
                                   module === SystemModule.Visitors ? '🚪' :
                                   module === SystemModule.Calendar ? '📅' :
                                   module === SystemModule.Assistance ? '🩺' :
                                   module === SystemModule.Assistidos ? '🤝' :
                                   module === SystemModule.Notifications ? '🔔' :
                                   module === SystemModule.Finance ? '💰' :
                                   module === SystemModule.Reports ? '📊' :
                                   module === SystemModule.Settings ? '⚙️' :
                                   module === SystemModule.Dashboard ? '🏠' :
                                   module === SystemModule.Audit ? '📋' :
                                   module === SystemModule.Backup ? '💾' :
                                   module === SystemModule.Permissions ? '🔐' : '📄'}
                                </span>
                                {PermissionManager.getModuleLabel(module)}
                              </div>
                            </td>
                            {actions.map(action => {
                              const status = getUserPermissionStatus(selectedUserId, userRole, module, action);
                              const hasDefaultPermission = PermissionManager.hasPermission(userRole, module, action);
                              
                              return (
                                <td key={action} className="px-3 py-4 text-center">
                                  <div className="flex justify-center space-x-1">
                                    <button
                                      onClick={() => handleUserOverrideToggle(selectedUserId, module, action, 'grant')}
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
                                      onClick={() => handleUserOverrideToggle(selectedUserId, module, action, 'revoke')}
                                      className={`p-1 rounded ${
                                        status === 'revoked'
                                          ? 'bg-red-100 text-red-600'
                                          : 'bg-gray-100 text-gray-400 hover:bg-red-50 hover:text-red-500'
                                      }`}
                                      title="Revogar"
                                    >
                                      ❌
                                    </button>
                                    <span className={`p-1 rounded ${
                                      hasDefaultPermission ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'
                                    }`}>
                                      ⬜
                                    </span>
                                  </div>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Roles Tab */}
        {activeTab === 'custom-roles' && (
          <div className="space-y-6">
            {/* Create Role Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Funções Personalizadas</h2>
              <button
                onClick={() => setShowCreateRoleModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Criar Nova Função</span>
              </button>
            </div>

            {/* Custom Roles List */}
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
                      onClick={() => setShowCreateRoleModal(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                    >
                      <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Criar Primeira Função
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="px-4 py-5 sm:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {customRoles
                        .filter(role => role.isActive)
                        .map((role) => (
                        <div
                          key={role.roleId}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-2xl">🏷️</span>
                                <h3 className="text-lg font-medium text-gray-900">
                                  {role.displayName}
                                </h3>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {role.description}
                              </p>
                              <div className="flex items-center gap-3 mt-2">
                                <p className="text-xs text-gray-500">
                                  ID: <code className="bg-gray-100 px-1 rounded">{role.roleId}</code>
                                </p>
                                <p className="text-xs text-gray-500">
                                  Criado por: {role.createdBy}
                                </p>
                              </div>
                            </div>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              ✓ Ativa
                            </span>
                          </div>

                          <div className="mt-4 bg-white border border-gray-200 rounded-lg p-3">
                            <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                              <svg className="w-4 h-4 mr-1 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                              </svg>
                              Permissões ({role.modules.length} módulos)
                            </h4>
                            <div className="space-y-2 max-h-32 overflow-y-auto">
                              {role.modules.map((moduleConfig) => (
                                <div key={moduleConfig.module} className="flex items-start gap-2 text-xs">
                                  <span className="inline-block w-2 h-2 mt-1 bg-indigo-500 rounded-full flex-shrink-0"></span>
                                  <div>
                                    <span className="font-medium text-gray-800">
                                      {PermissionManager.getModuleLabel(moduleConfig.module)}
                                    </span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {moduleConfig.actions.map(action => (
                                        <span key={action} className="inline-flex items-center px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
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
                              onClick={() => {
                                setEditingRole(role);
                                setShowCreateRoleModal(true);
                              }}
                              disabled={saving}
                              className="flex-1 flex items-center justify-center gap-2 text-sm bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2.5 rounded-md transition-colors border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                if (window.confirm(`⚠️ Tem certeza que deseja desativar a função "${role.displayName}"?\n\nUsuários com esta função perderão suas permissões associadas.`)) {
                                  try {
                                    setSaving(true);
                                    await permissionService.deleteCustomRole(role.roleId);
                                    await loadData();
                                    await refreshPermissions();
                                    alert('✓ Função desativada com sucesso!');
                                  } catch (error) {
                                    console.error('Error deactivating role:', error);
                                    alert('❌ Erro ao desativar função');
                                  } finally {
                                    setSaving(false);
                                  }
                                }
                              }}
                              disabled={saving}
                              className="flex-1 flex items-center justify-center gap-2 text-sm bg-red-50 text-red-700 hover:bg-red-100 px-3 py-2.5 rounded-md transition-colors border border-red-200 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                              {saving ? 'Desativando...' : 'Desativar'}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Public Pages Tab */}
        {activeTab === 'public-pages' && (
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
                    {publicPageConfigs.map((config) => (
                      <tr key={config.page} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <span className="text-2xl mr-3">
                              {config.page === PublicPage.Home && '🏠'}
                              {config.page === PublicPage.Events && '📅'}
                              {config.page === PublicPage.Blog && '📝'}
                              {config.page === PublicPage.Projects && '🎯'}
                              {config.page === PublicPage.Devotionals && '📖'}
                              {config.page === PublicPage.Forum && '💬'}
                              {config.page === PublicPage.Live && '📺'}
                            </span>
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
                              onChange={(e) => handlePublicPageToggle(config.page, e.target.checked)}
                              disabled={saving || config.page === PublicPage.Home} // Home sempre público
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
                                onChange={(e) => handleRegistrationToggle(config.page, e.target.checked)}
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

            {/* Info Box for Public Pages */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-start">
                <svg className="h-6 w-6 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Como funciona o acesso público</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <ul className="list-disc list-inside space-y-1">
                      <li><strong>Acesso Público:</strong> Permite que usuários não logados visualizem a página</li>
                      <li><strong>Registro Anônimo:</strong> Permite que usuários não logados se inscrevam em eventos ou participem de fóruns</li>
                      <li><strong>Página Inicial:</strong> Sempre pública para permitir acesso aos formulários de login e registro</li>
                      <li><strong>Segurança:</strong> Mesmo com acesso público, dados sensíveis permanecem protegidos</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Create Role Modal */}
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

        {/* Info Box */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <div className="flex items-start">
            <svg className="h-6 w-6 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Como funciona o sistema de permissões</h3>
              <div className="mt-2 text-sm text-blue-700">
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Permissões por Função:</strong> Define as permissões padrão para todos os usuários de uma função</li>
                  <li><strong>Permissões por Usuário:</strong> Permite conceder ou revogar permissões específicas para usuários individuais</li>
                  <li><strong>Funções Personalizadas:</strong> Crie funções específicas para sua organização com permissões customizadas</li>
                  <li><strong>Páginas Públicas:</strong> Configure quais páginas podem ser acessadas por usuários não logados</li>
                  <li><strong>Prioridade:</strong> Permissões de usuário têm prioridade sobre permissões de função</li>
                  <li><strong>Conceder:</strong> Adiciona uma permissão mesmo que a função não a tenha</li>
                  <li><strong>Revogar:</strong> Remove uma permissão mesmo que a função a tenha</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};