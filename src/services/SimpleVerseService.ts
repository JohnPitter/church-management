// Simple Verse Service - Gets daily verse based on day of year
// No API calls, no database, just local data

import { DAILY_VERSES, getDayOfYear, DailyVerse } from '../data/daily-verses';

export class SimpleVerseService {
  private static instance: SimpleVerseService;

  private constructor() {}

  static getInstance(): SimpleVerseService {
    if (!SimpleVerseService.instance) {
      SimpleVerseService.instance = new SimpleVerseService();
    }
    return SimpleVerseService.instance;
  }

  /**
   * Gets today's verse based on the day of year
   * Each day of the year maps to a specific verse (1-365)
   * This ensures the same verse is shown all day and changes at midnight
   */
  getTodaysVerse(): DailyVerse {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);
    
    // Use modulo to handle leap years (day 366 becomes day 1)
    const verseIndex = (dayOfYear - 1) % DAILY_VERSES.length;
    
    const verse = DAILY_VERSES[verseIndex];

    return verse;
  }

  /**
   * Gets verse for a specific date
   */
  getVerseForDate(date: Date): DailyVerse {
    const dayOfYear = getDayOfYear(date);
    const verseIndex = (dayOfYear - 1) % DAILY_VERSES.length;
    return DAILY_VERSES[verseIndex];
  }

  /**
   * Gets tomorrow's verse (for preview)
   */
  getTomorrowsVerse(): DailyVerse {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getVerseForDate(tomorrow);
  }

  /**
   * Gets yesterday's verse (for history)
   */
  getYesterdaysVerse(): DailyVerse {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.getVerseForDate(yesterday);
  }
}

export const simpleVerseService = SimpleVerseService.getInstance();