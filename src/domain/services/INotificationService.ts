// Domain Service Interface - Notification Service
// Defines the contract for notification business operations

import { Notification, NotificationPriority } from '../entities/Notification';

export interface INotificationService {
  // Automatic notifications
  notifyNewEvent(eventId: string, eventTitle: string, eventDate: Date): Promise<number>;
  notifyNewBlogPost(postId: string, postTitle: string, postImageUrl?: string): Promise<number>;
  notifyNewProject(projectId: string, projectName: string): Promise<number>;
  notifyNewLiveStream(streamId: string, streamTitle: string, streamImageUrl?: string): Promise<number>;
  
  // Custom notifications
  createCustomNotification(
    title: string,
    message: string,
    targetUsers: 'all' | 'roles' | 'specific',
    options?: {
      roles?: string[];
      userIds?: string[];
      priority?: NotificationPriority;
      actionUrl?: string;
      actionText?: string;
      imageUrl?: string;
      expiresAt?: Date;
    }
  ): Promise<number>;
  
  // User operations
  getUserNotifications(userId: string, limit?: number): Promise<Notification[]>;
  getUnreadNotifications(userId: string): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  
  // Maintenance
  cleanupExpiredNotifications(): Promise<number>;
}