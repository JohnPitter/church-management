// Presentation Component - EventList
// Clean component for displaying a list of events

import React, { useState } from 'react';
import { Event, EventCategory } from '../../../domain/entities/Event';
import { EventCard } from './EventCard';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorMessage } from '../common/ErrorMessage';

interface EventListProps {
  events: Event[];
  categories: EventCategory[];
  loading?: boolean;
  error?: string | null;
  onConfirmAttendance?: (eventId: string) => void;
  onViewEvent?: (eventId: string) => void;
  hasConfirmed?: (eventId: string) => boolean;
  confirmationLoading?: string; // eventId being processed
  showFilters?: boolean;
  compact?: boolean;
}

export const EventList: React.FC<EventListProps> = ({
  events,
  categories,
  loading = false,
  error = null,
  onConfirmAttendance,
  onViewEvent,
  hasConfirmed,
  confirmationLoading,
  showFilters = true,
  compact = false
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'upcoming' | 'past'>('upcoming');

  // Filter events
  const filteredEvents = events.filter(event => {
    // Category filter
    if (selectedCategory !== 'all' && event.category.id !== selectedCategory) {
      return false;
    }

    // Time filter
    const now = new Date();
    const eventDate = new Date(event.date);
    
    if (timeFilter === 'upcoming' && eventDate <= now) {
      return false;
    }
    
    if (timeFilter === 'past' && eventDate > now) {
      return false;
    }

    return true;
  });

  // Sort events by date
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (timeFilter === 'upcoming') {
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    }
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message={error} />;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      {showFilters && (
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Time Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Período
              </label>
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todos os eventos</option>
                <option value="upcoming">Próximos eventos</option>
                <option value="past">Eventos passados</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Events Count */}
      <div className="text-sm text-gray-600">
        {sortedEvents.length === 0 ? (
          'Nenhum evento encontrado'
        ) : (
          `${sortedEvents.length} ${sortedEvents.length === 1 ? 'evento' : 'eventos'} encontrado${sortedEvents.length === 1 ? '' : 's'}`
        )}
      </div>

      {/* Events Grid */}
      {sortedEvents.length > 0 ? (
        <div className={`grid gap-6 ${compact ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {sortedEvents.map(event => (
            <EventCard
              key={event.id}
              event={event}
              onConfirmAttendance={onConfirmAttendance ? () => onConfirmAttendance(event.id) : undefined}
              onViewDetails={onViewEvent ? () => onViewEvent(event.id) : undefined}
              hasConfirmed={hasConfirmed ? hasConfirmed(event.id) : false}
              confirmationLoading={confirmationLoading === event.id}
              compact={compact}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum evento encontrado
          </h3>
          <p className="text-gray-500">
            {selectedCategory !== 'all' || timeFilter !== 'all'
              ? 'Tente ajustar os filtros para encontrar eventos.'
              : 'Não há eventos cadastrados no momento.'}
          </p>
        </div>
      )}
    </div>
  );
};