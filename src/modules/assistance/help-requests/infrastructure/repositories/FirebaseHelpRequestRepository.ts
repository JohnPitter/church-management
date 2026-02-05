// Data Repository - Firebase HelpRequest Repository
// Manages help requests between professionals

import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  DocumentSnapshot
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { HelpRequest, HelpRequestStatus } from '@modules/assistance/help-requests/domain/entities/HelpRequest';

export class FirebaseHelpRequestRepository {
  private collectionName = 'helpRequests';

  // Convert Firestore document to HelpRequest entity
  private mapDocToEntity(doc: DocumentSnapshot): HelpRequest | null {
    if (!doc.exists()) return null;

    const data = doc.data();
    return {
      id: doc.id,
      requesterId: data.requesterId,
      requesterName: data.requesterName,
      requesterSpecialty: data.requesterSpecialty,
      helperId: data.helperId,
      helperName: data.helperName,
      helperSpecialty: data.helperSpecialty,
      assistidoId: data.assistidoId,
      assistidoNome: data.assistidoNome,
      fichaId: data.fichaId,
      agendamentoId: data.agendamentoId,
      motivo: data.motivo,
      descricao: data.descricao,
      prioridade: data.prioridade,
      status: data.status,
      resposta: data.resposta,
      dataResposta: data.dataResposta?.toDate(),
      observacoes: data.observacoes,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy,
      isRead: data.isRead || false,
      readAt: data.readAt?.toDate()
    };
  }

  // Create a new help request
  async create(helpRequest: Omit<HelpRequest, 'id' | 'createdAt' | 'updatedAt'>): Promise<HelpRequest> {
    try {
      const now = Timestamp.now();
      const docRef = await addDoc(collection(db, this.collectionName), {
        ...helpRequest,
        createdAt: now,
        updatedAt: now,
        isRead: false,
        dataResposta: helpRequest.dataResposta ? Timestamp.fromDate(helpRequest.dataResposta) : null,
        readAt: helpRequest.readAt ? Timestamp.fromDate(helpRequest.readAt) : null
      });

      const newDoc = await getDoc(docRef);
      const created = this.mapDocToEntity(newDoc);

      if (!created) {
        throw new Error('Failed to create help request');
      }

      return created;
    } catch (error) {
      console.error('Error creating help request:', error);
      throw error;
    }
  }

  // Get help request by ID
  async findById(id: string): Promise<HelpRequest | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      return this.mapDocToEntity(docSnap);
    } catch (error) {
      console.error('Error finding help request:', error);
      throw error;
    }
  }

  // Get all help requests for a specific helper (professional receiving requests)
  async findByHelper(helperId: string): Promise<HelpRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('helperId', '==', helperId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.mapDocToEntity(doc))
        .filter((req): req is HelpRequest => req !== null);
    } catch (error) {
      console.error('Error finding help requests by helper:', error);
      throw error;
    }
  }

  // Get all help requests made by a specific requester
  async findByRequester(requesterId: string): Promise<HelpRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('requesterId', '==', requesterId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.mapDocToEntity(doc))
        .filter((req): req is HelpRequest => req !== null);
    } catch (error) {
      console.error('Error finding help requests by requester:', error);
      throw error;
    }
  }

  // Get unread help requests for a helper
  async findUnreadByHelper(helperId: string): Promise<HelpRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('helperId', '==', helperId),
        where('isRead', '==', false),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.mapDocToEntity(doc))
        .filter((req): req is HelpRequest => req !== null);
    } catch (error) {
      console.error('Error finding unread help requests:', error);
      throw error;
    }
  }

  // Get pending help requests for a helper
  async findPendingByHelper(helperId: string): Promise<HelpRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('helperId', '==', helperId),
        where('status', '==', HelpRequestStatus.Pending),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.mapDocToEntity(doc))
        .filter((req): req is HelpRequest => req !== null);
    } catch (error) {
      console.error('Error finding pending help requests:', error);
      throw error;
    }
  }

  // Get help requests by ficha ID
  async findByFicha(fichaId: string): Promise<HelpRequest[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('fichaId', '==', fichaId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs
        .map(doc => this.mapDocToEntity(doc))
        .filter((req): req is HelpRequest => req !== null);
    } catch (error) {
      console.error('Error finding help requests by ficha:', error);
      throw error;
    }
  }

  // Update help request
  async update(id: string, updates: Partial<HelpRequest>): Promise<HelpRequest> {
    try {
      const docRef = doc(db, this.collectionName, id);

      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };

      // Convert Date fields to Timestamp
      if (updates.dataResposta) {
        updateData.dataResposta = Timestamp.fromDate(updates.dataResposta);
      }
      if (updates.readAt) {
        updateData.readAt = Timestamp.fromDate(updates.readAt);
      }

      // Remove id and createdAt from updates
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(docRef, updateData);

      const updated = await this.findById(id);
      if (!updated) {
        throw new Error('Help request not found after update');
      }

      return updated;
    } catch (error) {
      console.error('Error updating help request:', error);
      throw error;
    }
  }

  // Mark as read
  async markAsRead(id: string): Promise<HelpRequest> {
    return this.update(id, {
      isRead: true,
      readAt: new Date()
    });
  }

  // Accept help request
  async accept(id: string, resposta?: string): Promise<HelpRequest> {
    return this.update(id, {
      status: HelpRequestStatus.Accepted,
      resposta,
      dataResposta: new Date(),
      isRead: true
    });
  }

  // Decline help request
  async decline(id: string, resposta?: string): Promise<HelpRequest> {
    return this.update(id, {
      status: HelpRequestStatus.Declined,
      resposta,
      dataResposta: new Date(),
      isRead: true
    });
  }

  // Resolve help request
  async resolve(id: string, observacoes?: string): Promise<HelpRequest> {
    return this.update(id, {
      status: HelpRequestStatus.Resolved,
      observacoes
    });
  }

  // Cancel help request
  async cancel(id: string): Promise<HelpRequest> {
    return this.update(id, {
      status: HelpRequestStatus.Cancelled
    });
  }

  // Count unread help requests for a helper
  async countUnreadByHelper(helperId: string): Promise<number> {
    try {
      const requests = await this.findUnreadByHelper(helperId);
      return requests.length;
    } catch (error) {
      console.error('Error counting unread help requests:', error);
      return 0;
    }
  }

  // Count pending help requests for a helper
  async countPendingByHelper(helperId: string): Promise<number> {
    try {
      const requests = await this.findPendingByHelper(helperId);
      return requests.length;
    } catch (error) {
      console.error('Error counting pending help requests:', error);
      return 0;
    }
  }
}
