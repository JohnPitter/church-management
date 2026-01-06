const fs = require('fs');
const path = require('path');

// Fix imports within modules - replace relative paths with absolute @/ paths
const fixMappings = [
  // Fix config imports
  { old: /from ['"]\.\.\/\.\.\/config\/firebase['"]/g, new: "from '@/config/firebase'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/config\/firebase['"]/g, new: "from '@/config/firebase'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/\.\.\/config\/firebase['"]/g, new: "from '@/config/firebase'" },

  // Fix self-imports in modules (circular re-exports)
  { old: /from ['"]\.\.\/\.\.\/modules\/([^'"]+)['"]/g, new: "from '@modules/$1'" },
  { old: /from ['"]\.\.\/modules\/([^'"]+)['"]/g, new: "from '@modules/$1'" },

  // Fix domain imports
  { old: /from ['"]\.\.\/\.\.\/domain\/entities\/User['"]/g, new: "from '@/domain/entities/User'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/domain\/entities\/User['"]/g, new: "from '@/domain/entities/User'" },

  // Fix presentation imports (from modules trying to import from root presentation)
  { old: /from ['"]\.\.\/\.\.\/presentation\/([^'"]+)['"]/g, new: "from '@/presentation/$1'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/presentation\/([^'"]+)['"]/g, new: "from '@/presentation/$1'" },

  // Fix DI container imports
  { old: /from ['"]\.\.\/services\/FirebaseAuthService['"]/g, new: "from '@modules/user-management/users/application/services/FirebaseAuthService'" },
  { old: /from ['"]\.\.\/services\/FirebaseNotificationService['"]/g, new: "from '@modules/shared-kernel/notifications/infrastructure/services/FirebaseNotificationService'" },
  { old: /from ['"]\.\.\/services\/FirebaseAuditService['"]/g, new: "from '@modules/shared-kernel/audit/infrastructure/services/FirebaseAuditService'" },

  // Fix NotificationService import
  { old: /from ['"]\.\/NotificationService['"]/g, new: "from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService'" },
];

let totalUpdates = 0;
let filesUpdated = 0;

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  let fileUpdates = 0;

  fixMappings.forEach(mapping => {
    const matches = content.match(mapping.old);
    if (matches) {
      content = content.replace(mapping.old, mapping.new);
      updated = true;
      fileUpdates += matches.length;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    totalUpdates += fileUpdates;
    filesUpdated++;
    console.log(`✅ Fixed ${fileUpdates} import(s) in: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git') && !filePath.includes('build')) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFile(filePath);
    }
  });
}

console.log('🔧 Fixing module imports...\n');
processDirectory('./src');
console.log(`\n✅ Import fixes complete!`);
console.log(`📊 Total: ${totalUpdates} imports fixed in ${filesUpdated} files`);
