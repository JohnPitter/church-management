import { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  UserPermissionConfig,
  CustomRoleConfig,
  permissionService
} from '@modules/user-management/permissions/application/services/PermissionService';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { PublicPageService } from '@modules/content-management/public-pages/application/services/PublicPageService';
import {
  SystemModule,
  PermissionAction
} from '../../../domain/entities/Permission';
import {
  PublicPageConfig,
  PublicPage
} from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';
import { User } from '@/domain/entities/User';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import {
  cloneRoleMatrix,
  removeActionFromModuleList,
  RolePermissionsMatrix,
  toggleActionInModuleList
} from './utils';

interface UsePermissionsDataParams {
  currentUserEmail: string | undefined;
  currentUser: unknown;
  refreshPermissions: () => Promise<void>;
}

export interface UsePermissionsDataResult {
  loading: boolean;
  saving: boolean;
  showFirestoreWarning: boolean;
  dismissFirestoreWarning: () => void;

  rolePermissions: RolePermissionsMatrix;
  userOverrides: UserPermissionConfig[];
  users: User[];
  customRoles: CustomRoleConfig[];
  publicPageConfigs: PublicPageConfig[];

  reload: () => Promise<void>;
  handleRolePermissionToggle: (role: string, module: SystemModule, action: PermissionAction) => void;
  saveRolePermissions: (role: string) => Promise<void>;
  resetRolePermissions: (role: string, roleDisplayName: string) => Promise<boolean>;
  handleUserOverrideToggle: (
    userId: string,
    module: SystemModule,
    action: PermissionAction,
    type: 'grant' | 'revoke'
  ) => void;
  saveUserOverrides: (userId: string) => Promise<void>;
  getUserPermissionStatus: (
    userId: string,
    module: SystemModule,
    action: PermissionAction
  ) => 'default' | 'granted' | 'revoked';
  createCustomRole: (roleData: {
    roleName: string;
    displayName: string;
    description: string;
    modules: { module: SystemModule; actions: PermissionAction[] }[];
  }) => Promise<void>;
  updateCustomRole: (
    roleId: string,
    roleData: {
      displayName: string;
      description: string;
      modules: { module: SystemModule; actions: PermissionAction[] }[];
    }
  ) => Promise<void>;
  deleteCustomRole: (role: CustomRoleConfig) => Promise<void>;
  togglePublicPage: (page: PublicPage, isPublic: boolean) => Promise<void>;
  toggleRegistration: (page: PublicPage, allowRegistration: boolean) => Promise<void>;
}

const ADMIN_FALLBACK = 'Admin';

