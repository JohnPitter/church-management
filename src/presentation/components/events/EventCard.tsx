// Presentation Component - EventCard
// Clean component for displaying event information

import React from 'react';
import { Event, EventEntity } from '../../../domain/entities/Event';
import { LoadingButton } from '../common/LoadingButton';

interface EventCardProps {
  event: Event;
  onConfirmAttendance?: () => void;
  onViewDetails?: () => void;
  hasConfirmed?: boolean;
  confirmationLoading?: boolean;
  compact?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onConfirmAttendance,
  onViewDetails,
  hasConfirmed = false,
  confirmationLoading = false,
  compact = false
}) => {
  const isUpcoming = EventEntity.isUpcoming(event);
  const isPast = EventEntity.isPast(event);
  const daysUntil = EventEntity.getDaysUntilEvent(event);
  const formattedDate = EventEntity.formatEventDateTime(event);

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden transition-all hover:shadow-lg ${
      compact ? 'p-4' : 'p-6'
    }`}>
      {/* Category Badge */}
      <div className="flex items-center justify-between mb-3">
        <span
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
          style={{
            backgroundColor: `${event.category.color}20`,
            color: event.category.color
          }}
        >
          {event.category.name}
        </span>
        
        {isUpcoming && daysUntil <= 7 && (
          <span className="text-xs text-orange-600 font-medium">
            Em {daysUntil} {daysUntil === 1 ? 'dia' : 'dias'}
          </span>
        )}
      </div>

      {/* Event Title */}
      <h3 className={`font-semibold text-gray-900 mb-2 ${
        compact ? 'text-lg' : 'text-xl'
      }`}>
        {event.title}
      </h3>

      {/* Event Details */}
      <div className="space-y-2 text-sm text-gray-600 mb-4">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formattedDate}
        </div>

        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {event.location}
        </div>
      </div>

      {/* Description */}
      {!compact && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">
          {event.description}
        </p>
      )}

      {/* Event Status */}
      {isPast && (
        <div className="mb-4">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Evento encerrado
          </span>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between">
        {onViewDetails && (
          <button
            onClick={onViewDetails}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
          >
            Ver detalhes
          </button>
        )}

        {onConfirmAttendance && event.requiresConfirmation && isUpcoming && (
          <LoadingButton
            onClick={onConfirmAttendance}
            loading={confirmationLoading}
            size="sm"
            variant={hasConfirmed ? 'secondary' : 'primary'}
          >
            {hasConfirmed ? '✓ Confirmado' : 'Confirmar presença'}
          </LoadingButton>
        )}
      </div>

      {/* Streaming Badge */}
      {event.streamingURL && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center text-sm text-blue-600">
            <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            Transmissão ao vivo disponível
          </div>
        </div>
      )}

      {/* Max Participants */}
      {event.maxParticipants && isUpcoming && (
        <div className="mt-2 text-xs text-gray-500">
          Limite de participantes: {event.maxParticipants}
        </div>
      )}
    </div>
  );
};