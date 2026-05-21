import { LayoutStyle, LayoutTemplateFactory } from '../LayoutTemplates';

describe('LayoutTemplateFactory', () => {
  it('retorna os metadados de todos os templates', () => {
    const templates = LayoutTemplateFactory.getAllTemplates();

    expect(templates).toHaveLength(3);
    expect(templates.map(t => t.style)).toEqual([
      LayoutStyle.CANVA,
      LayoutStyle.APPLE,
      LayoutStyle.ENTERPRISE,
    ]);
    expect(templates.every(t => t.designPrinciples.length >= 3)).toBe(true);
  });

  it('cria layout canva com componentes esperados', () => {
    const layout = LayoutTemplateFactory.createCanvaLayout('Igreja Teste');

    expect(layout.name).toContain('Canva');
    expect(layout.components.length).toBeGreaterThan(5);
    expect(layout.components[0].id).toBe('canva-hero');
    expect(layout.components.some(c => c.id === 'canva-actions')).toBe(true);
    expect(JSON.stringify(layout)).toContain('Igreja Teste');
  });

  it('cria layout apple com componentes e defaults especificos', () => {
    const layout = LayoutTemplateFactory.createAppleLayout();

    expect(layout.name).toContain('Apple');
    expect(layout.components[0].id).toBe('apple-hero');
    expect(layout.components.some(c => c.id === 'apple-features')).toBe(true);
    expect(JSON.stringify(layout)).toContain('Nossa Igreja');
  });

  it('cria layout enterprise e seleciona por style via factory geral', () => {
    const enterprise = LayoutTemplateFactory.createEnterpriseLayout('Corp Church');
    const fromStyle = LayoutTemplateFactory.createLayoutFromStyle(LayoutStyle.ENTERPRISE, 'Corp Church');
    const fallback = LayoutTemplateFactory.createLayoutFromStyle('unknown' as LayoutStyle, 'Fallback Church');

    expect(enterprise.name).toContain('Enterprise');
    expect(enterprise.components[0].id).toBe('enterprise-hero');
    expect(fromStyle.name).toContain('Enterprise');
    expect(JSON.stringify(fromStyle)).toContain('Corp Church');
    expect(fallback.name).toContain('Canva');
  });
});
