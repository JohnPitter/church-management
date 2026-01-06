// Infrastructure Service - Asset Service
// Handles all Firebase operations for church assets

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
  Timestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  AssetEntity
} from '@modules/church-management/assets/domain/entities/Asset';

export class AssetService {
  private collectionName = 'assets';

  // Convert Firestore data to Asset entity
  private toAsset(id: string, data: any): Asset {
    return {
      id,
      name: data.name,
      description: data.description,
      category: data.category,
      acquisitionDate: data.acquisitionDate?.toDate() || new Date(),
      acquisitionValue: data.acquisitionValue,
      currentValue: data.currentValue,
      condition: data.condition,
      status: data.status,
      location: data.location,
      serialNumber: data.serialNumber,
      brand: data.brand,
      model: data.model,
      images: data.images,
      invoiceNumber: data.invoiceNumber,
      warrantyExpiryDate: data.warrantyExpiryDate?.toDate(),
      insurancePolicyNumber: data.insurancePolicyNumber,
      insuranceExpiryDate: data.insuranceExpiryDate?.toDate(),
      maintenanceRecords: data.maintenanceRecords?.map((record: any) => ({
        ...record,
        date: record.date?.toDate() || new Date()
      })),
      lastMaintenanceDate: data.lastMaintenanceDate?.toDate(),
      nextMaintenanceDate: data.nextMaintenanceDate?.toDate(),
      responsiblePerson: data.responsiblePerson,
      notes: data.notes,
      tags: data.tags || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      updatedBy: data.updatedBy
    };
  }

  // Convert Asset entity to Firestore data
  private toFirestore(asset: Partial<Asset>): any {
    const data: any = {
      name: asset.name,
      description: asset.description,
      category: asset.category,
      acquisitionDate: asset.acquisitionDate ? Timestamp.fromDate(asset.acquisitionDate) : null,
      acquisitionValue: asset.acquisitionValue,
      currentValue: asset.currentValue,
      condition: asset.condition,
      status: asset.status,
      location: asset.location,
      serialNumber: asset.serialNumber,
      brand: asset.brand,
      model: asset.model,
      images: asset.images,
      invoiceNumber: asset.invoiceNumber,
      warrantyExpiryDate: asset.warrantyExpiryDate ? Timestamp.fromDate(asset.warrantyExpiryDate) : null,
      insurancePolicyNumber: asset.insurancePolicyNumber,
      insuranceExpiryDate: asset.insuranceExpiryDate ? Timestamp.fromDate(asset.insuranceExpiryDate) : null,
      maintenanceRecords: asset.maintenanceRecords?.map(record => ({
        ...record,
        date: Timestamp.fromDate(record.date)
      })),
      lastMaintenanceDate: asset.lastMaintenanceDate ? Timestamp.fromDate(asset.lastMaintenanceDate) : null,
      nextMaintenanceDate: asset.nextMaintenanceDate ? Timestamp.fromDate(asset.nextMaintenanceDate) : null,
      responsiblePerson: asset.responsiblePerson,
      notes: asset.notes,
      tags: asset.tags || [],
      updatedAt: Timestamp.now(),
      updatedBy: asset.updatedBy
    };

    // Remove undefined values
    Object.keys(data).forEach(key => {
      if (data[key] === undefined) {
        delete data[key];
      }
    });

    return data;
  }

