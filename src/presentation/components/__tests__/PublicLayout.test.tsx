import { fireEvent, render, screen } from '@testing-library/react';
import { PublicLayout } from '../PublicLayout';

const mockNavigate = jest.fn();
const mockUseSettings = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings(),
}));

describe('PublicLayout', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renderiza header, children e footer com dados das configuracoes', () => {
    mockUseSettings.mockReturnValue({
      settings: {
        churchName: 'Igreja Teste',
        churchTagline: 'Conectados',
        primaryColor: '#123456',
      },
    });

    render(
      <PublicLayout>
        <div>Conteudo Publico</div>
      </PublicLayout>
    );

    expect(screen.getAllByText('Igreja Teste').length).toBeGreaterThan(0);
    expect(screen.getByText('Conteudo Publico')).toBeInTheDocument();
    expect(screen.getByText('Conectados')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveStyle({ backgroundColor: '#123456' });
  });

  it('usa fallbacks e navega pelos botoes', () => {
    mockUseSettings.mockReturnValue({ settings: undefined });

    render(
      <PublicLayout>
        <div>Conteudo</div>
      </PublicLayout>
    );

    fireEvent.click(screen.getByRole('button', { name: /Igreja/i }));
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }));
    fireEvent.click(screen.getByRole('button', { name: 'Início' }));
    fireEvent.click(screen.getByRole('button', { name: 'Transmissões' }));
    fireEvent.click(screen.getByRole('button', { name: 'Blog' }));
    fireEvent.click(screen.getByRole('button', { name: 'Eventos' }));

    expect(screen.getAllByText('Igreja').length).toBeGreaterThan(0);
    expect(screen.getByText('Conectados pela fé')).toBeInTheDocument();
    expect(mockNavigate.mock.calls.map(call => call[0])).toEqual([
      '/',
      '/login',
      '/',
      '/live',
      '/blog',
      '/events',
    ]);
  });

  it('cria icone fallback quando a logo falha', () => {
    mockUseSettings.mockReturnValue({
      settings: {
        churchName: 'Igreja Logo',
        logoURL: 'https://example.com/logo.png',
      },
    });

    render(
      <PublicLayout>
        <div>Conteudo</div>
      </PublicLayout>
    );

    fireEvent.error(screen.getByRole('img', { name: 'Igreja Logo' }));

    expect(document.querySelector('.fallback-icon')).not.toBeNull();
  });
});
