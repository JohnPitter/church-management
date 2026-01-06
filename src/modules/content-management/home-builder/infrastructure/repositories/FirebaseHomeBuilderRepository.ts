// Data Repository - Firebase Home Builder Repository
// Repository for managing home page layouts in Firebase

import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { HomeLayout, HomeComponent } from '@modules/content-management/home-builder/domain/entities/HomeBuilder';

export class FirebaseHomeBuilderRepository {
  private collectionName = 'homeLayouts';

  // Helper function to remove undefined fields
  private removeUndefinedFields(obj: any): any {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }

    if (typeof obj === 'object') {
      const cleaned: any = {};
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedFields(value);
        }
      });
      return cleaned;
    }

    return obj;
  }

  async createLayout(layout: Omit<HomeLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<HomeLayout> {
    try {
      const layoutData = {
        ...layout,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        components: layout.components.map(comp => ({
          ...comp,
          settings: comp.settings || {},
          responsive: comp.responsive || {}
        })),
        globalSettings: layout.globalSettings || {},
        description: layout.description || ''
      };

      // Remove undefined fields before saving
      const cleanedData = this.removeUndefinedFields(layoutData);

      const docRef = await addDoc(collection(db, this.collectionName), cleanedData);
      
      return {
        ...layout,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating layout:', error);
      throw new Error('Erro ao criar layout');
    }
  }

  async updateLayout(id: string, updates: Partial<HomeLayout>): Promise<HomeLayout> {
    try {
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Clean up the data before saving
      if (updateData.components) {
        updateData.components = updateData.components.map((comp: HomeComponent) => ({
          ...comp,
          settings: comp.settings || {},
          responsive: comp.responsive || {}
        }));
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      // Remove undefined fields before saving
      const cleanedData = this.removeUndefinedFields(updateData);

      await updateDoc(doc(db, this.collectionName, id), cleanedData);
      
      // Get the updated document
      const updatedDoc = await this.getLayoutById(id);
      if (!updatedDoc) {
        throw new Error('Layout não encontrado após atualização');
      }
      
      return updatedDoc;
    } catch (error) {
      console.error('Error updating layout:', error);
      throw new Error('Erro ao atualizar layout');
    }
  }

  async deleteLayout(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error('Error deleting layout:', error);
      throw new Error('Erro ao excluir layout');
    }
  }

  async getLayoutById(id: string): Promise<HomeLayout | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return this.mapToHomeLayout(docSnap.id, docSnap.data());
      }
      
      return null;
    } catch (error) {
      console.error('Error getting layout by ID:', error);
      throw new Error('Erro ao buscar layout');
    }
  }

  async getAllLayouts(): Promise<HomeLayout[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToHomeLayout(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error getting all layouts:', error);
      throw new Error('Erro ao buscar layouts');
    }
  }

  async getActiveLayout(): Promise<HomeLayout | null> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('isActive', '==', true),
        limit(1)
      );
      
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return this.mapToHomeLayout(doc.id, doc.data());
      }
      
      return null;
    } catch (error) {
      console.error('Error getting active layout:', error);
      throw new Error('Erro ao buscar layout ativo');
    }
  }

  async setActiveLayout(layoutId: string | null): Promise<void> {
    try {
      console.log('🔥 [REPO] setActiveLayout chamado com layoutId:', layoutId);
      
      // First, deactivate all layouts
      const allLayouts = await this.getAllLayouts();
      console.log('🔥 [REPO] Layouts encontrados:', allLayouts.length);
      
      const batch: Promise<void>[] = allLayouts.map(async (layout) => {
        if (layout.isActive) {
          console.log('🔥 [REPO] Desativando layout:', layout.id, layout.name);
          await updateDoc(doc(db, this.collectionName, layout.id), {
            isActive: false,
            updatedAt: Timestamp.now()
          });
        }
      });
      
      await Promise.all(batch);
      console.log('🔥 [REPO] Todos os layouts desativados');
      
      // If layoutId is provided, activate the selected layout
      if (layoutId) {
        console.log('🔥 [REPO] Ativando layout:', layoutId);
        await updateDoc(doc(db, this.collectionName, layoutId), {
          isActive: true,
          updatedAt: Timestamp.now()
        });
      } else {
        console.log('🔥 [REPO] Nenhum layout para ativar (layoutId = null)');
      }
      
      console.log('🔥 [REPO] setActiveLayout concluído');
      
    } catch (error) {
      console.error('❌ [REPO] Error setting active layout:', error);
      throw new Error('Erro ao ativar layout');
    }
  }

  async duplicateLayout(layoutId: string, newName: string, createdBy: string): Promise<HomeLayout> {
    try {
      const originalLayout = await this.getLayoutById(layoutId);
      if (!originalLayout) {
        throw new Error('Layout original não encontrado');
      }

      const duplicatedLayout: Omit<HomeLayout, 'id' | 'createdAt' | 'updatedAt'> = {
        ...originalLayout,
        name: newName,
        isActive: false,
        isDefault: false,
        createdBy,
        version: 1,
        components: originalLayout.components.map(comp => ({
          ...comp,
          id: this.generateComponentId()
        }))
      };

      return await this.createLayout(duplicatedLayout);
    } catch (error) {
      console.error('Error duplicating layout:', error);
      throw new Error('Erro ao duplicar layout');
    }
  }

  async getLayoutsByUser(userId: string): Promise<HomeLayout[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('createdBy', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToHomeLayout(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error getting layouts by user:', error);
      throw new Error('Erro ao buscar layouts do usuário');
    }
  }

  // Helper to safely convert Firestore timestamp to Date
  private toDate(value: any): Date {
    if (!value) return new Date();

    // If it's already a Date
    if (value instanceof Date) return value;

    // If it's a Firestore Timestamp with toDate method
    if (value && typeof value.toDate === 'function') {
      return value.toDate();
    }

    // If it's a timestamp object with seconds
    if (value && typeof value.seconds === 'number') {
      return new Date(value.seconds * 1000);
    }

    // If it's a string or number, try to parse it
    if (typeof value === 'string' || typeof value === 'number') {
      const date = new Date(value);
      if (!isNaN(date.getTime())) return date;
    }

    // Fallback to current date
    return new Date();
  }

  private mapToHomeLayout(id: string, data: any): HomeLayout {
    return {
      id,
      name: data.name || '',
      description: data.description || '',
      components: (data.components || []).map((comp: any) => ({
        id: comp.id || '',
        type: comp.type,
        order: comp.order || 0,
        enabled: comp.enabled !== false,
        settings: comp.settings || {},
        responsive: comp.responsive || {}
      })),
      globalSettings: data.globalSettings || {},
      isActive: data.isActive || false,
      isDefault: data.isDefault || false,
      createdBy: data.createdBy || '',
      createdAt: this.toDate(data.createdAt),
      updatedAt: this.toDate(data.updatedAt),
      version: data.version || 1
    };
  }

  private generateComponentId(): string {
    return `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}