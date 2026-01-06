// Data Repository Implementation - Firebase Event Repository
// Complete implementation for event data operations

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where,
  orderBy,
  limit as firestoreLimit,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { IEventRepository } from '../../domain/repositories/IEventRepository';
import { Event, EventCategory, EventConfirmation, EventStatus, ConfirmationStatus } from '../../domain/entities/Event';

export class FirebaseEventRepository implements IEventRepository {
  private readonly eventsCollection = 'events';

  // Helper method to remove undefined fields
  private removeUndefinedFields(obj: any): any {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
  private readonly categoriesCollection = 'eventCategories';
  private readonly confirmationsCollection = 'eventConfirmations';

  async findById(id: string): Promise<Event | null> {
    try {
      const docRef = doc(db, this.eventsCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToEvent(id, docSnap.data());
    } catch (error) {
      console.error('Error finding event by id:', error);
      throw new Error('Erro ao buscar evento');
    }
  }

  async findAll(): Promise<Event[]> {
    try {
      const q = query(
        collection(db, this.eventsCollection),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all events:', error);
      throw new Error('Erro ao buscar eventos');
    }
  }

  async findByStatus(status: EventStatus): Promise<Event[]> {
    try {
      const q = query(
        collection(db, this.eventsCollection),
        where('status', '==', status),
        orderBy('date', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding events by status:', error);
      throw new Error('Erro ao buscar eventos por status');
    }
  }

  async findByCategory(categoryId: string): Promise<Event[]> {
    try {
      const q = query(
        collection(db, this.eventsCollection),
        where('category.id', '==', categoryId)
      );
      const querySnapshot = await getDocs(q);
      
      const events = querySnapshot.docs.map(doc => 
        this.mapToEvent(doc.id, doc.data())
      );
      
      // Sort by date in code instead of database
      return events.sort((a, b) => b.date.getTime() - a.date.getTime());
    } catch (error) {
      console.error('Error finding events by category:', error);
      throw new Error('Erro ao buscar eventos por categoria');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    try {
      const q = query(
        collection(db, this.eventsCollection),
        where('date', '>=', Timestamp.fromDate(startDate)),
        where('date', '<=', Timestamp.fromDate(endDate)),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding events by date range:', error);
      throw new Error('Erro ao buscar eventos por período');
    }
  }

  async findUpcoming(limit?: number): Promise<Event[]> {
    try {
      const now = new Date();
      
      // Simplified query - get all events and filter in code
      let q = query(
        collection(db, this.eventsCollection),
        where('date', '>=', Timestamp.fromDate(now)),
        orderBy('date', 'asc')
      );

      if (limit) {
        q = query(q, firestoreLimit(limit * 2)); // Get more to account for filtering
      }

      const querySnapshot = await getDocs(q);
      
      const events = querySnapshot.docs
        .map(doc => this.mapToEvent(doc.id, doc.data()))
        .filter(event => event.status === EventStatus.Scheduled);
      
      return limit ? events.slice(0, limit) : events;
    } catch (error) {
      console.error('Error finding upcoming events:', error);
      throw new Error('Erro ao buscar próximos eventos');
    }
  }

  async findPast(limit?: number): Promise<Event[]> {
    try {
      const now = new Date();
      let q = query(
        collection(db, this.eventsCollection),
        where('date', '<', Timestamp.fromDate(now)),
        orderBy('date', 'desc')
      );

      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding past events:', error);
      throw new Error('Erro ao buscar eventos passados');
    }
  }

  async findPublicEvents(): Promise<Event[]> {
    try {
      const q = query(
        collection(db, this.eventsCollection),
        where('isPublic', '==', true),
        where('status', '==', EventStatus.Scheduled),
        orderBy('date', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToEvent(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding public events:', error);
      throw new Error('Erro ao buscar eventos públicos');
    }
  }

  async create(event: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>): Promise<Event> {
    try {
      // Remove undefined fields to avoid Firebase error
      const cleanedEvent = this.removeUndefinedFields(event);
      
      const eventData = {
        ...cleanedEvent,
        date: Timestamp.fromDate(event.date),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.eventsCollection), eventData);
      
      return {
        id: docRef.id,
        ...event,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating event:', error);
      throw new Error('Erro ao criar evento');
    }
  }

  async update(id: string, data: Partial<Event>): Promise<Event> {
    try {
      // Remove undefined fields to avoid Firebase error
      const cleanedData = this.removeUndefinedFields(data);
      
      const updateData: any = {
        ...cleanedData,
        updatedAt: Timestamp.now()
      };

      if (data.date) {
        updateData.date = Timestamp.fromDate(data.date);
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.eventsCollection, id), updateData);

      const updatedEvent = await this.findById(id);
      if (!updatedEvent) {
        throw new Error('Evento não encontrado após atualização');
      }

      return updatedEvent;
    } catch (error) {
      console.error('Error updating event:', error);
      throw new Error('Erro ao atualizar evento');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.eventsCollection, id));
    } catch (error) {
      console.error('Error deleting event:', error);
      throw new Error('Erro ao deletar evento');
    }
  }

  async updateStatus(eventId: string, status: EventStatus): Promise<void> {
    try {
      await updateDoc(doc(db, this.eventsCollection, eventId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating event status:', error);
      throw new Error('Erro ao atualizar status do evento');
    }
  }

  async cancelEvent(eventId: string, reason: string, cancelledBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.eventsCollection, eventId), {
        status: EventStatus.Cancelled,
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error cancelling event:', error);
      throw new Error('Erro ao cancelar evento');
    }
  }

  async findAllCategories(): Promise<EventCategory[]> {
    try {
      const querySnapshot = await getDocs(collection(db, this.categoriesCollection));
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as EventCategory));
    } catch (error) {
      console.error('Error finding categories:', error);
      // Return default categories if collection doesn't exist
      return this.getDefaultCategories();
    }
  }

  async createCategory(category: Omit<EventCategory, 'id'>): Promise<EventCategory> {
    try {
      const docRef = await addDoc(collection(db, this.categoriesCollection), category);
      
      return {
        id: docRef.id,
        ...category
      };
    } catch (error) {
      console.error('Error creating category:', error);
      throw new Error('Erro ao criar categoria');
    }
  }

  async updateCategory(id: string, data: Partial<EventCategory>): Promise<EventCategory> {
    try {
      await updateDoc(doc(db, this.categoriesCollection, id), data);
      
      const docSnap = await getDoc(doc(db, this.categoriesCollection, id));
      if (!docSnap.exists()) {
        throw new Error('Categoria não encontrada');
      }

      return {
        id: docSnap.id,
        ...docSnap.data()
      } as EventCategory;
    } catch (error) {
      console.error('Error updating category:', error);
      throw new Error('Erro ao atualizar categoria');
    }
  }

  async deleteCategory(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.categoriesCollection, id));
    } catch (error) {
      console.error('Error deleting category:', error);
      throw new Error('Erro ao deletar categoria');
    }
  }

  async findConfirmations(eventId: string): Promise<EventConfirmation[]> {
    try {
      const q = query(
        collection(db, this.confirmationsCollection),
        where('eventId', '==', eventId),
        orderBy('confirmedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        confirmedAt: doc.data().confirmedAt?.toDate()
      } as EventConfirmation));
    } catch (error) {
      console.error('Error finding confirmations:', error);
      throw new Error('Erro ao buscar confirmações');
    }
  }

  async findUserConfirmations(userId: string): Promise<EventConfirmation[]> {
    try {
      const q = query(
        collection(db, this.confirmationsCollection),
        where('userId', '==', userId),
        orderBy('confirmedAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        confirmedAt: doc.data().confirmedAt?.toDate()
      } as EventConfirmation));
    } catch (error) {
      console.error('Error finding user confirmations:', error);
      throw new Error('Erro ao buscar confirmações do usuário');
    }
  }

  async confirmAttendance(confirmation: Omit<EventConfirmation, 'id' | 'confirmedAt'>): Promise<EventConfirmation> {
    try {
      // Check if user already confirmed
      const existing = await this.findUserConfirmationForEvent(confirmation.userId, confirmation.eventId);
      
      if (existing) {
        // Update existing confirmation
        await updateDoc(doc(db, this.confirmationsCollection, existing.id), {
          status: confirmation.status,
          notes: confirmation.notes,
          confirmedAt: Timestamp.now()
        });
        
        return {
          ...existing,
          ...confirmation,
          confirmedAt: new Date()
        };
      } else {
        // Create new confirmation
        const confirmationData = {
          ...confirmation,
          confirmedAt: Timestamp.now()
        };

        const docRef = await addDoc(collection(db, this.confirmationsCollection), confirmationData);
        
        return {
          id: docRef.id,
          ...confirmation,
          confirmedAt: new Date()
        };
      }
    } catch (error) {
      console.error('Error confirming attendance:', error);
      throw new Error('Erro ao confirmar presença');
    }
  }

  async updateConfirmation(id: string, status: EventConfirmation['status']): Promise<void> {
    try {
      await updateDoc(doc(db, this.confirmationsCollection, id), {
        status,
        confirmedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating confirmation:', error);
      throw new Error('Erro ao atualizar confirmação');
    }
  }

  async deleteConfirmation(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.confirmationsCollection, id));
    } catch (error) {
      console.error('Error deleting confirmation:', error);
      throw new Error('Erro ao deletar confirmação');
    }
  }

