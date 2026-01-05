// Component - Permission Guard
// Wrapper component that shows/hides content based on permissions

import React from 'react';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';

interface PermissionGuardProps {
  children: React.ReactNode;
  module: SystemModule;
  action: PermissionAction;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  module,
  action,
  fallback = null
}) => {
  const { hasPermission, loading } = usePermissions();

  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-4 rounded w-24"></div>
    );
  }

  if (!hasPermission(module, action)) {
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