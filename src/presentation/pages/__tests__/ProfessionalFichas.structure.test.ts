/**
 * Smoke estrutural: garante que o monólito foi decomposto e a page shell
 * só orquestra via imports (não embute as 4 abas inline).
 */
import fs from 'fs';
import path from 'path';

describe('ProfessionalFichas structure (god page split)', () => {
  const root = process.cwd();
  const pagePath = path.join(root, 'src/presentation/pages/ProfessionalFichasPage.tsx');
  const modalPath = path.join(root, 'src/presentation/pages/fichas/ProfessionalFichaModal.tsx');
  const tabsDir = path.join(root, 'src/presentation/pages/fichas/tabs');

  it('page shell importa modal extraído e permanece enxuta', () => {
    const page = fs.readFileSync(pagePath, 'utf8');
    expect(page).toMatch(/from ['"]\.\/fichas\/ProfessionalFichaModal['"]/);
    expect(page).not.toMatch(/activeTab === 0 &&/);
    expect(page).not.toContain('Dados Especializados');
    const lines = page.split(/\r?\n/).length;
    expect(lines).toBeLessThan(500);
  });

  it('modal orquestra tabs extraídas', () => {
    const modal = fs.readFileSync(modalPath, 'utf8');
    expect(modal).toContain('FichaDetalhesTab');
    expect(modal).toContain('FichaDadosEspecializadosTab');
    expect(modal).toContain('FichaSessoesTab');
    expect(modal).toContain('FichaProntuarioTab');
    expect(modal).toMatch(/from ['"]\.\/tabs['"]/);
  });

  it('arquivos de tab existem', () => {
    for (const name of [
      'FichaDetalhesTab.tsx',
      'FichaDadosEspecializadosTab.tsx',
      'FichaSessoesTab.tsx',
      'FichaProntuarioTab.tsx',
      'index.ts',
      'types.ts',
    ]) {
      expect(fs.existsSync(path.join(tabsDir, name))).toBe(true);
    }
  });
});
