// Unit Tests - AssistenciaManagementPage
// Comprehensive tests for assistance management page component

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistenciaManagementPage from '../AssistenciaManagementPage';
import {
  TipoAssistencia,
  StatusAgendamento,
  StatusProfissional,
  AgendamentoAssistencia,
  ProfissionalAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';
import {
  HelpRequestStatus,
  HelpRequestPriority,
  ProfessionalHelpRequest
} from '@modules/assistance/professional/domain/entities/ProfessionalHelpRequest';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-1',
  email: 'admin@church.com',
  displayName: 'Admin User',
  photoURL: 'https://example.com/photo.jpg',
  role: 'admin',
  status: 'approved'
};

const mockAuthContext = {
  currentUser: mockCurrentUser,
  user: mockCurrentUser,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  signInWithGoogle: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
  canCreateContent: jest.fn().mockReturnValue(true),
  isProfessional: jest.fn().mockReturnValue(false),
  canAccessSystem: jest.fn().mockReturnValue(true),
  linkEmailPassword: jest.fn(),
  getSignInMethods: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock SettingsContext
const mockSettings = {
  churchName: 'Test Church',
  theme: 'light'
};

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockSettings
  })
}));

// Mock window methods
const mockConfirm = jest.fn().mockReturnValue(true);
const mockAlert = jest.fn();
window.confirm = mockConfirm;
window.alert = mockAlert;

// Mock data
const mockAgendamentos: any[] = [
  {
    id: 'agend-1',
    pacienteId: 'pac-1',
    pacienteNome: 'João Silva',
    pacienteTelefone: '11999999999',
    profissionalId: 'prof-1',
    profissionalNome: 'Dr. Maria Santos',
    tipoAssistencia: TipoAssistencia.Psicologica,
    dataHoraAgendamento: new Date('2024-02-10T10:00:00'),
    status: StatusAgendamento.Agendado,
    observacoes: 'Primeira consulta',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-01')
  },
  {
    id: 'agend-2',
    pacienteId: 'pac-2',
    pacienteNome: 'Maria Oliveira',
    pacienteTelefone: '11988888888',
    profissionalId: 'prof-2',
    profissionalNome: 'Dra. Ana Costa',
    tipoAssistencia: TipoAssistencia.Social,
    dataHoraAgendamento: new Date('2024-02-05T14:00:00'),
    status: StatusAgendamento.Confirmado,
    observacoes: 'Acompanhamento social',
    createdAt: new Date('2024-01-28'),
    updatedAt: new Date('2024-02-02')
  },
  {
    id: 'agend-3',
    pacienteId: 'pac-3',
    pacienteNome: 'Pedro Santos',
    pacienteTelefone: '11977777777',
    profissionalId: 'prof-3',
    profissionalNome: 'Dr. Carlos Lima',
    tipoAssistencia: TipoAssistencia.Juridica,
    dataHoraAgendamento: new Date('2024-02-03T09:00:00'),
    status: StatusAgendamento.Concluido,
    observacoes: 'Consulta jurídica',
    createdAt: new Date('2024-01-25'),
    updatedAt: new Date('2024-02-03')
  }
];

const mockProfissionais: any[] = [
  {
    id: 'prof-1',
    nome: 'Dr. Maria Santos',
    registroProfissional: 'CRP 123456',
    especialidade: TipoAssistencia.Psicologica,
    telefone: '11999999999',
    email: 'maria.santos@example.com',
    status: StatusProfissional.Ativo,
    valorConsulta: 150.00,
    disponibilidade: ['Segunda', 'Quarta', 'Sexta'],
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01')
  },
  {
    id: 'prof-2',
    nome: 'Dra. Ana Costa',
    registroProfissional: 'CRESS 654321',
    especialidade: TipoAssistencia.Social,
    telefone: '11988888888',
    email: 'ana.costa@example.com',
    status: StatusProfissional.Ativo,
    valorConsulta: 100.00,
    disponibilidade: ['Terça', 'Quinta'],
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05')
  },
  {
    id: 'prof-3',
    nome: 'Dr. Carlos Lima',
    registroProfissional: 'OAB 987654',
    especialidade: TipoAssistencia.Juridica,
    telefone: '11977777777',
    email: 'carlos.lima@example.com',
    status: StatusProfissional.Inativo,
    valorConsulta: 200.00,
    disponibilidade: ['Segunda', 'Terça'],
    dataInativacao: new Date('2024-02-01'),
    motivoInativacao: 'Mudança de cidade',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-02-01')
  }
];

