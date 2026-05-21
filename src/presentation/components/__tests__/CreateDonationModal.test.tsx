import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateDonationModal } from '../CreateDonationModal';

jest.mock('@modules/financial/church-finance/domain/entities/Financial', () => ({
  DonationType: {
    TITHE: 'TITHE',
    OFFERING: 'OFFERING',
    SPECIAL_OFFERING: 'SPECIAL_OFFERING',
    MISSION: 'MISSION',
    BUILDING_FUND: 'BUILDING_FUND',
    CHARITY: 'CHARITY',
  },
  PaymentMethod: {
    CASH: 'CASH',
    PIX: 'PIX',
  },
  TransactionType: {
    INCOME: 'INCOME',
  },
}));

const mockGetCategories = jest.fn();
const mockCreateDonation = jest.fn();
const mockCreateTransaction = jest.fn();

jest.mock('@modules/financial/church-finance/application/services/FinancialService', () => ({
  financialService: {
    getCategories: (...args: any[]) => mockGetCategories(...args),
    createDonation: (...args: any[]) => mockCreateDonation(...args),
    createTransaction: (...args: any[]) => mockCreateTransaction(...args),
  },
}));

describe('CreateDonationModal', () => {
  const categories = [
    { id: 'cat-1', name: 'Dizimos', icon: '$' },
  ] as any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCategories.mockResolvedValue(categories);
    mockCreateDonation.mockResolvedValue('id-1');
  });

  it('nao renderiza quando fechado', () => {
    const { container } = render(
      <CreateDonationModal
        isOpen={false}
        onClose={jest.fn()}
        onDonationCreated={jest.fn()}
        currentUser={{}}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('carrega categorias e valida campos obrigatorios', async () => {
    render(
      <CreateDonationModal
        isOpen
        onClose={jest.fn()}
        onDonationCreated={jest.fn()}
        currentUser={{}}
      />
    );

    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Doação' }));

    expect(screen.getByText('Valor deve ser maior que zero')).toBeInTheDocument();
    expect(screen.getByText('Nome do membro é obrigatório para doações não anônimas')).toBeInTheDocument();
  });

  it('cria doacao e reseta formulario', async () => {
    const onDonationCreated = jest.fn();
    const onClose = jest.fn();

    render(
      <CreateDonationModal
        isOpen
        onClose={onClose}
        onDonationCreated={onDonationCreated}
        currentUser={{ email: 'admin@test.com' }}
      />
    );

    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByPlaceholderText('Nome completo'), { target: { value: 'Maria' } });
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '50' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'cat-1' } });
    fireEvent.change(screen.getByPlaceholderText('Informações adicionais sobre a doação...'), { target: { value: 'Oferta especial' } });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Doação' }));

    await waitFor(() => {
      expect(mockCreateDonation).toHaveBeenCalledWith(
        expect.objectContaining({
          memberName: 'Maria',
          amount: 50,
          createdBy: 'admin@test.com',
        })
      );
      expect(onDonationCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('suporta doacao anonima e fallback para createTransaction', async () => {
    mockCreateDonation.mockReset();
    const service = {
      getCategories: mockGetCategories,
      createTransaction: mockCreateTransaction,
    };

    render(
      <CreateDonationModal
        isOpen
        onClose={jest.fn()}
        onDonationCreated={jest.fn()}
        currentUser={{}}
        service={service}
      />
    );

    await waitFor(() => {
      expect(mockGetCategories).toHaveBeenCalled();
    });

    fireEvent.click(screen.getByLabelText('Doação anônima'));
    fireEvent.change(screen.getByPlaceholderText('0,00'), { target: { value: '25' } });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Doação' }));

    await waitFor(() => {
      expect(mockCreateTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          memberName: 'Anônimo',
          type: 'INCOME',
        })
      );
    });
  });
});
