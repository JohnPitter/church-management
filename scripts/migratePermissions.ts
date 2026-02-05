/**
 * Script de Migração de Permissões
 *
 * Este script migra os dados de permissões da collection /userPermissionOverrides
 * para o campo customPermissions dentro do documento do usuário em /users.
 *
 * Uso:
 *   npx ts-node scripts/migratePermissions.ts
 *
 * ou via npm:
 *   npm run migrate:permissions
 */

import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

// ES Module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Inicializa Firebase Admin se ainda não inicializado
if (getApps().length === 0) {
  // Tenta carregar as credenciais do service account
  const serviceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');

  try {
    const serviceAccount = require(serviceAccountPath);
    initializeApp({
      credential: cert(serviceAccount)
    });
    console.log('✓ Firebase Admin inicializado com service account');
  } catch (error) {
    // Se não tiver service account, usa as credenciais do ambiente
    initializeApp();
    console.log('✓ Firebase Admin inicializado com credenciais do ambiente');
  }
}

const db = getFirestore();

interface PermissionEntry {
  module: string;
  actions: string[];
}

interface UserPermissionOverride {
  userId: string;
  userEmail: string;
  userName: string;
  grantedModules: PermissionEntry[];
  revokedModules: PermissionEntry[];
  updatedBy?: string;
  updatedAt?: FirebaseFirestore.Timestamp;
}

interface MigrationResult {
  userId: string;
  userEmail: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
}

async function migrateUserPermissions(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log('  MIGRAÇÃO DE PERMISSÕES - FASE 2');
  console.log('========================================');
  console.log('');

  const results: MigrationResult[] = [];

  try {
    // 1. Buscar todos os overrides existentes
    console.log('📖 Buscando permissões em /userPermissionOverrides...');
    const overridesSnapshot = await db.collection('userPermissionOverrides').get();

    if (overridesSnapshot.empty) {
      console.log('ℹ️  Nenhum override encontrado. Nada a migrar.');
      return;
    }

    console.log(`   Encontrados ${overridesSnapshot.size} overrides para migrar.`);
    console.log('');

    // 2. Processar cada override
    for (const overrideDoc of overridesSnapshot.docs) {
      const data = overrideDoc.data() as UserPermissionOverride;
      const userId = data.userId || overrideDoc.id;

      console.log(`🔄 Processando: ${data.userEmail || userId}`);

      try {
        // Verificar se o usuário existe
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
          results.push({
            userId,
            userEmail: data.userEmail || 'N/A',
            status: 'skipped',
            message: 'Usuário não encontrado na collection /users'
          });
          console.log(`   ⚠️  Usuário não encontrado, pulando...`);
          continue;
        }

        // Preparar o novo formato de permissões
        const customPermissions = {
          granted: data.grantedModules || [],
          revoked: data.revokedModules || []
        };

        // Verificar se há algo para migrar
        const hasGrants = customPermissions.granted.length > 0;
        const hasRevokes = customPermissions.revoked.length > 0;

        if (!hasGrants && !hasRevokes) {
          results.push({
            userId,
            userEmail: data.userEmail || 'N/A',
            status: 'skipped',
            message: 'Nenhuma permissão customizada para migrar'
          });
          console.log(`   ⚠️  Sem permissões customizadas, pulando...`);
          continue;
        }

        // Atualizar o documento do usuário
        await userRef.update({
          customPermissions,
          permissionsMigratedAt: FieldValue.serverTimestamp(),
          permissionsMigratedFrom: 'userPermissionOverrides'
        });

        results.push({
          userId,
          userEmail: data.userEmail || 'N/A',
          status: 'success',
          message: `Migrado: ${customPermissions.granted.length} grants, ${customPermissions.revoked.length} revokes`
        });

        console.log(`   ✅ Migrado com sucesso!`);
        console.log(`      - Grants: ${customPermissions.granted.length} módulos`);
        console.log(`      - Revokes: ${customPermissions.revoked.length} módulos`);

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
        results.push({
          userId,
          userEmail: data.userEmail || 'N/A',
          status: 'error',
          message: errorMessage
        });
        console.log(`   ❌ Erro: ${errorMessage}`);
      }
    }

    // 3. Relatório final
    console.log('');
    console.log('========================================');
    console.log('  RELATÓRIO DE MIGRAÇÃO');
    console.log('========================================');
    console.log('');

    const successful = results.filter(r => r.status === 'success');
    const skipped = results.filter(r => r.status === 'skipped');
    const failed = results.filter(r => r.status === 'error');

    console.log(`✅ Migrados com sucesso: ${successful.length}`);
    console.log(`⚠️  Pulados: ${skipped.length}`);
    console.log(`❌ Erros: ${failed.length}`);
    console.log('');

    if (successful.length > 0) {
      console.log('Usuários migrados:');
      successful.forEach(r => console.log(`  - ${r.userEmail}: ${r.message}`));
      console.log('');
    }

    if (skipped.length > 0) {
      console.log('Usuários pulados:');
      skipped.forEach(r => console.log(`  - ${r.userEmail}: ${r.message}`));
      console.log('');
    }

    if (failed.length > 0) {
      console.log('Erros encontrados:');
      failed.forEach(r => console.log(`  - ${r.userEmail}: ${r.message}`));
      console.log('');
    }

    // 4. Instruções pós-migração
    if (successful.length > 0) {
      console.log('========================================');
      console.log('  PRÓXIMOS PASSOS');
      console.log('========================================');
      console.log('');
      console.log('1. Verifique se as permissões estão funcionando corretamente');
      console.log('2. Após validação, você pode remover a collection userPermissionOverrides:');
      console.log('');
      console.log('   firebase firestore:delete userPermissionOverrides --recursive');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Erro fatal durante a migração:', error);
    process.exit(1);
  }
}

