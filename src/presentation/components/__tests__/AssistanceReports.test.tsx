import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistanceReports from '../AssistanceReports';

const mockAgendamentos = [
  { id: 'a1', tipoAssistencia: 'psicologica', status: 'confirmado', profissionalId: 'p1', pacienteNome: 'Ana', dataHoraAgendamento: new Date() },
  { id: 'a2', tipoAssistencia: 'social', status: 'confirmado', profissionalId: 'p2', pacienteNome: 'Bia', dataHoraAgendamento: new Date() }
];
const mockProfissionais = [
  { id: 'p1', nome: 'Dra. Psi', especialidade: 'psicologica' },
  { id: 'p2', nome: 'Assist. Social', especialidade: 'social' }
];
const mockFichas = [
  { id: 'f1', profissionalId: 'p1', tipoAssistencia: 'psicologica', status: 'em_tratamento' },
  { id: 'f2', profissionalId: 'p1', tipoAssistencia: 'psicologica', status: 'alta' },
  { id: 'f3', profissionalId: 'p2', tipoAssistencia: 'social', status: 'em_tratamento' }
];
const mockSessoes: Record<string, any[]> = {
  f1: [{ id: 's1', status: 'concluida' }, { id: 's2', status: 'nao_realizada' }],
  f2: [{ id: 's3', status: 'concluida' }],
  f3: [{ id: 's4', status: 'concluida' }]
};

jest.mock('@modules/assistance/assistencia/application/services/AssistenciaService', () => ({
  AgendamentoAssistenciaService: class {
    getAllAgendamentos = async () => mockAgendamentos;
  },
  ProfissionalAssistenciaService: class {
    getAllProfissionais = async () => mockProfissionais;
  }
}));

jest.mock('@modules/assistance/fichas/application/services/FichaAcompanhamentoService', () => ({
  FichaAcompanhamentoService: class {
    getAllFichas = async () => mockFichas;
    getSessoesByFicha = async (id: string) => mockSessoes[id] || [];
  }
}));

jest.mock('../charts/AssistanceBarChart', () => ({ AssistanceBarChart: () => <div /> }));
jest.mock('../charts/AssistanceStatusPieChart', () => ({ AssistanceStatusPieChart: () => <div /> }));
jest.mock('../charts/AssistanceTimelineChart', () => ({ AssistanceTimelineChart: () => <div /> }));

const card = (label: string) => screen.getByText(label).parentElement as HTMLElement;

describe('AssistanceReports', () => {
  it('lista todos os status de agendamento, inclusive os zerados', async () => {
    render(<AssistanceReports />);
    await waitFor(() => expect(screen.getByText('Status dos Agendamentos')).toBeInTheDocument());

    for (const label of ['Agendado', 'Confirmado', 'Em Andamento', 'Concluído', 'Cancelado', 'Remarcado', 'Paciente Faltou']) {
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    }
    expect(within(card('Confirmado')).getByText('2')).toBeInTheDocument();
  });

  it('mostra fichas e sessões (realizadas / paciente faltou) e filtra por tipo de assistência', async () => {
    render(<AssistanceReports />);
    await waitFor(() => expect(screen.getByText('Acompanhamento (fichas e sessões)')).toBeInTheDocument());

    expect(within(card('Sessões realizadas')).getByText('3')).toBeInTheDocument();
    expect(within(card('Paciente faltou')).getByText('1')).toBeInTheDocument();
    expect(within(card('Concluídas (alta)')).getByText('1')).toBeInTheDocument();

    await userEvent.selectOptions(screen.getByLabelText('Tipo de assistência'), 'social');

    expect(within(card('Sessões realizadas')).getByText('1')).toBeInTheDocument();
    expect(within(card('Paciente faltou')).getByText('0')).toBeInTheDocument();
    expect(within(card('Em tratamento')).getByText('1')).toBeInTheDocument();
  });
});
