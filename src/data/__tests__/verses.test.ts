import { bibleVerses, getVerseOfTheDay } from '../verses';

describe('verses data', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('expoe uma lista valida de versiculos', () => {
    expect(bibleVerses.length).toBeGreaterThan(0);

    bibleVerses.forEach((verse) => {
      expect(verse.text).toBeTruthy();
      expect(verse.reference).toBeTruthy();
    });
  });

  it('retorna o versiculo correspondente ao dia atual', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T12:00:00Z'));

    const verse = getVerseOfTheDay();

    expect(verse).toEqual(bibleVerses[2 % bibleVerses.length]);
  });
});
