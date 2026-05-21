import {
  DEFAULT_HOME_SETTINGS,
  HomeLayoutStyle,
  LAYOUT_STYLE_INFO,
  SECTION_INFO,
} from '../HomeSettings';

describe('HomeSettings entities', () => {
  it('expoe defaults consistentes', () => {
    expect(DEFAULT_HOME_SETTINGS.layoutStyle).toBe(HomeLayoutStyle.CANVA);
    expect(DEFAULT_HOME_SETTINGS.sections.hero).toBe(true);
    expect(DEFAULT_HOME_SETTINGS.sections.statistics).toBe(false);
    expect(DEFAULT_HOME_SETTINGS.customization).toEqual({});
  });

  it('descreve os estilos de layout disponiveis', () => {
    expect(LAYOUT_STYLE_INFO[HomeLayoutStyle.CANVA].name).toBe('Canva Design');
    expect(LAYOUT_STYLE_INFO[HomeLayoutStyle.APPLE].colors.primary).toBe('#000000');
    expect(LAYOUT_STYLE_INFO[HomeLayoutStyle.ENTERPRISE].characteristics.length).toBeGreaterThan(0);
  });

  it('descreve as secoes configuraveis da home', () => {
    expect(SECTION_INFO.hero.required).toBe(true);
    expect(SECTION_INFO.socialMedia.required).toBe(false);
    expect(SECTION_INFO.contact.name).toBe('Informações de Contato');
  });
});
