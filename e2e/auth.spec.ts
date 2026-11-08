import { collectPageErrors, expect, login, test, users } from './support/fixtures';
import { listDocs } from './support/emulator';

test.describe('Autenticação e acesso', () => {
  test('páginas públicas abrem sem erro de JavaScript', async ({ page }) => {
    const errors = collectPageErrors(page);

    for (const path of ['/login', '/register', '/privacidade', '/contact', '/about']) {
      await page.goto(path);
      await expect(page.locator('body')).not.toBeEmpty();
      await expect(page.getByText(/algo deu errado|something went wrong/i)).toHaveCount(0);
    }

    expect(errors).toEqual([]);
  });

  test('administrador entra e chega ao painel administrativo', async ({ page }) => {
    const admin = await users.admin();

    await login(page, admin);

    await expect(page).toHaveURL(/\/admin$/);
  });

  test('senha incorreta mostra erro e mantém na tela de login', async ({ page }) => {
    const admin = await users.admin();

    await login(page, { email: admin.email, password: 'senha-errada' }, { expectSuccess: false });

    await expect(page.getByText(/incorret|inválid|senha/i).first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('conta pendente é enviada para a tela de aprovação', async ({ page }) => {
    const pending = await users.pending();

    await login(page, pending);
    await page.goto('/painel');

    await expect(page).toHaveURL(/\/pending-approval/);
  });

  test('visitante sem login é redirecionado do painel para o login', async ({ page }) => {
    await page.goto('/painel');

    await expect(page).toHaveURL(/\/login/);
  });

  test('cadastro cria conta pendente no Auth e no Firestore', async ({ page }) => {
    await page.goto('/register');

    await page.getByLabel(/nome completo/i).fill('Maria Cadastro');
    await page.getByLabel(/email/i).fill('maria.cadastro@igreja.test');
    await page.getByLabel(/^senha$/i).fill('Senha@12345');
    await page.getByLabel(/confirmar senha/i).fill('Senha@12345');
    await page.getByRole('button', { name: /criar conta/i }).click();

    await expect(page.getByText('Cadastro realizado!')).toBeVisible();

    const created = (await listDocs('users')).find(user => user.email === 'maria.cadastro@igreja.test');
    expect(created).toMatchObject({ displayName: 'Maria Cadastro', role: 'member', status: 'pending' });
  });

  test('membro aprovado não acessa área administrativa', async ({ page }) => {
    const member = await users.member();

    await login(page, member);
    await expect(page).toHaveURL(/\/painel/);
    await page.goto('/admin/users');

    await expect(page.getByRole('heading', { name: 'Acesso Negado' })).toBeVisible();
    await expect(page.getByText('Permissão Necessária:')).toBeVisible();
    await expect(page.locator('body')).toContainText('Usuários');
  });
});

test.describe('Sistema ainda não configurado', () => {
  test.use({ systemInitialized: false });

  test('sem administrador o app mostra a configuração inicial', async ({ page }) => {
    await page.goto('/login');

    await expect(page.getByRole('heading', { name: 'Configuração Inicial' })).toBeVisible();
  });
});
