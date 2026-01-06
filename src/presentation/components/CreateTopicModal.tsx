// Presentation Component - Create Topic Modal
// Modal for creating new forum topics

import React, { useState, useEffect } from 'react';
import {
  ForumTopic,
  ForumCategory,
  TopicStatus,
  TopicPriority
} from '../../modules/content-management/forum/domain/entities/Forum';
import { forumService } from '@modules/content-management/forum/infrastructure/services/ForumService';

interface CreateTopicModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTopicCreated: () => void;
  currentUser: any;
  categories: ForumCategory[];
}

export const CreateTopicModal: React.FC<CreateTopicModalProps> = ({
  isOpen,
  onClose,
  onTopicCreated,
  currentUser,
  categories
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    categoryId: '',
    tags: '',
    priority: TopicPriority.NORMAL,
    isPinned: false,
    isLocked: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

  const priorityOptions = [
    { value: TopicPriority.LOW, label: 'Baixa', color: 'text-gray-600' },
    { value: TopicPriority.NORMAL, label: 'Normal', color: 'text-blue-600' },
    { value: TopicPriority.HIGH, label: 'Alta', color: 'text-orange-600' },
    { value: TopicPriority.URGENT, label: 'Urgente', color: 'text-red-600' }
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors['title'] = 'Título é obrigatório';
      isValid = false;
    } else if (formData.title.trim().length < 5) {
      newErrors['title'] = 'Título deve ter pelo menos 5 caracteres';
      isValid = false;
    }

    if (!formData.content.trim()) {
      newErrors['content'] = 'Conteúdo é obrigatório';
      isValid = false;
    } else if (formData.content.trim().length < 20) {
      newErrors['content'] = 'Conteúdo deve ter pelo menos 20 caracteres';
      isValid = false;
    }

    if (!formData.categoryId) {
      newErrors['categoryId'] = 'Categoria é obrigatória';
      isValid = false;
    }

    setValidationErrors(newErrors);
    setIsFormValid(isValid);
    return isValid;
  };

  // Validate form whenever formData changes
  useEffect(() => {
    validateForm();
  }, [formData]);

  const hasError = (fieldName: string) => {
    return !!validationErrors[fieldName];
  };

  const getInputClassName = (fieldName: string, baseClassName: string = 'w-full px-3 py-2 border rounded-md focus:ring-indigo-500 focus:border-indigo-500') => {
    return hasError(fieldName)
      ? `${baseClassName.replace('border-gray-300', 'border-red-500')} border-red-500 focus:border-red-500 focus:ring-red-500`
      : `${baseClassName} border-gray-300`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid) {
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (!selectedCategory) {
        setErrors(['Categoria não encontrada']);
        setLoading(false);
        return;
      }

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const topicData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        categoryId: formData.categoryId,
        category: selectedCategory,
        authorId: currentUser?.id || 'unknown',
        authorName: currentUser?.displayName || currentUser?.email || 'Usuário',
        authorEmail: currentUser?.email || '',
        authorAvatar: currentUser?.photoURL,
        tags: tagsArray,
        status: TopicStatus.PUBLISHED, // Auto-publish for admins
        priority: formData.priority,
        isPinned: formData.isPinned,
        isLocked: formData.isLocked,
        attachments: []
      };

      await forumService.createTopic(topicData);

      // Reset form
      setFormData({
        title: '',
        content: '',
        categoryId: '',
        tags: '',
        priority: TopicPriority.NORMAL,
        isPinned: false,
        isLocked: false
      });
      setValidationErrors({});

      onTopicCreated();
      onClose();

    } catch (error) {
      console.error('Error creating topic:', error);
      setErrors(['Erro ao criar tópico. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      categoryId: '',
      tags: '',
      priority: TopicPriority.NORMAL,
      isPinned: false,
      isLocked: false
    });
    setErrors([]);
    setValidationErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Novo Tópico no Fórum
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

          {/* Validation Error Banner */}
          {!isFormValid && Object.keys(validationErrors).length > 0 && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    Por favor, preencha os campos obrigatórios:
                  </h3>
                  <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* General Error Messages */}
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
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={getInputClassName('title')}
                placeholder="Digite o título do tópico"
              />
            </div>

            {/* Category and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={getInputClassName('categoryId')}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.filter(cat => cat.isActive).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prioridade
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {priorityOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Conteúdo <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => handleInputChange('content', e.target.value)}
                rows={6}
                className={getInputClassName('content')}
                placeholder="Escreva o conteúdo do tópico..."
              />
              <div className="text-right text-xs text-gray-500 mt-1">
                {formData.content.length} caracteres (mínimo 20)
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tags (separadas por vírgula)
              </label>
              <input
                type="text"
                value={formData.tags}
                onChange={(e) => handleInputChange('tags', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="discussão, ajuda, oração"
              />
            </div>

            {/* Options */}
            <div className="space-y-2">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => handleInputChange('isPinned', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isPinned" className="ml-2 block text-sm text-gray-900">
                  📌 Fixar tópico no topo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isLocked"
                  checked={formData.isLocked}
                  onChange={(e) => handleInputChange('isLocked', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="isLocked" className="ml-2 block text-sm text-gray-900">
                  🔒 Bloquear respostas
                </label>
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
                disabled={loading || !isFormValid}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Criando...
                  </div>
                ) : (
                  'Criar Tópico'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};