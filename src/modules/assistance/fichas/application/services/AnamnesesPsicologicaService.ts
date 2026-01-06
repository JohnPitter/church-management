import { collection, addDoc, updateDoc, doc, getDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { AnamnesesPsicologicaData } from '@/presentation/components/AnamnesesPsicologicaModal';

export class AnamnesesPsicologicaService {
  private collectionName = 'anamnesesPsicologicas';

  async createAnamnese(anamnese: AnamnesesPsicologicaData & { profissionalResponsavel?: string }): Promise<string> {
    try {
      const anamneseData = {
        ...anamnese,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      const docRef = await addDoc(collection(db, this.collectionName), anamneseData);
      console.log('✅ Anamnese psicológica criada com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erro ao criar anamnese psicológica:', error);
      throw new Error('Erro ao salvar anamnese psicológica');
    }
  }

  async updateAnamnese(id: string, anamnese: Partial<AnamnesesPsicologicaData> & { profissionalResponsavel?: string }): Promise<void> {
    try {
      const anamneseData = {
        ...anamnese,
        updatedAt: Timestamp.now()
      };

      await updateDoc(doc(db, this.collectionName, id), anamneseData);
      console.log('✅ Anamnese psicológica atualizada:', id);
    } catch (error) {
      console.error('Erro ao atualizar anamnese psicológica:', error);
      throw new Error('Erro ao atualizar anamnese psicológica');
    }
  }

  async getAnamneseById(id: string): Promise<AnamnesesPsicologicaData | null> {
    try {
      const docRef = doc(db, this.collectionName, id);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as AnamnesesPsicologicaData;
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar anamnese psicológica:', error);
      throw new Error('Erro ao buscar anamnese psicológica');
    }
  }

  async getAnamnesesByPaciente(assistidoId: string): Promise<AnamnesesPsicologicaData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        where('assistidoId', '==', assistidoId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AnamnesesPsicologicaData));
    } catch (error) {
      console.error('Erro ao buscar anamneses do paciente:', error);
      throw new Error('Erro ao buscar anamneses do paciente');
    }
  }

  async getAllAnamneses(): Promise<AnamnesesPsicologicaData[]> {
    try {
      const q = query(
        collection(db, this.collectionName),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as AnamnesesPsicologicaData));
    } catch (error) {
      console.error('Erro ao buscar todas as anamneses:', error);
      throw new Error('Erro ao buscar anamneses');
    }
  }
}