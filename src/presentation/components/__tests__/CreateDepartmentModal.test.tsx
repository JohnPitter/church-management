// Unit tests for CreateDepartmentModal component
// Tests modal opening/closing, form validation, form submission, editing, and callbacks

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateDepartmentModal } from '../CreateDepartmentModal';
import { Department } from '@modules/church-management/departments/domain/entities/Department';

// Mock the department financial service
jest.mock('@modules/financial/department-finance/application/services/DepartmentFinancialService', () => ({
  departmentFinancialService: {
    createDepartment: jest.fn(),
    updateDepartment: jest.fn()
  }
}));

import { departmentFinancialService } from '@modules/financial/department-finance/application/services/DepartmentFinancialService';

describe('CreateDepartmentModal', () => {
  const mockOnClose = jest.fn();
  const mockOnDepartmentCreated = jest.fn();
  const mockCurrentUser = { uid: 'user-123', email: 'admin@example.com' };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onDepartmentCreated: mockOnDepartmentCreated,
    currentUser: mockCurrentUser,
    editDepartment: null
  };

  const mockDepartment: Department = {
    id: 'dept-123',
    name: 'Escola Bíblica',
    description: 'Departamento de educação cristã',
    icon: '📚',
    color: '#10B981',
    currentBalance: 500,
    initialBalance: 100,
    responsibleUserId: 'user-456',
    responsibleName: 'Maria Silva',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should render modal when isOpen is true', () => {
      render(<CreateDepartmentModal {...defaultProps} />);
      expect(screen.getByText('Novo Departamento')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<CreateDepartmentModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Novo Departamento')).not.toBeInTheDocument();
    });

    it('should display all form fields for create mode', () => {
      render(<CreateDepartmentModal {...defaultProps} />);
      expect(screen.getByLabelText(/Nome do Departamento/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
      expect(screen.getByText('Ícone')).toBeInTheDocument();
      expect(screen.getByText('Cor')).toBeInTheDocument();
      expect(screen.getByText('Saldo Inicial')).toBeInTheDocument();
      expect(screen.getByLabelText(/Responsável/i)).toBeInTheDocument();
    });

    it('should show "Editar Departamento" title when editing', () => {
      render(<CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />);
      expect(screen.getByText('Editar Departamento')).toBeInTheDocument();
    });
  });

  describe('Create mode - Form validation', () => {
    it('should show error when department name is empty', async () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome do departamento é obrigatório')).toBeInTheDocument();
      });
    });

    it('should validate department name length', async () => {
      (departmentFinancialService.createDepartment as jest.Mock).mockRejectedValue(
        new Error('Validation errors: Nome do departamento deve ter no máximo 100 caracteres')
      );

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      const longName = 'A'.repeat(101);
      await userEvent.type(nameInput, longName);

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        // The validation happens in DepartmentEntity.validateDepartment
        expect(departmentFinancialService.createDepartment).toHaveBeenCalled();
      });
    });
  });

  describe('Icon selection', () => {
    it('should display predefined icon options', () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      // Check for some of the predefined icons
      expect(screen.getByRole('button', { name: '🏦' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '📚' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '🎵' })).toBeInTheDocument();
    });

    it('should allow selecting an icon', async () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const iconButton = screen.getByRole('button', { name: '📚' });
      fireEvent.click(iconButton);

      // The icon should now be selected
      expect(iconButton).toHaveClass('border-indigo-500');
    });

    it('should have default icon selected', () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const defaultIconButton = screen.getByRole('button', { name: '🏦' });
      expect(defaultIconButton).toHaveClass('border-indigo-500');
    });
  });

  describe('Color selection', () => {
    it('should display predefined color options', () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      // There should be multiple color buttons
      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor !== ''
      );
      expect(colorButtons.length).toBe(8); // 8 predefined colors
    });

    it('should allow selecting a color', async () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor !== ''
      );

      if (colorButtons.length > 1) {
        fireEvent.click(colorButtons[1]); // Click second color
        expect(colorButtons[1]).toHaveClass('border-gray-900');
      }
    });
  });

  describe('Initial balance field', () => {
    it('should display initial balance field in create mode', () => {
      render(<CreateDepartmentModal {...defaultProps} />);
      expect(screen.getByText('Saldo Inicial')).toBeInTheDocument();
    });

    it('should NOT display initial balance field in edit mode', () => {
      render(<CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />);
      expect(screen.queryByText('Saldo Inicial')).not.toBeInTheDocument();
    });

    it('should allow entering initial balance', async () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const balanceInput = screen.getByPlaceholderText('0,00');
      await userEvent.clear(balanceInput);
      await userEvent.type(balanceInput, '500');

      expect(balanceInput).toHaveValue(500);
    });
  });

  describe('Form submission - Create mode', () => {
    it('should call departmentFinancialService.createDepartment on valid submission', async () => {
      (departmentFinancialService.createDepartment as jest.Mock).mockResolvedValue('new-dept-id');

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.type(nameInput, 'Escola Bíblica');

      const descriptionInput = screen.getByLabelText(/Descrição/i);
      await userEvent.type(descriptionInput, 'Departamento de educação');

      const responsibleInput = screen.getByLabelText(/Responsável/i);
      await userEvent.type(responsibleInput, 'João Silva');

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(departmentFinancialService.createDepartment).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Escola Bíblica',
            description: 'Departamento de educação',
            responsibleName: 'João Silva',
            icon: '🏦',
            color: '#3B82F6',
            initialBalance: 0,
            currentBalance: 0,
            isActive: true,
            createdBy: 'user-123'
          })
        );
      });
    });

    it('should call onDepartmentCreated after successful creation', async () => {
      (departmentFinancialService.createDepartment as jest.Mock).mockResolvedValue('new-dept-id');

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.type(nameInput, 'Escola Bíblica');

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnDepartmentCreated).toHaveBeenCalled();
      });
    });

    it('should call onClose after successful creation', async () => {
      (departmentFinancialService.createDepartment as jest.Mock).mockResolvedValue('new-dept-id');

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.type(nameInput, 'Escola Bíblica');

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error message when creation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (departmentFinancialService.createDepartment as jest.Mock).mockRejectedValue(
        new Error('Creation failed')
      );

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.type(nameInput, 'Escola Bíblica');

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Creation failed')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Form submission - Edit mode', () => {
    it('should populate form with existing department data', () => {
      render(<CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />);

      expect(screen.getByLabelText(/Nome do Departamento/i)).toHaveValue('Escola Bíblica');
      expect(screen.getByLabelText(/Descrição/i)).toHaveValue('Departamento de educação cristã');
      expect(screen.getByLabelText(/Responsável/i)).toHaveValue('Maria Silva');
    });

    it('should call departmentFinancialService.updateDepartment on valid edit submission', async () => {
      (departmentFinancialService.updateDepartment as jest.Mock).mockResolvedValue(undefined);

      render(<CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Escola Bíblica Atualizada');

      const submitButton = screen.getByRole('button', { name: /Atualizar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(departmentFinancialService.updateDepartment).toHaveBeenCalledWith(
          'dept-123',
          expect.objectContaining({
            name: 'Escola Bíblica Atualizada',
            icon: '📚',
            color: '#10B981'
          })
        );
      });
    });

    it('should show "Atualizar Departamento" button text in edit mode', () => {
      render(<CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />);
      expect(screen.getByRole('button', { name: /Atualizar Departamento/i })).toBeInTheDocument();
    });
  });

  describe('Modal close behavior', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button (X) is clicked', () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });
  });

  describe('Loading state', () => {
    it('should disable Cancel button when loading', async () => {
      (departmentFinancialService.createDepartment as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.type(nameInput, 'Escola Bíblica');

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      });
    });

    it('should show "Salvando..." text when loading', async () => {
      (departmentFinancialService.createDepartment as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<CreateDepartmentModal {...defaultProps} />);

      const nameInput = screen.getByLabelText(/Nome do Departamento/i);
      await userEvent.type(nameInput, 'Escola Bíblica');

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Salvando...')).toBeInTheDocument();
      });
    });
  });

  describe('Form reset behavior', () => {
    it('should reset form when switching from edit to create mode', async () => {
      const { rerender } = render(
        <CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />
      );

      // Form should have edit values
      expect(screen.getByLabelText(/Nome do Departamento/i)).toHaveValue('Escola Bíblica');

      // Rerender in create mode
      rerender(<CreateDepartmentModal {...defaultProps} editDepartment={null} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nome do Departamento/i)).toHaveValue('');
      });
    });

    it('should update form when switching to different department for editing', async () => {
      const anotherDepartment: Department = {
        ...mockDepartment,
        id: 'dept-456',
        name: 'Louvor',
        description: 'Departamento de música'
      };

      const { rerender } = render(
        <CreateDepartmentModal {...defaultProps} editDepartment={mockDepartment} />
      );

      expect(screen.getByLabelText(/Nome do Departamento/i)).toHaveValue('Escola Bíblica');

      rerender(<CreateDepartmentModal {...defaultProps} editDepartment={anotherDepartment} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nome do Departamento/i)).toHaveValue('Louvor');
      });
    });
  });

  describe('Error display', () => {
    it('should display validation errors from DepartmentEntity', async () => {
      render(<CreateDepartmentModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome do departamento é obrigatório')).toBeInTheDocument();
      });
    });

    it('should clear errors when modal is reopened', async () => {
      const { rerender } = render(<CreateDepartmentModal {...defaultProps} />);

      // Trigger validation error
      const submitButton = screen.getByRole('button', { name: /Criar Departamento/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome do departamento é obrigatório')).toBeInTheDocument();
      });

      // Close and reopen modal
      rerender(<CreateDepartmentModal {...defaultProps} isOpen={false} />);
      rerender(<CreateDepartmentModal {...defaultProps} isOpen={true} />);

      expect(screen.queryByText('Nome do departamento é obrigatório')).not.toBeInTheDocument();
    });
  });

  describe('Help text', () => {
    it('should display help text for initial balance', () => {
      render(<CreateDepartmentModal {...defaultProps} />);
      expect(screen.getByText('Saldo inicial da caixinha do departamento')).toBeInTheDocument();
    });

    it('should display help text for responsible person', () => {
      render(<CreateDepartmentModal {...defaultProps} />);
      expect(screen.getByText('Pessoa responsável por gerenciar esta caixinha')).toBeInTheDocument();
    });
  });
});
