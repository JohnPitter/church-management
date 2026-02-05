// Unit Tests - ONG Activities Page
// Comprehensive tests for activities CRUD operations and reports management

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ONGActivitiesPage from '../ONGActivitiesPage';
import {
  AtividadeONG,
  StatusAtividade,
  TipoAtividade,
  Voluntario,
  StatusVoluntario
} from '@modules/ong-management/settings/domain/entities/ONG';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'admin@test.com',
  displayName: 'Test Admin',
  role: 'admin',
  status: 'approved'
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
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
  })
}));

// Mock FirebaseONGRepository
const mockGetAllAtividades = jest.fn();
const mockGetAllVoluntarios = jest.fn();
const mockCreateAtividade = jest.fn();
const mockUpdateAtividade = jest.fn();
const mockDeleteAtividade = jest.fn();

jest.mock('@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository', () => {
  function FirebaseONGRepositoryMock(this: any) {
    this.getAllAtividades = mockGetAllAtividades;
    this.getAllVoluntarios = mockGetAllVoluntarios;
    this.createAtividade = mockCreateAtividade;
    this.updateAtividade = mockUpdateAtividade;
    this.deleteAtividade = mockDeleteAtividade;
  }

  return {
    FirebaseONGRepository: FirebaseONGRepositoryMock
  };
});

// Mock window.confirm and window.alert
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

beforeAll(() => {
  window.confirm = mockConfirm;
  window.alert = mockAlert;
});

// Helper to create mock activity
const createMockActivity = (overrides: Partial<AtividadeONG> = {}): AtividadeONG => ({
  id: 'activity-1',
  nome: 'Test Activity',
  descricao: 'Test Description',
  tipo: TipoAtividade.Educacional,
  dataInicio: new Date('2024-06-01'),
  dataFim: new Date('2024-06-01'),
  horaInicio: '09:00',
  horaFim: '12:00',
  local: 'Test Location',
  responsavel: 'John Doe',
  voluntariosNecessarios: 5,
  voluntariosConfirmados: [],
  beneficiarios: 50,
  status: StatusAtividade.Planejada,
  recursos: [],
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin@test.com',
  ...overrides
});

// Helper to create mock volunteer
const createMockVolunteer = (overrides: Partial<Voluntario> = {}): Voluntario => ({
  id: 'volunteer-1',
  nome: 'Test Volunteer',
  email: 'volunteer@test.com',
  telefone: '11999999999',
  cpf: '12345678901',
  dataNascimento: new Date('1990-01-01'),
  endereco: {
    logradouro: 'Test Street',
    numero: '123',
    bairro: 'Test Neighborhood',
    cidade: 'Test City',
    estado: 'SP',
    cep: '01234567'
  },
  habilidades: ['Skill 1'],
  areasInteresse: ['Area 1'],
  disponibilidade: [],
  horasSemanaisDisponivel: 10,
  status: StatusVoluntario.Ativo,
  dataInicio: new Date(),
  emergencia: {
    nome: 'Emergency Contact',
    parentesco: 'Parent',
    telefone: '11888888888'
  },
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'admin@test.com',
  ...overrides
});

