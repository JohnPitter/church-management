// Unit Tests - useAtomicPermissions Hook
// Comprehensive tests for atomic permission checking with real-time updates
//
// @deprecated This hook is deprecated but maintained for backward compatibility
// Tests cover: permission checks, caching, error handling, real-time updates

import { renderHook, act, waitFor } from '@testing-library/react';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { User, UserRole, UserStatus } from '@/domain/entities/User';

// Import after mocks are set up
import { useAtomicPermissions } from '../useAtomicPermissions';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock permissionService (unified singleton)
const mockGetUserPermissionsMap = jest.fn();
const mockSubscribeToUserPermissions = jest.fn();
const mockUnsubscribeFromUser = jest.fn();
const mockInvalidateUserPermissionCache = jest.fn();

jest.mock('@modules/user-management/permissions/application/services/PermissionService', () => ({
  permissionService: {
    getUserPermissionsMap: (...args: any) => mockGetUserPermissionsMap(...args),
    subscribeToUserPermissions: (...args: any) => mockSubscribeToUserPermissions(...args),
    unsubscribeFromUser: (...args: any) => mockUnsubscribeFromUser(...args),
    invalidateUserPermissionCache: (...args: any) => mockInvalidateUserPermissionCache(...args)
  }
}));

// Mock AuthContext
let mockCurrentUser: User | null = null;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser
  })
}));

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

// Helper to create permission map
const createPermissionMap = (
  permissions: Array<{ module: SystemModule; actions: PermissionAction[] }>
): Map<SystemModule, Set<PermissionAction>> => {
  const map = new Map<SystemModule, Set<PermissionAction>>();
  permissions.forEach(p => {
    map.set(p.module, new Set(p.actions));
  });
  return map;
};