const mockHelpRequests: any[] = [
  {
    id: 'help-1',
    titulo: 'Caso complexo de transtorno de ansiedade',
    descricao: 'Preciso de ajuda com um paciente que apresenta sintomas graves',
    solicitanteId: 'prof-1',
    solicitanteNome: 'Dr. Maria Santos',
    solicitanteEspecialidade: TipoAssistencia.Psicologica,
    destinatarioId: undefined,
    destinatarioNome: undefined,
    destinatarioEspecialidade: undefined,
    pacienteId: 'pac-1',
    pacienteNome: 'João Silva',
    status: HelpRequestStatus.Pendente,
    prioridade: HelpRequestPriority.Alta,
    createdAt: new Date('2024-02-03'),
    updatedAt: new Date('2024-02-03')
  },
  {
    id: 'help-2',
    titulo: 'Orientação sobre processo judicial',
    descricao: 'Preciso de orientação jurídica para um caso de guarda',
    solicitanteId: 'prof-2',
    solicitanteNome: 'Dra. Ana Costa',
    solicitanteEspecialidade: TipoAssistencia.Social,
    destinatarioId: 'prof-3',
    destinatarioNome: 'Dr. Carlos Lima',
    destinatarioEspecialidade: TipoAssistencia.Juridica,
    pacienteId: 'pac-2',
    pacienteNome: 'Maria Oliveira',
    status: HelpRequestStatus.EmAnalise,
    prioridade: HelpRequestPriority.Normal,
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-02')
  },
  {
    id: 'help-3',
    titulo: 'Urgente: Paciente em crise',
    descricao: 'Paciente necessita atendimento imediato',
    solicitanteId: 'prof-1',
    solicitanteNome: 'Dr. Maria Santos',
    solicitanteEspecialidade: TipoAssistencia.Psicologica,
    destinatarioId: undefined,
    destinatarioNome: undefined,
    destinatarioEspecialidade: undefined,
    pacienteId: 'pac-3',
    pacienteNome: 'Pedro Santos',
    status: HelpRequestStatus.Aceito,
    prioridade: HelpRequestPriority.Urgente,
    createdAt: new Date('2024-01-30'),
    updatedAt: new Date('2024-01-31')
  }
];

const mockStatistics = {
  totalAgendamentos: 3,
  agendamentosHoje: 1,
  agendamentosSemana: 2,
  totalProfissionais: 3,
  totalAtivos: 2,
  porTipo: {
    [TipoAssistencia.Psicologica]: 1,
    [TipoAssistencia.Social]: 1,
    [TipoAssistencia.Juridica]: 1,
    [TipoAssistencia.Medica]: 0
  },
  porStatus: {
    [StatusAgendamento.Agendado]: 1,
    [StatusAgendamento.Confirmado]: 1,
    [StatusAgendamento.EmAndamento]: 0,
    [StatusAgendamento.Concluido]: 1,
    [StatusAgendamento.Cancelado]: 0,
    [StatusAgendamento.Remarcado]: 0,
    [StatusAgendamento.Faltou]: 0
  }
};

// Mock services
const mockGetAllAgendamentos = jest.fn().mockResolvedValue(mockAgendamentos);
const mockGetAgendamentoStatistics = jest.fn().mockResolvedValue({
  totalAgendamentos: mockStatistics.totalAgendamentos,
  agendamentosHoje: mockStatistics.agendamentosHoje,
  agendamentosSemana: mockStatistics.agendamentosSemana,
  porTipo: mockStatistics.porTipo,
  porStatus: mockStatistics.porStatus
});
const mockUpdateAgendamento = jest.fn().mockResolvedValue(undefined);
const mockConfirmarAgendamento = jest.fn().mockResolvedValue(undefined);
const mockDeleteAgendamento = jest.fn().mockResolvedValue(undefined);