  async countConfirmations(eventId: string): Promise<number> {
    try {
      const q = query(
        collection(db, this.confirmationsCollection),
        where('eventId', '==', eventId),
        where('status', '==', ConfirmationStatus.Confirmed)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.size;
    } catch (error) {
      console.error('Error counting confirmations:', error);
      throw new Error('Erro ao contar confirmações');
    }
  }

  async createAnonymousRegistration(registration: {
    eventId: string;
    name: string;
    email: string;
    phone: string;
    notes?: string;
  }): Promise<EventConfirmation> {
    try {
      // Check if email is already registered for this event
      const q = query(
        collection(db, this.confirmationsCollection),
        where('eventId', '==', registration.eventId),
        where('userEmail', '==', registration.email.toLowerCase())
      );
      const existingSnapshot = await getDocs(q);
      
      if (!existingSnapshot.empty) {
        throw new Error('Este email já está inscrito neste evento.');
      }

      const confirmationData = {
        eventId: registration.eventId,
        userId: `anonymous_${Date.now()}`,
        userName: registration.name,
        userEmail: registration.email.toLowerCase(),
        userPhone: registration.phone,
        status: ConfirmationStatus.Confirmed,
        notes: registration.notes || '',
        isAnonymous: true,
        confirmedAt: Timestamp.now()
      };

      console.log('Attempting to create anonymous registration:', confirmationData);

      const docRef = await addDoc(collection(db, this.confirmationsCollection), confirmationData);
      
      return {
        id: docRef.id,
        eventId: registration.eventId,
        userId: confirmationData.userId,
        userName: registration.name,
        userEmail: registration.email,
        userPhone: registration.phone,
        status: ConfirmationStatus.Confirmed,
        notes: registration.notes || '',
        isAnonymous: true,
        confirmedAt: new Date()
      } as EventConfirmation;
    } catch (error) {
      console.error('Error creating anonymous registration:', error);
      if (error instanceof Error && error.message.includes('já está inscrito')) {
        throw error;
      }
      throw new Error('Erro ao realizar inscrição');
    }
  }

  private async findUserConfirmationForEvent(userId: string, eventId: string): Promise<EventConfirmation | null> {
    try {
      const q = query(
        collection(db, this.confirmationsCollection),
        where('userId', '==', userId),
        where('eventId', '==', eventId)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        confirmedAt: doc.data().confirmedAt?.toDate()
      } as EventConfirmation;
    } catch (error) {
      return null;
    }
  }

  private mapToEvent(id: string, data: any): Event {
    return {
      id,
      title: data.title,
      description: data.description,
      date: data.date?.toDate() || new Date(),
      time: data.time,
      location: data.location,
      category: data.category,
      isPublic: data.isPublic || false,
      requiresConfirmation: data.requiresConfirmation || false,
      allowAnonymousRegistration: data.allowAnonymousRegistration || false,
      maxParticipants: data.maxParticipants,
      imageURL: data.imageURL,
      streamingURL: data.streamingURL,
      responsible: data.responsible,
      status: data.status as EventStatus,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  private getDefaultCategories(): EventCategory[] {
    return [
      { id: '1', name: 'Culto', color: '#3B82F6', priority: 1 },
      { id: '2', name: 'Estudo Bíblico', color: '#10B981', priority: 2 },
      { id: '3', name: 'Reunião', color: '#8B5CF6', priority: 3 },
      { id: '4', name: 'Evento Social', color: '#F59E0B', priority: 4 },
      { id: '5', name: 'Conferência', color: '#EF4444', priority: 5 },
      { id: '6', name: 'Retiro', color: '#06B6D4', priority: 6 }
    ];
  }
}