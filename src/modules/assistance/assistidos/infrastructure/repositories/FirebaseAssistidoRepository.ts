// Data Repository Implementation - Firebase Assistido Repository
// Complete implementation for assisted people data operations

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
import { db } from '../../config/firebase';
import { IAssistidoRepository } from '../../domain/repositories/IAssistidoRepository';
import { 
  Assistido, 
  StatusAssistido, 
  AtendimentoAssistido, 
  FamiliarAssistido,
  NecessidadeAssistido,
  TipoAtendimento
} from '../../modules/assistance/assistidos/domain/entities/Assistido';

export class FirebaseAssistidoRepository implements IAssistidoRepository {
  private readonly assistidosCollection = 'assistidos';
  private readonly atendimentosCollection = 'atendimentos';

  async findByCPF(cpf: string): Promise<Assistido | null> {
    try {
      const q = query(
        collection(db, this.assistidosCollection),
        where('cpf', '==', cpf),
        firestoreLimit(1)
      );
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      return this.mapToAssistido(doc.id, doc.data());
    } catch (error) {
      console.error('Error finding assistido by CPF:', error);
      throw new Error('Erro ao buscar assistido por CPF');
    }
  }

  async findById(id: string): Promise<Assistido | null> {
    try {
      const docRef = doc(db, this.assistidosCollection, id);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      return this.mapToAssistido(id, docSnap.data());
    } catch (error) {
      console.error('Error finding assistido by id:', error);
      throw new Error('Erro ao buscar assistido');
    }
  }

