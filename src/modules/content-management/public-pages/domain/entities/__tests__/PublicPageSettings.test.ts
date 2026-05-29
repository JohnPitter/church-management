import {
  DEFAULT_PUBLIC_PAGES,
  PublicPage,
  PublicPageManager
} from '../PublicPageSettings';

describe('PublicPageSettings', () => {
  it('defines visitor self registration as a public page with anonymous registration', () => {
    expect(DEFAULT_PUBLIC_PAGES).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          page: PublicPage.VisitorRegistration,
          isPublic: true,
          allowRegistration: true,
          description: 'Cadastro público de visitantes'
        })
      ])
    );
  });

  it('maps visitor self registration to its label and route', () => {
    expect(PublicPageManager.getPageLabel(PublicPage.VisitorRegistration)).toBe(
      'Cadastro de Visitante'
    );
    expect(PublicPageManager.getPageRoute(PublicPage.VisitorRegistration)).toBe(
      '/cadastro-visitante'
    );
  });
});
