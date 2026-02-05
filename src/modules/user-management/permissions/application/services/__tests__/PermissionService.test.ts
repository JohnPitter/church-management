// Unit Tests - PermissionService
// Comprehensive tests for permission management service

// Mock Firebase Firestore - must be defined before imports due to jest hoisting
jest.mock('firebase/firestore', () => ({
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    now: jest.fn(() => ({ toDate: () => new Date() }))
  }
}));

jest.mock('@/config/firebase', () => ({
  db: {}
}));

import {
  SystemModule,
  PermissionAction,
  DEFAULT_ROLE_PERMISSIONS
} from '@modules/user-management/permissions/domain/entities/Permission';
import {
  PermissionService,
  RolePermissionConfig,
  UserPermissionConfig,
  CustomRoleConfig
} from '../PermissionService';
import {
  getDoc,
  setDoc,
  updateDoc,
  getDocs,
  doc,
  collection,
  query,
  where,
  Timestamp
} from 'firebase/firestore';

// Get mock functions from the mocked module
const mockGetDoc = getDoc as jest.Mock;
const mockSetDoc = setDoc as jest.Mock;
const mockUpdateDoc = updateDoc as jest.Mock;
const mockGetDocs = getDocs as jest.Mock;
const mockDoc = doc as jest.Mock;
const mockCollection = collection as jest.Mock;
const mockQuery = query as jest.Mock;
const mockWhere = where as jest.Mock;