const mockGetAllProfissionais = jest.fn().mockResolvedValue(mockProfissionais);
const mockGetProfissionalStatistics = jest.fn().mockResolvedValue({
  totalProfissionais: mockStatistics.totalProfissionais,
  totalAtivos: mockStatistics.totalAtivos
});

const mockGetReceivedRequests = jest.fn().mockResolvedValue([]);
const mockGetSentRequests = jest.fn().mockResolvedValue([]);

jest.mock('@modules/assistance/assistencia/application/services/AssistenciaService', () => {
  function AgendamentoAssistenciaServiceMock(this: any) {
    this.getAllAgendamentos = mockGetAllAgendamentos;
    this.getStatistics = mockGetAgendamentoStatistics;
    this.updateAgendamento = mockUpdateAgendamento;
    this.confirmarAgendamento = mockConfirmarAgendamento;
    this.deleteAgendamento = mockDeleteAgendamento;
  }

  function ProfissionalAssistenciaServiceMock(this: any) {
    this.getAllProfissionais = mockGetAllProfissionais;
    this.getStatistics = mockGetProfissionalStatistics;
  }

  return {
    AgendamentoAssistenciaService: AgendamentoAssistenciaServiceMock,
    ProfissionalAssistenciaService: ProfissionalAssistenciaServiceMock
  };
});

jest.mock('@modules/assistance/fichas/application/services/AnamnesesPsicologicaService', () => {
  function AnamnesesPsicologicaServiceMock(this: any) {
    this.createAnamnese = jest.fn().mockResolvedValue({ id: 'anamnese-1' });
    this.updateAnamnese = jest.fn().mockResolvedValue(undefined);
  }

  return {
    AnamnesesPsicologicaService: AnamnesesPsicologicaServiceMock
  };
});

jest.mock('@modules/assistance/professional/application/services/ProfessionalHelpRequestService', () => {
  function ProfessionalHelpRequestServiceMock(this: any) {
    this.getReceivedRequests = mockGetReceivedRequests;
    this.getSentRequests = mockGetSentRequests;
  }

  return {
    ProfessionalHelpRequestService: ProfessionalHelpRequestServiceMock
  };
});

// Mock modal components
jest.mock('../../components/AgendamentoAssistenciaModalEnhanced', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSave, agendamento, mode }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="agendamento-modal">
        <h2>Agendamento Modal - {mode}</h2>
        {agendamento && <div>Editing: {agendamento.pacienteNome}</div>}
        <button onClick={onClose}>Close</button>
        <button
          onClick={() =>
            onSave({
              id: agendamento?.id || 'new-agend',
              pacienteId: 'pac-new',
              pacienteNome: 'Novo Paciente',
              pacienteTelefone: '11999999999',
              profissionalId: 'prof-1',
              profissionalNome: 'Dr. Maria Santos',
              tipoAssistencia: TipoAssistencia.Psicologica,
              dataHoraAgendamento: new Date(),
              status: StatusAgendamento.Agendado,
              observacoes: 'Test',
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        >
          Save
        </button>
      </div>
    );
  }
}));

jest.mock('../../components/ProfissionalAssistenciaModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSave, onDelete, onInactivate, profissional, mode }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="profissional-modal">
        <h2>Profissional Modal - {mode}</h2>
        {profissional && <div>Editing: {profissional.nome}</div>}
        <button onClick={onClose}>Close</button>
        <button
          onClick={() =>
            onSave({
              id: profissional?.id || 'new-prof',
              nome: 'Novo Profissional',
              registroProfissional: 'REG 12345',
              especialidade: TipoAssistencia.Psicologica,
              telefone: '11999999999',
              email: 'novo@example.com',
              status: StatusProfissional.Ativo,
              valorConsulta: 150,
              disponibilidade: ['Segunda'],
              createdAt: new Date(),
              updatedAt: new Date()
            })
          }
        >
          Save
        </button>
        {profissional && (
          <>
            <button onClick={() => onDelete(profissional.id)}>Delete</button>
            <button onClick={() => onInactivate(profissional.id, 'Test reason')}>Inactivate</button>
          </>
        )}
      </div>
    );
  }
}));