export const usePermissionsData = ({
  currentUserEmail,
  currentUser,
  refreshPermissions
}: UsePermissionsDataParams): UsePermissionsDataResult => {
  const userRepository = useMemo(() => new FirebaseUserRepository(), []);
  const publicPageService = useMemo(() => new PublicPageService(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showFirestoreWarning, setShowFirestoreWarning] = useState(false);
  const [rolePermissions, setRolePermissions] = useState<RolePermissionsMatrix>(new Map());
  const [userOverrides, setUserOverrides] = useState<UserPermissionConfig[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [customRoles, setCustomRoles] = useState<CustomRoleConfig[]>([]);
  const [publicPageConfigs, setPublicPageConfigs] = useState<PublicPageConfig[]>([]);

  const actor = currentUserEmail || ADMIN_FALLBACK;

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const [matrix, overrides, allUsers, customRolesList, publicConfigs] = await Promise.all([
        permissionService.getPermissionMatrix(),
        permissionService.getAllUserOverrides(),
        userRepository.findAll(),
        permissionService.getAllCustomRoles(),
        publicPageService.getPublicPageConfigs()
      ]);
      setRolePermissions(matrix);
      setUserOverrides(overrides);
      setUsers(allUsers);
      setCustomRoles(customRolesList);
      setPublicPageConfigs(publicConfigs);
    } catch (error) {
      console.error('Error loading permissions data:', error);
      toast.error('Erro ao carregar dados de permissoes');
    } finally {
      setLoading(false);
    }
  }, [userRepository, publicPageService]);

  useEffect(() => {
    reload();
  }, [reload]);

  const handleRolePermissionToggle = useCallback(
    (role: string, module: SystemModule, action: PermissionAction) => {
      setRolePermissions(prev => {
        const next = cloneRoleMatrix(prev);
        const roleMap = next.get(role) ?? new Map<SystemModule, PermissionAction[]>();
        const actions = roleMap.get(module) ?? [];
        const newActions = actions.includes(action)
          ? actions.filter(a => a !== action)
          : [...actions, action];
        if (newActions.length === 0) {
          roleMap.delete(module);
        } else {
          roleMap.set(module, newActions);
        }
        next.set(role, roleMap);
        return next;
      });
    },
    []
  );

  const saveRolePermissions = useCallback(
    async (role: string) => {
      setSaving(true);
      try {
        const roleMap = rolePermissions.get(role) || new Map();
        const modules: { module: SystemModule; actions: PermissionAction[] }[] = [];
        roleMap.forEach((actions, module) => {
          if (actions.length > 0) modules.push({ module, actions });
        });

        await permissionService.updateRolePermissions(role, modules, actor);
        permissionService.clearAllCache();
        await refreshPermissions();
        await reload();
        await loggingService.logSecurity(
          'info',
          'Role permissions updated',
          `Role: ${role}, Modules: ${modules.length}`,
          currentUser as any
        );
        toast.success('Permissoes da funcao atualizadas com sucesso!');
      } catch (error: any) {
        console.error('Error saving role permissions:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to update role permissions',
          `Role: ${role}, Error: ${error}`,
          currentUser as any
        );
        if (error?.message?.includes('permissions') || error?.message?.includes('Firestore')) {
          setShowFirestoreWarning(true);
          toast.error(
            'Nao foi possivel salvar as permissoes. Configure as regras do Firestore primeiro (veja as instrucoes abaixo).'
          );
        } else {
          toast.error('Erro ao salvar permissoes da funcao');
        }
      } finally {
        setSaving(false);
      }
    },
    [rolePermissions, actor, currentUser, refreshPermissions, reload]
  );

  const resetRolePermissions = useCallback(
    async (role: string, _roleDisplayName: string) => {
      setSaving(true);
      try {
        await permissionService.resetRolePermissionsToDefault(role, actor);
        permissionService.clearAllCache();
        await refreshPermissions();
        await reload();
        await loggingService.logSecurity(
          'warning',
          'Role permissions reset to defaults',
          `Role: ${role}`,
          currentUser as any
        );
        toast.success('Permissoes resetadas com sucesso!');
        return true;
      } catch (error) {
        console.error('Error resetting permissions:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to reset role permissions',
          `Role: ${role}, Error: ${error}`,
          currentUser as any
        );
        toast.error('Erro ao resetar permissoes');
        return false;
      } finally {
        setSaving(false);
      }
    },
    [actor, currentUser, refreshPermissions, reload]
  );

  const handleUserOverrideToggle = useCallback(
    (userId: string, module: SystemModule, action: PermissionAction, type: 'grant' | 'revoke') => {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      setUserOverrides(prev => {
        const existing = prev.find(o => o.userId === userId);
        const base: UserPermissionConfig = existing ?? {
          userId,
          userEmail: user.email,
          userName: user.displayName,
          grantedModules: [],
          revokedModules: []
        };
        const updated: UserPermissionConfig =
          type === 'grant'
            ? {
                ...base,
                grantedModules: toggleActionInModuleList(base.grantedModules, module, action),
                revokedModules: removeActionFromModuleList(base.revokedModules, module, action)
              }
            : {
                ...base,
                revokedModules: toggleActionInModuleList(base.revokedModules, module, action),
                grantedModules: removeActionFromModuleList(base.grantedModules, module, action)
              };

        const existingIndex = prev.findIndex(o => o.userId === userId);
        return existingIndex >= 0
          ? prev.map((o, i) => (i === existingIndex ? updated : o))
          : [...prev, updated];
      });
    },
    [users]
  );

  const saveUserOverrides = useCallback(
    async (userId: string) => {
      const override = userOverrides.find(o => o.userId === userId);
      const user = users.find(u => u.id === userId);
      if (!user) return;

      setSaving(true);
      try {
        await permissionService.updateUserPermissionOverrides(
          userId,
          user.email,
          user.displayName,
          override?.grantedModules ?? [],
          override?.revokedModules ?? [],
          actor
        );
        permissionService.clearAllCache();
        await refreshPermissions();
        await reload();
        await loggingService.logSecurity(
          'info',
          'User permission overrides updated',
          `User: "${user.email}", Granted: ${override?.grantedModules.length || 0}, Revoked: ${override?.revokedModules.length || 0}`,
          currentUser as any
        );
        toast.success('Permissoes do usuario atualizadas com sucesso!');
      } catch (error) {
        console.error('Error saving user overrides:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to update user permission overrides',
          `User: "${user.email}", Error: ${error}`,
          currentUser as any
        );
        toast.error('Erro ao salvar permissoes do usuario');
      } finally {
        setSaving(false);
      }
    },
    [userOverrides, users, actor, currentUser, refreshPermissions, reload]
  );

  const getUserPermissionStatus = useCallback(
    (userId: string, module: SystemModule, action: PermissionAction): 'default' | 'granted' | 'revoked' => {
      const override = userOverrides.find(o => o.userId === userId);
      if (!override) return 'default';
      const granted = override.grantedModules.find(m => m.module === module);
      if (granted && granted.actions.includes(action)) return 'granted';
      const revoked = override.revokedModules.find(m => m.module === module);
      if (revoked && revoked.actions.includes(action)) return 'revoked';
      return 'default';
    },
    [userOverrides]
  );

  const createCustomRole = useCallback(
    async (roleData: {
      roleName: string;
      displayName: string;
      description: string;
      modules: { module: SystemModule; actions: PermissionAction[] }[];
    }) => {
      try {
        await permissionService.createCustomRole(
          roleData.roleName,
          roleData.displayName,
          roleData.description,
          roleData.modules,
          actor
        );
        await loggingService.logSecurity(
          'info',
          'Custom role created',
          `Role: "${roleData.displayName}" (${roleData.roleName}), Modules: ${roleData.modules.length}`,
          currentUser as any
        );
        toast.success('Funcao personalizada criada com sucesso!');
        await reload();
      } catch (error: any) {
        console.error('Error creating custom role:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to create custom role',
          `Role: "${roleData.roleName}", Error: ${error}`,
          currentUser as any
        );
        const errorMessage = error.message || 'Erro ao criar funcao personalizada';
        toast.error(errorMessage);
        throw error;
      }
    },
    [actor, currentUser, reload]
  );

  const updateCustomRole = useCallback(
    async (
      roleId: string,
      roleData: {
        displayName: string;
        description: string;
        modules: { module: SystemModule; actions: PermissionAction[] }[];
      }
    ) => {
      try {
        await permissionService.updateCustomRole(
          roleId,
          {
            displayName: roleData.displayName,
            description: roleData.description,
            modules: roleData.modules
          },
          actor
        );
        await loggingService.logSecurity(
          'info',
          'Custom role updated',
          `Role: "${roleData.displayName}" (${roleId}), Modules: ${roleData.modules.length}`,
          currentUser as any
        );
        toast.success('Funcao personalizada atualizada com sucesso!');
        await reload();
        await refreshPermissions();
      } catch (error: any) {
        console.error('Error updating custom role:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to update custom role',
          `Role ID: ${roleId}, Error: ${error}`,
          currentUser as any
        );
        const errorMessage = error.message || 'Erro ao atualizar funcao personalizada';
        toast.error(errorMessage);
        throw error;
      }
    },
    [actor, currentUser, refreshPermissions, reload]
  );

  const deleteCustomRole = useCallback(
    async (role: CustomRoleConfig) => {
      setSaving(true);
      try {
        await permissionService.deleteCustomRole(role.roleId);
        await loggingService.logSecurity(
          'warning',
          'Custom role deleted',
          `Role: "${role.displayName}" (${role.roleId})`,
          currentUser as any
        );
        await reload();
        await refreshPermissions();
        toast.success('Funcao desativada com sucesso!');
      } catch (error) {
        console.error('Error deactivating role:', error);
        toast.error('Erro ao desativar funcao');
      } finally {
        setSaving(false);
      }
    },
    [currentUser, refreshPermissions, reload]
  );

  const togglePublicPage = useCallback(
    async (page: PublicPage, isPublic: boolean) => {
      setSaving(true);
      try {
        await publicPageService.updatePageVisibility(page, isPublic);
        setPublicPageConfigs(prev =>
          prev.map(config => (config.page === page ? { ...config, isPublic } : config))
        );
        await loggingService.logSecurity(
          'info',
          'Public page visibility changed',
          `Page: ${page}, Public: ${isPublic}`,
          currentUser as any
        );
      } catch (error) {
        console.error('Error updating public page visibility:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to update public page visibility',
          `Page: ${page}, Error: ${error}`,
          currentUser as any
        );
        toast.error('Erro ao atualizar visibilidade da pagina');
      } finally {
        setSaving(false);
      }
    },
    [publicPageService, currentUser]
  );

  const toggleRegistration = useCallback(
    async (page: PublicPage, allowRegistration: boolean) => {
      setSaving(true);
      try {
        await publicPageService.updatePageRegistrationSetting(page, allowRegistration);
        setPublicPageConfigs(prev =>
          prev.map(config => (config.page === page ? { ...config, allowRegistration } : config))
        );
        await loggingService.logSecurity(
          'info',
          'Page registration setting changed',
          `Page: ${page}, Allow registration: ${allowRegistration}`,
          currentUser as any
        );
      } catch (error) {
        console.error('Error updating registration setting:', error);
        await loggingService.logSecurity(
          'error',
          'Failed to update page registration setting',
          `Page: ${page}, Error: ${error}`,
          currentUser as any
        );
        toast.error('Erro ao atualizar configuracao de registro');
      } finally {
        setSaving(false);
      }
    },
    [publicPageService, currentUser]
  );

  const dismissFirestoreWarning = useCallback(() => setShowFirestoreWarning(false), []);

  return {
    loading,
    saving,
    showFirestoreWarning,
    dismissFirestoreWarning,
    rolePermissions,
    userOverrides,
    users,
    customRoles,
    publicPageConfigs,
    reload,
    handleRolePermissionToggle,
    saveRolePermissions,
    resetRolePermissions,
    handleUserOverrideToggle,
    saveUserOverrides,
    getUserPermissionStatus,
    createCustomRole,
    updateCustomRole,
    deleteCustomRole,
    togglePublicPage,
    toggleRegistration
  };
};