describe('PermissionService', () => {
  let service: PermissionService;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create new service instance
    service = new PermissionService();

    // Clear the global cache before each test
    service.clearAllCache();

    // Setup default mock behaviors
    mockDoc.mockReturnValue({ id: 'mock-doc-ref' });
    mockCollection.mockReturnValue({ id: 'mock-collection-ref' });
    mockQuery.mockReturnValue({ id: 'mock-query-ref' });
    mockWhere.mockReturnValue({ id: 'mock-where-ref' });
  });

  // ========== ROLE PERMISSIONS TESTS ==========
  describe('getRolePermissions', () => {
    describe('when Firestore has custom role configuration', () => {
      it('should return role permissions from Firestore', async () => {
        const firestoreModules = [
          { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
          { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create] }
        ];

        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            role: 'secretary',
            modules: firestoreModules,
            updatedBy: 'admin-user',
            updatedAt: { toDate: () => new Date('2024-01-01') }
          })
        });

        const result = await service.getRolePermissions('secretary');

        expect(result.role).toBe('secretary');
        expect(result.modules).toEqual(firestoreModules);
        expect(result.updatedBy).toBe('admin-user');
      });

      it('should cache role permissions for subsequent calls', async () => {
        const firestoreModules = [
          { module: SystemModule.Dashboard, actions: [PermissionAction.View] }
        ];

        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            role: 'leader',
            modules: firestoreModules,
            updatedBy: 'admin',
            updatedAt: { toDate: () => new Date() }
          })
        });

        // First call - hits Firestore
        await service.getRolePermissions('leader');
        // Second call - should use cache
        await service.getRolePermissions('leader');

        // Only one Firestore call
        expect(mockGetDoc).toHaveBeenCalledTimes(1);
      });
    });

    describe('when Firestore has no custom configuration', () => {
      it('should return default permissions for standard roles', async () => {
        mockGetDoc.mockResolvedValueOnce({
          exists: () => false
        });

        const result = await service.getRolePermissions('admin');

        expect(result.role).toBe('admin');
        expect(result.modules).toEqual(DEFAULT_ROLE_PERMISSIONS['admin']);
      });

      it('should return empty modules for unknown roles', async () => {
        // First call checks customRolesCollection, second checks rolePermissionsCollection
        mockGetDoc
          .mockResolvedValueOnce({ exists: () => false }) // customRolesCollection
          .mockResolvedValueOnce({ exists: () => false }); // rolePermissionsCollection

        const result = await service.getRolePermissions('unknown_role');

        expect(result.role).toBe('unknown_role');
        expect(result.modules).toEqual([]);
      });
    });

    describe('when Firestore throws permission error', () => {
      it('should return default permissions on Firebase permission error', async () => {
        mockGetDoc.mockRejectedValueOnce({
          code: 'permission-denied',
          message: 'Missing or insufficient permissions'
        });

        const result = await service.getRolePermissions('member');

        expect(result.role).toBe('member');
        expect(result.modules).toEqual(DEFAULT_ROLE_PERMISSIONS['member']);
      });

      it('should throw error for unexpected errors', async () => {
        mockGetDoc.mockRejectedValueOnce(new Error('Network error'));

        await expect(service.getRolePermissions('admin')).rejects.toThrow(
          'Erro ao buscar permiss\u00f5es da fun\u00e7\u00e3o'
        );
      });
    });

    describe('when checking custom roles', () => {
      it('should fetch permissions from customRoles collection for non-default roles', async () => {
        const customRoleModules = [
          { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create] }
        ];

        // First call for custom role check
        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            roleId: 'custom_finance',
            roleName: 'Custom Finance',
            displayName: 'Custom Finance Role',
            modules: customRoleModules,
            isActive: true,
            createdBy: 'admin',
            createdAt: { toDate: () => new Date() }
          })
        });

        const result = await service.getRolePermissions('custom_finance');

        expect(result.role).toBe('custom_finance');
        expect(result.modules).toEqual(customRoleModules);
      });

      it('should skip inactive custom roles', async () => {
        // Custom role exists but is inactive
        mockGetDoc
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
              roleId: 'inactive_role',
              modules: [{ module: SystemModule.Dashboard, actions: [PermissionAction.View] }],
              isActive: false
            })
          })
          // Fall through to role permissions collection
          .mockResolvedValueOnce({
            exists: () => false
          });

        const result = await service.getRolePermissions('inactive_role');

        expect(result.modules).toEqual([]);
      });
    });

    describe('obsolete action migration', () => {
      it('should remove obsolete actions and update Firestore', async () => {
        const modulesWithObsolete = [
          { module: SystemModule.Dashboard, actions: [PermissionAction.View, 'obsolete_action' as PermissionAction] },
          { module: SystemModule.Users, actions: [PermissionAction.Create] }
        ];

        // First call checks customRolesCollection (not found), second checks rolePermissionsCollection (found with obsolete)
        mockGetDoc
          .mockResolvedValueOnce({ exists: () => false }) // customRolesCollection
          .mockResolvedValueOnce({
            exists: () => true,
            data: () => ({
              role: 'test_role',
              modules: modulesWithObsolete,
              updatedBy: 'admin'
            })
          });

        mockUpdateDoc.mockResolvedValueOnce(undefined);

        const result = await service.getRolePermissions('test_role');

        // Should have cleaned the obsolete action
        expect(result.modules[0].actions).not.toContain('obsolete_action');
        expect(result.modules[0].actions).toContain(PermissionAction.View);
        expect(result.updatedBy).toBe('system-migration');
      });
    });
  });

  describe('updateRolePermissions', () => {
    it('should update role permissions in Firestore', async () => {
      const modules = [
        { module: SystemModule.Dashboard, actions: [PermissionAction.View, PermissionAction.Manage] }
      ];

      mockSetDoc.mockResolvedValueOnce(undefined);

      await service.updateRolePermissions('secretary', modules, 'admin-user');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: 'secretary',
          modules,
          updatedBy: 'admin-user'
        })
      );
    });

    it('should clear cache after updating permissions', async () => {
      const modules = [
        { module: SystemModule.Dashboard, actions: [PermissionAction.View] }
      ];

      // First, cache some permissions
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'leader',
          modules: [{ module: SystemModule.Members, actions: [PermissionAction.View] }]
        })
      });
      await service.getRolePermissions('leader');

      // Update permissions
      mockSetDoc.mockResolvedValueOnce(undefined);
      await service.updateRolePermissions('leader', modules, 'admin');

      // Next call should hit Firestore again
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          role: 'leader',
          modules
        })
      });
      const result = await service.getRolePermissions('leader');

      expect(result.modules).toEqual(modules);
    });

    it('should throw error on Firestore failure', async () => {
      mockSetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      await expect(
        service.updateRolePermissions(
          'admin',
          [{ module: SystemModule.Dashboard, actions: [PermissionAction.View] }],
          'updater'
        )
      ).rejects.toThrow('Erro ao atualizar permiss\u00f5es da fun\u00e7\u00e3o');
    });
  });

  // ========== USER PERMISSION OVERRIDES TESTS ==========
  describe('getUserPermissionOverrides', () => {
    it('should return null when user has no custom permissions', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com',
          displayName: 'Test User'
          // No customPermissions field
        })
      });

      const result = await service.getUserPermissionOverrides('user-123');

      expect(result).toBeNull();
    });

    it('should return user permission overrides when they exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com',
          displayName: 'Test User',
          customPermissions: {
            granted: [
              { module: SystemModule.Finance, actions: [PermissionAction.View] }
            ],
            revoked: [
              { module: SystemModule.Users, actions: [PermissionAction.Delete] }
            ]
          },
          customPermissionsUpdatedBy: 'admin',
          customPermissionsUpdatedAt: { toDate: () => new Date('2024-01-15') }
        })
      });

      const result = await service.getUserPermissionOverrides('user-123');

      expect(result).not.toBeNull();
      expect(result?.userId).toBe('user-123');
      expect(result?.userEmail).toBe('user@test.com');
      expect(result?.grantedModules).toHaveLength(1);
      expect(result?.grantedModules[0].module).toBe(SystemModule.Finance);
      expect(result?.revokedModules).toHaveLength(1);
      expect(result?.revokedModules[0].module).toBe(SystemModule.Users);
    });

    it('should return consistent results for multiple calls', async () => {
      const mockUserData = {
        exists: () => true,
        data: () => ({
          email: 'cached@test.com',
          customPermissions: {
            granted: [],
            revoked: []
          }
        })
      };

      // Configure mock to return same data for multiple calls
      mockGetDoc.mockResolvedValue(mockUserData);

      // First call
      const result1 = await service.getUserPermissionOverrides('cached-user');

      // Second call
      const result2 = await service.getUserPermissionOverrides('cached-user');

      // Both results should be equivalent
      expect(result1?.userId).toBe(result2?.userId);
      expect(result1?.grantedModules).toEqual(result2?.grantedModules);
      expect(result1?.revokedModules).toEqual(result2?.revokedModules);
    });

    it('should return null when user document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await service.getUserPermissionOverrides('nonexistent-user');

      expect(result).toBeNull();
    });
  });

  describe('updateUserPermissionOverrides', () => {
    it('should update user document with custom permissions', async () => {
      const grantedModules = [
        { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create] }
      ];
      const revokedModules = [
        { module: SystemModule.Settings, actions: [PermissionAction.Manage] }
      ];

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await service.updateUserPermissionOverrides(
        'user-456',
        'user@example.com',
        'Test User',
        grantedModules,
        revokedModules,
        'admin-user'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          customPermissions: {
            granted: grantedModules,
            revoked: revokedModules
          },
          customPermissionsUpdatedBy: 'admin-user'
        })
      );
    });

    it('should clear caches after updating overrides', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Cache some data first
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'test@test.com',
          customPermissions: { granted: [], revoked: [] }
        })
      });
      await service.getUserPermissionOverrides('test-user-id');

      // Update overrides
      await service.updateUserPermissionOverrides(
        'test-user-id',
        'test@test.com',
        'Test',
        [],
        [],
        'admin'
      );

      // Next fetch should hit Firestore
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'test@test.com',
          customPermissions: {
            granted: [{ module: SystemModule.Blog, actions: [PermissionAction.Create] }],
            revoked: []
          }
        })
      });

      const result = await service.getUserPermissionOverrides('test-user-id');
      expect(mockGetDoc).toHaveBeenCalledTimes(2);
      expect(result?.grantedModules).toHaveLength(1);
    });
  });

  describe('getAllUserOverrides', () => {
    it('should return all users with permission overrides', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-1',
            data: () => ({
              email: 'user1@test.com',
              displayName: 'User One',
              customPermissions: {
                granted: [{ module: SystemModule.Finance, actions: [PermissionAction.View] }],
                revoked: []
              },
              customPermissionsUpdatedBy: 'admin'
            })
          },
          {
            id: 'user-2',
            data: () => ({
              email: 'user2@test.com',
              name: 'User Two',
              customPermissions: {
                granted: [],
                revoked: [{ module: SystemModule.Users, actions: [PermissionAction.Delete] }]
              }
            })
          }
        ]
      });

      const result = await service.getAllUserOverrides();

      expect(result).toHaveLength(2);
      expect(result[0].userId).toBe('user-1');
      expect(result[0].userEmail).toBe('user1@test.com');
      expect(result[1].userId).toBe('user-2');
    });

    it('should skip users with empty permissions', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'user-with-perms',
            data: () => ({
              email: 'has-perms@test.com',
              customPermissions: {
                granted: [{ module: SystemModule.Blog, actions: [PermissionAction.Create] }],
                revoked: []
              }
            })
          },
          {
            id: 'user-empty',
            data: () => ({
              email: 'empty@test.com',
              customPermissions: {
                granted: [],
                revoked: []
              }
            })
          }
        ]
      });

      const result = await service.getAllUserOverrides();

      expect(result).toHaveLength(1);
      expect(result[0].userId).toBe('user-with-perms');
    });

    it('should return empty array on permission error', async () => {
      mockGetDocs.mockRejectedValueOnce({
        code: 'permission-denied',
        message: 'Missing or insufficient permissions'
      });

      const result = await service.getAllUserOverrides();

      expect(result).toEqual([]);
    });
  });

  // ========== CUSTOM ROLE MANAGEMENT TESTS ==========
  describe('createCustomRole', () => {
    it('should create a new custom role', async () => {
      const modules = [
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Update] }
      ];

      // Check if role already exists
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });
      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await service.createCustomRole(
        'Custom Volunteer',
        'Voluntario Customizado',
        'Role for volunteers with limited access',
        modules,
        'admin-creator'
      );

      expect(result.roleId).toBe('custom_volunteer');
      expect(result.roleName).toBe('Custom Volunteer');
      expect(result.displayName).toBe('Voluntario Customizado');
      expect(result.modules).toEqual(modules);
      expect(result.isActive).toBe(true);
      expect(result.createdBy).toBe('admin-creator');
    });

    it('should throw error for empty role name', async () => {
      await expect(
        service.createCustomRole('', 'Display', 'Desc', [], 'admin')
      ).rejects.toThrow('Nome da fun\u00e7\u00e3o \u00e9 obrigat\u00f3rio');

      await expect(
        service.createCustomRole('   ', 'Display', 'Desc', [], 'admin')
      ).rejects.toThrow('Nome da fun\u00e7\u00e3o \u00e9 obrigat\u00f3rio');
    });

    it('should throw error when role matches default role', async () => {
      await expect(
        service.createCustomRole('admin', 'Admin Custom', 'Desc', [], 'creator')
      ).rejects.toThrow('Esta fun\u00e7\u00e3o j\u00e1 existe como fun\u00e7\u00e3o padr\u00e3o');
    });

    it('should throw error when custom role already exists', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          roleId: 'existing_role'
        })
      });

      await expect(
        service.createCustomRole('Existing Role', 'Display', 'Desc', [], 'creator')
      ).rejects.toThrow('J\u00e1 existe uma fun\u00e7\u00e3o personalizada com este nome');
    });

    it('should normalize role ID properly', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      const result = await service.createCustomRole(
        'Special Role 123!@#',
        'Display',
        'Desc',
        [],
        'admin'
      );

      expect(result.roleId).toBe('special_role_123___');
    });
  });

  describe('getCustomRole', () => {
    it('should return custom role when it exists', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          roleName: 'Custom Role',
          displayName: 'Custom Display',
          description: 'A custom role',
          modules: [{ module: SystemModule.Events, actions: [PermissionAction.View] }],
          isActive: true,
          createdBy: 'admin',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedBy: 'admin',
          updatedAt: { toDate: () => new Date('2024-01-15') }
        })
      });

      const result = await service.getCustomRole('custom_role');

      expect(result).not.toBeNull();
      expect(result?.roleId).toBe('custom_role');
      expect(result?.displayName).toBe('Custom Display');
      expect(result?.isActive).toBe(true);
    });

    it('should return null when custom role does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const result = await service.getCustomRole('nonexistent');

      expect(result).toBeNull();
    });

    it('should cache custom roles', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          roleName: 'Cached Role',
          displayName: 'Cached',
          description: 'Cached role',
          modules: [],
          isActive: true,
          createdBy: 'admin',
          createdAt: { toDate: () => new Date() }
        })
      });

      await service.getCustomRole('cached_role');
      await service.getCustomRole('cached_role');

      expect(mockGetDoc).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllCustomRoles', () => {
    it('should return all custom roles', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'role_1',
            data: () => ({
              roleName: 'Role 1',
              displayName: 'First Role',
              description: 'Description 1',
              modules: [],
              isActive: true,
              createdBy: 'admin',
              createdAt: { toDate: () => new Date() }
            })
          },
          {
            id: 'role_2',
            data: () => ({
              roleName: 'Role 2',
              displayName: 'Second Role',
              description: 'Description 2',
              modules: [{ module: SystemModule.Blog, actions: [PermissionAction.View] }],
              isActive: false,
              createdBy: 'admin',
              createdAt: { toDate: () => new Date() }
            })
          }
        ]
      });

      const result = await service.getAllCustomRoles();

      expect(result).toHaveLength(2);
      expect(result[0].roleId).toBe('role_1');
      expect(result[0].isActive).toBe(true);
      expect(result[1].roleId).toBe('role_2');
      expect(result[1].isActive).toBe(false);
    });

    it('should return empty array on permission error', async () => {
      mockGetDocs.mockRejectedValueOnce({
        code: 'permission-denied'
      });

      const result = await service.getAllCustomRoles();

      expect(result).toEqual([]);
    });
  });

  describe('updateCustomRole', () => {
    it('should update custom role properties', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          roleId: 'test_role',
          modules: []
        })
      });
      mockUpdateDoc.mockResolvedValueOnce(undefined);
      // Mock for syncRolePermissionsForRole
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ modules: [], isActive: true })
      });
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      await service.updateCustomRole(
        'test_role',
        {
          displayName: 'Updated Display',
          description: 'Updated description',
          modules: [{ module: SystemModule.Forum, actions: [PermissionAction.Create] }]
        },
        'updater-admin'
      );

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          displayName: 'Updated Display',
          description: 'Updated description',
          updatedBy: 'updater-admin'
        })
      );
    });

    it('should throw error when custom role not found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      await expect(
        service.updateCustomRole('nonexistent', { displayName: 'New' }, 'admin')
      ).rejects.toThrow('Fun\u00e7\u00e3o personalizada n\u00e3o encontrada');
    });

    it('should sync role permissions when modules are updated', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ roleId: 'sync_test' })
      });
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Mock for getCustomRole in syncRolePermissionsForRole
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          modules: [{ module: SystemModule.Blog, actions: [PermissionAction.View] }],
          isActive: true
        })
      });

      // Mock for users query
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'user-1', ref: { id: 'user-1' } }
        ]
      });
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await service.updateCustomRole(
        'sync_test',
        { modules: [{ module: SystemModule.Blog, actions: [PermissionAction.View] }] },
        'admin'
      );

      // Should have called updateDoc for the role and each user
      expect(mockUpdateDoc).toHaveBeenCalledTimes(2);
    });
  });

  describe('deleteCustomRole', () => {
    it('should soft delete custom role by setting isActive to false', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ roleId: 'to_delete' })
      });
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      // Mock for syncRolePermissionsForRole
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ modules: [], isActive: false })
      });
      mockGetDocs.mockResolvedValueOnce({ docs: [] });

      await service.deleteCustomRole('to_delete');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          isActive: false
        })
      );
    });

    it('should throw error when role not found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      await expect(service.deleteCustomRole('nonexistent')).rejects.toThrow(
        'Fun\u00e7\u00e3o personalizada n\u00e3o encontrada'
      );
    });
  });

  // ========== PERMISSION CHECKING TESTS ==========
  describe('checkUserPermission', () => {
    it('should check permission using role defaults when no overrides', async () => {
      // Mock getUserPermissionOverrides to return null
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com'
          // No customPermissions
        })
      });

      const hasPermission = await service.checkUserPermission(
        'user-id',
        'admin',
        SystemModule.Users,
        PermissionAction.Manage
      );

      expect(hasPermission).toBe(true);
    });

    it('should grant permission via custom override', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'member@test.com',
          customPermissions: {
            granted: [{ module: SystemModule.Finance, actions: [PermissionAction.View] }],
            revoked: []
          }
        })
      });

      // Member normally doesn't have Finance access
      const hasPermission = await service.checkUserPermission(
        'member-id',
        'member',
        SystemModule.Finance,
        PermissionAction.View
      );

      expect(hasPermission).toBe(true);
    });

    it('should revoke permission via custom override', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'admin@test.com',
          customPermissions: {
            granted: [],
            revoked: [{ module: SystemModule.Users, actions: [PermissionAction.Delete] }]
          }
        })
      });

      // Admin normally has Delete on Users
      const hasPermission = await service.checkUserPermission(
        'admin-id',
        'admin',
        SystemModule.Users,
        PermissionAction.Delete
      );

      expect(hasPermission).toBe(false);
    });

    it('should return role default on error', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Network error'));

      // Should fall back to role permission check
      const hasPermission = await service.checkUserPermission(
        'user-id',
        'admin',
        SystemModule.Dashboard,
        PermissionAction.View
      );

      expect(hasPermission).toBe(true);
    });
  });

  describe('getAllUserPermissions', () => {
    it('should return permission map for all module/action combinations', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com',
          role: 'member'
          // No rolePermissions or customPermissions
        })
      });

      // Mock getRolePermissions call
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const permissionMap = await service.getAllUserPermissions('user-id', 'member');

      expect(permissionMap).toBeInstanceOf(Map);

      // Member should have View on Dashboard
      expect(permissionMap.get('dashboard_view')).toBe(true);

      // Member should NOT have Manage on Dashboard
      expect(permissionMap.get('dashboard_manage')).toBe(false);

      // Member should NOT have access to Finance
      expect(permissionMap.get('finance_view')).toBe(false);
    });

    it('should use rolePermissions from user document for custom roles', async () => {
      const customRoleModules = [
        { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create] }
      ];

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com',
          rolePermissions: customRoleModules
        })
      });

      const permissionMap = await service.getAllUserPermissions('user-id', 'custom_role');

      expect(permissionMap.get('finance_view')).toBe(true);
      expect(permissionMap.get('finance_create')).toBe(true);
      expect(permissionMap.get('finance_delete')).toBe(false);
    });

    it('should apply custom permission grants with highest priority', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com',
          customPermissions: {
            granted: [{ module: SystemModule.Settings, actions: [PermissionAction.Manage] }],
            revoked: []
          }
        })
      });

      // Mock getRolePermissions
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const permissionMap = await service.getAllUserPermissions('user-id', 'member');

      // Member doesn't have Settings access, but grant override should work
      expect(permissionMap.get('settings_manage')).toBe(true);
    });

    it('should apply custom permission revokes', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'admin@test.com',
          customPermissions: {
            granted: [],
            revoked: [{ module: SystemModule.Permissions, actions: [PermissionAction.Manage] }]
          }
        })
      });

      // Mock getRolePermissions
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const permissionMap = await service.getAllUserPermissions('admin-id', 'admin');

      // Admin normally has Permissions Manage, but should be revoked
      expect(permissionMap.get('permissions_manage')).toBe(false);
    });

    it('should cache permission map', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'user@test.com'
        })
      });
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });

      await service.getAllUserPermissions('cache-user', 'member');
      await service.getAllUserPermissions('cache-user', 'member');

      // Should only call getDoc once for user document (plus once for role)
      expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    it('should return empty map on error', async () => {
      mockGetDoc.mockRejectedValueOnce(new Error('Fatal error'));

      const permissionMap = await service.getAllUserPermissions('error-user', 'member');

      expect(permissionMap).toBeInstanceOf(Map);
      expect(permissionMap.size).toBe(0);
    });
  });

  // ========== ROLE MANAGEMENT TESTS ==========
  describe('getAllRoles', () => {
    it('should return all default and active custom roles', async () => {
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          {
            id: 'custom_role_1',
            data: () => ({
              roleName: 'Custom 1',
              displayName: 'Custom Role 1',
              modules: [],
              isActive: true,
              createdBy: 'admin',
              createdAt: { toDate: () => new Date() }
            })
          },
          {
            id: 'inactive_role',
            data: () => ({
              roleName: 'Inactive',
              displayName: 'Inactive Role',
              modules: [],
              isActive: false,
              createdBy: 'admin',
              createdAt: { toDate: () => new Date() }
            })
          }
        ]
      });

      const roles = await service.getAllRoles();

      expect(roles).toContain('admin');
      expect(roles).toContain('secretary');
      expect(roles).toContain('member');
      expect(roles).toContain('custom_role_1');
      expect(roles).not.toContain('inactive_role');
    });

    it('should return only default roles on error', async () => {
      mockGetDocs.mockRejectedValueOnce(new Error('Firestore error'));

      const roles = await service.getAllRoles();

      expect(roles).toContain('admin');
      expect(roles).toContain('secretary');
      expect(roles).toContain('member');
      expect(roles).toContain('leader');
      expect(roles).toContain('professional');
      expect(roles).toContain('finance');
      expect(roles).toHaveLength(6);
    });
  });

  describe('getAllRolesSync', () => {
    it('should return default roles synchronously', () => {
      const roles = service.getAllRolesSync();

      expect(roles).toContain('admin');
      expect(roles).toContain('secretary');
      expect(roles).toContain('member');
      expect(roles).toContain('leader');
      expect(roles).toContain('professional');
      expect(roles).toContain('finance');
    });
  });

  describe('getRoleDisplayName', () => {
    it('should return display name for default roles', async () => {
      expect(await service.getRoleDisplayName('admin')).toBe('Administrador');
      expect(await service.getRoleDisplayName('secretary')).toBe('Secret\u00e1rio');
      expect(await service.getRoleDisplayName('member')).toBe('Membro');
      expect(await service.getRoleDisplayName('leader')).toBe('L\u00edder');
      expect(await service.getRoleDisplayName('professional')).toBe('Profissional');
      expect(await service.getRoleDisplayName('finance')).toBe('Finan\u00e7as');
    });

    it('should return display name for custom roles', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          displayName: 'Custom Display Name',
          modules: [],
          isActive: true,
          createdBy: 'admin',
          createdAt: { toDate: () => new Date() }
        })
      });

      const displayName = await service.getRoleDisplayName('custom_role');

      expect(displayName).toBe('Custom Display Name');
    });

    it('should return role ID when custom role not found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const displayName = await service.getRoleDisplayName('unknown_custom');

      expect(displayName).toBe('unknown_custom');
    });
  });

  describe('getRoleDisplayNameSync', () => {
    it('should return display names for default roles synchronously', () => {
      expect(service.getRoleDisplayNameSync('admin')).toBe('Administrador');
      expect(service.getRoleDisplayNameSync('secretary')).toBe('Secret\u00e1rio');
      expect(service.getRoleDisplayNameSync('member')).toBe('Membro');
    });

    it('should return role ID for unknown roles', () => {
      expect(service.getRoleDisplayNameSync('unknown')).toBe('unknown');
    });
  });

  describe('resetRolePermissionsToDefault', () => {
    it('should reset role to default permissions', async () => {
      mockSetDoc.mockResolvedValueOnce(undefined);

      await service.resetRolePermissionsToDefault('secretary', 'admin');

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          role: 'secretary',
          modules: DEFAULT_ROLE_PERMISSIONS['secretary'],
          updatedBy: 'admin'
        })
      );
    });

    it('should throw error for unknown role', async () => {
      // The method catches the original error and throws a generic one
      await expect(
        service.resetRolePermissionsToDefault('unknown_role', 'admin')
      ).rejects.toThrow('Erro ao resetar permissões da função');
    });
  });

  describe('getPermissionMatrix', () => {
    it('should return permission matrix for all roles', async () => {
      // Mock getAllRoles
      mockGetDocs.mockResolvedValueOnce({ docs: [] }); // No custom roles

      // Mock getRolePermissions for each default role
      for (let i = 0; i < 6; i++) {
        mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      }

      const matrix = await service.getPermissionMatrix();

      expect(matrix).toBeInstanceOf(Map);
      expect(matrix.has('admin')).toBe(true);
      expect(matrix.has('member')).toBe(true);

      const adminPerms = matrix.get('admin');
      expect(adminPerms).toBeInstanceOf(Map);
      expect(adminPerms?.has(SystemModule.Users)).toBe(true);
      expect(adminPerms?.get(SystemModule.Users)).toContain(PermissionAction.Manage);
    });
  });

  // ========== USER ROLE PERMISSIONS TESTS ==========
  describe('updateUserRolePermissions', () => {
    it('should clear rolePermissions for default roles', async () => {
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await service.updateUserRolePermissions('user-123', 'admin');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rolePermissions: null
        })
      );
    });

    it('should copy custom role permissions to user document', async () => {
      const customModules = [
        { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create] }
      ];

      // Mock getCustomRole
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          modules: customModules,
          isActive: true,
          createdBy: 'admin',
          createdAt: { toDate: () => new Date() }
        })
      });

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await service.updateUserRolePermissions('user-456', 'custom_role');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rolePermissions: customModules
        })
      );
    });

    it('should clear rolePermissions when custom role not found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });
      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await service.updateUserRolePermissions('user-789', 'nonexistent_role');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rolePermissions: null
        })
      );
    });
  });

  describe('syncRolePermissionsForRole', () => {
    it('should update rolePermissions for all users with the role', async () => {
      const roleModules = [
        { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create] }
      ];

      // Mock getCustomRole
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          modules: roleModules,
          isActive: true,
          createdBy: 'admin',
          createdAt: { toDate: () => new Date() }
        })
      });

      // Mock users query
      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'user-1', ref: { id: 'user-1-ref' } },
          { id: 'user-2', ref: { id: 'user-2-ref' } },
          { id: 'user-3', ref: { id: 'user-3-ref' } }
        ]
      });

      mockUpdateDoc.mockResolvedValue(undefined);

      const count = await service.syncRolePermissionsForRole('custom_role');

      expect(count).toBe(3);
      expect(mockUpdateDoc).toHaveBeenCalledTimes(3);
    });

    it('should return 0 when custom role not found', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => false
      });

      const count = await service.syncRolePermissionsForRole('nonexistent');

      expect(count).toBe(0);
    });

    it('should set rolePermissions to null when role is inactive', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          modules: [{ module: SystemModule.Blog, actions: [PermissionAction.View] }],
          isActive: false,
          createdBy: 'admin',
          createdAt: { toDate: () => new Date() }
        })
      });

      mockGetDocs.mockResolvedValueOnce({
        docs: [
          { id: 'user-1', ref: { id: 'user-1-ref' } }
        ]
      });

      mockUpdateDoc.mockResolvedValueOnce(undefined);

      await service.syncRolePermissionsForRole('inactive_role');

      expect(mockUpdateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          rolePermissions: null
        })
      );
    });
  });

  // ========== CACHE MANAGEMENT TESTS ==========
  describe('Cache Management', () => {
    describe('clearAllCache', () => {
      it('should clear all cached data', async () => {
        // Populate cache
        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            role: 'admin',
            modules: DEFAULT_ROLE_PERMISSIONS['admin']
          })
        });
        await service.getRolePermissions('admin');

        // Clear cache
        service.clearAllCache();

        // Next call should hit Firestore
        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            role: 'admin',
            modules: DEFAULT_ROLE_PERMISSIONS['admin']
          })
        });
        await service.getRolePermissions('admin');

        expect(mockGetDoc).toHaveBeenCalledTimes(2);
      });
    });

    describe('cache expiration', () => {
      it('should use cached data within cache duration', async () => {
        mockGetDoc.mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            role: 'member',
            modules: DEFAULT_ROLE_PERMISSIONS['member']
          })
        });

        await service.getRolePermissions('member');
        await service.getRolePermissions('member');
        await service.getRolePermissions('member');

        expect(mockGetDoc).toHaveBeenCalledTimes(1);
      });
    });
  });
});
