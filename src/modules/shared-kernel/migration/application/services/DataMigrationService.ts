import { db } from '@/config/firebase';
import { collection, doc, setDoc, Timestamp } from 'firebase/firestore';
import { Assistido, StatusAssistido, SituacaoFamiliar, Escolaridade, TipoMoradia } from '@modules/assistance/assistidos/domain/entities/Assistido';
import { Member, MemberStatus, MaritalStatus } from '@modules/church-management/members/domain/entities/Member';
import { Event, EventStatus } from '@modules/church-management/events/domain/entities/Event';

interface OldData {
  assistidos?: Record<string, any>;
  membros?: Record<string, any>;
  eventos?: Record<string, any>;
  transacoes?: Record<string, any>;
  auditorias?: Record<string, any>;
  cargos?: Record<string, any>;
  diarios?: Record<string, any>;
  patrimonios?: Record<string, any>;
  projetos?: Record<string, any>;
}

interface MigrationProgress {
  collection: string;
  total: number;
  processed: number;
  errors: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessages?: string[];
}

interface MigrationResult {
  success: boolean;
  totalRecords: number;
  migratedRecords: number;
  errors: number;
  collections: MigrationProgress[];
  duration: number;
}

export class DataMigrationService {
  private static instance: DataMigrationService;

  private constructor() {}

  public static getInstance(): DataMigrationService {
    if (!DataMigrationService.instance) {
      DataMigrationService.instance = new DataMigrationService();
    }
    return DataMigrationService.instance;
  }

  /**
   * Converte data do formato DD/MM/YYYY para objeto Date
   */
  private parseDate(dateStr: string): Date | null {
    if (!dateStr) return null;

    const parts = dateStr.split('/');
    if (parts.length !== 3) return null;

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Mês começa em 0
    const year = parseInt(parts[2], 10);

    return new Date(year, month, day);
  }

  /**
   * Mapeia escolaridade antiga para nova
   */
  private mapEscolaridade(escolaridade: number): Escolaridade {
    const mapping: Record<number, Escolaridade> = {
      1: Escolaridade.FundamentalIncompleto,
      2: Escolaridade.FundamentalCompleto,
      3: Escolaridade.FundamentalIncompleto,
      4: Escolaridade.MedioIncompleto,
      5: Escolaridade.MedioCompleto,
      6: Escolaridade.SuperiorIncompleto,
      7: Escolaridade.SuperiorCompleto,
      8: Escolaridade.PosGraduacao,
    };

    return mapping[escolaridade] || Escolaridade.FundamentalIncompleto;
  }

  /**
   * Mapeia situação familiar antiga para nova
   */
  private mapSituacaoFamiliar(estadoCivil: number): SituacaoFamiliar {
    const mapping: Record<number, SituacaoFamiliar> = {
      1: SituacaoFamiliar.Solteiro,
      2: SituacaoFamiliar.Casado,
      3: SituacaoFamiliar.Divorciado,
      4: SituacaoFamiliar.Viuvo,
      5: SituacaoFamiliar.UniaoEstavel,
    };

    return mapping[estadoCivil] || SituacaoFamiliar.Solteiro;
  }

  /**
   * Mapeia estado civil de membro
   */
  private mapMaritalStatus(estadoCivil: number): MaritalStatus {
    const mapping: Record<number, MaritalStatus> = {
      1: MaritalStatus.Single,
      2: MaritalStatus.Married,
      3: MaritalStatus.Divorced,
      4: MaritalStatus.Widowed,
      5: MaritalStatus.Divorced, // União estável → Divorciado (não há opção separated)
    };

    return mapping[estadoCivil] || MaritalStatus.Single;
  }

  /**
   * Verifica se um assistido já existe no banco (por CPF)
   */
  private async checkAssistidoExists(cpf: string): Promise<string | null> {
    if (!cpf) return null;

    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const q = query(collection(db, 'assistidos'), where('cpf', '==', cpf));
    const snapshot = await getDocs(q);

    return snapshot.empty ? null : snapshot.docs[0].id;
  }

