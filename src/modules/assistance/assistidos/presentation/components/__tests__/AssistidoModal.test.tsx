import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import AssistidoModal from '../AssistidoModal';
import {
  Assistido,
  Escolaridade,
  NecessidadeAssistido,
  SituacaoFamiliar,
  StatusAssistido,
  TipoMoradia,
  TipoParentesco
} from '../../../domain/entities/Assistido';

const mockCreateAssistido = jest.fn();
const mockUpdateAssistido = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();
const mockConfirm = jest.fn();
const authValue = { currentUser: { email: 'admin@example.com' } };
const settingsValue = { settings: { primaryColor: '#2563eb' } };

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args)
  }
}));

jest.mock('@modules/assistance/assistidos/application/services/AssistidoService', () => ({
  AssistidoService: jest.fn().mockImplementation(() => ({
    createAssistido: (...args: unknown[]) => mockCreateAssistido(...args),
    updateAssistido: (...args: unknown[]) => mockUpdateAssistido(...args)
  }))
}));

jest.mock('presentation/contexts/AuthContext', () => ({
  useAuth: () => authValue
}));

jest.mock('presentation/contexts/SettingsContext', () => ({
  useSettings: () => settingsValue
}));

jest.mock('presentation/components/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: (...args: unknown[]) => mockConfirm(...args)
  })
}));

const createAssistido = (overrides: Partial<Assistido> = {}): Assistido => ({
  id: 'assistido-1',
  nome: 'Maria Silva',
  cpf: '123.456.789-09',
  rg: '1234567',
  dataNascimento: new Date('1990-05-10T12:00:00.000Z'),
  telefone: '(11) 99999-9999',
  email: 'maria@example.com',
  endereco: {
    logradouro: 'Rua A',
    numero: '10',
    complemento: 'Casa',
    bairro: 'Centro',
    cidade: 'São Paulo',
    estado: 'SP',
    cep: '01000-000'
  },
  situacaoFamiliar: SituacaoFamiliar.Casado,
  rendaFamiliar: 2500,
  profissao: 'Costureira',
  escolaridade: Escolaridade.MedioCompleto,
  necessidades: [NecessidadeAssistido.Alimentacao],
  tipoMoradia: TipoMoradia.Propria,
  quantidadeComodos: 4,
  possuiCadUnico: true,
  qualBeneficio: 'Bolsa Família',
  observacoes: 'Observação inicial',
  status: StatusAssistido.Ativo,
  dataInicioAtendimento: new Date('2025-01-10T12:00:00.000Z'),
  dataUltimoAtendimento: new Date('2025-02-10T12:00:00.000Z'),
  responsavelAtendimento: 'assistencia@example.com',
  familiares: [
    {
      id: 'fam-1',
      nome: 'João Silva',
      parentesco: TipoParentesco.Esposo,
      telefone: '(11) 98888-7777'
    }
  ],
  atendimentos: [],
  createdAt: new Date('2025-01-10T12:00:00.000Z'),
  updatedAt: new Date('2025-02-10T12:00:00.000Z'),
  createdBy: 'assistencia@example.com',
  ...overrides
});

const renderModal = (props: Partial<React.ComponentProps<typeof AssistidoModal>> = {}) =>
  render(
    <AssistidoModal
      isOpen={true}
      onClose={jest.fn()}
      onSave={jest.fn()}
      mode="create"
      {...props}
    />
  );

describe('AssistidoModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateAssistido.mockResolvedValue(createAssistido());
    mockUpdateAssistido.mockResolvedValue(createAssistido());
    mockConfirm.mockResolvedValue(true);
  });

  it('renders in view mode with prefilled data and no save button', () => {
    renderModal({
      mode: 'view',
      assistido: createAssistido()
    });

    expect(screen.getByText('Visualizar Assistido')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Maria Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123.456.789-09')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.queryByText('Cadastrar')).not.toBeInTheDocument();
    expect(screen.getByText('Fechar')).toBeInTheDocument();
  });

  it('prefills edit mode data', async () => {
    renderModal({
      mode: 'edit',
      assistido: createAssistido()
    });

    expect(screen.getByDisplayValue('Maria Silva')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123.456.789-09')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(11) 99999-9999')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Bolsa Família')).toBeInTheDocument();
  });

  it('disables submit while required fields are missing', async () => {
    renderModal();

    const submitButton = screen.getByRole('button', { name: 'Cadastrar' });

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/Preencha ou corrija \d+ campos obrigatórios para salvar/i)).toBeInTheDocument();
    expect(screen.getByText(/Pendentes: .*Nome completo.*Data de nascimento.*Telefone/i)).toBeInTheDocument();
    fireEvent.click(submitButton);
    expect(mockCreateAssistido).not.toHaveBeenCalled();
  });

});
