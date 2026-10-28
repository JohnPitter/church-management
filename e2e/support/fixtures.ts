import { expect, test as base, Page } from '@playwright/test';
import { resetEmulators, seedUser, SeededUser, setDoc } from './emulator';

export { expect };

/** Erros de JavaScript não tratados na página (além de falhas de rede esperadas). */
export function collectPageErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  return errors;
}

export async function login(
  page: Page,
  user: Pick<SeededUser, 'email' | 'password'>,
  { expectSuccess = true }: { expectSuccess?: boolean } = {}
): Promise<void> {
  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Senha').fill(user.password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  // Espera o login concluir (a sessão só é persistida depois); navegar antes a interromperia.
  if (expectSuccess) {
    await page.waitForURL(url => !url.pathname.startsWith('/login'));
  }
}

export const test = base.extend<{ systemInitialized: boolean }>({
  // Sistema já configurado (settings/system.initialized); use `test.use({ systemInitialized: false })`
  // para exercitar a tela de configuração inicial.
  systemInitialized: [true, { option: true }],

  // Cada teste começa com Auth e Firestore vazios (apenas o marcador de sistema inicializado).
  page: async ({ page, systemInitialized }, use) => {
    await resetEmulators();
    if (systemInitialized) {
      await setDoc('settings/system', { initialized: true });
    }
    await use(page);
  }
});

export const users = {
  admin: () => seedUser({ email: 'admin@igreja.test', displayName: 'Admin Teste', role: 'admin' }),
  coordinator: () =>
    seedUser({ email: 'coord@igreja.test', displayName: 'Coordenação Teste', role: 'pedagogical_coordinator' }),
  secretary: () => seedUser({ email: 'secretaria@igreja.test', displayName: 'Secretaria Teste', role: 'secretary' }),
  educator: () => seedUser({ email: 'educador@igreja.test', displayName: 'Educador Teste', role: 'educator' }),
  member: () => seedUser({ email: 'membro@igreja.test', displayName: 'Membro Teste', role: 'member' }),
  pending: () =>
    seedUser({ email: 'pendente@igreja.test', displayName: 'Pendente Teste', role: 'member', status: 'pending' })
};
