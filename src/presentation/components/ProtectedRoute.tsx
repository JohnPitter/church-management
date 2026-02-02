// Presentation Component - Protected Route
// Guards routes that require authentication and permissions

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAtomicPermissions } from '../hooks/useAtomicPermissions';
import { SystemModule, PermissionAction, PermissionManager } from '../../domain/entities/Permission';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // Permission-based props only
  requireModule?: SystemModule;
  requireAction?: PermissionAction;
  // Alternative: multiple permissions (user needs ALL of them)
  requirePermissions?: Array<{ module: SystemModule; action: PermissionAction }>;
  // Special case: admin always has access regardless of permissions
  allowAdminAccess?: boolean;
  // Require at least one manage permission in any module
  requireAnyManagePermission?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireModule,
  requireAction,
  requirePermissions,
  allowAdminAccess = false,
  requireAnyManagePermission = false
}) => {
  const { currentUser, loading, canAccessSystem } = useAuth();
  const { hasPermission, hasAnyPermission, loading: permissionsLoading } = useAtomicPermissions();

  // Helper to check if user has any manage permission
  const hasAnyManagePermission = () => {
    const modules = [
      SystemModule.Users, SystemModule.Members, SystemModule.Events,
      SystemModule.Blog, SystemModule.Finance, SystemModule.Assistance,
      SystemModule.Leadership, SystemModule.Transmissions, SystemModule.Projects,
      SystemModule.Devotionals, SystemModule.Forum, SystemModule.Visitors,
      SystemModule.Notifications, SystemModule.Settings, SystemModule.ONG
    ];
    return modules.some(module => hasPermission(module, PermissionAction.Manage));
  };

  if (loading || permissionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Check if user has system access (is approved)
  if (!canAccessSystem()) {
    return <Navigate to="/pending-approval" />;
  }

  // Special case: Admin always has access to certain pages
  if (allowAdminAccess && currentUser?.role === 'admin') {
    return <>{children}</>;
  }

  // All routes now use permission-based checks only

  // Check if user needs at least one manage permission
  if (requireAnyManagePermission) {
    if (!hasAnyManagePermission()) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full mx-4">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Administrativo Negado</h1>
              <p className="text-gray-600 mb-4">
                Você não tem permissões de gerenciamento necessárias para acessar o painel administrativo.
              </p>

              {/* Permission Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Requisito de Acesso:</h3>
                <p className="text-sm text-blue-700">
                  É necessário ter pelo menos uma permissão de <strong>Gerenciar (Manage)</strong> em qualquer módulo do sistema para acessar o painel administrativo.
                </p>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Entre em contato com o administrador do sistema para solicitar permissões de gerenciamento.
              </p>

              <button
                onClick={() => window.location.href = '/painel'}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Ir para Painel Principal
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check permission-based access
  if (requireModule && requireAction) {
    if (!hasPermission(requireModule, requireAction)) {
      const moduleName = PermissionManager.getModuleLabel(requireModule);
      const actionName = PermissionManager.getActionLabel(requireAction);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full mx-4">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
              <p className="text-gray-600 mb-4">
                Você não tem permissão para acessar esta página.
              </p>

              {/* Permission Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-blue-900 mb-2">Permissão Necessária:</h3>
                <div className="space-y-1">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-blue-800 mr-2">Módulo:</span>
                    <span className="text-blue-600">{moduleName}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-blue-800 mr-2">Ação:</span>
                    <span className="text-blue-600">{actionName}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Entre em contato com o administrador do sistema para solicitar acesso.
              </p>

              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // Check multiple permissions (user needs ALL of them)
  if (requirePermissions && requirePermissions.length > 0) {
    const hasAllPermissions = requirePermissions.every(({ module, action }) =>
      hasPermission(module, action)
    );

    if (!hasAllPermissions) {
      // Get missing permissions
      const missingPermissions = requirePermissions.filter(({ module, action }) =>
        !hasPermission(module, action)
      );

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full mx-4">
            <div className="text-center p-8 bg-white rounded-lg shadow-lg">
              <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h1>
              <p className="text-gray-600 mb-4">
                Você não tem as permissões necessárias para acessar esta página.
              </p>

              {/* Permission Details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="text-sm font-semibold text-blue-900 mb-3">Permissões Necessárias:</h3>
                <div className="space-y-3">
                  {missingPermissions.map(({ module, action }, index) => (
                    <div key={index} className="bg-white rounded p-2 border border-blue-100">
                      <div className="flex items-center text-sm mb-1">
                        <span className="font-medium text-blue-800 mr-2">Módulo:</span>
                        <span className="text-blue-600">{PermissionManager.getModuleLabel(module)}</span>
                      </div>
                      <div className="flex items-center text-sm">
                        <span className="font-medium text-blue-800 mr-2">Ação:</span>
                        <span className="text-blue-600">{PermissionManager.getActionLabel(action)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-xs text-gray-500 mb-4">
                Entre em contato com o administrador do sistema para solicitar acesso.
              </p>

              <button
                onClick={() => window.history.back()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
};