// Component - Permission Guard
// Wrapper component that shows/hides content based on permissions

import React from 'react';
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
    hasAccess = requireAll
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions);
  } else if (module && action) {
    hasAccess = hasPermission(module, action);
  }

  if (!hasAccess) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};
