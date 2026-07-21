// Data Repository - Firebase Prayer Request Repository
// Repository for managing prayer requests in Firestore

import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { PrayerRequest, PrayerRequestStatus, CreatePrayerRequestData, PrayerRequestEntity } from '../../domain/entities/PrayerRequest';

export class FirebasePrayerRequestRepository {
  private collectionName = 'prayerRequests';

  async create(data: CreatePrayerRequestData): Promise<PrayerRequest> {
    try {
      const prayerRequestData = PrayerRequestEntity.create(data);
      
      // Remove undefined fields before saving to Firestore
      const dataToSave: any = {
        ...prayerRequestData,
        createdAt: Timestamp.fromDate(prayerRequestData.createdAt),
        updatedAt: Timestamp.fromDate(prayerRequestData.updatedAt)
      };

      // Remove undefined values
      Object.keys(dataToSave).forEach(key => {
        if (dataToSave[key] === undefined) {
          delete dataToSave[key];
        }
      });

      const docRef = await addDoc(collection(db, this.collectionName), dataToSave);

      return {
        id: docRef.id,
        ...prayerRequestData
      };
    } catch (error) {
      console.error('Error creating prayer request:', error);
      throw new Error('Erro ao criar pedido de oração');
    }
  }

  async getById(id: string): Promise<PrayerRequest | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          prayedBy: data.prayedBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PrayerRequest;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting prayer request:', error);
      throw new Error('Erro ao buscar pedido de oração');
    }
  }

  async getAll(limitCount = 50): Promise<PrayerRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const prayerRequests: PrayerRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        prayerRequests.push({
          id: doc.id,
          ...data,
          prayedBy: data.prayedBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PrayerRequest);
      });

      return prayerRequests;
    } catch (error) {
      console.error('Error getting prayer requests:', error);
      throw new Error('Erro ao buscar pedidos de oração');
    }
  }

  async getByStatus(status: PrayerRequestStatus, limitCount = 50): Promise<PrayerRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const prayerRequests: PrayerRequest[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        prayerRequests.push({
          id: doc.id,
          ...data,
          prayedBy: data.prayedBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PrayerRequest);
      });

      return prayerRequests;
    } catch (error) {
      console.error('Error getting prayer requests by status:', error);
      throw new Error('Erro ao buscar pedidos de oração');
    }
  }

  async updateStatus(id: string, status: PrayerRequestStatus): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error updating prayer request status:', error);
      throw new Error('Erro ao atualizar status do pedido de oração');
    }
  }

  async addPrayedBy(id: string, userEmail: string): Promise<void> {
    try {
      const prayerRequest = await this.getById(id);
      if (!prayerRequest) {
        throw new Error('Pedido de oração não encontrado');
      }

      const updatedPrayedBy = [...(prayerRequest.prayedBy || [])];
      if (!updatedPrayedBy.includes(userEmail)) {
        updatedPrayedBy.push(userEmail);
      }

      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        prayedBy: updatedPrayedBy,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error adding prayed by:', error);
      throw new Error('Erro ao registrar oração');
    }
  }

  async removePrayedBy(id: string, userEmail: string): Promise<void> {
    try {
      const prayerRequest = await this.getById(id);
      if (!prayerRequest) {
        throw new Error('Pedido de oração não encontrado');
      }

      const updatedPrayedBy = (prayerRequest.prayedBy || []).filter(
        (email) => email !== userEmail
      );

      const docRef = doc(db, this.collectionName, id);
      await updateDoc(docRef, {
        prayedBy: updatedPrayedBy,
        updatedAt: Timestamp.fromDate(new Date())
      });
    } catch (error) {
      console.error('Error removing prayed by:', error);
      throw new Error('Erro ao remover registro de oração');
    }
  }

  /**
   * Pedidos visíveis à comunidade nos últimos N dias (exclui rejeitados).
   */
  async getRecentForCommunity(days = 7, limitCount = 100): Promise<PrayerRequest[]> {
    try {
      const since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);

      // Busca recentes e filtra no cliente (evita índice composto status+createdAt se status variar)
      const q = query(
        collection(db, this.collectionName),
        where('createdAt', '>=', Timestamp.fromDate(since)),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const prayerRequests: PrayerRequest[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const status = data.status as PrayerRequestStatus;
        if (status === PrayerRequestStatus.Rejected) {
          return;
        }

        prayerRequests.push({
          id: docSnap.id,
          ...data,
          prayedBy: data.prayedBy || [],
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as PrayerRequest);
      });

      return prayerRequests;
    } catch (error: any) {
      console.error('Error getting community prayer requests:', error);

      // Fallback sem índice: getAll + filtro local
      if (error?.code === 'failed-precondition' || error?.message?.includes('index')) {
        const all = await this.getAll(limitCount);
        const since = new Date();
        since.setDate(since.getDate() - days);
        since.setHours(0, 0, 0, 0);

        return all.filter(
          (req) =>
            req.status !== PrayerRequestStatus.Rejected &&
            new Date(req.createdAt).getTime() >= since.getTime()
        );
      }

      throw new Error('Erro ao buscar pedidos de oração da comunidade');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      const docRef = doc(db, this.collectionName, id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting prayer request:', error);
      throw new Error('Erro ao excluir pedido de oração');
    }
  }
}
