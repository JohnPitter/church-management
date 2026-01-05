// Infrastructure Service - Patient Records (Fichas de Acompanhamento) Service
// Business logic for patient records and sessions management

import { FichaAcompanhamento, SessaoAcompanhamento, FichaAcompanhamentoEntity } from '../../domain/entities/FichaAcompanhamento';
import { FirebaseFichaAcompanhamentoRepository } from 'data/repositories/FirebaseFichaAcompanhamentoRepository';

export class FichaAcompanhamentoService {
  private repository: FirebaseFichaAcompanhamentoRepository;

  constructor() {
    this.repository = new FirebaseFichaAcompanhamentoRepository();
  }

  async createFicha(fichaData: {
    pacienteId: string;
    pacienteNome: string;
    profissionalId: string;
    profissionalNome: string;
    tipoAssistencia: 'psicologica' | 'social' | 'juridica' | 'medica';
    dataInicio: Date;
    objetivo: string;
    diagnosticoInicial?: string;
    observacoes?: string;
    informacoesMedicas?: string;
    medicamentos?: string;
    alergias?: string;
    contatoEmergencia?: {
      nome: string;
      telefone: string;
      parentesco: string;
    };
    createdBy: string;
  }): Promise<FichaAcompanhamento> {
    try {
      const ficha = FichaAcompanhamentoEntity.create({
        ...fichaData,
        status: 'ativo'
      });

      return await this.repository.createFicha(ficha);
    } catch (error: any) {
      console.error('Error creating ficha:', error);
      throw new Error(`Failed to create patient record: ${error.message}`);
    }
  }

  async updateFicha(id: string, updates: Partial<FichaAcompanhamento>): Promise<FichaAcompanhamento> {
    try {
      return await this.repository.updateFicha(id, updates);
    } catch (error: any) {
      console.error('Error updating ficha:', error);
      throw new Error(`Failed to update patient record: ${error.message}`);
    }
  }

  async deleteFicha(id: string): Promise<void> {
    try {
      await this.repository.deleteFicha(id);
    } catch (error: any) {
      console.error('Error deleting ficha:', error);
      throw new Error(`Failed to delete patient record: ${error.message}`);
    }
  }

  async getFichaById(id: string): Promise<FichaAcompanhamento | null> {
    try {
      return await this.repository.getFichaById(id);
    } catch (error: any) {
      console.error('Error getting ficha:', error);
      throw new Error(`Failed to get patient record: ${error.message}`);
    }
  }

  async getFichasByProfissional(profissionalId: string): Promise<FichaAcompanhamento[]> {
    try {
      return await this.repository.getFichasByProfissional(profissionalId);
    } catch (error: any) {
      console.error('Error getting fichas by professional:', error);
      throw new Error(`Failed to get patient records: ${error.message}`);
    }
  }

  async getAllFichas(): Promise<FichaAcompanhamento[]> {
    try {
      return await this.repository.getAllFichas();
    } catch (error: any) {
      console.error('Error getting all fichas:', error);
      throw new Error(`Failed to get patient records: ${error.message}`);
    }
  }

  async getFichasByPaciente(pacienteId: string): Promise<FichaAcompanhamento[]> {
    try {
      return await this.repository.getFichasByPaciente(pacienteId);
    } catch (error: any) {
      console.error('Error getting fichas by patient:', error);
      throw new Error(`Failed to get patient records: ${error.message}`);
    }
  }

  async finalizarFicha(id: string, observacoesFinal?: string): Promise<FichaAcompanhamento> {
    try {
      const updates: Partial<FichaAcompanhamento> = {
        status: 'concluido'
      };

      if (observacoesFinal) {
        updates.observacoes = observacoesFinal;
      }

      return await this.repository.updateFicha(id, updates);
    } catch (error: any) {
      console.error('Error finalizing ficha:', error);
      throw new Error(`Failed to finalize patient record: ${error.message}`);
    }
  }

  // Métodos para sessões
  async createSessao(fichaId: string, sessaoData: {
    numeroSessao: number;
    data: Date;
    duracao: number;
    tipoSessao: 'individual' | 'grupo' | 'familiar' | 'avaliacao';
    resumo: string;
    observacoes?: string;
    evolucao?: string;
    proximasSessoes?: string;
    createdBy: string;
  }): Promise<SessaoAcompanhamento> {
    try {
      const sessao = FichaAcompanhamentoEntity.createSessao({
        ...sessaoData,
        fichaId,
        anexos: []
      });

      return await this.repository.createSessao(fichaId, sessao);
    } catch (error: any) {
      console.error('Error creating sessao:', error);
      throw new Error(`Failed to create session: ${error.message}`);
    }
  }

  async updateSessao(fichaId: string, sessaoId: string, updates: Partial<SessaoAcompanhamento>): Promise<SessaoAcompanhamento> {
    try {
      return await this.repository.updateSessao(fichaId, sessaoId, updates);
    } catch (error: any) {
      console.error('Error updating sessao:', error);
      throw new Error(`Failed to update session: ${error.message}`);
    }
  }

  async deleteSessao(fichaId: string, sessaoId: string): Promise<void> {
    try {
      await this.repository.deleteSessao(fichaId, sessaoId);
    } catch (error: any) {
      console.error('Error deleting sessao:', error);
      throw new Error(`Failed to delete session: ${error.message}`);
    }
  }

  async getSessoesByFicha(fichaId: string): Promise<SessaoAcompanhamento[]> {
    try {
      return await this.repository.getSessoesByFicha(fichaId);
    } catch (error: any) {
      console.error('Error getting sessoes:', error);
      throw new Error(`Failed to get sessions: ${error.message}`);
    }
  }

  async getSessaoById(fichaId: string, sessaoId: string): Promise<SessaoAcompanhamento | null> {
    try {
      return await this.repository.getSessaoById(fichaId, sessaoId);
    } catch (error: any) {
      console.error('Error getting sessao:', error);
      throw new Error(`Failed to get session: ${error.message}`);
    }
  }

  async getProximoNumeroSessao(fichaId: string): Promise<number> {
    try {
      const sessoes = await this.repository.getSessoesByFicha(fichaId);
      if (sessoes.length === 0) {
        return 1;
      }
      
      const maxNumero = Math.max(...sessoes.map(s => s.numeroSessao));
      return maxNumero + 1;
    } catch (error: any) {
      console.error('Error getting next session number:', error);
      throw new Error(`Failed to get next session number: ${error.message}`);
    }
  }

  // Relatórios e estatísticas
  async getEstatisticasProfissional(profissionalId: string): Promise<{
    totalFichas: number;
    fichasAtivas: number;
    fichasConcluidas: number;
    totalSessoes: number;
    mediaSessoesPorFicha: number;
  }> {
    try {
      const fichas = await this.repository.getFichasByProfissional(profissionalId);
      const fichasAtivas = fichas.filter(f => f.status === 'ativo');
      const fichasConcluidas = fichas.filter(f => f.status === 'concluido');

      let totalSessoes = 0;
      for (const ficha of fichas) {
        const sessoes = await this.repository.getSessoesByFicha(ficha.id);
        totalSessoes += sessoes.length;
      }

      const mediaSessoesPorFicha = fichas.length > 0 ? totalSessoes / fichas.length : 0;

      return {
        totalFichas: fichas.length,
        fichasAtivas: fichasAtivas.length,
        fichasConcluidas: fichasConcluidas.length,
        totalSessoes,
        mediaSessoesPorFicha: Math.round(mediaSessoesPorFicha * 100) / 100
      };
    } catch (error: any) {
      console.error('Error getting professional statistics:', error);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}
