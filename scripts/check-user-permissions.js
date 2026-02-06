#!/usr/bin/env node

/**
 * Script de diagnóstico de permissões de usuários
 * Usa serviceAccountKey.json para acessar Firestore diretamente
 *
 * Uso:
 *   node scripts/check-user-permissions.js <email>
 *   node scripts/check-user-permissions.js --all
 *   node scripts/check-user-permissions.js --role professional
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
const serviceAccount = require(path.resolve(__dirname, '..', 'serviceAccountKey.json'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Default role permissions (mirror of Permission.ts)
const DEFAULT_ROLE_PERMISSIONS = {
  admin: 'ALL MODULES - Manage',
  secretary: ['dashboard:view', 'users:view,update', 'members:view,create,update', 'blog:view,create,update', 'events:view,create,update', 'devotionals:view,create,update', 'transmissions:view,create,update', 'projects:view,create,update', 'forum:view,create,update', 'visitors:view,create,update', 'calendar:view,manage', 'assistidos:view,create,update', 'notifications:view,create', 'reports:view', 'settings:view'],
  professional: ['dashboard:view', 'assistance:view,create,update', 'members:view', 'calendar:view', 'reports:view'],
  leader: ['dashboard:view', 'members:view', 'events:view,create', 'projects:view,create', 'calendar:view'],
  member: ['dashboard:view', 'events:view', 'blog:view', 'devotionals:view', 'transmissions:view', 'projects:view', 'forum:view,create', 'calendar:view', 'leadership:view'],
  finance: ['dashboard:view', 'finance:view,create,update,delete,manage', 'donations:view,create,update,delete', 'reports:view', 'members:view', 'calendar:view']
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
  dim: '\x1b[2m'
};

function c(color, text) {
  return `${COLORS[color]}${text}${COLORS.reset}`;
}

async function getUserByEmail(email) {
  const snapshot = await db.collection('users').where('email', '==', email).get();
  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() };
}

async function getAllUsers() {
  const snapshot = await db.collection('users').get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getUsersByRole(role) {
  const snapshot = await db.collection('users').where('role', '==', role).get();
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

async function getRolePermissionsFromFirestore(role) {
  const doc = await db.collection('rolePermissions').doc(role).get();
  if (!doc.exists) return null;
  return doc.data();
}

async function getAllRolePermissions() {
  const snapshot = await db.collection('rolePermissions').get();
  const result = {};
  snapshot.docs.forEach(doc => {
    result[doc.id] = doc.data();
  });
  return result;
}

function hasManagePermission(modules) {
  if (!modules || !Array.isArray(modules)) return false;
  return modules.some(m => m.actions && m.actions.includes('manage'));
}

function getManageModules(modules) {
  if (!modules || !Array.isArray(modules)) return [];
  return modules.filter(m => m.actions && m.actions.includes('manage')).map(m => m.module);
}

async function diagnoseUser(user) {
  console.log('\n' + '='.repeat(70));
  console.log(c('bold', `  User: ${user.email}`));
  console.log('='.repeat(70));
  console.log(`  ${c('dim', 'ID:')}          ${user.id}`);
  console.log(`  ${c('dim', 'Role:')}        ${c('cyan', user.role || 'N/A')}`);
  console.log(`  ${c('dim', 'Status:')}      ${user.status === 'approved' ? c('green', user.status) : c('red', user.status || 'N/A')}`);
  console.log(`  ${c('dim', 'DisplayName:')} ${user.displayName || 'N/A'}`);

  // Step 1: Check rolePermissions in user document
  console.log(`\n  ${c('bold', '--- Permission Resolution Chain ---')}`);

  if (user.rolePermissions && Array.isArray(user.rolePermissions) && user.rolePermissions.length > 0) {
    console.log(`  ${c('yellow', '[1] rolePermissions NO DOC DO USUARIO (PRIORIDADE MAXIMA)')}`);
    console.log(`      Modules: ${user.rolePermissions.length}`);
    user.rolePermissions.forEach(m => {
      const hasManage = m.actions && m.actions.includes('manage');
      const prefix = hasManage ? c('red', '  !! MANAGE !!') : '             ';
      console.log(`      ${prefix} ${m.module}: [${m.actions.join(', ')}]`);
    });

    const manageModules = getManageModules(user.rolePermissions);
    if (manageModules.length > 0) {
      console.log(`\n  ${c('red', `  >>> MANAGE encontrado em: ${manageModules.join(', ')}`)}`);
      console.log(`  ${c('red', '  >>> ISSO faz o Painel Admin aparecer!')}`);
    }
  } else {
    console.log(`  ${c('green', '[1] rolePermissions no doc do user: VAZIO (ok, vai pro proximo)')}`);

    // Step 2: Check rolePermissions collection in Firestore
    const firestoreRolePerms = await getRolePermissionsFromFirestore(user.role);
    if (firestoreRolePerms && firestoreRolePerms.modules) {
      console.log(`  ${c('yellow', `[2] rolePermissions/${user.role} NO FIRESTORE (PRIORIDADE 2)`)}`);
      console.log(`      UpdatedBy: ${firestoreRolePerms.updatedBy || 'N/A'}`);
      console.log(`      UpdatedAt: ${firestoreRolePerms.updatedAt ? firestoreRolePerms.updatedAt.toDate().toISOString() : 'N/A'}`);
      console.log(`      Modules: ${firestoreRolePerms.modules.length}`);
      firestoreRolePerms.modules.forEach(m => {
        const hasManage = m.actions && m.actions.includes('manage');
        const prefix = hasManage ? c('red', '  !! MANAGE !!') : '             ';
        console.log(`      ${prefix} ${m.module}: [${m.actions.join(', ')}]`);
      });

      const manageModules = getManageModules(firestoreRolePerms.modules);
      if (manageModules.length > 0) {
        console.log(`\n  ${c('red', `  >>> MANAGE encontrado em: ${manageModules.join(', ')}`)}`);
        console.log(`  ${c('red', '  >>> ISSO faz o Painel Admin aparecer!')}`);
      }
    } else {
      console.log(`  ${c('green', `[2] rolePermissions/${user.role} no Firestore: NAO EXISTE (ok, vai pros defaults)`)}`);
      console.log(`  ${c('green', `[3] DEFAULT_ROLE_PERMISSIONS[${user.role}]:`)} ${JSON.stringify(DEFAULT_ROLE_PERMISSIONS[user.role] || 'N/A')}`);
    }
  }

  // Step 3: Check custom permissions (grants/revokes)
  if (user.customPermissions) {
    console.log(`\n  ${c('bold', '--- Custom Permission Overrides ---')}`);
    if (user.customPermissions.granted && user.customPermissions.granted.length > 0) {
      console.log(`  ${c('yellow', 'Grants:')}`);
      user.customPermissions.granted.forEach(g => {
        const hasManage = g.actions && g.actions.includes('manage');
        const prefix = hasManage ? c('red', '!! MANAGE !!') : '            ';
        console.log(`    ${prefix} ${g.module}: [${g.actions.join(', ')}]`);
      });
    }
    if (user.customPermissions.revoked && user.customPermissions.revoked.length > 0) {
      console.log(`  ${c('blue', 'Revokes:')}`);
      user.customPermissions.revoked.forEach(r => {
        console.log(`    ${r.module}: [${r.actions.join(', ')}]`);
      });
    }
  }

  // Final verdict
  console.log(`\n  ${c('bold', '--- Resultado ---')}`);
  const wouldSeeAdminPanel = await checkIfUserSeesAdminPanel(user);
  if (wouldSeeAdminPanel.visible) {
    console.log(`  ${c('red', `Painel Admin: VISIVEL (Manage via ${wouldSeeAdminPanel.source} em [${wouldSeeAdminPanel.modules.join(', ')}])`)}`);
  } else {
    console.log(`  ${c('green', 'Painel Admin: OCULTO (nenhum Manage encontrado)')}`);
  }
}

async function checkIfUserSeesAdminPanel(user) {
  const adminCheckModules = [
    'users', 'members', 'events', 'blog', 'finance', 'assistance',
    'leadership', 'transmissions', 'projects', 'devotionals', 'forum',
    'visitors', 'notifications', 'settings', 'ong'
  ];

  // Resolve permissions following the same chain as PermissionService
  let resolvedModules = [];
  let source = '';

  // Priority 1: user doc rolePermissions
  if (user.rolePermissions && Array.isArray(user.rolePermissions) && user.rolePermissions.length > 0) {
    resolvedModules = user.rolePermissions;
    source = 'user.rolePermissions';
  } else {
    // Priority 2: Firestore rolePermissions collection
    const firestorePerms = await getRolePermissionsFromFirestore(user.role);
    if (firestorePerms && firestorePerms.modules && firestorePerms.modules.length > 0) {
      resolvedModules = firestorePerms.modules;
      source = `rolePermissions/${user.role}`;
    } else {
      source = 'DEFAULT_ROLE_PERMISSIONS';
      // No manage in defaults for non-admin roles
      if (user.role !== 'admin') return { visible: false };
      return { visible: true, source, modules: ['ALL'] };
    }
  }

  // Apply custom grants
  if (user.customPermissions?.granted) {
    resolvedModules = [...resolvedModules, ...user.customPermissions.granted];
    if (user.customPermissions.granted.some(g => g.actions?.includes('manage'))) {
      source += ' + customPermissions.granted';
    }
  }

  // Check for manage in admin-checked modules
  const manageModules = resolvedModules
    .filter(m => adminCheckModules.includes(m.module) && m.actions?.includes('manage'))
    .map(m => m.module);

  return { visible: manageModules.length > 0, source, modules: manageModules };
}

async function showRolePermissionsSummary() {
  console.log('\n' + '='.repeat(70));
  console.log(c('bold', '  Firestore rolePermissions Collection (o que o admin salvou)'));
  console.log('='.repeat(70));

  const allPerms = await getAllRolePermissions();
  const roles = Object.keys(allPerms);

  if (roles.length === 0) {
    console.log(`  ${c('green', 'Nenhum documento encontrado - usando apenas defaults')}`);
    return;
  }

  for (const role of roles) {
    const data = allPerms[role];
    const modules = data.modules || [];
    const manageModules = getManageModules(modules);
    const manageInfo = manageModules.length > 0
      ? c('red', `  [MANAGE em: ${manageModules.join(', ')}]`)
      : c('green', '  [sem Manage]');

    console.log(`\n  ${c('cyan', role)}${manageInfo}`);
    console.log(`    updatedBy: ${data.updatedBy || 'N/A'} | updatedAt: ${data.updatedAt ? data.updatedAt.toDate().toISOString() : 'N/A'}`);
    console.log(`    ${modules.length} modules configurados`);
  }
}

// ========== CLEANUP FUNCTIONS ==========

async function clearAllCustomPermissions() {
  console.log(`\n${c('bold', '  Limpando customPermissions de TODOS os usuarios...')}\n`);

  const users = await getAllUsers();
  let cleaned = 0;
  let skipped = 0;

  for (const user of users) {
    if (user.customPermissions &&
        ((user.customPermissions.granted && user.customPermissions.granted.length > 0) ||
         (user.customPermissions.revoked && user.customPermissions.revoked.length > 0))) {
      console.log(`  ${c('yellow', 'Limpando')} ${user.email} (role: ${user.role})`);
      if (user.customPermissions.granted) {
        const manageGrants = user.customPermissions.granted
          .filter(g => g.actions && g.actions.includes('manage'))
          .map(g => g.module);
        if (manageGrants.length > 0) {
          console.log(`    ${c('red', 'Manage grants removidos:')} ${manageGrants.join(', ')}`);
        }
      }

      await db.collection('users').doc(user.id).update({
        customPermissions: admin.firestore.FieldValue.delete()
      });
      cleaned++;
    } else {
      skipped++;
    }
  }

  console.log(`\n  ${c('green', `Concluido: ${cleaned} usuarios limpos, ${skipped} sem customPermissions`)}`);
}

async function resetRolePermissionsToDefaults() {
  console.log(`\n${c('bold', '  Resetando rolePermissions no Firestore para os defaults...')}\n`);

  // Full defaults matching Permission.ts exactly
  const FULL_DEFAULTS = {
    admin: [
      { module: 'dashboard', actions: ['view', 'manage'] },
      { module: 'users', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'members', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'blog', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'events', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'devotionals', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'transmissions', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'projects', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'forum', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'leadership', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'visitors', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'calendar', actions: ['view', 'create', 'update', 'manage'] },
      { module: 'assistance', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'assistidos', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'notifications', actions: ['view', 'create', 'update', 'manage'] },
      { module: 'communication', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'ong', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'finance', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'donations', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'reports', actions: ['view', 'manage'] },
      { module: 'assets', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'settings', actions: ['view', 'update', 'manage'] },
      { module: 'permissions', actions: ['view', 'update', 'manage'] },
      { module: 'audit', actions: ['view', 'manage'] },
      { module: 'backup', actions: ['view', 'create', 'manage'] },
      { module: 'logs', actions: ['view', 'manage'] },
      { module: 'home_builder', actions: ['view', 'create', 'update', 'delete', 'manage'] }
    ],
    secretary: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'users', actions: ['view', 'update'] },
      { module: 'members', actions: ['view', 'create', 'update'] },
      { module: 'blog', actions: ['view', 'create', 'update'] },
      { module: 'events', actions: ['view', 'create', 'update'] },
      { module: 'devotionals', actions: ['view', 'create', 'update'] },
      { module: 'transmissions', actions: ['view', 'create', 'update'] },
      { module: 'projects', actions: ['view', 'create', 'update'] },
      { module: 'forum', actions: ['view', 'create', 'update'] },
      { module: 'visitors', actions: ['view', 'create', 'update'] },
      { module: 'calendar', actions: ['view', 'manage'] },
      { module: 'assistidos', actions: ['view', 'create', 'update'] },
      { module: 'notifications', actions: ['view', 'create'] },
      { module: 'reports', actions: ['view'] },
      { module: 'settings', actions: ['view'] }
    ],
    professional: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'assistance', actions: ['view', 'create', 'update'] },
      { module: 'members', actions: ['view'] },
      { module: 'calendar', actions: ['view'] },
      { module: 'reports', actions: ['view'] }
    ],
    leader: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'members', actions: ['view'] },
      { module: 'events', actions: ['view', 'create'] },
      { module: 'projects', actions: ['view', 'create'] },
      { module: 'calendar', actions: ['view'] }
    ],
    member: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'events', actions: ['view'] },
      { module: 'blog', actions: ['view'] },
      { module: 'devotionals', actions: ['view'] },
      { module: 'transmissions', actions: ['view'] },
      { module: 'projects', actions: ['view'] },
      { module: 'forum', actions: ['view', 'create'] },
      { module: 'calendar', actions: ['view'] },
      { module: 'leadership', actions: ['view'] }
    ],
    finance: [
      { module: 'dashboard', actions: ['view'] },
      { module: 'finance', actions: ['view', 'create', 'update', 'delete', 'manage'] },
      { module: 'donations', actions: ['view', 'create', 'update', 'delete'] },
      { module: 'reports', actions: ['view'] },
      { module: 'members', actions: ['view'] },
      { module: 'calendar', actions: ['view'] }
    ]
  };

  const defaultRoles = Object.keys(FULL_DEFAULTS);

  for (const role of defaultRoles) {
    const docRef = db.collection('rolePermissions').doc(role);
    const existing = await docRef.get();

    const currentModules = existing.exists ? (existing.data().modules || []) : [];
    const currentManage = getManageModules(currentModules);
    const newManage = getManageModules(FULL_DEFAULTS[role]);

    const changed = JSON.stringify(currentModules) !== JSON.stringify(FULL_DEFAULTS[role]);

    if (changed) {
      console.log(`  ${c('yellow', 'Resetando')} ${c('cyan', role)}`);
      if (currentManage.length > 0 && currentManage.length !== newManage.length) {
        console.log(`    ${c('red', 'Manage antes:')} ${currentManage.join(', ') || 'nenhum'}`);
        console.log(`    ${c('green', 'Manage depois:')} ${newManage.join(', ') || 'nenhum'}`);
      }

      await docRef.set({
        modules: FULL_DEFAULTS[role],
        updatedBy: 'script-reset-defaults',
        updatedAt: admin.firestore.Timestamp.now()
      });
    } else {
      console.log(`  ${c('green', 'Ja esta correto:')} ${c('cyan', role)}`);
    }
  }

  console.log(`\n  ${c('green', 'Concluido: todos os roles resetados para os defaults')}`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log(`
${c('bold', 'Uso:')}
  node scripts/check-user-permissions.js <email>              - Diagnosticar usuario por email
  node scripts/check-user-permissions.js --all                 - Listar todos os usuarios
  node scripts/check-user-permissions.js --role <role>         - Listar usuarios por role
  node scripts/check-user-permissions.js --roles               - Mostrar rolePermissions do Firestore
  node scripts/check-user-permissions.js --diagnose-all        - Diagnosticar TODOS os usuarios
  node scripts/check-user-permissions.js --clean               - Limpar customPermissions + resetar roles
  node scripts/check-user-permissions.js --clean-custom        - Limpar customPermissions de todos
  node scripts/check-user-permissions.js --reset-roles         - Resetar rolePermissions para defaults
`);
    process.exit(0);
  }

  try {
    if (args[0] === '--all') {
      const users = await getAllUsers();
      console.log(`\n${c('bold', `Total: ${users.length} usuarios`)}\n`);
      users.sort((a, b) => (a.role || '').localeCompare(b.role || ''));
      for (const user of users) {
        const result = await checkIfUserSeesAdminPanel(user);
        const adminIcon = result.visible ? c('red', '[ADMIN]') : c('dim', '       ');
        console.log(`  ${adminIcon} ${c('cyan', (user.role || 'N/A').padEnd(15))} ${(user.status || 'N/A').padEnd(10)} ${user.email}`);
      }
    } else if (args[0] === '--role') {
      const role = args[1];
      if (!role) {
        console.error('Especifique o role: --role professional');
        process.exit(1);
      }
      const users = await getUsersByRole(role);
      console.log(`\n${c('bold', `${users.length} usuarios com role "${role}"`)}\n`);
      for (const user of users) {
        await diagnoseUser(user);
      }
    } else if (args[0] === '--roles') {
      await showRolePermissionsSummary();
    } else if (args[0] === '--diagnose-all') {
      await showRolePermissionsSummary();
      const users = await getAllUsers();
      console.log(`\n${c('bold', `Diagnosticando ${users.length} usuarios...`)}`);
      for (const user of users) {
        await diagnoseUser(user);
      }
    } else if (args[0] === '--clean') {
      console.log(c('bold', '\n=== LIMPEZA COMPLETA ==='));
      await clearAllCustomPermissions();
      await resetRolePermissionsToDefaults();
      console.log(`\n${c('green', 'Limpeza completa finalizada!')}`);
      console.log(`${c('dim', 'Executando diagnostico pos-limpeza...')}`);
      await showRolePermissionsSummary();
    } else if (args[0] === '--clean-custom') {
      await clearAllCustomPermissions();
    } else if (args[0] === '--reset-roles') {
      await resetRolePermissionsToDefaults();
      await showRolePermissionsSummary();
    } else {
      // Treat as email
      const email = args[0];
      const user = await getUserByEmail(email);
      if (!user) {
        console.error(c('red', `Usuario nao encontrado: ${email}`));
        process.exit(1);
      }
      await showRolePermissionsSummary();
      await diagnoseUser(user);
    }
  } catch (error) {
    console.error(c('red', `Erro: ${error.message}`));
    console.error(error.stack);
  }

  process.exit(0);
}

main();
