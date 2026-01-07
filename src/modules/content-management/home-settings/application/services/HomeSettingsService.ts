// Application Service - Home Settings Service
// Manages home page configuration

import { db } from '@/config/firebase';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { HomeSettings, HomeLayoutStyle, HomeSectionVisibility, DEFAULT_HOME_SETTINGS } from '../../domain/entities/HomeSettings';

export class HomeSettingsService {
  private readonly COLLECTION = 'homeSettings';
  private readonly DOC_ID = 'config';

  /**
   * Get current home settings
   */
  async getSettings(): Promise<HomeSettings> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          layoutStyle: data.layoutStyle || DEFAULT_HOME_SETTINGS.layoutStyle,
          sections: data.sections || DEFAULT_HOME_SETTINGS.sections,
          customization: data.customization || {},
          updatedAt: data.updatedAt?.toDate() || new Date(),
          updatedBy: data.updatedBy || ''
        };
      }

      // Return default settings if not found
      return {
        id: this.DOC_ID,
        ...DEFAULT_HOME_SETTINGS,
        updatedAt: new Date(),
        updatedBy: ''
      };
    } catch (error) {
      console.error('Error getting home settings:', error);
      throw error;
    }
  }

  /**
   * Update layout style
   */
  async updateLayoutStyle(style: HomeLayoutStyle, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      await setDoc(docRef, {
        layoutStyle: style,
        updatedAt: Timestamp.now(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('Error updating layout style:', error);
      throw error;
    }
  }

  /**
   * Update section visibility
   */
  async updateSections(sections: HomeSectionVisibility, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      await setDoc(docRef, {
        sections,
        updatedAt: Timestamp.now(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('Error updating sections:', error);
      throw error;
    }
  }

  /**
   * Update customization
   */
  async updateCustomization(customization: HomeSettings['customization'], updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      await setDoc(docRef, {
        customization,
        updatedAt: Timestamp.now(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('Error updating customization:', error);
      throw error;
    }
  }

  /**
   * Update all settings at once
   */
  async updateSettings(settings: Partial<HomeSettings>, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      await setDoc(docRef, {
        ...settings,
        updatedAt: Timestamp.now(),
        updatedBy
      }, { merge: true });
    } catch (error) {
      console.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Reset to default settings
   */
  async resetToDefaults(updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.COLLECTION, this.DOC_ID);
      await setDoc(docRef, {
        ...DEFAULT_HOME_SETTINGS,
        updatedAt: Timestamp.now(),
        updatedBy
      });
    } catch (error) {
      console.error('Error resetting settings:', error);
      throw error;
    }
  }
}
