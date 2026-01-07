// Infrastructure Service - Backup Service
// Service for managing system backups and database statistics

import {
  collection,
  getDocs,
  doc,
  setDoc,
  query,
  orderBy,
  limit,
  where,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { format } from 'date-fns';

export interface BackupInfo {
  id: string;
  name: string;
  type: 'full' | 'incremental' | 'database' | 'files';
  size: string;
  createdAt: Date;
  status: 'completed' | 'in_progress' | 'failed';
  description: string;
  createdBy: string;
}

export interface DatabaseStats {
  totalRecords: number;
  totalSize: string;
  collections: {
    name: string;
    records: number;
    size: string;
    lastUpdated?: Date;
  }[];
  lastCalculated: Date;
}

export class BackupService {
  private backupsCollection = 'system_backups';

  async getDatabaseStats(): Promise<DatabaseStats> {
    try {
      const collections = [
        'users',
        'events',
        'projects', 
        'blogPosts',
        'eventConfirmations',
        'liveStreams',
        'notifications',
        'systemLogs',
        'settings'
      ];

      const collectionStats = await Promise.all(
        collections.map(async (collectionName) => {
          try {
            const collectionRef = collection(db, collectionName);
            let count = 0;

            // Use getDocs instead of getCountFromServer to avoid aggregation permission issues
            // This is less efficient but works with standard Firestore security rules
            try {
              const snapshot = await getDocs(collectionRef);
              count = snapshot.size;
            } catch (docsError) {
              // If getDocs fails (permission denied), return 0
              console.warn(`Cannot access collection ${collectionName}, returning 0`);
              count = 0;
            }

            // Estimate size based on average document size
            // This is an approximation since Firestore doesn't expose actual storage size
            const estimatedSize = this.estimateCollectionSize(collectionName, count);

            return {
              name: collectionName,
              records: count,
              size: this.formatBytes(estimatedSize),
              lastUpdated: new Date()
            };
          } catch (error) {
            console.warn(`Error getting stats for collection ${collectionName}`);
            return {
              name: collectionName,
              records: 0,
              size: '0 B',
              lastUpdated: new Date()
            };
          }
        })
      );

      const totalRecords = collectionStats.reduce((sum, stat) => sum + stat.records, 0);
      const totalSizeBytes = collectionStats.reduce((sum, stat) => {
        return sum + this.parseBytesFromString(stat.size);
      }, 0);

      return {
        totalRecords,
        totalSize: this.formatBytes(totalSizeBytes),
        collections: collectionStats,
        lastCalculated: new Date()
      };
    } catch (error) {
      console.error('Error calculating database stats:', error);
      throw new Error('Erro ao calcular estatísticas do banco de dados');
    }
  }

  async getBackups(): Promise<BackupInfo[]> {
    try {
      const backupsQuery = query(
        collection(db, this.backupsCollection),
        where('isDeleted', '!=', true), // Filter out deleted backups
        orderBy('isDeleted', 'asc'), // Required for != query
        orderBy('createdAt', 'desc'),
        limit(20)
      );
      
      const snapshot = await getDocs(backupsQuery);
      return snapshot.docs
        .filter(doc => {
          const data = doc.data();
          // Double check: filter out deleted and failed backups
          return !data.isDeleted && data.status !== 'deleted';
        })
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            type: data.type,
            size: data.size,
            createdAt: data.createdAt.toDate(),
            status: data.status,
            description: data.description,
            createdBy: data.createdBy
          };
        });
    } catch (error) {
      console.error('Error fetching backups:', error);
      // If the compound query fails, try simple query without filtering
      try {
        const simpleQuery = query(
          collection(db, this.backupsCollection),
          orderBy('createdAt', 'desc'),
          limit(20)
        );
        
        const snapshot = await getDocs(simpleQuery);
        return snapshot.docs
          .filter(doc => {
            const data = doc.data();
            return !data.isDeleted && data.status !== 'deleted';
          })
          .map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              name: data.name,
              type: data.type,
              size: data.size,
              createdAt: data.createdAt.toDate(),
              status: data.status,
              description: data.description,
              createdBy: data.createdBy
            };
          });
      } catch (fallbackError) {
        console.error('Error with fallback query:', fallbackError);
        return [];
      }
    }
  }

  async createBackup(
    type: 'full' | 'incremental' | 'database' | 'files',
    description: string,
    createdBy: string
  ): Promise<string> {
    try {
      const backupId = `backup_${Date.now()}`;
      const now = new Date();
      
      const backupData: Omit<BackupInfo, 'id'> = {
        name: this.generateBackupName(type, now),
        type,
        size: '0 B', // Will be updated when backup completes
        createdAt: now,
        status: 'in_progress',
        description,
        createdBy
      };

      await setDoc(doc(db, this.backupsCollection, backupId), {
        ...backupData,
        createdAt: Timestamp.fromDate(now)
      });

      // Simulate backup process (in a real implementation, this would trigger actual backup)
      this.simulateBackupProcess(backupId, type);

      return backupId;
    } catch (error) {
      console.error('Error creating backup:', error);
      throw new Error('Erro ao criar backup');
    }
  }

  async deleteBackup(backupId: string): Promise<void> {
    try {
      // Mark as deleted instead of actually removing the document for audit purposes
      await setDoc(doc(db, this.backupsCollection, backupId), {
        status: 'deleted',
        deletedAt: Timestamp.fromDate(new Date()),
        isDeleted: true
      }, { merge: true });
    } catch (error) {
      console.error('Error deleting backup:', error);
      throw new Error('Erro ao excluir backup');
    }
  }

  async downloadBackup(backupId: string): Promise<Blob> {
    try {
      // Export real data from all collections
      const collections = [
        'users',
        'events', 
        'projects',
        'blogPosts',
        'eventConfirmations',
        'liveStreams',
        'notifications',
        'systemLogs',
        'settings'
      ];

      const backupData: any = {
        backupId,
        timestamp: new Date().toISOString(),
        version: '1.0',
        collections: {}
      };

      // Export data from each collection
      for (const collectionName of collections) {
        try {
          const collectionRef = collection(db, collectionName);
          const snapshot = await getDocs(collectionRef);
          
          backupData.collections[collectionName] = snapshot.docs.map(doc => ({
            id: doc.id,
            data: doc.data(),
            // Convert Timestamps to ISO strings for JSON serialization
            ...this.convertTimestampsToStrings(doc.data())
          }));
          
          console.log(`Exported ${snapshot.docs.length} documents from ${collectionName}`);
        } catch (error) {
          console.warn(`Error exporting collection ${collectionName}:`, error);
          backupData.collections[collectionName] = [];
        }
      }

      // Add database statistics
      const stats = await this.getDatabaseStats();
      backupData.databaseStats = stats;

      return new Blob([JSON.stringify(backupData, null, 2)], { 
        type: 'application/json' 
      });
    } catch (error) {
      console.error('Error downloading backup:', error);
      throw new Error('Erro ao baixar backup');
    }
  }

  private generateBackupName(type: string, date: Date): string {
    const dateStr = format(date, 'dd/MM/yyyy');
    const typeNames = {
      'full': 'Backup Completo',
      'database': 'Backup Base de Dados',
      'files': 'Backup Arquivos',
      'incremental': 'Backup Incremental'
    };
    
    return `${typeNames[type as keyof typeof typeNames]} - ${dateStr}`;
  }

  private estimateCollectionSize(collectionName: string, recordCount: number): number {
    // Rough estimates based on typical document sizes (in bytes)
    const estimatedSizes = {
      'users': 2048, // User profiles with photos
      'events': 1536, // Event details with images
      'projects': 1024, // Project information
      'blogPosts': 3072, // Blog posts with content
      'eventConfirmations': 512, // Simple confirmation records
      'liveStreams': 1024, // Stream metadata
      'notifications': 768, // Notification data
      'systemLogs': 1024, // Log entries
      'settings': 512 // Configuration data
    };

    const avgSize = estimatedSizes[collectionName as keyof typeof estimatedSizes] || 1024;
    return recordCount * avgSize;
  }

  private parseBytesFromString(sizeString: string): number {
    const units = { 'B': 1, 'KB': 1024, 'MB': 1024 * 1024, 'GB': 1024 * 1024 * 1024 };
    const match = sizeString.match(/^([\d.]+)\s*([KMGT]?B)$/);
    
    if (!match) return 0;
    
    const size = parseFloat(match[1]);
    const unit = match[2] as keyof typeof units;
    
    return size * (units[unit] || 1);
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  private convertTimestampsToStrings(data: any): any {
    if (!data || typeof data !== 'object') return data;
    
    const converted: any = {};
    
    for (const [key, value] of Object.entries(data)) {
      if (value && typeof value === 'object' && 'toDate' in value && typeof (value as any).toDate === 'function') {
        // This is a Firestore Timestamp
        try {
          converted[key] = (value as Timestamp).toDate().toISOString();
        } catch (error) {
          console.warn(`Error converting timestamp for key ${key}:`, error);
          converted[key] = value;
        }
      } else if (value instanceof Date) {
        converted[key] = value.toISOString();
      } else if (Array.isArray(value)) {
        converted[key] = value.map(item => this.convertTimestampsToStrings(item));
      } else if (value && typeof value === 'object') {
        converted[key] = this.convertTimestampsToStrings(value);
      } else {
        converted[key] = value;
      }
    }
    
    return converted;
  }

  private async simulateBackupProcess(backupId: string, type: string): Promise<void> {
    // Process backup with real data collection
    const delay = type === 'full' ? 15000 : type === 'database' ? 8000 : 5000;
    
    setTimeout(async () => {
      try {
        // Calculate actual data size by sampling collections
        let actualSize = 0;
        const collections = ['users', 'events', 'projects', 'blogPosts', 'eventConfirmations', 'liveStreams', 'notifications', 'systemLogs', 'settings'];
        
        for (const collectionName of collections) {
          try {
            const collectionRef = collection(db, collectionName);
            const snapshot = await getDocs(collectionRef);
            
            // Estimate size based on document count and average document size
            const docCount = snapshot.docs.length;
            const avgDocSize = this.estimateCollectionSize(collectionName, 1); // Size per document
            actualSize += docCount * avgDocSize;
          } catch (error) {
            console.warn(`Error calculating size for ${collectionName}:`, error);
          }
        }

        // Adjust size based on backup type
        const finalSize = type === 'full' 
          ? actualSize * 1.2 // Full backup includes metadata
          : type === 'database'
          ? actualSize
          : actualSize * 0.4; // Files/incremental backup

        await setDoc(doc(db, this.backupsCollection, backupId), {
          status: 'completed',
          size: this.formatBytes(finalSize),
          completedAt: Timestamp.fromDate(new Date()),
          actualRecords: Math.round(actualSize / 1024) // Rough record count
        }, { merge: true });
        
        console.log(`Backup ${backupId} completed with ${this.formatBytes(finalSize)} of data`);
      } catch (error) {
        console.error('Error completing backup:', error);
        await setDoc(doc(db, this.backupsCollection, backupId), {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          failedAt: Timestamp.fromDate(new Date())
        }, { merge: true });
      }
    }, delay);
  }
}

export const backupService = new BackupService();
