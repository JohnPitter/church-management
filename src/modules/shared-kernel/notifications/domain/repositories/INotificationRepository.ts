// Domain Repository Interface - Notification Repository
// Defines the contract for notification data operations

import { Notification, NotificationPreferences } from '../entities/Notification';

export interface INotificationRepository {
  // Basic CRUD operations
  create(notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification>;
  findById(id: string): Promise<Notification | null>;
  update(id: string, data: Partial<Notification>): Promise<Notification>;
  delete(id: string): Promise<void>;
  
  // User-specific operations
  findByUserId(userId: string, limit?: number): Promise<Notification[]>;
  findUnreadByUserId(userId: string): Promise<Notification[]>;
  markAsRead(id: string): Promise<void>;
  markAllAsReadForUser(userId: string): Promise<void>;
  
  // Bulk operations
  createBulk(notifications: Array<Omit<Notification, 'id' | 'createdAt'>>): Promise<Notification[]>;
  deleteExpired(): Promise<number>;
  
  // Statistics
  countUnreadForUser(userId: string): Promise<number>;
  
  // Preferences
  getUserPreferences(userId: string): Promise<NotificationPreferences | null>;
  updateUserPreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences>;
  
  // Admin operations
  findAll(limit?: number): Promise<Notification[]>;
  findByType(type: string, limit?: number): Promise<Notification[]>;
  
  // Notification broadcasting
  createForAllUsers(notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>): Promise<number>;
  createForUsersByRole(notification: Omit<Notification, 'id' | 'userId' | 'createdAt'>, roles: string[]): Promise<number>;
}