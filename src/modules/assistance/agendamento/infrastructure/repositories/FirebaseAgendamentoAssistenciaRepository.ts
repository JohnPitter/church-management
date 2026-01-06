// Data Repository Implementation - Firebase Agendamento Assistência Repository
// Firebase implementation for appointment assistance data operations

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
  arrayUnion
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  IAgendamentoAssistenciaRepository
} from '../../domain/repositories/IAssistenciaRepository';
import {
  AgendamentoAssistencia,
  TipoAssistencia,
  StatusAgendamento,
  EstatisticasAssistencia,
  ModalidadeAtendimento,
  HistoricoAgendamento
} from '../../domain/entities/Assistencia';

export class FirebaseAgendamentoAssistenciaRepository implements IAgendamentoAssistenciaRepository {
  private readonly agendamentosCollection = 'agendamentosAssistencia';

  async findById(id: string): Promise<AgendamentoAssistencia | null> {
    try {
      const docRef = doc(db, this.agendamentosCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToAgendamento(id, docSnap.data());
    } catch (error) {
      console.error('Error finding agendamento by id:', error);
      throw new Error('Erro ao buscar agendamento');
    }
  }

  async findAll(): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        orderBy('dataHoraAgendamento', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all agendamentos:', error);
      throw new Error('Erro ao buscar agendamentos');
    }
  }

  async create(agendamento: Omit<AgendamentoAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendamentoAssistencia> {
    try {
      const agendamentoData = this.mapAgendamentoToFirestore(agendamento);
      agendamentoData.createdAt = Timestamp.now();
      agendamentoData.updatedAt = Timestamp.now();

      const docRef = await addDoc(collection(db, this.agendamentosCollection), agendamentoData);
      
      return {
        id: docRef.id,
        ...agendamento,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating agendamento:', error);
      throw new Error('Erro ao criar agendamento');
    }
  }

  async update(id: string, data: Partial<AgendamentoAssistencia>): Promise<AgendamentoAssistencia> {
    try {
      const updateData = this.mapAgendamentoToFirestore(data);
      updateData.updatedAt = Timestamp.now();

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.agendamentosCollection, id), updateData);

      const updatedAgendamento = await this.findById(id);
      if (!updatedAgendamento) {
        throw new Error('Agendamento não encontrado após atualização');
      }

      return updatedAgendamento;
    } catch (error) {
      console.error('Error updating agendamento:', error);
      throw new Error('Erro ao atualizar agendamento');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.agendamentosCollection, id), {
        status: StatusAgendamento.Cancelado,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting agendamento:', error);
      throw new Error('Erro ao cancelar agendamento');
    }
  }

