const fs = require('fs');

// Fix specific problem files
const fixes = [
  // AssistenciaService - still has wrong paths
  {
    file: 'src/modules/assistance/assistencia/application/services/AssistenciaService.ts',
    replacements: [
      {
        from: /from ['"]\.\.\/\.\.\/data\/repositories\/FirebaseFichaAcompanhamentoRepository['"]/g,
        to: "from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository'"
      },
      {
        from: /from ['"]\.\.\/\.\.\/modules\/assistance\/fichas\/domain\/entities\/FichaAcompanhamento['"]/g,
        to: "from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento'"
      }
    ]
  },
  // Module index files with wrong entity paths
  {
    file: 'src/modules/church-management/prayer-requests/index.ts',
    replacements: [
      {
        from: /from ['"]\.\.\/\.\.\/modules\/church-management\/prayer-requests\/domain\/entities\/PrayerRequest['"]/g,
        to: "from './domain/entities/PrayerRequest'"
      }
    ]
  },
  {
    file: 'src/modules/church-management/visitors/index.ts',
    replacements: [
      {
        from: /from ['"]\.\.\/\.\.\/modules\/church-management\/visitors\/domain\/entities\/Visitor['"]/g,
        to: "from './domain/entities/Visitor'"
      }
    ]
  },
  // Use cases importing User from wrong place
  {
    file: 'src/modules/church-management/events/application/usecases/ConfirmEventAttendanceUseCase.ts',
    replacements: [
      {
        from: /from ['"]@modules\/church-management\/events\/domain\/entities\/User['"]/g,
        to: "from '@modules/user-management/users/domain/entities/User'"
      }
    ]
  },
  {
    file: 'src/modules/church-management/events/application/usecases/CreateEventUseCase.ts',
    replacements: [
      {
        from: /from ['"]@modules\/church-management\/events\/domain\/entities\/User['"]/g,
        to: "from '@modules/user-management/users/domain/entities/User'"
      }
    ]
  },
  {
    file: 'src/modules/church-management/members/application/usecases/CreateMemberUseCase.ts',
    replacements: [
      {
        from: /from ['"]@modules\/church-management\/members\/domain\/entities\/User['"]/g,
        to: "from '@modules/user-management/users/domain/entities/User'"
      }
    ]
  },
  // Visitor components with wrong relative paths
  {
    file: 'src/modules/church-management/visitors/presentation/components/visitors/ContactVisitorModal.tsx',
    replacements: [
      {
        from: /from ['"]\.\.\/\.\.\/domain\/entities\/Visitor['"]/g,
        to: "from '@modules/church-management/visitors/domain/entities/Visitor'"
      }
    ]
  },
  {
    file: 'src/modules/church-management/visitors/presentation/components/visitors/CreateVisitorModal.tsx',
    replacements: [
      {
        from: /from ['"]\.\.\/\.\.\/domain\/entities\/Visitor['"]/g,
        to: "from '@modules/church-management/visitors/domain/entities/Visitor'"
      }
    ]
  },
];

let totalFixed = 0;

fixes.forEach(({file, replacements}) => {
  if (!fs.existsSync(file)) {
    console.log(`⏭️  Skipping (not found): ${file}`);
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  replacements.forEach(({from, to}) => {
    content = content.replace(from, to);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
    totalFixed++;
  }
});

console.log(`\n📊 Fixed ${totalFixed} files`);
