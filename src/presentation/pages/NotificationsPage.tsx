// Presentation Page - Notifications
// Full-page view for user notifications

import React, { useState } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { NotificationsList } from '../components/NotificationsList';
import { NotificationEntity } from '@modules/shared-kernel/notifications/domain/entities/Notification';

export const NotificationsPage: React.FC = () => {
  const { 
    notifications, 
    unreadCount, 
    loading, 
    preferences, 
    updatePreferences
  } = useNotifications();
  
  const [showSettings, setShowSettings] = useState(false);
  const [cleaningUp, setCleaningUp] = useState(false);

  const handleCleanupExpired = async () => {
    setCleaningUp(true);
    try {
      // For now, just show a message - this would require admin privileges to implement
      alert('Funcionalidade de limpeza será implementada para administradores');
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
    } finally {
      setCleaningUp(false);
    }
  };

  const toggleNotificationType = async (type: string, enabled: boolean) => {
    if (!preferences) return;
    
    try {
      const currentTypes = preferences.enabledTypes.map(t => t.toString());
      const newTypes = enabled 
        ? [...currentTypes, type]
        : currentTypes.filter(t => t !== type);
      
      await updatePreferences({
        enabledTypes: newTypes as any[]
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
    }
  };

  const updateDeliveryPreference = async (method: 'email' | 'push' | 'sms', enabled: boolean) => {
    if (!preferences) return;
    
    try {
      await updatePreferences({
        [method]: enabled
      });
    } catch (error) {
      console.error('Error updating delivery preferences:', error);
    }
  };

  const stats = {
    total: notifications.length,
    unread: unreadCount,
    read: notifications.length - unreadCount,
    byType: notifications.reduce((acc, notification) => {
      const type = notification.type;
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Notificações</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie suas notificações e preferências
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Configurações
              </button>
              
              <button
                onClick={handleCleanupExpired}
                disabled={cleaningUp}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                {cleaningUp ? 'Limpando...' : 'Limpar Expiradas'}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Não lidas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.unread}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Lidas</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats.read}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm3 3a1 1 0 112 0v6a1 1 0 11-2 0V9zm4 0a1 1 0 112 0v6a1 1 0 11-2 0V9z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Tipos ativos</dt>
                      <dd className="text-lg font-medium text-gray-900">{Object.keys(stats.byType).length}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg">
              <NotificationsList className="p-6" />
            </div>
          </div>

          {/* Settings Sidebar */}
          {showSettings && preferences && (
            <div className="lg:col-span-1">
              <div className="bg-white shadow rounded-lg p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações</h3>
                
                {/* Delivery Methods */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Métodos de Entrega</h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.push}
                        onChange={(e) => updateDeliveryPreference('push', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notificações Push</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.email}
                        onChange={(e) => updateDeliveryPreference('email', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">Notificações por Email</span>
                    </label>
                    
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={preferences.sms}
                        onChange={(e) => updateDeliveryPreference('sms', e.target.checked)}
                        className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700">SMS (em breve)</span>
                    </label>
                  </div>
                </div>

                {/* Notification Types */}
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Tipos de Notificação</h4>
                  <div className="space-y-3">
                    {[
                      { key: 'event', label: 'Eventos', icon: '📅' },
                      { key: 'blog', label: 'Blog Posts', icon: '📖' },
                      { key: 'project', label: 'Projetos', icon: '🎯' },
                      { key: 'live_stream', label: 'Transmissões', icon: '📺' },
                      { key: 'custom', label: 'Comunicados', icon: '💬' },
                      { key: 'announcement', label: 'Avisos', icon: '📢' }
                    ].map((type) => (
                      <label key={type.key} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={preferences.enabledTypes.includes(type.key as any)}
                          onChange={(e) => toggleNotificationType(type.key, e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                        />
                        <span className="ml-2 text-sm text-gray-700">
                          {type.icon} {type.label}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Stats by Type */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Estatísticas por Tipo</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.byType).map(([type, count]) => (
                      <div key={type} className="flex justify-between text-sm">
                        <span className="text-gray-600 capitalize">{type.replace('_', ' ')}</span>
                        <span className="font-medium text-gray-900">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};