  /**
   * Verifica se um membro já existe no banco (por email)
   */
  private async checkMembroExists(email: string): Promise<string | null> {
    if (!email) return null;

    const { collection, query, where, getDocs } = await import('firebase/firestore');
    const q = query(collection(db, 'members'), where('email', '==', email));
    const snapshot = await getDocs(q);

    return snapshot.empty ? null : snapshot.docs[0].id;
  }

  /**
   * Migra assistidos com verificação de duplicados
   */
  private async migrateAssistidos(
    assistidosData: Record<string, any>,
    progress: MigrationProgress,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    const assistidosKeys = Object.keys(assistidosData);
    let newRecords = 0;
    let updatedRecords = 0;

    for (let i = 0; i < assistidosKeys.length; i++) {
      const key = assistidosKeys[i];
      const oldAssistido = assistidosData[key];

      try {
        const dataNascimento = this.parseDate(oldAssistido.dataNascimento);

        const assistido: Partial<Assistido> = {
          nome: oldAssistido.nomeCompleto || '',
          cpf: oldAssistido.cpf || '',
          rg: oldAssistido.rg || '',
          dataNascimento: dataNascimento || new Date(),
          telefone: oldAssistido.telefone || '',
          email: oldAssistido.email || '',
          endereco: {
            logradouro: oldAssistido.endereco?.logradouro || '',
            numero: String(oldAssistido.endereco?.numero || ''),
            complemento: oldAssistido.endereco?.complemento || '',
            bairro: oldAssistido.endereco?.bairro || '',
            cidade: oldAssistido.endereco?.cidade || '',
            estado: oldAssistido.endereco?.estado || '',
            cep: oldAssistido.endereco?.cep || '',
          },
          situacaoFamiliar: this.mapSituacaoFamiliar(oldAssistido.estadoCivil || 1),
          escolaridade: this.mapEscolaridade(oldAssistido.escolaridade || 1),
          profissao: oldAssistido.profissao || '',
          rendaFamiliar: oldAssistido.rendaFamiliar || 0,
          status: oldAssistido.situacao === 'Ativo' ? StatusAssistido.Ativo : StatusAssistido.Inativo,
          necessidades: oldAssistido.projetos || [],
          observacoes: oldAssistido.observacoes || '',
          tipoMoradia: TipoMoradia.Alugada,
          quantidadeComodos: 1,
          possuiCadUnico: false,
          dataInicioAtendimento: dataNascimento || new Date(),
          responsavelAtendimento: '',
          familiares: [],
          atendimentos: [],
          createdAt: Timestamp.now().toDate(),
          updatedAt: Timestamp.now().toDate(),
          createdBy: 'migration',
        };

        // Verifica se já existe
        const existingId = await this.checkAssistidoExists(assistido.cpf || '');

        if (existingId) {
          // Atualiza registro existente
          const docRef = doc(db, 'assistidos', existingId);
          await setDoc(docRef, { ...assistido, updatedAt: Timestamp.now().toDate() }, { merge: true });
          updatedRecords++;
        } else {
          // Cria novo registro
          const docRef = doc(collection(db, 'assistidos'));
          await setDoc(docRef, assistido);
          newRecords++;
        }

        progress.processed++;
        if (onProgress && progress.processed % 5 === 0) {
          onProgress({ ...progress });
        }
      } catch (error) {
        progress.errors++;
        if (!progress.errorMessages) progress.errorMessages = [];
        progress.errorMessages.push(`Erro ao migrar assistido ${oldAssistido.nomeCompleto || 'desconhecido'}: ${error}`);
      }
    }

    progress.status = 'completed';
    progress.errorMessages = progress.errorMessages || [];
    progress.errorMessages.unshift(`Novos: ${newRecords}, Atualizados: ${updatedRecords}, Erros: ${progress.errors}`);
    if (onProgress) onProgress({ ...progress });
  }

