// Domain Service Interface - Audit Service
// Defines the contract for audit logging

export interface AuditLogEntry {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  details?: Record<string, any>;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface IAuditService {
  log(entry: Omit<AuditLogEntry, 'timestamp'>): Promise<void>;
  getLogsByUser(userId: string, limit?: number): Promise<AuditLogEntry[]>;
  getLogsByEntity(entityType: string, entityId: string): Promise<AuditLogEntry[]>;
  getLogsByAction(action: string, limit?: number): Promise<AuditLogEntry[]>;
  getRecentLogs(limit?: number): Promise<AuditLogEntry[]>;
}