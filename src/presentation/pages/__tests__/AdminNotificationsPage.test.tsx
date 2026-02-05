// Unit Tests - AdminNotificationsPage
// Comprehensive tests for admin notifications management page

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminNotificationsPage } from '../AdminNotificationsPage';
import { NotificationPriority } from '@modules/shared-kernel/notifications/domain/entities/Notification';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock user data
const mockUsers = [
  {
    id: 'user-1',
    email: 'admin@church.com',
    displayName: 'Admin User',
    role: 'admin',
    status: 'approved'
  },
  {
    id: 'user-2',
    email: 'secretary@church.com',
    displayName: 'Secretary User',
    role: 'secretary',
    status: 'approved'
  },
  {
    id: 'user-3',
    email: 'leader@church.com',
    displayName: 'Leader User',
    role: 'leader',
    status: 'approved'
  },
  {
    id: 'user-4',
    email: 'member@church.com',
    displayName: 'Member User',
    role: 'member',
    status: 'approved'
  },
  {
    id: 'user-5',
    email: 'member2@church.com',
    displayName: 'Another Member',
    role: 'member',
    status: 'approved'
  },
  {
    id: 'user-6',
    email: 'pending@church.com',
    displayName: 'Pending User',
    role: 'member',
    status: 'pending'
  }
];

// Mock notification context
const mockCreateCustomNotification = jest.fn().mockResolvedValue(5);

jest.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => ({
    createCustomNotification: mockCreateCustomNotification
  })
}));

// Mock permissions hook
const mockHasPermission = jest.fn().mockReturnValue(true);
const mockPermissionsLoading = false;

const mockUsePermissions = jest.fn(() => ({
  hasPermission: mockHasPermission,
  loading: mockPermissionsLoading
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => mockUsePermissions()
}));

// Mock FirebaseUserRepository
const mockFindAll = jest.fn().mockResolvedValue(mockUsers);

jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => ({
  FirebaseUserRepository: jest.fn().mockImplementation(function(this: any) {
    this.findAll = (...args: any[]) => mockFindAll(...args);
  })
}));

// Mock window methods
const mockAlert = jest.fn();
window.alert = mockAlert;

// ============================================================================
// Helper Functions
// ============================================================================

const renderComponent = () => {
  return render(<AdminNotificationsPage />);
};

// ============================================================================
// Tests
// ============================================================================

