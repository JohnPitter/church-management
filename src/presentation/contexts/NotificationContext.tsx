// Presentation Context - Notification Context
// Provides notification state management and operations

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Notification, NotificationPreferences } from '@modules/shared-kernel/notifications/domain/entities/Notification';
import { NotificationService } from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  // State
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences | null;
  loading: boolean;
  
  // Actions
  refreshNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  getUnreadNotifications: () => Notification[];
  
  // Admin actions
  createCustomNotification: (
    title: string,
    message: string,
    targetUsers: 'all' | 'roles' | 'specific',
    options?: {
      roles?: string[];
      userIds?: string[];
      priority?: string;
      actionUrl?: string;
      actionText?: string;
      imageUrl?: string;
      expiresAt?: Date;
    }
  ) => Promise<number>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: React.ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(false);
  
  const notificationService = new NotificationService();

  const refreshNotifications = useCallback(async () => {
    if (!currentUser) {
      setNotifications([]);
      setUnreadCount(0);
      setPreferences(null);
      return;
    }

    try {
      setLoading(true);

      // Load notifications and preferences in parallel
      const [userNotifications, userUnreadCount] = await Promise.all([
        notificationService.getUserNotifications(currentUser.id, 50),
        notificationService.getUnreadCount(currentUser.id)
      ]);

      // Get user preferences from repository directly since service doesn't have this method yet
      let userPreferences = null;
      try {
        const notificationRepository = (notificationService as any).notificationRepository;
        if (notificationRepository) {
          userPreferences = await notificationRepository.getUserPreferences(currentUser.id);
        }
      } catch (prefError) {
        console.warn('Could not load notification preferences (using defaults):', prefError);
        // Use default preferences if fetch fails
        userPreferences = {
          userId: currentUser.id,
          email: true,
          push: true,
          sms: false,
          enabledTypes: [],
          updatedAt: new Date()
        };
      }

      setNotifications(userNotifications);
      setUnreadCount(userUnreadCount);
      setPreferences(userPreferences);
    } catch (error) {
      console.error('Error refreshing notifications:', error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const markAsRead = useCallback(async (notificationId: string) => {
    if (!currentUser) return;

    try {
      await notificationService.markAsRead(notificationId);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, status: 'read' as any, readAt: new Date() }
            : notification
        )
      );
      
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const markAllAsRead = useCallback(async () => {
    if (!currentUser) return;

    try {
      await notificationService.markAllAsRead(currentUser.id);
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({
          ...notification,
          status: 'read' as any,
          readAt: notification.readAt || new Date()
        }))
      );
      
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!currentUser || !preferences) return;

    try {
      // Update preferences via repository directly since service doesn't have this method yet
      const notificationRepository = (notificationService as any).notificationRepository;
      const updatedPreferences = notificationRepository ? 
        await notificationRepository.updateUserPreferences(currentUser.id, newPreferences) :
        { ...preferences, ...newPreferences };
      
      setPreferences(updatedPreferences);
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, preferences]);

  const getUnreadNotifications = useCallback(() => {
    return notifications.filter(notification => notification.status === 'unread');
  }, [notifications]);

  const createCustomNotification = useCallback(async (
    title: string,
    message: string,
    targetUsers: 'all' | 'roles' | 'specific',
    options?: {
      roles?: string[];
      userIds?: string[];
      priority?: string;
      actionUrl?: string;
      actionText?: string;
      imageUrl?: string;
      expiresAt?: Date;
    }
  ) => {
    try {
      const result = await notificationService.createCustomNotification(
        title,
        message,
        targetUsers,
        options as any
      );
      
      // Refresh notifications to include the new one if current user is a target
      await refreshNotifications();
      
      return result;
    } catch (error) {
      console.error('Error creating custom notification:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotifications]);

  // Load notifications when user changes
  useEffect(() => {
    refreshNotifications();
  }, [refreshNotifications]);

  // Set up periodic refresh for real-time updates
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      refreshNotifications();
    }, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, [currentUser, refreshNotifications]);

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    preferences,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    getUnreadNotifications,
    createCustomNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};