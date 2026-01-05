// Infrastructure Service - Log Seeder Service
// Creates sample logs to demonstrate the logging system

import { FirebaseLogRepository } from '../../data/repositories/FirebaseLogRepository';

export class LogSeederService {
  private logRepository: FirebaseLogRepository;

  constructor() {
    this.logRepository = new FirebaseLogRepository();
  }

  async createSampleLogs(): Promise<void> {
    const sampleLogs = [
      // Authentication logs
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        level: 'info' as const,
        category: 'auth' as const,
        message: 'User logged in successfully',
        details: 'Email: admin@ibc.com, Role: admin',
        userEmail: 'admin@ibc.com',
        userId: 'admin-123'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        level: 'warning' as const,
        category: 'auth' as const,
        message: 'Failed login attempt',
        details: 'Email: test@invalid.com, Error: Invalid credentials',
        ipAddress: '192.168.1.100'
      },
      
      // Database logs
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        level: 'info' as const,
        category: 'database' as const,
        message: 'Blog post created successfully',
        details: 'Post: "Como ser um bom cristão", Status: published',
        userEmail: 'admin@ibc.com',
        userId: 'admin-123'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 20), // 20 minutes ago
        level: 'info' as const,
        category: 'database' as const,
        message: 'Event created successfully',
        details: 'Event: "Culto de Domingo", Date: 2025-01-12',
        userEmail: 'secretary@ibc.com',
        userId: 'secretary-456'
      },
      
      // User actions
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 7), // 7 minutes ago
        level: 'info' as const,
        category: 'user_action' as const,
        message: 'User viewed events page',
        details: 'Page: /events, Duration: 45s',
        userEmail: 'member@ibc.com',
        userId: 'member-789'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 12), // 12 minutes ago
        level: 'info' as const,
        category: 'user_action' as const,
        message: 'User confirmed event attendance',
        details: 'Event: "Culto de Domingo", Status: confirmed',
        userEmail: 'member@ibc.com',
        userId: 'member-789'
      },
      
      // System logs
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago  
        level: 'info' as const,
        category: 'system' as const,
        message: 'Application started',
        details: 'Version: 1.0.0, Environment: production'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 25), // 25 minutes ago
        level: 'warning' as const,
        category: 'system' as const,
        message: 'High memory usage detected',
        details: 'Memory usage: 85%, Threshold: 80%'
      },
      
      // API logs
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 8), // 8 minutes ago
        level: 'info' as const,
        category: 'api' as const,
        message: 'Firebase notification sent',
        details: 'Recipients: 45 users, Type: new_blog_post',
        userEmail: 'admin@ibc.com'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 18), // 18 minutes ago
        level: 'error' as const,
        category: 'api' as const,
        message: 'Failed to send email notification',
        details: 'Recipient: test@example.com, Error: Invalid email address'
      },
      
      // Security logs
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 35), // 35 minutes ago
        level: 'warning' as const,
        category: 'security' as const,
        message: 'Multiple failed login attempts',
        details: 'IP: 203.0.113.10, Attempts: 5, Timeframe: 2 minutes',
        ipAddress: '203.0.113.10'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 22), // 22 minutes ago
        level: 'info' as const,
        category: 'security' as const,
        message: 'Password changed successfully',
        details: 'User changed password',
        userEmail: 'member@ibc.com',
        userId: 'member-789'
      },
      
      // Recent logs
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 2), // 2 minutes ago
        level: 'info' as const,
        category: 'user_action' as const,
        message: 'Admin accessed logs page',
        details: 'Page: /admin/logs, Filters: none',
        userEmail: 'admin@ibc.com',
        userId: 'admin-123'
      },
      {
        timestamp: new Date(Date.now() - 1000 * 60 * 1), // 1 minute ago
        level: 'debug' as const,
        category: 'system' as const,
        message: 'Cache cleared successfully',
        details: 'Cache type: user_sessions, Size: 125MB'
      },
      {
        timestamp: new Date(), // Now
        level: 'info' as const,
        category: 'system' as const,
        message: 'Sample logs created successfully',
        details: 'Created 15 sample log entries for demonstration'
      }
    ];

    for (const log of sampleLogs) {
      try {
        await this.logRepository.create(log);
      } catch (error) {
        console.error('Error creating sample log:', error);
      }
    }
  }

  async clearAndCreateSampleLogs(): Promise<void> {
    try {
      // Clear existing logs first
      await this.logRepository.clearAll();
      
      // Create new sample logs
      await this.createSampleLogs();
      
      console.log('Sample logs created successfully!');
    } catch (error) {
      console.error('Error creating sample logs:', error);
    }
  }
}