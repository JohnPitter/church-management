// Infrastructure Service - Firebase Audit Service
// Implementation for audit logging

import { IAuditService, AuditLogEntry } from '../../domain/services/IAuditService';
import { db } from '../../config/firebase';
import { collection, addDoc, Timestamp, query, where, orderBy, limit as firestoreLimit, getDocs } from 'firebase/firestore';

export class FirebaseAuditService implements IAuditService {
  private readonly collectionName = 'auditLogs';

  async log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void> {
    try {
      await addDoc(collection(db, this.collectionName), {
        ...entry,
        timestamp: Timestamp.now(),
        userAgent: navigator.userAgent,
        ipAddress: 'N/A' // Would need server-side implementation for real IP
      });
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // Don't throw here - audit logging should not break the main flow
    }
  }

  async getLogsByUser(userId: string, limit?: number): Promise<AuditLogEntry[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
      );
      
      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapToAuditLogEntry(doc.data()));
    } catch (error) {
      console.error('Error getting logs by user:', error);
      return [];
    }
  }

  async getLogsByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('entityType', '==', entityType),
        where('entityId', '==', entityId),
        orderBy('timestamp', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapToAuditLogEntry(doc.data()));
    } catch (error) {
      console.error('Error getting logs by entity:', error);
      return [];
    }
  }

  async getLogsByAction(action: string, limit?: number): Promise<AuditLogEntry[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        where('action', '==', action),
        orderBy('timestamp', 'desc')
      );
      
      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapToAuditLogEntry(doc.data()));
    } catch (error) {
      console.error('Error getting logs by action:', error);
      return [];
    }
  }

  async getRecentLogs(limit?: number): Promise<AuditLogEntry[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('timestamp', 'desc')
      );
      
      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => this.mapToAuditLogEntry(doc.data()));
    } catch (error) {
      console.error('Error getting recent logs:', error);
      return [];
    }
  }

  private mapToAuditLogEntry(data: any): AuditLogEntry {
    return {
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      entityName: data.entityName,
      oldValues: data.oldValues,
      newValues: data.newValues,
      details: data.details,
      timestamp: data.timestamp?.toDate() || new Date(),
      userAgent: data.userAgent,
      ipAddress: data.ipAddress
    };
  }
}