  async findAll(): Promise<Assistido[]> {
    try {
      const q = query(
        collection(db, this.assistidosCollection),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAssistido(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding all assistidos:', error);
      throw new Error('Erro ao buscar assistidos');
    }
  }

  async findByStatus(status: StatusAssistido): Promise<Assistido[]> {
    try {
      const q = query(
        collection(db, this.assistidosCollection),
        where('status', '==', status),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAssistido(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding assistidos by status:', error);
      throw new Error('Erro ao buscar assistidos por status');
    }
  }

  async findByResponsible(responsible: string): Promise<Assistido[]> {
    try {
      const q = query(
        collection(db, this.assistidosCollection),
        where('responsavelAtendimento', '==', responsible),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAssistido(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding assistidos by responsible:', error);
      throw new Error('Erro ao buscar assistidos por responsável');
    }
  }

  async findByNecessidade(necessidade: NecessidadeAssistido): Promise<Assistido[]> {
    try {
      const q = query(
        collection(db, this.assistidosCollection),
        where('necessidades', 'array-contains', necessidade),
        orderBy('nome', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAssistido(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding assistidos by necessidade:', error);
      throw new Error('Erro ao buscar assistidos por necessidade');
    }
  }

  async findNeedingAttention(): Promise<Assistido[]> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const q = query(
        collection(db, this.assistidosCollection),
        where('status', '==', StatusAssistido.Ativo),
        where('dataUltimoAtendimento', '<=', Timestamp.fromDate(thirtyDaysAgo)),
        orderBy('dataUltimoAtendimento', 'asc')
      );
      const querySnapshot = await getDocs(q);
      
      return querySnapshot.docs.map(doc => 
        this.mapToAssistido(doc.id, doc.data())
      );
    } catch (error) {
      console.error('Error finding assistidos needing attention:', error);
      // Fallback without dataUltimoAtendimento filter
      try {
        const q = query(
          collection(db, this.assistidosCollection),
          where('status', '==', StatusAssistido.Ativo),
          orderBy('nome', 'asc')
        );
        const querySnapshot = await getDocs(q);
        
        const assistidos = querySnapshot.docs.map(doc => 
          this.mapToAssistido(doc.id, doc.data())
        );

        // Filter in memory
        return assistidos.filter(assistido => {
          if (!assistido.dataUltimoAtendimento) return true;
          const daysSince = (new Date().getTime() - assistido.dataUltimoAtendimento.getTime()) / (1000 * 60 * 60 * 24);
          return daysSince >= 30;
        });
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        throw new Error('Erro ao buscar assistidos que precisam de atenção');
      }
    }
  }

  async create(assistido: Omit<Assistido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assistido> {
    let assistidoData: any;
    try {
      assistidoData = {
        nome: assistido.nome,
        dataNascimento: Timestamp.fromDate(assistido.dataNascimento),
        telefone: assistido.telefone,
        endereco: {
          logradouro: assistido.endereco.logradouro,
          numero: assistido.endereco.numero,
          bairro: assistido.endereco.bairro,
          cidade: assistido.endereco.cidade,
          estado: assistido.endereco.estado,
          cep: assistido.endereco.cep,
          ...(assistido.endereco.complemento && { complemento: assistido.endereco.complemento })
        },
        situacaoFamiliar: assistido.situacaoFamiliar,
        escolaridade: assistido.escolaridade,
        necessidades: assistido.necessidades,
        status: assistido.status,
        dataInicioAtendimento: Timestamp.fromDate(assistido.dataInicioAtendimento),
        dataUltimoAtendimento: assistido.dataUltimoAtendimento ? Timestamp.fromDate(assistido.dataUltimoAtendimento) : null,
        responsavelAtendimento: assistido.responsavelAtendimento,
        familiares: assistido.familiares.map(familiar => {
          const familiarData: any = {
            id: familiar.id,
            nome: familiar.nome,
            parentesco: familiar.parentesco,
            dataNascimento: familiar.dataNascimento ? Timestamp.fromDate(familiar.dataNascimento) : null
          };
          
          // Only add optional fields if they have values
          if (familiar.cpf) familiarData.cpf = familiar.cpf;
          if (familiar.telefone) familiarData.telefone = familiar.telefone;
          if (familiar.profissao) familiarData.profissao = familiar.profissao;
          if (familiar.renda !== undefined) familiarData.renda = familiar.renda;
          
          return familiarData;
        }),
        atendimentos: assistido.atendimentos.map(atendimento => {
          const atendimentoData: any = {
            id: atendimento.id,
            data: Timestamp.fromDate(atendimento.data),
            tipo: atendimento.tipo,
            descricao: atendimento.descricao,
            responsavel: atendimento.responsavel,
            proximoRetorno: atendimento.proximoRetorno ? Timestamp.fromDate(atendimento.proximoRetorno) : null
          };
          
          // Only add optional fields if they have values
          if (atendimento.itensDoados) atendimentoData.itensDoados = atendimento.itensDoados;
          if (atendimento.valorDoacao !== undefined) atendimentoData.valorDoacao = atendimento.valorDoacao;
          
          return atendimentoData;
        }),
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        createdBy: assistido.createdBy
      };

      // Add optional fields only if they have values
      if (assistido.cpf) {
        assistidoData.cpf = assistido.cpf;
      }
      if (assistido.rg) {
        assistidoData.rg = assistido.rg;
      }
      if (assistido.email) {
        assistidoData.email = assistido.email;
      }
      if (assistido.profissao) {
        assistidoData.profissao = assistido.profissao;
      }
      if (assistido.observacoes) {
        assistidoData.observacoes = assistido.observacoes;
      }
      if (assistido.rendaFamiliar !== undefined) {
        assistidoData.rendaFamiliar = assistido.rendaFamiliar;
      }

      const docRef = await addDoc(collection(db, this.assistidosCollection), assistidoData);
      
      return {
        id: docRef.id,
        ...assistido,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    } catch (error) {
      console.error('Error creating assistido:', error);
      throw new Error('Erro ao criar assistido');
    }
  }

  async update(id: string, data: Partial<Assistido>): Promise<Assistido> {
    try {
      const updateData: any = {
        updatedAt: Timestamp.now()
      };

      // Add only defined fields to avoid Firebase undefined error
      Object.keys(data).forEach(key => {
        if (data[key as keyof Assistido] !== undefined) {
          updateData[key] = data[key as keyof Assistido];
        }
      });

      // Convert dates to timestamps
      if (data.dataNascimento) {
        updateData.dataNascimento = Timestamp.fromDate(data.dataNascimento);
      }
      if (data.dataInicioAtendimento) {
        updateData.dataInicioAtendimento = Timestamp.fromDate(data.dataInicioAtendimento);
      }
      if (data.dataUltimoAtendimento) {
        updateData.dataUltimoAtendimento = Timestamp.fromDate(data.dataUltimoAtendimento);
      }

      // Convert familiares dates
      if (data.familiares) {
        updateData.familiares = data.familiares.map(familiar => ({
          ...familiar,
          dataNascimento: familiar.dataNascimento ? Timestamp.fromDate(familiar.dataNascimento) : null
        }));
      }

      // Convert atendimentos dates
      if (data.atendimentos) {
        updateData.atendimentos = data.atendimentos.map(atendimento => ({
          ...atendimento,
          data: Timestamp.fromDate(atendimento.data),
          proximoRetorno: atendimento.proximoRetorno ? Timestamp.fromDate(atendimento.proximoRetorno) : null
        }));
      }

      // Remove fields that shouldn't be updated
      delete updateData.id;
      delete updateData.createdAt;

      await updateDoc(doc(db, this.assistidosCollection, id), updateData);

      const updatedAssistido = await this.findById(id);
      if (!updatedAssistido) {
        throw new Error('Assistido não encontrado após atualização');
      }

      return updatedAssistido;
    } catch (error) {
      console.error('Error updating assistido:', error);
      throw new Error('Erro ao atualizar assistido');
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await updateDoc(doc(db, this.assistidosCollection, id), {
        status: StatusAssistido.Inativo,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error deleting assistido:', error);
      throw new Error('Erro ao inativar assistido');
    }
  }

  async deletePhysically(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.assistidosCollection, id));
    } catch (error) {
      console.error('Error physically deleting assistido:', error);
      throw new Error('Erro ao excluir assistido permanentemente');
    }
  }

  async updateStatus(id: string, status: StatusAssistido): Promise<void> {
    try {
      await updateDoc(doc(db, this.assistidosCollection, id), {
        status,
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error updating assistido status:', error);
      throw new Error('Erro ao atualizar status do assistido');
    }
  }

  async addAtendimento(assistidoId: string, atendimento: Omit<AtendimentoAssistido, 'id'>): Promise<void> {
    try {
      const assistido = await this.findById(assistidoId);
      if (!assistido) {
        throw new Error('Assistido não encontrado');
      }

      const newAtendimento = {
        id: `atd_${Date.now()}`,
        ...atendimento
      };

      const updatedAtendimentos = [...assistido.atendimentos, newAtendimento];

      await updateDoc(doc(db, this.assistidosCollection, assistidoId), {
        atendimentos: updatedAtendimentos.map(at => ({
          ...at,
          data: Timestamp.fromDate(at.data),
          proximoRetorno: at.proximoRetorno ? Timestamp.fromDate(at.proximoRetorno) : null
        })),
        dataUltimoAtendimento: Timestamp.fromDate(atendimento.data),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding atendimento:', error);
      throw new Error('Erro ao adicionar atendimento');
    }
  }

  async addFamiliar(assistidoId: string, familiar: Omit<FamiliarAssistido, 'id'>): Promise<void> {
    try {
      const assistido = await this.findById(assistidoId);
      if (!assistido) {
        throw new Error('Assistido não encontrado');
      }

      const newFamiliar = {
        id: `fam_${Date.now()}`,
        ...familiar
      };

      const updatedFamiliares = [...assistido.familiares, newFamiliar];

      await updateDoc(doc(db, this.assistidosCollection, assistidoId), {
        familiares: updatedFamiliares.map(fam => ({
          ...fam,
          dataNascimento: fam.dataNascimento ? Timestamp.fromDate(fam.dataNascimento) : null
        })),
        updatedAt: Timestamp.now()
      });
    } catch (error) {
      console.error('Error adding familiar:', error);
      throw new Error('Erro ao adicionar familiar');
    }
  }

  async getStatistics(): Promise<{
    totalAtivos: number;
    totalInativos: number;
    necessidadeMaisComum: NecessidadeAssistido | null;
    atendimentosUltimos30Dias: number;
    familiasTotais: number;
  }> {
    try {
      const allAssistidos = await this.findAll();
      
      const totalAtivos = allAssistidos.filter(a => a.status === StatusAssistido.Ativo).length;
      const totalInativos = allAssistidos.filter(a => a.status === StatusAssistido.Inativo).length;
      
      // Count necessidades
      const necessidadeCount: Record<NecessidadeAssistido, number> = {} as Record<NecessidadeAssistido, number>;
      allAssistidos.forEach(assistido => {
        assistido.necessidades.forEach(necessidade => {
          necessidadeCount[necessidade] = (necessidadeCount[necessidade] || 0) + 1;
        });
      });

      const necessidadeMaisComum = Object.entries(necessidadeCount)
        .sort(([,a], [,b]) => b - a)[0]?.[0] as NecessidadeAssistido || null;

      // Count atendimentos in last 30 days
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const atendimentosUltimos30Dias = allAssistidos.reduce((count, assistido) => {
        return count + assistido.atendimentos.filter(at => 
          at.data >= thirtyDaysAgo
        ).length;
      }, 0);

      const familiasTotais = allAssistidos.reduce((count, assistido) => {
        // Only count as a family if the assistido has family members registered
        return assistido.familiares.length > 0 ? count + 1 : count;
      }, 0);

      return {
        totalAtivos,
        totalInativos,
        necessidadeMaisComum,
        atendimentosUltimos30Dias,
        familiasTotais
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new Error('Erro ao obter estatísticas');
    }
  }

  private mapToAssistido(id: string, data: any): Assistido {
    return {
      id,
      nome: data.nome,
      cpf: data.cpf,
      rg: data.rg,
      dataNascimento: data.dataNascimento?.toDate() || new Date(),
      telefone: data.telefone,
      email: data.email,
      endereco: data.endereco,
      situacaoFamiliar: data.situacaoFamiliar,
      rendaFamiliar: data.rendaFamiliar,
      profissao: data.profissao,
      escolaridade: data.escolaridade,
      necessidades: data.necessidades || [],
      // Novos campos
      tipoMoradia: data.tipoMoradia || 'alugada',
      quantidadeComodos: data.quantidadeComodos || 1,
      possuiCadUnico: data.possuiCadUnico || false,
      qualBeneficio: data.qualBeneficio,
      observacoes: data.observacoes,
      status: data.status,
      dataInicioAtendimento: data.dataInicioAtendimento?.toDate() || new Date(),
      dataUltimoAtendimento: data.dataUltimoAtendimento?.toDate(),
      responsavelAtendimento: data.responsavelAtendimento,
      familiares: (data.familiares || []).map((fam: any) => ({
        ...fam,
        dataNascimento: fam.dataNascimento?.toDate()
      })),
      atendimentos: (data.atendimentos || []).map((at: any) => ({
        ...at,
        data: at.data?.toDate() || new Date(),
        proximoRetorno: at.proximoRetorno?.toDate()
      })),
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      createdBy: data.createdBy
    };
  }
}