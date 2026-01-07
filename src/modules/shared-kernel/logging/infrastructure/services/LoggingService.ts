// Infrastructure Service - Logging Service
// Centralized logging service for system events

import { FirebaseLogRepository, SystemLog } from '@modules/shared-kernel/logging/infrastructure/repositories/FirebaseLogRepository';
import { User } from '@/domain/entities/User';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

interface LogContext {
  user?: User | null;
  ipAddress?: string;
  userAgent?: string;
}

interface LoggingConfig {
  enabled: boolean;
  levels: {
    debug: boolean;
    info: boolean;
    warning: boolean;
    error: boolean;
  };
  categories: {
    auth: boolean;
    database: boolean;
    api: boolean;
    system: boolean;
    user_action: boolean;
    security: boolean;
    ong: boolean;
  };
}

export class LoggingService {
  private logRepository: FirebaseLogRepository;
  private context: LogContext = {};
  private config: LoggingConfig = {
    enabled: true,
    levels: {
      debug: true,
      info: true,
      warning: true,
      error: true
    },
    categories: {
      auth: true,
      database: true,
      api: true,
      system: true,
      user_action: true,
      security: true,
      ong: true
    }
  };
  private configLoaded = false;

  constructor() {
    this.logRepository = new FirebaseLogRepository();
    // Try to get client IP (this is limited in browser environment)
    this.fetchClientInfo();
    // Load logging configuration from Firebase
    this.loadConfig();
  }

  // Load logging configuration from Firebase
  private async loadConfig() {
    try {
      const configRef = doc(db, 'settings', 'logging');
      const configSnap = await getDoc(configRef);

      if (configSnap.exists()) {
        this.config = { ...this.config, ...configSnap.data() as LoggingConfig };
      }
      this.configLoaded = true;
    } catch (error) {
      console.warn('Could not load logging config, using defaults:', error);
      this.configLoaded = true;
    }
  }

  // Check if logging is enabled for specific level and category
  private async shouldLog(level: SystemLog['level'], category: SystemLog['category']): Promise<boolean> {
    // Wait for config to load (with timeout)
    let attempts = 0;
    while (!this.configLoaded && attempts < 10) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!this.config.enabled) return false;
    if (!this.config.levels[level]) return false;
    if (!this.config.categories[category]) return false;

    return true;
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
    if (!(await this.shouldLog('info', category))) return;

    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();

    await this.logRepository.logEvent('info', category, message, details, userInfo);
  }

  async logWarning(category: SystemLog['category'], message: string, details?: string, user?: User | null): Promise<void> {
    if (!(await this.shouldLog('warning', category))) return;

    const userInfo = user ? {
      userId: user.id,
      userEmail: user.email,
      ipAddress: this.context.ipAddress,
      userAgent: this.context.userAgent
    } : this.getUserInfo();

    await this.logRepository.logEvent('warning', category, message, details, userInfo);
  }

  async logError(category: SystemLog['category'], message: string, details?: string, error?: Error, user?: User | null): Promise<void> {
    if (!(await this.shouldLog('error', category))) return;

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
    if (!(await this.shouldLog('debug', category))) return;

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