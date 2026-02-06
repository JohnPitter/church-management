// Unit Tests - Register Page
// Comprehensive tests for user registration flow

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { RegisterPage } from '../RegisterPage';
import { User, UserRole, UserStatus } from '@/domain/entities/User';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useAuth
const mockRegister = jest.fn();
const mockSignInWithGoogle = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    user: null,
    loading: false,
    login: jest.fn(),
    register: mockRegister,
    signInWithGoogle: mockSignInWithGoogle,
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canCreateContent: jest.fn().mockReturnValue(false),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(false),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn()
  })
}));

// Mock useSettings
const mockUseSettings = jest.fn();
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

// Mock FirebaseUserRepository
const mockUpdate = jest.fn();
jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => {
  function FirebaseUserRepositoryMock(this: any) {
    this.update = (...args: any[]) => mockUpdate(...args);
  }
  return {
    FirebaseUserRepository: FirebaseUserRepositoryMock
  };
});

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Pending,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockUseSettings.mockReturnValue({
      settings: { allowPublicRegistration: true, autoApproveMembers: false },
      loading: false
    });
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  const renderRegisterPage = () => {
    return render(
      <MemoryRouter>
        <RegisterPage />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner while settings are loading', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: true
      });

      renderRegisterPage();

      expect(screen.getByText('Carregando...')).toBeInTheDocument();
    });
  });

  describe('Registration Disabled', () => {
    it('should show disabled registration message when public registration is disabled', () => {
      mockUseSettings.mockReturnValue({
        settings: { allowPublicRegistration: false },
        loading: false
      });

      renderRegisterPage();

      expect(screen.getByText('Registro Desabilitado')).toBeInTheDocument();
      expect(screen.getByText(/registro público está temporariamente desabilitado/i)).toBeInTheDocument();
    });

    it('should show link to login when registration is disabled', () => {
      mockUseSettings.mockReturnValue({
        settings: { allowPublicRegistration: false },
        loading: false
      });

      renderRegisterPage();

      const loginLink = screen.getByRole('link', { name: /voltar ao login/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });
  });

  describe('Rendering', () => {
    it('should render the register page with correct title', () => {
      renderRegisterPage();

      expect(screen.getByText('Conectados pela fé')).toBeInTheDocument();
      expect(screen.getByText('Crie sua conta')).toBeInTheDocument();
    });

    it('should render name input field', () => {
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/nome completo/i);
      expect(nameInput).toBeInTheDocument();
      expect(nameInput).toHaveAttribute('type', 'text');
      expect(nameInput).toHaveAttribute('required');
    });

    it('should render email input field', () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should render password input field', () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^senha$/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should render confirm password input field', () => {
      renderRegisterPage();

      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      expect(confirmPasswordInput).toBeInTheDocument();
      expect(confirmPasswordInput).toHaveAttribute('type', 'password');
      expect(confirmPasswordInput).toHaveAttribute('required');
    });

    it('should render register button', () => {
      renderRegisterPage();

      expect(screen.getByRole('button', { name: /criar conta/i })).toBeInTheDocument();
    });

    it('should render Google sign-in button', () => {
      renderRegisterPage();

      expect(screen.getByRole('button', { name: /continuar com google/i })).toBeInTheDocument();
    });

    it('should render link to login page', () => {
      renderRegisterPage();

      const loginLink = screen.getByRole('link', { name: /entre aqui/i });
      expect(loginLink).toBeInTheDocument();
      expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('should render approval notice', () => {
      renderRegisterPage();

      expect(screen.getByText('Processo de Aprovação')).toBeInTheDocument();
      expect(screen.getByText(/após criar sua conta, ela ficará aguardando aprovação/i)).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update name field on input', async () => {
      renderRegisterPage();

      const nameInput = screen.getByLabelText(/nome completo/i);
      await userEvent.type(nameInput, 'John Doe');

      expect(nameInput).toHaveValue('John Doe');
    });

    it('should update email field on input', async () => {
      renderRegisterPage();

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field on input', async () => {
      renderRegisterPage();

      const passwordInput = screen.getByLabelText(/^senha$/i);
      await userEvent.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });

    it('should update confirm password field on input', async () => {
      renderRegisterPage();

      const confirmPasswordInput = screen.getByLabelText(/confirmar senha/i);
      await userEvent.type(confirmPasswordInput, 'password123');

      expect(confirmPasswordInput).toHaveValue('password123');
    });
  });

  describe('Form Validation', () => {
    it('should show error when passwords do not match', async () => {
      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'differentpassword');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('As senhas não coincidem')).toBeInTheDocument();
      });
      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission', () => {
    it('should call register with form data on submit', async () => {
      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith('test@example.com', 'password123', 'John Doe');
      });
    });

    it('should show loading state during registration', async () => {
      mockRegister.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criando conta/i })).toBeInTheDocument();
      });
    });

    it('should disable buttons during registration', async () => {
      mockRegister.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /criando conta/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /continuar com google/i })).toBeDisabled();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after registration', async () => {
      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('Cadastro realizado!')).toBeInTheDocument();
      });
    });

    it('should show pending approval message for non-auto-approved users', async () => {
      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText(/sua conta foi criada e está aguardando aprovação/i)).toBeInTheDocument();
      });
    });

    it('should navigate to /login after timeout for pending users', async () => {
      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('Cadastro realizado!')).toBeInTheDocument();
      });

      // Advance timers by 3 seconds
      jest.advanceTimersByTime(3000);

      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });

  describe('Auto-Approve Feature', () => {
    it('should auto-approve user when autoApproveMembers is enabled', async () => {
      mockUseSettings.mockReturnValue({
        settings: { allowPublicRegistration: true, autoApproveMembers: true },
        loading: false
      });

      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);
      mockUpdate.mockResolvedValueOnce(undefined);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('user-123', { status: UserStatus.Approved });
      });
    });

    it('should show auto-approved message', async () => {
      mockUseSettings.mockReturnValue({
        settings: { allowPublicRegistration: true, autoApproveMembers: true },
        loading: false
      });

      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);
      mockUpdate.mockResolvedValueOnce(undefined);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText(/sua conta foi criada e aprovada automaticamente/i)).toBeInTheDocument();
      });
    });

    it('should navigate to /painel for auto-approved users', async () => {
      mockUseSettings.mockReturnValue({
        settings: { allowPublicRegistration: true, autoApproveMembers: true },
        loading: false
      });

      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);
      mockUpdate.mockResolvedValueOnce(undefined);

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('Cadastro realizado!')).toBeInTheDocument();
      });

      // Advance timers by 3 seconds
      jest.advanceTimersByTime(3000);

      expect(mockNavigate).toHaveBeenCalledWith('/painel');
    });

    it('should handle auto-approve failure gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockUseSettings.mockReturnValue({
        settings: { allowPublicRegistration: true, autoApproveMembers: true },
        loading: false
      });

      const mockUser = createMockUser();
      mockRegister.mockResolvedValueOnce(mockUser);
      mockUpdate.mockRejectedValueOnce(new Error('Auto-approve failed'));

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('Cadastro realizado!')).toBeInTheDocument();
      });

      // Should still show success, but redirect to login (not painel)
      jest.advanceTimersByTime(3000);
      expect(mockNavigate).toHaveBeenCalledWith('/login');

      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should display error message on registration failure', async () => {
      mockRegister.mockRejectedValueOnce(new Error('Email ja cadastrado'));

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('Email ja cadastrado')).toBeInTheDocument();
      });
    });

    it('should display default error message when error has no message', async () => {
      mockRegister.mockRejectedValueOnce(new Error());

      renderRegisterPage();

      await userEvent.type(screen.getByLabelText(/nome completo/i), 'John Doe');
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/^senha$/i), 'password123');
      await userEvent.type(screen.getByLabelText(/confirmar senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /criar conta/i }));

      await waitFor(() => {
        expect(screen.getByText('Erro ao criar conta')).toBeInTheDocument();
      });
    });
  });

  describe('Google Sign-In', () => {
    it('should call signInWithGoogle when Google button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce(createMockUser());

      renderRegisterPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should navigate to /painel after successful Google sign-in', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce(createMockUser());

      renderRegisterPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/painel');
      });
    });

    it('should show loading state during Google sign-in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderRegisterPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /entrando com google/i })).toBeInTheDocument();
      });
    });

    it('should display error message on Google sign-in failure', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google sign-in failed'));

      renderRegisterPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByText('Google sign-in failed')).toBeInTheDocument();
      });
    });

    it('should display default error message for Google sign-in when error has no message', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error());

      renderRegisterPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByText('Erro ao fazer login com Google')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderRegisterPage();

      expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirmar senha/i)).toBeInTheDocument();
    });

    it('should have autocomplete attributes', () => {
      renderRegisterPage();

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/^senha$/i)).toHaveAttribute('autoComplete', 'new-password');
      expect(screen.getByLabelText(/confirmar senha/i)).toHaveAttribute('autoComplete', 'new-password');
    });
  });
});
