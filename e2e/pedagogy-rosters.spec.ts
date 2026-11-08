import { Locator, Page } from '@playwright/test';
import { expect, login, test, users } from './support/fixtures';
import { listDocs, setDoc } from './support/emulator';

async function openRosterTab(page: Page): Promise<void> {
  await page.goto('/admin/pedagogia');
  await page.getByRole('tab', { name: 'Turmas' }).click();
  await expect(page.getByRole('heading', { name: 'Cadastrar turma' })).toBeVisible();
}

const rosterCard = (page: Page, index = 0): Locator => page.locator('article').nth(index);
const studentRows = (card: Locator): Locator => card.locator('div.grid');

async function seedRoster(classGroup: string, students: string[], organization = 'church'): Promise<void> {
  const now = new Date();
  await setDoc(`classRosters/${classGroup.toLowerCase().replace(/\s+/g, '-')}`, {
    organization,
    classGroup,
    students,
    createdBy: 'seed',
    createdAt: now,
    updatedAt: now
  });
}

async function storedRoster(classGroup: string) {
  const roster = (await listDocs('classRosters')).find(item => item.classGroup === classGroup);
  expect(roster, `turma "${classGroup}" gravada no Firestore`).toBeTruthy();
  return roster as { id: string; students: string[]; organization: string; classGroup: string };
}

