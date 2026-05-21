import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import AgendamentoAssistenciaModalEnhanced from '../AgendamentoAssistenciaModalEnhanced';
import {
  AgendamentoAssistenciaService,
  ProfissionalAssistenciaService
} from '@modules/assistance/assistencia/application/services/AssistenciaService';
import {
  AgendamentoAssistencia,
  ModalidadeAtendimento,
  PrioridadeAtendimento,
  StatusAgendamento,
  StatusProfissional,
  TipoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';

var mockGetProfissionaisByTipo = jest.fn();
var mockObterHorariosDisponiveis = jest.fn();
var mockCreateAgendamento = jest.fn();
var mockUpdateAgendamento = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { id: 'user-1', email: 'user@example.com' }
  })
}));

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: {}
  })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args)
  }
}));

describe('AgendamentoAssistenciaModalEnhanced', () => {
  const profissionalAtivo = {
    id: 'prof-1',
    nome: 'Dra. Ana',
    registroProfissional: 'CRP 123',
    status: StatusProfissional.Ativo,
    tempoConsulta: 50
  };

  const createAgendamento = (overrides: Partial<AgendamentoAssistencia> = {}): AgendamentoAssistencia => ({
    id: 'ag-1',
    pacienteId: 'pac-1',
    pacienteNome: 'Maria Silva',
    pacienteTelefone: '11999999999',
    pacienteEmail: 'maria@example.com',
    profissionalId: 'prof-1',
    profissionalNome: 'Dra. Ana',
    tipoAssistencia: TipoAssistencia.Psicologica,
    dataHoraAgendamento: new Date(2027, 2, 20, 10, 0, 0, 0),
    dataHoraFim: new Date(2027, 2, 20, 10, 50, 0, 0),
    modalidade: ModalidadeAtendimento.Online,
    prioridade: PrioridadeAtendimento.Alta,
    status: StatusAgendamento.Agendado,
    motivo: 'Acompanhamento emocional recorrente',
    observacoesPaciente: 'Observacao',
    anexos: [],
    historico: [],
    createdAt: new Date('2025-03-19T10:00:00.000Z'),
    updatedAt: new Date('2025-03-19T10:00:00.000Z'),
    createdBy: 'user@example.com',
    ...overrides
  });

  const renderModal = (props?: Partial<React.ComponentProps<typeof AgendamentoAssistenciaModalEnhanced>>) => {
    const onClose = jest.fn();
    const onSave = jest.fn();

    const result = render(
      <AgendamentoAssistenciaModalEnhanced
        isOpen
        onClose={onClose}
        onSave={onSave}
        mode="create"
        {...props}
      />
    );

    return { ...result, onClose, onSave };
  };

  const getInputByPlaceholder = (text: string) => screen.getByPlaceholderText(text) as HTMLInputElement;
  const getComboboxInBlock = (label: string) =>
    screen
      .getAllByText((_, el) => el?.textContent?.includes(label) ?? false)[0]
      .parentElement!.querySelector('select') as HTMLSelectElement;
  const getInputInBlock = (label: string) =>
    screen
      .getAllByText((_, el) => el?.textContent?.includes(label) ?? false)[0]
      .parentElement!.querySelector('input') as HTMLInputElement;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ProfissionalAssistenciaService.prototype, 'getProfissionaisByTipo').mockImplementation((...args: any[]) =>
      mockGetProfissionaisByTipo(...args)
    );
    jest.spyOn(AgendamentoAssistenciaService.prototype, 'obterHorariosDisponiveis').mockImplementation((...args: any[]) =>
      mockObterHorariosDisponiveis(...args)
    );
    jest.spyOn(AgendamentoAssistenciaService.prototype, 'createAgendamento').mockImplementation((...args: any[]) =>
      mockCreateAgendamento(...args)
    );
    jest.spyOn(AgendamentoAssistenciaService.prototype, 'updateAgendamento').mockImplementation((...args: any[]) =>
      mockUpdateAgendamento(...args)
    );
    mockGetProfissionaisByTipo.mockResolvedValue([profissionalAtivo]);
    mockObterHorariosDisponiveis.mockResolvedValue([new Date(2027, 2, 20, 13, 0, 0, 0)]);
    mockCreateAgendamento.mockResolvedValue(createAgendamento());
    mockUpdateAgendamento.mockResolvedValue(createAgendamento({ id: 'ag-updated' }));
  });

  it('renders in view mode with prefilled values and no save button', async () => {
    renderModal({
      mode: 'view',
      agendamento: createAgendamento()
    });

    await waitFor(() => {
      expect(getInputByPlaceholder('Nome completo do paciente')).toHaveValue('Maria Silva');
    });

    expect(getInputByPlaceholder('Nome completo do paciente')).toBeDisabled();
    expect(screen.getByDisplayValue('Acompanhamento emocional recorrente')).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Agendar|Atualizar/ })).not.toBeInTheDocument();
  });

  it('loads professionals when opened and shows them in the scheduling tab', async () => {
    renderModal();

    await waitFor(() => {
      expect(mockGetProfissionaisByTipo).toHaveBeenCalledWith(TipoAssistencia.Psicologica);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Agendamento' }));
    expect(screen.getByRole('option', { name: /Dra. Ana - CRP 123/i })).toBeInTheDocument();
  });

  it('validates invalid data on save in edit mode', async () => {
    renderModal({
      mode: 'edit',
      agendamento: createAgendamento()
    });

    await waitFor(() => {
      expect(getInputByPlaceholder('Nome completo do paciente')).toHaveValue('Maria Silva');
    });

    fireEvent.change(getInputByPlaceholder('(11) 99999-9999'), { target: { value: '123' } });
    fireEvent.click(screen.getByRole('button', { name: /Atualizar/ }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(
        'Por favor, corrija os erros no formulário antes de continuar.'
      );
    });
  });

  it('updates an appointment in edit mode and closes on success', async () => {
    const editAgendamento = createAgendamento();
    const rendered = renderModal({
      mode: 'edit',
      agendamento: editAgendamento
    });

    await waitFor(() => {
      expect(mockGetProfissionaisByTipo).toHaveBeenCalled();
    });

    const saveButton = screen.getByRole('button', { name: /Atualizar/ });
    await waitFor(() => expect(saveButton).toBeEnabled());
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockUpdateAgendamento).toHaveBeenCalledWith(
        editAgendamento.id,
        expect.objectContaining({
          pacienteNome: 'Maria Silva',
          pacienteTelefone: '11999999999',
          profissionalId: 'prof-1',
          profissionalNome: 'Dra. Ana',
          createdBy: 'user@example.com',
          dataHoraAgendamento: expect.any(Date),
          dataHoraFim: expect.any(Date)
        })
      );
    });

    expect(rendered.onSave).toHaveBeenCalledWith(expect.objectContaining({ id: 'ag-updated' }));
    expect(rendered.onClose).toHaveBeenCalled();
    expect(mockToastSuccess).toHaveBeenCalled();
  });
});
