// Data Repository Implementation - Firebase Profissional Assistência Repository
// Firebase implementation for professional assistance data operations

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
  Timestamp,
  startAt,
  endAt
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import {
  IProfissionalAssistenciaRepository,
  ProfissionalFilters
} from '@modules/assistance/assistencia/domain/repositories/IAssistenciaRepository';
import {
  ProfissionalAssistencia,
  TipoAssistencia,
  StatusProfissional
} from '@modules/assistance/assistencia/domain/entities/Assistencia';

export class FirebaseProfissionalAssistenciaRepository implements IProfissionalAssistenciaRepository {
  private readonly profissionaisCollection = 'profissionaisAssistencia';

  async findById(id: string): Promise<ProfissionalAssistencia | null> {
    try {
      const docRef = doc(db, this.profissionaisCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToProfissional(id, docSnap.data());
    } catch (error) {
      console.error('Error finding profissional by id:', error);
      throw new Error('Erro ao buscar profissional');
    }
  }

  async findAll(): Promise<ProfissionalAssistencia[]> {
    try {
      const q = query(
        collection(db, this.profissionaisCollection),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProfissional(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all profissionais:', error);
      throw new Error('Erro ao buscar profissionais');
    }
  }

  async create(profissional: Omit<ProfissionalAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfissionalAssistencia> {
    try {
      const profissionalData = this.mapProfissionalToFirestore(profissional);
      profissionalData.createdAt = Timestamp.now();
      profissionalData.updatedAt = Timestamp.now();

      const docRef = await addDoc(collection(db, this.profissionaisCollection), profissionalData);
      
      return {
        id: docRef.id,
        ...profissional,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error: any) {
      console.error('Error creating profissional:', error);
      
      // Handle specific Firebase errors
      if (error.code === 'permission-denied') {
        throw new Error('Erro de permissão: Usuário não tem autorização para criar profissionais');
      } else if (error.code === 'unauthenticated') {
        throw new Error('Erro de autenticação: Usuário não está logado');
      } else if (error.code === 'invalid-argument') {
        throw new Error('Erro de dados: Verifique se todos os campos obrigatórios estão preenchidos corretamente');
      }
      
      throw new Error(`Erro ao criar profissional: ${error.message || 'Erro desconhecido'}`);
    }
  }

  async update(id: string, data: Partial<ProfissionalAssistencia>): Promise<ProfissionalAssistencia> {
    try {
      const updateData = this.mapProfissionalToFirestore(data);
      updateData.updatedAt = Timestamp.now();

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.profissionaisCollection, id), updateData);

      const updatedProfissional = await this.findById(id);
      if (!updatedProfissional) {
        throw new Error('Profissional não encontrado após atualização');
      }

      return updatedProfissional;
    } catch (error) {
      console.error('Error updating profissional:', error);
      throw new Error('Erro ao atualizar profissional');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.profissionaisCollection, id), {
        status: StatusProfissional.Inativo,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting profissional:', error);
      throw new Error('Erro ao inativar profissional');
    }
  }

  async deletePhysically(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.profissionaisCollection, id));
    } catch (error) {
      console.error('Error physically deleting profissional:', error);
      throw new Error('Erro ao excluir profissional permanentemente');
    }
  }

