// Infrastructure Service - Permission Service
// Manages role permissions and user permission overrides

import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  getDocs,
  query,
  where,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  Permission,
  UserPermissionOverride,
  SystemModule,
  PermissionAction,
  PermissionManager,
  DEFAULT_ROLE_PERMISSIONS
} from '@modules/user-management/permissions/domain/entities/Permission';

export interface RolePermissionConfig {
  role: string;
  modules: {
    module: SystemModule;
    actions: PermissionAction[];
  }[];
  updatedBy?: string;
  updatedAt?: Date;
}

export interface UserPermissionConfig {
  userId: string;
  userEmail: string;
  userName: string;
  grantedModules: {
    module: SystemModule;
    actions: PermissionAction[];
  }[];
  revokedModules: {
    module: SystemModule;
    actions: PermissionAction[];
  }[];
  updatedBy?: string;
  updatedAt?: Date;
}

export interface CustomRoleConfig {
  roleId: string;
  roleName: string;
  displayName: string;
  description: string;
  modules: {
    module: SystemModule;
    actions: PermissionAction[];
  }[];
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedBy?: string;
  updatedAt?: Date;
}

// GLOBAL CACHE shared across ALL instances (true singleton pattern)
const GLOBAL_PERMISSION_CACHE = {
  rolePermissionsCache: new Map<string, RolePermissionConfig>(),
  userOverridesCache: new Map<string, UserPermissionConfig | null>(),
  customRolesCache: new Map<string, CustomRoleConfig>(),
  allPermissionsCache: new Map<string, Map<string, boolean>>(),
  cacheExpiry: new Map<string, number>()
};

export class PermissionService {
  private readonly rolePermissionsCollection = 'rolePermissions';
  private readonly usersCollection = 'users'; // NEW: permissions stored in user document
  private readonly customRolesCollection = 'customRoles';

  // DEPRECATED: kept for backward compatibility during migration
  private readonly userPermissionOverridesCollection = 'userPermissionOverrides';

  // Use GLOBAL cache (shared across ALL instances)
  private rolePermissionsCache = GLOBAL_PERMISSION_CACHE.rolePermissionsCache;
  private userOverridesCache = GLOBAL_PERMISSION_CACHE.userOverridesCache;
  private customRolesCache = GLOBAL_PERMISSION_CACHE.customRolesCache;
  private cacheExpiry = GLOBAL_PERMISSION_CACHE.cacheExpiry;
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutos

  // Check if cache is valid
  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  // Clear cache for a specific key
  private clearCache(key: string) {
    this.rolePermissionsCache.delete(key);
    this.userOverridesCache.delete(key);
    this.customRolesCache.delete(key);
    this.cacheExpiry.delete(key);
  }

  // Generic cache methods for different data types
  private getCachedData<T>(key: string): T | null {
    if (!this.isCacheValid(key)) {
      this.clearCache(key);
      return null;
    }
    
    // Try different cache stores based on key prefix
    if (key.startsWith('role_')) {
      return this.rolePermissionsCache.get(key) as T || null;
    }
    if (key.startsWith('user_overrides_')) {
      return this.userOverridesCache.get(key) as T || null;
    }
    if (key.startsWith('custom_role_')) {
      return this.customRolesCache.get(key) as T || null;
    }
    if (key.startsWith('all_permissions_')) {
      // Use GLOBAL cache for permission maps
      return (GLOBAL_PERMISSION_CACHE.allPermissionsCache.get(key) as T) || null;
    }

    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cacheExpiry.set(key, Date.now() + this.CACHE_DURATION);

    if (key.startsWith('role_')) {
      this.rolePermissionsCache.set(key, data as any);
    } else if (key.startsWith('user_overrides_')) {
      this.userOverridesCache.set(key, data as any);
    } else if (key.startsWith('custom_role_')) {
      this.customRolesCache.set(key, data as any);
    } else if (key.startsWith('all_permissions_')) {
      // Use GLOBAL cache for permission maps
      GLOBAL_PERMISSION_CACHE.allPermissionsCache.set(key, data as any);
    }
  }

  // Clear ALL cache (for debugging)
  public clearAllCache() {
    this.rolePermissionsCache.clear();
    this.userOverridesCache.clear();
    this.customRolesCache.clear();
    GLOBAL_PERMISSION_CACHE.allPermissionsCache.clear();
    this.cacheExpiry.clear();
  }