describe('useAtomicPermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = null;
    mockGetUserPermissionsMap.mockResolvedValue(new Map());
    mockSubscribeToUserPermissions.mockImplementation(() => {});
  });

  describe('Initial State and Loading', () => {
    it('should return loading true initially when user is logged in', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useAtomicPermissions());

      expect(result.current.loading).toBe(true);
    });

    it('should return empty permissions when no user is logged in', async () => {
      mockCurrentUser = null;

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
    });

    it('should return loading false when user has no id', async () => {
      mockCurrentUser = { ...createMockUser(), id: '' };

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
    });

    it('should set loading to false after permissions are loaded', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false immediately when no user', async () => {
      mockCurrentUser = null;

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Synchronous Permission Checks - hasPermission', () => {
    it('should return true when user has the permission', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Admin });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(true);
      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.Create)).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Member });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.Delete)).toBe(false);
      expect(result.current.hasPermission(SystemModule.Events, PermissionAction.Delete)).toBe(false);
    });

    it('should return false for module not in permissions map', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.View)).toBe(false);
    });

    it('should handle undefined module gracefully', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(false);
    });
  });

  describe('hasAnyPermission Function', () => {
    it('should return true when user has at least one of the permissions', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Members, actions: [PermissionAction.View] },
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasAny = result.current.hasAnyPermission([
        { module: SystemModule.Users, action: PermissionAction.Delete },
        { module: SystemModule.Members, action: PermissionAction.View },
        { module: SystemModule.Finance, action: PermissionAction.Manage }
      ]);

      expect(hasAny).toBe(true);
    });

    it('should return false when user has none of the permissions', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasAny = result.current.hasAnyPermission([
        { module: SystemModule.Users, action: PermissionAction.Delete },
        { module: SystemModule.Finance, action: PermissionAction.Manage }
      ]);

      expect(hasAny).toBe(false);
    });

    it('should return false for empty checks array', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission([])).toBe(false);
    });

    it('should handle single permission check', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Dashboard, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission([
        { module: SystemModule.Dashboard, action: PermissionAction.View }
      ])).toBe(true);
    });
  });

  describe('hasAllPermissions Function', () => {
    it('should return true when user has all permissions', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Admin });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasAll = result.current.hasAllPermissions([
        { module: SystemModule.Users, action: PermissionAction.View },
        { module: SystemModule.Users, action: PermissionAction.Create },
        { module: SystemModule.Members, action: PermissionAction.View }
      ]);

      expect(hasAll).toBe(true);
    });

    it('should return false when user is missing any permission', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View] },
        { module: SystemModule.Members, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasAll = result.current.hasAllPermissions([
        { module: SystemModule.Users, action: PermissionAction.View },
        { module: SystemModule.Users, action: PermissionAction.Delete } // Missing
      ]);

      expect(hasAll).toBe(false);
    });

    it('should return true for empty checks array', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions([])).toBe(true);
    });

    it('should handle single permission check', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Finance, actions: [PermissionAction.Manage] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions([
        { module: SystemModule.Finance, action: PermissionAction.Manage }
      ])).toBe(true);
    });
  });

  describe('Asynchronous Permission Check - checkPermission', () => {
    it('should check permission via getUserPermissionsMap', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasPermission = await result.current.checkPermission(
        SystemModule.Users,
        PermissionAction.View
      );

      expect(hasPermission).toBe(true);
    });

    it('should return false when user is not logged in', async () => {
      mockCurrentUser = null;

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasPermission = await result.current.checkPermission(
        SystemModule.Users,
        PermissionAction.View
      );

      expect(hasPermission).toBe(false);
    });

    it('should return false when permission is not in map', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasPermission = await result.current.checkPermission(
        SystemModule.Finance,
        PermissionAction.Delete
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('Role Checks', () => {
    it('should correctly identify admin role', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Admin });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });

    it('should correctly identify secretary role', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Secretary });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(true);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });

    it('should correctly identify leader role', async () => {
      mockCurrentUser = createMockUser({ role: 'leader' });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(true);
      expect(result.current.isMember).toBe(false);
    });

    it('should correctly identify member role', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Member });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(true);
    });

    it('should handle custom roles', async () => {
      mockCurrentUser = createMockUser({ role: 'custom_role' });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Custom role should not match any predefined role
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });

    it('should handle professional role', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Professional });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle permission loading errors gracefully', async () => {
      mockCurrentUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap.mockRejectedValue(new Error('Permission loading failed'));

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading permissions:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return false for all permissions when error occurs', async () => {
      mockCurrentUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(false);
      expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.Manage)).toBe(false);

      consoleSpy.mockRestore();
    });

    it('should handle network timeout errors', async () => {
      mockCurrentUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap.mockRejectedValue(new Error('Network timeout'));

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle undefined errors', async () => {
      mockCurrentUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap.mockRejectedValue(undefined);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);

      consoleSpy.mockRestore();
    });
  });

  describe('refreshPermissions Function', () => {
    it('should invalidate cache and reload permissions', async () => {
      mockCurrentUser = createMockUser();
      const initialPermissions = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      const updatedPermissions = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);

      mockGetUserPermissionsMap
        .mockResolvedValueOnce(initialPermissions)
        .mockResolvedValueOnce(updatedPermissions);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Blog, PermissionAction.Create)).toBe(false);

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(mockInvalidateUserPermissionCache).toHaveBeenCalledWith('user-123');
      expect(result.current.hasPermission(SystemModule.Blog, PermissionAction.Create)).toBe(true);
    });

    it('should handle refresh errors gracefully', async () => {
      mockCurrentUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap
        .mockResolvedValueOnce(new Map())
        .mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error refreshing permissions:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should do nothing when no user is logged in', async () => {
      mockCurrentUser = null;

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(mockInvalidateUserPermissionCache).not.toHaveBeenCalled();
      expect(mockGetUserPermissionsMap).not.toHaveBeenCalled();
    });

    it('should set loading state during refresh', async () => {
      mockCurrentUser = createMockUser();
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });

      mockGetUserPermissionsMap
        .mockResolvedValueOnce(new Map())
        .mockReturnValueOnce(promise as any);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.refreshPermissions();
      });

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(new Map());
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Real-time Subscription', () => {
    it('should subscribe to permission updates on mount', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(mockSubscribeToUserPermissions).toHaveBeenCalledWith(
          'user-123',
          expect.any(Function)
        );
      });
    });

    it('should unsubscribe on unmount', async () => {
      mockCurrentUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { unmount } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(mockSubscribeToUserPermissions).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribeFromUser).toHaveBeenCalledWith('user-123');
    });

    it('should reload permissions when subscription callback is triggered', async () => {
      mockCurrentUser = createMockUser();
      let subscriptionCallback: () => void;
      mockSubscribeToUserPermissions.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
      });

      const initialPermissions = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(initialPermissions);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Simulate real-time update
      const updatedPermissions = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Manage] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(updatedPermissions);

      await act(async () => {
        subscriptionCallback!();
      });

      await waitFor(() => {
        expect(result.current.hasPermission(SystemModule.Events, PermissionAction.Manage)).toBe(true);
      });
    });

    it('should handle subscription callback errors', async () => {
      mockCurrentUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      let subscriptionCallback: () => void;

      mockSubscribeToUserPermissions.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
      });

      mockGetUserPermissionsMap
        .mockResolvedValueOnce(new Map())
        .mockRejectedValueOnce(new Error('Subscription error'));

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        subscriptionCallback!();
      });

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('User Change Handling', () => {
    it('should reload permissions when user changes', async () => {
      const user1 = createMockUser({ id: 'user-1' });
      const user2 = createMockUser({ id: 'user-2' });

      mockCurrentUser = user1;
      const user1Permissions = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(user1Permissions);

      const { result, rerender } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetUserPermissionsMap).toHaveBeenCalledWith('user-1');

      // Change user
      mockCurrentUser = user2;
      const user2Permissions = createPermissionMap([
        { module: SystemModule.Finance, actions: [PermissionAction.Manage] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(user2Permissions);

      rerender();

      await waitFor(() => {
        expect(mockGetUserPermissionsMap).toHaveBeenCalledWith('user-2');
      });
    });

    it('should unsubscribe from old user and subscribe to new user', async () => {
      const user1 = createMockUser({ id: 'user-1' });
      const user2 = createMockUser({ id: 'user-2' });

      mockCurrentUser = user1;
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { rerender } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(mockSubscribeToUserPermissions).toHaveBeenCalledWith('user-1', expect.any(Function));
      });

      // Change user
      mockCurrentUser = user2;
      rerender();

      await waitFor(() => {
        expect(mockUnsubscribeFromUser).toHaveBeenCalledWith('user-1');
        expect(mockSubscribeToUserPermissions).toHaveBeenCalledWith('user-2', expect.any(Function));
      });
    });

    it('should clear permissions when user logs out', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result, rerender } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(true);

      // User logs out
      mockCurrentUser = null;
      rerender();

      await waitFor(() => {
        expect(result.current.permissions.size).toBe(0);
        expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(false);
      });
    });
  });

  describe('Permission Caching', () => {
    it('should use cached permissions for synchronous checks', async () => {
      mockCurrentUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Multiple synchronous checks should not trigger additional API calls
      result.current.hasPermission(SystemModule.Members, PermissionAction.View);
      result.current.hasPermission(SystemModule.Members, PermissionAction.Create);
      result.current.hasPermission(SystemModule.Members, PermissionAction.Delete);

      expect(mockGetUserPermissionsMap).toHaveBeenCalledTimes(1);
    });

    it('should update cache after refreshPermissions', async () => {
      mockCurrentUser = createMockUser();
      const oldPermissions = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      const newPermissions = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] }
      ]);

      mockGetUserPermissionsMap
        .mockResolvedValueOnce(oldPermissions)
        .mockResolvedValueOnce(newPermissions);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Events, PermissionAction.Update)).toBe(false);

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(result.current.hasPermission(SystemModule.Events, PermissionAction.Update)).toBe(true);
    });
  });

  describe('Integration Scenarios', () => {
    describe('Admin User', () => {
      it('should have full access to all modules', async () => {
        mockCurrentUser = createMockUser({ role: UserRole.Admin });
        const fullPermissions = createPermissionMap([
          { module: SystemModule.Dashboard, actions: [PermissionAction.View, PermissionAction.Manage] },
          { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
          { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
          { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
          { module: SystemModule.Permissions, actions: [PermissionAction.View, PermissionAction.Update, PermissionAction.Manage] }
        ]);
        mockGetUserPermissionsMap.mockResolvedValue(fullPermissions);

        const { result } = renderHook(() => useAtomicPermissions());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isAdmin).toBe(true);
        expect(result.current.hasPermission(SystemModule.Users, PermissionAction.Manage)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.Delete)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Permissions, PermissionAction.Manage)).toBe(true);
      });
    });

    describe('Member User', () => {
      it('should have limited access', async () => {
        mockCurrentUser = createMockUser({ role: UserRole.Member });
        const memberPermissions = createPermissionMap([
          { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
          { module: SystemModule.Events, actions: [PermissionAction.View] },
          { module: SystemModule.Blog, actions: [PermissionAction.View] }
        ]);
        mockGetUserPermissionsMap.mockResolvedValue(memberPermissions);

        const { result } = renderHook(() => useAtomicPermissions());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isMember).toBe(true);
        expect(result.current.hasPermission(SystemModule.Dashboard, PermissionAction.View)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Events, PermissionAction.View)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(false);
        expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.View)).toBe(false);
      });
    });

    describe('Secretary User', () => {
      it('should have content management access', async () => {
        mockCurrentUser = createMockUser({ role: UserRole.Secretary });
        const secretaryPermissions = createPermissionMap([
          { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
          { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
          { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
          { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] }
        ]);
        mockGetUserPermissionsMap.mockResolvedValue(secretaryPermissions);

        const { result } = renderHook(() => useAtomicPermissions());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.isSecretary).toBe(true);
        expect(result.current.hasPermission(SystemModule.Members, PermissionAction.Create)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Members, PermissionAction.Delete)).toBe(false);
        expect(result.current.hasPermission(SystemModule.Blog, PermissionAction.Update)).toBe(true);
      });
    });

    describe('Professional User', () => {
      it('should have assistance-specific access', async () => {
        mockCurrentUser = createMockUser({ role: UserRole.Professional });
        const professionalPermissions = createPermissionMap([
          { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
          { module: SystemModule.Assistance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
          { module: SystemModule.Members, actions: [PermissionAction.View] }
        ]);
        mockGetUserPermissionsMap.mockResolvedValue(professionalPermissions);

        const { result } = renderHook(() => useAtomicPermissions());

        await waitFor(() => {
          expect(result.current.loading).toBe(false);
        });

        expect(result.current.hasPermission(SystemModule.Assistance, PermissionAction.Create)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Assistance, PermissionAction.Delete)).toBe(false);
        expect(result.current.hasPermission(SystemModule.Members, PermissionAction.View)).toBe(true);
        expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.View)).toBe(false);
      });
    });
  });

  describe('Complex Permission Scenarios', () => {
    it('should handle multiple permission checks efficiently', async () => {
      mockCurrentUser = createMockUser({ role: UserRole.Admin });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete] },
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create] },
        { module: SystemModule.Finance, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasAnyAdmin = result.current.hasAnyPermission([
        { module: SystemModule.Users, action: PermissionAction.Delete },
        { module: SystemModule.Finance, action: PermissionAction.Manage }
      ]);

      const hasAllContent = result.current.hasAllPermissions([
        { module: SystemModule.Members, action: PermissionAction.View },
        { module: SystemModule.Members, action: PermissionAction.Create }
      ]);

      expect(hasAnyAdmin).toBe(true);
      expect(hasAllContent).toBe(true);
    });

    it('should handle permission updates correctly', async () => {
      mockCurrentUser = createMockUser();
      const initialPerms = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(initialPerms);

      const { result } = renderHook(() => useAtomicPermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Blog, PermissionAction.Create)).toBe(false);

      // Simulate permission update
      const updatedPerms = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(updatedPerms);

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(result.current.hasPermission(SystemModule.Blog, PermissionAction.Create)).toBe(true);
      expect(result.current.hasPermission(SystemModule.Blog, PermissionAction.Update)).toBe(true);
    });
  });
});
