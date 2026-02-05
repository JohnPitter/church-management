// Presentation Hook - Unified Permission System
// Re-exports useAtomicPermissions as the main hook
// Provides helper hooks for common permission checks

import { useAtomicPermissions } from './useAtomicPermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

// Re-export the atomic permissions hook as the main usePermissions
export const usePermissions = useAtomicPermissions;

// Export type for external use
export type { } from './useAtomicPermissions';

// ============================================
// HELPER HOOKS FOR COMMON PERMISSION CHECKS
// ============================================

export const useCanManageUsers = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Users, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Users, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Users, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Users, PermissionAction.Delete),
    canManage: hasPermission(SystemModule.Users, PermissionAction.Manage),
    loading
  };
};

export const useCanManageMembers = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Members, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Members, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Members, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Members, PermissionAction.Delete),
    loading
  };
};

export const useCanManageBlog = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Blog, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Blog, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Blog, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Blog, PermissionAction.Delete),
    loading
  };
};

export const useCanManageEvents = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Events, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Events, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Events, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Events, PermissionAction.Delete),
    canManage: hasPermission(SystemModule.Events, PermissionAction.Manage),
    loading
  };
};

export const useCanManageProjects = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Projects, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Projects, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Projects, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Projects, PermissionAction.Delete),
    loading
  };
};

export const useCanManageFinance = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Finance, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Finance, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Finance, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Finance, PermissionAction.Delete),
    canManage: hasPermission(SystemModule.Finance, PermissionAction.Manage),
    loading
  };
};

export const useCanManagePermissions = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Permissions, PermissionAction.View),
    canUpdate: hasPermission(SystemModule.Permissions, PermissionAction.Update),
    canManage: hasPermission(SystemModule.Permissions, PermissionAction.Manage),
    loading
  };
};

export const useCanAccessDashboard = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Dashboard, PermissionAction.View),
    canManage: hasPermission(SystemModule.Dashboard, PermissionAction.Manage),
    loading
  };
};

export const useCanManageAssistance = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Assistance, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Assistance, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Assistance, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Assistance, PermissionAction.Delete),
    loading
  };
};

export const useCanManageONG = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.ONG, PermissionAction.View),
    canCreate: hasPermission(SystemModule.ONG, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.ONG, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.ONG, PermissionAction.Delete),
    canManage: hasPermission(SystemModule.ONG, PermissionAction.Manage),
    loading
  };
};

export const useCanManageLeadership = () => {
  const { hasPermission, loading } = usePermissions();
  return {
    canView: hasPermission(SystemModule.Leadership, PermissionAction.View),
    canCreate: hasPermission(SystemModule.Leadership, PermissionAction.Create),
    canUpdate: hasPermission(SystemModule.Leadership, PermissionAction.Update),
    canDelete: hasPermission(SystemModule.Leadership, PermissionAction.Delete),
    loading
  };
};
