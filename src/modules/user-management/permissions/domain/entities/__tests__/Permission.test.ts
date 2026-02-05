// Unit Tests - Permission System
// Regression tests for permission management

import {
  SystemModule,
  PermissionAction,
  PermissionManager,
  DEFAULT_ROLE_PERMISSIONS,
  UserPermissionOverride
} from '../Permission';

describe('PermissionManager', () => {
  describe('hasPermission', () => {
    describe('Admin Role', () => {
      it('should have Manage permission on all modules', () => {
        const modules = Object.values(SystemModule);
        modules.forEach(module => {
          expect(PermissionManager.hasPermission('admin', module, PermissionAction.Manage)).toBe(true);
        });
      });

      it('should have View permission on all modules', () => {
        const modules = Object.values(SystemModule);
        modules.forEach(module => {
          expect(PermissionManager.hasPermission('admin', module, PermissionAction.View)).toBe(true);
        });
      });

      it('should have CRUD permissions on Users module', () => {
        expect(PermissionManager.hasPermission('admin', SystemModule.Users, PermissionAction.Create)).toBe(true);
        expect(PermissionManager.hasPermission('admin', SystemModule.Users, PermissionAction.Update)).toBe(true);
        expect(PermissionManager.hasPermission('admin', SystemModule.Users, PermissionAction.Delete)).toBe(true);
      });
    });

    describe('Secretary Role', () => {
      it('should have View permission on Dashboard', () => {
        expect(PermissionManager.hasPermission('secretary', SystemModule.Dashboard, PermissionAction.View)).toBe(true);
      });

      it('should NOT have Manage permission on Users', () => {
        expect(PermissionManager.hasPermission('secretary', SystemModule.Users, PermissionAction.Manage)).toBe(false);
      });

      it('should have Create permission on Members', () => {
        expect(PermissionManager.hasPermission('secretary', SystemModule.Members, PermissionAction.Create)).toBe(true);
      });

      it('should NOT have Delete permission on Members', () => {
        expect(PermissionManager.hasPermission('secretary', SystemModule.Members, PermissionAction.Delete)).toBe(false);
      });

      it('should NOT have access to Finance module', () => {
        expect(PermissionManager.hasPermission('secretary', SystemModule.Finance, PermissionAction.View)).toBe(false);
      });
    });

    describe('Member Role', () => {
      it('should have View permission on Dashboard', () => {
        expect(PermissionManager.hasPermission('member', SystemModule.Dashboard, PermissionAction.View)).toBe(true);
      });

      it('should have View permission on Events', () => {
        expect(PermissionManager.hasPermission('member', SystemModule.Events, PermissionAction.View)).toBe(true);
      });

      it('should NOT have Create permission on Events', () => {
        expect(PermissionManager.hasPermission('member', SystemModule.Events, PermissionAction.Create)).toBe(false);
      });

      it('should have Create permission on Forum (can post)', () => {
        expect(PermissionManager.hasPermission('member', SystemModule.Forum, PermissionAction.Create)).toBe(true);
      });

      it('should NOT have access to Users module', () => {
        expect(PermissionManager.hasPermission('member', SystemModule.Users, PermissionAction.View)).toBe(false);
      });

      it('should NOT have access to Finance module', () => {
        expect(PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.View)).toBe(false);
      });

      it('should NOT have Manage permission on any module', () => {
        const modules = Object.values(SystemModule);
        modules.forEach(module => {
          expect(PermissionManager.hasPermission('member', module, PermissionAction.Manage)).toBe(false);
        });
      });
    });

    describe('Leader Role', () => {
      it('should have View permission on Members', () => {
        expect(PermissionManager.hasPermission('leader', SystemModule.Members, PermissionAction.View)).toBe(true);
      });

      it('should have Create permission on Events', () => {
        expect(PermissionManager.hasPermission('leader', SystemModule.Events, PermissionAction.Create)).toBe(true);
      });

      it('should NOT have Delete permission on Events', () => {
        expect(PermissionManager.hasPermission('leader', SystemModule.Events, PermissionAction.Delete)).toBe(false);
      });
    });

    describe('Professional Role', () => {
      it('should have CRUD on Assistance module', () => {
        expect(PermissionManager.hasPermission('professional', SystemModule.Assistance, PermissionAction.View)).toBe(true);
        expect(PermissionManager.hasPermission('professional', SystemModule.Assistance, PermissionAction.Create)).toBe(true);
        expect(PermissionManager.hasPermission('professional', SystemModule.Assistance, PermissionAction.Update)).toBe(true);
      });

      it('should NOT have Delete on Assistance module', () => {
        expect(PermissionManager.hasPermission('professional', SystemModule.Assistance, PermissionAction.Delete)).toBe(false);
      });
    });

    describe('Finance Role', () => {
      it('should have full access to Finance module', () => {
        expect(PermissionManager.hasPermission('finance', SystemModule.Finance, PermissionAction.View)).toBe(true);
        expect(PermissionManager.hasPermission('finance', SystemModule.Finance, PermissionAction.Create)).toBe(true);
        expect(PermissionManager.hasPermission('finance', SystemModule.Finance, PermissionAction.Update)).toBe(true);
        expect(PermissionManager.hasPermission('finance', SystemModule.Finance, PermissionAction.Delete)).toBe(true);
        expect(PermissionManager.hasPermission('finance', SystemModule.Finance, PermissionAction.Manage)).toBe(true);
      });

      it('should NOT have access to Settings module', () => {
        expect(PermissionManager.hasPermission('finance', SystemModule.Settings, PermissionAction.View)).toBe(false);
      });
    });

    describe('Unknown Role', () => {
      it('should deny all permissions for unknown role', () => {
        expect(PermissionManager.hasPermission('unknown_role', SystemModule.Dashboard, PermissionAction.View)).toBe(false);
        expect(PermissionManager.hasPermission('nonexistent', SystemModule.Users, PermissionAction.Manage)).toBe(false);
      });
    });

    describe('Permission Overrides', () => {
      it('should grant additional permissions via override', () => {
        const overrides: UserPermissionOverride = {
          userId: 'test-user',
          grantedPermissions: [
            { id: '1', module: SystemModule.Finance, action: PermissionAction.View, description: 'View Finance' }
          ],
          revokedPermissions: []
        };

        // Member normally doesn't have Finance access
        expect(PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.View)).toBe(false);
        // But with override, they do
        expect(PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.View, overrides)).toBe(true);
      });

      it('should revoke permissions via override', () => {
        const overrides: UserPermissionOverride = {
          userId: 'test-user',
          grantedPermissions: [],
          revokedPermissions: [
            { id: '1', module: SystemModule.Users, action: PermissionAction.Manage, description: 'Manage Users' }
          ]
        };

        // Admin normally has Manage on Users
        expect(PermissionManager.hasPermission('admin', SystemModule.Users, PermissionAction.Manage)).toBe(true);
        // But with revocation override, they don't
        expect(PermissionManager.hasPermission('admin', SystemModule.Users, PermissionAction.Manage, overrides)).toBe(false);
      });

      it('should prioritize revocation over grant', () => {
        const overrides: UserPermissionOverride = {
          userId: 'test-user',
          grantedPermissions: [
            { id: '1', module: SystemModule.Finance, action: PermissionAction.Manage, description: 'Manage Finance' }
          ],
          revokedPermissions: [
            { id: '2', module: SystemModule.Finance, action: PermissionAction.Manage, description: 'Manage Finance' }
          ]
        };

        // Revocation should win
        expect(PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.Manage, overrides)).toBe(false);
      });
    });
  });

  describe('getRolePermissions', () => {
    it('should return all permissions for admin role', () => {
      const permissions = PermissionManager.getRolePermissions('admin');
      expect(permissions.length).toBeGreaterThan(0);

      // Should include Manage permission for Dashboard
      const dashboardManage = permissions.find(
        p => p.module === SystemModule.Dashboard && p.action === PermissionAction.Manage
      );
      expect(dashboardManage).toBeDefined();
    });

    it('should return limited permissions for member role', () => {
      const memberPermissions = PermissionManager.getRolePermissions('member');
      const adminPermissions = PermissionManager.getRolePermissions('admin');

      expect(memberPermissions.length).toBeLessThan(adminPermissions.length);
    });

    it('should return empty array for unknown role', () => {
      const permissions = PermissionManager.getRolePermissions('unknown_role');
      expect(permissions).toEqual([]);
    });
  });

  describe('DEFAULT_ROLE_PERMISSIONS', () => {
    it('should have all standard roles defined', () => {
      expect(DEFAULT_ROLE_PERMISSIONS['admin']).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS['secretary']).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS['leader']).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS['member']).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS['professional']).toBeDefined();
      expect(DEFAULT_ROLE_PERMISSIONS['finance']).toBeDefined();
    });

    it('should have admin with most permissions', () => {
      const adminModules = DEFAULT_ROLE_PERMISSIONS['admin'].length;
      const memberModules = DEFAULT_ROLE_PERMISSIONS['member'].length;

      expect(adminModules).toBeGreaterThan(memberModules);
    });
  });
});

describe('SystemModule', () => {
  it('should have all expected modules', () => {
    expect(SystemModule.Dashboard).toBe('dashboard');
    expect(SystemModule.Users).toBe('users');
    expect(SystemModule.Members).toBe('members');
    expect(SystemModule.Finance).toBe('finance');
    expect(SystemModule.Settings).toBe('settings');
    expect(SystemModule.Permissions).toBe('permissions');
  });
});

describe('PermissionAction', () => {
  it('should have all CRUD actions', () => {
    expect(PermissionAction.View).toBe('view');
    expect(PermissionAction.Create).toBe('create');
    expect(PermissionAction.Update).toBe('update');
    expect(PermissionAction.Delete).toBe('delete');
    expect(PermissionAction.Manage).toBe('manage');
  });
});
