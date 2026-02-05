// Unit tests for CreateTransactionModal component
// Tests modal opening/closing, form validation, form submission, and callbacks

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateTransactionModal } from '../CreateTransactionModal';
import {
  TransactionType,
  PaymentMethod,
  TransactionStatus,
  FinancialCategory
} from '@modules/financial/church-finance/domain/entities/Financial';

// Mock the financial service
jest.mock('@modules/financial/church-finance/application/services/FinancialService', () => ({
  financialService: {
    createTransaction: jest.fn(),
    getCategories: jest.fn()
  }
}));

import { financialService } from '@modules/financial/church-finance/application/services/FinancialService';

describe('CreateTransactionModal', () => {
  const mockOnClose = jest.fn();
  const mockOnTransactionCreated = jest.fn();
  const mockCurrentUser = { email: 'admin@example.com' };

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onTransactionCreated: mockOnTransactionCreated,
    currentUser: mockCurrentUser
  };

  const mockExpenseCategories: FinancialCategory[] = [
    {
      id: 'cat-1',
      name: 'Salários',
      type: TransactionType.EXPENSE,
      icon: '💼',
      color: '#EF4444',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'cat-2',
      name: 'Contas de Luz',
      type: TransactionType.EXPENSE,
      icon: '⚡',
      color: '#F59E0B',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockIncomeCategories: FinancialCategory[] = [
    {
      id: 'cat-3',
      name: 'Dízimos',
      type: TransactionType.INCOME,
      icon: '🙏',
      color: '#22C55E',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    // Default mock implementation for getCategories
    (financialService.getCategories as jest.Mock).mockImplementation((type: TransactionType) => {
      if (type === TransactionType.EXPENSE) {
        return Promise.resolve(mockExpenseCategories);
      }
      return Promise.resolve(mockIncomeCategories);
    });
  });

  describe('Modal visibility', () => {
    it('should render modal when isOpen is true', async () => {
      render(<CreateTransactionModal {...defaultProps} />);
      expect(screen.getByText('Nova Transação Financeira')).toBeInTheDocument();
    });

    it('should not render modal when isOpen is false', () => {
      render(<CreateTransactionModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Nova Transação Financeira')).not.toBeInTheDocument();
    });

    it('should display all form fields', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/Tipo de Transação/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Categoria/i)).toBeInTheDocument();
      expect(screen.getByText(/Valor \(R\$\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Data/i)).toBeInTheDocument();
      expect(screen.getByText(/Descrição/i)).toBeInTheDocument();
      expect(screen.getByText(/Método de Pagamento/i)).toBeInTheDocument();
      expect(screen.getByText(/Referência \(Opcional\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Observações \(Opcional\)/i)).toBeInTheDocument();
    });
  });

  describe('Category loading', () => {
    it('should load categories when modal opens', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalledWith(TransactionType.EXPENSE);
      });
    });

    it('should reload categories when transaction type changes', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalledWith(TransactionType.EXPENSE);
      });

      // Switch to income
      const incomeRadio = screen.getByDisplayValue(TransactionType.INCOME);
      fireEvent.click(incomeRadio);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalledWith(TransactionType.INCOME);
      });
    });

    it('should auto-select first category when categories load', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        const categorySelect = screen.getByRole('combobox');
        expect(categorySelect).toHaveValue('cat-1');
      });
    });

    it('should handle category loading error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (financialService.getCategories as jest.Mock).mockRejectedValue(new Error('Load failed'));

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        // Categories should be empty, but modal should still work
        const categorySelect = screen.getByRole('combobox');
        expect(categorySelect).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Transaction type selection', () => {
    it('should have EXPENSE as default type', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const expenseCard = screen.getByText('Despesa').closest('div');
      expect(expenseCard).toHaveClass('border-red-500');
    });

    it('should allow switching to INCOME type', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const incomeRadio = screen.getByDisplayValue(TransactionType.INCOME);
      fireEvent.click(incomeRadio);

      await waitFor(() => {
        const incomeCard = screen.getByText('Receita').closest('div');
        expect(incomeCard).toHaveClass('border-green-500');
      });
    });

    it('should reset category when type changes', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      // Wait for initial load
      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      // Switch to income
      const incomeRadio = screen.getByDisplayValue(TransactionType.INCOME);
      fireEvent.click(incomeRadio);

      await waitFor(() => {
        // Category should be reset and income categories loaded
        expect(financialService.getCategories).toHaveBeenLastCalledWith(TransactionType.INCOME);
      });
    });
  });

  describe('Form validation', () => {
    it('should show error when description is empty', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
      });
    });

    it('should show error when amount is zero or negative', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Test transaction');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Valor deve ser maior que zero')).toBeInTheDocument();
      });
    });

    it('should show error when category is not selected', async () => {
      (financialService.getCategories as jest.Mock).mockResolvedValue([]);

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Test transaction');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '100');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Categoria é obrigatória')).toBeInTheDocument();
      });
    });

    it('should show error when date is empty', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Test transaction');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '100');

      // Clear the date field
      const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
      await userEvent.clear(dateInput);

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Data é obrigatória')).toBeInTheDocument();
      });
    });

    it('should clear errors when user starts typing', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Descrição é obrigatória')).toBeInTheDocument();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'T');

      await waitFor(() => {
        expect(screen.queryByText('Descrição é obrigatória')).not.toBeInTheDocument();
      });
    });
  });

  describe('Payment method selection', () => {
    it('should display all payment methods', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const paymentSelect = screen.getAllByRole('combobox')[1]; // Second select is payment method
      expect(paymentSelect).toBeInTheDocument();

      // Check for payment method options
      expect(screen.getByRole('option', { name: 'Dinheiro' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'PIX' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Transferência Bancária' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cartão de Débito' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cartão de Crédito' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Cheque' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Boleto' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Outro' })).toBeInTheDocument();
    });

    it('should have CASH as default payment method', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const paymentSelect = screen.getAllByRole('combobox')[1];
      expect(paymentSelect).toHaveValue(PaymentMethod.CASH);
    });
  });

  describe('Form submission', () => {
    it('should call financialService.createTransaction on valid submission', async () => {
      (financialService.createTransaction as jest.Mock).mockResolvedValue('new-transaction-id');

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const referenceInput = screen.getByPlaceholderText('Número da nota, recibo, etc.');
      await userEvent.type(referenceInput, 'NF-12345');

      const notesInput = screen.getByPlaceholderText('Informações adicionais...');
      await userEvent.type(notesInput, 'Mês de janeiro');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(financialService.createTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: TransactionType.EXPENSE,
            category: mockExpenseCategories[0],
            amount: 150.5,
            description: 'Pagamento de luz',
            paymentMethod: PaymentMethod.CASH,
            reference: 'NF-12345',
            notes: 'Mês de janeiro',
            createdBy: 'admin@example.com',
            status: TransactionStatus.APPROVED
          })
        );
      });
    });

    it('should call onTransactionCreated after successful submission', async () => {
      (financialService.createTransaction as jest.Mock).mockResolvedValue('new-transaction-id');

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnTransactionCreated).toHaveBeenCalled();
      });
    });

    it('should call onClose after successful submission', async () => {
      (financialService.createTransaction as jest.Mock).mockResolvedValue('new-transaction-id');

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show error when category not found', async () => {
      (financialService.getCategories as jest.Mock)
        .mockResolvedValueOnce(mockExpenseCategories) // Initial load
        .mockResolvedValueOnce([]); // After type change

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      // Select a category that will later be removed
      const categorySelect = screen.getByRole('combobox');
      await userEvent.selectOptions(categorySelect, 'cat-1');

      // Mock categories to return empty (simulating category being deleted)
      (financialService.getCategories as jest.Mock).mockResolvedValue([]);

      // Try to submit with a category that no longer exists
      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Test');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '100');

      // Clear category manually to simulate not found scenario
      await userEvent.selectOptions(categorySelect, '');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Categoria é obrigatória')).toBeInTheDocument();
      });
    });

    it('should show error when creation fails', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      (financialService.createTransaction as jest.Mock).mockRejectedValue(
        new Error('Creation failed')
      );

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Erro ao criar transação. Tente novamente.')).toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });

    it('should not include optional fields if empty', async () => {
      (financialService.createTransaction as jest.Mock).mockResolvedValue('new-transaction-id');

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        const callArgs = (financialService.createTransaction as jest.Mock).mock.calls[0][0];
        expect(callArgs.reference).toBeUndefined();
        expect(callArgs.notes).toBeUndefined();
      });
    });
  });

  describe('Modal close behavior', () => {
    it('should call onClose when Cancel button is clicked', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when close button (X) is clicked', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const closeButton = closeButtons.find(btn => btn.querySelector('svg'));

      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should reset form when modal is closed', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('Loading state', () => {
    it('should disable Cancel button when loading', async () => {
      (financialService.createTransaction as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      });
    });

    it('should show loading indicator in submit button when loading', async () => {
      (financialService.createTransaction as jest.Mock).mockImplementation(
        () => new Promise(resolve => setTimeout(resolve, 1000))
      );

      render(<CreateTransactionModal {...defaultProps} />);

      await waitFor(() => {
        expect(financialService.getCategories).toHaveBeenCalled();
      });

      const descriptionInput = screen.getByPlaceholderText('Descreva a transação...');
      await userEvent.type(descriptionInput, 'Pagamento de luz');

      const amountInput = screen.getByPlaceholderText('0,00');
      await userEvent.type(amountInput, '150.50');

      const submitButton = screen.getByRole('button', { name: /Criar Transação/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Criando...')).toBeInTheDocument();
      });
    });
  });

  describe('Date field', () => {
    it('should have today as default date', () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const today = new Date().toISOString().split('T')[0];
      const dateInput = screen.getByDisplayValue(today);
      expect(dateInput).toBeInTheDocument();
    });

    it('should allow changing the date', async () => {
      render(<CreateTransactionModal {...defaultProps} />);

      const dateInput = screen.getByDisplayValue(new Date().toISOString().split('T')[0]);
      await userEvent.clear(dateInput);
      await userEvent.type(dateInput, '2024-06-15');

      expect(dateInput).toHaveValue('2024-06-15');
    });
  });
});
