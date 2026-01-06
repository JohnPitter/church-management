const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all service files in modules
const serviceFiles = execSync('find src/modules -path "*/application/services/*.ts" -o -path "*/infrastructure/services/*.ts" -o -path "*/infrastructure/repositories/*.ts"', {encoding: 'utf8'})
  .split('\n')
  .filter(f => f && !f.includes('index.ts'));

console.log(`Found ${serviceFiles.length} service files to fix\n`);

let totalChanges = 0;
let totalFiles = 0;

serviceFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;
  let changes = 0;

  // Fix firebase config import
  const firebaseMatches = content.match(/from ['"]config\/firebase['"]/g);
  if (firebaseMatches) {
    content = content.replace(/from ['"]config\/firebase['"]/g, "from '@/config/firebase'");
    changes += firebaseMatches.length;
  }

  // Fix domain entity imports (old pattern: domain/entities/X)
  const domainMatches = content.match(/from ['"]domain\/entities\/(\w+)['"]/g);
  if (domainMatches) {
    domainMatches.forEach(match => {
      const entityName = match.match(/domain\/entities\/(\w+)/)[1];

      // Map entity to module path
      const entityModuleMap = {
        'Permission': '@modules/user-management/permissions/domain/entities/Permission',
        'User': '@modules/user-management/users/domain/entities/User',
        'Member': '@modules/church-management/members/domain/entities/Member',
        'Devotional': '@modules/church-management/devotionals/domain/entities/Devotional',
        'PrayerRequest': '@modules/church-management/prayer-requests/domain/entities/PrayerRequest',
        'Visitor': '@modules/church-management/visitors/domain/entities/Visitor',
        'Asset': '@modules/church-management/assets/domain/entities/Asset',
        'Transaction': '@modules/financial/church-finance/domain/entities/Transaction',
        'FinancialCategory': '@modules/financial/church-finance/domain/entities/FinancialCategory',
        'BlogPost': '@modules/content-management/blog/domain/entities/BlogPost',
        'LiveStream': '@modules/content-management/live-streaming/domain/entities/LiveStream',
        'ForumCategory': '@modules/content-management/forum/domain/entities/ForumCategory',
        'ForumPost': '@modules/content-management/forum/domain/entities/ForumPost',
        'Assistido': '@modules/assistance/assistidos/domain/entities/Assistido',
        'HelpRequest': '@modules/assistance/help-requests/domain/entities/HelpRequest',
        'Assistencia': '@modules/assistance/assistencia/domain/entities/Assistencia',
        'ONG': '@modules/ong-management/settings/domain/entities/ONG',
        'FichaAcompanhamento': '@modules/assistance/fichas/domain/entities/FichaAcompanhamento',
        'ProfessionalHelpRequest': '@modules/assistance/professional/domain/entities/ProfessionalHelpRequest',
      };

      if (entityModuleMap[entityName]) {
        content = content.replace(
          new RegExp(`from ['"]domain/entities/${entityName}['"]`, 'g'),
          `from '${entityModuleMap[entityName]}'`
        );
        changes++;
      }
    });
  }

  // Fix repository imports (old pattern: data/repositories/X)
  const repoMatches = content.match(/from ['"]data\/repositories\/(\w+)['"]/g);
  if (repoMatches) {
    // Try to determine module from file path
    const modulePath = filePath.split('/modules/')[1];
    const moduleFolder = modulePath ? modulePath.split('/')[0] + '/' + modulePath.split('/')[1] : '';

    content = content.replace(/from ['"]data\/repositories\/(\w+)['"]/g, (match, repoName) => {
      return `from '@modules/${moduleFolder}/infrastructure/repositories/${repoName}'`;
    });
    changes += repoMatches.length;
  }

  // Fix service imports from domain/services
  content = content.replace(/from ['"]domain\/services\/(\w+)['"]/g, (match, serviceName) => {
    const modulePath = filePath.split('/modules/')[1];
    const moduleFolder = modulePath ? modulePath.split('/')[0] + '/' + modulePath.split('/')[1] : '';
    return `from '@modules/${moduleFolder}/domain/services/${serviceName}'`;
  });

  // Fix infrastructure service imports
  const infraMatches = content.match(/from ['"]infrastructure\/services\/(\w+)['"]/g);
  if (infraMatches) {
    content = content.replace(/from ['"]infrastructure\/services\/(\w+)['"]/g, (match, serviceName) => {
      if (serviceName === 'EventBus' || serviceName === 'NotificationService') {
        return `from '@modules/shared-kernel/infrastructure/services/${serviceName}'`;
      }
      return match; // Keep as is for others
    });
    changes += infraMatches.length;
  }

  // Fix wrong module paths like ../../modules/assistance/...
  content = content.replace(/from ['"]\.\.\/\.\.\/modules\/([\w\-/]+)['"]/g, "from '@modules/$1'");
  content = content.replace(/from ['"]\.\.\/([\w\-]+)\/modules\/([\w\-/]+)['"]/g, "from '@modules/$2'");

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${changes} imports in: ${filePath}`);
    totalChanges += changes;
    totalFiles++;
  }
});

console.log(`\n📊 Summary: Fixed ${totalChanges} imports in ${totalFiles} files`);
