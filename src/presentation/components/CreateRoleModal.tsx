// Create Role Modal - Interface para criar/editar funções personalizadas
// Permite criar novas funções ou editar funções existentes com permissões específicas

import React, { useState, useEffect } from 'react';
import { SystemModule, PermissionAction, PermissionManager } from '../../domain/entities/Permission';
import { CustomRoleConfig } from '@modules/user-management/permissions/application/services/PermissionService';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRole: (roleData: {
    roleName: string;
    displayName: string;
    description: string;
    modules: { module: SystemModule; actions: PermissionAction[] }[];
  }) => Promise<void>;
  onUpdateRole?: (roleId: string, roleData: {
    displayName: string;
    description: string;
    modules: { module: SystemModule; actions: PermissionAction[] }[];
  }) => Promise<void>;
  loading: boolean;
  editingRole?: CustomRoleConfig | null;
  existingCustomRoles?: CustomRoleConfig[];
}

export const CreateRoleModal: React.FC<CreateRoleModalProps> = ({
  isOpen,
  onClose,
  onCreateRole,
  onUpdateRole,
  loading,
  editingRole
}) => {
  const [formData, setFormData] = useState({
    roleName: '',
    displayName: '',
    description: ''
  });
  const [selectedPermissions, setSelectedPermissions] = useState<Map<SystemModule, PermissionAction[]>>(new Map());
  const [errors, setErrors] = useState<Record<string, string>>({});

  const allModules = PermissionManager.getAllModules();
  const allActions = PermissionManager.getAllActions();

  const isEditMode = !!editingRole;

  // Load editing role data when modal opens in edit mode
  useEffect(() => {
    if (isOpen && editingRole) {
      setFormData({
        roleName: editingRole.roleId,
        displayName: editingRole.displayName,
        description: editingRole.description
      });

      const permissionsMap = new Map<SystemModule, PermissionAction[]>();
      editingRole.modules.forEach(moduleConfig => {
        permissionsMap.set(moduleConfig.module, moduleConfig.actions);
      });
      setSelectedPermissions(permissionsMap);
    }
  }, [isOpen, editingRole]);

  const resetForm = () => {
    setFormData({
      roleName: '',
      displayName: '',
      description: ''
    });
    setSelectedPermissions(new Map());
    setErrors({});
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // In edit mode, roleName cannot be changed
    if (!isEditMode) {
      if (!formData.roleName.trim()) {
        newErrors.roleName = 'Nome da função é obrigatório';
      } else if (!/^[a-zA-Z0-9\s]+$/.test(formData.roleName)) {
        newErrors.roleName = 'Nome deve conter apenas letras, números e espaços';
      }
    }

    if (!formData.displayName.trim()) {
      newErrors.displayName = 'Nome de exibição é obrigatório';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Descrição é obrigatória';
    }

    if (selectedPermissions.size === 0) {
      newErrors.permissions = 'Selecione pelo menos um módulo com permissões';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const modules = Array.from(selectedPermissions.entries()).map(([module, actions]) => ({
      module,
      actions
    }));

    try {
      if (isEditMode && onUpdateRole && editingRole) {
        await onUpdateRole(editingRole.roleId, {
          displayName: formData.displayName,
          description: formData.description,
          modules
        });
      } else {
        await onCreateRole({
          roleName: formData.roleName,
          displayName: formData.displayName,
          description: formData.description,
          modules
        });
      }
      handleClose();
    } catch (error) {
      // Error handling is done by parent component
    }
  };

  const toggleModuleAction = (module: SystemModule, action: PermissionAction) => {
    const newPermissions = new Map(selectedPermissions);
    const currentActions = newPermissions.get(module) || [];
    
    if (currentActions.includes(action)) {
      // Remove action
      const updatedActions = currentActions.filter(a => a !== action);
      if (updatedActions.length === 0) {
        newPermissions.delete(module);
      } else {
        newPermissions.set(module, updatedActions);
      }
    } else {
      // Add action
      newPermissions.set(module, [...currentActions, action]);
    }
    
    setSelectedPermissions(newPermissions);
  };

  const toggleAllActionsForModule = (module: SystemModule) => {
    const newPermissions = new Map(selectedPermissions);
    const currentActions = newPermissions.get(module) || [];
    
    if (currentActions.length === allActions.length) {
      // Remove all actions for this module
      newPermissions.delete(module);
    } else {
      // Add all actions for this module
      newPermissions.set(module, [...allActions]);
    }
    
    setSelectedPermissions(newPermissions);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-medium text-gray-900">
            {isEditMode ? 'Editar Função' : 'Criar Nova Função'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col max-h-[calc(90vh-120px)]">
          <div className="px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="roleName" className="block text-sm font-medium text-gray-700 mb-1">
                  {isEditMode ? 'ID da Função' : 'Nome da Função *'}
                </label>
                <input
                  type="text"
                  id="roleName"
                  value={formData.roleName}
                  onChange={(e) => setFormData(prev => ({ ...prev, roleName: e.target.value }))}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 ${isEditMode ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="Ex: Coordenador"
                  readOnly={isEditMode}
                  disabled={isEditMode}
                />
                {isEditMode && (
                  <p className="text-gray-500 text-xs mt-1">O ID da função não pode ser alterado</p>
                )}
                {errors.roleName && (
                  <p className="text-red-600 text-sm mt-1">{errors.roleName}</p>
                )}
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
                  Nome de Exibição *
                </label>
                <input
                  type="text"
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: Coordenador de Projetos"
                />
                {errors.displayName && (
                  <p className="text-red-600 text-sm mt-1">{errors.displayName}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                Descrição *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descreva as responsabilidades desta função..."
              />
              {errors.description && (
                <p className="text-red-600 text-sm mt-1">{errors.description}</p>
              )}
            </div>
          </div>

          <div className="px-6 py-4 flex-1 overflow-y-auto">
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Permissões por Módulo *
              </h4>
              {errors.permissions && (
                <p className="text-red-600 text-sm mb-3">{errors.permissions}</p>
              )}
            </div>

            <div className="space-y-4">
              {allModules.map(module => {
                const moduleActions = selectedPermissions.get(module) || [];
                const allSelected = moduleActions.length === allActions.length;
                const someSelected = moduleActions.length > 0;

                return (
                  <div key={module} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={() => toggleAllActionsForModule(module)}
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 text-sm font-medium text-gray-700">
                          {PermissionManager.getModuleLabel(module)}
                        </label>
                      </div>
                      {someSelected && !allSelected && (
                        <span className="text-xs text-indigo-600 font-medium">
                          {moduleActions.length} de {allActions.length} selecionadas
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 ml-6">
                      {allActions.map(action => {
                        const isSelected = moduleActions.includes(action);
                        return (
                          <label
                            key={action}
                            className="flex items-center cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleModuleAction(module, action)}
                              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                            />
                            <span className="ml-2 text-sm text-gray-600">
                              {PermissionManager.getActionLabel(action)}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 flex-shrink-0">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Criar Função')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};