const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all module index.ts files
const indexFiles = execSync('find src/modules -name "index.ts" -type f', {encoding: 'utf8'})
  .split('\n')
  .filter(f => f && !f.includes('node_modules'));

console.log(`Found ${indexFiles.length} index.ts files\n`);

let totalFixed = 0;

indexFiles.forEach(file => {
  if (!fs.existsSync(file)) return;

  let content = fs.readFileSync(file, 'utf8');
  const original = content;
  let fixed = false;

  // Comment out presentation page/component exports that don't exist in modules
  const linesToComment = [];

  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // Check if line is importing from ./presentation
    if (line.includes('./presentation/pages') || line.includes('./presentation/components')) {
      // Extract the file path
      const match = line.match(/from ['"](\.[^'"]+)['"]/);
      if (match) {
        const importPath = match[1];
        const fullPath = path.resolve(path.dirname(file), importPath + '.tsx');
        const fullPathTs = path.resolve(path.dirname(file), importPath + '.ts');

        // Check if file exists
        if (!fs.existsSync(fullPath) && !fs.existsSync(fullPathTs)) {
          linesToComment.push(idx);
          fixed = true;
        }
      }
    }
  });

  if (fixed) {
    // Comment out the lines
    const newLines = lines.map((line, idx) => {
      if (linesToComment.includes(idx)) {
        return '// ' + line + ' // TODO: Page moved to src/presentation/pages';
      }
      return line;
    });

    const newContent = newLines.join('\n');
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`✅ Fixed ${file} (commented ${linesToComment.length} lines)`);
    totalFixed++;
  }
});

console.log(`\n📊 Summary: Fixed ${totalFixed} index.ts files`);
