// Presentation Component - Edit Devotional Modal
// Modal for editing existing devotionals

import React, { useState, useEffect } from 'react';
import {
  Devotional,
  DevotionalCategory
} from '../../domain/entities/Devotional';
import { devotionalService } from '@modules/church-management/devotionals/application/services/DevotionalService';

interface EditDevotionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevotionalUpdated: () => void;
  devotional: Devotional;
  currentUser: any;
  categories: DevotionalCategory[];
}

export const EditDevotionalModal: React.FC<EditDevotionalModalProps> = ({
  isOpen,
  onClose,
  onDevotionalUpdated,
  devotional,
  currentUser,
  categories
}) => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    bibleVerse: '',
    bibleReference: '',
    reflection: '',
    prayer: '',
    author: '',
    publishDate: '',
    categoryId: '',
    tags: '',
    imageUrl: '',
    audioUrl: '',
    readingTime: 5,
    isPublished: false
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    if (devotional) {
      setFormData({
        title: devotional.title,
        content: devotional.content,
        bibleVerse: devotional.bibleVerse,
        bibleReference: devotional.bibleReference,
        reflection: devotional.reflection,
        prayer: devotional.prayer,
        author: devotional.author,
        publishDate: devotional.publishDate.toISOString().split('T')[0],
        categoryId: devotional.category.id,
        tags: devotional.tags.join(', '),
        imageUrl: devotional.imageUrl || '',
        audioUrl: devotional.audioUrl || '',
        readingTime: devotional.readingTime,
        isPublished: devotional.isPublished
      });
    }
  }, [devotional]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: string[] = [];
    
    if (!formData.title.trim()) {
      newErrors.push('Título é obrigatório');
    }
    
    if (!formData.content.trim()) {
      newErrors.push('Conteúdo é obrigatório');
    }
    
    if (!formData.bibleVerse.trim()) {
      newErrors.push('Versículo é obrigatório');
    }
    
    if (!formData.bibleReference.trim()) {
      newErrors.push('Referência bíblica é obrigatória');
    }
    
    if (!formData.reflection.trim()) {
      newErrors.push('Reflexão é obrigatória');
    }
    
    if (!formData.prayer.trim()) {
      newErrors.push('Oração é obrigatória');
    }
    
    if (!formData.categoryId) {
      newErrors.push('Categoria é obrigatória');
    }
    
    if (!formData.publishDate) {
      newErrors.push('Data de publicação é obrigatória');
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
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (!selectedCategory) {
        setErrors(['Categoria não encontrada']);
        return;
      }
      
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const updates = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        bibleVerse: formData.bibleVerse.trim(),
        bibleReference: formData.bibleReference.trim(),
        reflection: formData.reflection.trim(),
        prayer: formData.prayer.trim(),
        author: formData.author.trim(),
        publishDate: new Date(formData.publishDate),
        category: selectedCategory,
        tags: tagsArray,
        imageUrl: formData.imageUrl.trim() || undefined,
        audioUrl: formData.audioUrl.trim() || undefined,
        readingTime: formData.readingTime,
        isPublished: formData.isPublished,
        createdBy: currentUser?.email || 'unknown'
      };
      
      await devotionalService.updateDevotional(devotional.id, updates);
      
      onDevotionalUpdated();
      onClose();
      
    } catch (error) {
      console.error('Error updating devotional:', error);
      setErrors(['Erro ao atualizar devocional. Tente novamente.']);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Editar Devocional
            </h3>
            <button
              onClick={onClose}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Título do devocional"
                  required
                />
              </div>

              {/* Bible Reference and Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referência Bíblica *
                </label>
                <input
                  type="text"
                  value={formData.bibleReference}
                  onChange={(e) => handleInputChange('bibleReference', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Ex: João 3:16"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Bible Verse */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Versículo *
                </label>
                <textarea
                  value={formData.bibleVerse}
                  onChange={(e) => handleInputChange('bibleVerse', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Digite o texto completo do versículo"
                  required
                />
              </div>

              {/* Content */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo Principal *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Escreva o conteúdo principal do devocional..."
                  required
                />
              </div>

              {/* Reflection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reflexão *
                </label>
                <textarea
                  value={formData.reflection}
                  onChange={(e) => handleInputChange('reflection', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Questões para reflexão e aplicação prática..."
                  required
                />
              </div>

              {/* Prayer */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oração *
                </label>
                <textarea
                  value={formData.prayer}
                  onChange={(e) => handleInputChange('prayer', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Oração relacionada ao tema do devocional..."
                  required
                />
              </div>

              {/* Author and Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor *
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Nome do autor"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Publicação *
                </label>
                <input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => handleInputChange('publishDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  required
                />
              </div>

              {/* Tags and Reading Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (separadas por vírgula)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => handleInputChange('tags', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="fé, esperança, amor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tempo de Leitura (minutos)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.readingTime}
                  onChange={(e) => handleInputChange('readingTime', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Media URLs */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL da Imagem (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange('imageUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://exemplo.com/imagem.jpg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL do Áudio (Opcional)
                </label>
                <input
                  type="url"
                  value={formData.audioUrl}
                  onChange={(e) => handleInputChange('audioUrl', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="https://exemplo.com/audio.mp3"
                />
              </div>

              {/* Publish Status */}
              <div className="md:col-span-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.isPublished}
                    onChange={(e) => handleInputChange('isPublished', e.target.checked)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Publicado
                  </span>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6">
              <button
                type="button"
                onClick={onClose}
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
                    Atualizando...
                  </div>
                ) : (
                  'Atualizar Devocional'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditDevotionalModal;