test.describe('Turmas (coordenação pedagógica)', () => {
  test('cadastra turma com alunos e grava no Firestore', async ({ page }) => {
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    await page.getByPlaceholder('Ex.: Clube da leitura').fill('Clube da leitura');
    await page.getByPlaceholder(/Maria Silva/).fill('Maria Silva\nJoão Santos\n\nmaria silva');
    await page.getByRole('button', { name: 'Salvar turma' }).click();

    await expect(page.getByText('Turma cadastrada.')).toBeVisible();
    await expect(rosterCard(page).getByText('2 aluno(s)')).toBeVisible();

    const stored = await storedRoster('Clube da leitura');
    expect(stored.students).toEqual(['João Santos', 'Maria Silva']);
    expect(stored.organization).toBe('church');
  });

  test('regressão: "Salvar alterações da turma" grava nome, aluno renomeado e aluno novo', async ({ page }) => {
    await seedRoster('Clube da leitura', ['Maria Silva']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    const card = rosterCard(page);
    await card.getByLabel('Nome da turma').fill('Leitura 2026');
    await studentRows(card).first().getByRole('textbox').fill('Maria S. Silva');
    await card.getByPlaceholder('Adicionar aluno').fill('João Santos');
    await card.getByRole('button', { name: 'Salvar alterações da turma' }).click();

    await expect(page.getByText('Turma atualizada')).toBeVisible();
    // Depois de salvar, os rascunhos somem e a lista mostra o que foi gravado.
    await expect(rosterCard(page).getByLabel('Nome da turma')).toHaveValue('Leitura 2026');
    await expect(rosterCard(page).getByText('2 aluno(s)')).toBeVisible();
    await expect(card.getByPlaceholder('Adicionar aluno')).toHaveValue('');

    const stored = await storedRoster('Leitura 2026');
    expect(stored.students).toEqual(['João Santos', 'Maria S. Silva']);

    // Persistiu de verdade: sobrevive a recarregar a página.
    await page.reload();
    await page.getByRole('tab', { name: 'Turmas' }).click();
    await expect(rosterCard(page).getByLabel('Nome da turma')).toHaveValue('Leitura 2026');
    await expect(rosterCard(page).getByText('2 aluno(s)')).toBeVisible();
  });

  test('adiciona aluno pelo botão e pela tecla Enter, com confirmação', async ({ page }) => {
    await seedRoster('Coral', ['Ana']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    const card = rosterCard(page);
    await card.getByPlaceholder('Adicionar aluno').fill('Bruno');
    await card.getByRole('button', { name: 'Adicionar', exact: true }).click();
    await expect(page.getByText('Aluno adicionado à turma')).toBeVisible();
    await expect(card.getByText('2 aluno(s)')).toBeVisible();

    await card.getByPlaceholder('Adicionar aluno').fill('Carla');
    await card.getByPlaceholder('Adicionar aluno').press('Enter');
    await expect(card.getByText('3 aluno(s)')).toBeVisible();

    expect((await storedRoster('Coral')).students).toEqual(['Ana', 'Bruno', 'Carla']);
  });

  test('o recarregamento após salvar não apaga o que foi digitado em outra turma', async ({ page }) => {
    await seedRoster('Banda', ['Davi']);
    await seedRoster('Coral', ['Ana']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    // Turmas vêm em ordem alfabética: Banda (0) e Coral (1).
    await rosterCard(page, 1).getByPlaceholder('Adicionar aluno').fill('rascunho em andamento');
    await rosterCard(page, 0).getByPlaceholder('Adicionar aluno').fill('Eva');
    await rosterCard(page, 0).getByRole('button', { name: 'Adicionar', exact: true }).click();

    await expect(rosterCard(page, 0).getByText('2 aluno(s)')).toBeVisible();
    await expect(rosterCard(page, 1).getByPlaceholder('Adicionar aluno')).toHaveValue('rascunho em andamento');
  });

  test('não permite turma duplicada nem salvar sem aluno', async ({ page }) => {
    await seedRoster('Coral', ['Ana']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    await page.getByPlaceholder('Ex.: Clube da leitura').fill('Coral');
    await page.getByPlaceholder(/Maria Silva/).fill('Fulano');
    await page.getByRole('button', { name: 'Salvar turma' }).click();
    await expect(page.getByText('Essa turma já está cadastrada')).toBeVisible();

    await page.getByPlaceholder('Ex.: Clube da leitura').fill('Teatro');
    await page.getByPlaceholder(/Maria Silva/).fill('');
    await page.getByRole('button', { name: 'Salvar turma' }).click();
    await expect(page.getByText('Inclua ao menos um aluno na turma')).toBeVisible();

    expect((await listDocs('classRosters')).map(item => item.classGroup)).toEqual(['Coral']);
  });

  test('move e copia aluno entre turmas', async ({ page }) => {
    await seedRoster('Banda', ['Davi', 'Eva']);
    await seedRoster('Coral', ['Ana']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    // Mover Davi (linha 0 de Banda) para Coral.
    const banda = rosterCard(page, 0);
    await studentRows(banda).nth(0).getByRole('combobox').selectOption({ label: 'Coral' });
    await studentRows(banda).nth(0).getByRole('button', { name: 'Mover', exact: true }).click();
    await expect(page.getByText('Davi foi movido de turma')).toBeVisible();
    // O toast aparece antes da lista recarregar: espera a linha do Davi sair de Banda.
    await expect(rosterCard(page, 0).getByText(/^1 aluno\(s\)/)).toBeVisible();

    // Copiar Eva (agora a única de Banda) para Coral.
    await studentRows(rosterCard(page, 0)).nth(0).getByRole('combobox').selectOption({ label: 'Coral' });
    await studentRows(rosterCard(page, 0)).nth(0).getByRole('button', { name: 'Copiar', exact: true }).click();
    await expect(page.getByText(/Eva permanece nesta turma/)).toBeVisible();

    expect((await storedRoster('Banda')).students).toEqual(['Eva']);
    expect((await storedRoster('Coral')).students).toEqual(['Ana', 'Davi', 'Eva']);
  });

  test('remove aluno e apaga turma', async ({ page }) => {
    await seedRoster('Coral', ['Ana', 'Bruno']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    await studentRows(rosterCard(page)).nth(0).getByRole('button', { name: 'Remover' }).click();
    await expect(page.getByText('Ana foi removido da turma')).toBeVisible();
    expect((await storedRoster('Coral')).students).toEqual(['Bruno']);

    page.once('dialog', dialog => void dialog.accept());
    await rosterCard(page).getByRole('button', { name: 'Apagar turma' }).click();
    await expect(page.getByText('Turma apagada')).toBeVisible();
    await expect(page.getByText('Nenhuma turma cadastrada ainda.')).toBeVisible();
    expect(await listDocs('classRosters')).toHaveLength(0);
  });

  test('altera o local da turma entre Igreja e ONG', async ({ page }) => {
    await seedRoster('Coral', ['Ana']);
    const coordinator = await users.coordinator();
    await login(page, coordinator);
    await openRosterTab(page);

    await rosterCard(page).getByLabel('Local').selectOption('ong');
    await rosterCard(page).getByRole('button', { name: 'Salvar alterações da turma' }).click();
    await expect(page.getByText('Turma atualizada')).toBeVisible();

    expect((await storedRoster('Coral')).organization).toBe('ong');
    // Na visão da Igreja a turma deixa de aparecer.
    await expect(page.getByText('Nenhuma turma cadastrada ainda.')).toBeVisible();
  });

  test('secretaria também gerencia turmas', async ({ page }) => {
    const secretary = await users.secretary();
    await login(page, secretary);
    await page.goto('/admin/pedagogia');
    await page.getByRole('tab', { name: 'Turmas' }).click();

    await page.getByPlaceholder('Ex.: Clube da leitura').fill('Teatro');
    await page.getByPlaceholder(/Maria Silva/).fill('Lia Costa');
    await page.getByRole('button', { name: 'Salvar turma' }).click();

    await expect(page.getByText('Turma cadastrada.')).toBeVisible();
    expect((await storedRoster('Teatro')).students).toEqual(['Lia Costa']);
  });

  test('educador não acessa a gestão de turmas', async ({ page }) => {
    const educator = await users.educator();
    await login(page, educator);
    await expect(page).toHaveURL(/\/educator/);

    await page.goto('/admin/pedagogia');

    await expect(page.getByRole('heading', { name: 'Acesso Negado' })).toBeVisible();
  });
});
