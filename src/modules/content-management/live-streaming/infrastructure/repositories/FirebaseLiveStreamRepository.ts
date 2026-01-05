// Data Repository Implementation - Firebase Live Stream Repository
// Complete implementation for live stream data operations

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
import { db } from 'config/firebase';
import { ILiveStreamRepository } from '../../domain/repositories/ILiveStreamRepository';
import { LiveStream, StreamStatus, StreamCategory } from '../../domain/entities/LiveStream';

export class FirebaseLiveStreamRepository implements ILiveStreamRepository {
  private readonly collectionName = 'liveStreams';

  async findById(id: string): Promise<LiveStream | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToLiveStream(id, docSnap.data());
    } catch (error) {
      console.error('Error finding live stream by id:', error);
      throw new Error('Erro ao buscar transmissão');
    }
  }

  async findAll(): Promise<LiveStream[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all live streams:', error);
      throw new Error('Erro ao buscar transmissões');
    }
  }

  async findByStatus(status: StreamStatus): Promise<LiveStream[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', status),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding live streams by status:', error);
      throw new Error('Erro ao buscar transmissões por status');
    }
  }

  async findByCategory(category: StreamCategory): Promise<LiveStream[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('category', '==', category),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding live streams by category:', error);
      throw new Error('Erro ao buscar transmissões por categoria');
    }
  }

  async findLiveStreams(): Promise<LiveStream[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', StreamStatus.Live),
        where('isLive', '==', true),
        orderBy('scheduledDate', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding live streams:', error);
      throw new Error('Erro ao buscar transmissões ao vivo');
    }
  }

  async findScheduledStreams(): Promise<LiveStream[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('status', '==', StreamStatus.Scheduled),
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding scheduled streams:', error);
      throw new Error('Erro ao buscar transmissões agendadas');
    }
  }

  async findUpcomingStreams(limit?: number): Promise<LiveStream[]> {
    try {
      const now = new Date();
      let q = query(
        collection(db, this.collectionName),
        where('scheduledDate', '>=', Timestamp.fromDate(now)),
        where('status', '==', StreamStatus.Scheduled),
        orderBy('scheduledDate', 'asc')
      );

      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding upcoming streams:', error);
      throw new Error('Erro ao buscar próximas transmissões');
    }
  }

  async findPastStreams(limit?: number): Promise<LiveStream[]> {
    try {
      const now = new Date();
      let q = query(
        collection(db, this.collectionName),
        where('scheduledDate', '<', Timestamp.fromDate(now)),
        orderBy('scheduledDate', 'desc')
      );

      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding past streams:', error);
      throw new Error('Erro ao buscar transmissões passadas');
    }
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<LiveStream[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('scheduledDate', '>=', Timestamp.fromDate(startDate)),
        where('scheduledDate', '<=', Timestamp.fromDate(endDate)),
        orderBy('scheduledDate', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding streams by date range:', error);
      throw new Error('Erro ao buscar transmissões por período');
    }
  }

  async findMostViewed(limit?: number): Promise<LiveStream[]> {
    try {
      let q = query(
        collection(db, this.collectionName),
        orderBy('viewCount', 'desc')
      );

      if (limit) {
        q = query(q, firestoreLimit(limit));
      }

      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToLiveStream(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding most viewed streams:', error);
      throw new Error('Erro ao buscar transmissões mais vistas');
    }
  }

  async create(stream: Omit<LiveStream, 'id' | 'createdAt' | 'updatedAt'>): Promise<LiveStream> {
    try {
      const streamData: any = {
        ...stream,
        scheduledDate: Timestamp.fromDate(stream.scheduledDate),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Remove undefined fields - Firestore doesn't accept undefined values
      Object.keys(streamData).forEach(key => {
        if (streamData[key] === undefined) {
          delete streamData[key];
        }
      });

      const docRef = await addDoc(collection(db, this.collectionName), streamData);
      
      return {
        id: docRef.id,
        ...stream,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating live stream:', error);
      throw new Error('Erro ao criar transmissão');
    }
  }

  async update(id: string, data: Partial<LiveStream>): Promise<LiveStream> {
    try {
      const updateData: any = {
        ...data,
        updatedAt: Timestamp.now()
      };

      if (data.scheduledDate) {
        updateData.scheduledDate = Timestamp.fromDate(data.scheduledDate);
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      // Remove undefined fields - Firestore doesn't accept undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(doc(db, this.collectionName, id), updateData);

      const updatedStream = await this.findById(id);
      if (!updatedStream) {
        throw new Error('Transmissão não encontrada após atualização');
      }

      return updatedStream;
    } catch (error) {
      console.error('Error updating live stream:', error);
      throw new Error('Erro ao atualizar transmissão');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
    } catch (error) {
      console.error('Error deleting live stream:', error);
      throw new Error('Erro ao deletar transmissão');
    }
  }

  async updateStatus(streamId: string, status: StreamStatus): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, streamId), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating stream status:', error);
      throw new Error('Erro ao atualizar status da transmissão');
    }
  }

  async startStream(streamId: string, streamUrl: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, streamId), {
        status: StreamStatus.Live,
        isLive: true,
        streamUrl,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error starting stream:', error);
      throw new Error('Erro ao iniciar transmissão');
    }
  }

  async endStream(streamId: string, duration?: number): Promise<void> {
    try {
      const updateData: any = {
        status: StreamStatus.Ended,
        isLive: false,
        updatedAt: Timestamp.now()
      };

      if (duration) {
        updateData.duration = duration;
      }

      await updateDoc(doc(db, this.collectionName, streamId), updateData);
    } catch (error) {
      console.error('Error ending stream:', error);
      throw new Error('Erro ao finalizar transmissão');
    }
  }

  async cancelStream(streamId: string, reason: string, cancelledBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, streamId), {
        status: StreamStatus.Cancelled,
        isLive: false,
        cancellationReason: reason,
        cancelledBy,
        cancelledAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error cancelling stream:', error);
      throw new Error('Erro ao cancelar transmissão');
    }
  }

  async updateViewCount(streamId: string, viewCount: number): Promise<void> {
    try {
      await updateDoc(doc(db, this.collectionName, streamId), {
        viewCount,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating view count:', error);
      throw new Error('Erro ao atualizar contagem de visualizações');
    }
  }

  private mapToLiveStream(id: string, data: any): LiveStream {
    return {
      id,
      title: data.title,
      description: data.description,
      streamUrl: data.streamUrl,
      thumbnailUrl: data.thumbnailUrl,
      isLive: data.isLive || false,
      scheduledDate: data.scheduledDate?.toDate() || new Date(),
      duration: data.duration,
      viewCount: data.viewCount || 0,
      category: data.category as StreamCategory,
      status: data.status as StreamStatus,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }
}
