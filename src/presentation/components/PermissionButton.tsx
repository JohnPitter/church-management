// Presentation Component - Permission Button
// Button component that shows access denied modal when clicked without proper permissions

import React, { useState } from 'react';
import { SystemModule, PermissionAction } from '../../domain/entities/Permission';
import { usePermissions } from '../hooks/usePermissions';
import { PermissionManager } from '../../domain/entities/Permission';

interface PermissionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  requireModule: SystemModule;
  requireAction: PermissionAction;
  fallbackMessage?: string;
  onUnauthorizedClick?: () => void;
  children: React.ReactNode;
}

export const PermissionButton: React.FC<PermissionButtonProps> = ({
  requireModule,
  requireAction,
  fallbackMessage,
  onUnauthorizedClick,
  children,
  onClick,
  className = '',
  ...buttonProps
}) => {
  const { hasPermission } = usePermissions();
  const [showModal, setShowModal] = useState(false);

  const hasRequiredPermission = hasPermission(requireModule, requireAction);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (hasRequiredPermission) {
      // User has permission, execute the original onClick
      if (onClick) {
        onClick(e);
      }
    } else {
      // User doesn't have permission, show modal or custom handler
      e.preventDefault();
      e.stopPropagation();
      
      if (onUnauthorizedClick) {
        onUnauthorizedClick();
      } else {
        setShowModal(true);
      }
    }
  };

  return (
    <>
      <button
        {...buttonProps}
        onClick={handleClick}
        className={`${className} ${!hasRequiredPermission ? 'opacity-75' : ''}`}
      >
        {children}
      </button>
      
      {/* Access Denied Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 text-center mb-2">
              Acesso Negado
            </h2>
            
            <p className="text-gray-600 text-center mb-4">
              {fallbackMessage || `Você não tem permissão para realizar esta ação. É necessário ter a permissão "${PermissionManager.getActionLabel(requireAction)}" no módulo "${PermissionManager.getModuleLabel(requireModule)}".`}
            </p>
            
            <div className="flex justify-center">
              <button
                onClick={() => setShowModal(false)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
              >
                Entendi
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};