const fs = require('fs');
const path = require('path');

// Mapeamento de imports antigos para novos
const importMappings = [
  // Domain Entities
  { old: /from ['"]\.\.\/domain\/entities\/Asset['"]/g, new: "from '@modules/church-management/assets/domain/entities/Asset'" },
  { old: /from ['"]\.\.\/\.\.\/domain\/entities\/Asset['"]/g, new: "from '@modules/church-management/assets/domain/entities/Asset'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/domain\/entities\/Asset['"]/g, new: "from '@modules/church-management/assets/domain/entities/Asset'" },

  { old: /from ['"]\.\.\/domain\/entities\/Assistencia['"]/g, new: "from '@modules/assistance/assistencia/domain/entities/Assistencia'" },
  { old: /from ['"]\.\.\/\.\.\/domain\/entities\/Assistencia['"]/g, new: "from '@modules/assistance/assistencia/domain/entities/Assistencia'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/domain\/entities\/Assistencia['"]/g, new: "from '@modules/assistance/assistencia/domain/entities/Assistencia'" },

  { old: /from ['"]\.\.\/domain\/entities\/Department['"]/g, new: "from '@modules/church-management/departments/domain/entities/Department'" },
  { old: /from ['"]\.\.\/\.\.\/domain\/entities\/Department['"]/g, new: "from '@modules/church-management/departments/domain/entities/Department'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/domain\/entities\/Department['"]/g, new: "from '@modules/church-management/departments/domain/entities/Department'" },

  { old: /from ['"]\.\.\/domain\/entities\/Notification['"]/g, new: "from '@modules/shared-kernel/notifications/domain/entities/Notification'" },
  { old: /from ['"]\.\.\/\.\.\/domain\/entities\/Notification['"]/g, new: "from '@modules/shared-kernel/notifications/domain/entities/Notification'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/domain\/entities\/Notification['"]/g, new: "from '@modules/shared-kernel/notifications/domain/entities/Notification'" },

  { old: /from ['"]\.\.\/domain\/entities\/PublicPageSettings['"]/g, new: "from '@modules/content-management/public-pages/domain/entities/PublicPageSettings'" },
  { old: /from ['"]\.\.\/\.\.\/domain\/entities\/PublicPageSettings['"]/g, new: "from '@modules/content-management/public-pages/domain/entities/PublicPageSettings'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/domain\/entities\/PublicPageSettings['"]/g, new: "from '@modules/content-management/public-pages/domain/entities/PublicPageSettings'" },

  // Services
  { old: /from ['"]\.\.\/infrastructure\/services\/AssistidoService['"]/g, new: "from '@modules/assistance/assistidos/application/services/AssistidoService'" },
  { old: /from ['"]\.\.\/\.\.\/infrastructure\/services\/AssistidoService['"]/g, new: "from '@modules/assistance/assistidos/application/services/AssistidoService'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/infrastructure\/services\/AssistidoService['"]/g, new: "from '@modules/assistance/assistidos/application/services/AssistidoService'" },

  { old: /from ['"]\.\.\/infrastructure\/services\/MemberService['"]/g, new: "from '@modules/church-management/members/application/services/MemberService'" },
  { old: /from ['"]\.\.\/\.\.\/infrastructure\/services\/MemberService['"]/g, new: "from '@modules/church-management/members/application/services/MemberService'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/infrastructure\/services\/MemberService['"]/g, new: "from '@modules/church-management/members/application/services/MemberService'" },

  // Repositories
  { old: /from ['"]\.\.\/data\/repositories\/FirebaseMemberRepository['"]/g, new: "from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository'" },
  { old: /from ['"]\.\.\/\.\.\/data\/repositories\/FirebaseMemberRepository['"]/g, new: "from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository'" },
  { old: /from ['"]\.\.\/\.\.\/\.\.\/data\/repositories\/FirebaseMemberRepository['"]/g, new: "from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository'" },
];

function updateFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;

  importMappings.forEach(mapping => {
    if (mapping.old.test(content)) {
      content = content.replace(mapping.old, mapping.new);
      updated = true;
    }
  });

  if (updated) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated: ${filePath}`);
  }
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      if (!filePath.includes('node_modules') && !filePath.includes('.git')) {
        processDirectory(filePath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
      updateFile(filePath);
    }
  });
}

console.log('Starting import updates...');
processDirectory('./src');
console.log('Import updates complete!');
