// Infrastructure Service - Assistido Service
// Complete implementation for assisted people business operations

import { IAssistidoService } from 'domain/services/IAssistidoService';
import { FirebaseAssistidoRepository } from 'data/repositories/FirebaseAssistidoRepository';
import { NotificationService } from 'infrastructure/services/NotificationService';
import { 
  Assistido, 
  AssistidoEntity,
  StatusAssistido, 
  AtendimentoAssistido, 
  FamiliarAssistido,
  NecessidadeAssistido,
  TipoAtendimento
} from '../../domain/entities/Assistido';

export class AssistidoService implements IAssistidoService {
  private assistidoRepository = new FirebaseAssistidoRepository();
  private notificationService = new NotificationService();

  async createAssistido(assistido: Omit<Assistido, 'id' | 'createdAt' | 'updatedAt'>): Promise<Assistido> {
    try {
      // Validate required fields
      if (!assistido.nome || !assistido.telefone) {
        throw new Error('Nome e telefone são obrigatórios');
      }

      // Validate CPF if provided
      if (assistido.cpf && !AssistidoEntity.validarCPF(assistido.cpf)) {
        throw new Error('CPF inválido');
      }

      // Validate phone
      if (!AssistidoEntity.validarTelefone(assistido.telefone)) {
        throw new Error('Telefone inválido');
      }

      // Check if CPF already exists
      if (assistido.cpf) {
        const existingByCPF = await this.assistidoRepository.findByCPF(assistido.cpf);
        if (existingByCPF) {
          throw new Error('Já existe um assistido cadastrado com este CPF');
        }
      }

      // Format data
      const formattedAssistido = {
        ...assistido,
        telefone: AssistidoEntity.formatarTelefone(assistido.telefone),
        cpf: assistido.cpf ? AssistidoEntity.formatarCPF(assistido.cpf) : undefined,
        status: StatusAssistido.Ativo,
        dataInicioAtendimento: new Date(),
        atendimentos: assistido.atendimentos || [],
        familiares: assistido.familiares || []
      };

      return await this.assistidoRepository.create(formattedAssistido);
    } catch (error) {
      console.error('Error creating assistido:', error);
      throw error;
    }
  }

  async updateAssistido(id: string, data: Partial<Assistido>): Promise<Assistido> {
    try {
      // Validate CPF if being updated
      if (data.cpf && !AssistidoEntity.validarCPF(data.cpf)) {
        throw new Error('CPF inválido');
      }

      // Validate phone if being updated
      if (data.telefone && !AssistidoEntity.validarTelefone(data.telefone)) {
        throw new Error('Telefone inválido');
      }

      // Check if CPF already exists (excluding current assistido)
      if (data.cpf) {
        const existingByCPF = await this.assistidoRepository.findByCPF(data.cpf);
        if (existingByCPF && existingByCPF.id !== id) {
          throw new Error('Já existe um assistido cadastrado com este CPF');
        }
      }

      // Format data
      const formattedData = {
        ...data,
        telefone: data.telefone ? AssistidoEntity.formatarTelefone(data.telefone) : undefined,
        cpf: data.cpf ? AssistidoEntity.formatarCPF(data.cpf) : undefined
      };

      return await this.assistidoRepository.update(id, formattedData);
    } catch (error) {
      console.error('Error updating assistido:', error);
      throw error;
    }
  }

  async getAssistidoById(id: string): Promise<Assistido | null> {
    try {
      return await this.assistidoRepository.findById(id);
    } catch (error) {
      console.error('Error getting assistido by id:', error);
      throw new Error('Erro ao buscar assistido');
    }
  }

  async getAllAssistidos(): Promise<Assistido[]> {
    try {
      return await this.assistidoRepository.findAll();
    } catch (error) {
      console.error('Error getting all assistidos:', error);
      throw new Error('Erro ao buscar assistidos');
    }
  }

  async getAssistidosByStatus(status: StatusAssistido): Promise<Assistido[]> {
    try {
      return await this.assistidoRepository.findByStatus(status);
    } catch (error) {
      console.error('Error getting assistidos by status:', error);
      throw new Error('Erro ao buscar assistidos por status');
    }
  }

