// Application Service - Permission Service (Unified)
// Manages role permissions, user permission overrides, and real-time permission checking
// This is the single source of truth for all permission operations

import {
  collection,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  Unsubscribe,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  SystemModule,
  PermissionAction,
  DEFAULT_ROLE_PERMISSIONS
} from '@modules/user-management/permissions/domain/entities/Permission';

// ========== Interfaces ==========

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

interface UserPermissionData {
  role: string;
  rolePermissions?: Array<{ module: SystemModule; actions: PermissionAction[] }>;
  customPermissions?: {
    granted: Array<{ module: SystemModule; actions: PermissionAction[] }>;
    revoked: Array<{ module: SystemModule; actions: PermissionAction[] }>;
  };
  status: string;
}

interface UserPermissionCacheEntry {
  permissions: Map<SystemModule, Set<PermissionAction>>;
  timestamp: number;
  userId: string;
}

// ========== Service ==========

export class PermissionService {
  private static instance: PermissionService;

  // Collection names
  private readonly rolePermissionsCollection = 'rolePermissions';
  private readonly usersCollection = 'users';
  private readonly customRolesCollection = 'customRoles';

  // Admin cache (role configs, custom roles, user overrides)
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes (unified TTL)
  private rolePermissionsCache = new Map<string, RolePermissionConfig>();
  private userOverridesCache = new Map<string, UserPermissionConfig | null>();
  private customRolesCache = new Map<string, CustomRoleConfig>();
  private cacheExpiry = new Map<string, number>();

  // User permission cache (real-time, used by usePermissions hook)
  private userPermissionCache = new Map<string, UserPermissionCacheEntry>();
  private unsubscribeListeners = new Map<string, Unsubscribe>();

  private constructor() {
    // Singleton
  }

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  // ========== REAL-TIME PERMISSION CHECKING (used by usePermissions hook) ==========