  async findByTipo(tipo: TipoAssistencia): Promise<ProfissionalAssistencia[]> {
    try {
      const q = query(
        collection(db, this.profissionaisCollection),
        where('especialidade', '==', tipo),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProfissional(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding profissionais by tipo:', error);
      throw new Error('Erro ao buscar profissionais por tipo');
    }
  }

  async findByStatus(status: StatusProfissional): Promise<ProfissionalAssistencia[]> {
    try {
      const q = query(
        collection(db, this.profissionaisCollection),
        where('status', '==', status),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToProfissional(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding profissionais by status:', error);
      throw new Error('Erro ao buscar profissionais por status');
    }
  }

  async findByRegistroProfissional(registro: string): Promise<ProfissionalAssistencia | null> {
    try {
      const q = query(
        collection(db, this.profissionaisCollection),
        where('registroProfissional', '==', registro),
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.mapToProfissional(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding profissional by registro:', error);
      throw new Error('Erro ao buscar profissional por registro');
    }
  }

  async findByCPF(cpf: string): Promise<ProfissionalAssistencia | null> {
    try {
      const q = query(
        collection(db, this.profissionaisCollection),
        where('cpf', '==', cpf),
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.mapToProfissional(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding profissional by CPF:', error);
      throw new Error('Erro ao buscar profissional por CPF');
    }
  }

  async findByEmail(email: string): Promise<ProfissionalAssistencia | null> {
    try {
      const q = query(
        collection(db, this.profissionaisCollection),
        where('email', '==', email),
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.mapToProfissional(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding profissional by email:', error);
      throw new Error('Erro ao buscar profissional por email');
    }
  }

  async searchProfissionais(query: string): Promise<ProfissionalAssistencia[]> {
    try {
      const allProfissionais = await this.findAll();
      const searchTerm = query.toLowerCase();
      
      return allProfissionais.filter(profissional => 
        profissional.nome.toLowerCase().includes(searchTerm) ||
        (profissional.cpf && profissional.cpf.includes(searchTerm)) ||
        (profissional.email && profissional.email.toLowerCase().includes(searchTerm)) ||
        profissional.telefone.includes(searchTerm) ||
        profissional.registroProfissional.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching profissionais:', error);
      throw new Error('Erro ao pesquisar profissionais');
    }
  }

  async findDisponiveis(tipo: TipoAssistencia, data: Date): Promise<ProfissionalAssistencia[]> {
    try {
      const profissionaisTipo = await this.findByTipo(tipo);
      const profissionaisAtivos = profissionaisTipo.filter(p => p.status === StatusProfissional.Ativo);
      
      const diaSemana = data.getDay();
      return profissionaisAtivos.filter(profissional => 
        profissional.horariosFuncionamento.some(horario => horario.diaSemana === diaSemana)
      );
    } catch (error) {
      console.error('Error finding profissionais disponíveis:', error);
      throw new Error('Erro ao buscar profissionais disponíveis');
    }
  }

  async updateStatus(id: string, status: StatusProfissional, motivo?: string): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: Timestamp.now()
      };

      if (status === StatusProfissional.Inativo && motivo) {
        updateData.dataInativacao = Timestamp.now();
        updateData.motivoInativacao = motivo;
      }

      await updateDoc(doc(db, this.profissionaisCollection, id), updateData);
    } catch (error) {
      console.error('Error updating profissional status:', error);
      throw new Error('Erro ao atualizar status do profissional');
    }
  }

  async activateProfissional(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.profissionaisCollection, id), {
        status: StatusProfissional.Ativo,
        dataInativacao: null,
        motivoInativacao: null,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error activating profissional:', error);
      throw new Error('Erro ao ativar profissional');
    }
  }

  async deactivateProfissional(id: string, motivo?: string): Promise<void> {
    await this.updateStatus(id, StatusProfissional.Inativo, motivo);
  }

  async getStatistics(): Promise<{
    totalProfissionais: number;
    totalAtivos: number;
    totalInativos: number;
    porTipo: Record<TipoAssistencia, number>;
    porStatus: Record<StatusProfissional, number>;
  }> {
    try {
      const allProfissionais = await this.findAll();
      
      const totalProfissionais = allProfissionais.length;
      const totalAtivos = allProfissionais.filter(p => p.status === StatusProfissional.Ativo).length;
      const totalInativos = allProfissionais.filter(p => p.status === StatusProfissional.Inativo).length;

      // Distribuição por tipo
      const porTipo: Record<TipoAssistencia, number> = {} as Record<TipoAssistencia, number>;
      Object.values(TipoAssistencia).forEach(tipo => {
        porTipo[tipo] = allProfissionais.filter(p => p.especialidade === tipo).length;
      });

      // Distribuição por status
      const porStatus: Record<StatusProfissional, number> = {} as Record<StatusProfissional, number>;
      Object.values(StatusProfissional).forEach(status => {
        porStatus[status] = allProfissionais.filter(p => p.status === status).length;
      });

      return {
        totalProfissionais,
        totalAtivos,
        totalInativos,
        porTipo,
        porStatus
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new Error('Erro ao obter estatísticas');
    }
  }

  private mapToProfissional(id: string, data: any): ProfissionalAssistencia {
    return {
      id,
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg,
      telefone: data.telefone,
      email: data.email,
      endereco: data.endereco,
      especialidade: data.especialidade,
      subespecialidades: data.subespecialidades || [],
      registroProfissional: data.registroProfissional,
      status: data.status,
      dataCadastro: data.dataCadastro?.toDate() || new Date(),
      dataInativacao: data.dataInativacao?.toDate(),
      motivoInativacao: data.motivoInativacao,
      horariosFuncionamento: data.horariosFuncionamento || [],
      valorConsulta: data.valorConsulta,
      tempoConsulta: data.tempoConsulta,
      observacoes: data.observacoes,
      modalidadesAtendimento: data.modalidadesAtendimento || [],
      linkConsultaOnline: data.linkConsultaOnline,
      documentos: data.documentos || [],
      avaliacoes: data.avaliacoes || [],
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  private mapProfissionalToFirestore(profissional: any): any {
    const firestoreData: any = {};
    
    // Copy all defined values (skip undefined)
    Object.keys(profissional).forEach(key => {
      if (profissional[key] !== undefined) {
        firestoreData[key] = profissional[key];
      }
    });
    
    // Convert dates to timestamps
    if (profissional.dataCadastro) {
      firestoreData.dataCadastro = Timestamp.fromDate(profissional.dataCadastro);
    }
    if (profissional.dataInativacao) {
      firestoreData.dataInativacao = Timestamp.fromDate(profissional.dataInativacao);
    }

    // Clean up any remaining undefined values recursively
    this.cleanUndefinedValues(firestoreData);

    return firestoreData;
  }

  private cleanUndefinedValues(obj: any): void {
    Object.keys(obj).forEach(key => {
      if (obj[key] === undefined) {
        delete obj[key];
      } else if (obj[key] && typeof obj[key] === 'object' && !obj[key].toDate) {
        // Recursively clean nested objects (but not Timestamps)
        this.cleanUndefinedValues(obj[key]);
      }
    });
  }
}