  async getAssistidosByNecessidade(necessidade: NecessidadeAssistido): Promise<Assistido[]> {
    try {
      return await this.assistidoRepository.findByNecessidade(necessidade);
    } catch (error) {
      console.error('Error getting assistidos by necessidade:', error);
      throw new Error('Erro ao buscar assistidos por necessidade');
    }
  }

  async getAssistidosByResponsible(responsible: string): Promise<Assistido[]> {
    try {
      return await this.assistidoRepository.findByResponsible(responsible);
    } catch (error) {
      console.error('Error getting assistidos by responsible:', error);
      throw new Error('Erro ao buscar assistidos por responsável');
    }
  }

  async getAssistidosNeedingAttention(): Promise<Assistido[]> {
    try {
      return await this.assistidoRepository.findNeedingAttention();
    } catch (error) {
      console.error('Error getting assistidos needing attention:', error);
      throw new Error('Erro ao buscar assistidos que precisam de atenção');
    }
  }

  async updateAssistidoStatus(id: string, status: StatusAssistido): Promise<void> {
    try {
      await this.assistidoRepository.updateStatus(id, status);
    } catch (error) {
      console.error('Error updating assistido status:', error);
      throw new Error('Erro ao atualizar status do assistido');
    }
  }

  async deactivateAssistido(id: string): Promise<void> {
    try {
      await this.assistidoRepository.updateStatus(id, StatusAssistido.Inativo);
    } catch (error) {
      console.error('Error deactivating assistido:', error);
      throw new Error('Erro ao desativar assistido');
    }
  }

  async deleteAssistido(id: string): Promise<void> {
    try {
      // Verify assistido exists before deleting
      const assistido = await this.assistidoRepository.findById(id);
      if (!assistido) {
        throw new Error('Assistido não encontrado');
      }

      // Delete physically
      await this.assistidoRepository.deletePhysically(id);
      
      // Create log entry
      console.log(`Assistido ${assistido.nome} (ID: ${id}) foi excluído permanentemente`);
    } catch (error) {
      console.error('Error deleting assistido:', error);
      throw error;
    }
  }

  async addAtendimento(assistidoId: string, atendimento: Omit<AtendimentoAssistido, 'id'>): Promise<void> {
    try {
      // Validate atendimento data
      if (!atendimento.tipo || !atendimento.descricao || !atendimento.responsavel) {
        throw new Error('Tipo, descrição e responsável são obrigatórios para o atendimento');
      }

      // Validate donation items if provided
      if (atendimento.itensDoados) {
        for (const item of atendimento.itensDoados) {
          if (!item.item || !item.quantidade || !item.unidade) {
            throw new Error('Item, quantidade e unidade são obrigatórios para itens doados');
          }
        }
      }

      await this.assistidoRepository.addAtendimento(assistidoId, atendimento);

      // Send notification for important attendance types
      if (atendimento.tipo === TipoAtendimento.AuxilioFinanceiro || 
          atendimento.tipo === TipoAtendimento.EncaminhamentoMedico) {
        const assistido = await this.assistidoRepository.findById(assistidoId);
        if (assistido) {
          await this.notificationService.createCustomNotification(
            'Novo Atendimento Importante',
            `${assistido.nome} recebeu atendimento: ${atendimento.tipo}`,
            'roles',
            {
              roles: ['admin', 'assistencia_social']
            }
          );
        }
      }
    } catch (error) {
      console.error('Error adding atendimento:', error);
      throw error;
    }
  }