  /**
   * Subscribe to real-time permission updates for a user.
   * When the user document changes in Firestore, the callback is invoked
   * so the React hook can re-fetch permissions.
   */
  public subscribeToUserPermissions(userId: string, callback: () => void): void {
    this.unsubscribeFromUser(userId);

    const userDocRef = doc(db, this.usersCollection, userId);
    const unsubscribe = onSnapshot(userDocRef, (snapshot) => {
      if (snapshot.exists()) {
        this.invalidateUserPermissionCache(userId);
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
   * Get all permissions for a user as a Map (used by usePermissions hook).
   * Priority: rolePermissions (user doc) > rolePermissions (collection) > DEFAULT_ROLE_PERMISSIONS
   * Then applies: customPermissions.granted (adds) and customPermissions.revoked (removes)
   */
  public async getUserPermissionsMap(userId: string): Promise<Map<SystemModule, Set<PermissionAction>>> {
    try {
      // Check cache first
      const cached = this.getUserPermissionFromCache(userId);
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
   * Invalidate user permission cache for a specific user or all users
   */
  public invalidateUserPermissionCache(userId?: string): void {
    if (userId) {
      this.userPermissionCache.delete(userId);
    } else {
      this.userPermissionCache.clear();
    }
  }

  /**
   * Cleanup all listeners and caches
   */
  public cleanup(): void {
    this.unsubscribeListeners.forEach(unsubscribe => unsubscribe());
    this.unsubscribeListeners.clear();
    this.clearAllCache();
  }

  // ========== PRIVATE: User Permission Resolution ==========

  private async loadUserPermissions(userId: string): Promise<Map<SystemModule, Set<PermissionAction>>> {
    const userDoc = await getDoc(doc(db, this.usersCollection, userId));

    if (!userDoc.exists()) {
      return new Map();
    }

    const userData = userDoc.data() as UserPermissionData;

    if (userData.status !== 'approved') {
      return new Map();
    }

    // Resolve base permissions
    // Priority: 1. rolePermissions in user document (custom roles)
    //           2. rolePermissions Firestore collection (admin-customized)
    //           3. DEFAULT_ROLE_PERMISSIONS (hardcoded defaults)
    let permissions: Map<SystemModule, Set<PermissionAction>>;

    if (userData.rolePermissions && Array.isArray(userData.rolePermissions) && userData.rolePermissions.length > 0) {
      permissions = new Map();
      userData.rolePermissions.forEach(config => {
        permissions.set(config.module, new Set(config.actions));
      });
    } else {
      permissions = await this.getResolvedRolePermissions(userData.role);
    }

    // Apply custom overrides
    if (userData.customPermissions) {
      // Grants (add permissions)
      userData.customPermissions.granted?.forEach(grant => {
        const modulePerms = permissions.get(grant.module) || new Set();
        grant.actions.forEach(action => modulePerms.add(action));
        permissions.set(grant.module, modulePerms);
      });

      // Revokes (remove permissions)
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
    this.userPermissionCache.set(userId, {
      permissions,
      timestamp: Date.now(),
      userId
    });

    return permissions;
  }

  /**
   * Resolve role permissions: Firestore rolePermissions collection → DEFAULT_ROLE_PERMISSIONS
   */
  private async getResolvedRolePermissions(role: string): Promise<Map<SystemModule, Set<PermissionAction>>> {
    try {
      const roleDoc = await getDoc(doc(db, this.rolePermissionsCollection, role));

      if (roleDoc.exists()) {
        const data = roleDoc.data();
        const modules = data.modules as Array<{ module: SystemModule; actions: PermissionAction[] }>;

        if (modules && Array.isArray(modules) && modules.length > 0) {
          const permissions = new Map<SystemModule, Set<PermissionAction>>();
          modules.forEach(config => {
            permissions.set(config.module, new Set(config.actions));
          });
          return permissions;
        }
      }
    } catch (error) {
      console.warn('Could not read rolePermissions collection, using defaults:', error);
    }

    return this.getDefaultRolePermissions(role);
  }

  private getDefaultRolePermissions(role: string): Map<SystemModule, Set<PermissionAction>> {
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

  private getUserPermissionFromCache(userId: string): UserPermissionCacheEntry | null {
    const cached = this.userPermissionCache.get(userId);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > this.CACHE_DURATION) {
      this.userPermissionCache.delete(userId);
      return null;
    }

    return cached;
  }

  // ========== ADMIN CACHE HELPERS ==========

  private isCacheValid(key: string): boolean {
    const expiry = this.cacheExpiry.get(key);
    return expiry ? Date.now() < expiry : false;
  }

  private clearAdminCache(key: string) {
    this.rolePermissionsCache.delete(key);
    this.userOverridesCache.delete(key);
    this.customRolesCache.delete(key);
    this.cacheExpiry.delete(key);
  }

  private getCachedData<T>(key: string): T | null {
    if (!this.isCacheValid(key)) {
      this.clearAdminCache(key);
      return null;
    }

    if (key.startsWith('role_')) {
      return this.rolePermissionsCache.get(key) as T || null;
    }
    if (key.startsWith('user_overrides_')) {
      return this.userOverridesCache.get(key) as T || null;
    }
    if (key.startsWith('custom_role_')) {
      return this.customRolesCache.get(key) as T || null;
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
    }
  }

  public clearAllCache() {
    this.rolePermissionsCache.clear();
    this.userOverridesCache.clear();
    this.customRolesCache.clear();
    this.cacheExpiry.clear();
    this.userPermissionCache.clear();
  }

  // ========== ROLE PERMISSIONS MANAGEMENT ==========

  async getRolePermissions(role: string): Promise<RolePermissionConfig> {
    const cacheKey = `role_${role}`;

    const cached = this.getCachedData<RolePermissionConfig>(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      // Check custom roles first
      if (!this.getDefaultRoles().includes(role)) {
        const customRoleRef = doc(db, this.customRolesCollection, role);
        const customRoleSnap = await getDoc(customRoleRef);

        if (customRoleSnap.exists()) {
          const customRoleData = customRoleSnap.data();

          if (customRoleData?.isActive) {
            const originalModules = customRoleData.modules || [];
            const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

            if (hadObsolete) {
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

            this.setCachedData(cacheKey, result);
            return result;
          }
        }
      }

      // Check rolePermissions collection
      const docRef = doc(db, this.rolePermissionsCollection, role);
      const docSnap = await getDoc(docRef);

      let result: RolePermissionConfig;

      if (docSnap.exists()) {
        const data = docSnap.data();
        const originalModules = data.modules || [];
        const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

        if (hadObsolete) {
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
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
        result = { role, modules: defaultPerms };
      }

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error: any) {
      const isPermissionError =
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';

      if (isPermissionError) {
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
        const result = { role, modules: defaultPerms };
        this.setCachedData(`role_${role}`, result);
        return result;
      }

      console.error('Error getting role permissions:', error);
      throw new Error('Erro ao buscar permissões da função');
    }
  }

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

      // Clear all caches so users get updated permissions
      this.clearAdminCache(`role_${role}`);
      this.invalidateUserPermissionCache();
    } catch (error) {
      console.error('Error updating role permissions:', error);
      throw new Error('Erro ao atualizar permissões da função');
    }
  }

  // ========== USER PERMISSION OVERRIDES ==========

  async getUserPermissionOverrides(userId: string): Promise<UserPermissionConfig | null> {
    const cacheKey = `user_overrides_${userId}`;

    const cached = this.getCachedData<UserPermissionConfig | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const userRef = doc(db, this.usersCollection, userId);
      const userSnap = await getDoc(userRef);

      let result: UserPermissionConfig | null = null;

      if (userSnap.exists()) {
        const userData = userSnap.data();
        const customPermissions = userData.customPermissions;

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

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting user permission overrides:', error);

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

  async updateUserPermissionOverrides(
    userId: string,
    userEmail: string,
    userName: string,
    grantedModules: { module: SystemModule; actions: PermissionAction[] }[],
    revokedModules: { module: SystemModule; actions: PermissionAction[] }[],
    updatedBy: string
  ): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);

      const customPermissions = {
        granted: grantedModules,
        revoked: revokedModules
      };

      await updateDoc(userRef, {
        customPermissions,
        customPermissionsUpdatedBy: updatedBy,
        customPermissionsUpdatedAt: Timestamp.now()
      });

      // Clear all related caches
      this.clearAdminCache(`user_overrides_${userId}`);
      this.invalidateUserPermissionCache(userId);

      // Clear any other caches for this user
      const keysToDelete: string[] = [];
      this.cacheExpiry.forEach((_, key) => {
        if (key.includes(userId)) {
          keysToDelete.push(key);
        }
      });
      keysToDelete.forEach(key => this.clearAdminCache(key));

    } catch (error) {
      console.error('Error updating user permission overrides:', error);
      throw new Error('Erro ao atualizar permissões do usuário');
    }
  }

  async getAllUserOverrides(): Promise<UserPermissionConfig[]> {
    try {
      const usersQuery = query(
        collection(db, this.usersCollection),
        where('customPermissions', '!=', null)
      );
      const querySnapshot = await getDocs(usersQuery);

      const results: UserPermissionConfig[] = [];

      for (const userDoc of querySnapshot.docs) {
        const userData = userDoc.data();
        const customPermissions = userData.customPermissions;

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
      const isPermissionError =
        error?.code === 'permission-denied' ||
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';

      if (isPermissionError) {
        return [];
      }

      console.error('Error getting all user overrides:', error);
      throw new Error('Erro ao buscar todas as permissões de usuários');
    }
  }

  // ========== CUSTOM ROLES MANAGEMENT ==========

  async createCustomRole(
    roleName: string,
    displayName: string,
    description: string,
    modules: { module: SystemModule; actions: PermissionAction[] }[],
    createdBy: string
  ): Promise<CustomRoleConfig> {
    if (!roleName || roleName.trim().length === 0) {
      throw new Error('Nome da função é obrigatório');
    }

    const roleId = roleName.toLowerCase().replace(/[^a-z0-9]/g, '_');

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

      this.setCachedData(`custom_role_${roleId}`, customRole);
      this.invalidateUserPermissionCache();

      return customRole;
    } catch (error: any) {
      if (error.message?.includes('função')) {
        throw error;
      }
      console.error('Error creating custom role:', error);
      throw new Error('Erro ao criar função personalizada');
    }
  }

  private getValidActions(): PermissionAction[] {
    return Object.values(PermissionAction);
  }

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
          }
          return isValid;
        });
        return { module: m.module, actions: cleanedActions };
      })
      .filter(m => m.actions.length > 0);

    return { cleaned, hadObsolete };
  }

