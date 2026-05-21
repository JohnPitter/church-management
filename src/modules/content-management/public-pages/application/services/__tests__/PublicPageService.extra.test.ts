import { PublicPageService } from '../PublicPageService';
import { DEFAULT_PUBLIC_PAGES, PublicPage } from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  Timestamp: {
    now: jest.fn()
  }
}));

const firestore = jest.requireMock('firebase/firestore');
const mockDoc = firestore.doc as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockSetDoc = firestore.setDoc as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;

describe('PublicPageService additional coverage', () => {
  let service: PublicPageService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PublicPageService();
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockTimestampNow.mockReturnValue({ kind: 'now' });
  });

  it('returns saved configs when document exists', async () => {
    const configs = [{ ...DEFAULT_PUBLIC_PAGES[0], isPublic: false }];
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ pages: configs })
    });

    await expect(service.getPublicPageConfigs()).resolves.toEqual(configs);
  });

  it('creates default config when missing and falls back to defaults on read error', async () => {
    const saveSpy = jest.spyOn(service, 'savePublicPageConfigs').mockResolvedValueOnce();
    mockGetDoc.mockResolvedValueOnce({
      exists: () => false
    });

    await expect(service.getPublicPageConfigs()).resolves.toEqual(DEFAULT_PUBLIC_PAGES);
    expect(saveSpy).toHaveBeenCalledWith(DEFAULT_PUBLIC_PAGES);

    mockGetDoc.mockRejectedValueOnce(new Error('read failed'));
    await expect(service.getPublicPageConfigs()).resolves.toEqual(DEFAULT_PUBLIC_PAGES);
  });

  it('persists configs and propagates save failures', async () => {
    await service.savePublicPageConfigs(DEFAULT_PUBLIC_PAGES);

    expect(mockSetDoc).toHaveBeenCalledWith(
      expect.anything(),
      {
        pages: DEFAULT_PUBLIC_PAGES,
        updatedAt: { kind: 'now' }
      },
      { merge: true }
    );

    mockSetDoc.mockRejectedValueOnce(new Error('write failed'));
    await expect(service.savePublicPageConfigs(DEFAULT_PUBLIC_PAGES)).rejects.toThrow(
      'Erro ao salvar configurações de páginas públicas'
    );
  });

  it('updates existing and missing page visibility configs', async () => {
    jest.spyOn(service, 'getPublicPageConfigs')
      .mockResolvedValueOnce([...DEFAULT_PUBLIC_PAGES])
      .mockResolvedValueOnce([{ page: PublicPage.Home, isPublic: true, description: 'Home' } as any]);
    const saveSpy = jest.spyOn(service, 'savePublicPageConfigs').mockResolvedValue();

    await service.updatePageVisibility(PublicPage.Blog, true);
    await service.updatePageVisibility(PublicPage.Events, false);

    expect(saveSpy).toHaveBeenNthCalledWith(
      1,
      expect.arrayContaining([
        expect.objectContaining({ page: PublicPage.Blog, isPublic: true })
      ])
    );
    expect(saveSpy).toHaveBeenNthCalledWith(
      2,
      expect.arrayContaining([
        expect.objectContaining({ page: PublicPage.Events, isPublic: false, allowRegistration: true })
      ])
    );
  });

  it('updates registration setting and returns correct booleans for public access', async () => {
    jest.spyOn(service, 'getPublicPageConfigs')
      .mockResolvedValueOnce([...DEFAULT_PUBLIC_PAGES])
      .mockResolvedValueOnce([{ page: PublicPage.Live, isPublic: true, description: 'Live' } as any])
      .mockResolvedValueOnce(DEFAULT_PUBLIC_PAGES)
      .mockResolvedValueOnce([{ page: PublicPage.Blog, isPublic: false, description: 'Blog' } as any])
      .mockResolvedValueOnce([{ page: PublicPage.Forum, isPublic: true, allowRegistration: false, description: 'Forum' } as any])
      .mockRejectedValueOnce(new Error('boom'))
      .mockRejectedValueOnce(new Error('boom'));
    const saveSpy = jest.spyOn(service, 'savePublicPageConfigs').mockResolvedValue();

    await service.updatePageRegistrationSetting(PublicPage.Events, false);
    await service.updatePageRegistrationSetting(PublicPage.Forum, true);
    await expect(service.isPagePublic(PublicPage.Home)).resolves.toBe(true);
    await expect(service.isPagePublic(PublicPage.Blog)).resolves.toBe(false);
    await expect(service.canRegisterAnonymously(PublicPage.Forum)).resolves.toBe(false);

    expect(saveSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ page: PublicPage.Events, allowRegistration: false })
      ])
    );
    expect(saveSpy).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ page: PublicPage.Forum, allowRegistration: true })
      ])
    );
  });
});
