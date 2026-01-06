const fs = require('fs');

const fixes = [
  // Fix index.ts files with wrong entity paths
  {
    file: 'src/modules/content-management/forum/index.ts',
    find: /from ['"]\.\.\/\.\.\/modules\/content-management\/forum\/domain\/entities\/Forum['"]/g,
    replace: "from './domain/entities/Forum'"
  },
  {
    file: 'src/modules/content-management/home-builder/index.ts',
    find: /from ['"]\.\.\/\.\.\/modules\/content-management\/home-builder\/domain\/entities\/HomeBuilder['"]/g,
    replace: "from './domain/entities/HomeBuilder'"
  },
  {
    file: 'src/modules/content-management/live-streaming/index.ts',
    find: /from ['"]\.\.\/\.\.\/modules\/content-management\/live-streaming\/domain\/entities\/LiveStream['"]/g,
    replace: "from './domain/entities/LiveStream'"
  },
  {
    file: 'src/modules/content-management/projects/index.ts',
    find: /from ['"]\.\.\/\.\.\/modules\/content-management\/projects\/domain\/entities\/Project['"]/g,
    replace: "from './domain/entities/Project'"
  },
  {
    file: 'src/modules/financial/church-finance/index.ts',
    find: /from ['"]\.\.\/\.\.\/modules\/financial\/church-finance\/domain\/entities\/Financial['"]/g,
    replace: "from './domain/entities/Financial'"
  },
  {
    file: 'src/modules/ong-management/settings/index.ts',
    find: /from ['"]\.\.\/\.\.\/modules\/ong-management\/settings\/domain\/entities\/ONG['"]/g,
    replace: "from './domain/entities/ONG'"
  },
  // Fix visitor modal components
  {
    file: 'src/modules/church-management/visitors/presentation/components/visitors/RecordVisitModal.tsx',
    find: /from ['"]\.\.\/\.\.\/domain\/entities\/Visitor['"]/g,
    replace: "from '@modules/church-management/visitors/domain/entities/Visitor'"
  },
  {
    file: 'src/modules/church-management/visitors/presentation/components/visitors/VisitorDetailsModal.tsx',
    find: /from ['"]\.\.\/\.\.\/domain\/entities\/Visitor['"]/g,
    replace: "from '@modules/church-management/visitors/domain/entities/Visitor'"
  },
  // Fix HomeBuilderRepository firebase import
  {
    file: 'src/modules/content-management/home-builder/infrastructure/repositories/FirebaseHomeBuilderRepository.ts',
    find: /from ['"]\.\.\/\.\.\/config\/firebase['"]/g,
    replace: "from '@/config/firebase'"
  },
  // Fix ONGRepository LoggingService import
  {
    file: 'src/modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository.ts',
    find: /from ['"]infrastructure\/services\/LoggingService['"]/g,
    replace: "from '@modules/shared-kernel/logging/infrastructure/services/LoggingService'"
  },
  // Fix DepartmentFinancialService import
  {
    file: 'src/modules/financial/department-finance/application/services/DepartmentFinancialService.ts',
    find: /from ['"]domain\/entities\/Department['"]/g,
    replace: "from '@modules/financial/department-finance/domain/entities/Department'"
  },
  // Fix DataMigrationService imports
  {
    file: 'src/modules/shared-kernel/migration/application/services/DataMigrationService.ts',
    find: /from ['"]\.\.\/\.\.\/domain\/entities\/Member['"]/g,
    replace: "from '@modules/church-management/members/domain/entities/Member'"
  },
  {
    file: 'src/modules/shared-kernel/migration/application/services/DataMigrationService.ts',
    find: /from ['"]\.\.\/\.\.\/domain\/entities\/Event['"]/g,
    replace: "from '@modules/church-management/events/domain/entities/Event'"
  },
  // Fix FirebaseNotificationRepository import
  {
    file: 'src/modules/shared-kernel/notifications/infrastructure/repositories/FirebaseNotificationRepository.ts',
    find: /from ['"]\.\/FirebaseUserRepository['"]/g,
    replace: "from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository'"
  },
  // Fix IAuthService User import
  {
    file: 'src/modules/user-management/auth/domain/services/IAuthService.ts',
    find: /from ['"]\.\.\/entities\/User['"]/g,
    replace: "from '@modules/user-management/users/domain/entities/User'"
  },
  // Fix Home.tsx HomeBuilder import
  {
    file: 'src/modules/church-management/home/presentation/pages/Home.tsx',
    find: /from ['"]\.\.\/\.\.\/domain\/entities\/HomeBuilder['"]/g,
    replace: "from '@modules/content-management/home-builder/domain/entities/HomeBuilder'"
  },
];

let totalFixed = 0;

fixes.forEach(({file, find, replace}) => {
  if (!fs.existsSync(file)) {
    console.log(`⏭️  Skipping (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  content = content.replace(find, replace);

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  } else {
    console.log(`⚪ No match: ${file}`);
  }
});

console.log(`\n📊 Fixed ${totalFixed} files`);
