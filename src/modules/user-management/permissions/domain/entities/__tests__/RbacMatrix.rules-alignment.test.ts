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
    expect(
      PermissionManager.hasPermission('secretary', SystemModule.Pedagogy, PermissionAction.Manage)
    ).toBe(true);
  });

  it('every role in DEFAULT_ROLE_PERMISSIONS is a known firestore role string', () => {
    const known = ['admin', 'secretary', 'professional', 'leader', 'member', 'finance', 'pedagogical_coordinator', 'educator'];
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
      'function hasGrantedModule(',
      'function canAccessFinance()',
      'function canAccessFichas()',
      'function canAccessAssistance()',
      'function canManageOng()',
      'function canAccessPedagogy()',
    ]) {
      expect(rules).toContain(helper);
    }
    expect(rules).toMatch(/match \/members\/\{/);
    expect(rules).toMatch(/match \/transactions\/\{/);
  });

  /**
   * Contrato ampliado: lê o arquivo real e valida deny/allow por padrão nas
   * collections críticas. Não substitui o emulator (@firebase/rules-unit-testing
   * não está no package web; ver README P2).
   */
  it('firestore.rules amarra write sensível a helpers (members, finance, fichas)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

    // members: read approved, write só staff
    expect(rules).toMatch(
      /match \/members\/\{docId\}[\s\S]*?allow write:\s*if canWriteMembers\(\)/
    );
    expect(rules).toContain('function canWriteMembers()');
    expect(rules).toMatch(/canWriteMembers\(\)[\s\S]*?isStaff\(\)/);

    // finance: transactions e afins (role admin|finance OR custom grant)
    expect(rules).toMatch(
      /match \/transactions\/\{docId\}[\s\S]*?allow read, write:\s*if canAccessFinance\(\)/
    );
    expect(rules).toMatch(
      /function canAccessFinance\(\)[\s\S]*?\(isAdmin\(\) \|\| isFinance\(\) \|\| hasGrantedModule\('finance'\)\)/
    );

    // fichas clínicas
    expect(rules).toMatch(
      /match \/fichasAcompanhamento\/\{docId\}[\s\S]*?allow read, write:\s*if canAccessFichas\(\)/
    );
    expect(rules).toMatch(
      /function canAccessFichas\(\)[\s\S]*?\(isAdmin\(\) \|\| isProfessional\(\) \|\| isSecretary\(\)\)/
    );

    // member role na UI não tem finance create — alinhado a finance helper sem role member
    expect(
      PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.Create)
    ).toBe(false);
    expect(rules).not.toMatch(/function canAccessFinance\(\)[\s\S]{0,80}isMember/);

    expect(rules).toMatch(
      /match \/classRosters\/\{docId\}[\s\S]*?allow create, update, delete:\s*if canManagePedagogy\(\)/
    );
    expect(rules).toMatch(
      /function canManagePedagogy\(\)[\s\S]*?\(isAdmin\(\) \|\| isPedagogicalCoordinator\(\) \|\| isSecretary\(\)\)/
    );
  });

  it('firestore.rules honra customPermissions.granted nas helpers de finance/assistidos/ong', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const fs = require('fs') as typeof import('fs');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const path = require('path') as typeof import('path');
    const rules = fs.readFileSync(path.resolve(process.cwd(), 'firestore.rules'), 'utf8');

    expect(rules).toContain('function hasGrantedModule(');
    expect(rules).toContain("'customPermissions' in getUserData()");
    expect(rules).toContain("'granted' in getUserData().customPermissions");
    expect(rules).toContain('granted[0].module == moduleId');
    expect(rules).toContain('granted[9].module == moduleId');

    expect(rules).toMatch(
      /function canAccessFinance\(\)[\s\S]{0,250}hasGrantedModule\('finance'\)/
    );
    expect(rules).toMatch(
      /function canAccessAssistance\(\)[\s\S]{0,300}hasGrantedModule\('assistidos'\)/
    );
    expect(rules).toMatch(
      /function canAccessAssistance\(\)[\s\S]{0,300}hasGrantedModule\('assistance'\)/
    );
    expect(rules).toMatch(
      /function canManageOng\(\)[\s\S]{0,250}hasGrantedModule\('ong'\)/
    );

    // Grants não alargam a matriz de roles: member continua sem finance.
    expect(
      PermissionManager.hasPermission('member', SystemModule.Finance, PermissionAction.Create)
    ).toBe(false);
    expect(DEFAULT_ROLE_PERMISSIONS.member?.some((p) => p.module === SystemModule.Finance)).toBe(
      false
    );
  });
});
