import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfessionalDashboardPage } from '../ProfessionalDashboardPage';
import {
  AgendamentoAssistencia,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  StatusAgendamento,
  TipoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';

const mockGetAgendamentosByProfissional = jest.fn();
const mockGetProfissionalByEmail = jest.fn();
const mockCurrentUser = {
  email: 'profissional@example.com',
  displayName: 'Profissional Teste'
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser })
}));

jest.mock('@modules/assistance/assistencia/application/services/AssistenciaService', () => {
  function AgendamentoAssistenciaServiceMock(this: unknown) {}
  AgendamentoAssistenciaServiceMock.prototype.getAgendamentosByProfissional = (...args: unknown[]) =>
    mockGetAgendamentosByProfissional(...args);

  function ProfissionalAssistenciaServiceMock(this: unknown) {}
  ProfissionalAssistenciaServiceMock.prototype.getProfissionalByEmail = (...args: unknown[]) =>
    mockGetProfissionalByEmail(...args);

  return {
    AgendamentoAssistenciaService: AgendamentoAssistenciaServiceMock,
    ProfissionalAssistenciaService: ProfissionalAssistenciaServiceMock
  };
});

const createAgendamento = (index: number, date: Date): AgendamentoAssistencia => ({
  id: `agendamento-${index}`,
  pacienteId: `paciente-${index}`,
  pacienteNome: `Paciente ${index}`,
  pacienteTelefone: '(11) 99999-0000',
  pacienteEmail: `paciente${index}@example.com`,
  profissionalId: 'profissional-1',
  profissionalNome: 'Profissional Teste',
  tipoAssistencia: TipoAssistencia.Psicologica,
  dataHoraAgendamento: date,
  dataHoraFim: new Date(date.getTime() + 60 * 60 * 1000),
  modalidade: ModalidadeAtendimento.Presencial,
  prioridade: PrioridadeAtendimento.Normal,
  status: StatusAgendamento.Agendado,
  motivo: 'Consulta inicial',
  anexos: [],
  historico: [],
  createdAt: date,
  updatedAt: date,
  createdBy: 'admin@example.com'
});

const renderPage = () => render(
  <MemoryRouter future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
    <ProfessionalDashboardPage />
  </MemoryRouter>
);

describe('ProfessionalDashboardPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetProfissionalByEmail.mockResolvedValue({ id: 'profissional-1' });
  });

  it('shows all appointments from the selected month when there are more than four', async () => {
    const currentMonth = new Date();
    const agendamentos = Array.from({ length: 5 }, (_, index) => (
      createAgendamento(index + 1, new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 10, 9 + index, 0))
    ));
    mockGetAgendamentosByProfissional.mockResolvedValue(agendamentos);

    renderPage();

    expect(await screen.findByText('Agendamentos do mês (5)')).toBeInTheDocument();
    expect(screen.getByText('Paciente 1')).toBeInTheDocument();
    expect(screen.getByText('Paciente 5')).toBeInTheDocument();
  });
});