  /**
   * Migra membros com verificação de duplicados
   */
  private async migrateMembros(
    membrosData: Record<string, any>,
    progress: MigrationProgress,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    const membrosKeys = Object.keys(membrosData);
    let newRecords = 0;
    let updatedRecords = 0;

    for (let i = 0; i < membrosKeys.length; i++) {
      const key = membrosKeys[i];
      const oldMembro = membrosData[key];

      try {
        const dataNascimento = this.parseDate(oldMembro.dataNascimento);
        const dataBatismo = this.parseDate(oldMembro.dataBatismo);
        const membroDesde = this.parseDate(oldMembro.membroDesde);

        const member: Partial<Member> = {
          name: oldMembro.nomeCompleto || '',
          email: oldMembro.email || '',
          phone: oldMembro.telefone || '',
          birthDate: dataNascimento || new Date(),
          address: {
            street: oldMembro.endereco?.logradouro || '',
            number: String(oldMembro.endereco?.numero || ''),
            complement: oldMembro.endereco?.complemento || '',
            neighborhood: oldMembro.endereco?.bairro || '',
            city: oldMembro.endereco?.cidade || '',
            state: oldMembro.endereco?.estado || '',
            zipCode: oldMembro.endereco?.cep || '',
          },
          maritalStatus: this.mapMaritalStatus(oldMembro.estadoCivil || 1),
          status: oldMembro.situacao === 'Ativo' ? MemberStatus.Active : MemberStatus.Inactive,
          baptismDate: dataBatismo,
          conversionDate: membroDesde,
          ministries: [],
          observations: `CPF: ${oldMembro.cpf || 'N/A'} | RG: ${oldMembro.rg || 'N/A'} | Profissão: ${oldMembro.profissao || 'N/A'}`,
          createdAt: Timestamp.now().toDate(),
          updatedAt: Timestamp.now().toDate(),
          createdBy: 'migration',
        };

        // Verifica se já existe (por email)
        const existingId = await this.checkMembroExists(member.email || '');

        if (existingId) {
          // Atualiza registro existente
          const docRef = doc(db, 'members', existingId);
          await setDoc(docRef, { ...member, updatedAt: Timestamp.now().toDate() }, { merge: true });
          updatedRecords++;
        } else {
          // Cria novo registro
          const docRef = doc(collection(db, 'members'));
          await setDoc(docRef, member);
          newRecords++;
        }

        progress.processed++;
        if (onProgress && progress.processed % 5 === 0) {
          onProgress({ ...progress });
        }
      } catch (error) {
        progress.errors++;
        if (!progress.errorMessages) progress.errorMessages = [];
        progress.errorMessages.push(`Erro ao migrar membro ${oldMembro.nomeCompleto}: ${error}`);
      }
    }

    progress.status = 'completed';
    progress.errorMessages = progress.errorMessages || [];
    progress.errorMessages.unshift(`Novos: ${newRecords}, Atualizados: ${updatedRecords}, Erros: ${progress.errors}`);
    if (onProgress) onProgress({ ...progress });
  }