async function migrateCustomRolesToUsers(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log('  MIGRAÇÃO DE CUSTOM ROLES');
  console.log('========================================');
  console.log('');

  try {
    // 1. Buscar todos os custom roles ativos
    console.log('📖 Buscando custom roles ativos...');
    const rolesSnapshot = await db.collection('customRoles')
      .where('isActive', '==', true)
      .get();

    if (rolesSnapshot.empty) {
      console.log('ℹ️  Nenhum custom role ativo encontrado.');
      return;
    }

    // Criar mapa de roles
    const customRoles = new Map<string, PermissionEntry[]>();
    rolesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      customRoles.set(doc.id, data.modules || []);
    });

    console.log(`   Encontrados ${customRoles.size} custom roles.`);

    // 2. Buscar usuários com custom roles
    console.log('📖 Buscando usuários com custom roles...');
    const usersSnapshot = await db.collection('users').get();

    let migrated = 0;
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const userRole = userData.role;

      // Verificar se o role do usuário é um custom role
      if (customRoles.has(userRole)) {
        const rolePermissions = customRoles.get(userRole);

        // Verificar se já tem rolePermissions
        if (!userData.rolePermissions) {
          console.log(`🔄 Atualizando ${userData.email || userDoc.id} com rolePermissions de ${userRole}...`);

          await userDoc.ref.update({
            rolePermissions,
            rolePermissionsUpdatedAt: FieldValue.serverTimestamp()
          });

          migrated++;
          console.log(`   ✅ Atualizado!`);
        }
      }
    }

    console.log('');
    console.log(`✅ ${migrated} usuários atualizados com rolePermissions.`);

  } catch (error) {
    console.error('❌ Erro durante migração de custom roles:', error);
  }
}

async function validateMigration(): Promise<void> {
  console.log('');
  console.log('========================================');
  console.log('  VALIDAÇÃO DA MIGRAÇÃO');
  console.log('========================================');
  console.log('');

  try {
    // Contar usuários com customPermissions
    const usersWithPermissions = await db.collection('users')
      .where('customPermissions', '!=', null)
      .get();

    console.log(`📊 Usuários com customPermissions: ${usersWithPermissions.size}`);

    // Contar usuários com rolePermissions
    const usersWithRolePermissions = await db.collection('users')
      .where('rolePermissions', '!=', null)
      .get();

    console.log(`📊 Usuários com rolePermissions: ${usersWithRolePermissions.size}`);

    // Contar overrides restantes
    const remainingOverrides = await db.collection('userPermissionOverrides').get();
    console.log(`📊 Overrides restantes em userPermissionOverrides: ${remainingOverrides.size}`);

    if (remainingOverrides.size > 0) {
      console.log('');
      console.log('⚠️  Ainda existem dados em userPermissionOverrides.');
      console.log('   Após validar que tudo está funcionando, você pode removê-los.');
    }

  } catch (error) {
    console.error('❌ Erro durante validação:', error);
  }
}

// Executar migração
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--validate-only')) {
    await validateMigration();
  } else if (args.includes('--custom-roles-only')) {
    await migrateCustomRolesToUsers();
  } else {
    await migrateUserPermissions();
    await migrateCustomRolesToUsers();
    await validateMigration();
  }

  console.log('');
  console.log('✅ Migração concluída!');
  console.log('');
}

main().catch(console.error);
