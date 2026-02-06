// Unit Tests - EnterpriseHomeLayout Component
// Comprehensive tests for Enterprise design home layout

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { EnterpriseHomeLayout } from '../EnterpriseHomeLayout';
import { HomeSectionVisibility } from '@modules/content-management/home-settings/domain/entities/HomeSettings';
import { BibleVerse } from '@/data/verses';

// Mock contexts
const mockUseAuth = jest.fn();
const mockUseSettings = jest.fn();
const mockNavigate = jest.fn();

jest.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

jest.mock('../../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

jest.mock('date-fns/locale', () => ({
  ptBR: {}
}));

jest.mock('date-fns', () => ({
  format: () => 'sábado, 15 de junho de 2024'
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: function({ children, to, className }: any) { return (
    <a href={to} className={className} data-testid={`link-${to}`}>
      {children}
    </a>
  ); }
}));

describe('EnterpriseHomeLayout Component', () => {
  const defaultSections: HomeSectionVisibility = {
    hero: true,
    verseOfDay: true,
    quickActions: true,
    welcomeBanner: true,
    features: true,
    events: true,
    statistics: true,
    contact: true,
    testimonials: true,
    socialMedia: true
  };

  const defaultVerseOfDay: BibleVerse = {
    text: 'Porque Deus tanto amou o mundo que deu o seu Filho Unigenito.',
    reference: 'Joao 3:16'
  };

  const defaultCurrentTime = new Date('2024-06-15T10:00:00');

  const defaultAuthValue = {
    currentUser: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    user: {
      id: 'user-1',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
    refreshUser: jest.fn(),
    canCreateContent: jest.fn().mockReturnValue(false),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn()
  };

  const defaultSettingsValue = {
    settings: {
      churchName: 'Test Church',
      churchAddress: '123 Church Street, City, State'
    },
    loading: false
  };

  const renderComponent = (props: Partial<{
    sections: HomeSectionVisibility;
    currentTime: Date;
    verseOfDay: BibleVerse;
  }> = {}) => {
    return render(
      <MemoryRouter>
        <EnterpriseHomeLayout
          sections={props.sections || defaultSections}
          currentTime={props.currentTime || defaultCurrentTime}
          verseOfDay={props.verseOfDay || defaultVerseOfDay}
        />
      </MemoryRouter>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue(defaultAuthValue);
    mockUseSettings.mockReturnValue(defaultSettingsValue);
    // Mock window.open
    window.open = jest.fn();
  });

  describe('Hero Section', () => {
    it('should render hero section when enabled', () => {
      renderComponent();

      expect(screen.getByText('SEJA BEM-VINDO')).toBeInTheDocument();
      expect(screen.getByText('Test Church')).toBeInTheDocument();
    });

    it('should display formatted date', () => {
      renderComponent();

      // Check for date elements (Portuguese format)
      expect(screen.getByText((content) =>
        content.includes('junho') || content.includes('2024')
      )).toBeInTheDocument();
    });

    it('should display default church name when not set', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: null },
        loading: false
      });

      renderComponent();

      expect(screen.getByText('NOSSA IGREJA')).toBeInTheDocument();
    });

    it('should not render hero section when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, hero: false }
      });

      expect(screen.queryByText('SEJA BEM-VINDO')).not.toBeInTheDocument();
    });

    it('should navigate to events on button click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Conheça nossos eventos'));

      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });

    it('should navigate to about on button click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Sobre nós'));

      expect(mockNavigate).toHaveBeenCalledWith('/about');
    });

    describe('Login/Register Buttons', () => {
      it('should show login/register buttons when user is not authenticated', () => {
        mockUseAuth.mockReturnValue({ currentUser: null });

        renderComponent();

        expect(screen.getByTestId('link-/login')).toBeInTheDocument();
        expect(screen.getByTestId('link-/register')).toBeInTheDocument();
      });

      it('should hide login/register buttons when user is authenticated', () => {
        renderComponent();

        expect(screen.queryByTestId('link-/login')).not.toBeInTheDocument();
        expect(screen.queryByTestId('link-/register')).not.toBeInTheDocument();
      });
    });
  });

  describe('Statistics Section', () => {
    it('should render statistics section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Nossa Comunidade em Números')).toBeInTheDocument();
      expect(screen.getByText('Impacto real através da fé')).toBeInTheDocument();
    });

    it('should display statistics cards', () => {
      renderComponent();

      expect(screen.getByText('2.500+')).toBeInTheDocument();
      expect(screen.getByText('Membros Ativos')).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
      expect(screen.getAllByText('Projetos Sociais').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('38+')).toBeInTheDocument();
      expect(screen.getByText('Anos de História')).toBeInTheDocument();
      expect(screen.getByText('10k+')).toBeInTheDocument();
      expect(screen.getByText('Vidas Transformadas')).toBeInTheDocument();
    });

    it('should not render statistics section when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, statistics: false }
      });

      expect(screen.queryByText('Nossa Comunidade em Números')).not.toBeInTheDocument();
    });
  });

  describe('Verse of Day Section', () => {
    it('should render verse of day section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Palavra do Dia')).toBeInTheDocument();
      expect(screen.getByText((content) =>
        content.includes('Porque Deus tanto amou')
      )).toBeInTheDocument();
      expect(screen.getByText('Joao 3:16')).toBeInTheDocument();
    });

    it('should not render verse of day when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, verseOfDay: false }
      });

      expect(screen.queryByText('Palavra do Dia')).not.toBeInTheDocument();
    });

    it('should display custom verse', () => {
      const customVerse: BibleVerse = {
        text: 'O Senhor e o meu pastor; nada me faltara.',
        reference: 'Salmos 23:1'
      };

      renderComponent({ verseOfDay: customVerse });

      expect(screen.getByText((content) =>
        content.includes('O Senhor e o meu pastor')
      )).toBeInTheDocument();
      expect(screen.getByText('Salmos 23:1')).toBeInTheDocument();
    });
  });

  describe('Welcome Banner Section', () => {
    it('should render welcome banner for authenticated user when enabled', () => {
      renderComponent();

      expect(screen.getByText((content) =>
        content.includes('Olá, Test User')
      )).toBeInTheDocument();
      expect(screen.getByText((content) =>
        content.includes('É ótimo ter você de volta')
      )).toBeInTheDocument();
    });

    it('should not render welcome banner when user is not authenticated', () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      renderComponent();

      expect(screen.queryByText((content) =>
        content.includes('Olá, Test User')
      )).not.toBeInTheDocument();
    });

    it('should not render welcome banner when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, welcomeBanner: false }
      });

      expect(screen.queryByText((content) =>
        content.includes('É ótimo ter você de volta')
      )).not.toBeInTheDocument();
    });

    it('should display email when displayName is not set', () => {
      mockUseAuth.mockReturnValue({
        currentUser: {
          id: 'user-1',
          email: 'test@example.com',
          displayName: null
        }
      });

      renderComponent();

      expect(screen.getByText((content) =>
        content.includes('Olá, test@example.com')
      )).toBeInTheDocument();
    });

    it('should navigate to painel on button click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Acessar Painel'));

      expect(mockNavigate).toHaveBeenCalledWith('/painel');
    });
  });

  describe('Features/Services Section', () => {
    it('should render features section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Serviços e Recursos')).toBeInTheDocument();
      expect(screen.getByText('Tudo o que você precisa para crescer espiritualmente e se conectar com a comunidade')).toBeInTheDocument();
    });

    it('should display all service cards', () => {
      renderComponent();

      expect(screen.getByText('Agenda de Eventos')).toBeInTheDocument();
      expect(screen.getByText('Mensagens e Blog')).toBeInTheDocument();
      expect(screen.getByText('Transmissões Online')).toBeInTheDocument();
      expect(screen.getAllByText('Projetos Sociais').length).toBeGreaterThanOrEqual(1);
      expect(screen.getByText('Devocionais Diários')).toBeInTheDocument();
      expect(screen.getByText('Aniversariantes')).toBeInTheDocument();
      expect(screen.getByText('Nossa Liderança')).toBeInTheDocument();
      expect(screen.getByText('Membros')).toBeInTheDocument();
    });

    it('should navigate on service card click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Agenda de Eventos'));

      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });

    it('should not render features section when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, features: false }
      });

      expect(screen.queryByText('Serviços e Recursos')).not.toBeInTheDocument();
    });
  });

  describe('Quick Actions Section', () => {
    it('should render quick actions section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Ações Rápidas')).toBeInTheDocument();
    });

    it('should display action buttons', () => {
      renderComponent();

      expect(screen.getByText('Fazer Doação')).toBeInTheDocument();
      expect(screen.getByText('Oração')).toBeInTheDocument();
      expect(screen.getByText('Fale Conosco')).toBeInTheDocument();
    });

    it('should navigate on action button click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Fazer Doação'));

      expect(mockNavigate).toHaveBeenCalledWith('/donate');
    });

    it('should not render quick actions when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, quickActions: false }
      });

      expect(screen.queryByText('Ações Rápidas')).not.toBeInTheDocument();
    });
  });

  describe('Events Section', () => {
    it('should render events section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Próximos Eventos')).toBeInTheDocument();
      expect(screen.getByText('Não perca os momentos especiais da nossa comunidade')).toBeInTheDocument();
    });

    it('should navigate to events on button click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Ver Calendário Completo'));

      expect(mockNavigate).toHaveBeenCalledWith('/events');
    });

    it('should not render events section when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, events: false }
      });

      expect(screen.queryByText('Próximos Eventos')).not.toBeInTheDocument();
    });
  });

  describe('Testimonials Section', () => {
    it('should render testimonials section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Histórias que Inspiram')).toBeInTheDocument();
    });

    it('should display testimonial cards', () => {
      renderComponent();

      expect(screen.getByText((content) =>
        content.includes('Esta comunidade transformou minha vida')
      )).toBeInTheDocument();
      expect(screen.getByText('— Maria Silva')).toBeInTheDocument();
      expect(screen.getByText((content) =>
        content.includes('Os projetos sociais me deram propósito')
      )).toBeInTheDocument();
      expect(screen.getByText('— João Santos')).toBeInTheDocument();
    });

    it('should not render testimonials when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, testimonials: false }
      });

      expect(screen.queryByText('Histórias que Inspiram')).not.toBeInTheDocument();
    });
  });

  describe('Contact Section', () => {
    it('should render contact section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Vamos Conversar')).toBeInTheDocument();
      expect(screen.getByText('Tire suas dúvidas, conheça mais sobre nós ou simplesmente diga olá')).toBeInTheDocument();
    });

    it('should navigate to contact on message button click', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Enviar Mensagem'));

      expect(mockNavigate).toHaveBeenCalledWith('/contact');
    });

    it('should open Google Maps when address is available', () => {
      renderComponent();

      fireEvent.click(screen.getByText('Nossa Localização'));

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining('google.com/maps'),
        '_blank'
      );
    });

    it('should navigate to contact when no address is available', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: 'Test Church', churchAddress: null },
        loading: false
      });

      renderComponent();

      fireEvent.click(screen.getByText('Nossa Localização'));

      expect(mockNavigate).toHaveBeenCalledWith('/contact');
    });

    it('should not render contact section when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, contact: false }
      });

      expect(screen.queryByText('Vamos Conversar')).not.toBeInTheDocument();
    });
  });

  describe('Social Media Section', () => {
    it('should render social media section when enabled', () => {
      renderComponent();

      expect(screen.getByText('Siga-nos nas Redes Sociais')).toBeInTheDocument();
    });

    it('should display social media cards', () => {
      renderComponent();

      expect(screen.getByText('Instagram')).toBeInTheDocument();
      expect(screen.getByText('Facebook')).toBeInTheDocument();
      expect(screen.getByText('YouTube')).toBeInTheDocument();
      expect(screen.getByText('X (Twitter)')).toBeInTheDocument();
    });

    it('should not render social media section when disabled', () => {
      renderComponent({
        sections: { ...defaultSections, socialMedia: false }
      });

      expect(screen.queryByText('Siga-nos nas Redes Sociais')).not.toBeInTheDocument();
    });
  });

  describe('All Sections Disabled', () => {
    it('should render empty container when all sections disabled', () => {
      const allDisabled: HomeSectionVisibility = {
        hero: false,
        verseOfDay: false,
        quickActions: false,
        welcomeBanner: false,
        features: false,
        events: false,
        statistics: false,
        contact: false,
        testimonials: false,
        socialMedia: false
      };

      const { container } = renderComponent({ sections: allDisabled });

      // Should have the main container but no sections
      expect(container.querySelector('.min-h-screen')).toBeInTheDocument();
    });
  });

  describe('Settings Integration', () => {
    it('should use church name from settings', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: 'Custom Church Name' },
        loading: false
      });

      renderComponent();

      expect(screen.getByText('Custom Church Name')).toBeInTheDocument();
    });

    it('should handle undefined settings gracefully', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: false
      });

      renderComponent();

      // Should render with fallback values
      expect(screen.getByText('NOSSA IGREJA')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render responsive grid classes', () => {
      const { container } = renderComponent();

      // Check for responsive grid classes
      expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();
      expect(container.querySelector('.md\\:grid-cols-2') || container.querySelector('[class*="md:grid-cols"]')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderComponent();

      // Check for h1
      const h1Elements = screen.getAllByRole('heading', { level: 1 });
      expect(h1Elements.length).toBeGreaterThan(0);

      // Check for h2
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);
    });

    it('should have proper button roles', () => {
      renderComponent();

      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });
});
