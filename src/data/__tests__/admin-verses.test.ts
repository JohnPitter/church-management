import {
  ADMIN_VERSES,
  getAdminVerse,
  getDayOfYear,
  getTodaysAdminVerse,
} from '../admin-verses';

describe('admin-verses data', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('expoe uma base completa de versiculos administrativos', () => {
    expect(ADMIN_VERSES.length).toBe(365);

    ADMIN_VERSES.forEach((verse) => {
      expect(verse.text).toBeTruthy();
      expect(verse.reference).toBeTruthy();
      expect(verse.version).toBe('NTLH');
    });
  });

  it('retorna o versiculo administrativo correto por dia', () => {
    expect(getAdminVerse(1)).toEqual(ADMIN_VERSES[0]);
    expect(getAdminVerse(366)).toEqual(ADMIN_VERSES[0]);
    expect(getAdminVerse(367)).toEqual(ADMIN_VERSES[1]);
  });

  it('calcula o dia do ano e retorna o versiculo de hoje', () => {
    expect(getDayOfYear(new Date('2024-03-01T12:00:00Z'))).toBe(61);

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-01T12:00:00Z'));

    expect(getTodaysAdminVerse()).toEqual(ADMIN_VERSES[60]);
  });
});
