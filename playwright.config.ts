import { defineConfig } from '@playwright/test';

const PORT = 3100;
const BASE_URL = `http://127.0.0.1:${PORT}`;

// O app roda apontando para os emulators do Firebase (Auth 9099, Firestore 8080).
// Nada aqui toca em produção: o projeto é fictício (demo-e2e) e as chaves são falsas.
export default defineConfig({
  testDir: './e2e',
  // Estado compartilhado nos emulators: um teste por vez, resetando entre eles.
  workers: 1,
  fullyParallel: false,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: BASE_URL,
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: {
      // Permite usar um Chromium já instalado (ex.: PW_CHROMIUM_PATH=/opt/pw-browsers/chromium)
      executablePath: process.env.PW_CHROMIUM_PATH || undefined,
      args: ['--no-sandbox']
    }
  },
  webServer: {
    // Build de produção (o servidor de desenvolvimento do CRA não sobe com o
    // override de webpack-dev-server do package.json) servido estaticamente.
    command: 'node e2e/support/serve.cjs',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 600_000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: { PORT: String(PORT) }
  }
});
