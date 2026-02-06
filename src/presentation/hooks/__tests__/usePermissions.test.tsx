// Unit Tests - usePermissions Hook
// Comprehensive tests for permission checking functionality

import { renderHook, act, waitFor } from '@testing-library/react';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { User, UserRole, UserStatus } from '@/domain/entities/User';

// Import after mocks are set up
import {
  usePermissions
} from '../usePermissions';

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
let mockUser: User | null = null;

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockUser
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

describe('usePermissions Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockGetUserPermissionsMap.mockResolvedValue(new Map());
    mockSubscribeToUserPermissions.mockImplementation(() => {});
  });

  describe('Initial State', () => {
    it('should return loading true initially when user is logged in', async () => {
      mockUser = createMockUser();
      mockGetUserPermissionsMap.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => usePermissions());

      expect(result.current.loading).toBe(true);
    });

    it('should return empty permissions when no user is logged in', async () => {
      mockUser = null;

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
    });

    it('should return loading false when user has no id', async () => {
      mockUser = { ...createMockUser(), id: '' };

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
    });
  });

  describe('hasPermission Function', () => {
    it('should return true when user has the permission', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(true);
      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.Create)).toBe(true);
    });

    it('should return false when user does not have the permission', async () => {
      mockUser = createMockUser({ role: UserRole.Member });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.Delete)).toBe(false);
      expect(result.current.hasPermission(SystemModule.Events, PermissionAction.Delete)).toBe(false);
    });

    it('should return false for module not in permissions map', async () => {
      mockUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.View)).toBe(false);
    });
  });

  describe('hasAnyPermission Function', () => {
    it('should return true when user has at least one of the permissions', async () => {
      mockUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Members, actions: [PermissionAction.View] },
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAnyPermission([])).toBe(false);
    });
  });

  describe('hasAllPermissions Function', () => {
    it('should return true when user has all permissions', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View] },
        { module: SystemModule.Members, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAllPermissions([])).toBe(true);
    });
  });

  describe('Role Checks', () => {
    it('should correctly identify admin role', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(true);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });

    it('should correctly identify secretary role', async () => {
      mockUser = createMockUser({ role: UserRole.Secretary });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(true);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });

    it('should correctly identify leader role', async () => {
      mockUser = createMockUser({ role: 'leader' });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(true);
      expect(result.current.isMember).toBe(false);
    });

    it('should correctly identify member role', async () => {
      mockUser = createMockUser({ role: UserRole.Member });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(true);
    });

    it('should handle custom roles', async () => {
      mockUser = createMockUser({ role: 'custom_role' });
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Custom role should not match any predefined role
      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isLeader).toBe(false);
      expect(result.current.isMember).toBe(false);
    });
  });

  describe('Loading States', () => {
    it('should set loading to true while fetching permissions', async () => {
      mockUser = createMockUser();
      let resolvePromise: (value: any) => void;
      const promise = new Promise(resolve => {
        resolvePromise = resolve;
      });
      mockGetUserPermissionsMap.mockReturnValue(promise);

      const { result } = renderHook(() => usePermissions());

      expect(result.current.loading).toBe(true);

      await act(async () => {
        resolvePromise!(new Map());
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after permissions are loaded', async () => {
      mockUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false immediately when no user', async () => {
      mockUser = null;

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle permission loading errors gracefully', async () => {
      mockUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap.mockRejectedValue(new Error('Permission loading failed'));

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.permissions.size).toBe(0);
      expect(consoleSpy).toHaveBeenCalledWith('Error loading permissions:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should return false for all permissions when error occurs', async () => {
      mockUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap.mockRejectedValue(new Error('Error'));

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPermission(SystemModule.Users, PermissionAction.View)).toBe(false);
      expect(result.current.hasPermission(SystemModule.Finance, PermissionAction.Manage)).toBe(false);

      consoleSpy.mockRestore();
    });
  });

  describe('checkPermission Async Function', () => {
    it('should check permission via getUserPermissionsMap', async () => {
      mockUser = createMockUser();
      const permissionMap = createPermissionMap([
        { module: SystemModule.Users, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(permissionMap);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = null;

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const hasPermission = await result.current.checkPermission(
        SystemModule.Users,
        PermissionAction.View
      );

      expect(hasPermission).toBe(false);
    });
  });

  describe('refreshPermissions Function', () => {
    it('should invalidate cache and reload permissions', async () => {
      mockUser = createMockUser();
      const initialPermissions = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      const updatedPermissions = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create] }
      ]);

      mockGetUserPermissionsMap
        .mockResolvedValueOnce(initialPermissions)
        .mockResolvedValueOnce(updatedPermissions);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser();
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserPermissionsMap
        .mockResolvedValueOnce(new Map())
        .mockRejectedValueOnce(new Error('Refresh failed'));

      const { result } = renderHook(() => usePermissions());

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
      mockUser = null;

      const { result } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      await act(async () => {
        await result.current.refreshPermissions();
      });

      expect(mockInvalidateUserPermissionCache).not.toHaveBeenCalled();
      expect(mockGetUserPermissionsMap).not.toHaveBeenCalled();
    });
  });

  describe('Real-time Subscription', () => {
    it('should subscribe to permission updates on mount', async () => {
      mockUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      renderHook(() => usePermissions());

      await waitFor(() => {
        expect(mockSubscribeToUserPermissions).toHaveBeenCalledWith(
          'user-123',
          expect.any(Function)
        );
      });
    });

    it('should unsubscribe on unmount', async () => {
      mockUser = createMockUser();
      mockGetUserPermissionsMap.mockResolvedValue(new Map());

      const { unmount } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(mockSubscribeToUserPermissions).toHaveBeenCalled();
      });

      unmount();

      expect(mockUnsubscribeFromUser).toHaveBeenCalledWith('user-123');
    });

    it('should reload permissions when subscription callback is triggered', async () => {
      mockUser = createMockUser();
      let subscriptionCallback: () => void;
      mockSubscribeToUserPermissions.mockImplementation((userId, callback) => {
        subscriptionCallback = callback;
      });

      const initialPermissions = createPermissionMap([
        { module: SystemModule.Events, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(initialPermissions);

      const { result } = renderHook(() => usePermissions());

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
  });

  describe('User Change Handling', () => {
    it('should reload permissions when user changes', async () => {
      const user1 = createMockUser({ id: 'user-1' });
      const user2 = createMockUser({ id: 'user-2' });

      mockUser = user1;
      const user1Permissions = createPermissionMap([
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(user1Permissions);

      const { result, rerender } = renderHook(() => usePermissions());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(mockGetUserPermissionsMap).toHaveBeenCalledWith('user-1');

      // Change user
      mockUser = user2;
      const user2Permissions = createPermissionMap([
        { module: SystemModule.Finance, actions: [PermissionAction.Manage] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(user2Permissions);

      rerender();

      await waitFor(() => {
        expect(mockGetUserPermissionsMap).toHaveBeenCalledWith('user-2');
      });
    });
  });
});

describe('Integration Scenarios', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Admin User', () => {
    it('should have full access to all modules', async () => {
      mockUser = createMockUser({ role: UserRole.Admin });
      const fullPermissions = createPermissionMap([
        { module: SystemModule.Dashboard, actions: [PermissionAction.View, PermissionAction.Manage] },
        { module: SystemModule.Users, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
        { module: SystemModule.Finance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update, PermissionAction.Delete, PermissionAction.Manage] },
        { module: SystemModule.Permissions, actions: [PermissionAction.View, PermissionAction.Update, PermissionAction.Manage] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(fullPermissions);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser({ role: UserRole.Member });
      const memberPermissions = createPermissionMap([
        { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
        { module: SystemModule.Events, actions: [PermissionAction.View] },
        { module: SystemModule.Blog, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(memberPermissions);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser({ role: UserRole.Secretary });
      const secretaryPermissions = createPermissionMap([
        { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
        { module: SystemModule.Members, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
        { module: SystemModule.Blog, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
        { module: SystemModule.Events, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(secretaryPermissions);

      const { result } = renderHook(() => usePermissions());

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
      mockUser = createMockUser({ role: UserRole.Professional });
      const professionalPermissions = createPermissionMap([
        { module: SystemModule.Dashboard, actions: [PermissionAction.View] },
        { module: SystemModule.Assistance, actions: [PermissionAction.View, PermissionAction.Create, PermissionAction.Update] },
        { module: SystemModule.Members, actions: [PermissionAction.View] }
      ]);
      mockGetUserPermissionsMap.mockResolvedValue(professionalPermissions);

      const { result } = renderHook(() => usePermissions());

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
