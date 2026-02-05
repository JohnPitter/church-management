// Infrastructure Service - Atomic Permission Service
// Handles permission validation with Firebase integration and caching

import { doc, getDoc, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { SystemModule, PermissionAction, DEFAULT_ROLE_PERMISSIONS } from '@modules/user-management/permissions/domain/entities/Permission';

interface PermissionCacheEntry {
  permissions: Map<SystemModule, Set<PermissionAction>>;
  timestamp: number;
  userId: string;
}

interface UserPermissionData {
  role: string;
  // NEW: rolePermissions stored directly in user document (for custom roles)
  rolePermissions?: Array<{ module: SystemModule; actions: PermissionAction[] }>;
  customPermissions?: {
    granted: Array<{ module: SystemModule; actions: PermissionAction[] }>;
    revoked: Array<{ module: SystemModule; actions: PermissionAction[] }>;
  };
  status: string;
}

export class AtomicPermissionService {
  private static instance: AtomicPermissionService;
  private cache: Map<string, PermissionCacheEntry> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private unsubscribeListeners: Map<string, Unsubscribe> = new Map();

  private constructor() {
    // Singleton pattern
  }

  public static getInstance(): AtomicPermissionService {
    if (!AtomicPermissionService.instance) {
      AtomicPermissionService.instance = new AtomicPermissionService();
    }
    return AtomicPermissionService.instance;
  }

  /**
   * Subscribe to real-time permission updates for a user
   */
  public subscribeToUserPermissions(userId: string, callback: () => void): void {
    // Unsubscribe from previous listener if exists
    this.unsubscribeFromUser(userId);

    const userDocRef = doc(db, 'users', userId);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        // Invalidate cache when permissions change
        this.invalidateCache(userId);
        callback();
      }
    });

    this.unsubscribeListeners.set(userId, unsubscribe);
  }

  /**
   * Unsubscribe from user permission updates
   */
  public unsubscribeFromUser(userId: string): void {
    const unsubscribe = this.unsubscribeListeners.get(userId);
    if (unsubscribe) {
      unsubscribe();
      this.unsubscribeListeners.delete(userId);
    }
  }

  /**
   * Check if user has specific permission (atomic operation)
   * Uses cache when available, validates with Firebase when needed
   */
  public async hasPermission(
    userId: string,
    module: SystemModule,
    action: PermissionAction
  ): Promise<boolean> {
    try {
      // Check cache first
      const cached = this.getFromCache(userId);
      if (cached) {
        const modulePermissions = cached.permissions.get(module);
        return modulePermissions?.has(action) ?? false;
      }

      // Load from Firebase
      const permissions = await this.loadUserPermissions(userId);
      const modulePermissions = permissions.get(module);
      return modulePermissions?.has(action) ?? false;
    } catch (error) {
      console.error('Error checking permission:', error);
      // Fail securely - deny access on error
      return false;
    }
  }

  /**
   * Check multiple permissions at once (batch operation)
   */
  public async hasPermissions(
    userId: string,
    checks: Array<{ module: SystemModule; action: PermissionAction }>
  ): Promise<boolean[]> {
    try {
      // Load permissions once
      const cached = this.getFromCache(userId);
      const permissions = cached ? cached.permissions : await this.loadUserPermissions(userId);

      // Check all permissions
      return checks.map(check => {
        const modulePermissions = permissions.get(check.module);
        return modulePermissions?.has(check.action) ?? false;
      });
    } catch (error) {
      console.error('Error checking permissions batch:', error);
      // Fail securely - deny all on error
      return checks.map(() => false);
    }
  }

  /**
   * Check if user has ANY of the specified permissions
   */
  public async hasAnyPermission(
    userId: string,
    checks: Array<{ module: SystemModule; action: PermissionAction }>
  ): Promise<boolean> {
    const results = await this.hasPermissions(userId, checks);
    return results.some(result => result === true);
  }

  /**
   * Check if user has ALL of the specified permissions
   */
  public async hasAllPermissions(
    userId: string,
    checks: Array<{ module: SystemModule; action: PermissionAction }>
  ): Promise<boolean> {
    const results = await this.hasPermissions(userId, checks);
    return results.every(result => result === true);
  }

  /**
   * Get all permissions for a user
   */
  public async getUserPermissions(userId: string): Promise<Map<SystemModule, Set<PermissionAction>>> {
    try {
      const cached = this.getFromCache(userId);
      if (cached) {
        return cached.permissions;
      }

      return await this.loadUserPermissions(userId);
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return new Map();
    }
  }

  /**
   * Load user permissions from Firebase
   * Priority: customPermissions.granted > customPermissions.revoked > rolePermissions > DEFAULT_ROLE_PERMISSIONS
   */
  private async loadUserPermissions(userId: string): Promise<Map<SystemModule, Set<PermissionAction>>> {
    const userDoc = await getDoc(doc(db, 'users', userId));

    if (!userDoc.exists()) {
      return new Map();
    }

    const userData = userDoc.data() as UserPermissionData;

    // Check if user is approved
    if (userData.status !== 'approved') {
      return new Map();
    }

    // Start with role-based permissions
    // NEW: Check for rolePermissions in user document first (for custom roles)
    let permissions: Map<SystemModule, Set<PermissionAction>>;

    if (userData.rolePermissions && Array.isArray(userData.rolePermissions) && userData.rolePermissions.length > 0) {
      // Use rolePermissions from user document (custom role)
      permissions = new Map();
      userData.rolePermissions.forEach(config => {
        permissions.set(config.module, new Set(config.actions));
      });
    } else {
      // Fallback to DEFAULT_ROLE_PERMISSIONS
      permissions = this.getRolePermissions(userData.role);
    }

    // Apply custom overrides (these take precedence over role permissions)
    if (userData.customPermissions) {
      // Apply granted permissions first (highest priority)
      userData.customPermissions.granted?.forEach(grant => {
        const modulePerms = permissions.get(grant.module) || new Set();
        grant.actions.forEach(action => modulePerms.add(action));
        permissions.set(grant.module, modulePerms);
      });

      // Apply revoked permissions
      userData.customPermissions.revoked?.forEach(revoke => {
        const modulePerms = permissions.get(revoke.module);
        if (modulePerms) {
          revoke.actions.forEach(action => modulePerms.delete(action));
          if (modulePerms.size === 0) {
            permissions.delete(revoke.module);
          }
        }
      });
    }

    // Cache the result
    this.cache.set(userId, {
      permissions,
      timestamp: Date.now(),
      userId
    });

    return permissions;
  }

  /**
   * Get default role permissions
   */
  private getRolePermissions(role: string): Map<SystemModule, Set<PermissionAction>> {
    const permissions = new Map<SystemModule, Set<PermissionAction>>();
    const roleConfig = DEFAULT_ROLE_PERMISSIONS[role];

    if (!roleConfig) {
      return permissions;
    }

    roleConfig.forEach(config => {
      permissions.set(config.module, new Set(config.actions));
    });

    return permissions;
  }

  /**
   * Get from cache if valid
   */
  private getFromCache(userId: string): PermissionCacheEntry | null {
    const cached = this.cache.get(userId);
    if (!cached) {
      return null;
    }

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(userId);
      return null;
    }

    return cached;
  }

  /**
   * Invalidate cache for user
   */
  public invalidateCache(userId: string): void {
    this.cache.delete(userId);
  }

  /**
   * Clear all cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Cleanup - unsubscribe from all listeners
   */
  public cleanup(): void {
    this.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    this.unsubscribeListeners.clear();
    this.clearCache();
  }
}

// Export singleton instance
export const atomicPermissionService = AtomicPermissionService.getInstance();
