import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';

const mockNavigate = jest.fn();
const mockUseNotifications = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/NotificationContext', () => ({
  useNotifications: () => mockUseNotifications(),
}));

jest.mock('../NotificationsList', () => ({
  NotificationsList: ({ onShowMore }: any) => (
    <div>
      <span>Lista de Notificacoes</span>
      <button onClick={onShowMore}>Show More</button>
    </div>
  ),
}));

describe('NotificationBell', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNotifications.mockReturnValue({ unreadCount: 3, loading: false });
  });

  it('renderiza badge de nao lidas e abre/fecha dropdown', async () => {
    render(<NotificationBell className="custom-class" />);

    const button = screen.getByRole('button', { name: 'Notificações' });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();

    fireEvent.click(button);
    expect(screen.getByText('Lista de Notificacoes')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByText('Lista de Notificacoes')).not.toBeInTheDocument();
    });
  });

  it('mostra loading, limita badge a 99+ e navega para notifications', async () => {
    mockUseNotifications.mockReturnValue({ unreadCount: 120, loading: true });
    const { rerender } = render(<NotificationBell />);

    expect(screen.getByText('99+')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notificações' })).toBeDisabled();

    mockUseNotifications.mockReturnValue({ unreadCount: 1, loading: false });
    rerender(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    fireEvent.click(screen.getByText('Show More'));

    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });

  it('fecha dropdown ao clicar fora e no botao de ver todas', async () => {
    render(<NotificationBell />);

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByText('Lista de Notificacoes')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Notificações' }));
    fireEvent.click(screen.getByText(/Ver todas as notificacoes/i));

    expect(mockNavigate).toHaveBeenCalledWith('/notifications');
  });
});
