// Application Service - Leadership Management
import { db } from '@/config/firebase';
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where
} from 'firebase/firestore';
import { Leader, LeaderStatus } from '../../domain/entities/Leader';

const COLLECTION_NAME = 'leaders';

export class LeadershipService {
  private getCollection() {
    return collection(db, COLLECTION_NAME);
  }

  async getAllLeaders(): Promise<Leader[]> {
    const q = query(
      this.getCollection(),
      orderBy('ordem', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCadastro: doc.data().dataCadastro?.toDate() || new Date(),
      dataAtualizacao: doc.data().dataAtualizacao?.toDate() || new Date()
    })) as Leader[];
  }

  async getActiveLeaders(): Promise<Leader[]> {
    const q = query(
      this.getCollection(),
      where('status', '==', LeaderStatus.Ativo),
      orderBy('ordem', 'asc')
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      dataCadastro: doc.data().dataCadastro?.toDate() || new Date(),
      dataAtualizacao: doc.data().dataAtualizacao?.toDate() || new Date()
    })) as Leader[];
  }

  async getLeaderById(id: string): Promise<Leader | null> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;

    return {
      id: docSnap.id,
      ...docSnap.data(),
      dataCadastro: docSnap.data().dataCadastro?.toDate() || new Date(),
      dataAtualizacao: docSnap.data().dataAtualizacao?.toDate() || new Date()
    } as Leader;
  }

  async createLeader(data: Omit<Leader, 'id' | 'dataCadastro' | 'dataAtualizacao'>): Promise<Leader> {
    const now = new Date();
    const docRef = await addDoc(this.getCollection(), {
      ...data,
      dataCadastro: now,
      dataAtualizacao: now
    });

    return {
      id: docRef.id,
      ...data,
      dataCadastro: now,
      dataAtualizacao: now
    };
  }

  async updateLeader(id: string, data: Partial<Leader>): Promise<Leader> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const updateData = {
      ...data,
      dataAtualizacao: new Date()
    };
    delete (updateData as any).id;
    delete (updateData as any).dataCadastro;

    await updateDoc(docRef, updateData);

    const updated = await this.getLeaderById(id);
    if (!updated) throw new Error('Leader not found after update');
    return updated;
  }

  async deleteLeader(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }

  async reorderLeaders(orderedIds: string[]): Promise<void> {
    const updates = orderedIds.map((id, index) =>
      updateDoc(doc(db, COLLECTION_NAME, id), { ordem: index })
    );
    await Promise.all(updates);
  }
}
