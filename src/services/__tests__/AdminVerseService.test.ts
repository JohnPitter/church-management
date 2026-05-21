import { ADMIN_VERSES } from '../../data/admin-verses';
import { AdminVerseService, adminVerseService } from '../AdminVerseService';

describe('AdminVerseService', () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  it('mantem um singleton compartilhado', () => {
    expect(AdminVerseService.getInstance()).toBe(AdminVerseService.getInstance());
    expect(adminVerseService).toBe(AdminVerseService.getInstance());
  });

  it('retorna o versiculo administrativo de hoje, ontem e amanha', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T12:00:00Z'));

    expect(adminVerseService.getTodaysAdminVerse()).toEqual(ADMIN_VERSES[1]);
    expect(adminVerseService.getTomorrowsAdminVerse()).toEqual(ADMIN_VERSES[2]);
    expect(adminVerseService.getYesterdaysAdminVerse()).toEqual(ADMIN_VERSES[0]);
  });

  it('retorna o versiculo de uma data especifica', () => {
    expect(adminVerseService.getAdminVerseForDate(new Date('2024-03-01T12:00:00Z'))).toEqual(ADMIN_VERSES[60]);
  });

  it('filtra versiculos por tema mapeando os meses corretos', () => {
    const leadershipVerses = adminVerseService.getVersesByTheme('leadership');
    const responsibilityVerses = adminVerseService.getVersesByTheme('responsibility');
    const hopeVerses = adminVerseService.getVersesByTheme('hope');

    expect(leadershipVerses).toEqual(ADMIN_VERSES.slice(0, 31));
    expect(responsibilityVerses).toEqual(ADMIN_VERSES.slice(31, 59));
    expect(hopeVerses).toEqual(ADMIN_VERSES.slice(341, 365));
  });

  it('retorna um versiculo aleatorio usando Math.random e informa a quantidade total', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0.5);

    expect(adminVerseService.getRandomAdminVerse()).toEqual(
      ADMIN_VERSES[Math.floor(0.5 * ADMIN_VERSES.length)]
    );
    expect(adminVerseService.getTotalVerseCount()).toBe(ADMIN_VERSES.length);
  });

  it('retorna versiculo por indice valido e null para indices invalidos', () => {
    expect(adminVerseService.getVerseByIndex(0)).toEqual(ADMIN_VERSES[0]);
    expect(adminVerseService.getVerseByIndex(-1)).toBeNull();
    expect(adminVerseService.getVerseByIndex(ADMIN_VERSES.length)).toBeNull();
  });
});
