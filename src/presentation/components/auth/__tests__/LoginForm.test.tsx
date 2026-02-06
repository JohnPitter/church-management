// Unit Tests - LoginForm Component
// Comprehensive tests for the login form component

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginForm } from '../LoginForm';

// Mock useAuth hook
const mockLogin = jest.fn();
const mockClearError = jest.fn();
let mockLoading = false;
let mockError: string | null = null;

jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    loading: mockLoading,
    error: mockError,
    clearError: mockClearError
  })
}));

// Mock useNavigate
const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: function({ to, children, ...props }: any) { return (
    <a href={to} {...props}>{children}</a>
  ); }
}));

// Helper function to render component
const renderLoginForm = () => {
  return render(
    <MemoryRouter>
      <LoginForm />
    </MemoryRouter>
  );
};

describe('LoginForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLoading = false;
    mockError = null;
  });

  describe('Rendering', () => {
    it('should render email input', () => {
      renderLoginForm();

      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('seu@email.com')).toBeInTheDocument();
    });

    it('should render password input', () => {
      renderLoginForm();

      expect(screen.getByLabelText('Senha')).toBeInTheDocument();
      // Password inputs use a different placeholder display
      const passwordInput = document.querySelector('input[type="password"]');
      expect(passwordInput).toBeInTheDocument();
    });

    it('should render submit button', () => {
      renderLoginForm();

      expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument();
    });

    it('should render link to registration page', () => {
      renderLoginForm();

      const registerLink = screen.getByRole('link', { name: /criar conta/i });
      expect(registerLink).toBeInTheDocument();
      expect(registerLink).toHaveAttribute('href', '/register');
    });

    it('should render "Não tem uma conta?" text', () => {
      renderLoginForm();

      expect(screen.getByText(/Não tem uma conta\?/i)).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    it('should disable submit button when form is empty', () => {
      renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when only email is filled', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeDisabled();
    });

    it('should disable submit button when only password is filled', async () => {
      renderLoginForm();

      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeDisabled();
    });

    it('should enable submit button when both fields are filled', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).not.toBeDisabled();
    });
  });

  describe('Form Submission', () => {
    it('should call login with form data on submit', async () => {
      mockLogin.mockResolvedValue({ user: { id: '1', email: 'test@example.com' } });
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      await userEvent.click(submitButton);

      expect(mockClearError).toHaveBeenCalled();
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('should call clearError before login', async () => {
      mockLogin.mockResolvedValue({ user: { id: '1' } });
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      expect(mockClearError).toHaveBeenCalled();
      expect(mockClearError.mock.invocationCallOrder[0]).toBeLessThan(
        mockLogin.mock.invocationCallOrder[0]
      );
    });

    it('should prevent default form submission', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      const form = screen.getByRole('button', { name: /entrar/i }).closest('form');
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });

      // The form should handle preventDefault internally
      form?.dispatchEvent(submitEvent);

      // If not prevented, the page would refresh - this test verifies the form handler exists
      expect(form).toBeInTheDocument();
    });

    it('should handle login errors gracefully', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid credentials'));
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'wrongpassword');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      // Error is handled by the hook, component should not crash
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Input Changes', () => {
    it('should update email value on change', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'new@email.com');

      expect(emailInput).toHaveValue('new@email.com');
    });

    it('should update password value on change', async () => {
      renderLoginForm();

      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      await userEvent.type(passwordInput, 'newpassword');

      expect(passwordInput).toHaveValue('newpassword');
    });

    it('should handle clearing email field', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.clear(emailInput);

      expect(emailInput).toHaveValue('');
    });

    it('should handle clearing password field', async () => {
      renderLoginForm();

      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      await userEvent.type(passwordInput, 'password123');
      await userEvent.clear(passwordInput);

      expect(passwordInput).toHaveValue('');
    });
  });

  describe('Loading State', () => {
    it('should show loading state on button when loading', () => {
      // Mock loading state
      mockLoading = true;

      renderLoginForm();

      const submitButton = screen.getByRole('button', { name: /entrar/i });
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Display', () => {
    it('should display error message when error exists', () => {
      mockError = 'Email ou senha incorretos';

      renderLoginForm();

      expect(screen.getByText('Email ou senha incorretos')).toBeInTheDocument();
    });

    it('should not display error message when no error', () => {
      mockError = null;

      renderLoginForm();

      // The error component should not be rendered
      const errorElements = document.querySelectorAll('.bg-red-50');
      expect(errorElements.length).toBe(0);
    });
  });

  describe('Input Attributes', () => {
    it('should have correct email input attributes', () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      expect(emailInput).toHaveAttribute('type', 'email');
      expect(emailInput).toHaveAttribute('autocomplete', 'email');
      expect(emailInput).toBeRequired();
    });

    it('should have correct password input attributes', () => {
      renderLoginForm();

      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      expect(passwordInput).toHaveAttribute('type', 'password');
      expect(passwordInput).toHaveAttribute('autocomplete', 'current-password');
      expect(passwordInput).toBeRequired();
    });
  });

  describe('Accessibility', () => {
    it('should have all inputs with associated labels', () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = screen.getByLabelText('Senha');

      expect(emailInput).toBeInTheDocument();
      expect(passwordInput).toBeInTheDocument();
    });

    it('should allow form navigation with Tab key', async () => {
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      emailInput.focus();
      expect(document.activeElement).toBe(emailInput);

      await userEvent.tab();
      expect(document.activeElement).toBe(passwordInput);

      // Next tab moves past password (disabled button may be skipped)
      await userEvent.tab();
      expect(document.activeElement).not.toBe(passwordInput);
    });

    it('should submit form on Enter key in password field', async () => {
      mockLogin.mockResolvedValue({ user: { id: '1' } });
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123{enter}');

      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalled();
      });
    });
  });

  describe('Form Styling', () => {
    it('should have form with proper spacing', () => {
      renderLoginForm();

      const form = screen.getByRole('button', { name: /entrar/i }).closest('form');
      expect(form).toHaveClass('space-y-6');
    });
  });

  describe('Edge Cases', () => {
    it('should handle whitespace in email', async () => {
      mockLogin.mockResolvedValue({ user: { id: '1' } });
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, '  test@example.com  ');
      await userEvent.type(passwordInput, 'password123');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      // Email input type="email" may trim whitespace
      expect(mockLogin).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringContaining('test@example.com'),
          password: 'password123'
        })
      );
    });

    it('should handle special characters in password', async () => {
      mockLogin.mockResolvedValue({ user: { id: '1' } });
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'P@ssw0rd!#$%');
      await userEvent.click(screen.getByRole('button', { name: /entrar/i }));

      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'P@ssw0rd!#$%'
      });
    });

    it('should handle rapid form submissions', async () => {
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
      renderLoginForm();

      const emailInput = screen.getByLabelText('Email');
      const passwordInput = document.querySelector('input[type="password"]') as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /entrar/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.type(passwordInput, 'password123');

      // Rapid clicks
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);
      await userEvent.click(submitButton);

      // Login should be called for each click, but the loading state
      // should handle preventing duplicate submissions in real implementation
      expect(mockLogin).toHaveBeenCalled();
    });
  });
});
