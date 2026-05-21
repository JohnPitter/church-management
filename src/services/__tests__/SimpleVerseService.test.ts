import { DAILY_VERSES } from '../../data/daily-verses';
import { SimpleVerseService, simpleVerseService } from '../SimpleVerseService';

describe('SimpleVerseService', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('mantem um singleton compartilhado', () => {
    expect(SimpleVerseService.getInstance()).toBe(SimpleVerseService.getInstance());
    expect(simpleVerseService).toBe(SimpleVerseService.getInstance());
  });

  it('retorna o versiculo de hoje com base na data atual', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T12:00:00Z'));

    expect(simpleVerseService.getTodaysVerse()).toEqual(DAILY_VERSES[1]);
  });

  it('retorna versiculos para datas especificas, ontem e amanha', () => {
    const service = SimpleVerseService.getInstance();

    expect(service.getVerseForDate(new Date('2024-12-31T12:00:00Z'))).toEqual(DAILY_VERSES[2]);

    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-02T12:00:00Z'));

    expect(service.getTomorrowsVerse()).toEqual(DAILY_VERSES[2]);
    expect(service.getYesterdaysVerse()).toEqual(DAILY_VERSES[0]);
  });
});
