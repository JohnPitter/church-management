// Infrastructure Service - Daily Verse Update Service
// Handles automatic verse of the day updates

import { verseOfTheDayService } from './VerseOfTheDayService';

export class DailyVerseUpdateService {
  private static instance: DailyVerseUpdateService;
  private lastCheckedDate: string | null = null;

  private constructor() {}

  static getInstance(): DailyVerseUpdateService {
    if (!DailyVerseUpdateService.instance) {
      DailyVerseUpdateService.instance = new DailyVerseUpdateService();
    }
    return DailyVerseUpdateService.instance;
  }

  /**
   * Check and update verse of the day if needed
   * This method should be called on user login/session start
   */
  async checkAndUpdateVerse(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      console.log('🕐 Checking verse of the day for:', today);
      
      // Get current verse from database
      const currentVerse = await verseOfTheDayService.getTodaysVerse();
      
      // Always update if no verse exists or if date doesn't match
      if (!currentVerse || currentVerse.date !== today) {
        console.log('📖 Updating verse of the day - Current:', currentVerse?.reference || 'none', 'Date:', currentVerse?.date || 'none');
        await this.updateTodaysVerse();
      } else {
        console.log('📅 Verse exists for today but checking if we need fresh fetch...');
        
        // If we haven't checked today yet, force a fresh fetch to get the real verse of the day
        if (this.lastCheckedDate !== today) {
          console.log('🔄 Haven\'t checked APIs today, fetching fresh verse...');
          await this.updateTodaysVerse();
        } else {
          console.log('✅ Already fetched fresh verse today:', currentVerse.reference);
        }
      }
      
      // Mark as checked for today
      this.lastCheckedDate = today;
      
    } catch (error) {
      console.error('Error checking/updating verse of the day:', error);
      // Don't throw error to avoid breaking login flow
    }
  }

  /**
   * Force update today's verse - always fetches fresh from API
   */
  private async updateTodaysVerse(): Promise<void> {
    try {
      console.log('🔄 Fetching NEW verse of the day from APIs...');
      
      // Always try to fetch fresh from APIs first
      let fetchedVerse = await verseOfTheDayService.fetchFromBibleCom();
      let isFromAPI = true;
      
      // If couldn't fetch from any API, use 365-verse fallback system
      if (!fetchedVerse) {
        console.log('⚠️ Could not fetch from any API, using 365-verse fallback system');
        fetchedVerse = verseOfTheDayService.getFallbackVerse();
        isFromAPI = false;
      }
      
      // Save the new verse to Firebase (this will overwrite existing)
      const today = new Date().toISOString().split('T')[0];
      const verseToSave = {
        text: fetchedVerse.text,
        reference: fetchedVerse.reference,
        version: fetchedVerse.version,
        date: today,
        source: (isFromAPI ? 'bible.com' : 'fallback') as 'bible.com' | 'fallback'
      };
      
      await verseOfTheDayService.saveVerse(verseToSave);
      console.log('✅ NEW verse of the day saved:', fetchedVerse.reference, '- Text:', fetchedVerse.text.substring(0, 50) + '...');
      
      // Dispatch custom event to notify components that verse was updated
      const event = new CustomEvent('verseUpdated', {
        detail: {
          verse: fetchedVerse,
          date: today
        }
      });
      window.dispatchEvent(event);
      
    } catch (error) {
      console.error('❌ Error updating today\'s verse:', error);
      throw error;
    }
  }

  /**
   * Get the last verse in the database to check its date
   */
  async getLastVerseDate(): Promise<string | null> {
    try {
      const verse = await verseOfTheDayService.getTodaysVerse();
      return verse?.date || null;
    } catch (error) {
      console.error('Error getting last verse date:', error);
      return null;
    }
  }

  /**
   * Manual trigger for updating verse (for testing or admin purposes)
   */
  async forceUpdateVerse(): Promise<void> {
    console.log('🔄 Force updating verse of the day...');
    this.lastCheckedDate = null; // Reset check flag
    await this.updateTodaysVerse();
  }

  /**
   * Force update by clearing today's verse from database first
   */
  async forceUpdateFromAPI(): Promise<void> {
    try {
      console.log('🗑️ Clearing existing verse and forcing API update...');
      
      // Clear the check date to force update
      this.lastCheckedDate = null;
      
      // Try to delete today's verse from database to force refresh
      const _today = new Date().toISOString().split('T')[0];
      try {
        // Note: We can't actually delete from Firestore here without importing Firebase
        // But we can force a new fetch anyway
        console.log('📡 Forcing fresh fetch from Bible.com API...');
      } catch (error) {
        console.warn('Could not clear cache, but continuing with forced update');
      }
      
      // Force update regardless of cache
      await this.updateTodaysVerse();
      
    } catch (error) {
      console.error('❌ Error in force update from API:', error);
      throw error;
    }
  }

  /**
   * Check if verse needs update without updating it
   */
  async needsUpdate(): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const currentVerse = await verseOfTheDayService.getTodaysVerse();
      
      return !currentVerse || currentVerse.date !== today;
    } catch (error) {
      console.error('Error checking if verse needs update:', error);
      return false;
    }
  }
}

// Export singleton instance
export const dailyVerseUpdateService = DailyVerseUpdateService.getInstance();