describe('ONGActivitiesPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllAtividades.mockResolvedValue([]);
    mockGetAllVoluntarios.mockResolvedValue([]);
    mockConfirm.mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching data', async () => {
      mockGetAllAtividades.mockImplementation(() => new Promise(() => {}));
      mockGetAllVoluntarios.mockImplementation(() => new Promise(() => {}));

      render(<ONGActivitiesPage />);

      expect(screen.getByText('Carregando atividades...')).toBeInTheDocument();
    });

    it('should hide loading after data is fetched', async () => {
      mockGetAllAtividades.mockResolvedValue([createMockActivity()]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.queryByText('Carregando atividades...')).not.toBeInTheDocument();
        expect(screen.getByText('Test Activity')).toBeInTheDocument();
      });
    });
  });

  describe('Activities List Display', () => {
    it('should render page header correctly', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerenciamento de Atividades')).toBeInTheDocument();
        expect(screen.getByText('Total de 0 atividades')).toBeInTheDocument();
      });
    });

    it('should display activity information in table', async () => {
      const activity = createMockActivity({
        nome: 'Food Distribution',
        tipo: TipoAtividade.Alimentacao,
        local: 'Community Center',
        voluntariosNecessarios: 10,
        voluntariosConfirmados: ['v1', 'v2'],
        beneficiarios: 100
      });
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Food Distribution')).toBeInTheDocument();
        expect(screen.getByText(/Community Center/)).toBeInTheDocument();
        expect(screen.getByText('2/10')).toBeInTheDocument();
        expect(screen.getByText('100 beneficiarios')).toBeInTheDocument();
      });
    });

    it('should display status badge with correct color', async () => {
      const activities = [
        createMockActivity({ id: '1', nome: 'Planned', status: StatusAtividade.Planejada }),
        createMockActivity({ id: '2', nome: 'In Progress', status: StatusAtividade.EmAndamento }),
        createMockActivity({ id: '3', nome: 'Completed', status: StatusAtividade.Concluida }),
        createMockActivity({ id: '4', nome: 'Cancelled', status: StatusAtividade.Cancelada })
      ];
      mockGetAllAtividades.mockResolvedValue(activities);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('planejada')).toBeInTheDocument();
        expect(screen.getByText('em_andamento')).toBeInTheDocument();
        expect(screen.getByText('concluida')).toBeInTheDocument();
        expect(screen.getByText('cancelada')).toBeInTheDocument();
      });
    });

    it('should update activity count when filtered', async () => {
      const activities = [
        createMockActivity({ id: '1', status: StatusAtividade.Planejada }),
        createMockActivity({ id: '2', status: StatusAtividade.Concluida })
      ];
      mockGetAllAtividades.mockResolvedValue(activities);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Total de 2 atividades')).toBeInTheDocument();
      });

      // Filter by status
      const statusSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(statusSelect, { target: { value: StatusAtividade.Planejada } });

      await waitFor(() => {
        expect(screen.getByText('Total de 1 atividades')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter activities by search term', async () => {
      const activities = [
        createMockActivity({ id: '1', nome: 'Food Program', descricao: 'Distribute food' }),
        createMockActivity({ id: '2', nome: 'Education Program', descricao: 'Teaching' })
      ];
      mockGetAllAtividades.mockResolvedValue(activities);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Food Program')).toBeInTheDocument();
        expect(screen.getByText('Education Program')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Nome, descricao ou local...');
      fireEvent.change(searchInput, { target: { value: 'food' } });

      await waitFor(() => {
        expect(screen.getByText('Food Program')).toBeInTheDocument();
        expect(screen.queryByText('Education Program')).not.toBeInTheDocument();
      });
    });

    it('should filter activities by status', async () => {
      const activities = [
        createMockActivity({ id: '1', nome: 'Active Activity', status: StatusAtividade.EmAndamento }),
        createMockActivity({ id: '2', nome: 'Completed Activity', status: StatusAtividade.Concluida })
      ];
      mockGetAllAtividades.mockResolvedValue(activities);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Active Activity')).toBeInTheDocument();
        expect(screen.getByText('Completed Activity')).toBeInTheDocument();
      });

      const statusSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(statusSelect, { target: { value: StatusAtividade.Concluida } });

      await waitFor(() => {
        expect(screen.queryByText('Active Activity')).not.toBeInTheDocument();
        expect(screen.getByText('Completed Activity')).toBeInTheDocument();
      });
    });

    it('should filter activities by type', async () => {
      const activities = [
        createMockActivity({ id: '1', nome: 'Health Activity', tipo: TipoAtividade.Saude }),
        createMockActivity({ id: '2', nome: 'Culture Activity', tipo: TipoAtividade.Cultura })
      ];
      mockGetAllAtividades.mockResolvedValue(activities);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(screen.getByText('Health Activity')).toBeInTheDocument();
        expect(screen.getByText('Culture Activity')).toBeInTheDocument();
      });

      const typeSelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(typeSelect, { target: { value: TipoAtividade.Saude } });

      await waitFor(() => {
        expect(screen.getByText('Health Activity')).toBeInTheDocument();
        expect(screen.queryByText('Culture Activity')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Activity', () => {
    it('should open create modal when clicking new activity button', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        expect(screen.getByText('Nova Atividade')).toBeInTheDocument();
        expect(screen.getByText('Nome da Atividade *')).toBeInTheDocument();
      });
    });

    it('should validate required fields when creating activity', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Cadastrar'));
      });

      expect(mockAlert).toHaveBeenCalledWith('Nome da atividade e obrigatorio');
    });

    it('should validate date range when creating activity', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        // Fill name
        const nameInput = document.querySelector('input[type="text"]');
        if (nameInput) {
          fireEvent.change(nameInput, { target: { value: 'Test Activity' } });
        }

        // Set invalid date range (end before start)
        const dateInputs = document.querySelectorAll('input[type="date"]');
        fireEvent.change(dateInputs[0], { target: { value: '2024-12-31' } });
        fireEvent.change(dateInputs[1], { target: { value: '2024-01-01' } });
      });

      fireEvent.click(screen.getByText('Cadastrar'));

      expect(mockAlert).toHaveBeenCalledWith('Data de inicio nao pode ser posterior a data de fim');
    });

    it('should create activity successfully with valid data', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockCreateAtividade.mockResolvedValue(createMockActivity());

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        // Fill required fields
        const inputs = document.querySelectorAll('input[type="text"]');
        fireEvent.change(inputs[0], { target: { value: 'New Activity' } }); // nome
        fireEvent.change(inputs[1], { target: { value: 'Test Location' } }); // local
        fireEvent.change(inputs[2], { target: { value: 'Test Responsible' } }); // responsavel

        const dateInputs = document.querySelectorAll('input[type="date"]');
        fireEvent.change(dateInputs[0], { target: { value: '2024-06-01' } });
        fireEvent.change(dateInputs[1], { target: { value: '2024-06-30' } });
      });

      fireEvent.click(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(mockCreateAtividade).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Atividade cadastrada com sucesso!');
      });
    });

    it('should close modal when clicking cancel button', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        expect(screen.getByText('Nova Atividade')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancelar'));

      await waitFor(() => {
        expect(screen.queryByText('Nome da Atividade *')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Activity', () => {
    it('should open edit modal with activity data', async () => {
      const activity = createMockActivity({ nome: 'Existing Activity', descricao: 'Existing Description' });
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Editar'));
      });

      await waitFor(() => {
        expect(screen.getByText('Editar Atividade')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Activity')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      });
    });

    it('should update activity successfully', async () => {
      const activity = createMockActivity();
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockUpdateAtividade.mockResolvedValue(undefined);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Editar'));
      });

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test Activity');
        fireEvent.change(nameInput, { target: { value: 'Updated Activity' } });
      });

      fireEvent.click(screen.getByText('Atualizar'));

      await waitFor(() => {
        expect(mockUpdateAtividade).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Atividade atualizada com sucesso!');
      });
    });
  });

  describe('Delete Activity', () => {
    it('should show confirmation before deleting', async () => {
      mockGetAllAtividades.mockResolvedValue([createMockActivity()]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockConfirm.mockReturnValue(false);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta atividade?');
      expect(mockDeleteAtividade).not.toHaveBeenCalled();
    });

    it('should delete activity when confirmed', async () => {
      mockGetAllAtividades.mockResolvedValue([createMockActivity()]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockConfirm.mockReturnValue(true);
      mockDeleteAtividade.mockResolvedValue(undefined);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      await waitFor(() => {
        expect(mockDeleteAtividade).toHaveBeenCalledWith('activity-1');
        expect(mockAlert).toHaveBeenCalledWith('Atividade excluida com sucesso!');
      });
    });
  });

  describe('View Details', () => {
    it('should open details modal when clicking view button', async () => {
      const activity = createMockActivity({
        nome: 'Test Activity',
        descricao: 'Detailed description',
        local: 'Test Location',
        responsavel: 'John Doe'
      });
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText('Detalhes da Atividade')).toBeInTheDocument();
        expect(screen.getByText('Detailed description')).toBeInTheDocument();
      });
    });

    it('should display volunteer names in details', async () => {
      const volunteer = createMockVolunteer({ id: 'v1', nome: 'Jane Volunteer' });
      const activity = createMockActivity({
        voluntariosConfirmados: ['v1']
      });
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText('Jane Volunteer')).toBeInTheDocument();
      });
    });

    it('should close details modal when clicking close button', async () => {
      mockGetAllAtividades.mockResolvedValue([createMockActivity()]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText('Detalhes da Atividade')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fechar'));

      await waitFor(() => {
        expect(screen.queryByText('Detalhes da Atividade')).not.toBeInTheDocument();
      });
    });
  });

  describe('Activity Report', () => {
    it('should show report button for in-progress or completed activities', async () => {
      const activities = [
        createMockActivity({ id: '1', nome: 'In Progress', status: StatusAtividade.EmAndamento }),
        createMockActivity({ id: '2', nome: 'Completed', status: StatusAtividade.Concluida }),
        createMockActivity({ id: '3', nome: 'Planned', status: StatusAtividade.Planejada })
      ];
      mockGetAllAtividades.mockResolvedValue(activities);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        const reportButtons = screen.getAllByText('Relatorio');
        expect(reportButtons.length).toBe(2); // Only for in-progress and completed
      });
    });

    it('should open report modal when clicking report button', async () => {
      const activity = createMockActivity({ status: StatusAtividade.EmAndamento });
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Relatorio'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Relatorio da Atividade:/)).toBeInTheDocument();
        expect(screen.getByText('Horas Realizadas')).toBeInTheDocument();
        expect(screen.getByText('Beneficiarios Atendidos')).toBeInTheDocument();
      });
    });

    it('should save report successfully', async () => {
      const activity = createMockActivity({ status: StatusAtividade.EmAndamento });
      mockGetAllAtividades.mockResolvedValue([activity]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockUpdateAtividade.mockResolvedValue(undefined);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Relatorio'));
      });

      await waitFor(() => {
        const resultsInput = screen.getByPlaceholderText('Descreva os principais resultados alcancados...');
        fireEvent.change(resultsInput, { target: { value: 'Great results achieved' } });
      });

      fireEvent.click(screen.getByText('Salvar Relatorio'));

      await waitFor(() => {
        expect(mockUpdateAtividade).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Relatorio salvo com sucesso!');
      });
    });
  });

  describe('Volunteer Selection', () => {
    it('should display volunteers in modal form', async () => {
      const volunteers = [
        createMockVolunteer({ id: 'v1', nome: 'Volunteer 1', email: 'v1@test.com' }),
        createMockVolunteer({ id: 'v2', nome: 'Volunteer 2', email: 'v2@test.com' })
      ];
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        expect(screen.getByText('Voluntarios Confirmados')).toBeInTheDocument();
        expect(screen.getByText(/Volunteer 1/)).toBeInTheDocument();
        expect(screen.getByText(/Volunteer 2/)).toBeInTheDocument();
      });
    });

    it('should filter volunteers by search term', async () => {
      const volunteers = [
        createMockVolunteer({ id: 'v1', nome: 'Alice Smith', email: 'alice@test.com' }),
        createMockVolunteer({ id: 'v2', nome: 'Bob Jones', email: 'bob@test.com' })
      ];
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(/Pesquisar voluntarios/);
        fireEvent.change(searchInput, { target: { value: 'alice' } });
      });

      await waitFor(() => {
        expect(screen.getByText(/Alice Smith/)).toBeInTheDocument();
        expect(screen.queryByText(/Bob Jones/)).not.toBeInTheDocument();
      });
    });

    it('should toggle volunteer selection', async () => {
      const volunteer = createMockVolunteer({ id: 'v1', nome: 'Test Volunteer' });
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        const checkbox = screen.getByRole('checkbox', { name: /Test Volunteer/i });
        expect(checkbox).not.toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).toBeChecked();

        fireEvent.click(checkbox);
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Resources Management', () => {
    it('should add resources to activity', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        const tipoInput = screen.getByPlaceholderText('ex: Alimentacao, Material...');
        const descInput = screen.getByPlaceholderText('ex: Marmitas para almoco...');

        fireEvent.change(tipoInput, { target: { value: 'Food' } });
        fireEvent.change(descInput, { target: { value: 'Lunch meals' } });
      });

      fireEvent.click(screen.getByText('Adicionar'));

      await waitFor(() => {
        expect(screen.getByText(/Food/)).toBeInTheDocument();
        expect(screen.getByText(/Lunch meals/)).toBeInTheDocument();
      });
    });

    it('should remove resources from activity', async () => {
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      // Add a resource first
      await waitFor(() => {
        const tipoInput = screen.getByPlaceholderText('ex: Alimentacao, Material...');
        const descInput = screen.getByPlaceholderText('ex: Marmitas para almoco...');

        fireEvent.change(tipoInput, { target: { value: 'Food' } });
        fireEvent.change(descInput, { target: { value: 'Lunch meals' } });
      });

      fireEvent.click(screen.getByText('Adicionar'));

      await waitFor(() => {
        expect(screen.getByText(/Food/)).toBeInTheDocument();
      });

      // Remove the resource
      fireEvent.click(screen.getByText('Remover'));

      await waitFor(() => {
        // The resource should be removed from the list
        const resourceItems = screen.queryAllByText(/Food.*Lunch meals/);
        expect(resourceItems.length).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading data fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllAtividades.mockRejectedValue(new Error('Network error'));
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao carregar dados');
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when creating activity fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllAtividades.mockResolvedValue([]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockCreateAtividade.mockRejectedValue(new Error('Create failed'));

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('+ Nova Atividade'));
      });

      await waitFor(() => {
        const inputs = document.querySelectorAll('input[type="text"]');
        fireEvent.change(inputs[0], { target: { value: 'New Activity' } });
        fireEvent.change(inputs[1], { target: { value: 'Location' } });
        fireEvent.change(inputs[2], { target: { value: 'Responsible' } });

        const dateInputs = document.querySelectorAll('input[type="date"]');
        fireEvent.change(dateInputs[0], { target: { value: '2024-06-01' } });
        fireEvent.change(dateInputs[1], { target: { value: '2024-06-30' } });
      });

      fireEvent.click(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao salvar atividade');
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when deleting activity fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllAtividades.mockResolvedValue([createMockActivity()]);
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockDeleteAtividade.mockRejectedValue(new Error('Delete failed'));

      render(<ONGActivitiesPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao excluir atividade');
      });

      consoleSpy.mockRestore();
    });
  });
});
