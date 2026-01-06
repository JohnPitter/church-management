// Presentation Component - Create Forum Category Modal
// Modal for creating new forum categories

import React, { useState } from 'react';
import { ForumCategory } from '../../domain/entities/Forum';
import { forumService } from '@modules/content-management/forum/infrastructure/services/ForumService';

interface CreateForumCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCategoryCreated: () => void;
  currentUser: any;
}

export const CreateForumCategoryModal: React.FC<CreateForumCategoryModalProps> = ({
  isOpen,
  onClose,
  onCategoryCreated,
  currentUser
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '💬',
    color: '#6366F1',
    slug: '',
    requiresApproval: false,
    isActive: true,
    displayOrder: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Predefined colors for categories
  const colorOptions = [
    '#6366F1', // Indigo
    '#8B5CF6', // Violet
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F97316', // Orange
    '#F59E0B', // Amber
    '#EAB308', // Yellow
    '#84CC16', // Lime
    '#22C55E', // Green
    '#10B981', // Emerald
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#64748B', // Slate
    '#6B7280', // Gray
  ];

  // Common icons for forum categories
  const iconOptions = [
    '💬', '🗨️', '💭', '📢', '📣', '🔊', // Discussion icons
    '🙏', '✝️', '⛪', '📿', '🕊️', '✨', // Religious icons
    '❓', '💡', '🤝', '👥', '🎯', '📚', // Help/Community icons
    '📅', '🎉', '🎊', '🎈', '🎁', '🌟', // Event icons
    '📝', '📋', '📊', '📈', '💼', '⚙️'  // Admin icons
  ];

  const handleInputChange = (field: string, value: string | boolean | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Auto-generate slug from name
    if (field === 'name' && typeof value === 'string') {
      const slug = value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Remove multiple hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
      
      setFormData(prev => ({ ...prev, slug }));
    }
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.name.trim()) {
      newErrors.push('Nome da categoria é obrigatório');
    }
    
    if (formData.name.trim().length < 3) {
      newErrors.push('Nome deve ter pelo menos 3 caracteres');
    }
    
    if (!formData.description.trim()) {
      newErrors.push('Descrição é obrigatória');
    }
    
    if (!formData.color) {
      newErrors.push('Cor é obrigatória');
    }
    
    if (!formData.icon) {
      newErrors.push('Ícone é obrigatório');
    }
    
    if (!formData.slug.trim()) {
      newErrors.push('Slug é obrigatório');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    try {
      const categoryData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        icon: formData.icon,
        color: formData.color,
        slug: formData.slug.trim(),
        parentId: undefined, // No subcategories for now
        isActive: formData.isActive,
        requiresApproval: formData.requiresApproval,
        allowedRoles: ['member', 'secretary', 'admin'], // Default to all roles
        moderators: [currentUser?.id || 'unknown'],
        displayOrder: formData.displayOrder,
        lastTopicAt: undefined,
        lastTopicBy: undefined
      };
      
      await forumService.createCategory(categoryData);
      
      // Reset form
      setFormData({
        name: '',
        description: '',
        icon: '💬',
        color: '#6366F1',
        slug: '',
        requiresApproval: false,
        isActive: true,
        displayOrder: 0
      });
      
      onCategoryCreated();
      onClose();
      
    } catch (error) {
      console.error('Error creating category:', error);
      setErrors(['Erro ao criar categoria. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      icon: '💬',
      color: '#6366F1',
      slug: '',
      requiresApproval: false,
      isActive: true,
      displayOrder: 0
    });
    setErrors([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Nova Categoria do Fórum
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

          {/* Error Messages */}
          {errors.length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Corrija os seguintes erros:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Categoria *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Nome da categoria"
                required
              />
            </div>

            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Slug (URL) *
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="url-amigavel"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Gerado automaticamente a partir do nome, mas pode ser editado
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição *
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Descrição da categoria..."
                required
              />
            </div>

            {/* Icon Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ícone *
              </label>
              <div className="grid grid-cols-8 gap-2 mb-3">
                {iconOptions.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleInputChange('icon', icon)}
                    className={`p-2 text-xl rounded border-2 hover:bg-gray-50 ${
                      formData.icon === icon
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-300'
                    }`}
                  >
                    {icon}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="w-20 px-2 py-1 text-center text-xl border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="🏷️"
                />
                <span className="text-sm text-gray-600">ou digite um emoji personalizado</span>
              </div>
            </div>

            {/* Color Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor *
              </label>
              <div className="grid grid-cols-7 gap-2 mb-3">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleInputChange('color', color)}
                    className={`w-8 h-8 rounded-full border-2 ${
                      formData.color === color
                        ? 'border-gray-800 ring-2 ring-gray-400'
                        : 'border-gray-300'
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="w-12 h-8 rounded border border-gray-300"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => handleInputChange('color', e.target.value)}
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="#6366F1"
                />
              </div>
            </div>

            {/* Display Order */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ordem de Exibição
              </label>
              <input
                type="number"
                min="0"
                value={formData.displayOrder}
                onChange={(e) => handleInputChange('displayOrder', parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número menor aparece primeiro na lista
              </p>
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => handleInputChange('isActive', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
                  Categoria ativa
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requiresApproval"
                  checked={formData.requiresApproval}
                  onChange={(e) => handleInputChange('requiresApproval', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="requiresApproval" className="ml-2 block text-sm text-gray-900">
                  Tópicos requerem aprovação
                </label>
              </div>
            </div>

            {/* Preview */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Visualização
              </label>
              <div className="flex items-center space-x-3">
                <div 
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                  style={{ backgroundColor: formData.color + '20', color: formData.color }}
                >
                  {formData.icon}
                </div>
                <div>
                  <div className="font-medium text-gray-900">
                    {formData.name || 'Nome da categoria'}
                  </div>
                  {formData.description && (
                    <div className="text-sm text-gray-500">
                      {formData.description}
                    </div>
                  )}
                  <div className="text-xs text-gray-400">
                    /{formData.slug || 'slug'}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={handleClose}
                disabled={loading}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  'Criar Categoria'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateForumCategoryModal;
