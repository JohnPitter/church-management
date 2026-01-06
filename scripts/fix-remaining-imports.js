const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Fixing remaining import errors...\n');

// 1. Fix module index.ts files with wrong paths
const indexFiles = [
  {
    file: 'src/modules/assistance/assistidos/index.ts',
    wrongPath: './../modules/assistance/assistidos/domain/entities/Assistido',
    correctPath: './domain/entities/Assistido'
  },
  {
    file: 'src/modules/assistance/help-requests/index.ts',
    wrongPath: './../modules/assistance/help-requests/domain/entities/HelpRequest',
    correctPath: './domain/entities/HelpRequest'
  },
  {
    file: 'src/modules/assistance/professional/index.ts',
    wrongPath: './../modules/assistance/professional/domain/entities/ProfessionalHelpRequest',
    correctPath: './domain/entities/ProfessionalHelpRequest'
  }
];

indexFiles.forEach(({file, wrongPath, correctPath}) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes(wrongPath)) {
      content = content.replace(wrongPath, correctPath);
      fs.writeFileSync(file, content, 'utf8');
      console.log(`✅ Fixed ${file}`);
    }
  }
});

// 2. Fix use case files with relative imports
const useCaseFiles = execSync('find src/modules -path "*/application/usecases/*.ts"', {encoding: 'utf8'})
  .split('\n')
  .filter(f => f);

useCaseFiles.forEach(file => {
  if (!fs.existsSync(file)) return;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;

  // Determine module path for this use case
  const modulePath = file.split('/modules/')[1];
  if (!modulePath) return;

  const [moduleArea, moduleType] = modulePath.split('/');
  const modulePrefix = `@modules/${moduleArea}/${moduleType}`;

  // Fix entity imports
  content = content.replace(/from ['"]\.\.\/\.\.\/entities\/(\w+)['"]/g, (match, entity) => {
    return `from '${modulePrefix}/domain/entities/${entity}'`;
  });

  // Fix repository imports
  content = content.replace(/from ['"]\.\.\/\.\.\/repositories\/(\w+)['"]/g, (match, repo) => {
    return `from '${modulePrefix}/domain/repositories/${repo}'`;
  });

  // Fix service imports
  content = content.replace(/from ['"]\.\.\/\.\.\/services\/(\w+)['"]/g, (match, service) => {
    return `from '${modulePrefix}/domain/services/${service}'`;
  });

  // Fix auth use case imports (special case)
  content = content.replace(/from ['"]\.\.\/auth\/(\w+)['"]/g, (match, useCase) => {
    return `from '@modules/user-management/auth/application/usecases/${useCase}'`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ Fixed use case: ${file}`);
  }
});

// 3. Fix AssistenciaService special cases
const assistenciaFile = 'src/modules/assistance/assistencia/application/services/AssistenciaService.ts';
if (fs.existsSync(assistenciaFile)) {
  let content = fs.readFileSync(assistenciaFile, 'utf8');

  content = content.replace(
    /from ['"]\.\.\/\.\.\/data\/repositories\/FirebaseFichaAcompanhamentoRepository['"]/g,
    "from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository'"
  );

  content = content.replace(
    /from ['"]\.\.\/\.\.\/modules\/assistance\/fichas\/domain\/entities\/FichaAcompanhamento['"]/g,
    "from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento'"
  );

  fs.writeFileSync(assistenciaFile, content, 'utf8');
  console.log(`✅ Fixed AssistenciaService`);
}

// 4. Fix VerseOfTheDayService
const verseServiceFile = 'src/modules/church-management/devotionals/application/services/VerseOfTheDayService.ts';
if (fs.existsSync(verseServiceFile)) {
  let content = fs.readFileSync(verseServiceFile, 'utf8');

  content = content.replace(
    /from ['"]\.\.\/\.\.\/data\/daily-verses['"]/g,
    "from '@modules/church-management/devotionals/infrastructure/data/daily-verses'"
  );

  fs.writeFileSync(verseServiceFile, content, 'utf8');
  console.log(`✅ Fixed VerseOfTheDayService`);
}

console.log('\n✅ All import fixes applied!');
