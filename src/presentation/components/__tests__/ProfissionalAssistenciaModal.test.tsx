import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import ProfissionalAssistenciaModal from '../ProfissionalAssistenciaModal';
import {
  ModalidadeAtendimento,
  ProfissionalAssistencia,
  StatusProfissional,
  TipoAssistencia
} from '@modules/assistance/assistencia/domain/entities/Assistencia';

const mockCreateProfissional = jest.fn();
const mockUpdateProfissional = jest.fn();
const mockCreateUserAccountForProfessional = jest.fn();
const mockInativarProfissional = jest.fn();
const mockDeleteProfissionalPermanente = jest.fn();
const mockConfirm = jest.fn();
const mockPrompt = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { email: 'admin@example.com' }
  })
}));

jest.mock('../ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: mockConfirm,
    prompt: mockPrompt
  })
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: (...args: any[]) => mockToastSuccess(...args),
    error: (...args: any[]) => mockToastError(...args)
  }
}));

jest.mock('@modules/assistance/assistencia/application/services/AssistenciaService', () => ({
  ProfissionalAssistenciaService: jest.fn().mockImplementation(() => ({
    createProfissional: mockCreateProfissional,
    updateProfissional: mockUpdateProfissional,
    createUserAccountForProfessional: mockCreateUserAccountForProfessional,
    inativarProfissional: mockInativarProfissional,
    deleteProfissionalPermanente: mockDeleteProfissionalPermanente
  }))
}));

describe('ProfissionalAssistenciaModal', () => {
  const profissional: ProfissionalAssistencia = {
    id: 'prof-1',
    nome: 'Dra. Ana',
    email: 'ana@example.com',
    telefone: '(11) 99999-9999',
    endereco: {
      cep: '01000-000',
      logradouro: 'Rua A',
      numero: '10',
      complemento: '',
      bairro: 'Centro',
      cidade: 'São Paulo',
      estado: 'SP'
    },
    especialidade: TipoAssistencia.Psicologica,
    registroProfissional: 'CRP 123',
    tempoConsulta: 60,
    valorConsulta: 150,
    status: StatusProfissional.Ativo,
    dataCadastro: new Date(),
    horariosFuncionamento: [],
    modalidadesAtendimento: [ModalidadeAtendimento.Presencial],
    documentos: [],
    avaliacoes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'admin@example.com',
    userId: undefined
  };

  const renderModal = (props: Partial<React.ComponentProps<typeof ProfissionalAssistenciaModal>> = {}) => {
    const onClose = jest.fn();
    const onSave = jest.fn();
    render(
      <ProfissionalAssistenciaModal
        isOpen
        onClose={onClose}
        onSave={onSave}
        mode="create"
        {...props}
      />
    );
    return { onClose, onSave };
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateProfissional.mockResolvedValue({ ...profissional });
    mockUpdateProfissional.mockResolvedValue({ ...profissional, nome: 'Dra. Ana Atualizada' });
    mockCreateUserAccountForProfessional.mockResolvedValue({
      success: true,
      temporaryPassword: 'Temp123!',
      userId: 'user-99'
    });
    mockConfirm.mockResolvedValue(true);
    mockPrompt.mockResolvedValue('Motivo');
  });

  it('renders in view mode with prefilled data and no save button', async () => {
    renderModal({ mode: 'view', profissional });

    expect(screen.getByText('👁️ Visualizar Profissional')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Dra. Ana')).toBeDisabled();
    expect(screen.queryByRole('button', { name: /Cadastrar|Atualizar/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument();
  });

  it('shows validation errors and blocks invalid create submission', async () => {
    renderModal();

    fireEvent.click(screen.getByRole('button', { name: /Cadastrar/i }));

    expect(mockCreateProfissional).not.toHaveBeenCalled();
    expect(await screen.findByText('Email é obrigatório')).toBeInTheDocument();
    expect(screen.getByText('Telefone é obrigatório')).toBeInTheDocument();
  });

  it('does not show account creation action in view mode', async () => {
    renderModal({ mode: 'view', profissional });

    expect(screen.queryByText('Sem conta')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Criar Conta/i })).not.toBeInTheDocument();
  });
});