jest.mock('../../components/AnamnesesPsicologicaModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose, onSave, anamnese, mode }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="anamnese-modal">
        <h2>Anamnese Modal - {mode}</h2>
        <button onClick={onClose}>Close</button>
        <button
          onClick={() =>
            onSave({
              id: anamnese?.id || 'new-anamnese',
              nome: 'Test Patient',
              dataPreenchimento: new Date()
            })
          }
        >
          Save
        </button>
      </div>
    );
  }
}));

jest.mock('../../components/AssistanceReports', () => ({
  __esModule: true,
  default: () => <div data-testid="assistance-reports">Assistance Reports Component</div>
}));

// ============================================================================
// Helper Functions
// ============================================================================

const renderComponent = () => {
  return render(<AssistenciaManagementPage />);
};

// ============================================================================
// Tests
// ============================================================================

describe('AssistenciaManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllAgendamentos.mockResolvedValue(mockAgendamentos);
    mockGetAllProfissionais.mockResolvedValue(mockProfissionais);
    mockGetReceivedRequests.mockResolvedValue([mockHelpRequests[0]]);
    mockGetSentRequests.mockResolvedValue([mockHelpRequests[1], mockHelpRequests[2]]);
    mockConfirm.mockReturnValue(true);
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================
  describe('Rendering', () => {
    it('should render the page header correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciamento de Assistências')).toBeInTheDocument();
      });
      expect(screen.getByText('Gerenciamento de assistência psicológica, social, jurídica e médica')).toBeInTheDocument();
    });

    it('should render the top action buttons', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Agendamento')).toBeInTheDocument();
      });
      expect(screen.getByText('Ver Fichas')).toBeInTheDocument();
    });

    it('should render all statistics cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Agendamentos')).toBeInTheDocument();
      });
      expect(screen.getByText('Hoje')).toBeInTheDocument();
      expect(screen.getByText('Profissionais')).toBeInTheDocument();
      expect(screen.getByText('Ativos')).toBeInTheDocument();
    });

    it('should display correct statistics values', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument();
      });
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should render all tabs', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Agendamentos')).toBeInTheDocument();
      });
      expect(screen.getByText('Profissionais')).toBeInTheDocument();
      expect(screen.getByText('Pedidos de Ajuda')).toBeInTheDocument();
      expect(screen.getByText('Relatórios')).toBeInTheDocument();
      expect(screen.getByText('Estatísticas')).toBeInTheDocument();
    });
  });

  // ===========================================
  // DATA LOADING TESTS
  // ===========================================
  describe('Data Loading', () => {
    it('should load agendamentos on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGetAllAgendamentos).toHaveBeenCalledTimes(1);
      });
    });

    it('should load profissionais on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGetAllProfissionais).toHaveBeenCalled();
      });
    });

    it('should load statistics on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGetAgendamentoStatistics).toHaveBeenCalled();
      });
      expect(mockGetProfissionalStatistics).toHaveBeenCalled();
    });

    it('should load help requests on mount', async () => {
      renderComponent();

      await waitFor(() => {
        expect(mockGetReceivedRequests).toHaveBeenCalled();
      });
      expect(mockGetSentRequests).toHaveBeenCalled();
    });

    it('should handle error when loading agendamentos fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetAllAgendamentos.mockRejectedValueOnce(new Error('Load failed'));

      renderComponent();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading agendamentos:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle error when loading profissionais fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetAllProfissionais.mockRejectedValueOnce(new Error('Load failed'));

      renderComponent();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading profissionais:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle error when loading statistics fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetAgendamentoStatistics.mockRejectedValueOnce(new Error('Stats failed'));

      renderComponent();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalledWith('Error loading statistics:', expect.any(Error));
      });

      consoleError.mockRestore();
    });

    it('should handle error when loading help requests fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockGetAllProfissionais.mockRejectedValueOnce(new Error('Failed'));

      renderComponent();

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      consoleError.mockRestore();
    });
  });

  // ===========================================
  // AGENDAMENTOS TAB TESTS
  // ===========================================
  describe('Agendamentos Tab', () => {
    it('should display all agendamentos by default', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
      expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
      expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
    });

    it('should display agendamento details correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });
      expect(screen.getByText('11999999999')).toBeInTheDocument();
      expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument();
    });

    it('should show agendamento count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/3 de 3 agendamentos/)).toBeInTheDocument();
      });
    });

    it('should filter agendamentos by search term name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profissional ou telefone/);
      fireEvent.change(searchInput, { target: { value: 'João' } });

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
        expect(screen.queryByText('Maria Oliveira')).not.toBeInTheDocument();
        expect(screen.queryByText('Pedro Santos')).not.toBeInTheDocument();
      });
    });

    it('should filter agendamentos by search term phone', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profissional ou telefone/);
      fireEvent.change(searchInput, { target: { value: '11988888888' } });

      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
        expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
        expect(screen.queryByText('Pedro Santos')).not.toBeInTheDocument();
      });
    });

    it('should filter agendamentos by search term professional', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profissional ou telefone/);
      fireEvent.change(searchInput, { target: { value: 'Carlos' } });

      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
        expect(screen.queryByText('Maria Oliveira')).not.toBeInTheDocument();
        expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
      });
    });

    it('should filter agendamentos by status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusSelect, { target: { value: StatusAgendamento.Confirmado } });

      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
        expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
        expect(screen.queryByText('Pedro Santos')).not.toBeInTheDocument();
      });
    });

    it('should filter agendamentos by tipo', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const tipoSelect = screen.getByDisplayValue('Todos os Tipos');
      fireEvent.change(tipoSelect, { target: { value: TipoAssistencia.Juridica } });

      await waitFor(() => {
        expect(screen.queryByText('João Silva')).not.toBeInTheDocument();
        expect(screen.queryByText('Maria Oliveira')).not.toBeInTheDocument();
        expect(screen.getByText('Pedro Santos')).toBeInTheDocument();
      });
    });

    it('should update count when filters are applied', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/3 de 3 agendamentos/)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profissional ou telefone/);
      fireEvent.change(searchInput, { target: { value: 'João' } });

      await waitFor(() => {
        expect(screen.getByText(/1 de 3 agendamentos/)).toBeInTheDocument();
      });
    });

    it('should show empty state when no agendamentos match filters', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar por paciente, profissional ou telefone/);
      fireEvent.change(searchInput, { target: { value: 'NonExistentName' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhum agendamento encontrado')).toBeInTheDocument();
        expect(screen.getByText('Tente ajustar os filtros de busca')).toBeInTheDocument();
      });
    });

    it('should show empty state when no agendamentos exist', async () => {
      mockGetAllAgendamentos.mockResolvedValueOnce([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum agendamento encontrado')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // AGENDAMENTO CRUD TESTS
  // ===========================================
  describe('Agendamento CRUD Operations', () => {
    it('should open create modal when clicking new agendamento button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Agendamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Agendamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('agendamento-modal')).toBeInTheDocument();
        expect(screen.getByText('Agendamento Modal - create')).toBeInTheDocument();
      });
    });

    it('should open view modal when clicking ver button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText('Ver');
      fireEvent.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('agendamento-modal')).toBeInTheDocument();
        expect(screen.getByText('Agendamento Modal - view')).toBeInTheDocument();
        expect(screen.getByText('Editing: João Silva')).toBeInTheDocument();
      });
    });

    it('should open edit modal when clicking editar button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('agendamento-modal')).toBeInTheDocument();
        expect(screen.getByText('Agendamento Modal - edit')).toBeInTheDocument();
        expect(screen.getByText('Editing: João Silva')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking close button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Agendamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Agendamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('agendamento-modal')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('Close');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByTestId('agendamento-modal')).not.toBeInTheDocument();
      });
    });

    it('should add new agendamento when creating', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Novo Agendamento')).toBeInTheDocument();
      });

      const createButton = screen.getByText('Novo Agendamento');
      fireEvent.click(createButton);

      await waitFor(() => {
        expect(screen.getByTestId('agendamento-modal')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Novo Paciente')).toBeInTheDocument();
      });
    });

    it('should update agendamento when editing', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByTestId('agendamento-modal')).toBeInTheDocument();
      });

      const saveButton = screen.getByText('Save');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockGetAgendamentoStatistics).toHaveBeenCalled();
      });
    });

    it('should show confirm button for agendado status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      expect(screen.getByText('Confirmar')).toBeInTheDocument();
    });

    it('should not show confirm button for non-agendado status', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Maria Oliveira')).toBeInTheDocument();
      });

      const confirmButtons = screen.queryAllByText('Confirmar');
      expect(confirmButtons.length).toBe(1);
    });

    it('should confirm agendamento when clicking confirmar button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockConfirmarAgendamento).toHaveBeenCalledWith('agend-1', 'admin@church.com');
      });
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Agendamento confirmado'));
    });

    it('should handle error when confirming agendamento fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockConfirmarAgendamento.mockRejectedValueOnce(new Error('Confirm failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const confirmButton = screen.getByText('Confirmar');
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro ao atualizar status'));
      });

      consoleError.mockRestore();
    });

    it('should delete agendamento when clicking excluir button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('João Silva'));
      });
      expect(mockDeleteAgendamento).toHaveBeenCalledWith('agend-1');
      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('excluído com sucesso'));
    });

    it('should not delete agendamento when confirmation is cancelled', async () => {
      mockConfirm.mockReturnValueOnce(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
      });
      expect(mockDeleteAgendamento).not.toHaveBeenCalled();
    });

    it('should handle error when deleting agendamento fails', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();
      mockDeleteAgendamento.mockRejectedValueOnce(new Error('Delete failed'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('João Silva')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro ao excluir'));
      });

      consoleError.mockRestore();
    });
  });

  // ===========================================
  // PROFISSIONAIS TAB TESTS
  // ===========================================
  describe('Profissionais Tab', () => {
    it('should switch to profissionais tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Profissionais')).toBeInTheDocument();
      });

      const profissionaisTab = screen.getByText('Profissionais');
      fireEvent.click(profissionaisTab);

      await waitFor(() => {
        expect(screen.getByText('Profissionais Cadastrados')).toBeInTheDocument();
      });
    });

    it('should display all profissionais in the tab', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Profissionais')).toBeInTheDocument();
      });

      const profissionaisTab = screen.getByText('Profissionais');
      fireEvent.click(profissionaisTab);

      await waitFor(() => {
        expect(screen.getByText('Dr. Maria Santos')).toBeInTheDocument();
      });
      expect(screen.getByText('Dra. Ana Costa')).toBeInTheDocument();
      expect(screen.getByText('Dr. Carlos Lima')).toBeInTheDocument();
    });

    it('should display profissional details correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Profissionais')).toBeInTheDocument();
      });

      const profissionaisTab = screen.getByText('Profissionais');
      fireEvent.click(profissionaisTab);

      await waitFor(() => {
        expect(screen.getByText('CRP 123456')).toBeInTheDocument();
      });
      expect(screen.getByText('maria.santos@example.com')).toBeInTheDocument();
    });

    it('should show novo profissional button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Profissionais')).toBeInTheDocument();
      });

      const profissionaisTab = screen.getByText('Profissionais');
      fireEvent.click(profissionaisTab);

      await waitFor(() => {
        expect(screen.getByText('Novo Profissional')).toBeInTheDocument();
      });
    });
  });
});
