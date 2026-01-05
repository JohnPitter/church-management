// Infrastructure Service - Firebase Notification Service
// Stub implementation for notifications

import { INotificationService } from '../../domain/usecases/auth/RegisterUseCase';
import { db } from '../../config/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export class FirebaseNotificationService implements INotificationService {
  private readonly collectionName = 'notifications';

  async send(notification: {
    userId: string;
    title: string;
    message: string;
    type: string;
    priority: 'low' | 'medium' | 'high';
    actionUrl?: string;
  }): Promise<void> {
    try {
      await addDoc(collection(db, this.collectionName), {
        ...notification,
        read: false,
        createdAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error sending notification:', error);
      throw new Error('Failed to send notification');
    }
  }
}