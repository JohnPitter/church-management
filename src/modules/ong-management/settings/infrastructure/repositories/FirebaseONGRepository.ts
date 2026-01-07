// Firebase Repository for ONG Management

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  setDoc,
  query,
  where,
  orderBy,
  Timestamp
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';
import {
  ONGInfo,
  Voluntario,
  AtividadeONG,
  DoacaoONG,
  StatusVoluntario,
  StatusAtividade,
  StatusDoacao,
  TipoDoacao,
  PeriodoRelatorio,
  RelatorioVoluntarios,
  RelatorioAtividades,
  RelatorioFinanceiro,
  ONGEntity
} from '../../domain/entities/ONG';

export class FirebaseONGRepository {
  private readonly ongCollection = 'ongInfo';
  private readonly voluntariosCollection = 'voluntarios';
  private readonly atividadesCollection = 'atividadesONG';
  private readonly doacoesCollection = 'doacoesONG';

  // ONG Info Management
  async getONGInfo(): Promise<ONGInfo | null> {
    try {
      const docRef = doc(db, this.ongCollection, 'config');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data,
          dataCriacao: data.dataCriacao?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date()
        } as ONGInfo;
      }
      
      return null;
    } catch (error: any) {
      console.error('Error getting ONG info:', error);
      
      // Check if it's a permission error
      if (error?.code === 'permission-denied' || 
          error?.message?.includes('Missing or insufficient permissions')) {
        throw new Error('Acesso negado: Você precisa de permissões de administrador para acessar as configurações da ONG.');
      }
      
      throw new Error('Failed to get ONG information');
    }
  }

  async updateONGInfo(info: Partial<ONGInfo>): Promise<ONGInfo> {
    try {
      const docRef = doc(db, this.ongCollection, 'config');
      
      // Check if document exists
      const docSnap = await getDoc(docRef);
      
      const updateData: any = {
        ...info,
        updatedAt: Timestamp.now()
      };
      
      // Remove undefined fields
      Object.keys(updateData).forEach(key => 
        updateData[key] === undefined && delete updateData[key]
      );
      
      if (docSnap.exists()) {
        // Document exists, update it
        await updateDoc(docRef, updateData);
        
        // Log the action
        await loggingService.logONG('info', 'ONG Information Updated', 
          `Updated ONG information fields: ${Object.keys(updateData).filter(k => k !== 'updatedAt').join(', ')}`
        );
      } else {
        // Document doesn't exist, create it
        const createData = {
          ...updateData,
          dataCriacao: Timestamp.now()
        };
        
        await setDoc(docRef, createData);
        
        // Log the action
        await loggingService.logONG('info', 'ONG Information Created', 
          `Created new ONG information with fields: ${Object.keys(createData).filter(k => !['updatedAt', 'dataCriacao'].includes(k)).join(', ')}`
        );
      }
      
      const updated = await this.getONGInfo();
      if (!updated) throw new Error('Failed to retrieve updated ONG info');
      
      return updated;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Update ONG Information', 
        `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error updating ONG info:', error);
      throw new Error('Failed to update ONG information');
    }
  }

  async uploadONGLogo(file: File): Promise<string> {
    try {
      const fileName = `ong-logo-${Date.now()}.${file.name.split('.').pop()}`;
      const storageRef = ref(storage, `ong/${fileName}`);
      
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading ONG logo:', error);
      throw new Error('Failed to upload logo');
    }
  }

  // Volunteer Management
  async createVoluntario(voluntario: Omit<Voluntario, 'id' | 'createdAt' | 'updatedAt'>): Promise<Voluntario> {
    try {
      const voluntarioData = {
        ...voluntario,
        dataNascimento: Timestamp.fromDate(voluntario.dataNascimento),
        dataInicio: Timestamp.fromDate(voluntario.dataInicio),
        dataFim: voluntario.dataFim ? Timestamp.fromDate(voluntario.dataFim) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.voluntariosCollection), voluntarioData);
      
      // Log the action
      await loggingService.logONG('info', 'Volunteer Created', 
        `New volunteer registered: ${voluntario.nome} (${voluntario.email})`
      );
      
      return {
        ...voluntario,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Create Volunteer', 
        `Error creating volunteer ${voluntario.nome}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error creating voluntario:', error);
      throw new Error('Failed to create volunteer');
    }
  }

  async updateVoluntario(id: string, updates: Partial<Voluntario>): Promise<Voluntario> {
    try {
      const docRef = doc(db, this.voluntariosCollection, id);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      if (updates.dataNascimento) {
        updateData.dataNascimento = Timestamp.fromDate(updates.dataNascimento);
      }
      if (updates.dataInicio) {
        updateData.dataInicio = Timestamp.fromDate(updates.dataInicio);
      }
      if (updates.dataFim) {
        updateData.dataFim = Timestamp.fromDate(updates.dataFim);
      }
      
      await updateDoc(docRef, updateData);
      
      // Log the action
      await loggingService.logONG('info', 'Volunteer Updated', 
        `Updated volunteer ${updates.nome || id}: fields ${Object.keys(updates).join(', ')}`
      );
      
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Volunteer not found after update');
      }
      
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        dataNascimento: data.dataNascimento.toDate(),
        dataInicio: data.dataInicio.toDate(),
        dataFim: data.dataFim?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Voluntario;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Update Volunteer', 
        `Error updating volunteer ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error updating voluntario:', error);
      throw new Error('Failed to update volunteer');
    }
  }

  async deleteVoluntario(id: string): Promise<void> {
    try {
      // Get volunteer info before deleting for logging
      const volunteerDoc = await getDoc(doc(db, this.voluntariosCollection, id));
      const volunteerName = volunteerDoc.exists() ? volunteerDoc.data().nome : 'Unknown';
      
      await deleteDoc(doc(db, this.voluntariosCollection, id));
      
      // Log the action
      await loggingService.logONG('warning', 'Volunteer Deleted', 
        `Deleted volunteer: ${volunteerName} (ID: ${id})`
      );
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Delete Volunteer', 
        `Error deleting volunteer ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error deleting voluntario:', error);
      throw new Error('Failed to delete volunteer');
    }
  }

  async getVoluntarioById(id: string): Promise<Voluntario | null> {
    try {
      const docRef = doc(db, this.voluntariosCollection, id);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dataNascimento: data.dataNascimento?.toDate ? data.dataNascimento.toDate() : new Date(),
        dataInicio: data.dataInicio?.toDate ? data.dataInicio.toDate() : new Date(),
        dataFim: data.dataFim?.toDate ? data.dataFim.toDate() : undefined,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
      } as Voluntario;
    } catch (error) {
      console.error('Error getting voluntario:', error);
      throw new Error('Failed to get volunteer');
    }
  }

  async getAllVoluntarios(): Promise<Voluntario[]> {
    try {
      const q = query(
        collection(db, this.voluntariosCollection),
        orderBy('nome', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataNascimento: data.dataNascimento?.toDate ? data.dataNascimento.toDate() : new Date(),
          dataInicio: data.dataInicio?.toDate ? data.dataInicio.toDate() : new Date(),
          dataFim: data.dataFim?.toDate ? data.dataFim.toDate() : undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        } as Voluntario;
      });
    } catch (error: any) {
      // Silently return empty array for permission errors
      // This allows the calendar to work even if user doesn't have volunteer permissions
      if (error?.code === 'permission-denied' ||
          error?.message?.includes('Missing or insufficient permissions')) {
        console.warn('Volunteer data not accessible (permission denied). Returning empty list.');
        return [];
      }

      console.error('Error getting all voluntarios:', error);
      throw new Error('Failed to get volunteers');
    }
  }

  async getVoluntariosByStatus(status: StatusVoluntario): Promise<Voluntario[]> {
    try {
      const q = query(
        collection(db, this.voluntariosCollection),
        where('status', '==', status),
        orderBy('nome', 'asc')
      );

      const querySnapshot = await getDocs(q);

      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataNascimento: data.dataNascimento?.toDate ? data.dataNascimento.toDate() : new Date(),
          dataInicio: data.dataInicio?.toDate ? data.dataInicio.toDate() : new Date(),
          dataFim: data.dataFim?.toDate ? data.dataFim.toDate() : undefined,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        } as Voluntario;
      });
    } catch (error) {
      console.error('Error getting voluntarios by status:', error);
      throw new Error('Failed to get volunteers by status');
    }
  }

  // Activity Management
  async createAtividade(atividade: Omit<AtividadeONG, 'id' | 'createdAt' | 'updatedAt'>): Promise<AtividadeONG> {
    try {
      const atividadeData = {
        ...atividade,
        dataInicio: Timestamp.fromDate(atividade.dataInicio),
        dataFim: Timestamp.fromDate(atividade.dataFim),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.atividadesCollection), atividadeData);
      
      // Log the action
      await loggingService.logONG('info', 'Activity Created', 
        `New activity created: ${atividade.nome} (${atividade.tipo}) scheduled for ${atividade.dataInicio.toLocaleDateString('pt-BR')}`
      );
      
      return {
        ...atividade,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Create Activity', 
        `Error creating activity ${atividade.nome}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error creating atividade:', error);
      throw new Error('Failed to create activity');
    }
  }

  async updateAtividade(id: string, updates: Partial<AtividadeONG>): Promise<AtividadeONG> {
    try {
      const docRef = doc(db, this.atividadesCollection, id);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      if (updates.dataInicio) {
        updateData.dataInicio = Timestamp.fromDate(updates.dataInicio);
      }
      if (updates.dataFim) {
        updateData.dataFim = Timestamp.fromDate(updates.dataFim);
      }
      
      await updateDoc(docRef, updateData);
      
      // Log the action
      await loggingService.logONG('info', 'Activity Updated', 
        `Updated activity ${updates.nome || id}: fields ${Object.keys(updates).join(', ')}`
      );
      
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Activity not found after update');
      }
      
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        dataInicio: data.dataInicio.toDate(),
        dataFim: data.dataFim.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as AtividadeONG;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Update Activity', 
        `Error updating activity ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error updating atividade:', error);
      throw new Error('Failed to update activity');
    }
  }

  async deleteAtividade(id: string): Promise<void> {
    try {
      // Get activity info before deleting for logging
      const activityDoc = await getDoc(doc(db, this.atividadesCollection, id));
      const activityName = activityDoc.exists() ? activityDoc.data().nome : 'Unknown';
      
      await deleteDoc(doc(db, this.atividadesCollection, id));
      
      // Log the action
      await loggingService.logONG('warning', 'Activity Deleted', 
        `Deleted activity: ${activityName} (ID: ${id})`
      );
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Delete Activity', 
        `Error deleting activity ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error deleting atividade:', error);
      throw new Error('Failed to delete activity');
    }
  }

  async getAtividadeById(id: string): Promise<AtividadeONG | null> {
    try {
      const docRef = doc(db, this.atividadesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dataInicio: data.dataInicio.toDate(),
        dataFim: data.dataFim.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as AtividadeONG;
    } catch (error) {
      console.error('Error getting atividade:', error);
      throw new Error('Failed to get activity');
    }
  }

  async getAllAtividades(): Promise<AtividadeONG[]> {
    try {
      const q = query(
        collection(db, this.atividadesCollection),
        orderBy('dataInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataInicio: data.dataInicio.toDate(),
          dataFim: data.dataFim.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as AtividadeONG;
      });
    } catch (error) {
      console.error('Error getting all atividades:', error);
      throw new Error('Failed to get activities');
    }
  }

  async getAtividadesByPeriodo(periodo: PeriodoRelatorio): Promise<AtividadeONG[]> {
    try {
      const q = query(
        collection(db, this.atividadesCollection),
        where('dataInicio', '>=', Timestamp.fromDate(periodo.dataInicio)),
        where('dataInicio', '<=', Timestamp.fromDate(periodo.dataFim)),
        orderBy('dataInicio', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataInicio: data.dataInicio.toDate(),
          dataFim: data.dataFim.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as AtividadeONG;
      });
    } catch (error) {
      console.error('Error getting atividades by periodo:', error);
      throw new Error('Failed to get activities by period');
    }
  }

  // Donation Management
  async createDoacao(doacao: Omit<DoacaoONG, 'id' | 'createdAt' | 'updatedAt'>): Promise<DoacaoONG> {
    try {
      const doacaoData = {
        ...doacao,
        dataDoacao: Timestamp.fromDate(doacao.dataDoacao),
        dataRecebimento: doacao.dataRecebimento ? Timestamp.fromDate(doacao.dataRecebimento) : null,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };
      
      const docRef = await addDoc(collection(db, this.doacoesCollection), doacaoData);
      
      // Log the action
      const donorName = doacao.doador.isAnonimo ? 'Anonymous' : doacao.doador.nome;
      const amount = doacao.valor ? `R$ ${doacao.valor.toFixed(2)}` : 'Items';
      await loggingService.logONG('info', 'Donation Created', 
        `New ${doacao.tipo} donation from ${donorName}: ${amount}`
      );
      
      return {
        ...doacao,
        id: docRef.id,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Create Donation', 
        `Error creating donation: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error creating doacao:', error);
      throw new Error('Failed to create donation');
    }
  }

  async updateDoacao(id: string, updates: Partial<DoacaoONG>): Promise<DoacaoONG> {
    try {
      const docRef = doc(db, this.doacoesCollection, id);
      
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now()
      };
      
      if (updates.dataDoacao) {
        updateData.dataDoacao = Timestamp.fromDate(updates.dataDoacao);
      }
      if (updates.dataRecebimento) {
        updateData.dataRecebimento = Timestamp.fromDate(updates.dataRecebimento);
      }
      
      await updateDoc(docRef, updateData);
      
      // Log the action
      await loggingService.logONG('info', 'Donation Updated', 
        `Updated donation ${id}: fields ${Object.keys(updates).join(', ')}`
      );
      
      const updatedDoc = await getDoc(docRef);
      if (!updatedDoc.exists()) {
        throw new Error('Donation not found after update');
      }
      
      const data = updatedDoc.data();
      return {
        id: updatedDoc.id,
        ...data,
        dataDoacao: data.dataDoacao.toDate(),
        dataRecebimento: data.dataRecebimento?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as DoacaoONG;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Update Donation', 
        `Error updating donation ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error updating doacao:', error);
      throw new Error('Failed to update donation');
    }
  }

  async deleteDoacao(id: string): Promise<void> {
    try {
      // Get donation info before deleting for logging
      const donationDoc = await getDoc(doc(db, this.doacoesCollection, id));
      const donationInfo = donationDoc.exists() ? donationDoc.data() : null;
      
      await deleteDoc(doc(db, this.doacoesCollection, id));
      
      // Log the action
      const donorName = donationInfo?.doador?.isAnonimo ? 'Anonymous' : donationInfo?.doador?.nome || 'Unknown';
      const amount = donationInfo?.valor ? `R$ ${donationInfo.valor.toFixed(2)}` : 'Items';
      await loggingService.logONG('warning', 'Donation Deleted', 
        `Deleted ${donationInfo?.tipo || 'unknown'} donation from ${donorName}: ${amount} (ID: ${id})`
      );
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Delete Donation', 
        `Error deleting donation ${id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error deleting doacao:', error);
      throw new Error('Failed to delete donation');
    }
  }

  async getDoacaoById(id: string): Promise<DoacaoONG | null> {
    try {
      const docRef = doc(db, this.doacoesCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        dataDoacao: data.dataDoacao.toDate(),
        dataRecebimento: data.dataRecebimento?.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as DoacaoONG;
    } catch (error) {
      console.error('Error getting doacao:', error);
      throw new Error('Failed to get donation');
    }
  }

  async getAllDoacoes(): Promise<DoacaoONG[]> {
    try {
      const q = query(
        collection(db, this.doacoesCollection),
        orderBy('dataDoacao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataDoacao: data.dataDoacao.toDate(),
          dataRecebimento: data.dataRecebimento?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as DoacaoONG;
      });
    } catch (error) {
      console.error('Error getting all doacoes:', error);
      throw new Error('Failed to get donations');
    }
  }

  async getDoacoesByPeriodo(periodo: PeriodoRelatorio): Promise<DoacaoONG[]> {
    try {
      const q = query(
        collection(db, this.doacoesCollection),
        where('dataDoacao', '>=', Timestamp.fromDate(periodo.dataInicio)),
        where('dataDoacao', '<=', Timestamp.fromDate(periodo.dataFim)),
        orderBy('dataDoacao', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          dataDoacao: data.dataDoacao.toDate(),
          dataRecebimento: data.dataRecebimento?.toDate(),
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as DoacaoONG;
      });
    } catch (error) {
      console.error('Error getting doacoes by periodo:', error);
      throw new Error('Failed to get donations by period');
    }
  }

  // Report Generation
  async generateRelatorioVoluntarios(periodo: PeriodoRelatorio): Promise<RelatorioVoluntarios> {
    try {
      const voluntarios = await this.getAllVoluntarios();
      const atividades = await this.getAtividadesByPeriodo(periodo);
      
      const voluntariosAtivos = voluntarios.filter(v => v.status === StatusVoluntario.Ativo);
      const voluntariosInativos = voluntarios.filter(v => v.status === StatusVoluntario.Inativo);
      
      // Calculate volunteer hours
      const voluntarioHoras = voluntarios.map(v => ({
        voluntarioId: v.id,
        nome: v.nome,
        horasTrabalhadas: ONGEntity.calcularHorasVoluntario(v.id, atividades, periodo),
        atividadesParticipadas: atividades.filter(a => a.voluntariosConfirmados.includes(v.id)).length
      }));
      
      const horasTotais = voluntarioHoras.reduce((sum, v) => sum + v.horasTrabalhadas, 0);
      
      // Distribution by area
      const distribuicaoPorArea: { [key: string]: number } = {};
      voluntarios.forEach(v => {
        v.areasInteresse.forEach(area => {
          distribuicaoPorArea[area] = (distribuicaoPorArea[area] || 0) + 1;
        });
      });
      
      // Age distribution
      const hoje = new Date();
      const distribuicaoPorIdade = this.calcularDistribuicaoIdade(voluntarios, hoje);
      
      const report = {
        periodo,
        totalVoluntarios: voluntarios.length,
        voluntariosAtivos: voluntariosAtivos.length,
        voluntariosInativos: voluntariosInativos.length,
        novasAdesoes: voluntarios.filter(v => 
          v.dataInicio >= periodo.dataInicio && v.dataInicio <= periodo.dataFim
        ).length,
        desligamentos: voluntarios.filter(v => 
          v.dataFim && v.dataFim >= periodo.dataInicio && v.dataFim <= periodo.dataFim
        ).length,
        horasTotais,
        horasMediaPorVoluntario: voluntarios.length > 0 ? horasTotais / voluntarios.length : 0,
        topVoluntarios: voluntarioHoras.sort((a, b) => b.horasTrabalhadas - a.horasTrabalhadas).slice(0, 10),
        distribuicaoPorArea: Object.entries(distribuicaoPorArea).map(([area, quantidade]) => ({ area, quantidade })),
        distribuicaoPorIdade
      };
      
      // Log the action
      await loggingService.logONG('info', 'Volunteers Report Generated', 
        `Generated volunteers report for period ${periodo.dataInicio.toLocaleDateString('pt-BR')} to ${periodo.dataFim.toLocaleDateString('pt-BR')}: ${voluntarios.length} volunteers, ${horasTotais.toFixed(1)} total hours`
      );
      
      return report;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Generate Volunteers Report', 
        `Error generating volunteers report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error generating relatorio voluntarios:', error);
      throw new Error('Failed to generate volunteers report');
    }
  }

  async generateRelatorioAtividades(periodo: PeriodoRelatorio): Promise<RelatorioAtividades> {
    try {
      const atividades = await this.getAtividadesByPeriodo(periodo);
      
      const atividadesConcluidas = atividades.filter(a => a.status === StatusAtividade.Concluida);
      const atividadesCanceladas = atividades.filter(a => a.status === StatusAtividade.Cancelada);
      
      const beneficiariosAtendidos = atividadesConcluidas.reduce((sum, a) => 
        sum + (a.relatorio?.beneficiariosAtendidos || a.beneficiarios), 0
      );
      
      const voluntariosEnvolvidos = new Set<string>();
      atividadesConcluidas.forEach(a => {
        (a.relatorio?.voluntariosPresentes || a.voluntariosConfirmados).forEach(v => voluntariosEnvolvidos.add(v));
      });
      
      const horasTotais = atividadesConcluidas.reduce((sum, a) => {
        const horas = ONGEntity.calcularDuracaoAtividade(a);
        const voluntarios = a.relatorio?.voluntariosPresentes.length || a.voluntariosConfirmados.length;
        return sum + (horas * voluntarios);
      }, 0);
      
      // Distribution by type
      const distribuicaoPorTipo: { [key: string]: number } = {};
      atividades.forEach(a => {
        distribuicaoPorTipo[a.tipo] = (distribuicaoPorTipo[a.tipo] || 0) + 1;
      });
      
      // Top activities
      const atividadesMaisParticipadas = atividadesConcluidas
        .map(a => ({
          atividadeId: a.id,
          nome: a.nome,
          tipo: a.tipo,
          participantes: a.relatorio?.voluntariosPresentes.length || a.voluntariosConfirmados.length,
          beneficiarios: a.relatorio?.beneficiariosAtendidos || a.beneficiarios,
          horasRealizadas: a.relatorio?.horasRealizadas || ONGEntity.calcularDuracaoAtividade(a)
        }))
        .sort((a, b) => b.participantes - a.participantes)
        .slice(0, 10);
      
      const report = {
        periodo,
        totalAtividades: atividades.length,
        atividadesConcluidas: atividadesConcluidas.length,
        atividadesCanceladas: atividadesCanceladas.length,
        beneficiariosAtendidos,
        voluntariosEnvolvidos: voluntariosEnvolvidos.size,
        horasTotaisVoluntariado: horasTotais,
        distribuicaoPorTipo: Object.entries(distribuicaoPorTipo).map(([tipo, quantidade]) => ({ tipo, quantidade })),
        atividadesMaisParticipadas
      };
      
      // Log the action
      await loggingService.logONG('info', 'Activities Report Generated', 
        `Generated activities report for period ${periodo.dataInicio.toLocaleDateString('pt-BR')} to ${periodo.dataFim.toLocaleDateString('pt-BR')}: ${atividades.length} activities, ${beneficiariosAtendidos} beneficiaries served`
      );
      
      return report;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Generate Activities Report', 
        `Error generating activities report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error generating relatorio atividades:', error);
      throw new Error('Failed to generate activities report');
    }
  }

  async generateRelatorioFinanceiro(periodo: PeriodoRelatorio): Promise<RelatorioFinanceiro> {
    try {
      const doacoes = await this.getDoacoesByPeriodo(periodo);
      
      const doacoesRecebidas = doacoes.filter(d => d.status === StatusDoacao.Recebida);
      
      const totalArrecadado = doacoesRecebidas.reduce((sum, d) => {
        const valorDoacao = d.valor || 0;
        const valorItens = d.itens?.reduce((itemSum, item) => 
          itemSum + (item.valorEstimado || 0) * item.quantidade, 0
        ) || 0;
        return sum + valorDoacao + valorItens;
      }, 0);
      
      const totalDoacoesDinheiro = doacoesRecebidas
        .filter(d => d.tipo === TipoDoacao.Dinheiro)
        .reduce((sum, d) => sum + (d.valor || 0), 0);
      
      const totalDoacoesBens = totalArrecadado - totalDoacoesDinheiro;
      
      const doadores = new Set(doacoesRecebidas.map(d => d.doador.nome));
      const numeroDoadores = doadores.size;
      
      const ticketMedio = numeroDoadores > 0 ? totalArrecadado / numeroDoadores : 0;
      
      // Distribution by type
      const distribuicaoPorTipo: { [key: string]: number } = {};
      doacoesRecebidas.forEach(d => {
        const valor = d.valor || d.itens?.reduce((sum, item) => 
          sum + (item.valorEstimado || 0) * item.quantidade, 0
        ) || 0;
        distribuicaoPorTipo[d.tipo] = (distribuicaoPorTipo[d.tipo] || 0) + valor;
      });
      
      // Top donors
      const doadoresMap: { [key: string]: number } = {};
      doacoesRecebidas.forEach(d => {
        if (!d.doador.isAnonimo) {
          const valor = d.valor || d.itens?.reduce((sum, item) => 
            sum + (item.valorEstimado || 0) * item.quantidade, 0
          ) || 0;
          doadoresMap[d.doador.nome] = (doadoresMap[d.doador.nome] || 0) + valor;
        }
      });
      
      const maioresDoadores = Object.entries(doadoresMap)
        .map(([nome, valor]) => ({ nome, valor }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 10);
      
      // Monthly evolution
      const evolucaoMensal = this.calcularEvolucaoMensal(doacoesRecebidas, periodo);
      
      const report = {
        periodo,
        totalArrecadado,
        totalDoacoesDinheiro,
        totalDoacoesBens,
        numeroDoadores,
        ticketMedio,
        distribuicaoPorTipo: Object.entries(distribuicaoPorTipo).map(([tipo, valor]) => ({ tipo, valor })),
        maioresDoadores,
        evolucaoMensal
      };
      
      // Log the action
      await loggingService.logONG('info', 'Financial Report Generated', 
        `Generated financial report for period ${periodo.dataInicio.toLocaleDateString('pt-BR')} to ${periodo.dataFim.toLocaleDateString('pt-BR')}: R$ ${totalArrecadado.toFixed(2)} total raised, ${numeroDoadores} donors`
      );
      
      return report;
    } catch (error) {
      await loggingService.logONG('error', 'Failed to Generate Financial Report', 
        `Error generating financial report: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
      console.error('Error generating relatorio financeiro:', error);
      throw new Error('Failed to generate financial report');
    }
  }

  // Helper methods
  private calcularDistribuicaoIdade(voluntarios: Voluntario[], dataReferencia: Date): { faixa: string; quantidade: number }[] {
    const faixas: { [key: string]: number } = {
      '0-17': 0,
      '18-25': 0,
      '26-35': 0,
      '36-45': 0,
      '46-55': 0,
      '56-65': 0,
      '65+': 0
    };
    
    voluntarios.forEach(v => {
      const idade = Math.floor((dataReferencia.getTime() - v.dataNascimento.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      
      if (idade < 18) faixas['0-17']++;
      else if (idade <= 25) faixas['18-25']++;
      else if (idade <= 35) faixas['26-35']++;
      else if (idade <= 45) faixas['36-45']++;
      else if (idade <= 55) faixas['46-55']++;
      else if (idade <= 65) faixas['56-65']++;
      else faixas['65+']++;
    });
    
    return Object.entries(faixas).map(([faixa, quantidade]) => ({ faixa, quantidade }));
  }

  private calcularEvolucaoMensal(doacoes: DoacaoONG[], periodo: PeriodoRelatorio): { mes: string; valor: number }[] {
    const evolucao: { [key: string]: number } = {};
    
    doacoes.forEach(d => {
      const mes = d.dataDoacao.toISOString().slice(0, 7); // YYYY-MM
      const valor = d.valor || d.itens?.reduce((sum, item) => 
        sum + (item.valorEstimado || 0) * item.quantidade, 0
      ) || 0;
      evolucao[mes] = (evolucao[mes] || 0) + valor;
    });
    
    return Object.entries(evolucao)
      .map(([mes, valor]) => ({ mes, valor }))
      .sort((a, b) => a.mes.localeCompare(b.mes));
  }
}
