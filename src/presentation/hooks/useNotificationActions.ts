// Presentation Hook - Notification Actions
// Custom hook for notification operations

import { useCallback } from 'react';
import { NotificationService } from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService';
import { useNotifications } from '../contexts/NotificationContext';

export const useNotificationActions = () => {
  const { refreshNotifications } = useNotifications();
  const notificationService = new NotificationService();

  // Automatic notification triggers for content creation
  const notifyNewEvent = useCallback(async (eventId: string, eventTitle: string, eventDate: Date) => {
    try {
      const count = await notificationService.notifyNewEvent(eventId, eventTitle, eventDate);
      await refreshNotifications();
      return count;
    } catch (error) {
      console.error('Error notifying new event:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotifications]);

  const notifyNewBlogPost = useCallback(async (postId: string, postTitle: string, postImageUrl?: string) => {
    try {
      const count = await notificationService.notifyNewBlogPost(postId, postTitle, postImageUrl);
      await refreshNotifications();
      return count;
    } catch (error) {
      console.error('Error notifying new blog post:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotifications]);

  const notifyNewProject = useCallback(async (projectId: string, projectName: string) => {
    try {
      const count = await notificationService.notifyNewProject(projectId, projectName);
      await refreshNotifications();
      return count;
    } catch (error) {
      console.error('Error notifying new project:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotifications]);

  const notifyNewLiveStream = useCallback(async (streamId: string, streamTitle: string, streamImageUrl?: string) => {
    try {
      const count = await notificationService.notifyNewLiveStream(streamId, streamTitle, streamImageUrl);
      await refreshNotifications();
      return count;
    } catch (error) {
      console.error('Error notifying new live stream:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotifications]);

  const cleanupExpiredNotifications = useCallback(async () => {
    try {
      const count = await notificationService.cleanupExpiredNotifications();
      await refreshNotifications();
      return count;
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw error;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshNotifications]);

  return {
    notifyNewEvent,
    notifyNewBlogPost,
    notifyNewProject,
    notifyNewLiveStream,
    cleanupExpiredNotifications
  };
};