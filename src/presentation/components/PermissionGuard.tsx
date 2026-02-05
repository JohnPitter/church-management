// Component - Permission Guard
// Wrapper component that shows/hides content based on permissions

import React, { ReactNode } from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';

interface PermissionGuardProps {
  children: React.ReactNode;
  module?: SystemModule;
  action?: PermissionAction;
  fallback?: React.ReactNode;
  requireAll?: boolean;
  permissions?: Array<{ module: SystemModule; action: PermissionAction }>;
}

/**
 * PermissionGuard - Wraps content that requires specific permissions
 * Now uses atomic permission system with real-time updates and caching
 *
 * @example Single permission check
 * <PermissionGuard module={SystemModule.MEMBERS} action={PermissionAction.CREATE}>
 *   <button>Add Member</button>
 * </PermissionGuard>
 *
 * @example Multiple permissions (any)
 * <PermissionGuard
 *   permissions={[
 *     { module: SystemModule.MEMBERS, action: PermissionAction.CREATE },
 *     { module: SystemModule.MEMBERS, action: PermissionAction.UPDATE }
 *   ]}
 * >
 *   <button>Edit or Add Member</button>
 * </PermissionGuard>
 *
 * @example Multiple permissions (all required)
 * <PermissionGuard
 *   requireAll
 *   permissions={[
 *     { module: SystemModule.MEMBERS, action: PermissionAction.VIEW },
 *     { module: SystemModule.FINANCIAL, action: PermissionAction.VIEW }
 *   ]}
 * >
 *   <AdminDashboard />
 * </PermissionGuard>
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action,
  fallback = null,
  requireAll = false,
  permissions
}) => {
  const { hasPermission, hasAnyPermission, hasAllPermissions, loading } = usePermissions();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-4 rounded w-24"></div>
    );
  }

  let hasAccess = false;

  if (permissions && permissions.length > 0) {
    // Multiple permissions check
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else if (module && action) {
    // Single permission check
    hasAccess = hasPermission(module, action);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

// Shortcut components for common permission checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    module={SystemModule.Dashboard} 
    action={PermissionAction.Manage}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageUsers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    module={SystemModule.Users} 
    action={PermissionAction.Manage}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManageMembers: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({ 
  children, 
  fallback = null 
}) => (
  <PermissionGuard 
    module={SystemModule.Members} 
    action={PermissionAction.View}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

export const CanManagePermissions: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback = null
}) => (
  <PermissionGuard
    module={SystemModule.Permissions}
    action={PermissionAction.Manage}
    fallback={fallback}
  >
    {children}
  </PermissionGuard>
);

/**
 * Hook-based alternative for conditional rendering
 *
 * @example
 * const canEdit = usePermissionCheck(SystemModule.MEMBERS, PermissionAction.UPDATE);
 * return canEdit ? <EditButton /> : null;
 */
export const usePermissionCheck = (module: SystemModule, action: PermissionAction): boolean => {
  const { hasPermission } = usePermissions();
  return hasPermission(module, action);
};

/**
 * HOC for protecting entire components
 *
 * @example
 * const ProtectedMemberPage = withPermission(
 *   MemberManagementPage,
 *   SystemModule.MEMBERS,
 *   PermissionAction.VIEW,
 *   <AccessDenied />
 * );
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  module: SystemModule,
  action: PermissionAction,
  fallback?: ReactNode
) {
  return function PermissionWrappedComponent(props: P) {
    return (
      <PermissionGuard module={module} action={action} fallback={fallback}>
        <Component {...props} />
      </PermissionGuard>
    );
  };
}