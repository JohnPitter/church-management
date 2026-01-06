// Infrastructure Service - Logging Service
// Centralized logging service for system events

import { FirebaseLogRepository, SystemLog } from '@modules/shared-kernel/logging/infrastructure/repositories/FirebaseLogRepository';
import { User } from '../../domain/entities/User';

interface LogContext {
  user?: User | null;
  ipAddress?: string;
  userAgent?: string;
}

export class LoggingService {
  private logRepository: FirebaseLogRepository;
  private context: LogContext = {};

  constructor() {
    this.logRepository = new FirebaseLogRepository();
    // Try to get client IP (this is limited in browser environment)
    this.fetchClientInfo();
  }

  // Set the current user context
  setUserContext(user: User | null) {
    this.context.user = user;
  }

  // Get client information
  private async fetchClientInfo() {
    try {
      // Try to get IP from external service
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      this.context.ipAddress = data.ip;
    } catch (error) {
      // Fallback to local detection
      this.context.ipAddress = 'Unknown';
    }
    
    // Get user agent
    this.context.userAgent = navigator.userAgent;
  }

  private getUserInfo() {
    return {
      userId: this.context.user?.id,
      userEmail: this.context.user?.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    };
  }

  // Enhanced methods that accept optional user parameter
  async logInfo(category: SystemLog['category'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent('info', category, message, details, userInfo);
  }

  async logWarning(category: SystemLog['category'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent('warning', category, message, details, userInfo);
  }

  async logError(category: SystemLog['category'], message: string, details?: string, error?: Error, user?: User | null): Promise<void> {
    const errorDetails = error ? `${details || ''}\nError: ${error.message}\nStack: ${error.stack}` : details;
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent('error', category, message, errorDetails, userInfo);
  }

  async logDebug(category: SystemLog['category'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent('debug', category, message, details, userInfo);
  }

  // Specific logging methods for common operations
  async logAuth(level: SystemLog['level'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent(level, 'auth', message, details, userInfo);
  }

  async logDatabase(level: SystemLog['level'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent(level, 'database', message, details, userInfo);
  }

  async logUserAction(message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent('info', 'user_action', message, details, userInfo);
  }

  async logSecurity(level: SystemLog['level'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent(level, 'security', message, details, userInfo);
  }

  async logSystem(level: SystemLog['level'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent(level, 'system', message, details, userInfo);
  }

  async logApi(level: SystemLog['level'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent(level, 'api', message, details, userInfo);
  }

  async logONG(level: SystemLog['level'], message: string, details?: string, user?: User | null): Promise<void> {
    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();
    
    await this.logRepository.logEvent(level, 'ong', message, details, userInfo);
  }
}

// Create a singleton instance
export const loggingService = new LoggingService();