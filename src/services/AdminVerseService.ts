// Admin Verse Service - Gets daily verses for administrators
// Focused on leadership, management, and responsibility themes
// No API calls, no database, just local data

import { ADMIN_VERSES, getDayOfYear, AdminVerse } from '../data/admin-verses';

export class AdminVerseService {
  private static instance: AdminVerseService;

  private constructor() {}

  static getInstance(): AdminVerseService {
    if (!AdminVerseService.instance) {
      AdminVerseService.instance = new AdminVerseService();
    }
    return AdminVerseService.instance;
  }

  /**
   * Gets today's admin verse based on the day of year
   * Each day of the year maps to a specific verse about leadership/management
   * This ensures the same verse is shown all day and changes at midnight
   */
  getTodaysAdminVerse(): AdminVerse {
    const today = new Date();
    const dayOfYear = getDayOfYear(today);

    // Use modulo to handle leap years (day 366 becomes day 1)
    const verseIndex = (dayOfYear - 1) % ADMIN_VERSES.length;

    const verse = ADMIN_VERSES[verseIndex];

    return verse;
  }

  /**
   * Gets admin verse for a specific date
   */
  getAdminVerseForDate(date: Date): AdminVerse {
    const dayOfYear = getDayOfYear(date);
    const verseIndex = (dayOfYear - 1) % ADMIN_VERSES.length;
    return ADMIN_VERSES[verseIndex];
  }

  /**
   * Gets tomorrow's admin verse (for preview)
   */
  getTomorrowsAdminVerse(): AdminVerse {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.getAdminVerseForDate(tomorrow);
  }

  /**
   * Gets yesterday's admin verse (for history)
   */
  getYesterdaysAdminVerse(): AdminVerse {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return this.getAdminVerseForDate(yesterday);
  }

  /**
   * Gets all verses for a specific theme
   * Useful for admin reports or themed content
   */
  getVersesByTheme(theme: 'leadership' | 'responsibility' | 'integrity' | 'wisdom' | 'service' | 'communication' | 'perseverance' | 'justice' | 'discernment' | 'patience' | 'generosity' | 'hope'): AdminVerse[] {
    // Map months to themes (approximately)
    const themeMonths: Record<string, number[]> = {
      'leadership': [0], // Janeiro
      'responsibility': [1], // Fevereiro
      'integrity': [2], // Março
      'wisdom': [3], // Abril
      'service': [4], // Maio
      'communication': [5], // Junho
      'perseverance': [6], // Julho
      'justice': [7], // Agosto
      'discernment': [8], // Setembro
      'patience': [9], // Outubro
      'generosity': [10], // Novembro
      'hope': [11] // Dezembro
    };

    const months = themeMonths[theme] || [];
    const verses: AdminVerse[] = [];

    months.forEach(month => {
      const daysInMonth = month === 1 ? 28 : (month === 3 || month === 5 || month === 8 || month === 10 ? 30 : 31);
      const startIndex = month * 31; // Approximate start index
      const endIndex = Math.min(startIndex + daysInMonth, ADMIN_VERSES.length);
      
      for (let i = startIndex; i < endIndex && i < ADMIN_VERSES.length; i++) {
        verses.push(ADMIN_VERSES[i]);
      }
    });

    return verses;
  }

  /**
   * Gets a random verse for inspiration (not tied to date)
   */
  getRandomAdminVerse(): AdminVerse {
    const randomIndex = Math.floor(Math.random() * ADMIN_VERSES.length);
    return ADMIN_VERSES[randomIndex];
  }

  /**
   * Gets verse count
   */
  getTotalVerseCount(): number {
    return ADMIN_VERSES.length;
  }

  /**
   * Gets verse by index (0-based)
   */
  getVerseByIndex(index: number): AdminVerse | null {
    if (index < 0 || index >= ADMIN_VERSES.length) {
      return null;
    }
    return ADMIN_VERSES[index];
  }
}

export const adminVerseService = AdminVerseService.getInstance();