// Unit Tests - Admin Projects Management Page
// Comprehensive tests for projects CRUD operations and registrations management

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminProjectsManagementPage } from '../AdminProjectsManagementPage';
import { Project, ProjectStatus, ProjectRegistration, RegistrationStatus } from '@modules/content-management/projects/domain/entities/Project';

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

// Mock useNotificationActions
const mockNotifyNewProject = jest.fn().mockResolvedValue(5);

jest.mock('../../hooks/useNotificationActions', () => ({
  useNotificationActions: () => ({
    notifyNewProject: mockNotifyNewProject
  })
}));

// Mock usePermissions
const mockHasPermission = jest.fn();

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
    loading: false
  })
}));

// Mock FirebaseProjectRepository - Create mock functions outside jest.mock to avoid hoisting issues
const mockFindAll = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpdateStatus = jest.fn();
const mockFindRegistrations = jest.fn();
const mockUpdateRegistrationStatus = jest.fn();

jest.mock('@modules/content-management/projects/infrastructure/repositories/FirebaseProjectRepository', () => {
  function FirebaseProjectRepositoryMock(this: any) {
    this.findAll = mockFindAll;
    this.create = mockCreate;
    this.update = mockUpdate;
    this.delete = mockDelete;
    this.updateStatus = mockUpdateStatus;
    this.findRegistrations = mockFindRegistrations;
    this.updateRegistrationStatus = mockUpdateRegistrationStatus;
  }

  return {
    FirebaseProjectRepository: FirebaseProjectRepositoryMock
  };
});

// Mock loggingService
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logDatabase: jest.fn(),
    logApi: jest.fn()
  }
}));

// Mock NotificationService
jest.mock('@modules/shared-kernel/notifications/infrastructure/services/NotificationService', () => ({
  NotificationService: jest.fn().mockImplementation(() => ({
    notifyProjectApproval: jest.fn().mockResolvedValue(undefined),
    notifyProjectRejection: jest.fn().mockResolvedValue(undefined)
  }))
}));

// Mock window.confirm
const mockConfirm = jest.fn();
const mockAlert = jest.fn();

beforeAll(() => {
  window.confirm = mockConfirm;
  window.alert = mockAlert;
});

// Helper to create mock projects
const createMockProject = (overrides: Partial<Project> = {}): Project => ({
  id: 'project-1',
  name: 'Test Project',
  description: 'Test Description',
  objectives: ['Objective 1', 'Objective 2'],
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  responsible: 'John Doe',
  status: ProjectStatus.Active,
  category: 'Acao Social',
  budget: 10000,
  maxParticipants: 20,
  requiresApproval: true,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: 'user-123',
  ...overrides
});

const createMockRegistration = (overrides: Partial<ProjectRegistration> = {}): ProjectRegistration => ({
  id: 'reg-1',
  projectId: 'project-1',
  userId: 'user-456',
  userName: 'test@user.com',
  registrationDate: new Date(),
  status: RegistrationStatus.Pending,
  ...overrides
});