  async deletePhysically(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.agendamentosCollection, id));
    } catch (error) {
      console.error('Error physically deleting agendamento:', error);
      throw new Error('Erro ao excluir agendamento permanentemente');
    }
  }

  async findByPaciente(pacienteId: string): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        where('pacienteId', '==', pacienteId),
        orderBy('dataHoraAgendamento', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos by paciente:', error);
      throw new Error('Erro ao buscar agendamentos do paciente');
    }
  }

  async findByProfissional(profissionalId: string): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        where('profissionalId', '==', profissionalId),
        orderBy('dataHoraAgendamento', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos by profissional:', error);
      throw new Error('Erro ao buscar agendamentos do profissional');
    }
  }

  async findByTipo(tipo: TipoAssistencia): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        where('tipoAssistencia', '==', tipo),
        orderBy('dataHoraAgendamento', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos by tipo:', error);
      throw new Error('Erro ao buscar agendamentos por tipo');
    }
  }

  async findByStatus(status: StatusAgendamento): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        where('status', '==', status),
        orderBy('dataHoraAgendamento', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos by status:', error);
      throw new Error('Erro ao buscar agendamentos por status');
    }
  }

  async findByDateRange(dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        where('dataHoraAgendamento', '>=', Timestamp.fromDate(dataInicio)),
        where('dataHoraAgendamento', '<=', Timestamp.fromDate(dataFim)),
        orderBy('dataHoraAgendamento', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos by date range:', error);
      throw new Error('Erro ao buscar agendamentos por período');
    }
  }

  async findByProfissionalAndDateRange(profissionalId: string, dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]> {
    try {
      const q = query(
        collection(db, this.agendamentosCollection),
        where('profissionalId', '==', profissionalId),
        where('dataHoraAgendamento', '>=', Timestamp.fromDate(dataInicio)),
        where('dataHoraAgendamento', '<=', Timestamp.fromDate(dataFim)),
        orderBy('dataHoraAgendamento', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos by profissional and date range:', error);
      throw new Error('Erro ao buscar agendamentos do profissional por período');
    }
  }

  async findAgendamentosHoje(): Promise<AgendamentoAssistencia[]> {
    const hoje = new Date();
    const inicioDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
    const fimDia = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + 1);
    
    return this.findByDateRange(inicioDia, fimDia);
  }

  async findProximosAgendamentos(profissionalId: string, limite: number = 10): Promise<AgendamentoAssistencia[]> {
    try {
      const agora = Timestamp.now();
      let q;
      
      if (profissionalId) {
        q = query(
          collection(db, this.agendamentosCollection),
          where('profissionalId', '==', profissionalId),
          where('dataHoraAgendamento', '>=', agora),
          where('status', 'in', [StatusAgendamento.Agendado, StatusAgendamento.Confirmado]),
          orderBy('dataHoraAgendamento', 'asc'),
          firestoreLimit(limite)
        );
      } else {
        q = query(
          collection(db, this.agendamentosCollection),
          where('dataHoraAgendamento', '>=', agora),
          where('status', 'in', [StatusAgendamento.Agendado, StatusAgendamento.Confirmado]),
          orderBy('dataHoraAgendamento', 'asc'),
          firestoreLimit(limite)
        );
      }
      
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding próximos agendamentos:', error);
      throw new Error('Erro ao buscar próximos agendamentos');
    }
  }

  async findAgendamentosVencidos(): Promise<AgendamentoAssistencia[]> {
    try {
      const agora = Timestamp.now();
      const q = query(
        collection(db, this.agendamentosCollection),
        where('dataHoraAgendamento', '<', agora),
        where('status', 'in', [StatusAgendamento.Agendado, StatusAgendamento.Confirmado]),
        orderBy('dataHoraAgendamento', 'desc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAgendamento(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding agendamentos vencidos:', error);
      throw new Error('Erro ao buscar agendamentos vencidos');
    }
  }

  async searchAgendamentos(query: string): Promise<AgendamentoAssistencia[]> {
    try {
      const allAgendamentos = await this.findAll();
      const searchTerm = query.toLowerCase();
      
      return allAgendamentos.filter(agendamento => 
        agendamento.pacienteNome.toLowerCase().includes(searchTerm) ||
        agendamento.profissionalNome.toLowerCase().includes(searchTerm) ||
        agendamento.pacienteTelefone.includes(searchTerm) ||
        (agendamento.pacienteEmail && agendamento.pacienteEmail.toLowerCase().includes(searchTerm)) ||
        agendamento.motivo.toLowerCase().includes(searchTerm)
      );
    } catch (error) {
      console.error('Error searching agendamentos:', error);
      throw new Error('Erro ao pesquisar agendamentos');
    }
  }

  async updateStatus(id: string, status: StatusAgendamento, observacoes?: string, responsavel?: string): Promise<void> {
    try {
      const agendamento = await this.findById(id);
      if (!agendamento) {
        throw new Error('Agendamento não encontrado');
      }

      const historicoEntry: Omit<HistoricoAgendamento, 'id'> = {
        dataHora: new Date(),
        acao: this.mapStatusToAction(status),
        statusAnterior: agendamento.status,
        statusNovo: status,
        observacoes: observacoes || `Status alterado para ${status}`,
        responsavel: responsavel || 'sistema'
      };

      await updateDoc(doc(db, this.agendamentosCollection, id), {
        status,
        updatedAt: Timestamp.now(),
        historico: arrayUnion({
          ...historicoEntry,
          id: `hist_${Date.now()}`,
          dataHora: Timestamp.fromDate(historicoEntry.dataHora)
        })
      });
    } catch (error) {
      console.error('Error updating agendamento status:', error);
      throw new Error('Erro ao atualizar status do agendamento');
    }
  }

  async confirmarAgendamento(id: string, responsavel: string): Promise<void> {
    await this.updateStatus(id, StatusAgendamento.Confirmado, 'Agendamento confirmado', responsavel);
  }

  async cancelarAgendamento(id: string, motivo: string, responsavel: string): Promise<void> {
    await this.updateStatus(id, StatusAgendamento.Cancelado, motivo, responsavel);
  }

  async remarcarAgendamento(id: string, novaData: Date, responsavel: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.agendamentosCollection, id), {
        dataHoraAgendamento: Timestamp.fromDate(novaData),
        status: StatusAgendamento.Remarcado,
        updatedAt: Timestamp.now()
      });

      await this.updateStatus(id, StatusAgendamento.Remarcado, `Remarcado para ${novaData.toLocaleString('pt-BR')}`, responsavel);
    } catch (error) {
      console.error('Error remarking agendamento:', error);
      throw new Error('Erro ao remarcar agendamento');
    }
  }

  async iniciarConsulta(id: string, responsavel: string): Promise<void> {
    await this.updateStatus(id, StatusAgendamento.EmAndamento, 'Consulta iniciada', responsavel);
  }

  async concluirConsulta(id: string, observacoes?: string, responsavel?: string): Promise<void> {
    await this.updateStatus(id, StatusAgendamento.Concluido, observacoes || 'Consulta concluída', responsavel);
  }

  async getAgendamentosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]> {
    return this.findByDateRange(dataInicio, dataFim);
  }

  async getEstatisticasPorProfissional(profissionalId: string): Promise<EstatisticasAssistencia> {
    try {
      const agendamentosProfissional = await this.findByProfissional(profissionalId);
      return this.calculateStatistics(agendamentosProfissional);
    } catch (error) {
      console.error('Error getting estatísticas por profissional:', error);
      throw new Error('Erro ao obter estatísticas do profissional');
    }
  }

  async getEstatisticasGerais(): Promise<EstatisticasAssistencia> {
    try {
      const allAgendamentos = await this.findAll();
      return this.calculateStatistics(allAgendamentos);
    } catch (error) {
      console.error('Error getting estatísticas gerais:', error);
      throw new Error('Erro ao obter estatísticas gerais');
    }
  }

  private calculateStatistics(agendamentos: AgendamentoAssistencia[]): EstatisticasAssistencia {
    const hoje = new Date();
    const inicioSemana = new Date(hoje.getTime() - 7 * 24 * 60 * 60 * 1000);
    const inicioMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

    const agendamentosHoje = agendamentos.filter(a => {
      const data = new Date(a.dataHoraAgendamento);
      return data.toDateString() === hoje.toDateString();
    }).length;

    const agendamentosSemana = agendamentos.filter(a => {
      const data = new Date(a.dataHoraAgendamento);
      return data >= inicioSemana;
    }).length;

    const agendamentosMes = agendamentos.filter(a => {
      const data = new Date(a.dataHoraAgendamento);
      return data >= inicioMes;
    }).length;

    // Distribuição por tipo
    const porTipo: Record<TipoAssistencia, number> = {} as Record<TipoAssistencia, number>;
    Object.values(TipoAssistencia).forEach(tipo => {
      porTipo[tipo] = agendamentos.filter(a => a.tipoAssistencia === tipo).length;
    });

    // Distribuição por status
    const porStatus: Record<StatusAgendamento, number> = {} as Record<StatusAgendamento, number>;
    Object.values(StatusAgendamento).forEach(status => {
      porStatus[status] = agendamentos.filter(a => a.status === status).length;
    });

    // Distribuição por profissional
    const porProfissional: Record<string, number> = {};
    agendamentos.forEach(a => {
      porProfissional[a.profissionalNome] = (porProfissional[a.profissionalNome] || 0) + 1;
    });

    // Distribuição por modalidade
    const porModalidade: Record<ModalidadeAtendimento, number> = {} as Record<ModalidadeAtendimento, number>;
    Object.values(ModalidadeAtendimento).forEach(modalidade => {
      porModalidade[modalidade] = agendamentos.filter(a => a.modalidade === modalidade).length;
    });

    const agendamentosConcluidos = agendamentos.filter(a => a.status === StatusAgendamento.Concluido);
    const taxaConclusao = agendamentos.length > 0 ? (agendamentosConcluidos.length / agendamentos.length) * 100 : 0;

    // Tempo médio de consulta (em minutos)
    const tempoMedioConsulta = agendamentosConcluidos.length > 0 
      ? agendamentosConcluidos.reduce((sum, a) => {
          const duracao = new Date(a.dataHoraFim).getTime() - new Date(a.dataHoraAgendamento).getTime();
          return sum + duracao / (1000 * 60); // converter para minutos
        }, 0) / agendamentosConcluidos.length
      : 0;

    // Avaliação média
    const avaliacoesComNota = agendamentos.filter(a => a.avaliacaoServico?.nota);
    const avaliacaoMedia = avaliacoesComNota.length > 0
      ? avaliacoesComNota.reduce((sum, a) => sum + a.avaliacaoServico!.nota, 0) / avaliacoesComNota.length
      : 0;

    // Crescimento mensal (últimos 12 meses)
    const crescimentoMensal: Array<{ mes: string, total: number, tipo: Record<TipoAssistencia, number> }> = [];
    for (let i = 11; i >= 0; i--) {
      const mesData = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
      const mesProximo = new Date(hoje.getFullYear(), hoje.getMonth() - i + 1, 1);
      
      const agendamentosMes = agendamentos.filter(a => {
        const data = new Date(a.dataHoraAgendamento);
        return data >= mesData && data < mesProximo;
      });

      const tipoMes: Record<TipoAssistencia, number> = {} as Record<TipoAssistencia, number>;
      Object.values(TipoAssistencia).forEach(tipo => {
        tipoMes[tipo] = agendamentosMes.filter(a => a.tipoAssistencia === tipo).length;
      });

      crescimentoMensal.push({
        mes: mesData.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }),
        total: agendamentosMes.length,
        tipo: tipoMes
      });
    }

    return {
      totalAgendamentos: agendamentos.length,
      agendamentosHoje,
      agendamentosSemana,
      agendamentosMes,
      porTipo,
      porStatus,
      porProfissional,
      porModalidade,
      taxaConclusao,
      tempoMedioConsulta,
      avaliacaoMedia,
      crescimentoMensal
    };
  }

  private mapStatusToAction(status: StatusAgendamento): 'criado' | 'confirmado' | 'remarcado' | 'cancelado' | 'iniciado' | 'concluido' {
    switch (status) {
      case StatusAgendamento.Confirmado:
        return 'confirmado';
      case StatusAgendamento.Remarcado:
        return 'remarcado';
      case StatusAgendamento.Cancelado:
        return 'cancelado';
      case StatusAgendamento.EmAndamento:
        return 'iniciado';
      case StatusAgendamento.Concluido:
        return 'concluido';
      default:
        return 'criado';
    }
  }

  private mapToAgendamento(id: string, data: any): AgendamentoAssistencia {
    return {
      id,
      pacienteId: data.pacienteId,
      pacienteNome: data.pacienteNome,
      pacienteTelefone: data.pacienteTelefone,
      pacienteEmail: data.pacienteEmail,
      profissionalId: data.profissionalId,
      profissionalNome: data.profissionalNome,
      tipoAssistencia: data.tipoAssistencia,
      dataHoraAgendamento: data.dataHoraAgendamento?.toDate() || new Date(),
      dataHoraFim: data.dataHoraFim?.toDate() || new Date(),
      modalidade: data.modalidade,
      prioridade: data.prioridade,
      status: data.status,
      motivo: data.motivo,
      observacoesPaciente: data.observacoesPaciente,
      observacoesProfissional: data.observacoesProfissional,
      diagnosticoInicial: data.diagnosticoInicial,
      encaminhamento: data.encaminhamento,
      proximoRetorno: data.proximoRetorno?.toDate(),
      valor: data.valor,
      desconto: data.desconto,
      valorFinal: data.valorFinal,
      formaPagamento: data.formaPagamento,
      linkConsulta: data.linkConsulta,
      enderecoAtendimento: data.enderecoAtendimento,
      anexos: data.anexos || [],
      historico: (data.historico || []).map((h: any) => ({
        ...h,
        dataHora: h.dataHora?.toDate() || new Date()
      })),
      avaliacaoServico: data.avaliacaoServico,
      dadosEspecificos: data.dadosEspecificos,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }

  private mapAgendamentoToFirestore(agendamento: any): any {
    const firestoreData: any = {};
    
    // Copy all defined values (skip undefined)
    Object.keys(agendamento).forEach(key => {
      if (agendamento[key] !== undefined) {
        firestoreData[key] = agendamento[key];
      }
    });
    
    // Convert dates to timestamps
    if (agendamento.dataHoraAgendamento) {
      firestoreData.dataHoraAgendamento = Timestamp.fromDate(agendamento.dataHoraAgendamento);
    }
    if (agendamento.dataHoraFim) {
      firestoreData.dataHoraFim = Timestamp.fromDate(agendamento.dataHoraFim);
    }
    if (agendamento.proximoRetorno) {
      firestoreData.proximoRetorno = Timestamp.fromDate(agendamento.proximoRetorno);
    }

    // Convert historico dates
    if (agendamento.historico) {
      firestoreData.historico = agendamento.historico.map((h: any) => ({
        ...h,
        dataHora: Timestamp.fromDate(h.dataHora)
      }));
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