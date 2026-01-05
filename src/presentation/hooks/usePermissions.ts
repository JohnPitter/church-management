// React Hook - Permission System Integration
// Provides permission checking functionality to React components

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PermissionService } from '../../infrastructure/services/PermissionService';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';

// Singleton instance to share cache across all components
const permissionService = new PermissionService();

interface PermissionState {
  loading: boolean;
  permissions: Map<string, boolean>;
  hasPermission: (module: SystemModule, action: PermissionAction) => boolean;
  hasAnyManagePermission: () => boolean;
  refreshPermissions: () => Promise<void>;
}

export const usePermissions = (): PermissionState => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<Map<string, boolean>>(new Map());
  const loadingRef = useRef(false);
  const hasLoadedRef = useRef(false);

  // Generate permission key for caching
  const getPermissionKey = (module: SystemModule, action: PermissionAction): string => {
    return `${module}_${action}`;
  };

  // Check if user has a specific permission
  const hasPermission = (module: SystemModule, action: PermissionAction): boolean => {
    if (!currentUser) return false;

    const key = getPermissionKey(module, action);
    return permissions.get(key) || false;
  };

  // Check if user has at least one manage permission in any module
  const hasAnyManagePermission = useCallback((): boolean => {
    if (!currentUser) return false;

    // Check all modules for manage permission
    const allModules = Object.values(SystemModule);
    return allModules.some(module => {
      const key = getPermissionKey(module, PermissionAction.Manage);
      return permissions.get(key) === true;
    });
  }, [currentUser, permissions]);

  // Load user permissions (OPTIMIZED - single API call)
  const loadPermissions = useCallback(async (forceReload = false) => {
    if (!currentUser) {
      setPermissions(new Map());
      setLoading(false);
      loadingRef.current = false;
      hasLoadedRef.current = false;
      return;
    }

    // Skip if already loaded and not forcing reload
    if (!forceReload && hasLoadedRef.current) {
      return;
    }

    // Prevent multiple concurrent loads
    if (loadingRef.current && !forceReload) {
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      
      // Use the optimized method that gets ALL permissions in one call
      const permissionMap = await permissionService.getAllUserPermissions(
        currentUser.id,
        currentUser.role
      );
      
      setPermissions(permissionMap);
      hasLoadedRef.current = true;
    } catch (error) {
      console.error('Error loading permissions:', error);
      setPermissions(new Map());
      hasLoadedRef.current = false;
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [currentUser]);

  // Refresh permissions (useful after permission changes)
  const refreshPermissions = useCallback(async () => {
    hasLoadedRef.current = false; // Reset flag so it will reload
    await loadPermissions(true); // Force reload
  }, [loadPermissions]);

  // Load permissions when user changes
  useEffect(() => {
    if (!currentUser?.id || !currentUser?.role) {
      setPermissions(new Map());
      setLoading(false);
      hasLoadedRef.current = false;
      loadingRef.current = false;
      return;
    }
    
    // Reset loaded flag when user changes
    hasLoadedRef.current = false;
    
    // Load permissions for new user - inline to avoid dependency issues
    (async () => {
      if (loadingRef.current) {
        return;
      }

      try {
        loadingRef.current = true;
        setLoading(true);
        
        const permissionMap = await permissionService.getAllUserPermissions(
          currentUser.id,
          currentUser.role
        );
        
        setPermissions(permissionMap);
        hasLoadedRef.current = true;
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions(new Map());
        hasLoadedRef.current = false;
      } finally {
        loadingRef.current = false;
        setLoading(false);
      }
    })();
  }, [currentUser?.id, currentUser?.role]); // Only depend on stable user properties

  return {
    loading,
    permissions,
    hasPermission,
    hasAnyManagePermission,
    refreshPermissions
  };
};

// Helper hooks for common permission checks
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
    canExport: hasPermission(SystemModule.Members, PermissionAction.Export),
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
    canApprove: hasPermission(SystemModule.Blog, PermissionAction.Approve),
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
    canApprove: hasPermission(SystemModule.Projects, PermissionAction.Approve),
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
    canExport: hasPermission(SystemModule.Finance, PermissionAction.Export),
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
    canApprove: hasPermission(SystemModule.Assistance, PermissionAction.Approve),
    loading
  };
};