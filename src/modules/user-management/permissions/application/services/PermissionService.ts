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
import { db } from 'config/firebase';
import {
  Permission,
  RolePermission,
  UserPermissionOverride,
  SystemModule,
  PermissionAction,
  PermissionManager,
  DEFAULT_ROLE_PERMISSIONS
} from 'domain/entities/Permission';

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
  private readonly userPermissionOverridesCollection = 'userPermissionOverrides';
  private readonly customRolesCollection = 'customRoles';

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
      console.log(`[PermissionService] Using cached permissions for role: ${role}`, cached);
      return cached;
    }

    try {
      // First, check if it's a custom role
      if (!this.getDefaultRoles().includes(role)) {
        console.log(`[PermissionService] Role "${role}" is not a default role, checking custom roles...`);

        // Try to get from custom roles collection
        const customRoleRef = doc(db, this.customRolesCollection, role);
        const customRoleSnap = await getDoc(customRoleRef);

        if (customRoleSnap.exists()) {
          const customRoleData = customRoleSnap.data();
          console.log(`[PermissionService] Custom role found:`, customRoleData);

          if (customRoleData?.isActive) {
            const result: RolePermissionConfig = {
              role,
              modules: customRoleData.modules || [],
              updatedBy: customRoleData.updatedBy || customRoleData.createdBy,
              updatedAt: customRoleData.updatedAt?.toDate() || customRoleData.createdAt?.toDate()
            };

            console.log(`[PermissionService] Custom role is active, returning permissions:`, result);

            // Cache the result
            this.setCachedData(cacheKey, result);

            return result;
          } else {
            console.warn(`[PermissionService] Custom role "${role}" exists but is not active`);
          }
        } else {
          console.warn(`[PermissionService] Custom role "${role}" not found in Firestore`);
        }
      } else {
        console.log(`[PermissionService] Role "${role}" is a default role`);
      }

      // If not a custom role or custom role not found, check role permissions collection
      const docRef = doc(db, this.rolePermissionsCollection, role);
      const docSnap = await getDoc(docRef);

      let result: RolePermissionConfig;

      if (docSnap.exists()) {
        const data = docSnap.data();
        result = {
          role,
          modules: data.modules || [],
          updatedBy: data.updatedBy,
          updatedAt: data.updatedAt?.toDate()
        };
        console.log(`[PermissionService] Found role permissions in rolePermissions collection:`, result);
      } else {
        // Return default permissions if no custom config exists
        const defaultPerms = DEFAULT_ROLE_PERMISSIONS[role] || [];
        result = {
          role,
          modules: defaultPerms
        };
        console.log(`[PermissionService] Using default permissions for role "${role}":`, result);
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
        // Don't log permission errors as they're expected when Firestore rules aren't set up
        console.warn(`🚨 FIRESTORE ERROR - Using default permissions for role: ${role} (Firestore rules not configured)`);
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
  async getUserPermissionOverrides(userId: string): Promise<UserPermissionConfig | null> {
    const cacheKey = `user_overrides_${userId}`;
    
    // Check cache first
    const cached = this.getCachedData<UserPermissionConfig | null>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    try {
      const docRef = doc(db, this.userPermissionOverridesCollection, userId);
      const docSnap = await getDoc(docRef);
      
      let result: UserPermissionConfig | null = null;
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        result = {
          userId,
          userEmail: data.userEmail,
          userName: data.userName,
          grantedModules: data.grantedModules || [],
          revokedModules: data.revokedModules || [],
          updatedBy: data.updatedBy,
          updatedAt: data.updatedAt?.toDate()
        };
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
  async updateUserPermissionOverrides(
    userId: string,
    userEmail: string,
    userName: string,
    grantedModules: { module: SystemModule; actions: PermissionAction[] }[],
    revokedModules: { module: SystemModule; actions: PermissionAction[] }[],
    updatedBy: string
  ): Promise<void> {
    console.log(`💾 SAVING user permission overrides for ${userId} (${userEmail})`);
    console.log(`📝 Granted modules:`, grantedModules.length);
    console.log(`🚫 Revoked modules:`, revokedModules.length);
    
    try {
      const docRef = doc(db, this.userPermissionOverridesCollection, userId);
      
      // If no overrides, clear the document
      if (grantedModules.length === 0 && revokedModules.length === 0) {
        console.log(`🗑️  Clearing all overrides for ${userId}`);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          await updateDoc(docRef, {
            grantedModules: [],
            revokedModules: [],
            updatedBy,
            updatedAt: Timestamp.now()
          });
          console.log(`✅ Successfully cleared overrides for ${userId}`);
        }
        
        // Clear cache immediately
        this.clearCache(`user_${userId}`);
        return;
      }
      
      const dataToSave = {
        userId,
        userEmail,
        userName,
        grantedModules,
        revokedModules,
        updatedBy,
        updatedAt: Timestamp.now()
      };
      
      console.log(`🔄 Saving to Firestore:`, JSON.stringify(dataToSave, null, 2));
      
      await setDoc(docRef, dataToSave);
      
      console.log(`✅ Successfully saved user permission overrides for ${userId}`);
      
      // Clear cache immediately after save
      this.clearCache(`user_${userId}`);
      
      // Verify the save worked by reading it back
      const verifyDoc = await getDoc(docRef);
      if (verifyDoc.exists()) {
        const verifyData = verifyDoc.data();
        console.log(`🔍 Verification: Document exists with ${verifyData.grantedModules?.length || 0} granted and ${verifyData.revokedModules?.length || 0} revoked modules`);
      } else {
        console.warn(`⚠️  Verification FAILED: Document does not exist after save!`);
      }
      
    } catch (error) {
      console.error('❌ ERROR updating user permission overrides:', error);
      console.error('❌ Error details:', JSON.stringify(error, null, 2));
      throw new Error('Erro ao atualizar permissões do usuário');
    }
  }

  // Get all users with permission overrides
  async getAllUserOverrides(): Promise<UserPermissionConfig[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.userPermissionOverridesCollection));
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          userId: doc.id,
          userEmail: data.userEmail,
          userName: data.userName,
          grantedModules: data.grantedModules || [],
          revokedModules: data.revokedModules || [],
          updatedBy: data.updatedBy,
          updatedAt: data.updatedAt?.toDate()
        };
      });
    } catch (error: any) {
      // If it's a permission error or the collection doesn't exist, return empty array
      // Check for various Firebase error formats
      const isPermissionError = 
        error?.code === 'permission-denied' || 
        error?.message?.includes('Missing or insufficient permissions') ||
        error?.message?.includes('permissions') ||
        error?.name === 'FirebaseError';
        
      if (isPermissionError) {
        // Don't log permission errors as they're expected when Firestore rules aren't set up
        console.log('No user permission overrides found (Firestore not configured)');
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

  // Get all custom roles
  async getAllCustomRoles(): Promise<CustomRoleConfig[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.customRolesCollection));
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          roleId: doc.id,
          roleName: data.roleName,
          displayName: data.displayName,
          description: data.description,
          modules: data.modules || [],
          isActive: data.isActive ?? true,
          createdBy: data.createdBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedBy: data.updatedBy,
          updatedAt: data.updatedAt?.toDate(),
        };
      });
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
      const customRole: CustomRoleConfig = {
        roleId,
        roleName: data.roleName,
        displayName: data.displayName,
        description: data.description,
        modules: data.modules || [],
        isActive: data.isActive ?? true,
        createdBy: data.createdBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedBy: data.updatedBy,
        updatedAt: data.updatedAt?.toDate(),
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

  // Get ALL permissions for a user at once (OPTIMIZED)
  async getAllUserPermissions(userId: string, userRole: string): Promise<Map<string, boolean>> {
    console.log(`[PermissionService] getAllUserPermissions called for user: ${userId}, role: ${userRole}`);

    // Check cache first
    const cacheKey = `all_permissions_${userId}_${userRole}`;
    const cached = this.getCachedData<Map<string, boolean>>(cacheKey);
    if (cached) {
      console.log(`[PermissionService] Returning cached permissions (${cached.size} permissions)`);
      return cached;
    }

    console.log(`[PermissionService] Cache miss, loading fresh permissions...`);

    try {
      // Get role permissions and user overrides in parallel
      const [roleConfig, userOverrides] = await Promise.all([
        this.getRolePermissions(userRole),
        this.getUserPermissionOverrides(userId)
      ]);

      console.log(`[PermissionService] Role config modules:`, roleConfig.modules.length, roleConfig.modules);
      if (userOverrides) {
        console.log(`[PermissionService] User has overrides`);
      }
      
      // Build override object if user has overrides
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
      
      // Build permission map for all possible combinations
      const permissionMap = new Map<string, boolean>();
      const allModules = Object.values(SystemModule);
      const allActions = Object.values(PermissionAction);
      
      for (const module of allModules) {
        for (const action of allActions) {
          const key = `${module}_${action}`;
          
          // Check if permission is revoked via override
          let hasAccess = false;
          
          if (overrideObj?.revokedPermissions) {
            const isRevoked = overrideObj.revokedPermissions.some(
              p => p.module === module && p.action === action
            );
            if (isRevoked) {
              permissionMap.set(key, false);
              continue;
            }
          }
          
          // Check if permission is granted via override
          if (overrideObj?.grantedPermissions) {
            const isGranted = overrideObj.grantedPermissions.some(
              p => p.module === module && p.action === action
            );
            if (isGranted) {
              permissionMap.set(key, true);
              continue;
            }
          }
          
          // Check role permissions from Firestore (NOT defaults)
          const moduleConfig = roleConfig.modules.find(m => m.module === module);
          if (moduleConfig && moduleConfig.actions.includes(action)) {
            hasAccess = true;
          }
          
          permissionMap.set(key, hasAccess);
        }
      }

      // Log the final result
      const grantedPermissions = Array.from(permissionMap.entries())
        .filter(([_, hasAccess]) => hasAccess)
        .map(([key, _]) => key);

      console.log(`[PermissionService] Built ${permissionMap.size} total permissions, ${grantedPermissions.length} granted`);
      console.log(`[PermissionService] Granted permissions:`, grantedPermissions);
      console.log(`[PermissionService] Dashboard_View permission:`, permissionMap.get('Dashboard_View'));

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