describe('AdminProjectsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockHasPermission.mockReturnValue(true);
    mockFindAll.mockResolvedValue([]);
    mockConfirm.mockReturnValue(true);
  });

  describe('Permission Checks', () => {
    it('should show loading state when permissions are loading', async () => {
      const { usePermissions } = require('../../hooks/usePermissions');
      usePermissions.mockReturnValue({
        hasPermission: () => true,
        loading: true
      });

      render(<AdminProjectsManagementPage />);

      expect(screen.getByText('Verificando permissoes...')).toBeInTheDocument();

      // Reset mock
      usePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: false
      });
    });

    it('should show access denied when user lacks view permission', async () => {
      mockHasPermission.mockReturnValue(false);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(screen.getByText('Voce nao tem permissao para visualizar projetos.')).toBeInTheDocument();
    });

    it('should render page when user has view permission', async () => {
      mockHasPermission.mockReturnValue(true);
      mockFindAll.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Projetos')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading skeleton while fetching projects', async () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        const skeleton = document.querySelector('.animate-pulse');
        expect(skeleton).toBeInTheDocument();
      });
    });

    it('should stop showing loading after projects are fetched', async () => {
      mockFindAll.mockResolvedValue([createMockProject()]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no projects exist', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum projeto cadastrado')).toBeInTheDocument();
        expect(screen.getByText('Comece criando seu primeiro projeto')).toBeInTheDocument();
      });
    });

    it('should show no results message when filters return no matches', async () => {
      mockFindAll.mockResolvedValue([createMockProject({ status: ProjectStatus.Active })]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Change status filter to cancelled
      const statusSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(statusSelect, { target: { value: 'cancelled' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhum projeto encontrado')).toBeInTheDocument();
      });
    });
  });

  describe('Projects List Display', () => {
    it('should display project information correctly', async () => {
      const project = createMockProject({
        name: 'Social Action Project',
        description: 'Help the community',
        responsible: 'Jane Smith',
        budget: 15000
      });
      mockFindAll.mockResolvedValue([project]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Social Action Project')).toBeInTheDocument();
        expect(screen.getByText('Help the community')).toBeInTheDocument();
        expect(screen.getByText('Jane Smith')).toBeInTheDocument();
        expect(screen.getByText('R$ 15.000')).toBeInTheDocument();
      });
    });

    it('should display statistics cards correctly', async () => {
      const projects = [
        createMockProject({ id: '1', status: ProjectStatus.Active }),
        createMockProject({ id: '2', status: ProjectStatus.Active }),
        createMockProject({ id: '3', status: ProjectStatus.Planning }),
        createMockProject({ id: '4', status: ProjectStatus.Completed })
      ];
      mockFindAll.mockResolvedValue(projects);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Ativos')).toBeInTheDocument();
        expect(screen.getByText('Planejamento')).toBeInTheDocument();
        expect(screen.getByText('Concluidos')).toBeInTheDocument();
      });
    });
  });

  describe('Filtering', () => {
    it('should filter projects by status', async () => {
      const projects = [
        createMockProject({ id: '1', name: 'Active Project', status: ProjectStatus.Active }),
        createMockProject({ id: '2', name: 'Completed Project', status: ProjectStatus.Completed })
      ];
      mockFindAll.mockResolvedValue(projects);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Active Project')).toBeInTheDocument();
        expect(screen.getByText('Completed Project')).toBeInTheDocument();
      });

      // Filter by completed status
      const statusSelect = screen.getAllByRole('combobox')[0];
      fireEvent.change(statusSelect, { target: { value: 'completed' } });

      await waitFor(() => {
        expect(screen.queryByText('Active Project')).not.toBeInTheDocument();
        expect(screen.getByText('Completed Project')).toBeInTheDocument();
      });
    });

    it('should filter projects by category', async () => {
      const projects = [
        createMockProject({ id: '1', name: 'Social Project', category: 'Acao Social' }),
        createMockProject({ id: '2', name: 'Education Project', category: 'Educacao' })
      ];
      mockFindAll.mockResolvedValue(projects);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Social Project')).toBeInTheDocument();
        expect(screen.getByText('Education Project')).toBeInTheDocument();
      });

      // Filter by education category
      const categorySelect = screen.getAllByRole('combobox')[1];
      fireEvent.change(categorySelect, { target: { value: 'Educacao' } });

      await waitFor(() => {
        expect(screen.queryByText('Social Project')).not.toBeInTheDocument();
        expect(screen.getByText('Education Project')).toBeInTheDocument();
      });
    });

    it('should filter projects by search term', async () => {
      const projects = [
        createMockProject({ id: '1', name: 'Food Distribution', description: 'Distribute food' }),
        createMockProject({ id: '2', name: 'Youth Program', description: 'Youth activities' })
      ];
      mockFindAll.mockResolvedValue(projects);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Food Distribution')).toBeInTheDocument();
        expect(screen.getByText('Youth Program')).toBeInTheDocument();
      });

      // Search for "food"
      const searchInput = screen.getByPlaceholderText('Buscar projetos...');
      fireEvent.change(searchInput, { target: { value: 'food' } });

      await waitFor(() => {
        expect(screen.getByText('Food Distribution')).toBeInTheDocument();
        expect(screen.queryByText('Youth Program')).not.toBeInTheDocument();
      });
    });
  });

  describe('Create Project', () => {
    it('should show create button only when user has create permission', async () => {
      mockHasPermission.mockImplementation((module, action) => {
        if (action === 'create') return true;
        return true;
      });
      mockFindAll.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Novo Projeto')).toBeInTheDocument();
      });
    });

    it('should hide create button when user lacks create permission', async () => {
      mockHasPermission.mockImplementation((module, action) => {
        if (action === 'create') return false;
        return true;
      });
      mockFindAll.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText('Novo Projeto')).not.toBeInTheDocument();
      });
    });

    it('should open create modal when clicking new project button', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Novo Projeto')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Novo Projeto'));

      await waitFor(() => {
        expect(screen.getByText('Nome do Projeto *')).toBeInTheDocument();
        expect(screen.getByText('Descricao *')).toBeInTheDocument();
      });
    });

    it('should validate required fields when creating project', async () => {
      mockFindAll.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Novo Projeto'));
      });

      await waitFor(() => {
        expect(screen.getByText('Criar Projeto')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      fireEvent.click(screen.getByText('Criar Projeto'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Por favor, insira o nome do projeto.');
      });
    });

    it('should create project successfully with valid data', async () => {
      const newProject = createMockProject({ id: 'new-project' });
      mockFindAll.mockResolvedValue([]);
      mockCreate.mockResolvedValue(newProject);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Novo Projeto'));
      });

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Ex: Cestas Basicas');
        fireEvent.change(nameInput, { target: { value: 'New Test Project' } });

        const descInput = screen.getByPlaceholderText('Descricao detalhada do projeto...');
        fireEvent.change(descInput, { target: { value: 'Test description' } });

        const endDateInput = document.querySelectorAll('input[type="date"]')[1];
        fireEvent.change(endDateInput, { target: { value: '2025-12-31' } });
      });

      fireEvent.click(screen.getByText('Criar Projeto'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Projeto criado com sucesso!');
      });
    });
  });

  describe('Edit Project', () => {
    it('should show edit button only when user has update permission', async () => {
      mockHasPermission.mockImplementation((module, action) => {
        if (action === 'update') return true;
        return true;
      });
      mockFindAll.mockResolvedValue([createMockProject()]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Editar')).toBeInTheDocument();
      });
    });

    it('should hide edit button when user lacks update permission', async () => {
      mockHasPermission.mockImplementation((module, action) => {
        if (action === 'update') return false;
        return true;
      });
      mockFindAll.mockResolvedValue([createMockProject()]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText('Editar')).not.toBeInTheDocument();
      });
    });

    it('should open edit modal with project data', async () => {
      const project = createMockProject({ name: 'Existing Project', description: 'Existing Description' });
      mockFindAll.mockResolvedValue([project]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Existing Project')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Editar'));

      await waitFor(() => {
        expect(screen.getByDisplayValue('Existing Project')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Existing Description')).toBeInTheDocument();
      });
    });

    it('should update project successfully', async () => {
      const project = createMockProject();
      const updatedProject = { ...project, name: 'Updated Project' };
      mockFindAll.mockResolvedValue([project]);
      mockUpdate.mockResolvedValue(updatedProject);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Editar'));
      });

      await waitFor(() => {
        const nameInput = screen.getByDisplayValue('Test Project');
        fireEvent.change(nameInput, { target: { value: 'Updated Project' } });
      });

      fireEvent.click(screen.getByText('Atualizar Projeto'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith('Projeto atualizado com sucesso!');
      });
    });
  });

  describe('Delete Project', () => {
    it('should show delete button only when user has delete permission', async () => {
      mockHasPermission.mockImplementation((module, action) => {
        if (action === 'delete') return true;
        return true;
      });
      mockFindAll.mockResolvedValue([createMockProject()]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Excluir')).toBeInTheDocument();
      });
    });

    it('should hide delete button when user lacks delete permission', async () => {
      mockHasPermission.mockImplementation((module, action) => {
        if (action === 'delete') return false;
        return true;
      });
      mockFindAll.mockResolvedValue([createMockProject()]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText('Excluir')).not.toBeInTheDocument();
      });
    });

    it('should show confirmation dialog before deleting', async () => {
      mockFindAll.mockResolvedValue([createMockProject()]);
      mockConfirm.mockReturnValue(false);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja excluir este projeto?');
      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should delete project when confirmed', async () => {
      mockFindAll.mockResolvedValue([createMockProject()]);
      mockConfirm.mockReturnValue(true);
      mockDelete.mockResolvedValue(undefined);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('project-1');
        expect(mockAlert).toHaveBeenCalledWith('Projeto excluido com sucesso!');
      });
    });
  });

  describe('Status Change', () => {
    it('should update project status via dropdown', async () => {
      const project = createMockProject({ status: ProjectStatus.Active });
      mockFindAll.mockResolvedValue([project]);
      mockUpdateStatus.mockResolvedValue(undefined);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Test Project')).toBeInTheDocument();
      });

      // Find status dropdown in table row
      const statusDropdowns = screen.getAllByRole('combobox');
      const projectStatusDropdown = statusDropdowns[2]; // Third dropdown is in table row

      fireEvent.change(projectStatusDropdown, { target: { value: 'completed' } });

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalled();
        expect(mockUpdateStatus).toHaveBeenCalledWith('project-1', 'completed');
        expect(mockAlert).toHaveBeenCalledWith('Status atualizado com sucesso!');
      });
    });
  });

  describe('Registrations Management', () => {
    it('should open registrations modal when clicking inscricoes button', async () => {
      const project = createMockProject();
      const registrations = [
        createMockRegistration({ status: RegistrationStatus.Pending }),
        createMockRegistration({ id: 'reg-2', status: RegistrationStatus.Approved })
      ];
      mockFindAll.mockResolvedValue([project]);
      mockFindRegistrations.mockResolvedValue(registrations);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Inscricoes'));
      });

      await waitFor(() => {
        expect(screen.getByText(/Inscricoes do Projeto:/)).toBeInTheDocument();
        expect(screen.getByText('Pendentes')).toBeInTheDocument();
        expect(screen.getByText('Aprovados')).toBeInTheDocument();
      });
    });

    it('should display registration statistics', async () => {
      const project = createMockProject();
      const registrations = [
        createMockRegistration({ id: '1', status: RegistrationStatus.Pending }),
        createMockRegistration({ id: '2', status: RegistrationStatus.Pending }),
        createMockRegistration({ id: '3', status: RegistrationStatus.Approved }),
        createMockRegistration({ id: '4', status: RegistrationStatus.Rejected })
      ];
      mockFindAll.mockResolvedValue([project]);
      mockFindRegistrations.mockResolvedValue(registrations);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Inscricoes'));
      });

      await waitFor(() => {
        // Check statistics are displayed
        const pendingCount = screen.getAllByText('2');
        expect(pendingCount.length).toBeGreaterThan(0);
      });
    });

    it('should approve registration when clicking approve button', async () => {
      const project = createMockProject();
      const registration = createMockRegistration({ status: RegistrationStatus.Pending });
      mockFindAll.mockResolvedValue([project]);
      mockFindRegistrations.mockResolvedValue([registration]);
      mockUpdateRegistrationStatus.mockResolvedValue(undefined);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Inscricoes'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Aprovar'));
      });

      await waitFor(() => {
        expect(mockUpdateRegistrationStatus).toHaveBeenCalledWith(
          'reg-1',
          RegistrationStatus.Approved,
          'admin@test.com'
        );
      });
    });

    it('should reject registration when clicking reject button', async () => {
      const project = createMockProject();
      const registration = createMockRegistration({ status: RegistrationStatus.Pending });
      mockFindAll.mockResolvedValue([project]);
      mockFindRegistrations.mockResolvedValue([registration]);
      mockUpdateRegistrationStatus.mockResolvedValue(undefined);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Inscricoes'));
      });

      await waitFor(() => {
        fireEvent.click(screen.getByText('Rejeitar'));
      });

      await waitFor(() => {
        expect(mockConfirm).toHaveBeenCalledWith('Tem certeza que deseja rejeitar esta inscricao?');
        expect(mockUpdateRegistrationStatus).toHaveBeenCalledWith(
          'reg-1',
          RegistrationStatus.Rejected
        );
      });
    });

    it('should show empty message when no registrations exist', async () => {
      const project = createMockProject();
      mockFindAll.mockResolvedValue([project]);
      mockFindRegistrations.mockResolvedValue([]);

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Inscricoes'));
      });

      await waitFor(() => {
        expect(screen.getByText('Nenhuma inscricao encontrada para este projeto.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading projects fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockRejectedValue(new Error('Network error'));

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading projects:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when creating project fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockResolvedValue([]);
      mockCreate.mockRejectedValue(new Error('Create failed'));

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Novo Projeto'));
      });

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Ex: Cestas Basicas');
        fireEvent.change(nameInput, { target: { value: 'New Project' } });

        const descInput = screen.getByPlaceholderText('Descricao detalhada do projeto...');
        fireEvent.change(descInput, { target: { value: 'Description' } });

        const endDateInput = document.querySelectorAll('input[type="date"]')[1];
        fireEvent.change(endDateInput, { target: { value: '2025-12-31' } });
      });

      fireEvent.click(screen.getByText('Criar Projeto'));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao criar projeto.');
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when deleting project fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockResolvedValue([createMockProject()]);
      mockDelete.mockRejectedValue(new Error('Delete failed'));

      render(<AdminProjectsManagementPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Excluir'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao excluir projeto.');
      });

      consoleSpy.mockRestore();
    });
  });
});
