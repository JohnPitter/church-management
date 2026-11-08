import { expect, login, test, users } from './support/fixtures';

// Rotas autenticadas do painel (src/App.tsx). Administrador deve abrir todas sem
// erro de JavaScript, sem tela de acesso negado e sem negação de permissão no Firestore.
const ADMIN_ROUTES = [
  '/painel',
  '/admin',
  '/admin/users',
  '/admin/members',
  '/admin/permissions',
  '/admin/events',
  '/admin/blog',
  '/admin/devotionals',
  '/admin/forum',
  '/admin/live',
  '/admin/projects',
  '/admin/prayer-requests',
  '/admin/leadership',
  '/admin/visitors',
  '/admin/notifications',
  '/admin/reports',
  '/admin/financial',
  '/admin/assistidos',
  '/admin/assistencias',
  '/admin/fichas',
  '/admin/pedagogia',
  '/admin/ong/settings',
  '/admin/ong/volunteers',
  '/admin/ong/activities',
  '/admin/ong/pedagogia',
  '/admin/ong/reports',
  '/admin/ong/financial',
  '/admin/home-settings',
  '/admin/settings',
  '/admin/logs',
  '/admin/backup',
  '/profile',
  '/notifications',
  '/birthdays',
  '/events',
  '/devotionals',
  '/forum',
  '/blog',
  '/projects',
  '/live',
  '/leadership',
  '/prayer',
  '/prayer-requests',
  '/avaliacoes-desenvolvimento'
];

test.describe('Smoke: administrador percorre o painel', () => {
  for (const route of ADMIN_ROUTES) {
    test(`abre ${route} sem erro`, async ({ page }) => {
      const admin = await users.admin();
      await login(page, admin);

      const problems: string[] = [];
      page.on('pageerror', error => problems.push(`erro de JavaScript — ${error.message}`));
      page.on('console', message => {
        const text = message.text();
        if (message.type() === 'error' && /insufficient permissions|permission-denied/i.test(text)) {
          problems.push(`Firestore negou permissão — ${text.slice(0, 200)}`);
        }
      });

      await page.goto(route);
      // Sai do "Carregando..." (lazy chunk + permissões) e deixa os listeners assentarem.
      await expect(page.getByText('Carregando...').first()).toBeHidden({ timeout: 20_000 });
      await page.waitForTimeout(800);

      const body = await page.locator('body').innerText();
      if (/Acesso (Negado|negado)|Acesso Administrativo Negado/.test(body)) {
        problems.push('acesso negado para o administrador');
      }
      if (/algo deu errado|something went wrong|erro inesperado/i.test(body)) {
        problems.push('tela de erro do app');
      }
      if (new URL(page.url()).pathname.startsWith('/login')) {
        problems.push('redirecionou para o login');
      }

      expect(problems, problems.join('\n')).toEqual([]);
    });
  }
});
