import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProfessionalFichasPage from '../ProfessionalFichasPage';
import { AgendamentoAssistenciaService, ProfissionalAssistenciaService } from '@modules/assistance/assistencia/application/services/AssistenciaService';
import { FirebaseFichaAcompanhamentoRepository } from '@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository';

const mockConfirm = jest.fn();
const mockGetProfissionalByEmail = jest.fn();
const mockGetFichasByProfissional = jest.fn();
const mockSyncFichasForProfissionalAgenda = jest.fn();
const mockUpdateFicha = jest.fn();
const authValue = { currentUser: { id: 'user-1', email: 'pro@example.com' } };

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => authValue
}));

jest.mock('../../components/ConfirmDialog', () => ({
  useConfirmDialog: () => ({ confirm: mockConfirm })
}));

jest.mock('@modules/assistance/assistencia/application/services/AssistenciaService');

jest.mock('@modules/assistance/fichas/infrastructure/repositories/FirebaseFichaAcompanhamentoRepository');

jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logDatabase: jest.fn()
  }
}));

jest.mock('../../utils/prontuarioExport', () => ({
  generateProntuarioPDF: jest.fn(),
  generateProntuarioWord: jest.fn()
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('ProfessionalFichasPage', () => {
  const createFicha = (overrides: Record<string, any> = {}) => ({
    id: 'ficha-1',
    pacienteId: 'pac-1',
    pacienteNome: 'Maria da Silva',
    tipoAssistencia: 'psicologica',
    dataInicio: new Date('2025-03-01T12:00:00.000Z'),
    objetivo: 'Acompanhamento emocional',
    diagnosticoInicial: 'Ansiedade',
    observacoes: 'Observação inicial',
    status: 'ativo',
    contatoEmergencia: {
      nome: 'João',
      parentesco: 'Irmão',
      telefone: '11999999999'
    },
    dadosEspecializados: {},
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(ProfissionalAssistenciaService.prototype, 'getProfissionalByEmail').mockImplementation((...args: any[]) =>
      mockGetProfissionalByEmail(...args)
    );
    jest.spyOn(FirebaseFichaAcompanhamentoRepository.prototype, 'getFichasByProfissional').mockImplementation((...args: any[]) =>
      mockGetFichasByProfissional(...args)
    );
    jest.spyOn(AgendamentoAssistenciaService.prototype, 'syncFichasForProfissionalAgenda').mockImplementation((...args: any[]) =>
      mockSyncFichasForProfissionalAgenda(...args)
    );
    jest.spyOn(FirebaseFichaAcompanhamentoRepository.prototype, 'updateFicha').mockImplementation((...args: any[]) =>
      mockUpdateFicha(...args)
    );
    mockGetProfissionalByEmail.mockResolvedValue({ id: 'prof-1' });
    mockSyncFichasForProfissionalAgenda.mockResolvedValue(0);
    mockGetFichasByProfissional.mockResolvedValue([
      createFicha(),
      createFicha({
        id: 'ficha-2',
        pacienteNome: 'Carlos Souza',
        status: 'concluido',
        objetivo: 'Reabilitação'
      })
    ]);
    mockUpdateFicha.mockImplementation(async (id: string, updates: Record<string, any>) => ({
      ...createFicha({ id, pacienteNome: id === 'ficha-2' ? 'Carlos Souza' : 'Maria da Silva' }),
      ...updates
    }));
    mockConfirm.mockResolvedValue(true);
  });

  it('loads fichas, filters by search and status, and updates status after confirmation', async () => {
    render(<ProfessionalFichasPage />);

    await waitFor(() => {
      expect(mockSyncFichasForProfissionalAgenda).toHaveBeenCalledWith('prof-1', 'pro@example.com');
      expect(screen.getByText('Maria da Silva')).toBeInTheDocument();
      expect(screen.getByText('Carlos Souza')).toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por paciente, objetivo ou diagnóstico...'),
      { target: { value: 'carlos' } }
    );

    await waitFor(() => {
      expect(screen.queryByText('Maria da Silva')).not.toBeInTheDocument();
      expect(screen.getByText('Carlos Souza')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /Em Tratamento \(1\)/i }));

    await waitFor(() => {
      expect(screen.queryByText('Carlos Souza')).not.toBeInTheDocument();
    });

    fireEvent.change(
      screen.getByPlaceholderText('Buscar por paciente, objetivo ou diagnóstico...'),
      { target: { value: '' } }
    );
    fireEvent.click(screen.getByRole('button', { name: /Todas \(2\)/i }));

    await waitFor(() => {
      expect(screen.getByText('Maria da Silva')).toBeInTheDocument();
    });

    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'pausado' } });

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(mockUpdateFicha).toHaveBeenCalledWith(
        'ficha-1',
        expect.objectContaining({ status: 'pausado' })
      );
    });
  });

  it('shows empty states when professional profile is missing', async () => {
    mockGetProfissionalByEmail.mockResolvedValueOnce(null);

    render(<ProfessionalFichasPage />);

    await waitFor(() => {
      expect(screen.getByText('Nenhuma ficha encontrada.')).toBeInTheDocument();
    });
  });
});
