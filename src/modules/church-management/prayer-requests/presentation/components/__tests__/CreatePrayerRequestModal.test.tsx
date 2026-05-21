import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import CreatePrayerRequestModal from '../CreatePrayerRequestModal';

const mockValidate = jest.fn();
const mockSubmitPrayerRequest = jest.fn();

jest.mock('../../../domain/entities/PrayerRequest', () => ({
  PrayerRequestEntity: {
    validate: (...args: any[]) => mockValidate(...args),
  },
}));

jest.mock('@modules/church-management/prayer-requests/application/services/PrayerRequestService', () => ({
  PrayerRequestService: class {
    submitPrayerRequest = mockSubmitPrayerRequest;
  },
}));

describe('CreatePrayerRequestModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockValidate.mockReturnValue([]);
    mockSubmitPrayerRequest.mockResolvedValue({ success: true });
  });

  it('nao renderiza quando fechado', () => {
    const { container } = render(
      <CreatePrayerRequestModal isOpen={false} onClose={jest.fn()} onSuccess={jest.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('valida formulario e cria pedido com sucesso', async () => {
    const onClose = jest.fn();
    const onSuccess = jest.fn();

    render(<CreatePrayerRequestModal isOpen onClose={onClose} onSuccess={onSuccess} />);

    fireEvent.change(screen.getByPlaceholderText('Digite o nome completo'), {
      target: { value: 'Maria' },
    });
    fireEvent.change(screen.getByPlaceholderText('exemplo@email.com'), {
      target: { value: 'maria@test.com' },
    });
    fireEvent.change(screen.getByPlaceholderText('Descreva o pedido de oração...'), {
      target: { value: 'Preciso de oração pela minha familia.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Pedido' }));

    await waitFor(() => {
      expect(mockValidate).toHaveBeenCalled();
      expect(mockSubmitPrayerRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Maria',
          email: 'maria@test.com',
          request: 'Preciso de oração pela minha familia.',
        })
      );
      expect(onSuccess).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('mostra erro de validacao, suporta anonimato e trata falha do submit', async () => {
    mockValidate.mockReturnValueOnce(['Pedido inválido']);
    mockSubmitPrayerRequest.mockResolvedValueOnce({ success: false, message: 'Falhou' });
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    render(<CreatePrayerRequestModal isOpen onClose={jest.fn()} onSuccess={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Pedido' }));
    expect(screen.getByText('Pedido inválido')).toBeInTheDocument();

    mockValidate.mockReturnValue([]);
    fireEvent.click(screen.getByLabelText('Pedido anônimo'));
    expect(screen.queryByPlaceholderText('Digite o nome completo')).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Descreva o pedido de oração...'), {
      target: { value: 'Outro pedido válido.' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar Pedido' }));

    expect(await screen.findByText('Falhou')).toBeInTheDocument();

    mockSubmitPrayerRequest.mockRejectedValueOnce(new Error('boom'));
    fireEvent.click(screen.getByRole('button', { name: 'Criar Pedido' }));
    expect(await screen.findByText('Erro ao criar pedido de oração. Tente novamente.')).toBeInTheDocument();
  });
});
