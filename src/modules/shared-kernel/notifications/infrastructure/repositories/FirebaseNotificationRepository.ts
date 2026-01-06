// Data Repository Implementation - Firebase Notification Repository
// Complete implementation for notification data operations

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp,
  writeBatch,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { INotificationRepository } from '@modules/shared-kernel/notifications/domain/repositories/INotificationRepository';
import { Notification, NotificationPreferences, NotificationStatus, NotificationType } from '@modules/shared-kernel/notifications/domain/entities/Notification';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';

export class FirebaseNotificationRepository implements INotificationRepository {
  private readonly notificationsCollection = 'notifications';
  private readonly preferencesCollection = 'notificationPreferences';
  private readonly userRepository = new FirebaseUserRepository();

  // Helper method to remove undefined fields for Firestore compatibility
  private removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }

  async create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> {
    try {
      // Remove undefined fields for Firestore compatibility
      const cleanNotification = this.removeUndefinedFields(notification);
      
      const notificationData = {
        ...cleanNotification,
        createdAt: Timestamp.now(),
        readAt: cleanNotification.readAt ? Timestamp.fromDate(cleanNotification.readAt) : null,
        expiresAt: cleanNotification.expiresAt ? Timestamp.fromDate(cleanNotification.expiresAt) : null
      };

      const docRef = await addDoc(collection(db, this.notificationsCollection), notificationData);
      
      return {
        id: docRef.id,
        ...notification,
        createdAt: new Date()
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      throw new Error('Erro ao criar notificação');
    }
  }

  async findById(id: string): Promise<Notification | null> {
    try {
      const docRef = doc(db, this.notificationsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToNotification(id, docSnap.data());
    } catch (error) {
      console.error('Error finding notification by id:', error);
      throw new Error('Erro ao buscar notificação');
    }
  }

  async update(id: string, data: Partial<Notification>): Promise<Notification> {
    try {
      const updateData: any = { ...data };
      
      // Convert dates to Timestamps
      if (data.readAt) {
        updateData.readAt = Timestamp.fromDate(data.readAt);
      }
      if (data.expiresAt) {
        updateData.expiresAt = Timestamp.fromDate(data.expiresAt);
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.notificationsCollection, id), updateData);

      const updatedNotification = await this.findById(id);
      if (!updatedNotification) {
        throw new Error('Notificação não encontrada após atualização');
      }

      return updatedNotification;
    } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Erro ao atualizar notificação');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.notificationsCollection, id));
    } catch (error) {
      console.error('Error deleting notification:', error);
      throw new Error('Erro ao deletar notificação');
    }
  }

  async findByUserId(userId: string, limit?: number): Promise<Notification[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      ];

      if (limit) {
        constraints.push(firestoreLimit(limit));
      }

      const q = query(collection(db, this.notificationsCollection), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToNotification(doc.id, doc.data())
      );
    } catch (error: any) {
      console.error('Error finding notifications by user id:', error);
      
      // If it's an index error, provide a helpful message
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Firestore indexes are still building. This is normal for new collections.');
        // Return empty array for now while indexes are building
        return [];
      }
      
      throw new Error('Erro ao buscar notificações do usuário');
    }
  }

  async findUnreadByUserId(userId: string): Promise<Notification[]> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('status', '==', NotificationStatus.Unread),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToNotification(doc.id, doc.data())
      );
    } catch (error: any) {
      console.error('Error finding unread notifications:', error);
      
      // If it's an index error, provide a helpful message
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Firestore indexes are still building. This is normal for new collections.');
        return [];
      }
      
      throw new Error('Erro ao buscar notificações não lidas');
    }
  }

  async markAsRead(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.notificationsCollection, id), {
        status: NotificationStatus.Read,
        readAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw new Error('Erro ao marcar notificação como lida');
    }
  }

  async markAllAsReadForUser(userId: string): Promise<void> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('status', '==', NotificationStatus.Unread)
      );
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      const now = Timestamp.now();

      querySnapshot.docs.forEach((doc) => {
        batch.update(doc.ref, {
          status: NotificationStatus.Read,
          readAt: now
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw new Error('Erro ao marcar todas as notificações como lidas');
    }
  }

  async createBulk(notifications: Array<Omit<Notification, 'id' | 'createdAt'>>): Promise<Notification[]> {
    try {
      if (notifications.length === 0) {
        return [];
      }

      const createdNotifications: Notification[] = [];
      const now = Timestamp.now();
      
      // Process in batches of 500 (Firestore limit)
      const batchSize = 500;
      
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = writeBatch(db);
        const batchNotifications = notifications.slice(i, i + batchSize);
        
        for (const notification of batchNotifications) {
          const cleanNotification = this.removeUndefinedFields(notification);
          const docRef = doc(collection(db, this.notificationsCollection));
          const notificationData = {
            ...cleanNotification,
            createdAt: now,
            readAt: cleanNotification.readAt ? Timestamp.fromDate(cleanNotification.readAt) : null,
            expiresAt: cleanNotification.expiresAt ? Timestamp.fromDate(cleanNotification.expiresAt) : null
          };

          batch.set(docRef, notificationData);
          
          createdNotifications.push({
            id: docRef.id,
            ...notification,
            createdAt: new Date()
          });
        }

        await batch.commit();
      }

      return createdNotifications;
    } catch (error) {
      console.error('Error creating bulk notifications:', error);
      throw new Error('Erro ao criar notificações em lote');
    }
  }

  async deleteExpired(): Promise<number> {
    try {
      const now = Timestamp.now();
      const q = query(
        collection(db, this.notificationsCollection),
        where('expiresAt', '<=', now)
      );
      const querySnapshot = await getDocs(q);

      const batch = writeBatch(db);
      querySnapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return querySnapshot.size;
    } catch (error) {
      console.error('Error deleting expired notifications:', error);
      throw new Error('Erro ao deletar notificações expiradas');
    }
  }

  async countUnreadForUser(userId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.notificationsCollection),
        where('userId', '==', userId),
        where('status', '==', NotificationStatus.Unread)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error: any) {
      console.error('Error counting unread notifications:', error);
      
      // If it's an index error, provide a helpful message
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        console.warn('Firestore indexes are still building. This is normal for new collections.');
        return 0;
      }
      
      throw new Error('Erro ao contar notificações não lidas');
    }
  }

  async getUserPreferences(userId: string): Promise<NotificationPreferences | null> {
    try {
      const docRef = doc(db, this.preferencesCollection, userId);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Return default preferences
        return {
          userId,
          email: true,
          push: true,
          sms: false,
          enabledTypes: Object.values(NotificationType),
          updatedAt: new Date()
        };
      }

      const data = docSnap.data();
      return {
        userId: docSnap.id,
        email: data.email,
        push: data.push,
        sms: data.sms,
        enabledTypes: data.enabledTypes,
        quietHoursStart: data.quietHoursStart,
        quietHoursEnd: data.quietHoursEnd,
        updatedAt: data.updatedAt?.toDate() || new Date()
      };
    } catch (error: any) {
      console.warn('Error getting notification preferences:', error);

      // If offline or network error, return default preferences instead of throwing
      // Check multiple error conditions that indicate offline/network issues
      const isOfflineError =
        error?.code === 'unavailable' ||
        error?.code === 'failed-precondition' ||
        error?.message?.toLowerCase().includes('offline') ||
        error?.message?.toLowerCase().includes('network') ||
        error?.message?.toLowerCase().includes('failed to get document');

      if (isOfflineError) {
        console.warn('Firestore offline or unavailable - returning default notification preferences');
        return {
          userId,
          email: true,
          push: true,
          sms: false,
          enabledTypes: Object.values(NotificationType),
          updatedAt: new Date()
        };
      }

      // For other errors, still return default preferences but log as error
      console.error('Unexpected error fetching preferences, using defaults:', error);
      return {
        userId,
        email: true,
        push: true,
        sms: false,
        enabledTypes: Object.values(NotificationType),
        updatedAt: new Date()
      };
    }
  }

  async updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
    try {
      const updateData = {
        ...preferences,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, this.preferencesCollection, userId), updateData);

      const updatedPreferences = await this.getUserPreferences(userId);
      if (!updatedPreferences) {
        throw new Error('Preferências não encontradas após atualização');
      }

      return updatedPreferences;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw new Error('Erro ao atualizar preferências de notificação');
    }
  }

  async findAll(limit?: number): Promise<Notification[]> {
    try {
      const constraints: QueryConstraint[] = [orderBy('createdAt', 'desc')];

      if (limit) {
        constraints.push(firestoreLimit(limit));
      }

      const q = query(collection(db, this.notificationsCollection), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToNotification(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all notifications:', error);
      throw new Error('Erro ao buscar todas as notificações');
    }
  }

  async findByType(type: string, limit?: number): Promise<Notification[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('type', '==', type),
        orderBy('createdAt', 'desc')
      ];

      if (limit) {
        constraints.push(firestoreLimit(limit));
      }

      const q = query(collection(db, this.notificationsCollection), ...constraints);
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToNotification(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding notifications by type:', error);
      throw new Error('Erro ao buscar notificações por tipo');
    }
  }

  async createForAllUsers(notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>): Promise<number> {
    try {
      // Get all approved users
      const users = await this.userRepository.findAll();
      const approvedUsers = users.filter(user => user.status === 'approved');

      if (approvedUsers.length === 0) {
        return 0;
      }

      const notifications = approvedUsers.map(user => ({
        ...notification,
        userId: user.id
      }));

      await this.createBulk(notifications);
      return approvedUsers.length;
    } catch (error) {
      console.error('Error creating notifications for all users:', error);
      throw new Error('Erro ao criar notificações para todos os usuários');
    }
  }

  async createForUsersByRole(notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>, roles: string[]): Promise<number> {
    try {
      // Get users with specified roles
      const users = await this.userRepository.findAll();
      const targetUsers = users.filter(user => 
        user.status === 'approved' && roles.includes(user.role)
      );

      const notifications = targetUsers.map(user => ({
        ...notification,
        userId: user.id
      }));

      await this.createBulk(notifications);
      return targetUsers.length;
    } catch (error) {
      console.error('Error creating notifications for users by role:', error);
      throw new Error('Erro ao criar notificações para usuários por função');
    }
  }

  private mapToNotification(id: string, data: any): Notification {
    return {
      id,
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      priority: data.priority,
      status: data.status,
      actionUrl: data.actionUrl,
      actionText: data.actionText,
      imageUrl: data.imageUrl,
      targetId: data.targetId,
      targetType: data.targetType,
      metadata: data.metadata,
      readAt: data.readAt?.toDate(),
      expiresAt: data.expiresAt?.toDate(),
      createdAt: data.createdAt?.toDate() || new Date()
    };
  }
}