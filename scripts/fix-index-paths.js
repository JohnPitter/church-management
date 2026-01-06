const fs = require('fs');

const fixes = [
  {
    file: 'src/modules/content-management/forum/index.ts',
    from: "./content-management/forum/domain/entities/Forum",
    to: "./domain/entities/Forum"
  },
  {
    file: 'src/modules/content-management/home-builder/index.ts',
    from: "./content-management/home-builder/domain/entities/HomeBuilder",
    to: "./domain/entities/HomeBuilder"
  },
  {
    file: 'src/modules/content-management/live-streaming/index.ts',
    from: "./content-management/live-streaming/domain/entities/LiveStream",
    to: "./domain/entities/LiveStream"
  },
  {
    file: 'src/modules/content-management/projects/index.ts',
    from: "./content-management/projects/domain/entities/Project",
    to: "./domain/entities/Project"
  },
  {
    file: 'src/modules/financial/church-finance/index.ts',
    from: "./financial/church-finance/domain/entities/Financial",
    to: "./domain/entities/Financial"
  },
  {
    file: 'src/modules/ong-management/settings/index.ts',
    from: "./ong-management/settings/domain/entities/ONG",
    to: "./domain/entities/ONG"
  }
];

fixes.forEach(({file, from, to}) => {
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes(from)) {
    content = content.replace(from, to);
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed: ${file}`);
  }
});
