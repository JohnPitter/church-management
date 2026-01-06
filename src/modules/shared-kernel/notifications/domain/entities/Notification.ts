// Domain Entity - Notification
// Represents system notifications with business rules

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  priority: NotificationPriority;
  status: NotificationStatus;
  actionUrl?: string;
  actionText?: string;
  imageUrl?: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, any>;
  readAt?: Date;
  expiresAt?: Date;
  createdAt: Date;
}

export enum NotificationType {
  System = 'system',
  Event = 'event',
  Project = 'project',
  Blog = 'blog',
  LiveStream = 'live_stream',
  UserRegistration = 'user_registration',
  EventReminder = 'event_reminder',
  Birthday = 'birthday',
  Announcement = 'announcement',
  Alert = 'alert',
  Custom = 'custom',
  HelpRequest = 'help_request'
}

export enum NotificationPriority {
  Low = 'low',
  Medium = 'medium',
  High = 'high',
  Urgent = 'urgent'
}

export enum NotificationStatus {
  Unread = 'unread',
  Read = 'read',
  Archived = 'archived',
  Deleted = 'deleted'
}

export interface NotificationPreferences {
  userId: string;
  email: boolean;
  push: boolean;
  sms: boolean;
  enabledTypes: NotificationType[];
  quietHoursStart?: string; // HH:mm format
  quietHoursEnd?: string;   // HH:mm format
  updatedAt: Date;
}

// Business Rules
export class NotificationEntity {
  static isUnread(notification: Notification): boolean {
    return notification.status === NotificationStatus.Unread;
  }

  static isExpired(notification: Notification): boolean {
    if (!notification.expiresAt) return false;
    return new Date() > notification.expiresAt;
  }

  static canDisplay(notification: Notification): boolean {
    return !this.isExpired(notification) && 
           notification.status !== NotificationStatus.Deleted;
  }

  static getPriorityColor(priority: NotificationPriority): string {
    const colors: Record<NotificationPriority, string> = {
      [NotificationPriority.Low]: 'gray',
      [NotificationPriority.Medium]: 'blue',
      [NotificationPriority.High]: 'yellow',
      [NotificationPriority.Urgent]: 'red'
    };
    return colors[priority];
  }

  static getPriorityIcon(priority: NotificationPriority): string {
    const icons: Record<NotificationPriority, string> = {
      [NotificationPriority.Low]: 'ℹ️',
      [NotificationPriority.Medium]: '📌',
      [NotificationPriority.High]: '⚠️',
      [NotificationPriority.Urgent]: '🚨'
    };
    return icons[priority];
  }

  static getTypeIcon(type: NotificationType): string {
    const icons: Record<NotificationType, string> = {
      [NotificationType.System]: '⚙️',
      [NotificationType.Event]: '📅',
      [NotificationType.Project]: '🎯',
      [NotificationType.Blog]: '📖',
      [NotificationType.LiveStream]: '📺',
      [NotificationType.UserRegistration]: '👤',
      [NotificationType.EventReminder]: '⏰',
      [NotificationType.Birthday]: '🎂',
      [NotificationType.Announcement]: '📢',
      [NotificationType.Alert]: '🔔',
      [NotificationType.Custom]: '💬',
      [NotificationType.HelpRequest]: '🤝'
    };
    return icons[type];
  }

  static shouldSendEmail(
    notification: Notification, 
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.email) return false;
    if (!preferences.enabledTypes.includes(notification.type)) return false;
    
    // Check priority
    if (notification.priority === NotificationPriority.Low) return false;
    
