// Presentation Component - Notifications List
// Component for displaying user notifications

import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNotifications } from '../contexts/NotificationContext';
import { Notification, NotificationEntity } from '@modules/shared-kernel/notifications/domain/entities/Notification';

interface NotificationsListProps {
  className?: string;
  limit?: number;
  showMarkAllAsRead?: boolean;
  onShowMore?: () => void;
}

export const NotificationsList: React.FC<NotificationsListProps> = ({
  className = '',
  limit,
  showMarkAllAsRead = true,
  onShowMore
}) => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead,
    refreshNotifications 
  } = useNotifications();
  
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [markingAllAsRead, setMarkingAllAsRead] = useState(false);

  const displayNotifications = limit ? notifications.slice(0, limit) : notifications;

  const handleMarkAsRead = async (notificationId: string) => {
    if (processingId) return;
    
    setProcessingId(notificationId);
    try {
      await markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (markingAllAsRead || unreadCount === 0) return;
    
    setMarkingAllAsRead(true);
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAllAsRead(false);
    }
  };

  const handleRefresh = async () => {
    try {
      await refreshNotifications();
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    }
  };

  const getNotificationIcon = (notification: Notification) => {
    const typeIcon = NotificationEntity.getTypeIcon(notification.type);
    const priorityIcon = NotificationEntity.getPriorityIcon(notification.priority);
    return `${typeIcon} ${priorityIcon}`;
  };

  const getPriorityColor = (notification: Notification) => {
    return NotificationEntity.getPriorityColor(notification.priority);
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = diff / (1000 * 60 * 60);

    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return `${minutes}m atrás`;
    } else if (hours < 24) {
      return `${Math.floor(hours)}h atrás`;
    } else {
      return format(date, 'dd/MM/yyyy', { locale: ptBR });
    }
  };

  if (loading) {
    return (
      <div className={`${className} animate-pulse`}>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className={`${className} text-center py-8`}>
        <div className="text-gray-400 text-6xl mb-4">🔔</div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma notificação</h3>
        <p className="text-gray-500">Você não tem notificações no momento.</p>
        <button
          onClick={handleRefresh}
          className="mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          Atualizar
        </button>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <h2 className="text-lg font-semibold text-gray-900">Notificações</h2>
          {unreadCount > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {unreadCount} não lidas
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            title="Atualizar notificações"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          
          {showMarkAllAsRead && unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              disabled={markingAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
            >
              {markingAllAsRead ? 'Marcando...' : 'Marcar todas como lidas'}
            </button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {displayNotifications.map((notification) => {
          const isUnread = NotificationEntity.isUnread(notification);
          const canDisplay = NotificationEntity.canDisplay(notification);
          
          if (!canDisplay) return null;

          return (
            <div
              key={notification.id}
              className={`relative flex items-start space-x-3 p-4 rounded-lg border transition-colors ${
                isUnread 
                  ? 'bg-blue-50 border-blue-200' 
                  : 'bg-white border-gray-200 hover:bg-gray-50'
              } ${processingId === notification.id ? 'opacity-50' : ''}`}
            >
              {/* Priority indicator */}
              <div className={`w-2 h-2 rounded-full mt-2 ${
                getPriorityColor(notification) === 'red' ? 'bg-red-500' :
                getPriorityColor(notification) === 'yellow' ? 'bg-yellow-500' :
                getPriorityColor(notification) === 'blue' ? 'bg-blue-500' :
                'bg-gray-400'
              }`}></div>

              {/* Icon */}
              <div className="text-2xl mt-1">
                {getNotificationIcon(notification)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className={`text-sm font-medium ${isUnread ? 'text-gray-900' : 'text-gray-700'}`}>
                      {notification.title}
                    </h4>
                    <p className={`mt-1 text-sm ${isUnread ? 'text-gray-700' : 'text-gray-500'}`}>
                      {notification.message}
                    </p>
                    
                    {/* Action button */}
                    {notification.actionUrl && notification.actionText && (
                      <div className="mt-2">
                        <a
                          href={notification.actionUrl}
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          {notification.actionText}
                          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    <span className="text-xs text-gray-400">
                      {formatDate(notification.createdAt)}
                    </span>
                    
                    {isUnread && (
                      <button
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={processingId === notification.id}
                        className="text-xs text-blue-600 hover:text-blue-700 font-medium disabled:opacity-50"
                        title="Marcar como lida"
                      >
                        Marcar como lida
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Featured image */}
              {notification.imageUrl && (
                <div className="flex-shrink-0 ml-3">
                  <img
                    src={notification.imageUrl}
                    alt=""
                    className="w-12 h-12 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show more button */}
      {limit && notifications.length > limit && (
        <div className="text-center mt-4">
          <button 
            onClick={onShowMore}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
          >
            Ver mais notificações ({notifications.length - limit} restantes)
          </button>
        </div>
      )}
    </div>
  );
};