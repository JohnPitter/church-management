// Presentation Component - CreateEventForm
// Clean form component for creating events

import React, { useState, FormEvent } from 'react';
import { EventCategory } from '../../../domain/entities/Event';
import { useEvents } from '../../hooks/useEvents';
import { LoadingButton } from '../common/LoadingButton';
import { ErrorMessage } from '../common/ErrorMessage';

interface CreateEventFormProps {
  categories: EventCategory[];
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  categoryId: string;
  isPublic: boolean;
  requiresConfirmation: boolean;
  maxParticipants: string;
  streamingURL: string;
}

export const CreateEventForm: React.FC<CreateEventFormProps> = ({
  categories,
  onSuccess,
  onCancel
}) => {
  const { createEvent } = useEvents();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: '',
    time: '',
    location: '',
    categoryId: '',
    isPublic: true,
    requiresConfirmation: true,
    maxParticipants: '',
    streamingURL: ''
  });

  const handleChange = (
    field: keyof FormData
  ) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const value = e.target.type === 'checkbox' 
      ? (e.target as HTMLInputElement).checked 
      : e.target.value;
    
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await createEvent({
        title: formData.title,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        location: formData.location,
        categoryId: formData.categoryId,
        isPublic: formData.isPublic,
        requiresConfirmation: formData.requiresConfirmation,
        maxParticipants: formData.maxParticipants ? parseInt(formData.maxParticipants) : undefined,
        streamingURL: formData.streamingURL || undefined
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Erro ao criar evento');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = formData.title && formData.description && formData.date && 
                     formData.time && formData.location && formData.categoryId;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título *
        </label>
        <input
          type="text"
          value={formData.title}
          onChange={handleChange('title')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Ex: Culto de Domingo"
          required
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição *
        </label>
        <textarea
          value={formData.description}
          onChange={handleChange('description')}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Descreva o evento..."
          required
        />
      </div>

      {/* Date and Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Data *
          </label>
          <input
            type="date"
            value={formData.date}
            onChange={handleChange('date')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horário *
          </label>
          <input
            type="time"
            value={formData.time}
            onChange={handleChange('time')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            required
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Local *
        </label>
        <input
          type="text"
          value={formData.location}
          onChange={handleChange('location')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Ex: Templo Principal"
          required
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Categoria *
        </label>
        <select
          value={formData.categoryId}
          onChange={handleChange('categoryId')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          required
        >
          <option value="">Selecione uma categoria</option>
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* Max Participants */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Limite de Participantes
        </label>
        <input
          type="number"
          value={formData.maxParticipants}
          onChange={handleChange('maxParticipants')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Deixe em branco para ilimitado"
          min="1"
        />
      </div>

      {/* Streaming URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          URL de Transmissão
        </label>
        <input
          type="url"
          value={formData.streamingURL}
          onChange={handleChange('streamingURL')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="https://..."
        />
      </div>

      {/* Checkboxes */}
      <div className="space-y-3">
        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isPublic}
            onChange={handleChange('isPublic')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Evento público
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.requiresConfirmation}
            onChange={handleChange('requiresConfirmation')}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          />
          <label className="ml-2 block text-sm text-gray-700">
            Requer confirmação de presença
          </label>
        </div>
      </div>

      {error && <ErrorMessage message={error} />}

      {/* Actions */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancelar
        </button>
        
        <LoadingButton
          type="submit"
          loading={loading}
          disabled={!isFormValid}
          variant="primary"
        >
          Criar Evento
        </LoadingButton>
      </div>
    </form>
  );
};