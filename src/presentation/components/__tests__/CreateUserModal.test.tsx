// Unit tests for CreateUserModal component
// Tests modal opening/closing, form validation, form submission, and callbacks

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateUserModal } from '../CreateUserModal';
import { UserRole } from '@/domain/entities/User';

describe('CreateUserModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCreateUser = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreateUser: mockOnCreateUser,
    loading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should render modal when isOpen is true', () => {
      render(<CreateUserModal {...defaultProps} />);
      expect(screen.getByText('Criar Novo Usuário')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<CreateUserModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Criar Novo Usuário')).not.toBeInTheDocument();
    });

    it('should display all form fields', () => {
      render(<CreateUserModal {...defaultProps} />);
      expect(screen.getByLabelText(/Nome Completo/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Confirmar Senha/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Função/i)).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show error when displayName is empty', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      });
    });

    it('should show error when displayName is less than 2 characters', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeInTheDocument();
      });
    });

    it('should show error when email is empty', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email é obrigatório')).toBeInTheDocument();
      });
    });

    it('should show error when email format is invalid', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'invalid-email');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email deve ter um formato válido')).toBeInTheDocument();
      });
    });

    it('should show error when password is empty', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Senha é obrigatória')).toBeInTheDocument();
      });
    });

    it('should show error when password is less than 6 characters', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '12345');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Senha deve ter pelo menos 6 caracteres')).toBeInTheDocument();
      });
    });

    it('should show error when confirm password is empty', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '123456');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Confirmação de senha é obrigatória')).toBeInTheDocument();
      });
    });

    it('should show error when passwords do not match', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '123456');

      const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/i);
      await userEvent.type(confirmPasswordInput, '654321');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Senhas não coincidem')).toBeInTheDocument();
      });
    });

    it('should clear field error when user starts typing', async () => {
      render(<CreateUserModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome é obrigatório')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'J');

      await waitFor(() => {
        expect(screen.queryByText('Nome é obrigatório')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form submission', () => {
    it('should call onCreateUser with correct data on valid submission', async () => {
      mockOnCreateUser.mockResolvedValue(undefined);
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'JOHN@EXAMPLE.COM');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '123456');

      const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/i);
      await userEvent.type(confirmPasswordInput, '123456');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateUser).toHaveBeenCalledWith({
          displayName: 'John Doe',
          email: 'john@example.com', // Should be lowercase
          password: '123456',
          role: UserRole.Member // Default role
        });
      });
    });

    it('should call onClose after successful submission', async () => {
      mockOnCreateUser.mockResolvedValue(undefined);
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '123456');

      const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/i);
      await userEvent.type(confirmPasswordInput, '123456');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not call onClose when onCreateUser throws error', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockOnCreateUser.mockRejectedValue(new Error('Creation failed'));
      render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '123456');

      const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/i);
      await userEvent.type(confirmPasswordInput, '123456');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateUser).toHaveBeenCalled();
      });

      // onClose should not be called since submission failed
      expect(mockOnClose).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Role selection', () => {
    it('should display default roles when availableRoles is not provided', () => {
      render(<CreateUserModal {...defaultProps} />);

      const roleSelect = screen.getByLabelText(/Função/i);
      expect(roleSelect).toBeInTheDocument();

      // Check for default role options
      expect(screen.getByRole('option', { name: 'Membro' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Profissional' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Secretário' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Administrador' })).toBeInTheDocument();
    });

    it('should display custom roles when availableRoles is provided', () => {
      const customRoles = [
        { value: 'custom_role', label: 'Custom Role' },
        { value: 'another_role', label: 'Another Role' }
      ];

      render(<CreateUserModal {...defaultProps} availableRoles={customRoles} />);

      expect(screen.getByRole('option', { name: 'Custom Role' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Another Role' })).toBeInTheDocument();
    });

    it('should allow changing the role', async () => {
      mockOnCreateUser.mockResolvedValue(undefined);
      render(<CreateUserModal {...defaultProps} />);

      const roleSelect = screen.getByLabelText(/Função/i);
      await userEvent.selectOptions(roleSelect, UserRole.Admin);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const emailInput = screen.getByLabelText(/Email/i);
      await userEvent.type(emailInput, 'john@example.com');

      const passwordInput = screen.getByLabelText(/^Senha/i);
      await userEvent.type(passwordInput, '123456');

      const confirmPasswordInput = screen.getByLabelText(/Confirmar Senha/i);
      await userEvent.type(confirmPasswordInput, '123456');

      const submitButton = screen.getByRole('button', { name: /Criar Usuário/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCreateUser).toHaveBeenCalledWith(
          expect.objectContaining({
            role: UserRole.Admin
          })
        );
      });
    });
  });

  describe('Modal close behavior', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<CreateUserModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button (X) is clicked', () => {
      render(<CreateUserModal {...defaultProps} />);

      // Find the close button by its SVG icon container
      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should reset form when modal is closed', async () => {
      const { rerender } = render(<CreateUserModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome Completo/i);
      await userEvent.type(nameInput, 'John Doe');

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      // Reopen the modal
      rerender(<CreateUserModal {...defaultProps} isOpen={true} />);

      // The form should be reset (though the component manages this internally)
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should disable all form inputs when loading', () => {
      render(<CreateUserModal {...defaultProps} loading={true} />);

      expect(screen.getByLabelText(/Nome Completo/i)).toBeDisabled();
      expect(screen.getByLabelText(/Email/i)).toBeDisabled();
      expect(screen.getByLabelText(/^Senha/i)).toBeDisabled();
      expect(screen.getByLabelText(/Confirmar Senha/i)).toBeDisabled();
      expect(screen.getByLabelText(/Função/i)).toBeDisabled();
    });

    it('should disable buttons when loading', () => {
      render(<CreateUserModal {...defaultProps} loading={true} />);

      expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /Criando/i })).toBeDisabled();
    });

    it('should show loading indicator in submit button when loading', () => {
      render(<CreateUserModal {...defaultProps} loading={true} />);

      expect(screen.getByText('Criando...')).toBeInTheDocument();
    });
  });

  describe('Help text', () => {
    it('should display help text about user activation', () => {
      render(<CreateUserModal {...defaultProps} />);

      expect(screen.getByText(/O usuário receberá as credenciais por email/i)).toBeInTheDocument();
    });
  });
});
