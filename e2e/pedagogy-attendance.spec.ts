import { expect, login, test, users } from './support/fixtures';
import { listDocs } from './support/emulator';

test.describe('Fluxo completo: coordenação cadastra, arte-educador puxa a chamada', () => {
  test('turma criada pela coordenação aparece na chamada do educador e a presença é gravada', async ({
    page,
    browser
  }) => {
    const coordinator = await users.coordinator();
    const educator = await users.educator();

    // 1) Coordenação cadastra a turma pela interface.
    await login(page, coordinator);
    await page.goto('/admin/pedagogia');
    await page.getByRole('tab', { name: 'Turmas' }).click();
    await page.getByPlaceholder('Ex.: Clube da leitura').fill('Violão');
    await page.getByPlaceholder(/Maria Silva/).fill('Ana Lima\nBruno Dias\nCarla Souza');
    await page.getByRole('button', { name: 'Salvar turma' }).click();
    await expect(page.getByText('Turma cadastrada.')).toBeVisible();

    // 2) Arte-educador (outra sessão) puxa a chamada da turma.
    const educatorContext = await browser.newContext({ locale: 'pt-BR', timezoneId: 'America/Sao_Paulo' });
    const educatorPage = await educatorContext.newPage();
    try {
      await login(educatorPage, educator);
      await expect(educatorPage).toHaveURL(/\/educator/);
      await educatorPage.getByRole('tab', { name: 'Chamada' }).click();

      await educatorPage.getByLabel('Turma').selectOption('Violão');
      await educatorPage.getByRole('button', { name: 'Puxar chamada' }).click();
      await expect(educatorPage.getByText('Chamada de Violão carregada')).toBeVisible();

      const presenceBoxes = educatorPage.getByRole('checkbox', { name: 'Presente' });
      await expect(presenceBoxes).toHaveCount(3);
      // Bruno Dias (2º da lista, ordem alfabética) falta.
      await presenceBoxes.nth(1).uncheck();
      await educatorPage.getByRole('button', { name: 'Salvar chamada' }).click();

      await expect(educatorPage.getByText('Chamada registrada')).toBeVisible();
      await expect(educatorPage.getByText('2 presente(s) · 1 falta(s)')).toBeVisible();
      await expect(educatorPage.getByText('Ausentes: Bruno Dias')).toBeVisible();
    } finally {
      await educatorContext.close();
    }

    // 3) A chamada ficou gravada com o educador correto.
    const [roll] = await listDocs('classAttendanceRolls');
    expect(roll).toMatchObject({ classGroup: 'Violão', educatorId: educator.uid, organization: 'church' });
    expect(roll.students).toEqual([
      { name: 'Ana Lima', present: true },
      { name: 'Bruno Dias', present: false },
      { name: 'Carla Souza', present: true }
    ]);
  });

  test('educador sem turmas cadastradas é orientado a pedir à secretaria', async ({ page }) => {
    const educator = await users.educator();
    await login(page, educator);
    await page.getByRole('tab', { name: 'Chamada' }).click();

    await expect(page.getByText(/Nenhuma turma cadastrada\. Peça à secretaria/)).toBeVisible();
  });
});
