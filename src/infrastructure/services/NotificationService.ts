// Infrastructure Service - Notification Service
// Complete implementation for notification business operations

import { INotificationService } from '../../domain/services/INotificationService';
import { FirebaseNotificationRepository } from '../../data/repositories/FirebaseNotificationRepository';
import { FirebaseUserRepository } from '../../data/repositories/FirebaseUserRepository';
import { 
  Notification, 
  NotificationEntity, 
  NotificationPriority 
} from '../../domain/entities/Notification';

export class NotificationService implements INotificationService {
  private notificationRepository = new FirebaseNotificationRepository();
  private userRepository = new FirebaseUserRepository();

  async notifyNewEvent(eventId: string, eventTitle: string, eventDate: Date): Promise<number> {
    try {
      const notification = NotificationEntity.createFromEvent(eventId, eventTitle, eventDate);
      return await this.notificationRepository.createForAllUsers(notification);
    } catch (error) {
      console.error('Error notifying new event:', error);
      throw new Error('Erro ao notificar novo evento');
    }
  }

  async notifyNewBlogPost(postId: string, postTitle: string, postImageUrl?: string): Promise<number> {
    try {
      const notification = NotificationEntity.createFromBlogPost(postId, postTitle, postImageUrl);
      return await this.notificationRepository.createForAllUsers(notification);
    } catch (error) {
      console.error('Error notifying new blog post:', error);
      throw new Error('Erro ao notificar nova postagem');
    }
  }

  async notifyNewProject(projectId: string, projectName: string): Promise<number> {
    try {
      const notification = NotificationEntity.createFromProject(projectId, projectName);
      return await this.notificationRepository.createForAllUsers(notification);
    } catch (error) {
      console.error('Error notifying new project:', error);
      throw new Error('Erro ao notificar novo projeto');
    }
  }

  async notifyProjectApproval(userId: string, projectId: string, projectName: string): Promise<void> {
    try {
      const notification = NotificationEntity.createFromProjectApproval(projectId, projectName);
      await this.notificationRepository.create({
        ...notification,
        userId,
        createdAt: new Date()
      } as Notification);
    } catch (error) {
      console.error('Error notifying project approval:', error);
      throw new Error('Erro ao notificar aprovação do projeto');
    }
  }

  async notifyProjectRejection(userId: string, projectId: string, projectName: string): Promise<void> {
    try {
      const notification = NotificationEntity.createFromProjectRejection(projectId, projectName);
      await this.notificationRepository.create({
        ...notification,
        userId,
        createdAt: new Date()
      } as Notification);
    } catch (error) {
      console.error('Error notifying project rejection:', error);
      throw new Error('Erro ao notificar rejeição do projeto');
    }
  }

  async notifyNewLiveStream(streamId: string, streamTitle: string, streamImageUrl?: string): Promise<number> {
    try {
      const notification = NotificationEntity.createFromLiveStream(streamId, streamTitle, streamImageUrl);
      return await this.notificationRepository.createForAllUsers(notification);
    } catch (error) {
      console.error('Error notifying new live stream:', error);
      throw new Error('Erro ao notificar nova transmissão');
    }
  }

  async createCustomNotification(
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
  ): Promise<number> {
    try {
      const notification = NotificationEntity.createCustom(title, message, options?.priority, {
        actionUrl: options?.actionUrl,
        actionText: options?.actionText,
        imageUrl: options?.imageUrl,
        expiresAt: options?.expiresAt
      });

      switch (targetUsers) {
        case 'all':
          return await this.notificationRepository.createForAllUsers(notification);
          
        case 'roles':
          if (!options?.roles || options.roles.length === 0) {
            throw new Error('Roles devem ser especificadas para este tipo de notificação');
          }
          return await this.notificationRepository.createForUsersByRole(notification, options.roles);
          
        case 'specific':
          if (!options?.userIds || options.userIds.length === 0) {
            throw new Error('IDs dos usuários devem ser especificados para este tipo de notificação');
          }
          
          const notifications = options.userIds.map(userId => ({
            ...notification,
            userId
          }));
          
          await this.notificationRepository.createBulk(notifications);
          return notifications.length;
          
        default:
          throw new Error('Tipo de target inválido');
      }
    } catch (error) {
      console.error('Error creating custom notification:', error);
      throw new Error('Erro ao criar notificação personalizada');
    }
  }

  async getUserNotifications(userId: string, limit?: number): Promise<Notification[]> {
    try {
      const notifications = await this.notificationRepository.findByUserId(userId, limit);
      // Filter out expired notifications
      return notifications.filter(notification => 
        NotificationEntity.canDisplay(notification)
      );
    } catch (error) {
      console.error('Error getting user notifications:', error);
      throw new Error('Erro ao buscar notificações do usuário');
    }
  }

  async getUnreadNotifications(userId: string): Promise<Notification[]> {
    try {
      const notifications = await this.notificationRepository.findUnreadByUserId(userId);
      // Filter out expired notifications
      return notifications.filter(notification => 
        NotificationEntity.canDisplay(notification)
      );
    } catch (error) {
      console.error('Error getting unread notifications:', error);
      throw new Error('Erro ao buscar notificações não lidas');
    }
  }

  async markAsRead(notificationId: string): Promise<void> {
    try {
      await this.notificationRepository.markAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Erro ao marcar notificação como lida');
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    try {
      await this.notificationRepository.markAllAsReadForUser(userId);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Erro ao marcar todas as notificações como lidas');
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      return await this.notificationRepository.countUnreadForUser(userId);
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw new Error('Erro ao contar notificações não lidas');
    }
  }

  async cleanupExpiredNotifications(): Promise<number> {
    try {
      return await this.notificationRepository.deleteExpired();
    } catch (error) {
      console.error('Error cleaning up expired notifications:', error);
      throw new Error('Erro ao limpar notificações expiradas');
    }
  }

  async notifyHelpRequest(
    recipientUserId: string,
    requestId: string,
    requesterName: string,
    requesterSpecialty: string,
    requestTitle: string,
    requestPriority: string
  ): Promise<void> {
    try {
      const notification = NotificationEntity.createFromHelpRequest(
        requestId,
        requesterName,
        requesterSpecialty,
        requestTitle,
        requestPriority
      );

      await this.notificationRepository.create({
        ...notification,
        userId: recipientUserId,
        createdAt: new Date()
      } as Notification);

      console.log(`Notification created for user ${recipientUserId} about help request ${requestId}`);
    } catch (error) {
      console.error('Error notifying help request:', error);
      throw new Error('Erro ao notificar pedido de ajuda');
    }
  }
}