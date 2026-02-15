// Infrastructure Service - Assistência Service
// Complete implementation for assistance business operations

import {
  IProfissionalAssistenciaService,
  IAgendamentoAssistenciaService
} from '@modules/assistance/assistencia/domain/services/IAssistenciaService';
import { FirebaseProfissionalAssistenciaRepository } from '@modules/assistance/professional/infrastructure/repositories/FirebaseProfissionalAssistenciaRepository';
import { FirebaseAgendamentoAssistenciaRepository } from '@modules/assistance/agendamento/infrastructure/repositories/FirebaseAgendamentoAssistenciaRepository';
import { FirebaseUserRepository } from '@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository';
import { NotificationService } from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/config/firebase';
import {
  ProfissionalAssistencia,
  AgendamentoAssistencia,
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  EstatisticasAssistencia,
  HorarioFuncionamento,
  AssistenciaEntity
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import {
  ProfissionalFilters,
  AgendamentoFilters
} from '@modules/assistance/assistencia/domain/repositories/IAssistenciaRepository';

export class ProfissionalAssistenciaService implements IProfissionalAssistenciaService {
  private profissionalRepository = new FirebaseProfissionalAssistenciaRepository();
  private userRepository = new FirebaseUserRepository();
  private notificationService = new NotificationService();

  private generateTemporaryPassword(): string {
    // Generate a secure temporary password
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    
    // Ensure at least one of each type
    password += 'A'; // Uppercase
    password += 'a'; // Lowercase
    password += '1'; // Number
    password += '@'; // Special char
    
    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  }

  async createProfissional(profissional: Omit<ProfissionalAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<ProfissionalAssistencia> {
    try {
      // Validate required fields
      const validationErrors = await this.validateProfissionalData(profissional);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Check if CPF already exists
      if (profissional.cpf) {
        const existingByCPF = await this.profissionalRepository.findByCPF(profissional.cpf);
        if (existingByCPF) {
          throw new Error('Já existe um profissional cadastrado com este CPF');
        }
      }

      // Check if email already exists
      if (profissional.email) {
        const existingByEmail = await this.profissionalRepository.findByEmail(profissional.email);
        if (existingByEmail) {
          throw new Error('Já existe um profissional cadastrado com este email');
        }
      }

      // Check if registro profissional already exists
      const existingByRegistro = await this.profissionalRepository.findByRegistroProfissional(profissional.registroProfissional);
      if (existingByRegistro) {
        throw new Error('Já existe um profissional cadastrado com este registro profissional');
      }

      // Format data
      const formattedProfissional: any = {
        nome: profissional.nome,
        telefone: AssistenciaEntity.formatarTelefone(profissional.telefone),
        email: profissional.email,
        endereco: profissional.endereco ? {
          ...profissional.endereco,
          cep: profissional.endereco.cep ? AssistenciaEntity.formatarCEP(profissional.endereco.cep) : ''
        } : {
          cep: '',
          logradouro: '',
          numero: '',
          complemento: '',
          bairro: '',
          cidade: '',
          estado: ''
        },
        especialidade: profissional.especialidade,
        subespecialidades: profissional.subespecialidades || [],
        registroProfissional: profissional.registroProfissional,
        status: StatusProfissional.Ativo,
        dataCadastro: new Date(),
        horariosFuncionamento: profissional.horariosFuncionamento || [],
        valorConsulta: profissional.valorConsulta,
        tempoConsulta: profissional.tempoConsulta,
        modalidadesAtendimento: profissional.modalidadesAtendimento || [],
        documentos: profissional.documentos || [],
        avaliacoes: [],
        createdBy: profissional.createdBy
      };

      // Only add optional fields if they have values
      if (profissional.cpf && profissional.cpf.trim()) {
        formattedProfissional.cpf = AssistenciaEntity.formatarCPF(profissional.cpf);
      }
      if (profissional.rg && profissional.rg.trim()) {
        formattedProfissional.rg = profissional.rg;
      }
      if (profissional.observacoes && profissional.observacoes.trim()) {
        formattedProfissional.observacoes = profissional.observacoes;
      }
      if (profissional.linkConsultaOnline && profissional.linkConsultaOnline.trim()) {
        formattedProfissional.linkConsultaOnline = profissional.linkConsultaOnline;
      }

      // Create professional record first
      const novoProfissional = await this.profissionalRepository.create(formattedProfissional);
      
      // Return immediately without creating user account to avoid auth issues
      // User account creation will be handled separately when needed
      console.log('✅ Professional created successfully:', novoProfissional.id);

      // Send notification for new professional (with error handling)
      try {
        const notificationMessage = `${novoProfissional.nome} foi cadastrado como profissional de ${AssistenciaEntity.formatarTipoAssistencia(novoProfissional.especialidade)}`;
        
        await this.notificationService.createCustomNotification(
          'Novo Profissional Cadastrado',
          notificationMessage,
          'roles',
          {
            roles: ['admin', 'secretaria']
          }
        );
      } catch (notificationError) {
        console.warn('Failed to create notification (professional was created successfully):', notificationError);
        // Don't fail the operation if notification fails
      }

      return novoProfissional;
    } catch (error) {
      console.error('Error creating profissional:', error);
      throw error;
    }
  }

  async updateProfissional(id: string, data: Partial<ProfissionalAssistencia>): Promise<ProfissionalAssistencia> {
    try {
      // Validate data if provided
      const validationErrors = await this.validateProfissionalData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Check if CPF already exists (excluding current profissional)
      if (data.cpf) {
        const existingByCPF = await this.profissionalRepository.findByCPF(data.cpf);
        if (existingByCPF && existingByCPF.id !== id) {
          throw new Error('Já existe um profissional cadastrado com este CPF');
        }
      }

      // Check if email already exists (excluding current profissional)
      if (data.email) {
        const existingByEmail = await this.profissionalRepository.findByEmail(data.email);
        if (existingByEmail && existingByEmail.id !== id) {
          throw new Error('Já existe um profissional cadastrado com este email');
        }
      }

      // Format data
      const formattedData: any = { ...data };
      if (data.telefone) {
        formattedData.telefone = AssistenciaEntity.formatarTelefone(data.telefone);
      }
      if (data.cpf) {
        formattedData.cpf = AssistenciaEntity.formatarCPF(data.cpf);
      }
      if (data.endereco?.cep) {
        formattedData.endereco = {
          ...data.endereco,
          cep: AssistenciaEntity.formatarCEP(data.endereco.cep)
        };
      }

      return await this.profissionalRepository.update(id, formattedData);
    } catch (error) {
      console.error('Error updating profissional:', error);
      throw error;
    }
  }

  async getProfissionalById(id: string): Promise<ProfissionalAssistencia | null> {
    try {
      return await this.profissionalRepository.findById(id);
    } catch (error) {
      console.error('Error getting profissional by id:', error);
      throw new Error('Erro ao buscar profissional');
    }
  }

  async getAllProfissionais(): Promise<ProfissionalAssistencia[]> {
    try {
      return await this.profissionalRepository.findAll();
    } catch (error) {
      console.error('Error getting all profissionais:', error);
      throw new Error('Erro ao buscar profissionais');
    }
  }

  async inativarProfissional(id: string, motivo?: string): Promise<void> {
    try {
      // Verify profissional exists before inactivating
      const profissional = await this.profissionalRepository.findById(id);
      if (!profissional) {
        throw new Error('Profissional não encontrado');
      }

      // Update status to inactive
      const updateData = {
        status: StatusProfissional.Inativo,
        dataInativacao: new Date(),
        motivoInativacao: motivo || 'Inativação manual',
        updatedAt: new Date()
      };

      await this.profissionalRepository.update(id, updateData);
      
      // Send notification about professional inactivation
      try {
        await this.notificationService.createCustomNotification(
          'Profissional Inativado',
          `${profissional.nome} foi inativado da lista de profissionais de ${AssistenciaEntity.formatarTipoAssistencia(profissional.especialidade)}`,
          'roles',
          {
            roles: ['admin', 'secretaria']
          }
        );
      } catch (notificationError) {
        console.warn('Failed to create inactivation notification:', notificationError);
        // Don't fail the operation if notification fails
      }
    } catch (error) {
      console.error('Error inactivating professional:', error);
      throw new Error('Erro ao inativar profissional');
    }
  }

  async deleteProfissionalPermanente(id: string, forceDelete: boolean = false): Promise<void> {
    try {
      // Verify profissional exists before deleting
      const profissional = await this.profissionalRepository.findById(id);
      if (!profissional) {
        throw new Error('Profissional não encontrado');
      }

      console.log('🗑️ Deleting professional account via Cloud Function');

      // If professional has a user account, delete it using Cloud Function
      if (profissional.userId) {
        try {
          const deleteProfessionalAccount = httpsCallable(functions, 'deleteProfessionalAccount');
          
          const result = await deleteProfessionalAccount({
            userId: profissional.userId,
            professionalId: id,
            forceDelete
          });
          
          const data = result.data as { success: boolean; message?: string };
          console.log('✅ Professional account deleted via Cloud Function:', data.message);
        } catch (cloudError: any) {
          console.error('Error deleting user account via Cloud Function:', cloudError);
          
          if (cloudError.code === 'functions/failed-precondition') {
            throw new Error(cloudError.message);
          }
          
          // If Cloud Function fails but we want to continue, just log and continue
          console.warn('Continuing with professional deletion despite Cloud Function error');
        }
      } else {
        // If no user account, just delete the professional document
        console.log('Professional has no user account, deleting professional document only');
        
        // Check appointments if not forcing
        if (!forceDelete) {
          try {
            const agendamentoService = new AgendamentoAssistenciaService();
            const agendamentos = await agendamentoService.getAgendamentosByProfissional(id);
            
            if (agendamentos.length > 0) {
              throw new Error(`Não é possível excluir permanentemente. O profissional possui ${agendamentos.length} agendamento(s) no histórico. Use a opção "Inativar" ou force a exclusão.`);
            }
          } catch (appointmentError: any) {
            if (appointmentError.message.includes('agendamento')) {
              throw appointmentError;
            }
            console.warn('Could not check appointments:', appointmentError.message);
          }
        }
        
        await this.profissionalRepository.deletePhysically(id);
      }
      
      // Send notification about professional deletion
      try {
        await this.notificationService.createCustomNotification(
          'Profissional Excluído Permanentemente',
          `${profissional.nome} foi excluído permanentemente da lista de profissionais de ${AssistenciaEntity.formatarTipoAssistencia(profissional.especialidade)}`,
          'roles',
          {
            roles: ['admin', 'secretaria']
          }
        );
      } catch (notificationError) {
        console.warn('Failed to create deletion notification:', notificationError);
        // Don't fail the operation if notification fails
      }
    } catch (error) {
      console.error('Error permanently deleting professional:', error);
      throw error; // Re-throw to preserve original error
    }
  }

  async getProfissionaisByTipo(tipo: TipoAssistencia): Promise<ProfissionalAssistencia[]> {
    try {
      return await this.profissionalRepository.findByTipo(tipo);
    } catch (error) {
      console.error('Error getting profissionais by tipo:', error);
      throw new Error('Erro ao buscar profissionais por tipo');
    }
  }

  async getProfissionaisAtivos(): Promise<ProfissionalAssistencia[]> {
    try {
      return await this.profissionalRepository.findByStatus(StatusProfissional.Ativo);
    } catch (error) {
      console.error('Error getting profissionais ativos:', error);
      throw new Error('Erro ao buscar profissionais ativos');
    }
  }

  async searchProfissionais(query: string): Promise<ProfissionalAssistencia[]> {
    try {
      return await this.profissionalRepository.searchProfissionais(query);
    } catch (error) {
      console.error('Error searching profissionais:', error);
      throw new Error('Erro ao pesquisar profissionais');
    }
  }

  async getProfissionaisDisponiveis(tipo: TipoAssistencia, data: Date): Promise<ProfissionalAssistencia[]> {
    try {
      return await this.profissionalRepository.findDisponiveis(tipo, data);
    } catch (error) {
      console.error('Error getting profissionais disponíveis:', error);
      throw new Error('Erro ao buscar profissionais disponíveis');
    }
  }

  async activateProfissional(id: string): Promise<void> {
    try {
      await this.profissionalRepository.activateProfissional(id);
    } catch (error) {
      console.error('Error activating profissional:', error);
      throw error;
    }
  }

  async deactivateProfissional(id: string, motivo?: string): Promise<void> {
    try {
      await this.profissionalRepository.deactivateProfissional(id, motivo);
    } catch (error) {
      console.error('Error deactivating profissional:', error);
      throw error;
    }
  }

  async updateStatusProfissional(id: string, status: StatusProfissional, motivo?: string): Promise<void> {
    try {
      await this.profissionalRepository.updateStatus(id, status, motivo);
    } catch (error) {
      console.error('Error updating profissional status:', error);
      throw error;
    }
  }

  async updateHorariosFuncionamento(id: string, horarios: HorarioFuncionamento[]): Promise<void> {
    try {
      await this.profissionalRepository.update(id, { horariosFuncionamento: horarios });
    } catch (error) {
      console.error('Error updating horários funcionamento:', error);
      throw error;
    }
  }

  async getHorariosDisponiveis(profissionalId: string, dataInicio: Date, dataFim: Date): Promise<Date[]> {
    try {
      const profissional = await this.profissionalRepository.findById(profissionalId);
      if (!profissional) {
        throw new Error('Profissional não encontrado');
      }

      // Check if professional has working hours configured, provide defaults if not
      if (!profissional.horariosFuncionamento || profissional.horariosFuncionamento.length === 0) {
        profissional.horariosFuncionamento = [
          { diaSemana: 1, horaInicio: '07:00', horaFim: '21:00' }, // Monday
          { diaSemana: 2, horaInicio: '07:00', horaFim: '21:00' }, // Tuesday
          { diaSemana: 3, horaInicio: '07:00', horaFim: '21:00' }, // Wednesday
          { diaSemana: 4, horaInicio: '07:00', horaFim: '21:00' }, // Thursday
          { diaSemana: 5, horaInicio: '07:00', horaFim: '21:00' }, // Friday
        ];
      }
      
      // Check if professional has consultation duration configured
      if (!profissional.tempoConsulta || profissional.tempoConsulta <= 0) {
        profissional.tempoConsulta = 50;
      }

      // Get existing appointments for the professional in the date range
      const agendamentoRepository = new FirebaseAgendamentoAssistenciaRepository();
      const agendamentosExistentes = await agendamentoRepository.findByProfissionalAndDateRange(
        profissionalId, 
        dataInicio, 
        dataFim
      );

      return AssistenciaEntity.obterProximosHorariosDisponiveis(
        profissional, 
        dataInicio, 
        dataFim, 
        agendamentosExistentes
      );
    } catch (error) {
      console.error('Error getting horários disponíveis:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<{
    totalProfissionais: number;
    totalAtivos: number;
    totalInativos: number;
    porTipo: Record<TipoAssistencia, number>;
    porStatus: Record<StatusProfissional, number>;
    avaliacaoMedia: number;
  }> {
    try {
      const baseStats = await this.profissionalRepository.getStatistics();
      const allProfissionais = await this.profissionalRepository.findAll();
      
      // Calculate average rating
      const avaliacoesComNota = allProfissionais.flatMap(p => p.avaliacoes.filter(a => a.nota > 0));
      const avaliacaoMedia = avaliacoesComNota.length > 0
        ? avaliacoesComNota.reduce((sum, a) => sum + a.nota, 0) / avaliacoesComNota.length
        : 0;

      return {
        ...baseStats,
        avaliacaoMedia: Math.round(avaliacaoMedia * 100) / 100
      };
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new Error('Erro ao obter estatísticas');
    }
  }

  async generateReport(filters?: ProfissionalFilters): Promise<{
    profissionais: ProfissionalAssistencia[];
    totalProfissionais: number;
    distribuicaoTipos: Record<TipoAssistencia, number>;
    distribuicaoStatus: Record<StatusProfissional, number>;
    cidadesMaisComuns: Array<{ cidade: string; count: number }>;
  }> {
    try {
      let profissionais = await this.profissionalRepository.findAll();

      // Apply filters if provided
      if (filters?.tipo) {
        profissionais = profissionais.filter(p => p.especialidade === filters.tipo);
      }
      if (filters?.status) {
        profissionais = profissionais.filter(p => p.status === filters.status);
      }
      if (filters?.cidade) {
        profissionais = profissionais.filter(p => 
          p.endereco.cidade.toLowerCase().includes(filters.cidade!.toLowerCase())
        );
      }

      const totalProfissionais = profissionais.length;

      // Distribution by type
      const distribuicaoTipos: Record<TipoAssistencia, number> = {} as Record<TipoAssistencia, number>;
      Object.values(TipoAssistencia).forEach(tipo => {
        distribuicaoTipos[tipo] = profissionais.filter(p => p.especialidade === tipo).length;
      });

      // Distribution by status
      const distribuicaoStatus: Record<StatusProfissional, number> = {} as Record<StatusProfissional, number>;
      Object.values(StatusProfissional).forEach(status => {
        distribuicaoStatus[status] = profissionais.filter(p => p.status === status).length;
      });

      // Most common cities
      const cidadeCount: Record<string, number> = {};
      profissionais.forEach(profissional => {
        const cidade = profissional.endereco.cidade;
        cidadeCount[cidade] = (cidadeCount[cidade] || 0) + 1;
      });

      const cidadesMaisComuns = Object.entries(cidadeCount)
        .map(([cidade, count]) => ({ cidade, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return {
        profissionais,
        totalProfissionais,
        distribuicaoTipos,
        distribuicaoStatus,
        cidadesMaisComuns
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Erro ao gerar relatório');
    }
  }

  async validateProfissionalData(profissional: Partial<ProfissionalAssistencia>): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (profissional.nome && !profissional.nome.trim()) {
      errors.push('Nome é obrigatório');
    }

    if (profissional.telefone && !AssistenciaEntity.validarTelefone(profissional.telefone)) {
      errors.push('Telefone inválido');
    }

    if (profissional.cpf && !AssistenciaEntity.validarCPF(profissional.cpf)) {
      errors.push('CPF inválido');
    }

    if (profissional.email && !AssistenciaEntity.validarEmail(profissional.email)) {
      errors.push('Email inválido');
    }

    // Address validation
    if (profissional.endereco) {
      if (!profissional.endereco.logradouro?.trim()) {
        errors.push('Logradouro é obrigatório');
      }
      if (!profissional.endereco.bairro?.trim()) {
        errors.push('Bairro é obrigatório');
      }
      if (!profissional.endereco.cidade?.trim()) {
        errors.push('Cidade é obrigatória');
      }
      if (!profissional.endereco.estado?.trim()) {
        errors.push('Estado é obrigatório');
      }
      if (!profissional.endereco.cep?.trim()) {
        errors.push('CEP é obrigatório');
      }
    }

    return errors;
  }

  async checkRegistroProfissionalExists(registro: string, excludeId?: string): Promise<boolean> {
    try {
      const existingProfissional = await this.profissionalRepository.findByRegistroProfissional(registro);
      return existingProfissional !== null && existingProfissional.id !== excludeId;
    } catch (error) {
      console.error('Error checking registro profissional exists:', error);
      return false;
    }
  }

  async checkCPFExists(cpf: string, excludeId?: string): Promise<boolean> {
    try {
      const existingProfissional = await this.profissionalRepository.findByCPF(cpf);
      return existingProfissional !== null && existingProfissional.id !== excludeId;
    } catch (error) {
      console.error('Error checking CPF exists:', error);
      return false;
    }
  }

  async getProfissionalByEmail(email: string): Promise<ProfissionalAssistencia | null> {
    try {
      return await this.profissionalRepository.findByEmail(email);
    } catch (error) {
      console.error('Error getting profissional by email:', error);
      throw new Error('Erro ao buscar profissional por email');
    }
  }

  async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
    try {
      const existingProfissional = await this.profissionalRepository.findByEmail(email);
      return existingProfissional !== null && existingProfissional.id !== excludeId;
    } catch (error) {
      console.error('Error checking email exists:', error);
      return false;
    }
  }

  async createUserAccountForProfessional(professionalId: string): Promise<{
    success: boolean;
    temporaryPassword?: string;
    error?: string;
    requiresReauth?: boolean;
    userId?: string;
  }> {
    try {
      const profissional = await this.profissionalRepository.findById(professionalId);
      if (!profissional) {
        return { success: false, error: 'Profissional não encontrado' };
      }

      if (profissional.userId) {
        return { success: false, error: 'Profissional já possui conta de usuário' };
      }

      // Generate a temporary password
      const temporaryPassword = this.generateTemporaryPassword();
      
      console.log('🚀 Creating professional account via Cloud Function');
      
      // Call Cloud Function to create user account (região Brasil)
      const createProfessionalAccount = httpsCallable(functions, 'createProfessionalAccount');
      
      const result = await createProfessionalAccount({
        email: profissional.email,
        password: temporaryPassword,
        professionalData: {
          id: professionalId,
          nome: profissional.nome,
          telefone: profissional.telefone
        }
      });
      
      const data = result.data as { success: boolean; userId?: string; message?: string };
      
      if (data.success) {
        console.log('✅ Cloud Function executed successfully:', data.message);
        return {
          success: true,
          temporaryPassword,
          requiresReauth: false, // Admin stays logged in
          userId: data.userId
        };
      } else {
        throw new Error('Cloud Function returned unsuccessful result');
      }
      
    } catch (error: any) {
      console.error('❌ Error creating professional account via Cloud Function:', error);
      
      let errorMessage = 'Erro desconhecido ao criar conta';
      
      if (error.code === 'functions/already-exists') {
        errorMessage = 'Este email já está cadastrado no sistema';
      } else if (error.code === 'functions/permission-denied') {
        errorMessage = 'Você não tem permissão para criar contas de profissionais';
      } else if (error.code === 'functions/unauthenticated') {
        errorMessage = 'Você precisa estar autenticado para criar contas';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return {
        success: false,
        error: errorMessage,
        requiresReauth: false
      };
    }
  }

}

export class AgendamentoAssistenciaService implements IAgendamentoAssistenciaService {
  private agendamentoRepository = new FirebaseAgendamentoAssistenciaRepository();
  private profissionalRepository = new FirebaseProfissionalAssistenciaRepository();
  private notificationService = new NotificationService();

  async createAgendamento(agendamento: Omit<AgendamentoAssistencia, 'id' | 'createdAt' | 'updatedAt'>): Promise<AgendamentoAssistencia> {
    try {
      // Validate required fields
      const validationErrors = await this.validateAgendamentoData(agendamento);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      // Check availability
      const isAvailable = await this.verificarDisponibilidade(
        agendamento.profissionalId,
        agendamento.dataHoraAgendamento,
        new Date(agendamento.dataHoraFim).getTime() - new Date(agendamento.dataHoraAgendamento).getTime()
      );

      if (!isAvailable) {
        throw new Error('Horário não disponível para este profissional');
      }

      // Format data
      const formattedAgendamento: any = {
        ...agendamento,
        status: StatusAgendamento.Agendado,
        historico: [{
          id: `hist_${Date.now()}`,
          dataHora: new Date(),
          acao: 'criado',
          statusNovo: StatusAgendamento.Agendado,
          observacoes: 'Agendamento criado',
          responsavel: agendamento.createdBy
        }],
        anexos: agendamento.anexos || []
      };

      // Calculate final value
      if (agendamento.valor) {
        formattedAgendamento.valorFinal = AssistenciaEntity.calcularValorFinalConsulta(
          agendamento.valor,
          agendamento.desconto || 0
        );
      }

      const novoAgendamento = await this.agendamentoRepository.create(formattedAgendamento);

      // Send notification for new appointment
      await this.notificationService.createCustomNotification(
        'Novo Agendamento',
        `${novoAgendamento.pacienteNome} agendou ${AssistenciaEntity.formatarTipoAssistencia(novoAgendamento.tipoAssistencia)} com ${novoAgendamento.profissionalNome}`,
        'roles',
        {
          roles: ['admin', 'secretaria']
        }
      );

      return novoAgendamento;
    } catch (error) {
      console.error('Error creating agendamento:', error);
      throw error;
    }
  }

  async updateAgendamento(id: string, data: Partial<AgendamentoAssistencia>): Promise<AgendamentoAssistencia> {
    try {
      // Validate data if provided
      const validationErrors = await this.validateAgendamentoData(data);
      if (validationErrors.length > 0) {
        throw new Error(validationErrors.join(', '));
      }

      return await this.agendamentoRepository.update(id, data);
    } catch (error) {
      console.error('Error updating agendamento:', error);
      throw error;
    }
  }

  async getAgendamentoById(id: string): Promise<AgendamentoAssistencia | null> {
    try {
      return await this.agendamentoRepository.findById(id);
    } catch (error) {
      console.error('Error getting agendamento by id:', error);
      throw new Error('Erro ao buscar agendamento');
    }
  }

  async getAllAgendamentos(): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.findAll();
    } catch (error) {
      console.error('Error getting all agendamentos:', error);
      throw new Error('Erro ao buscar agendamentos');
    }
  }

  async deleteAgendamento(id: string): Promise<void> {
    try {
      await this.agendamentoRepository.deletePhysically(id);
    } catch (error) {
      console.error('Error deleting agendamento:', error);
      throw error;
    }
  }

  async getAgendamentosByPaciente(pacienteId: string): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.findByPaciente(pacienteId);
    } catch (error) {
      console.error('Error getting agendamentos by paciente:', error);
      throw new Error('Erro ao buscar agendamentos do paciente');
    }
  }

  async getAgendamentosByProfissional(profissionalId: string): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.findByProfissional(profissionalId);
    } catch (error) {
      console.error('Error getting agendamentos by profissional:', error);
      throw new Error('Erro ao buscar agendamentos do profissional');
    }
  }

  async getAgendamentosHoje(): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.findAgendamentosHoje();
    } catch (error) {
      console.error('Error getting agendamentos hoje:', error);
      throw new Error('Erro ao buscar agendamentos de hoje');
    }
  }

  async getProximosAgendamentos(profissionalId?: string, limite?: number): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.findProximosAgendamentos(profissionalId || '', limite);
    } catch (error) {
      console.error('Error getting próximos agendamentos:', error);
      throw new Error('Erro ao buscar próximos agendamentos');
    }
  }

  async getAgendamentosPorPeriodo(dataInicio: Date, dataFim: Date): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.getAgendamentosPorPeriodo(dataInicio, dataFim);
    } catch (error) {
      console.error('Error getting agendamentos por período:', error);
      throw new Error('Erro ao buscar agendamentos por período');
    }
  }

  async searchAgendamentos(query: string): Promise<AgendamentoAssistencia[]> {
    try {
      return await this.agendamentoRepository.searchAgendamentos(query);
    } catch (error) {
      console.error('Error searching agendamentos:', error);
      throw new Error('Erro ao pesquisar agendamentos');
    }
  }

  async confirmarAgendamento(id: string, responsavel: string): Promise<void> {
    try {
      // First confirm the appointment
      await this.agendamentoRepository.confirmarAgendamento(id, responsavel);
      
      // Then create a patient record automatically
      await this.createFichaFromAgendamento(id, responsavel);
    } catch (error) {
      console.error('Error confirming agendamento:', error);
      throw error;
    }
  }

  private async createFichaFromAgendamento(agendamentoId: string, responsavel: string): Promise<void> {
    try {
      // Get the appointment details
      const agendamento = await this.agendamentoRepository.findById(agendamentoId);
      if (!agendamento) {
        console.warn('Appointment not found, cannot create ficha:', agendamentoId);
        return;
      }

      // Import the ficha repository and entity
      const { FirebaseFichaAcompanhamentoRepository } = await import('@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository');
      const { FichaAcompanhamentoEntity } = await import('@modules/assistance/fichas/domain/entities/FichaAcompanhamento');
      
      const fichaRepository = new FirebaseFichaAcompanhamentoRepository();

      // Check if a ficha already exists for this patient and professional
      const fichasExistentes = await fichaRepository.getFichasByPaciente(agendamento.pacienteId);
      const fichaExistente = fichasExistentes.find(f => 
        f.profissionalId === agendamento.profissionalId && 
        ['ativo', 'pausado'].includes(f.status)
      );

      if (fichaExistente) {
        console.log('Patient already has an active record with this professional, skipping creation');
        return;
      }

      // Get professional details
      const profissional = await this.profissionalRepository.findById(agendamento.profissionalId);
      if (!profissional) {
        console.warn('Professional not found, cannot create ficha:', agendamento.profissionalId);
        return;
      }

      // Prepare specialized data from agendamento if available
      console.log('🔍 Verificando dados específicos do agendamento:', {
        dadosEspecificos: agendamento.dadosEspecificos,
        tipoAssistencia: agendamento.tipoAssistencia
      });
      
      let dadosEspecializados: any = {};
      
      if (agendamento.dadosEspecificos) {
        console.log('✅ Agendamento tem dados específicos:', agendamento.dadosEspecificos);
        if (agendamento.tipoAssistencia === 'fisioterapia' && agendamento.dadosEspecificos.fisioterapia) {
          const fisioData = agendamento.dadosEspecificos.fisioterapia;
          dadosEspecializados.fisioterapia = {
            habitosVida: fisioData.habitosVida,
            hma: fisioData.hma,
            hmp: fisioData.hmp,
            antecedentesPessoais: fisioData.antecedentesPessoais,
            antecedentesFamiliares: fisioData.antecedentesFamiliares,
            tratamentosRealizados: fisioData.tratamentosRealizados,
            apresentacaoPaciente: fisioData.apresentacaoPaciente,
            examesComplementares: fisioData.examesComplementares,
            medicamentos: fisioData.medicamentos,
            cirurgias: fisioData.cirurgias,
            inspecaoPalpacao: fisioData.inspecaoPalpacao,
            semiologia: fisioData.semiologia,
            testesEspecificos: fisioData.testesEspecificos,
            escalaDor: fisioData.escalaDor,
            objetivosTratamento: fisioData.objetivosTratamento,
            recursosTerapeuticos: fisioData.recursosTerapeuticos,
            planoTratamento: fisioData.planoTratamento
          };
        }
        
        if (agendamento.tipoAssistencia === 'psicologica' && agendamento.dadosEspecificos.psicologia) {
          const psicoData = agendamento.dadosEspecificos.psicologia;
          dadosEspecializados.psicologia = {
            // 1. IDENTIFICAÇÃO
            nome: psicoData.nome || '',
            sexo: psicoData.sexo || '',
            trabalha: psicoData.trabalha,
            profissao: psicoData.profissao || '',
            religiao: psicoData.religiao || '',
            estadoCivil: psicoData.estadoCivil || '',
            filhos: psicoData.filhos || '',
            contato1: psicoData.contato1 || '',
            quemContato1: psicoData.quemContato1 || '',
            contato2: psicoData.contato2 || '',
            quemContato2: psicoData.quemContato2 || '',
            contato3: psicoData.contato3 || '',
            quemContato3: psicoData.quemContato3 || '',

            // 2. HISTÓRICO DO PACIENTE
            historicoPessoal: psicoData.historicoPessoal || '',

            // Histórico Familiar - Mãe
            maeViva: psicoData.maeViva,
            maeIdadeMorte: psicoData.maeIdadeMorte || '',
            idadeQuandoMaeMorreu: psicoData.idadeQuandoMaeMorreu || '',
            maeProfissao: psicoData.maeProfissao || '',
            relacionamentoMae: psicoData.relacionamentoMae || '',

            // Histórico Familiar - Pai
            paiVivo: psicoData.paiVivo,
            paiIdadeMorte: psicoData.paiIdadeMorte || '',
            idadeQuandoPaiMorreu: psicoData.idadeQuandoPaiMorreu || '',
            paiProfissao: psicoData.paiProfissao || '',
            relacionamentoPai: psicoData.relacionamentoPai || '',

            // Histórico Familiar - Irmãos
            filhoUnico: psicoData.filhoUnico,
            irmaosVivos: psicoData.irmaosVivos,
            quemMorreuIrmaos: psicoData.quemMorreuIrmaos || '',
            idadeMorteIrmaos: psicoData.idadeMorteIrmaos || '',
            idadeQuandoIrmasMorreram: psicoData.idadeQuandoIrmasMorreram || '',
            profissaoIrmaos: psicoData.profissaoIrmaos || '',
            relacionamentoIrmaos: psicoData.relacionamentoIrmaos || '',

            // Histórico Familiar - Filhos
            filhosVivos: psicoData.filhosVivos,
            quemMorreuFilhos: psicoData.quemMorreuFilhos || '',
            idadeMorteFilhos: psicoData.idadeMorteFilhos || '',
            idadeQuandoFilhosMorreram: psicoData.idadeQuandoFilhosMorreram || '',
            profissaoFilhos: psicoData.profissaoFilhos || '',
            idadeFilhos: psicoData.idadeFilhos || '',
            relacionamentoFilhos: psicoData.relacionamentoFilhos || '',

            // Histórico Familiar - Avós
            avosVivos: psicoData.avosVivos,
            quemMorreuAvos: psicoData.quemMorreuAvos || '',
            idadeMorteAvos: psicoData.idadeMorteAvos || '',
            idadeQuandoAvosMorreram: psicoData.idadeQuandoAvosMorreram || '',
            profissaoAvos: psicoData.profissaoAvos || '',
            idadeAvo: psicoData.idadeAvo || '',
            idadeAvó: psicoData.idadeAvó || '',
            relacionamentoAvos: psicoData.relacionamentoAvos || '',

            // Histórico Familiar - Outros
            comoCasa: psicoData.comoCasa || '',
            ruaViolencia: psicoData.ruaViolencia,
            detalhesViolencia: psicoData.detalhesViolencia || '',
            apoioFamiliar: psicoData.apoioFamiliar,
            detalhesApoio: psicoData.detalhesApoio || '',
            reacaoFamilia: psicoData.reacaoFamilia || '',

            // Histórico Escolar
            formacaoAcademica: psicoData.formacaoAcademica || '',
            gostavaEscola: psicoData.gostavaEscola,
            porqueEscola: psicoData.porqueEscola || '',
            situacoesImportantesEscola: psicoData.situacoesImportantesEscola || '',
            situacaoEnvergonhosaEscola: psicoData.situacaoEnvergonhosaEscola || '',
            sentePerseguidoEscola: psicoData.sentePerseguidoEscola,
            relatoPerseguicaoEscola: psicoData.relatoPerseguicaoEscola || '',
            gostaAmbienteEscolar: psicoData.gostaAmbienteEscolar,
            porqueAmbienteEscolar: psicoData.porqueAmbienteEscolar || '',
            fatoIncomodoEscola: psicoData.fatoIncomodoEscola,
            detalheFatoEscola: psicoData.detalheFatoEscola || '',

            // Histórico Profissional
            empresa: psicoData.empresa || '',
            gostaTrabalho: psicoData.gostaTrabalho,
            porqueTrabalho: psicoData.porqueTrabalho || '',
            situacoesImportantesTrabalho: psicoData.situacoesImportantesTrabalho || '',
            situacaoEnvergonhosaTrabalho: psicoData.situacaoEnvergonhosaTrabalho || '',
            sentePerseguidoTrabalho: psicoData.sentePerseguidoTrabalho,
            relatoPerseguicaoTrabalho: psicoData.relatoPerseguicaoTrabalho || '',
            gostaAmbienteTrabalho: psicoData.gostaAmbienteTrabalho,
            porqueAmbienteTrabalho: psicoData.porqueAmbienteTrabalho || '',
            algoIncomodaEmpresa: psicoData.algoIncomodaEmpresa,
            detalheIncomodaEmpresa: psicoData.detalheIncomodaEmpresa || '',

            // Histórico Social
            dificuldadeRelacionamento: psicoData.dificuldadeRelacionamento,
            quantosAmigos: psicoData.quantosAmigos || '',
            introvertidoExtrovertido: psicoData.introvertidoExtrovertido || '',
            cumprimentaPessoas: psicoData.cumprimentaPessoas,
            pessoaSolicita: psicoData.pessoaSolicita,
            detalheAmizades: psicoData.detalheAmizades || '',

            // Histórico Residencial
            tempoMorando: psicoData.tempoMorando || '',
            gostaMorar: psicoData.gostaMorar,
            porqueMorar: psicoData.porqueMorar || '',

            // Rotina Familiar
            rotinaFamiliaMudou: psicoData.rotinaFamiliaMudou,
            mudancasRotina: psicoData.mudancasRotina || '',

            // 3. HISTÓRICO CLÍNICO
            usaMedicacao: psicoData.usaMedicacao,
            qualMedicacao: psicoData.qualMedicacao || '',
            fezCirurgia: psicoData.fezCirurgia,
            qualCirurgia: psicoData.qualCirurgia || '',
            quantoTempoCirurgia: psicoData.quantoTempoCirurgia || '',
            puerperio: psicoData.puerperio,
            quantosDiasPuerperio: psicoData.quantosDiasPuerperio || '',
            relatosDoencaPsiquica: psicoData.relatosDoencaPsiquica,
            detalhesDoencaPsiquica: psicoData.detalhesDoencaPsiquica || '',
            historicoSubstancias: psicoData.historicoSubstancias,
            quaisSubstancias: psicoData.quaisSubstancias || '',

            // 4. HISTÓRICO PSÍQUICO
            sentimentosMedo: psicoData.sentimentosMedo,
            sentimentosRaiva: psicoData.sentimentosRaiva,
            sentimentosRevolta: psicoData.sentimentosRevolta,
            sentimentosCulpa: psicoData.sentimentosCulpa,
            sentimentosAnsiedade: psicoData.sentimentosAnsiedade,
            sentimentosSolidao: psicoData.sentimentosSolidao,
            sentimentosAngustia: psicoData.sentimentosAngustia,
            sentimentosImpotencia: psicoData.sentimentosImpotencia,
            sentimentosAlivio: psicoData.sentimentosAlivio,
            sentimentosIndiferenca: psicoData.sentimentosIndiferenca,
            outrosSentimentos: psicoData.outrosSentimentos || '',
            atendimentoAnterior: psicoData.atendimentoAnterior,
            motivoAtendimentoAnterior: psicoData.motivoAtendimentoAnterior || '',
            quantoTempoAtendimento: psicoData.quantoTempoAtendimento || '',
            usoPsicotropico: psicoData.usoPsicotropico,
            qualPsicotropico: psicoData.qualPsicotropico || '',
            usoSubstanciaPsicoativa: psicoData.usoSubstanciaPsicoativa,
            qualSubstanciaPsicoativa: psicoData.qualSubstanciaPsicoativa || '',

            // 5. CONHECENDO A QUEIXA DO PACIENTE
            queixaPrincipal: psicoData.queixaPrincipal || '',
            queixaSecundaria: psicoData.queixaSecundaria || '',
            expectativaSessoes: psicoData.expectativaSessoes || '',

            // 6. INFORMAÇÕES ADICIONAIS
            informacoesAdicionais: psicoData.informacoesAdicionais || '',

            // 7. CLASSIFICAÇÃO DO PACIENTE
            classificacao: psicoData.classificacao || '',

            // 8. DEMANDAS
            demandas: psicoData.demandas || '',

            // 9. JUSTIFICATIVA DA DEMANDA
            justificativaDemanda: psicoData.justificativaDemanda || '',

            // Campos para compatibilidade com estrutura antiga da ficha
            historiaDoencaAtual: psicoData.queixaPrincipal || '',
            historicoPsiquiatrico: psicoData.detalhesDoencaPsiquica || '',
            usoMedicamentos: psicoData.qualMedicacao || '',
            historicoFamiliar: psicoData.historicoPessoal || '',
            desenvolvimentoPessoal: psicoData.historicoPessoal || '',
            aspectosComportamentais: psicoData.outrosSentimentos || '',
            relacionamentosInterpessoais: psicoData.detalheAmizades || '',
            aspectosCognitivos: psicoData.formacaoAcademica || '',
            expectativasTratamento: psicoData.expectativaSessoes || '',
            demanda: psicoData.demandas || ''
          };
        }
        
        if (agendamento.tipoAssistencia === 'nutricao' && agendamento.dadosEspecificos.nutricao) {
          const nutriData = agendamento.dadosEspecificos.nutricao;
          dadosEspecializados.nutricao = {
            peso: nutriData.peso,
            altura: nutriData.altura,
            imc: nutriData.imc,
            circunferenciaAbdominal: nutriData.circunferenciaAbdominal,
            objetivos: nutriData.objetivos,
            restricoesAlimentares: nutriData.restricoesAlimentares,
            suplementacao: nutriData.suplementacao,
            atividadeFisica: nutriData.atividadeFisica,
            historicoAlimentar: nutriData.historicoAlimentar,
            examesLaboratoriais: nutriData.examesLaboratoriais
          };
        }
      }

      // Create new patient record
      const novaFicha = FichaAcompanhamentoEntity.create({
        pacienteId: agendamento.pacienteId,
        pacienteNome: agendamento.pacienteNome,
        profissionalId: agendamento.profissionalId,
        profissionalNome: agendamento.profissionalNome,
        tipoAssistencia: agendamento.tipoAssistencia,
        dataInicio: new Date(),
        status: 'ativo',
        objetivo: `Acompanhamento iniciado automaticamente a partir do agendamento confirmado em ${new Date(agendamento.dataHoraAgendamento).toLocaleDateString('pt-BR')}`,
        diagnosticoInicial: agendamento.motivo || 'Não informado',
        observacoes: agendamento.observacoesPaciente || '',
        dadosEspecializados: Object.keys(dadosEspecializados).length > 0 ? dadosEspecializados : undefined,
        createdBy: responsavel
      });

      console.log('📝 Dados especializados que serão salvos na ficha:', dadosEspecializados);
      console.log('📄 Ficha completa antes de salvar:', novaFicha);

      await fichaRepository.createFicha(novaFicha);
      console.log(`✅ Ficha de acompanhamento criada automaticamente para ${agendamento.pacienteNome}`);
    } catch (error: any) {
      console.error('Error creating ficha from agendamento:', error);
      // Don't throw the error to avoid breaking the appointment confirmation
      // The appointment should still be confirmed even if ficha creation fails
    }
  }

  async cancelarAgendamento(id: string, motivo: string, responsavel: string): Promise<void> {
    try {
      await this.agendamentoRepository.cancelarAgendamento(id, motivo, responsavel);
    } catch (error) {
      console.error('Error canceling agendamento:', error);
      throw error;
    }
  }

  async remarcarAgendamento(id: string, novaData: Date, responsavel: string): Promise<void> {
    try {
      await this.agendamentoRepository.remarcarAgendamento(id, novaData, responsavel);
    } catch (error) {
      console.error('Error rescheduling agendamento:', error);
      throw error;
    }
  }

  async iniciarConsulta(id: string, responsavel: string): Promise<void> {
    try {
      await this.agendamentoRepository.iniciarConsulta(id, responsavel);
    } catch (error) {
      console.error('Error starting consulta:', error);
      throw error;
    }
  }

  async concluirConsulta(id: string, observacoes?: string, responsavel?: string): Promise<void> {
    try {
      await this.agendamentoRepository.concluirConsulta(id, observacoes, responsavel);
    } catch (error) {
      console.error('Error finishing consulta:', error);
      throw error;
    }
  }

  async marcarFalta(id: string, responsavel: string): Promise<void> {
    try {
      await this.agendamentoRepository.updateStatus(id, StatusAgendamento.Faltou, 'Paciente não compareceu', responsavel);
    } catch (error) {
      console.error('Error marking absence:', error);
      throw error;
    }
  }

  async verificarDisponibilidade(profissionalId: string, dataHora: Date, duracao: number): Promise<boolean> {
    try {
      const dataFim = new Date(dataHora.getTime() + duracao);
      return !(await this.checkConflitosHorario(profissionalId, dataHora, dataFim));
    } catch (error) {
      console.error('Error checking availability:', error);
      return false;
    }
  }

  async obterHorariosDisponiveis(profissionalId: string, data: Date): Promise<Date[]> {
    try {
      const dataInicio = new Date(data.getFullYear(), data.getMonth(), data.getDate());
      const dataFim = new Date(data.getTime());
      dataFim.setDate(dataFim.getDate() + 1);
      
      const profissionalService = new ProfissionalAssistenciaService();
      return await profissionalService.getHorariosDisponiveis(profissionalId, dataInicio, dataFim);
    } catch (error) {
      console.error('Error getting available times:', error);
      throw error;
    }
  }

  async calcularValorTotal(profissionalId: string, desconto?: number): Promise<number> {
    try {
      const profissional = await this.profissionalRepository.findById(profissionalId);
      if (!profissional || !profissional.valorConsulta) {
        return 0;
      }
      
      return AssistenciaEntity.calcularValorFinalConsulta(profissional.valorConsulta, desconto || 0);
    } catch (error) {
      console.error('Error calculating total value:', error);
      throw error;
    }
  }

  async enviarLembrete(agendamentoId: string, tipoLembrete: 'sms' | 'email' | 'whatsapp'): Promise<void> {
    try {
      const agendamento = await this.agendamentoRepository.findById(agendamentoId);
      if (!agendamento) {
        throw new Error('Agendamento não encontrado');
      }

      // Implementation would depend on notification service capabilities
      console.log(`Enviando lembrete ${tipoLembrete} para agendamento ${agendamentoId}`);
    } catch (error) {
      console.error('Error sending reminder:', error);
      throw error;
    }
  }

  async getStatistics(): Promise<EstatisticasAssistencia> {
    try {
      return await this.agendamentoRepository.getEstatisticasGerais();
    } catch (error) {
      console.error('Error getting statistics:', error);
      throw new Error('Erro ao obter estatísticas');
    }
  }

  async getEstatisticasPorProfissional(profissionalId: string): Promise<EstatisticasAssistencia> {
    try {
      return await this.agendamentoRepository.getEstatisticasPorProfissional(profissionalId);
    } catch (error) {
      console.error('Error getting statistics by professional:', error);
      throw new Error('Erro ao obter estatísticas do profissional');
    }
  }

  async generateReport(filters?: AgendamentoFilters): Promise<{
    agendamentos: AgendamentoAssistencia[];
    totalAgendamentos: number;
    distribuicaoStatus: Record<StatusAgendamento, number>;
    distribuicaoTipos: Record<TipoAssistencia, number>;
    faturamentoTotal: number;
    avaliacaoMedia: number;
  }> {
    try {
      let agendamentos = await this.agendamentoRepository.findAll();

      // Apply filters if provided
      if (filters?.profissionalId) {
        agendamentos = agendamentos.filter(a => a.profissionalId === filters.profissionalId);
      }
      if (filters?.tipo) {
        agendamentos = agendamentos.filter(a => a.tipoAssistencia === filters.tipo);
      }
      if (filters?.status) {
        agendamentos = agendamentos.filter(a => a.status === filters.status);
      }
      if (filters?.dataInicio && filters?.dataFim) {
        agendamentos = agendamentos.filter(a => {
          const dataAgendamento = new Date(a.dataHoraAgendamento);
          return dataAgendamento >= filters.dataInicio! && dataAgendamento <= filters.dataFim!;
        });
      }

      const totalAgendamentos = agendamentos.length;

      // Distribution by status
      const distribuicaoStatus: Record<StatusAgendamento, number> = {} as Record<StatusAgendamento, number>;
      Object.values(StatusAgendamento).forEach(status => {
        distribuicaoStatus[status] = agendamentos.filter(a => a.status === status).length;
      });

      // Distribution by type
      const distribuicaoTipos: Record<TipoAssistencia, number> = {} as Record<TipoAssistencia, number>;
      Object.values(TipoAssistencia).forEach(tipo => {
        distribuicaoTipos[tipo] = agendamentos.filter(a => a.tipoAssistencia === tipo).length;
      });

      // Total billing
      const faturamentoTotal = agendamentos
        .filter(a => a.status === StatusAgendamento.Concluido && a.valorFinal)
        .reduce((sum, a) => sum + (a.valorFinal || 0), 0);

      // Average rating
      const avaliacoesComNota = agendamentos.filter(a => a.avaliacaoServico?.nota);
      const avaliacaoMedia = avaliacoesComNota.length > 0
        ? avaliacoesComNota.reduce((sum, a) => sum + a.avaliacaoServico!.nota, 0) / avaliacoesComNota.length
        : 0;

      return {
        agendamentos,
        totalAgendamentos,
        distribuicaoStatus,
        distribuicaoTipos,
        faturamentoTotal,
        avaliacaoMedia
      };
    } catch (error) {
      console.error('Error generating report:', error);
      throw new Error('Erro ao gerar relatório');
    }
  }

  async validateAgendamentoData(agendamento: Partial<AgendamentoAssistencia>): Promise<string[]> {
    const errors: string[] = [];

    // Required fields validation
    if (agendamento.pacienteNome && !agendamento.pacienteNome.trim()) {
      errors.push('Nome do paciente é obrigatório');
    }

    if (agendamento.pacienteTelefone && !AssistenciaEntity.validarTelefone(agendamento.pacienteTelefone)) {
      errors.push('Telefone do paciente inválido');
    }

    if (agendamento.pacienteEmail && !AssistenciaEntity.validarEmail(agendamento.pacienteEmail)) {
      errors.push('Email do paciente inválido');
    }

    if (agendamento.motivo && !agendamento.motivo.trim()) {
      errors.push('Motivo da consulta é obrigatório');
    }

    return errors;
  }

  async checkConflitosHorario(profissionalId: string, dataInicio: Date, dataFim: Date, excludeId?: string): Promise<boolean> {
    try {
      const agendamentosExistentes = await this.agendamentoRepository.findByProfissionalAndDateRange(
        profissionalId,
        dataInicio,
        dataFim
      );

      // Filter out the excluded appointment and non-active statuses
      const agendamentosAtivos = agendamentosExistentes.filter(a => 
        a.id !== excludeId &&
        ![StatusAgendamento.Cancelado, StatusAgendamento.Faltou, StatusAgendamento.Concluido].includes(a.status)
      );

      return agendamentosAtivos.some(agendamento => {
        const inicioExistente = new Date(agendamento.dataHoraAgendamento);
        const fimExistente = new Date(agendamento.dataHoraFim);

        return (dataInicio < fimExistente && dataFim > inicioExistente);
      });
    } catch (error) {
      console.error('Error checking time conflicts:', error);
      return false;
    }
  }
}