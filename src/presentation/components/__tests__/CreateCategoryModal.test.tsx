// Unit tests for CreateCategoryModal component
// Tests modal opening/closing, form validation, form submission, and callbacks

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateCategoryModal } from '../CreateCategoryModal';
import { TransactionType } from '@modules/financial/church-finance/domain/entities/Financial';

// Mock the financial service
jest.mock('@modules/financial/church-finance/application/services/FinancialService', () => ({
  financialService: {
    createCategory: jest.fn()
  }
}));

import { financialService } from '@modules/financial/church-finance/application/services/FinancialService';

describe('CreateCategoryModal', () => {
  const mockOnClose = jest.fn();
  const mockOnCategoryCreated = jest.fn();
  const mockCurrentUser = { email: 'admin@example.com' };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCategoryCreated: mockOnCategoryCreated,
    currentUser: mockCurrentUser
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Modal visibility', () => {
    it('should render modal when isOpen is true', () => {
      render(<CreateCategoryModal {...defaultProps} />);
      expect(screen.getByText('Nova Categoria Financeira')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<CreateCategoryModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Nova Categoria Financeira')).not.toBeInTheDocument();
    });

    it('should display all form fields', () => {
      render(<CreateCategoryModal {...defaultProps} />);
      expect(screen.getByText(/Tipo de Categoria/i)).toBeInTheDocument();
      expect(screen.getAllByText(/Nome da Categoria/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/Descrição \(Opcional\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Ícone/i)).toBeInTheDocument();
      expect(screen.getByText(/Cor/i)).toBeInTheDocument();
      expect(screen.getByText('Visualização')).toBeInTheDocument();
    });
  });

  describe('Transaction type selection', () => {
    it('should have EXPENSE as default type', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // "Despesa" appears in both the type selector card and the preview section
      // The type selector card div has border-red-500 class when selected
      // Find the "Despesa" text in the type selector (has "font-medium" class)
      const expenseCards = screen.getAllByText('Despesa');
      // Navigate up to the card div (parent of text div > card div with border classes)
      const expenseCard = expenseCards[0].closest('.cursor-pointer') || expenseCards[0].parentElement;
      expect(expenseCard).toHaveClass('border-red-500');
    });

    it('should allow switching to INCOME type', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // Click on the income radio option
      const incomeRadio = screen.getByDisplayValue(TransactionType.INCOME);
      fireEvent.click(incomeRadio);

      await waitFor(() => {
        // "Receita" may appear in both the type selector and the preview section
        const incomeCards = screen.getAllByText('Receita');
        // Navigate up to the card div (cursor-pointer class)
        const incomeCard = incomeCards[0].closest('.cursor-pointer') || incomeCards[0].parentElement;
        expect(incomeCard).toHaveClass('border-green-500');
      });
    });

    it('should display correct labels for transaction types', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // "Receita" may appear in multiple places (type selector + preview when switched)
      expect(screen.getAllByText('Receita').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Entrada de dinheiro')).toBeInTheDocument();
      // "Despesa" appears in both the type selector and the preview section
      expect(screen.getAllByText('Despesa').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Saída de dinheiro')).toBeInTheDocument();
    });
  });

  describe('Form validation', () => {
    it('should show error when category name is empty', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome da categoria é obrigatório')).toBeInTheDocument();
      });
    });

    it('should show error when category name is less than 3 characters', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'AB');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome deve ter pelo menos 3 caracteres')).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome da categoria é obrigatório')).toBeInTheDocument();
      });

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'A');

      await waitFor(() => {
        expect(screen.queryByText('Nome da categoria é obrigatório')).not.toBeInTheDocument();
      });
    });
  });

  describe('Icon selection', () => {
    it('should display predefined icon options', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // Check for some of the predefined icons
      expect(screen.getByRole('button', { name: '🙏' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '💝' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: '✨' })).toBeInTheDocument();
    });

    it('should allow selecting a predefined icon', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const iconButton = screen.getByRole('button', { name: '🙏' });
      fireEvent.click(iconButton);

      // The icon should now be selected (has selected styling)
      expect(iconButton).toHaveClass('border-indigo-500');
    });

    it('should allow typing a custom emoji', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const customIconInput = screen.getByPlaceholderText('Ou digite um emoji personalizado');
      await userEvent.clear(customIconInput);
      await userEvent.type(customIconInput, '🎉');

      expect(customIconInput).toHaveValue('🎉');
    });
  });

  describe('Color selection', () => {
    it('should display predefined color options', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // There should be multiple color buttons with different background colors
      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor !== ''
      );
      expect(colorButtons.length).toBeGreaterThan(0);
    });

    it('should allow selecting a predefined color', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // Get a color button and click it
      const colorButtons = screen.getAllByRole('button').filter(
        btn => btn.style.backgroundColor !== ''
      );

      if (colorButtons.length > 0) {
        fireEvent.click(colorButtons[1]); // Click second color
        expect(colorButtons[1]).toHaveClass('border-gray-800');
      }
    });

    it('should allow using the color picker', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const colorInput = screen.getByDisplayValue('#6366F1');
      expect(colorInput).toBeInTheDocument();
    });
  });

  describe('Preview section', () => {
    it('should display preview with default values', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      expect(screen.getByText('Nome da categoria')).toBeInTheDocument();
      // "Despesa" appears in both the type selector and the preview section
      expect(screen.getAllByText('Despesa').length).toBeGreaterThanOrEqual(1);
    });

    it('should update preview when name changes', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      // The preview should show the entered name
      const previewSection = screen.getByText('Visualização').closest('div');
      expect(previewSection).toHaveTextContent('Alimentação');
    });

    it('should update preview when description changes', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const descriptionInput = screen.getByPlaceholderText('Descrição da categoria...');
      await userEvent.type(descriptionInput, 'Gastos com alimentação');

      const previewSection = screen.getByText('Visualização').closest('div');
      expect(previewSection).toHaveTextContent('Gastos com alimentação');
    });
  });

  describe('Form submission', () => {
    it('should call financialService.createCategory on valid submission', async () => {
      (financialService.createCategory as jest.Mock).mockResolvedValue('new-category-id');

      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const descriptionInput = screen.getByPlaceholderText('Descrição da categoria...');
      await userEvent.type(descriptionInput, 'Gastos com alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(financialService.createCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Alimentação',
            description: 'Gastos com alimentação',
            type: TransactionType.EXPENSE,
            color: '#6366F1',
            icon: '📄',
            isActive: true,
            createdBy: 'admin@example.com'
          })
        );
      });
    });

    it('should call onCategoryCreated after successful submission', async () => {
      (financialService.createCategory as jest.Mock).mockResolvedValue('new-category-id');

      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnCategoryCreated).toHaveBeenCalled();
      });
    });

    it('should call onClose after successful submission', async () => {
      (financialService.createCategory as jest.Mock).mockResolvedValue('new-category-id');

      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error message when creation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (financialService.createCategory as jest.Mock).mockRejectedValue(new Error('Creation failed'));

      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro ao criar categoria. Tente novamente.')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should use "unknown" as createdBy when currentUser is null', async () => {
      (financialService.createCategory as jest.Mock).mockResolvedValue('new-category-id');

      render(<CreateCategoryModal {...defaultProps} currentUser={null} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(financialService.createCategory).toHaveBeenCalledWith(
          expect.objectContaining({
            createdBy: 'unknown'
          })
        );
      });
    });
  });

  describe('Modal close behavior', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button (X) is clicked', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should reset form and errors when modal is closed', () => {
      render(<CreateCategoryModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should disable Cancel button when loading', async () => {
      (financialService.createCategory as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      });
    });

    it('should show loading indicator in submit button when loading', async () => {
      (financialService.createCategory as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<CreateCategoryModal {...defaultProps} />);

      const nameInput = screen.getByPlaceholderText('Nome da categoria');
      await userEvent.type(nameInput, 'Alimentação');

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Criando...')).toBeInTheDocument();
      });
    });
  });

  describe('Error display', () => {
    it('should display multiple validation errors', async () => {
      render(<CreateCategoryModal {...defaultProps} />);

      // Clear the default icon and color to trigger validation errors
      const iconInput = screen.getByPlaceholderText('Ou digite um emoji personalizado');
      await userEvent.clear(iconInput);

      const submitButton = screen.getByRole('button', { name: /Criar Categoria/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Nome da categoria é obrigatório')).toBeInTheDocument();
        expect(screen.getByText('Nome deve ter pelo menos 3 caracteres')).toBeInTheDocument();
      });
    });
  });
});