  // Clear all user permission caches (useful when roles are updated)
  private clearAllUserPermissionCaches() {
    GLOBAL_PERMISSION_CACHE.allPermissionsCache.clear();

    // Also clear cache expiry for permission keys
    const keysToDelete: string[] = [];
    this.cacheExpiry.forEach((_, key) => {
      if (key.startsWith('all_permissions_')) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cacheExpiry.delete(key));
  }

  // Get role permissions (from cache, Firestore or defaults)
  async getRolePermissions(role: string): Promise<RolePermissionConfig> {
    const cacheKey = `role_${role}`;

    // Check cache first
    const cached = this.getCachedData<RolePermissionConfig>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // First, check if it's a custom role
      if (!this.getDefaultRoles().includes(role)) {
        // Try to get from custom roles collection
        const customRoleRef = doc(db, this.customRolesCollection, role);
        const customRoleSnap = await getDoc(customRoleRef);

        if (customRoleSnap.exists()) {
          const customRoleData = customRoleSnap.data();

          if (customRoleData?.isActive) {
            const originalModules = customRoleData.modules || [];

            // Clean obsolete actions
            const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

            // If had obsolete actions, update Firestore
            if (hadObsolete) {
              console.log(`Migrating custom role "${role}" - removing obsolete permissions`);
              await updateDoc(customRoleRef, {
                modules: cleanedModules,
                updatedAt: Timestamp.now(),
                updatedBy: 'system-migration'
              });
            }

            const result: RolePermissionConfig = {
              role,
              modules: cleanedModules,
              updatedBy: hadObsolete ? 'system-migration' : (customRoleData.updatedBy || customRoleData.createdBy),
              updatedAt: hadObsolete ? new Date() : (customRoleData.updatedAt?.toDate() || customRoleData.createdAt?.toDate())
            };

            // Cache the result
            this.setCachedData(cacheKey, result);

            return result;
          } else {
            console.warn(`Custom role "${role}" exists but is not active`);
          }
        }
      }

      // If not a custom role or custom role not found, check role permissions collection
      const docRef = doc(db, this.rolePermissionsCollection, role);
      const docSnap = await getDoc(docRef);

      let result: RolePermissionConfig;

      if (docSnap.exists()) {
        const data = docSnap.data();
        const originalModules = data.modules || [];

        // Clean obsolete actions
        const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

        // If had obsolete actions, update Firestore
        if (hadObsolete) {
          console.log(`Migrating role "${role}" - removing obsolete permissions`);
          await updateDoc(doc(db, this.rolePermissionsCollection, role), {
            modules: cleanedModules,
            updatedAt: Timestamp.now(),
            updatedBy: 'system-migration'
          });
        }

        result = {
          role,
          modules: cleanedModules,
          updatedBy: hadObsolete ? 'system-migration' : data.updatedBy,
          updatedAt: hadObsolete ? new Date() : data.updatedAt?.toDate()
        };
      } else {
        // Return default permissions if no custom config exists
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
        result = {
          role,
          modules: defaultPerms
        };
      }

      // Cache the result
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error: any) {
      // If it's a permission error or the collection doesn't exist, return defaults
      // Check for various Firebase error formats
      const isPermissionError =
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';

      if (isPermissionError) {
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
        const result = {
          role,
          modules: defaultPerms
        };

        // Cache default permissions too
        this.rolePermissionsCache.set(role, result);
        this.cacheExpiry.set(cacheKey, Date.now() + this.CACHE_DURATION);

        return result;
      }

      // Only log unexpected errors
      console.error('Error getting role permissions:', error);
      throw new Error('Erro ao buscar permissões da função');
    }
  }

  // Update role permissions
  async updateRolePermissions(
    role: string,
    modules: { module: SystemModule; actions: PermissionAction[] }[],
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.rolePermissionsCollection, role);
      await setDoc(docRef, {
        role,
        modules,
        updatedBy,
        updatedAt: Timestamp.now()
      });
      
