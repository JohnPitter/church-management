import { fireEvent, render, screen } from '@testing-library/react';
import { CanvaHomeLayout } from '../CanvaHomeLayout';

const mockNavigate = jest.fn();
const mockUseAuth = jest.fn();
const mockUseSettings = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}));

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings(),
}));

jest.mock('date-fns', () => ({
  format: jest.fn((_date: Date, formatStr: string) =>
    formatStr === 'HH:mm:ss' ? '10:00:00' : 'segunda-feira, 10 de março de 2026'
  ),
}));

jest.mock('date-fns/locale', () => ({
  ptBR: {},
}));

describe('CanvaHomeLayout', () => {
  const sections = {
    hero: true,
    verseOfDay: true,
    quickActions: true,
    welcomeBanner: true,
    features: true,
    events: false,
    statistics: false,
    contact: false,
    testimonials: false,
    socialMedia: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: { churchName: 'Igreja Teste' },
    });
  });

  it('renderiza hero, versiculo e links de autenticacao quando usuario nao esta logado', () => {
    mockUseAuth.mockReturnValue({ currentUser: null });

    render(
      <CanvaHomeLayout
        sections={sections as any}
        currentTime={new Date('2026-03-10T10:00:00')}
        verseOfDay={{ text: 'Verso', reference: 'Jo 3:16' }}
      />
    );

    expect(screen.getByText(/Seja bem-vindo/)).toBeInTheDocument();
    expect(screen.getByText('"Verso"')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Entrar/i })).toHaveAttribute('href', '/login');
    expect(screen.getByRole('link', { name: /Criar Conta/i })).toHaveAttribute('href', '/register');
  });

  it('renderiza banner de boas-vindas e navega nas acoes rapidas e features', () => {
    mockUseAuth.mockReturnValue({ currentUser: { displayName: 'Maria', email: 'maria@test.com' } });

    render(
      <CanvaHomeLayout
        sections={sections as any}
        currentTime={new Date('2026-03-10T10:00:00')}
        verseOfDay={{ text: 'Verso', reference: 'Jo 3:16' }}
      />
    );

    expect(screen.getByText(/Olá, Maria/)).toBeInTheDocument();

    fireEvent.click(screen.getByText('Ao Vivo Agora'));
    fireEvent.click(screen.getByText('Próximos Eventos'));
    fireEvent.click(screen.getByText('Blog & Reflexões'));
    fireEvent.click(screen.getByText('Projetos'));
    fireEvent.click(screen.getByText('Perfil'));

    expect(mockNavigate.mock.calls.map(call => call[0])).toContain('/live');
    expect(mockNavigate.mock.calls.map(call => call[0])).toContain('/events');
    expect(mockNavigate.mock.calls.map(call => call[0])).toContain('/blog');
    expect(mockNavigate.mock.calls.map(call => call[0])).toContain('/projects');
    expect(mockNavigate.mock.calls.map(call => call[0])).toContain('/profile');
  });
});
