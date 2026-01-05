// Presentation Component - Create Devotional Modal
// Modal for creating new devotionals

import React, { useState, useEffect } from 'react';
import {
  Devotional,
  DevotionalCategory
} from '../../domain/entities/Devotional';
import { devotionalService } from 'infrastructure/services/DevotionalService';

interface CreateDevotionalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDevotionalCreated: () => void;
  currentUser: any;
  categories: DevotionalCategory[];
}

export const CreateDevotionalModal: React.FC<CreateDevotionalModalProps> = ({
  isOpen,
  onClose,
  onDevotionalCreated,
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
    author: currentUser?.displayName || currentUser?.email || '',
    publishDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    tags: '',
    imageUrl: '',
    audioUrl: '',
    readingTime: 5,
    isPublished: false
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isFormValid, setIsFormValid] = useState(false);

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
    }

    if (!formData.content.trim()) {
      newErrors['content'] = 'Conteúdo é obrigatório';
      isValid = false;
    }

    if (!formData.bibleVerse.trim()) {
      newErrors['bibleVerse'] = 'Versículo é obrigatório';
      isValid = false;
    }

    if (!formData.bibleReference.trim()) {
      newErrors['bibleReference'] = 'Referência bíblica é obrigatória';
      isValid = false;
    }

    if (!formData.reflection.trim()) {
      newErrors['reflection'] = 'Reflexão é obrigatória';
      isValid = false;
    }

    if (!formData.prayer.trim()) {
      newErrors['prayer'] = 'Oração é obrigatória';
      isValid = false;
    }

    if (!formData.categoryId) {
      newErrors['categoryId'] = 'Categoria é obrigatória';
      isValid = false;
    }

    if (!formData.publishDate) {
      newErrors['publishDate'] = 'Data de publicação é obrigatória';
      isValid = false;
    }

    if (!formData.author.trim()) {
      newErrors['author'] = 'Autor é obrigatório';
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
      setErrors(['Por favor, preencha todos os campos obrigatórios antes de continuar.']);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
      if (!selectedCategory) {
        setErrors(['Categoria não encontrada. Por favor, selecione uma categoria válida.']);
        setLoading(false);
        return;
      }

      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      const devotionalData = {
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

      console.log('Creating devotional with data:', devotionalData);

      const devotionalId = await devotionalService.createDevotional(devotionalData);

      console.log('Devotional created successfully with ID:', devotionalId);

      // Reset form
      setFormData({
        title: '',
        content: '',
        bibleVerse: '',
        bibleReference: '',
        reflection: '',
        prayer: '',
        author: currentUser?.displayName || currentUser?.email || '',
        publishDate: new Date().toISOString().split('T')[0],
        categoryId: '',
        tags: '',
        imageUrl: '',
        audioUrl: '',
        readingTime: 5,
        isPublished: false
      });
      setValidationErrors({});

      onDevotionalCreated();
      onClose();

    } catch (error: any) {
      console.error('Error creating devotional:', error);
      const errorMessage = error?.message || 'Erro desconhecido ao criar devocional.';
      setErrors([`Erro ao criar devocional: ${errorMessage}. Por favor, tente novamente.`]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      content: '',
      bibleVerse: '',
      bibleReference: '',
      reflection: '',
      prayer: '',
      author: currentUser?.displayName || currentUser?.email || '',
      publishDate: new Date().toISOString().split('T')[0],
      categoryId: '',
      tags: '',
      imageUrl: '',
      audioUrl: '',
      readingTime: 5,
      isPublished: false
    });
    setErrors([]);
    setValidationErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Novo Devocional
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Título <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={getInputClassName('title')}
                  placeholder="Título do devocional"
                />
              </div>

              {/* Bible Reference and Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Referência Bíblica <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.bibleReference}
                  onChange={(e) => handleInputChange('bibleReference', e.target.value)}
                  className={getInputClassName('bibleReference')}
                  placeholder="Ex: João 3:16"
                />
              </div>

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
                  Versículo <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.bibleVerse}
                  onChange={(e) => handleInputChange('bibleVerse', e.target.value)}
                  rows={2}
                  className={getInputClassName('bibleVerse')}
                  placeholder="Digite o texto completo do versículo"
                />
              </div>

              {/* Content */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conteúdo Principal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => handleInputChange('content', e.target.value)}
                  rows={4}
                  className={getInputClassName('content')}
                  placeholder="Escreva o conteúdo principal do devocional..."
                />
              </div>

              {/* Reflection */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reflexão <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.reflection}
                  onChange={(e) => handleInputChange('reflection', e.target.value)}
                  rows={3}
                  className={getInputClassName('reflection')}
                  placeholder="Questões para reflexão e aplicação prática..."
                />
              </div>

              {/* Prayer */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Oração <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.prayer}
                  onChange={(e) => handleInputChange('prayer', e.target.value)}
                  rows={3}
                  className={getInputClassName('prayer')}
                  placeholder="Oração relacionada ao tema do devocional..."
                />
              </div>

              {/* Author and Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Autor <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => handleInputChange('author', e.target.value)}
                  className={getInputClassName('author')}
                  placeholder="Nome do autor"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Publicação <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.publishDate}
                  onChange={(e) => handleInputChange('publishDate', e.target.value)}
                  className={getInputClassName('publishDate')}
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
                    Publicar imediatamente
                  </span>
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
                  'Criar Devocional'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateDevotionalModal;