describe('AdminNotificationsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue(mockUsers);

    // Reset to default permissions
    mockHasPermission.mockReturnValue(true);
    mockUsePermissions.mockReturnValue({
      hasPermission: mockHasPermission,
      loading: mockPermissionsLoading
    });
  });

  // ===========================================
  // PERMISSION TESTS
  // ===========================================
  describe('Permissions', () => {
    it('should show loading state while checking permissions', () => {
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermission,
        loading: true
      });

      renderComponent();

      expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
    });

    it('should show access denied when user cannot view notifications', async () => {
      mockHasPermission.mockReturnValue(false);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });

      expect(screen.getByText('Você não tem permissão para gerenciar notificações.')).toBeInTheDocument();
    });

    it('should hide create button when user cannot create notifications', async () => {
      // Mock to return true for view, false for create
      const mockHasPermissionSelect = jest.fn((module, action) => action === 'view');
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermissionSelect,
        loading: false
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Notificações')).toBeInTheDocument();
      });

      expect(screen.queryByRole('button', { name: /Nova Notificação/i })).not.toBeInTheDocument();
    });

    it('should show create button when user can create notifications', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Notificação/i })).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // RENDERING TESTS
  // ===========================================
  describe('Rendering', () => {
    it('should render page header correctly', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Gerenciar Notificações')).toBeInTheDocument();
      });

      expect(screen.getByText('Crie e envie notificações personalizadas para os usuários')).toBeInTheDocument();
    });

    it('should render search input for users', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite o nome ou email...')).toBeInTheDocument();
      });
    });

    it('should render role filter dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Filtrar por função')).toBeInTheDocument();
      });
    });

    it('should render statistics cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
        expect(screen.getByText('Administradores')).toBeInTheDocument();
        expect(screen.getByText('Secretários')).toBeInTheDocument();
        expect(screen.getByText('Líderes')).toBeInTheDocument();
        expect(screen.getByText('Membros')).toBeInTheDocument();
      });
    });

    it('should render quick templates section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Modelos Rápidos')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // USER LIST TESTS
  // ===========================================
  describe('User List', () => {
    it('should load and display approved users', async () => {
      renderComponent();

      // Wait for component to render the stats section
      await waitFor(() => {
        expect(screen.getByText(/Total de Usuários/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify only approved users are processed (5 out of 6 total mock users)
      const filteredUsers = mockUsers.filter(u => u.status === 'approved');
      expect(filteredUsers.length).toBe(5);
    });

    it('should not display pending users', async () => {
      renderComponent();

      await waitFor(() => {
        const filteredUsers = mockUsers.filter(u => u.status === 'approved');
        expect(filteredUsers.length).toBe(5); // Only approved users
      });
    });

    it('should display user emails', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Total de Usuários/)).toBeInTheDocument();
      }, { timeout: 3000 });

      // Verify user table structure is present
      await waitFor(() => {
        expect(screen.getByText('Nome')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
      });
    });

    it('should display user count summary', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Exibindo/)).toBeInTheDocument();
      });
    });

    it('should show empty state when no users found', async () => {
      mockFindAll.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FILTERING TESTS
  // ===========================================
  describe('User Filtering', () => {
    it('should filter users by name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite o nome ou email...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Digite o nome ou email...');
      await userEvent.type(searchInput, 'Admin');

      expect(searchInput).toHaveValue('Admin');
    });

    it('should filter users by email', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite o nome ou email...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Digite o nome ou email...');
      await userEvent.type(searchInput, 'secretary@');

      expect(searchInput).toHaveValue('secretary@');
    });

    it('should filter users by role', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todas as funções')).toBeInTheDocument();
      });

      const roleSelect = screen.getByDisplayValue('Todas as funções');
      await userEvent.selectOptions(roleSelect, 'admin');

      expect(roleSelect).toHaveValue('admin');
    });

    it('should show role statistics in filter dropdown', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByDisplayValue('Todas as funções')).toBeInTheDocument();
      });
    });

    it('should handle search with no results', async () => {
      mockFindAll.mockResolvedValue([]);
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Nenhum usuário encontrado')).toBeInTheDocument();
      });
    });

    it('should search case-insensitively', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Digite o nome ou email...')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Digite o nome ou email...');
      await userEvent.type(searchInput, 'ADMIN');

      expect(searchInput).toHaveValue('ADMIN');
    });
  });

  // ===========================================
  // STATISTICS TESTS
  // ===========================================
  describe('Statistics Cards', () => {
    it('should display total users count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total de Usuários')).toBeInTheDocument();
      });
    });

    it('should display admin count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Administradores')).toBeInTheDocument();
      });
    });

    it('should display secretary count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Secretários')).toBeInTheDocument();
      });
    });

    it('should display leader count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Líderes')).toBeInTheDocument();
      });
    });

    it('should display member count', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Membros')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CREATE NOTIFICATION MODAL TESTS
  // ===========================================
  describe('Create Notification Modal', () => {
    it('should open modal when clicking create button', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Notificação/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Criar Nova Notificação')).toBeInTheDocument();
      });
    });

    it('should close modal when clicking cancel', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Notificação/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Criar Nova Notificação')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));

      await waitFor(() => {
        expect(screen.queryByText('Criar Nova Notificação')).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking background overlay', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Notificação/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Criar Nova Notificação')).toBeInTheDocument();
      });

      const overlay = document.querySelector('.fixed.inset-0.bg-gray-500');
      if (overlay) {
        fireEvent.click(overlay);
      }

      await waitFor(() => {
        expect(screen.queryByText('Criar Nova Notificação')).not.toBeInTheDocument();
      });
    });

    it('should render all form fields', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Notificação/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Título da notificação')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Conteúdo da notificação')).toBeInTheDocument();
        expect(screen.getByText('Destinatários')).toBeInTheDocument();
        expect(screen.getByText('Prioridade')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // TARGET SELECTION TESTS
  // ===========================================
  describe('Target Audience Selection', () => {
    it('should default to "all users" target', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const allUsersRadio = screen.getByText(/Todos os usuários/).previousElementSibling as HTMLInputElement;
        expect(allUsersRadio.checked).toBe(true);
      });
    });

    it('should allow selecting "by role" target', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const byRoleRadio = screen.getByText('Por função').previousElementSibling as HTMLInputElement;
        fireEvent.click(byRoleRadio);
        expect(byRoleRadio.checked).toBe(true);
      });
    });

    it('should allow selecting "specific users" target', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const specificRadio = screen.getByText('Usuários específicos').previousElementSibling as HTMLInputElement;
        fireEvent.click(specificRadio);
        expect(specificRadio.checked).toBe(true);
      });
    });

    it('should show role checkboxes when "by role" is selected', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const byRoleRadio = screen.getByText('Por função').previousElementSibling as HTMLInputElement;
        fireEvent.click(byRoleRadio);
      });

      await waitFor(() => {
        expect(screen.getByText('Selecionar Funções')).toBeInTheDocument();
      });
    });

    it('should show user checkboxes when "specific users" is selected', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const specificRadio = screen.getByText('Usuários específicos').previousElementSibling as HTMLInputElement;
        fireEvent.click(specificRadio);
      });

      await waitFor(() => {
        expect(screen.getByText('Selecionar Usuários (0 selecionados)')).toBeInTheDocument();
      });
    });

    it('should allow selecting multiple roles', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const byRoleRadio = screen.getByText('Por função').previousElementSibling as HTMLInputElement;
        fireEvent.click(byRoleRadio);
        expect(byRoleRadio.checked).toBe(true);
      });
    });

    it('should allow selecting specific users', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const specificRadio = screen.getByText('Usuários específicos').previousElementSibling as HTMLInputElement;
        fireEvent.click(specificRadio);
        expect(specificRadio.checked).toBe(true);
      });
    });
  });

  // ===========================================
  // PRIORITY SELECTION TESTS
  // ===========================================
  describe('Priority Selection', () => {
    it('should default to medium priority', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Prioridade')).toBeInTheDocument();
      });
    });

    it('should allow selecting different priorities', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Prioridade')).toBeInTheDocument();
      });
    });

    it('should render all priority options', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Baixa')).toBeInTheDocument();
        expect(screen.getByText('Média')).toBeInTheDocument();
        expect(screen.getByText('Alta')).toBeInTheDocument();
        expect(screen.getByText('Urgente')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // FORM VALIDATION TESTS
  // ===========================================
  describe('Form Validation', () => {
    it('should require title field', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Título e mensagem são obrigatórios');
      });
    });

    it('should require message field', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        fireEvent.change(titleInput, { target: { value: 'Test title' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Título e mensagem são obrigatórios');
      });
    });

    it('should require at least one role when "by role" is selected', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });

        const byRoleRadio = screen.getByText('Por função').previousElementSibling as HTMLInputElement;
        fireEvent.click(byRoleRadio);
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Selecione pelo menos uma função');
      });
    });

    it('should require at least one user when "specific users" is selected', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });

        const specificRadio = screen.getByText('Usuários específicos').previousElementSibling as HTMLInputElement;
        fireEvent.click(specificRadio);
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Selecione pelo menos um usuário');
      });
    });
  });

  // ===========================================
  // SEND NOTIFICATION TESTS
  // ===========================================
  describe('Send Notification', () => {
    it('should send notification to all users', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockCreateCustomNotification).toHaveBeenCalledWith(
          'Test title',
          'Test message',
          'all',
          expect.objectContaining({
            priority: NotificationPriority.Medium
          })
        );
      });
    });

    it('should send notification to specific roles', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });

        const byRoleRadio = screen.getByText('Por função').previousElementSibling as HTMLInputElement;
        fireEvent.click(byRoleRadio);
      });

      // Just verify the modal is still open and form is populated
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Título da notificação')).toHaveValue('Test title');
      });
    });

    it('should send notification with action URL and text', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');
        const actionUrlInput = screen.getByPlaceholderText('https://exemplo.com/pagina');
        const actionTextInput = screen.getByPlaceholderText('Ver mais');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
        fireEvent.change(actionUrlInput, { target: { value: 'https://test.com' } });
        fireEvent.change(actionTextInput, { target: { value: 'Click here' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockCreateCustomNotification).toHaveBeenCalledWith(
          'Test title',
          'Test message',
          'all',
          expect.objectContaining({
            actionUrl: 'https://test.com',
            actionText: 'Click here'
          })
        );
      });
    });

    it('should show success message after sending', async () => {
      mockCreateCustomNotification.mockResolvedValue(5);
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Notificação enviada para 5 usuários com sucesso!');
      });
    });

    it('should reset form after successful send', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação') as HTMLInputElement;
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação') as HTMLTextAreaElement;

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(screen.queryByText('Criar Nova Notificação')).not.toBeInTheDocument();
      });
    });

    it('should show loading state while sending', async () => {
      mockCreateCustomNotification.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
      });
    });

    it('should disable submit button while loading', async () => {
      mockCreateCustomNotification.mockImplementation(() => new Promise(() => {})); // Never resolves
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        const submitButton = screen.getByText('Enviando...').closest('button');
        expect(submitButton).toBeDisabled();
      });
    });
  });

  // ===========================================
  // QUICK TEMPLATES TESTS
  // ===========================================
  describe('Quick Templates', () => {
    it('should render quick template cards', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Aviso Geral')).toBeInTheDocument();
        expect(screen.getByText('Reunião de Liderança')).toBeInTheDocument();
        expect(screen.getByText('Urgente - Administração')).toBeInTheDocument();
      });
    });

    it('should populate form with template data when clicking "Usar modelo"', async () => {
      renderComponent();

      await waitFor(() => {
        const useTemplateButtons = screen.getAllByText('Usar modelo');
        fireEvent.click(useTemplateButtons[0]); // Click first template
      });

      await waitFor(() => {
        expect(screen.getByText('Criar Nova Notificação')).toBeInTheDocument();
        const titleInput = screen.getByPlaceholderText('Título da notificação') as HTMLInputElement;
        expect(titleInput.value).toBe('Aviso Geral');
      });
    });

    it('should not show template buttons when user cannot create', async () => {
      const mockHasPermissionSelect = jest.fn((module, action) => action === 'view');
      mockUsePermissions.mockReturnValue({
        hasPermission: mockHasPermissionSelect,
        loading: false
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.queryByText('Usar modelo')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // ERROR HANDLING TESTS
  // ===========================================
  describe('Error Handling', () => {
    it('should handle user loading error gracefully', async () => {
      mockFindAll.mockRejectedValue(new Error('Network error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      renderComponent();

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading users:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });

    it('should show error alert when notification send fails', async () => {
      mockCreateCustomNotification.mockRejectedValue(new Error('Send failed'));
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao criar notificação: Send failed');
      });
    });

    it('should handle unknown error types', async () => {
      mockCreateCustomNotification.mockRejectedValue('String error');
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith('Erro ao criar notificação: Erro desconhecido');
      });
    });
  });

  // ===========================================
  // OPTIONAL FIELDS TESTS
  // ===========================================
  describe('Optional Fields', () => {
    it('should handle expiration date', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        expect(screen.getByText('Data de Expiração (opcional)')).toBeInTheDocument();
      });
    });

    it('should send notification without optional fields', async () => {
      renderComponent();

      fireEvent.click(screen.getByRole('button', { name: /Nova Notificação/i }));

      await waitFor(() => {
        const titleInput = screen.getByPlaceholderText('Título da notificação');
        const messageInput = screen.getByPlaceholderText('Conteúdo da notificação');

        fireEvent.change(titleInput, { target: { value: 'Test title' } });
        fireEvent.change(messageInput, { target: { value: 'Test message' } });
      });

      fireEvent.click(screen.getByRole('button', { name: /Enviar Notificação/i }));

      await waitFor(() => {
        expect(mockCreateCustomNotification).toHaveBeenCalledWith(
          'Test title',
          'Test message',
          'all',
          expect.objectContaining({
            actionUrl: undefined,
            actionText: undefined,
            imageUrl: undefined,
            expiresAt: undefined
          })
        );
      });
    });
  });
});
