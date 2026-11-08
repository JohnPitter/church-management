// Gera o build de produção apontando para os emulators e serve com fallback de SPA.
// Reaproveita o build existente; use E2E_REBUILD=1 para forçar um novo.
const { spawnSync } = require('node:child_process');
const { existsSync, createReadStream, statSync } = require('node:fs');
const { createServer } = require('node:http');
const { extname, join, normalize } = require('node:path');

const root = join(__dirname, '..', '..');
const buildDir = join(root, 'e2e', '.build');
const port = Number(process.env.PORT || 3100);

if (!existsSync(join(buildDir, 'index.html')) || process.env.E2E_REBUILD) {
  console.log('[e2e] gerando build apontado para os emulators...');
  const result = spawnSync('npm', ['run', 'build'], {
    cwd: root,
    stdio: 'inherit',
    env: {
      ...process.env,
      BUILD_PATH: buildDir,
      GENERATE_SOURCEMAP: 'false',
      CI: 'false',
      REACT_APP_USE_EMULATORS: 'true',
      REACT_APP_FIREBASE_API_KEY: 'e2e-fake-key',
      REACT_APP_FIREBASE_AUTH_DOMAIN: 'localhost',
      REACT_APP_FIREBASE_PROJECT_ID: 'demo-e2e',
      REACT_APP_FIREBASE_STORAGE_BUCKET: 'demo-e2e.appspot.com',
      REACT_APP_FIREBASE_MESSAGING_SENDER_ID: '1',
      REACT_APP_FIREBASE_APP_ID: '1:1:web:e2e'
    }
  });
  if (result.status !== 0) process.exit(result.status || 1);
}

const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

createServer((request, response) => {
  const pathname = decodeURIComponent((request.url || '/').split('?')[0]);
  let file = normalize(join(buildDir, pathname));
  if (!file.startsWith(buildDir) || !existsSync(file) || !statSync(file).isFile()) {
    file = join(buildDir, 'index.html');
  }
  response.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
  createReadStream(file).pipe(response);
}).listen(port, '127.0.0.1', () => console.log(`[e2e] servindo ${buildDir} em http://127.0.0.1:${port}`));
