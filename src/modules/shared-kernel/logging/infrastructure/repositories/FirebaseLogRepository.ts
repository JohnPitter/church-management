// Data Layer - Firebase Log Repository
// Implements system logging with Firebase

import { 
  collection, 
  getDocs, 
  addDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  limit,
  Timestamp,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/config/firebase';

export interface SystemLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  category: 'auth' | 'database' | 'api' | 'system' | 'user_action' | 'security' | 'ong';
  message: string;
  details?: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class FirebaseLogRepository {
  private collectionName = 'systemLogs';

  async create(log: Omit<SystemLog, 'id'>): Promise<SystemLog> {
    try {
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...log,
        timestamp: Timestamp.fromDate(log.timestamp)
      });
      
      return {
        ...log,
        id: docRef.id
      };
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        // Silently fail for permission errors - logging is optional
        // Note: System logging disabled due to Firestore rules configuration
        return {
          ...log,
          id: `local-${Date.now()}`
        };
      }
      
      console.error('Error creating log:', error);
      throw new Error('Erro ao criar log');
    }
  }

  async findAll(): Promise<SystemLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc'),
        limit(1000) // Limit to last 1000 logs
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLog(doc.id, doc.data())
      );
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot read systemLogs collection (Firestore rules not configured)');
        return [];
      }
      
      console.error('Error finding logs:', error);
      throw new Error('Erro ao buscar logs');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<SystemLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '>=', Timestamp.fromDate(startDate)),
        where('timestamp', '<=', Timestamp.fromDate(endDate)),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLog(doc.id, doc.data())
      );
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot read systemLogs collection (Firestore rules not configured)');
        return [];
      }
      
      console.error('Error finding logs by date range:', error);
      throw new Error('Erro ao buscar logs por período');
    }
  }

  async findByLevel(level: string): Promise<SystemLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('level', '==', level),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLog(doc.id, doc.data())
      );
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot read systemLogs collection (Firestore rules not configured)');
        return [];
      }
      
      console.error('Error finding logs by level:', error);
      throw new Error('Erro ao buscar logs por nível');
    }
  }

  async findByCategory(category: string): Promise<SystemLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        orderBy('timestamp', 'desc'),
        limit(500)
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLog(doc.id, doc.data())
      );
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot read systemLogs collection (Firestore rules not configured)');
        return [];
      }
      
      console.error('Error finding logs by category:', error);
      throw new Error('Erro ao buscar logs por categoria');
    }
  }

  async findByUser(userId: string): Promise<SystemLog[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLog(doc.id, doc.data())
      );
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot read systemLogs collection (Firestore rules not configured)');
        return [];
      }
      
      console.error('Error finding logs by user:', error);
      throw new Error('Erro ao buscar logs por usuário');
    }
  }

  async clearAll(): Promise<void> {
    try {
      const querySnapshot = await getDocs(collection(db, this.collectionName));
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot clear systemLogs collection (Firestore rules not configured)');
        return;
      }
      
      console.error('Error clearing logs:', error);
      throw new Error('Erro ao limpar logs');
    }
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const q = query(
        collection(db, this.collectionName),
        where('timestamp', '<', Timestamp.fromDate(cutoffDate))
      );
      
      const querySnapshot = await getDocs(q);
      
      const deletePromises = querySnapshot.docs.map(doc => 
        deleteDoc(doc.ref)
      );
      
      await Promise.all(deletePromises);
    } catch (error: any) {
      // Check if it's a permission error
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        console.warn('System logging disabled: Cannot clear old systemLogs (Firestore rules not configured)');
        return;
      }
      
      console.error('Error clearing old logs:', error);
      throw new Error('Erro ao limpar logs antigos');
    }
  }

  private mapToLog(id: string, data: DocumentData): SystemLog {
    return {
      id,
      timestamp: data.timestamp?.toDate() || new Date(),
      level: data.level || 'info',
      category: data.category || 'system',
      message: data.message || '',
      details: data.details,
      userId: data.userId,
      userEmail: data.userEmail,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent
    };
  }

  // Utility method to log system events
  async logEvent(
    level: SystemLog['level'],
    category: SystemLog['category'],
    message: string,
    details?: string,
    userInfo?: {
      userId?: string;
      userEmail?: string;
      ipAddress?: string;
      userAgent?: string;
    }
  ): Promise<void> {
    try {
      await this.create({
        timestamp: new Date(),
        level,
        category,
        message,
        details,
        ...userInfo
      });
    } catch (error) {
      // Don't throw on logging errors to avoid breaking the app
      console.error('Failed to log event:', error);
    }
  }
}