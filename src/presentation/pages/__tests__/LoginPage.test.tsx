// Unit Tests - Login Page
// Comprehensive tests for user authentication flow

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { User, UserRole, UserStatus } from '@/domain/entities/User';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

// Mock useAuth
const mockLogin = jest.fn();
const mockSignInWithGoogle = jest.fn();
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: null,
    user: null,
    loading: false,
    login: mockLogin,
    register: jest.fn(),
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

// Helper to create mock user
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides
});

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderLoginPage = () => {
    return render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the login page with correct title', () => {
      renderLoginPage();

      expect(screen.getByText('Conectados pela fé')).toBeInTheDocument();
      expect(screen.getByText('Entre em sua conta')).toBeInTheDocument();
    });

    it('should render email input field', () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      expect(emailInput).toBeInTheDocument();
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('required');
    });

    it('should render password input field', () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/senha/i);
      expect(passwordInput).toBeInTheDocument();
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('required');
    });

    it('should render login button', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('should render Google sign-in button', () => {
      renderLoginPage();

      expect(screen.getByRole('button', { name: /continuar com google/i })).toBeInTheDocument();
    });

    it('should render link to register page', () => {
      renderLoginPage();

      const registerLink = screen.getByRole('link', { name: /cadastre-se/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should render separator between login methods', () => {
      renderLoginPage();

      expect(screen.getByText('ou')).toBeInTheDocument();
    });
  });

  describe('Form Interaction', () => {
    it('should update email field on input', async () => {
      renderLoginPage();

      const emailInput = screen.getByLabelText(/email/i);
      await userEvent.type(emailInput, 'test@example.com');

      expect(emailInput).toHaveValue('test@example.com');
    });

    it('should update password field on input', async () => {
      renderLoginPage();

      const passwordInput = screen.getByLabelText(/senha/i);
      await userEvent.type(passwordInput, 'password123');

      expect(passwordInput).toHaveValue('password123');
    });
  });

  describe('Form Submission', () => {
    it('should call login with email and password on form submit', async () => {
      const mockUser = createMockUser();
      mockLogin.mockResolvedValueOnce(mockUser);

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
      });
    });

    it('should show loading state during login', async () => {
      mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /entrando/i })).toBeInTheDocument();
      });
    });

    it('should disable buttons during login', async () => {
      mockLogin.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /entrando/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /continuar com google/i })).toBeDisabled();
      });
    });
  });

  describe('Navigation After Login', () => {
    it('should navigate to /admin for admin users', async () => {
      const adminUser = createMockUser({ role: 'admin' as UserRole });
      mockLogin.mockResolvedValueOnce(adminUser);

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'admin@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
      });
    });

    it('should navigate to /professional for professional users', async () => {
      const professionalUser = createMockUser({ role: 'professional' as UserRole });
      mockLogin.mockResolvedValueOnce(professionalUser);

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'professional@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/professional');
      });
    });

    it('should navigate to /painel for regular users', async () => {
      const regularUser = createMockUser({ role: UserRole.Member });
      mockLogin.mockResolvedValueOnce(regularUser);

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'member@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/painel');
      });
    });
  });

  describe('Error Handling', () => {
    it('should display error message on login failure', async () => {
      mockLogin.mockRejectedValueOnce(new Error('Credenciais invalidas'));

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText('Credenciais invalidas')).toBeInTheDocument();
      });
    });

    it('should display default error message when error has no message', async () => {
      mockLogin.mockRejectedValueOnce(new Error());

      renderLoginPage();

      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText('Erro ao fazer login')).toBeInTheDocument();
      });
    });

    it('should clear error message when form is resubmitted', async () => {
      mockLogin
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce(createMockUser());

      renderLoginPage();

      // First attempt - fails
      await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
      await userEvent.type(screen.getByLabelText(/senha/i), 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.getByText('First error')).toBeInTheDocument();
      });

      // Second attempt - succeeds
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      await waitFor(() => {
        expect(screen.queryByText('First error')).not.toBeInTheDocument();
      });
    });
  });

  describe('Google Sign-In', () => {
    it('should call signInWithGoogle when Google button is clicked', async () => {
      mockSignInWithGoogle.mockResolvedValueOnce(createMockUser());

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(mockSignInWithGoogle).toHaveBeenCalled();
      });
    });

    it('should show loading state during Google sign-in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /entrando com google/i })).toBeInTheDocument();
      });
    });

    it('should navigate to /admin for admin users after Google sign-in', async () => {
      const adminUser = createMockUser({ role: 'admin' as UserRole });
      mockSignInWithGoogle.mockResolvedValueOnce(adminUser);

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/admin');
      });
    });

    it('should navigate to /professional for professional users after Google sign-in', async () => {
      const professionalUser = createMockUser({ role: 'professional' as UserRole });
      mockSignInWithGoogle.mockResolvedValueOnce(professionalUser);

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/professional');
      });
    });

    it('should navigate to /painel for regular users after Google sign-in', async () => {
      const regularUser = createMockUser({ role: UserRole.Member });
      mockSignInWithGoogle.mockResolvedValueOnce(regularUser);

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/painel');
      });
    });

    it('should display error message on Google sign-in failure', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error('Google sign-in failed'));

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByText('Google sign-in failed')).toBeInTheDocument();
      });
    });

    it('should display default error message for Google sign-in when error has no message', async () => {
      mockSignInWithGoogle.mockRejectedValueOnce(new Error());

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByText('Erro ao fazer login com Google')).toBeInTheDocument();
      });
    });

    it('should disable buttons during Google sign-in', async () => {
      mockSignInWithGoogle.mockImplementation(() => new Promise(() => {})); // Never resolves

      renderLoginPage();

      await userEvent.click(screen.getByRole('button', { name: /continuar com google/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /entrar/i })).toBeDisabled();
        expect(screen.getByRole('button', { name: /entrando com google/i })).toBeDisabled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper form labels', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/senha/i)).toBeInTheDocument();
    });

    it('should have autocomplete attributes for credential manager', () => {
      renderLoginPage();

      expect(screen.getByLabelText(/email/i)).toHaveAttribute('autoComplete', 'email');
      expect(screen.getByLabelText(/senha/i)).toHaveAttribute('autoComplete', 'current-password');
    });
  });
});
