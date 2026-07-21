/**
 * Alinhamento documentado entre DEFAULT_ROLE_PERMISSIONS e firestore.rules.
 * Nao executa o emulator — valida a matriz de roles no TS para evitar regressao
 * silenciosa quando o RBAC de UI muda sem espelhar nas rules.
 */
import {
  DEFAULT_ROLE_PERMISSIONS,
  PermissionAction,
  SystemModule,
  PermissionManager,
} from '../Permission';

describe('RBAC matrix (rules alignment contract)', () => {
  it('admin has finance manage and members manage', () => {
    expect(
      PermissionManager.hasPermission('admin', SystemModule.Finance, PermissionAction.Manage)
    ).toBe(true);
    expect(
      PermissionManager.hasPermission('admin', SystemModule.Members, PermissionAction.Manage)
    ).toBe(true);
  });

  it('member cannot write finance or members', () => {
    expect(
      PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.Create)
    ).toBe(false);
    expect(
      PermissionManager.hasPermission('member', SystemModule.Members, PermissionAction.Update)
    ).toBe(false);
  });

  it('finance role can manage finance but not settings manage', () => {
    expect(
      PermissionManager.hasPermission('finance', SystemModule.Finance, PermissionAction.Manage)
    ).toBe(true);
    expect(
      PermissionManager.hasPermission('finance', SystemModule.Settings, PermissionAction.Manage)
    ).toBe(false);
  });

  it('professional can update assistance, not finance', () => {
    expect(
      PermissionManager.hasPermission(
        'professional',
        SystemModule.Assistance,
        PermissionAction.Update
      )
    ).toBe(true);
    expect(
      PermissionManager.hasPermission('professional', SystemModule.Finance, PermissionAction.View)
    ).toBe(false);
  });

  it('secretary can update members and visitors but not finance manage', () => {
    expect(
      PermissionManager.hasPermission('secretary', SystemModule.Members, PermissionAction.Update)
    ).toBe(true);
    expect(
      PermissionManager.hasPermission('secretary', SystemModule.Visitors, PermissionAction.Create)
    ).toBe(true);
    expect(
      PermissionManager.hasPermission('secretary', SystemModule.Finance, PermissionAction.Manage)
    ).toBe(false);
  });

  it('every role in DEFAULT_ROLE_PERMISSIONS is a known firestore role string', () => {
    const known = ['admin', 'secretary', 'professional', 'leader', 'member', 'finance'];
    Object.keys(DEFAULT_ROLE_PERMISSIONS).forEach((role) => {
      expect(known).toContain(role);
    });
  });

  it('firestore.rules declara helpers RBAC esperados (contrato estático)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const rulesPath = path.resolve(process.cwd(), 'firestore.rules');
    const rules = fs.readFileSync(rulesPath, 'utf8');
    for (const helper of [
      'function isAdmin()',
      'function isStaff()',
      'function canWriteMembers()',
      'function canAccessFinance()',
      'function canAccessFichas()',
      'function canAccessAssistance()',
    ]) {
      expect(rules).toContain(helper);
    }
    expect(rules).toMatch(/match \/members\/\{/);
    expect(rules).toMatch(/match \/transactions\/\{/);
  });
});