  async addFamiliar(assistidoId: string, familiar: Omit<FamiliarAssistido, 'id'>): Promise<void> {
    try {
      // Validate familiar data
      if (!familiar.nome || !familiar.parentesco) {
        throw new Error('Nome e parentesco são obrigatórios para o familiar');
      }

      // Validate phone if provided
      if (familiar.telefone && !AssistidoEntity.validarTelefone(familiar.telefone)) {
        throw new Error('Telefone do familiar é inválido');
      }

      // Validate CPF if provided
      if (familiar.cpf && !AssistidoEntity.validarCPF(familiar.cpf)) {
        throw new Error('CPF do familiar é inválido');
      }

      // Format data
      const formattedFamiliar = {
        ...familiar,
        telefone: familiar.telefone ? AssistidoEntity.formatarTelefone(familiar.telefone) : undefined,
        cpf: familiar.cpf ? AssistidoEntity.formatarCPF(familiar.cpf) : undefined
      };

      await this.assistidoRepository.addFamiliar(assistidoId, formattedFamiliar);
    } catch (error) {
      console.error('Error adding familiar:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalAtivos: number;
    totalInativos: number;
    necessidadeMaisComum: NecessidadeAssistido | null;
    atendimentosUltimos30Dias: number;
    familiasTotais: number;
    rendaMediaFamiliar: number;
    idadeMedia: number;
    distribuicaoNecessidades: Record<NecessidadeAssistido, number>;
  }> {
    try {
      const baseStats = await this.assistidoRepository.getStatistics();
      const allAssistidos = await this.assistidoRepository.findAll();
      
      // Calculate additional statistics
      const assistidosAtivos = allAssistidos.filter(a => a.status === StatusAssistido.Ativo);
      
      const rendaMediaFamiliar = assistidosAtivos
        .filter(a => a.rendaFamiliar && a.rendaFamiliar > 0)
        .reduce((sum, a, _, arr) => sum + (a.rendaFamiliar! / arr.length), 0);

      const idadeMedia = assistidosAtivos
        .reduce((sum, a, _, arr) => sum + (AssistidoEntity.calcularIdade(a.dataNascimento) / arr.length), 0);

      // Distribution of necessidades
      const distribuicaoNecessidades: Record<NecessidadeAssistido, number> = {} as Record<NecessidadeAssistido, number>;
      Object.values(NecessidadeAssistido).forEach(necessidade => {
        distribuicaoNecessidades[necessidade] = 0;
      });

      assistidosAtivos.forEach(assistido => {
        assistido.necessidades.forEach(necessidade => {
          distribuicaoNecessidades[necessidade]++;
        });
      });

      return {
        ...baseStats,
        rendaMediaFamiliar: Math.round(rendaMediaFamiliar * 100) / 100,
        idadeMedia: Math.round(idadeMedia),
        distribuicaoNecessidades
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new Error('Erro ao obter estatísticas');
    }
  }

  async generateReport(filters?: {
    status?: StatusAssistido;
    necessidade?: NecessidadeAssistido;
    responsible?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    assistidos: Assistido[];
    totalAtendimentos: number;
    valorTotalDoacoes: number;
    necessidadesMaisComuns: Array<{ necessidade: NecessidadeAssistido; count: number }>;
  }> {
    try {
      let assistidos: Assistido[] = [];

      // Apply filters
      if (filters?.status) {
        assistidos = await this.assistidoRepository.findByStatus(filters.status);
      } else if (filters?.necessidade) {
        assistidos = await this.assistidoRepository.findByNecessidade(filters.necessidade);
      } else if (filters?.responsible) {
        assistidos = await this.assistidoRepository.findByResponsible(filters.responsible);
      } else {
        assistidos = await this.assistidoRepository.findAll();
      }

      // Filter by date range if provided
      if (filters?.startDate && filters?.endDate) {
        assistidos = assistidos.filter(assistido => {
          const inicioAtendimento = assistido.dataInicioAtendimento;
          return inicioAtendimento >= filters.startDate! && inicioAtendimento <= filters.endDate!;
        });
      }

      // Calculate report metrics
      const totalAtendimentos = assistidos.reduce((sum, a) => sum + a.atendimentos.length, 0);
      
      const valorTotalDoacoes = assistidos.reduce((sum, a) => {
        return sum + a.atendimentos.reduce((atSum, at) => atSum + (at.valorDoacao || 0), 0);
      }, 0);

      // Count necessidades
      const necessidadeCount: Record<NecessidadeAssistido, number> = {} as Record<NecessidadeAssistido, number>;
      assistidos.forEach(assistido => {
        assistido.necessidades.forEach(necessidade => {
          necessidadeCount[necessidade] = (necessidadeCount[necessidade] || 0) + 1;
        });
      });

      const necessidadesMaisComuns = Object.entries(necessidadeCount)
        .map(([necessidade, count]) => ({ necessidade: necessidade as NecessidadeAssistido, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return {
        assistidos,
        totalAtendimentos,
        valorTotalDoacoes,
        necessidadesMaisComuns
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Erro ao gerar relatório');
    }
  }
}
