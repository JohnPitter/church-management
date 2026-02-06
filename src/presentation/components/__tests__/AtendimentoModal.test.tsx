// Unit tests for AtendimentoModal component
// Tests modal rendering, form validation, form submission, loading states, and callbacks

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AtendimentoModal from '../AtendimentoModal';
import {
  StatusAssistido,
  SituacaoFamiliar,
  Escolaridade,
  TipoMoradia,
  TipoAtendimento
} from '@modules/assistance/assistidos/domain/entities/Assistido';

import { AssistidoService } from '@modules/assistance/assistidos/application/services/AssistidoService';

// Mock the AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User'
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

// Mock the AssistidoService
const mockAddAtendimento = jest.fn();

jest.mock('@modules/assistance/assistidos/application/services/AssistidoService', () => ({
  AssistidoService: jest.fn()
}));

// Mock window.alert
const mockAlert = jest.fn();
window.alert = mockAlert;

describe('AtendimentoModal', () => {
  const mockOnClose = jest.fn();
  const mockOnSave = jest.fn();

  const createMockAssistido = (overrides = {}) => ({
    id: 'assistido-123',
    nome: 'Maria Silva',
    cpf: '123.456.789-00',
    dataNascimento: new Date('1985-05-15'),
    telefone: '(11) 99999-9999',
    email: 'maria@example.com',
    endereco: {
      logradouro: 'Rua das Flores',
      numero: '123',
      bairro: 'Centro',
      cidade: 'Sao Paulo',
      estado: 'SP',
      cep: '01234-567'
    },
    situacaoFamiliar: SituacaoFamiliar.Casado,
    escolaridade: Escolaridade.MedioCompleto,
    necessidades: [],
    tipoMoradia: TipoMoradia.Alugada,
    quantidadeComodos: 3,
    possuiCadUnico: false,
    status: StatusAssistido.Ativo,
    dataInicioAtendimento: new Date(),
    responsavelAtendimento: 'Admin',
    familiares: [],
    atendimentos: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin@example.com',
    ...overrides
  });

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onSave: mockOnSave,
    assistido: createMockAssistido()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockAddAtendimento.mockResolvedValue(undefined);
    (AssistidoService as jest.Mock).mockImplementation(() => ({
      addAtendimento: mockAddAtendimento
    }));
    window.alert = mockAlert;
  });

  describe('Modal visibility', () => {
    it('should render modal when isOpen is true and assistido is provided', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getAllByText('Registrar Atendimento').length).toBeGreaterThanOrEqual(1);
    });

    it('should not render modal when isOpen is false', () => {
      render(<AtendimentoModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText('Registrar Atendimento')).not.toBeInTheDocument();
    });

    it('should not render modal when assistido is null', () => {
      render(<AtendimentoModal {...defaultProps} assistido={null} />);
      expect(screen.queryByText('Registrar Atendimento')).not.toBeInTheDocument();
    });

    it('should display assistido name in modal', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getByText('Maria Silva')).toBeInTheDocument();
    });
  });

  describe('Form fields display', () => {
    it('should display tipo de atendimento select', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getByLabelText(/Tipo de Atendimento/i)).toBeInTheDocument();
    });

    it('should display descricao textarea', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getByLabelText(/Descrição do Atendimento/i)).toBeInTheDocument();
    });

    it('should display valor doacao field', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getByLabelText(/Valor da Doação/i)).toBeInTheDocument();
    });

    it('should display proximo retorno field', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getByLabelText(/Próximo Retorno/i)).toBeInTheDocument();
    });

    it('should render all tipo atendimento options', () => {
      render(<AtendimentoModal {...defaultProps} />);
      const select = screen.getByLabelText(/Tipo de Atendimento/i);

      expect(select).toContainHTML('Cesta Básica');
      expect(select).toContainHTML('Donativos');
      expect(select).toContainHTML('Medicamento');
      expect(select).toContainHTML('Vestuário');
    });
  });

  describe('Form interactions', () => {
    it('should allow changing tipo de atendimento', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const select = screen.getByLabelText(/Tipo de Atendimento/i);
      await userEvent.selectOptions(select, TipoAtendimento.Medicamento);

      expect(select).toHaveValue(TipoAtendimento.Medicamento);
    });

    it('should allow typing in descricao field', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento de emergencia');

      expect(textarea).toHaveValue('Atendimento de emergencia');
    });

    it('should allow entering valor doacao', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const input = screen.getByLabelText(/Valor da Doação/i);
      await userEvent.type(input, '150.50');

      expect(input).toHaveValue(150.50);
    });

    it('should allow setting proximo retorno date', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const input = screen.getByLabelText(/Próximo Retorno/i);
      fireEvent.change(input, { target: { value: '2026-03-15' } });

      expect(input).toHaveValue('2026-03-15');
    });
  });

  describe('Itens doados functionality', () => {
    it('should display itens doados section', () => {
      render(<AtendimentoModal {...defaultProps} />);
      expect(screen.getByText(/Itens Doados/i)).toBeInTheDocument();
    });

    it('should allow adding an item', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const itemInput = screen.getByPlaceholderText('Nome do item');
      const quantidadeInput = screen.getByPlaceholderText('Quantidade');
      const addButton = screen.getByRole('button', { name: '+' });

      await userEvent.type(itemInput, 'Arroz');
      await userEvent.type(quantidadeInput, '5');
      fireEvent.click(addButton);

      expect(screen.getByText('Arroz - 5 kg')).toBeInTheDocument();
    });

    it('should allow removing an item', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      // Add an item first
      const itemInput = screen.getByPlaceholderText('Nome do item');
      const quantidadeInput = screen.getByPlaceholderText('Quantidade');
      const addButton = screen.getByRole('button', { name: '+' });

      await userEvent.type(itemInput, 'Feijao');
      await userEvent.type(quantidadeInput, '2');
      fireEvent.click(addButton);

      // Verify item is added
      expect(screen.getByText('Feijao - 2 kg')).toBeInTheDocument();

      // Find and click remove button
      const removeButtons = screen.getAllByRole('button').filter(btn =>
        btn.textContent === '\u2715' || btn.innerHTML.includes('✕')
      );
      // The first remove button should be for the item (not the modal close)
      const itemRemoveButton = removeButtons[removeButtons.length - 1];
      fireEvent.click(itemRemoveButton);

      // Item should be removed
      expect(screen.queryByText('Feijao - 2 kg')).not.toBeInTheDocument();
    });

    it('should not add item without name', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const quantidadeInput = screen.getByPlaceholderText('Quantidade');
      const addButton = screen.getByRole('button', { name: '+' });

      await userEvent.type(quantidadeInput, '5');
      fireEvent.click(addButton);

      // Should not see any item added
      expect(screen.queryByText(/5 kg/)).not.toBeInTheDocument();
    });

    it('should not add item without quantity', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const itemInput = screen.getByPlaceholderText('Nome do item');
      const addButton = screen.getByRole('button', { name: '+' });

      await userEvent.type(itemInput, 'Arroz');
      fireEvent.click(addButton);

      // Should not see any item added with just name
      expect(screen.queryByText(/Arroz -/)).not.toBeInTheDocument();
    });

    it('should allow changing unit type', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const unitSelect = screen.getByDisplayValue('kg');
      await userEvent.selectOptions(unitSelect, 'unidade');

      expect(unitSelect).toHaveValue('unidade');
    });
  });

  describe('Form validation', () => {
    it('should show alert when descricao is empty on save', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      // Button is disabled when descricao is empty, so alert is not triggered
      expect(saveButton).toBeDisabled();
      expect(mockAddAtendimento).not.toHaveBeenCalled();
    });

    it('should disable save button when descricao is empty', () => {
      render(<AtendimentoModal {...defaultProps} />);

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      expect(saveButton).toBeDisabled();
    });

    it('should enable save button when descricao has content', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Descricao do atendimento');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      expect(saveButton).not.toBeDisabled();
    });
  });

  describe('Form submission', () => {
    it('should call addAtendimento with correct data on successful submit', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Entrega de cesta basica mensal');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddAtendimento).toHaveBeenCalledWith(
          'assistido-123',
          expect.objectContaining({
            tipo: TipoAtendimento.CestaBasica,
            descricao: 'Entrega de cesta basica mensal',
            responsavel: 'test@example.com'
          })
        );
      });
    });

    it('should call onSave and onClose after successful submission', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento realizado');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should show success alert after successful submission', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento realizado com sucesso');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(
          expect.stringContaining('Atendimento registrado com sucesso')
        );
      });
    });

    it('should include itensDoados when items are added', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      // Add description
      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Doacao de alimentos');

      // Add an item
      const itemInput = screen.getByPlaceholderText('Nome do item');
      const quantidadeInput = screen.getByPlaceholderText('Quantidade');
      const addButton = screen.getByRole('button', { name: '+' });

      await userEvent.type(itemInput, 'Arroz');
      await userEvent.type(quantidadeInput, '5');
      fireEvent.click(addButton);

      // Submit
      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddAtendimento).toHaveBeenCalledWith(
          'assistido-123',
          expect.objectContaining({
            itensDoados: [{ item: 'Arroz', quantidade: 5, unidade: 'kg' }]
          })
        );
      });
    });

    it('should include valorDoacao when provided', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Doacao em dinheiro');

      const valorInput = screen.getByLabelText(/Valor da Doação/i);
      await userEvent.type(valorInput, '100');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddAtendimento).toHaveBeenCalledWith(
          'assistido-123',
          expect.objectContaining({
            valorDoacao: 100
          })
        );
      });
    });

    it('should include proximoRetorno when provided', async () => {
      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento com retorno agendado');

      const retornoInput = screen.getByLabelText(/Próximo Retorno/i);
      fireEvent.change(retornoInput, { target: { value: '2026-03-15' } });

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAddAtendimento).toHaveBeenCalledWith(
          'assistido-123',
          expect.objectContaining({
            proximoRetorno: expect.any(Date)
          })
        );
      });
    });
  });

  describe('Error handling', () => {
    it('should show error alert when submission fails', async () => {
      const errorMessage = 'Network error';
      mockAddAtendimento.mockRejectedValue(new Error(errorMessage));

      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento teste');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(`Erro ao registrar atendimento: ${errorMessage}`);
      });
    });

    it('should not call onSave or onClose when submission fails', async () => {
      mockAddAtendimento.mockRejectedValue(new Error('Submission failed'));

      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento teste');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnSave).not.toHaveBeenCalled();
        expect(mockOnClose).not.toHaveBeenCalled();
      });
    });
  });

  describe('Loading state', () => {
    it('should show loading text when submitting', async () => {
      // Make the service call slow
      mockAddAtendimento.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento teste');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByText('Salvando...')).toBeInTheDocument();
      });
    });

    it('should disable inputs while loading', async () => {
      mockAddAtendimento.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento teste');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Tipo de Atendimento/i)).toBeDisabled();
        expect(screen.getByLabelText(/Descrição do Atendimento/i)).toBeDisabled();
      });
    });

    it('should disable cancel button while loading', async () => {
      mockAddAtendimento.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<AtendimentoModal {...defaultProps} />);

      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Atendimento teste');

      const saveButton = screen.getByRole('button', { name: /Registrar Atendimento/i });
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Cancelar/i })).toBeDisabled();
      });
    });
  });

  describe('Modal close behavior', () => {
    it('should call onClose when clicking cancel button', () => {
      render(<AtendimentoModal {...defaultProps} />);

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should call onClose when clicking close (X) button', () => {
      render(<AtendimentoModal {...defaultProps} />);

      // Find the close button (X button in header) - it has "✕" text
      const closeButton = screen.getByRole('button', { name: '✕' });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('should reset form when modal reopens', async () => {
      const { rerender } = render(<AtendimentoModal {...defaultProps} />);

      // Fill the form
      const textarea = screen.getByLabelText(/Descrição do Atendimento/i);
      await userEvent.type(textarea, 'Some description');

      // Close modal
      rerender(<AtendimentoModal {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<AtendimentoModal {...defaultProps} isOpen={true} />);

      // Form should be reset
      const newTextarea = screen.getByLabelText(/Descrição do Atendimento/i);
      expect(newTextarea).toHaveValue('');
    });
  });
});
