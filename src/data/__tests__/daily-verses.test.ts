import { DAILY_VERSES, getDailyVerse, getDayOfYear } from '../daily-verses';

describe('daily-verses data', () => {
  it('expoe uma base completa e padronizada de versiculos diarios', () => {
    expect(DAILY_VERSES.length).toBeGreaterThan(300);

    DAILY_VERSES.forEach((verse) => {
      expect(verse.text).toBeTruthy();
      expect(verse.reference).toBeTruthy();
      expect(verse.version).toBe('NTLH');
    });
  });

  it('retorna o versiculo do dia usando modulo para dias acima do total', () => {
    expect(getDailyVerse(1)).toEqual(DAILY_VERSES[0]);
    expect(getDailyVerse(DAILY_VERSES.length + 1)).toEqual(DAILY_VERSES[0]);
    expect(getDailyVerse(DAILY_VERSES.length + 2)).toEqual(DAILY_VERSES[1]);
  });

  it('calcula corretamente o dia do ano', () => {
    expect(getDayOfYear(new Date('2024-01-01T12:00:00Z'))).toBe(1);
    expect(getDayOfYear(new Date('2024-12-31T12:00:00Z'))).toBe(366);
    expect(getDayOfYear(new Date('2025-12-31T12:00:00Z'))).toBe(365);
  });
});