  // Get all assets
  async getAllAssets(): Promise<Asset[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.toAsset(doc.id, doc.data()));
    } catch (error) {
      console.error('Error fetching assets:', error);
      throw new Error('Erro ao buscar patrimônios');
    }
  }

  // Get asset by ID
  async getAssetById(id: string): Promise<Asset | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      return this.toAsset(docSnap.id, docSnap.data());
    } catch (error) {
      console.error('Error fetching asset:', error);
      throw new Error('Erro ao buscar patrimônio');
    }
  }

  // Get assets by category
  async getAssetsByCategory(category: AssetCategory): Promise<Asset[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.toAsset(doc.id, doc.data()));
    } catch (error) {
      console.error('Error fetching assets by category:', error);
      throw new Error('Erro ao buscar patrimônios por categoria');
    }
  }

  // Get assets by status
  async getAssetsByStatus(status: AssetStatus): Promise<Asset[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => this.toAsset(doc.id, doc.data()));
    } catch (error) {
      console.error('Error fetching assets by status:', error);
      throw new Error('Erro ao buscar patrimônios por status');
    }
  }

  // Create new asset
  async createAsset(assetData: Partial<Asset>): Promise<string> {
    try {
      // Validate asset data
      const errors = AssetEntity.validateAsset(assetData);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const data = this.toFirestore({
        ...assetData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      data.createdAt = Timestamp.now();

      const docRef = await addDoc(collection(db, this.collectionName), data);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating asset:', error);
      throw new Error(error.message || 'Erro ao criar patrimônio');
    }
  }

  // Update asset
  async updateAsset(id: string, assetData: Partial<Asset>): Promise<void> {
    try {
      // Validate asset data
      const errors = AssetEntity.validateAsset(assetData);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      const docRef = doc(db, this.collectionName, id);
      const data = this.toFirestore(assetData);

      await updateDoc(docRef, data);
    } catch (error: any) {
      console.error('Error updating asset:', error);
      throw new Error(error.message || 'Erro ao atualizar patrimônio');
    }
  }

  // Delete asset
  async deleteAsset(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting asset:', error);
      throw new Error('Erro ao excluir patrimônio');
    }
  }

  // Update asset status
  async updateAssetStatus(id: string, status: AssetStatus, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.now(),
        updatedBy
      });
    } catch (error) {
      console.error('Error updating asset status:', error);
      throw new Error('Erro ao atualizar status do patrimônio');
    }
  }

  // Update asset condition
  async updateAssetCondition(id: string, condition: AssetCondition, updatedBy: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        condition,
        updatedAt: Timestamp.now(),
        updatedBy
      });
    } catch (error) {
      console.error('Error updating asset condition:', error);
      throw new Error('Erro ao atualizar condição do patrimônio');
    }
  }

  // Get statistics
  async getStatistics(): Promise<{
    totalAssets: number;
    totalValue: number;
    byCategory: Record<AssetCategory, number>;
    byStatus: Record<AssetStatus, number>;
    byCondition: Record<AssetCondition, number>;
  }> {
    try {
      const assets = await this.getAllAssets();

      const stats = {
        totalAssets: assets.length,
        totalValue: assets.reduce((sum, asset) => sum + (asset.currentValue || asset.acquisitionValue), 0),
        byCategory: {} as Record<AssetCategory, number>,
        byStatus: {} as Record<AssetStatus, number>,
        byCondition: {} as Record<AssetCondition, number>
      };

      // Initialize counters
      Object.values(AssetCategory).forEach(category => {
        stats.byCategory[category] = 0;
      });
      Object.values(AssetStatus).forEach(status => {
        stats.byStatus[status] = 0;
      });
      Object.values(AssetCondition).forEach(condition => {
        stats.byCondition[condition] = 0;
      });

      // Count assets
      assets.forEach(asset => {
        stats.byCategory[asset.category]++;
        stats.byStatus[asset.status]++;
        stats.byCondition[asset.condition]++;
      });

      return stats;
    } catch (error) {
      console.error('Error fetching asset statistics:', error);
      throw new Error('Erro ao buscar estatísticas de patrimônio');
    }
  }

  // Search assets
  async searchAssets(searchTerm: string): Promise<Asset[]> {
    try {
      const assets = await this.getAllAssets();
      const lowerSearch = searchTerm.toLowerCase();

      return assets.filter(asset =>
        asset.name.toLowerCase().includes(lowerSearch) ||
        asset.description.toLowerCase().includes(lowerSearch) ||
        asset.location.toLowerCase().includes(lowerSearch) ||
        asset.serialNumber?.toLowerCase().includes(lowerSearch) ||
        asset.brand?.toLowerCase().includes(lowerSearch) ||
        asset.model?.toLowerCase().includes(lowerSearch) ||
        asset.tags?.some(tag => tag.toLowerCase().includes(lowerSearch))
      );
    } catch (error) {
      console.error('Error searching assets:', error);
      throw new Error('Erro ao buscar patrimônios');
    }
  }
}
