const fs = require('fs');
const path = require('path');

// Import path mappings (old pattern -> new pattern)
const importMappings = [
  // Firebase config
  { from: /from ['"]config\/firebase['"]/g, to: "from '@/config/firebase'" },
  { from: /from ['"]@\/config\/firebase['"]/g, to: "from '@/config/firebase'" },

  // Domain entities - map to module-specific paths
  { from: /from ['"]domain\/entities\/Permission['"]/g, to: "from '@modules/user-management/permissions/domain/entities/Permission'" },
  { from: /from ['"]domain\/entities\/User['"]/g, to: "from '@modules/user-management/users/domain/entities/User'" },
  { from: /from ['"]domain\/entities\/Member['"]/g, to: "from '@modules/church-management/members/domain/entities/Member'" },
  { from: /from ['"]domain\/entities\/Devotional['"]/g, to: "from '@modules/church-management/devotionals/domain/entities/Devotional'" },
  { from: /from ['"]domain\/entities\/PrayerRequest['"]/g, to: "from '@modules/church-management/prayer-requests/domain/entities/PrayerRequest'" },
  { from: /from ['"]domain\/entities\/Visitor['"]/g, to: "from '@modules/church-management/visitors/domain/entities/Visitor'" },
  { from: /from ['"]domain\/entities\/Asset['"]/g, to: "from '@modules/church-management/assets/domain/entities/Asset'" },
  { from: /from ['"]domain\/entities\/Transaction['"]/g, to: "from '@modules/financial/church-finance/domain/entities/Transaction'" },
  { from: /from ['"]domain\/entities\/FinancialCategory['"]/g, to: "from '@modules/financial/church-finance/domain/entities/FinancialCategory'" },
  { from: /from ['"]domain\/entities\/BlogPost['"]/g, to: "from '@modules/content-management/blog/domain/entities/BlogPost'" },
  { from: /from ['"]domain\/entities\/LiveStream['"]/g, to: "from '@modules/content-management/live-streaming/domain/entities/LiveStream'" },
  { from: /from ['"]domain\/entities\/ForumCategory['"]/g, to: "from '@modules/content-management/forum/domain/entities/ForumCategory'" },
  { from: /from ['"]domain\/entities\/ForumPost['"]/g, to: "from '@modules/content-management/forum/domain/entities/ForumPost'" },
  { from: /from ['"]domain\/entities\/Assistido['"]/g, to: "from '@modules/assistance/assistidos/domain/entities/Assistido'" },
  { from: /from ['"]domain\/entities\/HelpRequest['"]/g, to: "from '@modules/assistance/help-requests/domain/entities/HelpRequest'" },
  { from: /from ['"]domain\/entities\/Assistencia['"]/g, to: "from '@modules/assistance/assistencia/domain/entities/Assistencia'" },
  { from: /from ['"]domain\/entities\/ONG['"]/g, to: "from '@modules/ong-management/settings/domain/entities/ONG'" },

  // Repositories
  { from: /from ['"]domain\/repositories\/.*Repository['"]/g, to: (match) => {
    const repoName = match.match(/repositories\/(.*)Repository['"]/)[1];
    return `from '@modules/shared-kernel/domain/repositories/${repoName}Repository'`;
  }},

  // Infrastructure services
  { from: /from ['"]infrastructure\/services\/EventBus['"]/g, to: "from '@modules/shared-kernel/infrastructure/services/EventBus'" },
  { from: /from ['"]infrastructure\/services\/NotificationService['"]/g, to: "from '@modules/shared-kernel/infrastructure/services/NotificationService'" },

  // Application services - preserve module-relative paths
  { from: /from ['"]\.\.\/(domain|infrastructure|application)/g, to: (match) => match },
];

// Service files to process
const serviceFiles = [
  'src/modules/user-management/permissions/application/services/PermissionService.ts',
  'src/modules/church-management/devotionals/application/services/DevotionalService.ts',
  'src/modules/financial/church-finance/application/services/FinancialService.ts',
  'src/modules/financial/church-finance/application/services/ChurchFinancialService.ts',
  'src/modules/financial/church-finance/application/services/DefaultFinancialCategories.ts',
  'src/modules/content-management/forum/infrastructure/services/ForumService.ts',
  'src/modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository.ts',
  'src/modules/financial/department-finance/application/services/DepartmentFinancialService.ts',
  'src/modules/financial/ong-finance/application/services/ONGFinancialService.ts',
  'src/modules/content-management/blog/infrastructure/repositories/FirebaseBlogRepository.ts',
  'src/modules/church-management/prayer-requests/application/services/PrayerRequestService.ts',
  'src/modules/assistance/assistidos/application/services/AssistidoService.ts',
  'src/modules/analytics/backup/application/services/BackupService.ts',
  'src/modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository.ts',
  'src/modules/content-management/home-builder/application/services/HomeBuilderService.ts',
  'src/modules/church-management/members/application/services/MemberService.ts',
  'src/modules/assistance/professional/application/services/ProfessionalHelpRequestService.ts',
];

let totalChanges = 0;
let totalFiles = 0;

serviceFiles.forEach(filePath => {
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  Skipping (not found): ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changes = 0;
  const originalContent = content;

  // Apply all import mappings
  importMappings.forEach(mapping => {
    const matches = content.match(mapping.from);
    if (matches) {
      if (typeof mapping.to === 'function') {
        content = content.replace(mapping.from, mapping.to);
      } else {
        content = content.replace(mapping.from, mapping.to);
      }
      changes += matches.length;
    }
  });

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Fixed ${changes} imports in: ${filePath}`);
    totalChanges += changes;
    totalFiles++;
  } else {
    console.log(`✓  No changes needed: ${filePath}`);
  }
});

console.log(`\n📊 Summary: Fixed ${totalChanges} imports in ${totalFiles} files`);