    return true;
  }

  static isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHoursStart || !preferences.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();
    
    const [startHour, startMin] = preferences.quietHoursStart.split(':').map(Number);
    const [endHour, endMin] = preferences.quietHoursEnd.split(':').map(Number);
    
    const startTime = startHour * 60 + startMin;
    const endTime = endHour * 60 + endMin;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  static groupByDate(notifications: Notification[]): Map<string, Notification[]> {
    const grouped = new Map<string, Notification[]>();
    
    notifications.forEach(notification => {
      const date = new Date(notification.createdAt);
      const key = date.toLocaleDateString('pt-BR');
      
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      
      grouped.get(key)!.push(notification);
    });

    return grouped;
  }

  static sortByPriority(notifications: Notification[]): Notification[] {
    const priorityOrder: Record<NotificationPriority, number> = {
      [NotificationPriority.Urgent]: 0,
      [NotificationPriority.High]: 1,
      [NotificationPriority.Medium]: 2,
      [NotificationPriority.Low]: 3
    };

    return [...notifications].sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by date (newest first)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  static countUnread(notifications: Notification[]): number {
    return notifications.filter(n => this.isUnread(n) && this.canDisplay(n)).length;
  }

  // Factory methods for automatic notifications
  static createFromEvent(eventId: string, eventTitle: string, eventDate: Date): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title: 'Novo Evento Disponível',
      message: `O evento "${eventTitle}" foi criado e está aberto para participação.`,
      type: NotificationType.Event,
      priority: NotificationPriority.Medium,
      status: NotificationStatus.Unread,
      actionUrl: `/events`,
      actionText: 'Ver Evento',
      targetId: eventId,
      targetType: 'event',
      expiresAt: new Date(eventDate.getTime() + 24 * 60 * 60 * 1000), // Expires 24h after event
      metadata: {
        eventTitle,
        eventDate: eventDate.toISOString()
      }
    };
  }

  static createFromBlogPost(postId: string, postTitle: string, postImageUrl?: string): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title: 'Nova Postagem no Blog',
      message: `Nova postagem disponível: "${postTitle}".`,
      type: NotificationType.Blog,
      priority: NotificationPriority.Low,
      status: NotificationStatus.Unread,
      actionUrl: `/blog`,
      actionText: 'Ler Postagem',
      imageUrl: postImageUrl,
      targetId: postId,
      targetType: 'blog_post',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Expires in 7 days
      metadata: {
        postTitle
      }
    };
  }

  static createFromProject(projectId: string, projectName: string): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title: 'Novo Projeto Disponível',
      message: `O projeto "${projectName}" está disponível para participação.`,
      type: NotificationType.Project,
      priority: NotificationPriority.Medium,
      status: NotificationStatus.Unread,
      actionUrl: `/projects`,
      actionText: 'Ver Projeto',
      targetId: projectId,
      targetType: 'project',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      metadata: {
        projectName
      }
    };
  }

  static createFromLiveStream(streamId: string, streamTitle: string, streamImageUrl?: string): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title: 'Nova Transmissão Ao Vivo',
      message: `A transmissão "${streamTitle}" está disponível.`,
      type: NotificationType.LiveStream,
      priority: NotificationPriority.High,
      status: NotificationStatus.Unread,
      actionUrl: `/live`,
      actionText: 'Assistir',
      imageUrl: streamImageUrl,
      targetId: streamId,
      targetType: 'live_stream',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // Expires in 3 days
      metadata: {
        streamTitle
      }
    };
  }

  static createFromProjectApproval(projectId: string, projectName: string): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title: 'Inscrição Aprovada!',
      message: `Sua inscrição no projeto "${projectName}" foi aprovada! Você agora pode participar.`,
      type: NotificationType.Project,
      priority: NotificationPriority.High,
      status: NotificationStatus.Unread,
      actionUrl: `/projects`,
      actionText: 'Ver Projeto',
      targetId: projectId,
      targetType: 'project_approval',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      metadata: {
        projectName,
        approvalType: 'approved'
      }
    };
  }

  static createFromProjectRejection(projectId: string, projectName: string): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title: 'Inscrição Rejeitada',
      message: `Sua inscrição no projeto "${projectName}" foi rejeitada. Entre em contato com a administração para mais informações.`,
      type: NotificationType.Project,
      priority: NotificationPriority.Medium,
      status: NotificationStatus.Unread,
      actionUrl: `/projects`,
      actionText: 'Ver Projetos',
      targetId: projectId,
      targetType: 'project_rejection',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      metadata: {
        projectName,
        approvalType: 'rejected'
      }
    };
  }

  static createCustom(
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.Medium,
    options?: {
      actionUrl?: string;
      actionText?: string;
      imageUrl?: string;
      expiresAt?: Date;
      metadata?: Record<string, any>;
    }
  ): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    return {
      title,
      message,
      type: NotificationType.Custom,
      priority,
      status: NotificationStatus.Unread,
      actionUrl: options?.actionUrl,
      actionText: options?.actionText,
      imageUrl: options?.imageUrl,
      expiresAt: options?.expiresAt || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default: 7 days
      metadata: options?.metadata
    };
  }

  static createFromHelpRequest(
    requestId: string,
    requesterName: string,
    requesterSpecialty: string,
    title: string,
    priority: string
  ): Omit<Notification, 'id' | 'userId' | 'createdAt'> {
    const priorityMap: Record<string, NotificationPriority> = {
      'urgente': NotificationPriority.Urgent,
      'alta': NotificationPriority.High,
      'media': NotificationPriority.Medium,
      'baixa': NotificationPriority.Low
    };

    return {
      title: 'Novo Pedido de Ajuda Profissional',
      message: `${requesterName} (${requesterSpecialty}) solicitou sua ajuda: "${title}"`,
      type: NotificationType.HelpRequest,
      priority: priorityMap[priority.toLowerCase()] || NotificationPriority.Medium,
      status: NotificationStatus.Unread,
      actionUrl: '/professional/help-requests',
      actionText: 'Ver Pedido',
      targetId: requestId,
      targetType: 'help_request',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // Expires in 30 days
      metadata: {
        requestId,
        requesterName,
        requesterSpecialty,
        requestTitle: title,
        requestPriority: priority
      }
    };
  }
}