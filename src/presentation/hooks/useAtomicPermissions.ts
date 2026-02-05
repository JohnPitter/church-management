// Presentation Hook - Atomic Permissions Hook
// React hook for atomic permission checking with real-time updates
//
// @deprecated Use `usePermissions` from './usePermissions' instead.
// This hook is re-exported as usePermissions for backwards compatibility.
// All new code should import from usePermissions directly.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { atomicPermissionService } from '@modules/user-management/permissions/infrastructure/services/AtomicPermissionService';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

interface UseAtomicPermissionsReturn {
  hasPermission: (module: SystemModule, action: PermissionAction) => boolean;
  hasAnyPermission: (checks: Array<{ module: SystemModule; action: PermissionAction }>) => boolean;
  hasAllPermissions: (checks: Array<{ module: SystemModule; action: PermissionAction }>) => boolean;
  checkPermission: (module: SystemModule, action: PermissionAction) => Promise<boolean>;
  isAdmin: boolean;
  isSecretary: boolean;
  isLeader: boolean;
  isMember: boolean;
  loading: boolean;
  permissions: Map<SystemModule, Set<PermissionAction>>;
  refreshPermissions: () => Promise<void>;
}

export const useAtomicPermissions = (): UseAtomicPermissionsReturn => {
  const { currentUser } = useAuth();
  const [permissions, setPermissions] = useState<Map<SystemModule, Set<PermissionAction>>>(new Map());
  const [loading, setLoading] = useState(true);

  // Load permissions on mount and when user changes
  useEffect(() => {
    if (!currentUser?.id) {
      setPermissions(new Map());
      setLoading(false);
      return;
    }

    const loadPermissions = async () => {
      setLoading(true);
      try {
        const userPerms = await atomicPermissionService.getUserPermissions(currentUser.id);
        setPermissions(userPerms);
      } catch (error) {
        console.error('Error loading permissions:', error);
        setPermissions(new Map());
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();

    // Subscribe to real-time updates
    atomicPermissionService.subscribeToUserPermissions(currentUser.id, loadPermissions);

    // Cleanup subscription on unmount
    return () => {
      if (currentUser?.id) {
        atomicPermissionService.unsubscribeFromUser(currentUser.id);
      }
    };
  }, [currentUser?.id]);

  // Synchronous permission check (uses cached permissions)
  const hasPermission = useCallback((module: SystemModule, action: PermissionAction): boolean => {
    const modulePerms = permissions.get(module);
    return modulePerms?.has(action) ?? false;
  }, [permissions]);

  // Check if user has ANY of the specified permissions (synchronous)
  const hasAnyPermission = useCallback((checks: Array<{ module: SystemModule; action: PermissionAction }>): boolean => {
    return checks.some(check => hasPermission(check.module, check.action));
  }, [hasPermission]);

  // Check if user has ALL of the specified permissions (synchronous)
  const hasAllPermissions = useCallback((checks: Array<{ module: SystemModule; action: PermissionAction }>): boolean => {
    return checks.every(check => hasPermission(check.module, check.action));
  }, [hasPermission]);

  // Asynchronous permission check (validates with Firebase)
  const checkPermission = useCallback(async (module: SystemModule, action: PermissionAction): Promise<boolean> => {
    if (!currentUser?.id) return false;
    return await atomicPermissionService.hasPermission(currentUser.id, module, action);
  }, [currentUser?.id]);

  // Refresh permissions manually
  const refreshPermissions = useCallback(async () => {
    if (!currentUser?.id) return;

    setLoading(true);
    try {
      atomicPermissionService.invalidateCache(currentUser.id);
      const userPerms = await atomicPermissionService.getUserPermissions(currentUser.id);
      setPermissions(userPerms);
    } catch (error) {
      console.error('Error refreshing permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  // Role checks (memoized)
  const isAdmin = useMemo(() => currentUser?.role === 'admin', [currentUser?.role]);
  const isSecretary = useMemo(() => currentUser?.role === 'secretary', [currentUser?.role]);
  const isLeader = useMemo(() => currentUser?.role === 'leader', [currentUser?.role]);
  const isMember = useMemo(() => currentUser?.role === 'member', [currentUser?.role]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    checkPermission,
    isAdmin,
    isSecretary,
    isLeader,
    isMember,
    loading,
    permissions,
    refreshPermissions
  };
};
