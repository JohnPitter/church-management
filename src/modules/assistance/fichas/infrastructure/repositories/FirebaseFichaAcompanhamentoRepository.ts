// Data Repository - Firebase implementation for Patient Records (Fichas de Acompanhamento)

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FichaAcompanhamento, SessaoAcompanhamento } from '@modules/assistance/fichas/domain/entities/FichaAcompanhamento';

export class FirebaseFichaAcompanhamentoRepository {
  private readonly collectionName = 'fichasAcompanhamento';

  async createFicha(ficha: Omit<FichaAcompanhamento, 'id'>): Promise<FichaAcompanhamento> {
    try {
      console.log('🔥 FirebaseRepository - Ficha recebida:', ficha);
      console.log('🔥 DadosEspecializados na ficha:', ficha.dadosEspecializados);
      
      // Filter out undefined values to prevent Firestore errors
      const cleanFicha = Object.fromEntries(
        Object.entries(ficha).filter(([key, value]) => value !== undefined)
      );

      console.log('🔥 Ficha após filtro de undefined:', cleanFicha);
      console.log('🔥 DadosEspecializados após filtro:', cleanFicha.dadosEspecializados);

      const fichaData = {
        ...cleanFicha,
        dataInicio: Timestamp.fromDate(ficha.dataInicio),
        createdAt: Timestamp.fromDate(ficha.createdAt),
        updatedAt: Timestamp.fromDate(ficha.updatedAt)
      };

      console.log('🔥 Dados finais que serão salvos no Firestore:', fichaData);

      const docRef = await addDoc(collection(db, this.collectionName), fichaData);
      
      return {
        ...ficha,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating ficha:', error);
      throw new Error('Failed to create patient record');
    }
  }

  async updateFicha(id: string, updates: Partial<FichaAcompanhamento>): Promise<FichaAcompanhamento> {
    try {
      const docRef = doc(db, this.collectionName, id);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.dataInicio) {
        updateData.dataInicio = Timestamp.fromDate(updates.dataInicio);
      }

      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Patient record not found after update');
      }

      const data = updatedDoc.data();
      const { id: _, ...cleanData } = data;
      return {
        id: updatedDoc.id, // Usar sempre o ID real do documento Firestore
        ...cleanData,
        dataInicio: data.dataInicio.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as FichaAcompanhamento;
    } catch (error) {
      console.error('Error updating ficha:', error);
      throw new Error('Failed to update patient record');
    }
  }

  async deleteFicha(id: string): Promise<void> {
    try {
      console.log('🔥 [REPO] Iniciando exclusão da ficha:', id);
      console.log('🔥 [REPO] Collection name:', this.collectionName);
      console.log('🔥 [REPO] Document path:', `${this.collectionName}/${id}`);
      
      const docRef = doc(db, this.collectionName, id);
      console.log('🔥 [REPO] Doc reference criada:', docRef);
      
      await deleteDoc(docRef);
      console.log('✅ [REPO] Delete doc executado com sucesso');
    } catch (error: any) {
      console.error('❌ [REPO] Error deleting ficha:', error);
      console.error('❌ [REPO] Error code:', error?.code);
      console.error('❌ [REPO] Error message:', error?.message);
      
      if (error?.code === 'permission-denied') {
        throw new Error('Permission denied: You do not have permission to delete this patient record');
      }
      
      throw new Error(`Failed to delete patient record: ${error?.message || 'Unknown error'}`);
    }
  }

  async getFichaById(id: string): Promise<FichaAcompanhamento | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      const { id: _, ...cleanData } = data;
      return {
        id: docSnap.id, // Usar sempre o ID real do documento Firestore
        ...cleanData,
        dataInicio: data.dataInicio.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as FichaAcompanhamento;
    } catch (error) {
      console.error('Error getting ficha:', error);
      return null;
    }
  }

  async getFichasByProfissional(profissionalId: string): Promise<FichaAcompanhamento[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('profissionalId', '==', profissionalId),
        orderBy('dataInicio', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const { id: _, ...cleanData } = data;
        return {
          id: doc.id, // Usar sempre o ID real do documento Firestore
          ...cleanData,
          dataInicio: data.dataInicio.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as FichaAcompanhamento;
      });
    } catch (error) {
      console.error('Error getting fichas by professional:', error);
      return [];
    }
  }

  async getAllFichas(): Promise<FichaAcompanhamento[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('dataInicio', 'desc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();

        // Remove o campo 'id' dos dados para evitar conflito com o ID do documento
        const { id: _, ...cleanData } = data;

        return {
          id: doc.id, // Usar sempre o ID real do documento Firestore
          ...cleanData,
          dataInicio: data.dataInicio.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as FichaAcompanhamento;
      });
    } catch (error) {
      console.error('Error getting all fichas:', error);
      return [];
    }
  }

  async getFichasByPaciente(pacienteId: string): Promise<FichaAcompanhamento[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('pacienteId', '==', pacienteId),
        orderBy('dataInicio', 'desc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        const { id: _, ...cleanData } = data;
        return {
          id: doc.id, // Usar sempre o ID real do documento Firestore
          ...cleanData,
          dataInicio: data.dataInicio.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as FichaAcompanhamento;
      });
    } catch (error) {
      console.error('Error getting fichas by patient:', error);
      return [];
    }
  }

  // Sessões de acompanhamento
  async createSessao(fichaId: string, sessao: Omit<SessaoAcompanhamento, 'id'>): Promise<SessaoAcompanhamento> {
    try {
      const sessaoData = {
        ...sessao,
        data: Timestamp.fromDate(sessao.data),
        createdAt: Timestamp.fromDate(sessao.createdAt),
        updatedAt: Timestamp.fromDate(sessao.updatedAt)
      };

      const docRef = await addDoc(
        collection(db, this.collectionName, fichaId, 'sessoes'),
        sessaoData
      );
      
      return {
        ...sessao,
        id: docRef.id
      };
    } catch (error) {
      console.error('Error creating sessao:', error);
      throw new Error('Failed to create session');
    }
  }

  async updateSessao(fichaId: string, sessaoId: string, updates: Partial<SessaoAcompanhamento>): Promise<SessaoAcompanhamento> {
    try {
      const docRef = doc(db, this.collectionName, fichaId, 'sessoes', sessaoId);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date())
      };

      if (updates.data) {
        updateData.data = Timestamp.fromDate(updates.data);
      }

      await updateDoc(docRef, updateData);
      
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Session not found after update');
      }

      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        data: data.data.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as SessaoAcompanhamento;
    } catch (error) {
      console.error('Error updating sessao:', error);
      throw new Error('Failed to update session');
    }
  }

  async deleteSessao(fichaId: string, sessaoId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, fichaId, 'sessoes', sessaoId));
    } catch (error) {
      console.error('Error deleting sessao:', error);
      throw new Error('Failed to delete session');
    }
  }

  async getSessoesByFicha(fichaId: string): Promise<SessaoAcompanhamento[]> {
    try {
      const q = query(
        collection(db, this.collectionName, fichaId, 'sessoes'),
        orderBy('numeroSessao', 'asc')
      );

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          data: data.data.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as SessaoAcompanhamento;
      });
    } catch (error: any) {
      console.error('Error getting sessoes:', error);
      return [];
    }
  }

  async getSessaoById(fichaId: string, sessaoId: string): Promise<SessaoAcompanhamento | null> {
    try {
      const docRef = doc(db, this.collectionName, fichaId, 'sessoes', sessaoId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        data: data.data.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as SessaoAcompanhamento;
    } catch (error) {
      console.error('Error getting sessao:', error);
      return null;
    }
  }
}