  /**
   * Migra eventos (eventos sempre cria novos, não atualiza)
   */
  private async migrateEventos(
    eventosData: Record<string, any>,
    progress: MigrationProgress,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<void> {
    const eventosKeys = Object.keys(eventosData);
    let newRecords = 0;

    for (let i = 0; i < eventosKeys.length; i++) {
      const key = eventosKeys[i];
      const oldEvento = eventosData[key];

      try {
        const dataEvento = this.parseDate(oldEvento.data);

        // Format location as string
        const locationParts = [
          oldEvento.local?.logradouro,
          oldEvento.local?.numero,
          oldEvento.local?.bairro,
          oldEvento.local?.cidade,
          oldEvento.local?.estado,
        ].filter(Boolean);
        const locationString = locationParts.length > 0 ? locationParts.join(', ') : '';

        const event: Partial<Event> = {
          title: oldEvento.nome || '',
          description: oldEvento.observacoes || '',
          date: dataEvento || new Date(),
          time: oldEvento.horarioInicio || '',
          location: locationString,
          responsible: oldEvento.responsavel || '',
          status: EventStatus.Scheduled,
          isPublic: true,
          requiresConfirmation: false,
          category: {
            id: 'default',
            name: 'Geral',
            color: '#3B82F6',
            priority: 0,
          },
          createdAt: Timestamp.now().toDate(),
          updatedAt: Timestamp.now().toDate(),
          createdBy: 'migration',
        };

        // Eventos sempre cria novos
        const docRef = doc(collection(db, 'events'));
        await setDoc(docRef, event);
        newRecords++;

        progress.processed++;
        if (onProgress && progress.processed % 5 === 0) {
          onProgress({ ...progress });
        }
      } catch (error) {
        progress.errors++;
        if (!progress.errorMessages) progress.errorMessages = [];
        progress.errorMessages.push(`Erro ao migrar evento ${oldEvento.nome}: ${error}`);
      }
    }

    progress.status = 'completed';
    progress.errorMessages = progress.errorMessages || [];
    progress.errorMessages.unshift(`Novos: ${newRecords}, Erros: ${progress.errors}`);
    if (onProgress) onProgress({ ...progress });
  }

  /**
   * Executa a migração completa
   */
  public async migrateData(
    data: OldData,
    onProgress?: (progress: MigrationProgress[]) => void
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const collections: MigrationProgress[] = [];

    try {
      // Preparar progresso para cada coleção
      if (data.assistidos) {
        collections.push({
          collection: 'assistidos',
          total: Object.keys(data.assistidos).length,
          processed: 0,
          errors: 0,
          status: 'pending',
        });
      }

      if (data.membros) {
        collections.push({
          collection: 'membros',
          total: Object.keys(data.membros).length,
          processed: 0,
          errors: 0,
          status: 'pending',
        });
      }

      if (data.eventos) {
        collections.push({
          collection: 'eventos',
          total: Object.keys(data.eventos).length,
          processed: 0,
          errors: 0,
          status: 'pending',
        });
      }

      // Migrar cada coleção
      for (const progress of collections) {
        progress.status = 'processing';
        if (onProgress) onProgress([...collections]);

        switch (progress.collection) {
          case 'assistidos':
            if (data.assistidos) {
              await this.migrateAssistidos(data.assistidos, progress, () => {
                if (onProgress) onProgress([...collections]);
              });
            }
            break;

          case 'membros':
            if (data.membros) {
              await this.migrateMembros(data.membros, progress, () => {
                if (onProgress) onProgress([...collections]);
              });
            }
            break;

          case 'eventos':
            if (data.eventos) {
              await this.migrateEventos(data.eventos, progress, () => {
                if (onProgress) onProgress([...collections]);
              });
            }
            break;
        }
      }

      const duration = Date.now() - startTime;
      const totalRecords = collections.reduce((sum, c) => sum + c.total, 0);
      const migratedRecords = collections.reduce((sum, c) => sum + c.processed, 0);
      const errors = collections.reduce((sum, c) => sum + c.errors, 0);

      return {
        success: true,
        totalRecords,
        migratedRecords,
        errors,
        collections,
        duration,
      };
    } catch (error) {
      throw new Error(`Erro na migração: ${error}`);
    }
  }

  /**
   * Valida o arquivo de dados antigos
   */
  public validateOldData(data: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== 'object') {
      errors.push('Arquivo de dados inválido');
      return { valid: false, errors };
    }

    const expectedCollections = ['assistidos', 'membros', 'eventos'];
    const foundCollections = Object.keys(data).filter(key => expectedCollections.includes(key));

    if (foundCollections.length === 0) {
      errors.push('Nenhuma coleção válida encontrada no arquivo');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
