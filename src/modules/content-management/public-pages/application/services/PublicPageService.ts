// Infrastructure Service - Public Page Service
// Manages which pages are accessible to non-authenticated users

import { 
  doc, 
  getDoc, 
  setDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PublicPageConfig, DEFAULT_PUBLIC_PAGES, PublicPage } from '@modules/content-management/public-pages/domain/entities/PublicPageSettings';

export class PublicPageService {
  private readonly collectionName = 'publicPageSettings';
  private readonly docId = 'config';

  async getPublicPageConfigs(): Promise<PublicPageConfig[]> {
    try {
      const docRef = doc(db, this.collectionName, this.docId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.pages || DEFAULT_PUBLIC_PAGES;
      } else {
        // If no config exists, create default and return it
        await this.savePublicPageConfigs(DEFAULT_PUBLIC_PAGES);
        return DEFAULT_PUBLIC_PAGES;
      }
    } catch (error) {
      console.error('Error getting public page configs:', error);
      // Return default configs if there's an error
      return DEFAULT_PUBLIC_PAGES;
    }
  }

  async savePublicPageConfigs(configs: PublicPageConfig[]): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, this.docId);
      await setDoc(docRef, {
        pages: configs,
        updatedAt: Timestamp.now()
      }, { merge: true });
    } catch (error) {
      console.error('Error saving public page configs:', error);
      throw new Error('Erro ao salvar configurações de páginas públicas');
    }
  }

  async updatePageVisibility(page: PublicPage, isPublic: boolean): Promise<void> {
    try {
      const configs = await this.getPublicPageConfigs();
      const configIndex = configs.findIndex(c => c.page === page);
      
      if (configIndex >= 0) {
        configs[configIndex].isPublic = isPublic;
      } else {
        // Add new config if doesn't exist
        const defaultConfig = DEFAULT_PUBLIC_PAGES.find(c => c.page === page);
        if (defaultConfig) {
          configs.push({ ...defaultConfig, isPublic });
        }
      }

      await this.savePublicPageConfigs(configs);
    } catch (error) {
      console.error('Error updating page visibility:', error);
      throw new Error('Erro ao atualizar visibilidade da página');
    }
  }

  async updatePageRegistrationSetting(page: PublicPage, allowRegistration: boolean): Promise<void> {
    try {
      const configs = await this.getPublicPageConfigs();
      const configIndex = configs.findIndex(c => c.page === page);
      
      if (configIndex >= 0) {
        configs[configIndex].allowRegistration = allowRegistration;
      } else {
        // Add new config if doesn't exist
        const defaultConfig = DEFAULT_PUBLIC_PAGES.find(c => c.page === page);
        if (defaultConfig) {
          configs.push({ ...defaultConfig, allowRegistration });
        }
      }

      await this.savePublicPageConfigs(configs);
    } catch (error) {
      console.error('Error updating registration setting:', error);
      throw new Error('Erro ao atualizar configuração de registro');
    }
  }

  async isPagePublic(page: PublicPage): Promise<boolean> {
    try {
      const configs = await this.getPublicPageConfigs();
      const config = configs.find(c => c.page === page);
      return config?.isPublic ?? false;
    } catch (error) {
      console.error('Error checking if page is public:', error);
      return false;
    }
  }

  async canRegisterAnonymously(page: PublicPage): Promise<boolean> {
    try {
      const configs = await this.getPublicPageConfigs();
      const config = configs.find(c => c.page === page);
      return config?.isPublic === true && config?.allowRegistration === true;
    } catch (error) {
      console.error('Error checking anonymous registration:', error);
      return false;
    }
  }
}