  async getAllCustomRoles(): Promise<CustomRoleConfig[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.customRolesCollection));
      const roles: CustomRoleConfig[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const data = docSnapshot.data();
        const originalModules = data.modules || [];
        const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

        if (hadObsolete) {
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

  async getCustomRole(roleId: string): Promise<CustomRoleConfig | null> {
    const cacheKey = `custom_role_${roleId}`;

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
      const { cleaned: cleanedModules, hadObsolete } = this.cleanObsoleteActions(originalModules);

      if (hadObsolete) {
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

      this.setCachedData(cacheKey, customRole);
      return customRole;
    } catch (error) {
      console.error('Error getting custom role:', error);
      return null;
    }
  }

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

      this.clearAdminCache(`custom_role_${roleId}`);
      this.clearAdminCache(`role_${roleId}`);

      if (updates.modules || updates.isActive !== undefined) {
        await this.syncRolePermissionsForRole(roleId);
      }

      this.invalidateUserPermissionCache();
    } catch (error: any) {
      if (error.message?.includes('Função')) {
        throw error;
      }
      console.error('Error updating custom role:', error);
      throw new Error('Erro ao atualizar função personalizada');
    }
  }

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

      this.clearAdminCache(`custom_role_${roleId}`);
      this.clearAdminCache(`role_${roleId}`);
      await this.syncRolePermissionsForRole(roleId);
      this.invalidateUserPermissionCache();
    } catch (error: any) {
      if (error.message?.includes('Função')) {
        throw error;
      }
      console.error('Error deleting custom role:', error);
      throw new Error('Erro ao excluir função personalizada');
    }
  }

  // ========== ROLE UTILITIES ==========

  private getDefaultRoles(): string[] {
    return ['admin', 'secretary', 'professional', 'leader', 'member', 'finance'];
  }

  async updateUserRolePermissions(userId: string, roleId: string): Promise<void> {
    try {
      const userRef = doc(db, this.usersCollection, userId);

      if (this.getDefaultRoles().includes(roleId)) {
        await updateDoc(userRef, {
          rolePermissions: null,
          rolePermissionsUpdatedAt: Timestamp.now()
        });
      } else {
        const customRole = await this.getCustomRole(roleId);

        if (customRole && customRole.isActive) {
          await updateDoc(userRef, {
            rolePermissions: customRole.modules,
            rolePermissionsUpdatedAt: Timestamp.now()
          });
        } else {
          await updateDoc(userRef, {
            rolePermissions: null,
            rolePermissionsUpdatedAt: Timestamp.now()
          });
        }
      }

      this.clearAdminCache(`user_overrides_${userId}`);
      this.invalidateUserPermissionCache(userId);
    } catch (error) {
      console.error('Error updating user role permissions:', error);
      throw new Error('Erro ao atualizar permissões da função do usuário');
    }
  }

  async syncRolePermissionsForRole(roleId: string): Promise<number> {
    try {
      const customRole = await this.getCustomRole(roleId);
      if (!customRole) {
        return 0;
      }

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
        this.invalidateUserPermissionCache(userDoc.id);
      }

      return updatedCount;
    } catch (error) {
      console.error('Error syncing role permissions:', error);
      throw new Error('Erro ao sincronizar permissões da função');
    }
  }

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

  getAllRolesSync(): string[] {
    return this.getDefaultRoles();
  }

  async getRoleDisplayName(role: string): Promise<string> {
    const defaultNames: Record<string, string> = {
      admin: 'Administrador',
      secretary: 'Secretário',
      professional: 'Profissional',
      leader: 'Líder',
      member: 'Membro',
      finance: 'Finanças'
    };

    if (defaultNames[role]) {
      return defaultNames[role];
    }

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

  async getPermissionMatrix(): Promise<Map<string, Map<SystemModule, PermissionAction[]>>> {
    const matrix = new Map<string, Map<SystemModule, PermissionAction[]>>();

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

// Export singleton instance
export const permissionService = PermissionService.getInstance();