      // Clear cache for this role
      this.clearCache(`role_${role}`);
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw new Error('Erro ao atualizar permissões da função');
    }
  }

  // Get user permission overrides (with cache)
  // NEW: Now reads from /users/{userId}.customPermissions instead of separate collection
  async getUserPermissionOverrides(userId: string): Promise<UserPermissionConfig | null> {
    const cacheKey = `user_overrides_${userId}`;

    // Check cache first
    const cached = this.getCachedData<UserPermissionConfig | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      // NEW: Read from user document
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);

      let result: UserPermissionConfig | null = null;

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const customPermissions = userData.customPermissions;

        // Check if user has custom permissions
        if (customPermissions && (
          (customPermissions.granted && customPermissions.granted.length > 0) ||
          (customPermissions.revoked && customPermissions.revoked.length > 0)
        )) {
          result = {
            userId,
            userEmail: userData.email || '',
            userName: userData.displayName || userData.name || '',
            grantedModules: customPermissions.granted || [],
            revokedModules: customPermissions.revoked || [],
            updatedBy: userData.customPermissionsUpdatedBy,
            updatedAt: userData.customPermissionsUpdatedAt?.toDate()
          };
        }
      }

      // Cache the result (even if null)
      this.setCachedData(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Error getting user permission overrides:', error);

      // Cache null result for permission errors
      const isPermissionError =
        error instanceof Error &&
        (error.message.includes('permissions') || error.message.includes('Missing or insufficient'));

      if (isPermissionError) {
        this.setCachedData(cacheKey, null);
        return null;
      }

      throw new Error('Erro ao buscar permissões do usuário');
    }
  }

  // Update user permission overrides
  // NEW: Now writes to /users/{userId}.customPermissions instead of separate collection
  async updateUserPermissionOverrides(
    userId: string,
    userEmail: string,
    userName: string,
    grantedModules: { module: SystemModule; actions: PermissionAction[] }[],
    revokedModules: { module: SystemModule; actions: PermissionAction[] }[],
    updatedBy: string
  ): Promise<void> {
    try {
      // NEW: Write to user document
      const userRef = doc(db, this.usersCollection, userId);

      // Prepare customPermissions in new format
      const customPermissions = {
        granted: grantedModules,
        revoked: revokedModules
      };

      // Update user document with custom permissions
      await updateDoc(userRef, {
        customPermissions,
        customPermissionsUpdatedBy: updatedBy,
        customPermissionsUpdatedAt: Timestamp.now()
      });

      // Clear all related caches
      this.clearCache(`user_overrides_${userId}`);
      this.clearCache(`all_permissions_${userId}`);

      // Clear all permission caches for this user (handles role variants)
      const keysToDelete: string[] = [];
      this.cacheExpiry.forEach((_, key) => {
        if (key.includes(userId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.clearCache(key));

    } catch (error) {
      console.error('Error updating user permission overrides:', error);
      throw new Error('Erro ao atualizar permissões do usuário');
    }
  }

  // Get all users with permission overrides
  // NEW: Now queries users collection for documents with customPermissions
  async getAllUserOverrides(): Promise<UserPermissionConfig[]> {
    try {
      // Query users that have customPermissions field
      const usersQuery = query(
        collection(db, this.usersCollection),
        where('customPermissions', '!=', null)
      );
      const querySnapshot = await getDocs(usersQuery);

      const results: UserPermissionConfig[] = [];

      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        const customPermissions = userData.customPermissions;

        // Skip if no actual permissions
        if (!customPermissions ||
          ((!customPermissions.granted || customPermissions.granted.length === 0) &&
           (!customPermissions.revoked || customPermissions.revoked.length === 0))) {
          continue;
        }

        results.push({
          userId: userDoc.id,
          userEmail: userData.email || '',
          userName: userData.displayName || userData.name || '',
          grantedModules: customPermissions.granted || [],
          revokedModules: customPermissions.revoked || [],
          updatedBy: userData.customPermissionsUpdatedBy,
          updatedAt: userData.customPermissionsUpdatedAt?.toDate()
        });
      }

      return results;
    } catch (error: any) {
      // If it's a permission error or the collection doesn't exist, return empty array
      const isPermissionError =
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';

      if (isPermissionError) {
        return [];
      }

      // Only log unexpected errors
      console.error('Error getting all user overrides:', error);
      throw new Error('Erro ao buscar todas as permissões de usuários');
    }
  }

  // ========== CUSTOM ROLES MANAGEMENT ==========

  // Create a custom role
  async createCustomRole(
    roleName: string,
    displayName: string,
    description: string,
    modules: { module: SystemModule; actions: PermissionAction[] }[],
    createdBy: string
  ): Promise<CustomRoleConfig> {
    // Validate role name
    if (!roleName || roleName.trim().length === 0) {
      throw new Error('Nome da função é obrigatório');
    }

    const roleId = roleName.toLowerCase().replace(/[^a-z0-9]/g, '_');
    
    // Check if role already exists
    if (this.getDefaultRoles().includes(roleId)) {
      throw new Error('Esta função já existe como função padrão');
    }

    try {
      const docRef = doc(db, this.customRolesCollection, roleId);
      const existingRole = await getDoc(docRef);
      
      if (existingRole.exists()) {
        throw new Error('Já existe uma função personalizada com este nome');
      }

      const customRole: CustomRoleConfig = {
        roleId,
        roleName,
        displayName,
        description,
        modules,
        isActive: true,
        createdBy,
        createdAt: new Date(),
      };

      await setDoc(docRef, {
        ...customRole,
        createdAt: Timestamp.now(),
      });

      // Cache the new role
      this.setCachedData(`custom_role_${roleId}`, customRole);

      // Clear all user permission caches so users with this role get updated permissions
      this.clearAllUserPermissionCaches();

      return customRole;
    } catch (error: any) {
      if (error.message?.includes('função')) {
        throw error;
      }
      console.error('Error creating custom role:', error);
      throw new Error('Erro ao criar função personalizada');
    }
  }

  // Get valid actions (current PermissionAction enum values)
  private getValidActions(): PermissionAction[] {
    return Object.values(PermissionAction);
  }

  // Clean obsolete actions from modules
  private cleanObsoleteActions(modules: { module: SystemModule; actions: PermissionAction[] }[]): {
    cleaned: { module: SystemModule; actions: PermissionAction[] }[];
    hadObsolete: boolean
  } {
    const validActions = this.getValidActions();
    let hadObsolete = false;

    const cleaned = modules
      .map(m => {
        const cleanedActions = m.actions.filter(action => {
          const isValid = validActions.includes(action);
          if (!isValid) {
            hadObsolete = true;
            console.log(`Removing obsolete action "${action}" from module "${m.module}"`);
          }
          return isValid;
        });
        return { module: m.module, actions: cleanedActions };
      })
      .filter(m => m.actions.length > 0); // Remove modules with no valid actions

    return { cleaned, hadObsolete };
  }

  // Get all custom roles
  async getAllCustomRoles(): Promise<CustomRoleConfig[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.customRolesCollection));
      const roles: CustomRoleConfig[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const originalModules = data.modules || [];

        // Clean obsolete actions
        const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

        // If had obsolete actions, update Firestore
        if (hadObsolete) {
          console.log(`Migrating custom role "${docSnapshot.id}" - removing obsolete permissions`);
          await updateDoc(doc(db, this.customRolesCollection, docSnapshot.id), {
            modules: cleanedModules,
            updatedAt: Timestamp.now(),
            updatedBy: 'system-migration'
          });
        }

        roles.push({
          roleId: docSnapshot.id,
          roleName: data.roleName,
          displayName: data.displayName,
          description: data.description,
          modules: cleanedModules,
          isActive: data.isActive ?? true,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedBy: hadObsolete ? 'system-migration' : data.updatedBy,
          updatedAt: hadObsolete ? new Date() : data.updatedAt?.toDate(),
        });
      }

      return roles;
    } catch (error: any) {
      const isPermissionError =
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';

      if (isPermissionError) {
        return [];
      }

      console.error('Error getting custom roles:', error);
      throw new Error('Erro ao buscar funções personalizadas');
    }
  }

  // Get a specific custom role
  async getCustomRole(roleId: string): Promise<CustomRoleConfig | null> {
    const cacheKey = `custom_role_${roleId}`;
    
    // Check cache first
    const cached = this.getCachedData<CustomRoleConfig>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const docRef = doc(db, this.customRolesCollection, roleId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const originalModules = data.modules || [];

      // Clean obsolete actions
      const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

      // If had obsolete actions, update Firestore
      if (hadObsolete) {
        console.log(`Migrating custom role "${roleId}" - removing obsolete permissions`);
        await updateDoc(docRef, {
          modules: cleanedModules,
          updatedAt: Timestamp.now(),
          updatedBy: 'system-migration'
        });
      }

      const customRole: CustomRoleConfig = {
        roleId,
        roleName: data.roleName,
        displayName: data.displayName,
        description: data.description,
        modules: cleanedModules,
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedBy: hadObsolete ? 'system-migration' : data.updatedBy,
        updatedAt: hadObsolete ? new Date() : data.updatedAt?.toDate(),
      };

      // Cache the result
      this.setCachedData(cacheKey, customRole);

      return customRole;
    } catch (error) {
      console.error('Error getting custom role:', error);
      return null;
    }
  }

  // Update a custom role
  async updateCustomRole(
    roleId: string,
    updates: Partial<Pick<CustomRoleConfig, 'displayName' | 'description' | 'modules' | 'isActive'>>,
    updatedBy: string
  ): Promise<void> {
    try {
      const docRef = doc(db, this.customRolesCollection, roleId);
      const existingRole = await getDoc(docRef);

      if (!existingRole.exists()) {
        throw new Error('Função personalizada não encontrada');
      }

      await updateDoc(docRef, {
        ...updates,
        updatedBy,
        updatedAt: Timestamp.now()
      });

      // Clear cache for this role
      this.clearCache(`custom_role_${roleId}`);
      this.clearCache(`role_${roleId}`);

      // NEW: Sync rolePermissions for all users with this role
      if (updates.modules || updates.isActive !== undefined) {
        await this.syncRolePermissionsForRole(roleId);
      }

      // Clear all user permission caches so users with this role get updated permissions
      this.clearAllUserPermissionCaches();
    } catch (error: any) {
      if (error.message?.includes('Função')) {
        throw error;
      }
      console.error('Error updating custom role:', error);
      throw new Error('Erro ao atualizar função personalizada');
    }
  }

  // Delete a custom role
  async deleteCustomRole(roleId: string): Promise<void> {
    try {
      const docRef = doc(db, this.customRolesCollection, roleId);
      const existingRole = await getDoc(docRef);

      if (!existingRole.exists()) {
        throw new Error('Função personalizada não encontrada');
      }

      await updateDoc(docRef, {
        isActive: false,
        updatedAt: Timestamp.now()
      });

      // Clear cache for this role
      this.clearCache(`custom_role_${roleId}`);
      this.clearCache(`role_${roleId}`);

      // NEW: Clear rolePermissions for all users with this role
      await this.syncRolePermissionsForRole(roleId);

      // Clear all user permission caches so users with this role lose permissions
      this.clearAllUserPermissionCaches();
    } catch (error: any) {
      if (error.message?.includes('Função')) {
        throw error;
      }
      console.error('Error deleting custom role:', error);
      throw new Error('Erro ao excluir função personalizada');
    }
  }

  // Get default system roles
  private getDefaultRoles(): string[] {
    return ['admin', 'secretary', 'professional', 'leader', 'member', 'finance'];
  }

  // NEW: Update role permissions in user document
  // Called when assigning a custom role to a user
  async updateUserRolePermissions(
    userId: string,
    roleId: string
  ): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);

      // Check if it's a default role
      if (this.getDefaultRoles().includes(roleId)) {
        // For default roles, remove rolePermissions (will use DEFAULT_ROLE_PERMISSIONS)
        await updateDoc(userRef, {
          rolePermissions: null,
          rolePermissionsUpdatedAt: Timestamp.now()
        });
      } else {
        // For custom roles, copy permissions from custom role to user document
        const customRole = await this.getCustomRole(roleId);

        if (customRole && customRole.isActive) {
          await updateDoc(userRef, {
            rolePermissions: customRole.modules,
            rolePermissionsUpdatedAt: Timestamp.now()
          });
        } else {
          console.warn(`Custom role "${roleId}" not found or inactive`);
          // Clear rolePermissions if role not found
          await updateDoc(userRef, {
            rolePermissions: null,
            rolePermissionsUpdatedAt: Timestamp.now()
          });
        }
      }

      // Clear caches for this user
      this.clearCache(`user_overrides_${userId}`);
      const keysToDelete: string[] = [];
      this.cacheExpiry.forEach((_, key) => {
        if (key.includes(userId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.clearCache(key));

    } catch (error) {
      console.error('Error updating user role permissions:', error);
      throw new Error('Erro ao atualizar permissões da função do usuário');
    }
  }

  // NEW: Sync role permissions for all users with a specific custom role
  // Called when a custom role is updated
  async syncRolePermissionsForRole(roleId: string): Promise<number> {
    try {
      // Get the custom role
      const customRole = await this.getCustomRole(roleId);
      if (!customRole) {
        console.warn(`Custom role "${roleId}" not found`);
        return 0;
      }

      // Find all users with this role
      const usersQuery = query(
        collection(db, this.usersCollection),
        where('role', '==', roleId)
      );
      const usersSnapshot = await getDocs(usersQuery);

      let updatedCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        await updateDoc(userDoc.ref, {
          rolePermissions: customRole.isActive ? customRole.modules : null,
          rolePermissionsUpdatedAt: Timestamp.now()
        });
        updatedCount++;

        // Clear cache for this user
        const userId = userDoc.id;
        this.clearCache(`user_overrides_${userId}`);
      }

      // Clear all permission caches
      this.clearAllUserPermissionCaches();

      return updatedCount;
    } catch (error) {
      console.error('Error syncing role permissions:', error);
      throw new Error('Erro ao sincronizar permissões da função');
    }
  }

  // Get ALL permissions for a user at once (OPTIMIZED)
  // NEW: Also considers rolePermissions from user document for custom roles
  async getAllUserPermissions(userId: string, userRole: string): Promise<Map<string, boolean>> {
    // Check cache first
    const cacheKey = `all_permissions_${userId}_${userRole}`;
    const cached = this.getCachedData<Map<string, boolean>>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // NEW: Get user document to check for rolePermissions and customPermissions
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : null;

      // Get role permissions - prefer user's rolePermissions field (for custom roles)
      let roleModules: { module: SystemModule; actions: PermissionAction[] }[] = [];

      if (userData?.rolePermissions && Array.isArray(userData.rolePermissions)) {
        // Use rolePermissions from user document (custom role or cached)
        roleModules = userData.rolePermissions;
      } else {
        // Fallback to querying role permissions collection
        const roleConfig = await this.getRolePermissions(userRole);
        roleModules = roleConfig.modules;
      }

      // Get custom permission overrides from user document
      const customPermissions = userData?.customPermissions;
      let overrideObj: UserPermissionOverride | undefined;

      if (customPermissions && (
        (customPermissions.granted && customPermissions.granted.length > 0) ||
        (customPermissions.revoked && customPermissions.revoked.length > 0)
      )) {
        const grantedPermissions: Permission[] = [];
        const revokedPermissions: Permission[] = [];

        (customPermissions.granted || []).forEach((m: any) => {
          (m.actions || []).forEach((a: PermissionAction) => {
            grantedPermissions.push({
              id: `${m.module}_${a}`,
              module: m.module,
              action: a,
              description: ''
            });
          });
        });

        (customPermissions.revoked || []).forEach((m: any) => {
          (m.actions || []).forEach((a: PermissionAction) => {
            revokedPermissions.push({
              id: `${m.module}_${a}`,
              module: m.module,
              action: a,
              description: ''
            });
          });
        });

        overrideObj = {
          userId,
          grantedPermissions,
          revokedPermissions
        };
      }

      // Build permission map for all possible combinations
      const permissionMap = new Map<string, boolean>();
      const allModules = Object.values(SystemModule);
      const allActions = Object.values(PermissionAction);

      for (const module of allModules) {
        for (const action of allActions) {
          const key = `${module}_${action}`;

          // Priority: 1. Custom grants, 2. Custom revokes, 3. Role permissions

          // Check if permission is granted via override (highest priority)
          if (overrideObj?.grantedPermissions) {
            const isGranted = overrideObj.grantedPermissions.some(
              p => p.module === module && p.action === action
            );
            if (isGranted) {
              permissionMap.set(key, true);
              continue;
            }
          }

          // Check if permission is revoked via override
          if (overrideObj?.revokedPermissions) {
            const isRevoked = overrideObj.revokedPermissions.some(
              p => p.module === module && p.action === action
            );
            if (isRevoked) {
              permissionMap.set(key, false);
              continue;
            }
          }

          // Check role permissions
          let hasAccess = false;
          const moduleConfig = roleModules.find(m => m.module === module);
          if (moduleConfig && moduleConfig.actions.includes(action)) {
            hasAccess = true;
          }

          permissionMap.set(key, hasAccess);
        }
      }

      // Cache the result
      this.setCachedData(cacheKey, permissionMap);

      return permissionMap;
    } catch (error) {
      console.error('Error getting all user permissions:', error);
      // Return empty map on error
      return new Map();
    }
  }

  // Check if a user has a specific permission (DEPRECATED - use getAllUserPermissions instead)
  async checkUserPermission(
    userId: string,
    userRole: string,
    module: SystemModule,
    action: PermissionAction
  ): Promise<boolean> {
    try {
      // Get user overrides
      const userOverrides = await this.getUserPermissionOverrides(userId);
      
      let overrideObj: UserPermissionOverride | undefined;
      
      if (userOverrides) {
        const grantedPermissions: Permission[] = [];
        const revokedPermissions: Permission[] = [];
        
        userOverrides.grantedModules.forEach(m => {
          m.actions.forEach(a => {
            grantedPermissions.push({
              id: `${m.module}_${a}`,
              module: m.module,
              action: a,
              description: ''
            });
          });
        });
        
        userOverrides.revokedModules.forEach(m => {
          m.actions.forEach(a => {
            revokedPermissions.push({
              id: `${m.module}_${a}`,
              module: m.module,
              action: a,
              description: ''
            });
          });
        });
        
        overrideObj = {
          userId,
          grantedPermissions,
          revokedPermissions
        };
      }
      
      // Check permission with overrides
      return PermissionManager.hasPermission(userRole, module, action, overrideObj);
    } catch (error) {
      console.error('Error checking user permission:', error);
      // Default to role-based permission on error
      return PermissionManager.hasPermission(userRole, module, action);
    }
  }

  // Get all available roles (including custom roles)
  async getAllRoles(): Promise<string[]> {
    try {
      const customRoles = await this.getAllCustomRoles();
      const activeCustomRoles = customRoles
        .filter(role => role.isActive)
        .map(role => role.roleId);
      
      return [...this.getDefaultRoles(), ...activeCustomRoles];
    } catch (error) {
      console.error('Error getting custom roles, returning defaults:', error);
      return this.getDefaultRoles();
    }
  }

  // Get all available roles synchronously (for backward compatibility)
  getAllRolesSync(): string[] {
    return this.getDefaultRoles();
  }

  // Get role display name
  async getRoleDisplayName(role: string): Promise<string> {
    const defaultNames: Record<string, string> = {
      admin: 'Administrador',
      secretary: 'Secretário',
      professional: 'Profissional',
      leader: 'Líder',
      member: 'Membro',
      finance: 'Finanças'
    };

    // Check if it's a default role
    if (defaultNames[role]) {
      return defaultNames[role];
    }

    // Check if it's a custom role
    try {
      const customRole = await this.getCustomRole(role);
      if (customRole) {
        return customRole.displayName;
      }
    } catch (error) {
      console.error('Error getting custom role display name:', error);
    }

    return role;
  }

  // Get role display name synchronously (for backward compatibility)
  getRoleDisplayNameSync(role: string): string {
    const defaultNames: Record<string, string> = {
      admin: 'Administrador',
      secretary: 'Secretário',
      professional: 'Profissional',
      leader: 'Líder',
      member: 'Membro',
      finance: 'Finanças'
    };

    return defaultNames[role] || role;
  }

  // Reset role permissions to defaults
  async resetRolePermissionsToDefault(role: string, updatedBy: string): Promise<void> {
    try {
      const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role];
      if (!defaultPerms) {
        throw new Error('Função não encontrada');
      }
      
      await this.updateRolePermissions(role, defaultPerms, updatedBy);
    } catch (error) {
      console.error('Error resetting role permissions:', error);
      throw new Error('Erro ao resetar permissões da função');
    }
  }

  // Get permission matrix for all roles
  async getPermissionMatrix(): Promise<Map<string, Map<SystemModule, PermissionAction[]>>> {
    const matrix = new Map<string, Map<SystemModule, PermissionAction[]>>();
    
    // Get all roles (including custom ones)
    const allRoles = await this.getAllRoles();
    
    for (const role of allRoles) {
      const roleConfig = await this.getRolePermissions(role);
      const moduleMap = new Map<SystemModule, PermissionAction[]>();
      
      roleConfig.modules.forEach(m => {
        moduleMap.set(m.module, m.actions);
      });
      
      matrix.set(role, moduleMap);
    }
    
    return matrix;
  }
}
