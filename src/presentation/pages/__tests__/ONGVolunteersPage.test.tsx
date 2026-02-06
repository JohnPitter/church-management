// Unit Tests - ONG Volunteers Page
// Comprehensive tests for volunteer CRUD operations and management

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ONGVolunteersPage from '../ONGVolunteersPage';
import {
  Voluntario,
  StatusVoluntario,
  ONGEntity
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
const mockGetAllVoluntarios = jest.fn();
const mockCreateVoluntario = jest.fn();
const mockUpdateVoluntario = jest.fn();
const mockDeleteVoluntario = jest.fn();

jest.mock('@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository', () => {
  function FirebaseONGRepositoryMock(this: any) {
    this.getAllVoluntarios = mockGetAllVoluntarios;
    this.createVoluntario = mockCreateVoluntario;
    this.updateVoluntario = mockUpdateVoluntario;
    this.deleteVoluntario = mockDeleteVoluntario;
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

// Helper to create mock volunteer
const createMockVolunteer = (overrides: Partial<Voluntario> = {}): Voluntario => ({
  id: 'volunteer-1',
  nome: 'Test Volunteer',
  email: 'volunteer@test.com',
  telefone: '11999999999',
  cpf: '52998224725', // Valid CPF
  dataNascimento: new Date('1990-01-15'),
  endereco: {
    logradouro: 'Test Street',
    numero: '123',
    complemento: 'Apt 1',
    bairro: 'Test Neighborhood',
    cidade: 'Test City',
    estado: 'SP',
    cep: '01234567'
  },
  habilidades: ['Skill 1', 'Skill 2'],
  areasInteresse: ['Education', 'Health'],
  disponibilidade: [
    { diaSemana: 1, horaInicio: '09:00', horaFim: '12:00' }
  ],
  horasSemanaisDisponivel: 10,
  status: StatusVoluntario.Ativo,
  dataInicio: new Date('2024-01-01'),
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

describe('ONGVolunteersPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllVoluntarios.mockResolvedValue([]);
    mockConfirm.mockReturnValue(true);
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching data', async () => {
      mockGetAllVoluntarios.mockImplementation(() => new Promise(() => {}));

      render(<ONGVolunteersPage />);

      expect(screen.getByText(/Carregando volunt/)).toBeInTheDocument();
    });

    it('should hide loading after data is fetched', async () => {
      mockGetAllVoluntarios.mockResolvedValue([createMockVolunteer()]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.queryByText(/Carregando volunt/)).not.toBeInTheDocument();
        expect(screen.getByText('Test Volunteer')).toBeInTheDocument();
      });
    });
  });

  describe('Volunteers List Display', () => {
    it('should render page header correctly', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gerenciamento de Volunt/)).toBeInTheDocument();
        expect(screen.getByText(/Total de 0 volunt/)).toBeInTheDocument();
      });
    });

    it('should display volunteer information in table', async () => {
      const volunteer = createMockVolunteer({
        nome: 'Jane Doe',
        email: 'jane@test.com',
        telefone: '11987654321',
        cpf: '52998224725',
        horasSemanaisDisponivel: 15
      });
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
        expect(screen.getByText('jane@test.com')).toBeInTheDocument();
        expect(screen.getByText('15h')).toBeInTheDocument();
        expect(screen.getByText(ONGEntity.formatarCPF('52998224725'), { exact: false })).toBeInTheDocument();
      });
    });

    it('should display status badge with correct color', async () => {
      const volunteers = [
        createMockVolunteer({ id: '1', nome: 'Active', status: StatusVoluntario.Ativo }),
        createMockVolunteer({ id: '2', nome: 'Inactive', status: StatusVoluntario.Inativo }),
        createMockVolunteer({ id: '3', nome: 'Away', status: StatusVoluntario.Afastado }),
        createMockVolunteer({ id: '4', nome: 'Terminated', status: StatusVoluntario.Desligado }),
        createMockVolunteer({ id: '5', nome: 'Pending', status: StatusVoluntario.Pendente })
      ];
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText('ativo')).toBeInTheDocument();
        expect(screen.getByText('inativo')).toBeInTheDocument();
        expect(screen.getByText('afastado')).toBeInTheDocument();
        expect(screen.getByText('desligado')).toBeInTheDocument();
        expect(screen.getByText('pendente')).toBeInTheDocument();
      });
    });

    it('should update volunteer count when filtered', async () => {
      const volunteers = [
        createMockVolunteer({ id: '1', status: StatusVoluntario.Ativo }),
        createMockVolunteer({ id: '2', status: StatusVoluntario.Inativo })
      ];
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText(/Total de 2 volunt/)).toBeInTheDocument();
      });

      // Filter by status
      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: StatusVoluntario.Ativo } });

      await waitFor(() => {
        expect(screen.getByText(/Total de 1 volunt/)).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter volunteers by search term (name)', async () => {
      const volunteers = [
        createMockVolunteer({ id: '1', nome: 'Alice Smith' }),
        createMockVolunteer({ id: '2', nome: 'Bob Jones' })
      ];
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.getByText('Bob Jones')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Nome, email ou CPF/);
      fireEvent.change(searchInput, { target: { value: 'alice' } });

      await waitFor(() => {
        expect(screen.getByText('Alice Smith')).toBeInTheDocument();
        expect(screen.queryByText('Bob Jones')).not.toBeInTheDocument();
      });
    });

    it('should filter volunteers by search term (email)', async () => {
      const volunteers = [
        createMockVolunteer({ id: '1', nome: 'Volunteer 1', email: 'alice@test.com' }),
        createMockVolunteer({ id: '2', nome: 'Volunteer 2', email: 'bob@test.com' })
      ];
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText('alice@test.com')).toBeInTheDocument();
        expect(screen.getByText('bob@test.com')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Nome, email ou CPF/);
      fireEvent.change(searchInput, { target: { value: 'alice@' } });

      await waitFor(() => {
        expect(screen.getByText('alice@test.com')).toBeInTheDocument();
        expect(screen.queryByText('bob@test.com')).not.toBeInTheDocument();
      });
    });

    it('should filter volunteers by search term (CPF)', async () => {
      const volunteers = [
        createMockVolunteer({ id: '1', nome: 'Volunteer 1', cpf: '12345678901' }),
        createMockVolunteer({ id: '2', nome: 'Volunteer 2', cpf: '98765432100' })
      ];
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGVolunteersPage />);

      // Wait for data to load before accessing search input
      await waitFor(() => {
        expect(screen.getByText('Volunteer 1')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Nome, email ou CPF/);
      fireEvent.change(searchInput, { target: { value: '123456' } });

      await waitFor(() => {
        expect(screen.getByText('Volunteer 1')).toBeInTheDocument();
        expect(screen.queryByText('Volunteer 2')).not.toBeInTheDocument();
      });
    });

    it('should filter volunteers by status', async () => {
      const volunteers = [
        createMockVolunteer({ id: '1', nome: 'Active Volunteer', status: StatusVoluntario.Ativo }),
        createMockVolunteer({ id: '2', nome: 'Inactive Volunteer', status: StatusVoluntario.Inativo })
      ];
      mockGetAllVoluntarios.mockResolvedValue(volunteers);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText('Active Volunteer')).toBeInTheDocument();
        expect(screen.getByText('Inactive Volunteer')).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox');
      fireEvent.change(statusSelect, { target: { value: StatusVoluntario.Ativo } });

      await waitFor(() => {
        expect(screen.getByText('Active Volunteer')).toBeInTheDocument();
        expect(screen.queryByText('Inactive Volunteer')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Volunteer', () => {
    it('should open create modal when clicking new volunteer button', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish and button to appear
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      await waitFor(() => {
        // Check form fields are visible (modal is open)
        // "Nome *" appears twice (volunteer name + emergency contact name)
        expect(screen.getAllByText('Nome *').length).toBeGreaterThan(0);
        expect(screen.getByText('CPF *')).toBeInTheDocument();
        expect(screen.getByText('Email *')).toBeInTheDocument();
      });
    });

    it('should validate required fields when creating volunteer', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      await waitFor(() => {
        fireEvent.click(screen.getByText('Cadastrar'));
      });

      expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Nome'));
    });

    it('should validate CPF format when creating volunteer', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('CPF *')).toBeInTheDocument();
      });

      // Find inputs within the modal (the fixed overlay)
      const modal = document.querySelector('.fixed.inset-0.z-50');
      expect(modal).toBeTruthy();
      const modalInputs = modal!.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
      // Order: nome(text), cpf(text), email(email), telefone(tel)

      fireEvent.change(modalInputs[0], { target: { value: 'Test Volunteer' } }); // nome
      fireEvent.change(modalInputs[1], { target: { value: '12345678900' } }); // cpf (invalid)
      fireEvent.change(modalInputs[2], { target: { value: 'test@test.com' } }); // email
      fireEvent.change(modalInputs[3], { target: { value: '11999999999' } }); // telefone

      // Fill emergency contact name
      const emergencyInputs = Array.from(modalInputs).slice(-4);
      if (emergencyInputs.length >= 1) {
        fireEvent.change(emergencyInputs[0], { target: { value: 'Emergency Contact' } });
      }

      fireEvent.click(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('CPF'));
      });
    });

    it('should create volunteer successfully with valid data', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockCreateVoluntario.mockResolvedValue(createMockVolunteer());

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('CPF *')).toBeInTheDocument();
      });

      // Find inputs within the modal
      const modal = document.querySelector('.fixed.inset-0.z-50');
      const modalInputs = modal!.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');

      fireEvent.change(modalInputs[0], { target: { value: 'New Volunteer' } }); // nome
      fireEvent.change(modalInputs[1], { target: { value: '52998224725' } }); // cpf (valid)
      fireEvent.change(modalInputs[2], { target: { value: 'new@test.com' } }); // email
      fireEvent.change(modalInputs[3], { target: { value: '11999999999' } }); // telefone

      // Set date
      const dateInputs = modal!.querySelectorAll('input[type="date"]');
      if (dateInputs.length > 0) {
        fireEvent.change(dateInputs[0], { target: { value: '1990-01-01' } });
      }

      // Fill emergency contact name
      const allModalInputs = modal!.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
      const emergencyInputs = Array.from(allModalInputs).slice(-4);
      if (emergencyInputs.length >= 1) {
        fireEvent.change(emergencyInputs[0], { target: { value: 'Emergency Contact' } });
      }

      fireEvent.click(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(mockCreateVoluntario).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('cadastrado com sucesso'));
      });
    });

    it('should close modal when clicking cancel button', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      // Wait for modal form fields to appear
      await waitFor(() => {
        expect(screen.getByText('CPF *')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancelar'));

      // After closing, the form fields should disappear
      await waitFor(() => {
        expect(screen.queryByText('CPF *')).not.toBeInTheDocument();
      });
    });
  });

  describe('Edit Volunteer', () => {
    it('should open edit modal with volunteer data', async () => {
      const volunteer = createMockVolunteer({ nome: 'Existing Volunteer', email: 'existing@test.com' });
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Editar'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Editar Volunt/)).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Volunteer')).toBeInTheDocument();
        expect(screen.getByDisplayValue('existing@test.com')).toBeInTheDocument();
      });
    });

    it('should update volunteer successfully', async () => {
      const volunteer = createMockVolunteer();
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);
      mockUpdateVoluntario.mockResolvedValue(undefined);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Editar'));
      });

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test Volunteer');
        fireEvent.change(nameInput, { target: { value: 'Updated Volunteer' } });
      });

      fireEvent.click(screen.getByText('Atualizar'));

      await waitFor(() => {
        expect(mockUpdateVoluntario).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('atualizado com sucesso'));
      });
    });
  });

  describe('Delete Volunteer', () => {
    it('should show confirmation before deleting', async () => {
      mockGetAllVoluntarios.mockResolvedValue([createMockVolunteer()]);
      mockConfirm.mockReturnValue(false);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      expect(mockConfirm).toHaveBeenCalledWith(expect.stringContaining('excluir'));
      expect(mockDeleteVoluntario).not.toHaveBeenCalled();
    });

    it('should delete volunteer when confirmed', async () => {
      mockGetAllVoluntarios.mockResolvedValue([createMockVolunteer()]);
      mockConfirm.mockReturnValue(true);
      mockDeleteVoluntario.mockResolvedValue(undefined);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      await waitFor(() => {
        expect(mockDeleteVoluntario).toHaveBeenCalledWith('volunteer-1');
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('sucesso'));
      });
    });
  });

  describe('View Details', () => {
    it('should open details modal when clicking view button', async () => {
      const volunteer = createMockVolunteer({
        nome: 'Jane Doe',
        email: 'jane@test.com',
        habilidades: ['Teaching', 'Cooking'],
        areasInteresse: ['Education', 'Food']
      });
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(screen.getByText('Jane Doe')).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText('Ver'));

      await waitFor(() => {
        expect(screen.getByText(/Detalhes do Volunt/)).toBeInTheDocument();
        expect(screen.getAllByText('Jane Doe').length).toBeGreaterThan(0);
        // Email appears in both table row and details modal
        expect(screen.getAllByText('jane@test.com').length).toBeGreaterThan(0);
      });
    });

    it('should display skills and interests in details modal', async () => {
      const volunteer = createMockVolunteer({
        habilidades: ['Teaching', 'Cooking'],
        areasInteresse: ['Education', 'Food']
      });
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText('Teaching')).toBeInTheDocument();
        expect(screen.getByText('Cooking')).toBeInTheDocument();
        expect(screen.getByText('Education')).toBeInTheDocument();
        expect(screen.getByText('Food')).toBeInTheDocument();
      });
    });

    it('should display availability in details modal', async () => {
      const volunteer = createMockVolunteer({
        horasSemanaisDisponivel: 20,
        disponibilidade: [
          { diaSemana: 1, horaInicio: '09:00', horaFim: '12:00' },
          { diaSemana: 3, horaInicio: '14:00', horaFim: '17:00' }
        ]
      });
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText('Horas semanais: 20h')).toBeInTheDocument();
        expect(screen.getByText('Segunda: 09:00 - 12:00')).toBeInTheDocument();
        expect(screen.getByText('Quarta: 14:00 - 17:00')).toBeInTheDocument();
      });
    });

    it('should display emergency contact in details modal', async () => {
      const volunteer = createMockVolunteer({
        emergencia: {
          nome: 'John Emergency',
          parentesco: 'Father',
          telefone: '11888888888'
        }
      });
      mockGetAllVoluntarios.mockResolvedValue([volunteer]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText('John Emergency')).toBeInTheDocument();
        expect(screen.getByText('Father')).toBeInTheDocument();
      });
    });

    it('should close details modal when clicking close button', async () => {
      mockGetAllVoluntarios.mockResolvedValue([createMockVolunteer()]);

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Ver'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Detalhes do Volunt/)).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Fechar'));

      await waitFor(() => {
        expect(screen.queryByText(/Detalhes do Volunt/)).not.toBeInTheDocument();
      });
    });
  });

  describe('Skills Management', () => {
    it('should add skills to volunteer', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      await waitFor(() => {
        const skillInput = screen.getByPlaceholderText('Digite uma habilidade');
        fireEvent.change(skillInput, { target: { value: 'New Skill' } });
      });

      // Find the add button for skills (first "Adicionar" button)
      const addButtons = screen.getAllByText('Adicionar');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('New Skill')).toBeInTheDocument();
      });
    });

    it('should remove skills from volunteer', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      // Add a skill first
      await waitFor(() => {
        const skillInput = screen.getByPlaceholderText('Digite uma habilidade');
        fireEvent.change(skillInput, { target: { value: 'Skill to Remove' } });
      });

      const addButtons = screen.getAllByText('Adicionar');
      fireEvent.click(addButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Skill to Remove')).toBeInTheDocument();
      });

      // Remove the skill (click the X button)
      const removeButton = screen.getByText('Skill to Remove').parentElement?.querySelector('button');
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Skill to Remove')).not.toBeInTheDocument();
      });
    });
  });

  describe('Areas of Interest Management', () => {
    it('should add areas of interest to volunteer', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      await waitFor(() => {
        // Use more specific placeholder to target the area input (not the skill input)
        const areaInput = screen.getByPlaceholderText(/Digite uma.*rea/);
        fireEvent.change(areaInput, { target: { value: 'New Area' } });
      });

      // Find the add button for areas (second "Adicionar" button)
      const addButtons = screen.getAllByText('Adicionar');
      fireEvent.click(addButtons[1]);

      await waitFor(() => {
        expect(screen.getByText('New Area')).toBeInTheDocument();
      });
    });
  });

  describe('Availability Management', () => {
    it('should add availability time slot', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Adicionar Hor/));
      });

      await waitFor(() => {
        // Check for day of week dropdown and time inputs
        const daySelects = document.querySelectorAll('select');
        expect(daySelects.length).toBeGreaterThan(0);

        const timeInputs = document.querySelectorAll('input[type="time"]');
        expect(timeInputs.length).toBe(2); // Start and end time
      });
    });

    it('should remove availability time slot', async () => {
      mockGetAllVoluntarios.mockResolvedValue([]);

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      await waitFor(() => {
        fireEvent.click(screen.getByText(/Adicionar Hor/));
      });

      await waitFor(() => {
        const timeInputsBefore = document.querySelectorAll('input[type="time"]');
        expect(timeInputsBefore.length).toBe(2);
      });

      // Remove the availability
      const removeButtons = screen.getAllByText('Remover');
      fireEvent.click(removeButtons[removeButtons.length - 1]);

      await waitFor(() => {
        const timeInputsAfter = document.querySelectorAll('input[type="time"]');
        expect(timeInputsAfter.length).toBe(0);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading volunteers fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllVoluntarios.mockRejectedValue(new Error('Network error'));

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro ao carregar'));
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when creating volunteer fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllVoluntarios.mockResolvedValue([]);
      mockCreateVoluntario.mockRejectedValue(new Error('Create failed'));

      render(<ONGVolunteersPage />);

      // Wait for loading to finish
      await waitFor(() => {
        expect(screen.getByText(/\+ Novo Volunt/)).toBeInTheDocument();
      });
      fireEvent.click(screen.getByText(/\+ Novo Volunt/));

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByText('CPF *')).toBeInTheDocument();
      });

      // Find inputs within the modal (the fixed overlay) to avoid the search input
      const modal = document.querySelector('.fixed.inset-0.z-50');
      expect(modal).toBeTruthy();
      const modalInputs = modal!.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
      // Order: nome(text), cpf(text), email(email), telefone(tel)

      fireEvent.change(modalInputs[0], { target: { value: 'Test' } }); // nome
      fireEvent.change(modalInputs[1], { target: { value: '52998224725' } }); // cpf (valid)
      fireEvent.change(modalInputs[2], { target: { value: 'test@test.com' } }); // email
      fireEvent.change(modalInputs[3], { target: { value: '11999999999' } }); // telefone

      // Fill emergency contact name
      const allModalInputs = modal!.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"]');
      const emergencyInputs = Array.from(allModalInputs).slice(-4);
      if (emergencyInputs.length >= 1) {
        fireEvent.change(emergencyInputs[0], { target: { value: 'Emergency' } });
      }

      fireEvent.click(screen.getByText('Cadastrar'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro ao salvar'));
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when deleting volunteer fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetAllVoluntarios.mockResolvedValue([createMockVolunteer()]);
      mockDeleteVoluntario.mockRejectedValue(new Error('Delete failed'));

      render(<ONGVolunteersPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro ao excluir'));
      });

      consoleSpy.mockRestore();
    });
  });
});
