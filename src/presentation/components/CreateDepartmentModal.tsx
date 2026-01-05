// Presentation Component - Create Department Modal
// Modal for creating and editing department financial boxes

import React, { useState, useEffect } from 'react';
import { Department, DepartmentEntity } from '../../domain/entities/Department';
import { departmentFinancialService } from '../../infrastructure/services/DepartmentFinancialService';

interface CreateDepartmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepartmentCreated: () => void;
  currentUser: any;
  editDepartment?: Department | null;
}

export const CreateDepartmentModal: React.FC<CreateDepartmentModalProps> = ({
  isOpen,
  onClose,
  onDepartmentCreated,
  currentUser,
  editDepartment
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏦',
    color: '#3B82F6',
    initialBalance: 0,
    responsibleUserId: '',
    responsibleName: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const iconOptions = ['🏦', '📚', '🎵', '👶', '🙏', '💒', '🌍', '🎓', '💝', '🏗️', '🍞', '🎯'];
  const colorOptions = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#14B8A6', // Teal
    '#F97316', // Orange
  ];

  useEffect(() => {
    if (editDepartment) {
      setFormData({
        name: editDepartment.name,
        description: editDepartment.description || '',
        icon: editDepartment.icon || '🏦',
        color: editDepartment.color || '#3B82F6',
        initialBalance: editDepartment.initialBalance || 0,
        responsibleUserId: editDepartment.responsibleUserId || '',
        responsibleName: editDepartment.responsibleName || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '🏦',
        color: '#3B82F6',
        initialBalance: 0,
        responsibleUserId: '',
        responsibleName: ''
      });
    }
    setErrors([]);
  }, [editDepartment, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);

    try {
      // Build department data, only including defined fields
      const departmentData: any = {
        name: formData.name.trim(),
        icon: formData.icon,
        color: formData.color,
        initialBalance: formData.initialBalance,
        currentBalance: formData.initialBalance,
        isActive: true,
        createdBy: currentUser?.uid || 'system',
        updatedAt: new Date(),
        createdAt: new Date()
      };

      // Only add optional fields if they have values
      if (formData.description.trim()) {
        departmentData.description = formData.description.trim();
      }
      if (formData.responsibleUserId) {
        departmentData.responsibleUserId = formData.responsibleUserId;
      }
      if (formData.responsibleName.trim()) {
        departmentData.responsibleName = formData.responsibleName.trim();
      }

      // Validate
      const validationErrors = DepartmentEntity.validateDepartment(departmentData);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      if (editDepartment) {
        // Update existing department - build update object with only defined fields
        const updateData: any = {
          name: departmentData.name,
          icon: departmentData.icon,
          color: departmentData.color,
          updatedAt: new Date()
        };

        if (formData.description.trim()) {
          updateData.description = formData.description.trim();
        }
        if (formData.responsibleUserId) {
          updateData.responsibleUserId = formData.responsibleUserId;
        }
        if (formData.responsibleName.trim()) {
          updateData.responsibleName = formData.responsibleName.trim();
        }

        await departmentFinancialService.updateDepartment(editDepartment.id, updateData);
      } else {
        // Create new department
        await departmentFinancialService.createDepartment(departmentData);
      }

      onDepartmentCreated();
      onClose();
    } catch (error) {
      console.error('Error creating/updating department:', error);
      setErrors([error instanceof Error ? error.message : 'Erro ao salvar departamento']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {editDepartment ? 'Editar Departamento' : 'Novo Departamento'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          {errors.length > 0 && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Erro ao salvar departamento
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc list-inside">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Departamento *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Ex: Escola Bíblica, Louvor, Missões..."
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descrição
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descrição do departamento e suas atividades..."
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone
              </label>
              <div className="grid grid-cols-6 gap-2">
                {iconOptions.map((icon) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`p-3 text-2xl border rounded-md hover:bg-gray-50 ${
                      formData.icon === icon
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor
              </label>
              <div className="grid grid-cols-8 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-full border-2 ${
                      formData.color === color
                        ? 'border-gray-900 scale-110'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>

            {/* Initial Balance */}
            {!editDepartment && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Saldo Inicial
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    R$
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.initialBalance}
                    onChange={(e) => setFormData({ ...formData, initialBalance: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0,00"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Saldo inicial da caixinha do departamento
                </p>
              </div>
            )}

            {/* Responsible Person */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Responsável (Opcional)
              </label>
              <input
                type="text"
                value={formData.responsibleName}
                onChange={(e) => setFormData({ ...formData, responsibleName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nome do responsável pelo departamento"
              />
              <p className="mt-1 text-xs text-gray-500">
                Pessoa responsável por gerenciar esta caixinha
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Salvando...' : editDepartment ? 'Atualizar Departamento' : 'Criar Departamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
