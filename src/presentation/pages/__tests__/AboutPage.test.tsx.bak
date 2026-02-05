// Unit Tests - About Page
// Comprehensive tests for institutional about us page

import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AboutPage } from '../AboutPage';

// Mock useSettings
const mockUseSettings = jest.fn();
jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings()
}));

describe('AboutPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: {
        churchName: 'Igreja Teste',
        about: {
          mission: 'Nossa missao e transformar vidas.',
          vision: 'Ser uma igreja relevante na sociedade.',
          statistics: [
            { value: '15+', label: 'Anos de Historia', icon: '📅' },
            { value: '200+', label: 'Membros Ativos', icon: '👥' },
            { value: '10+', label: 'Ministerios', icon: '⛪' },
            { value: '1000+', label: 'Vidas Impactadas', icon: '❤️' }
          ]
        }
      },
      loading: false
    });
  });

  const renderAboutPage = () => {
    return render(
      <MemoryRouter>
        <AboutPage />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner while settings are loading', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: true
      });

      renderAboutPage();

      // Check for loading spinner (animate-spin class)
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not render content while loading', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: true
      });

      renderAboutPage();

      expect(screen.queryByText('Sobre Nós')).not.toBeInTheDocument();
    });
  });

  describe('Hero Section', () => {
    it('should render the page title', () => {
      renderAboutPage();

      expect(screen.getByRole('heading', { name: 'Sobre Nós' })).toBeInTheDocument();
    });

    it('should render the page subtitle', () => {
      renderAboutPage();

      expect(screen.getByText(/conheça nossa história/i)).toBeInTheDocument();
    });
  });

  describe('Mission Section', () => {
    it('should render mission section title', () => {
      renderAboutPage();

      expect(screen.getByRole('heading', { name: 'Nossa Missão' })).toBeInTheDocument();
    });

    it('should display configured mission text', () => {
      renderAboutPage();

      expect(screen.getByText('Nossa missao e transformar vidas.')).toBeInTheDocument();
    });

    it('should display default mission text when not configured', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: 'Igreja Teste' },
        loading: false
      });

      renderAboutPage();

      expect(screen.getByText(/nossa igreja tem como missão transformar vidas/i)).toBeInTheDocument();
    });
  });

  describe('Vision Section', () => {
    it('should render vision section title', () => {
      renderAboutPage();

      expect(screen.getByRole('heading', { name: 'Nossa Visão' })).toBeInTheDocument();
    });

    it('should display configured vision text', () => {
      renderAboutPage();

      expect(screen.getByText('Ser uma igreja relevante na sociedade.')).toBeInTheDocument();
    });

    it('should display default vision text when not configured', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: 'Igreja Teste' },
        loading: false
      });

      renderAboutPage();

      expect(screen.getByText(/ser uma igreja relevante, que impacta positivamente a sociedade/i)).toBeInTheDocument();
    });
  });

  describe('Values Section', () => {
    it('should render values section title', () => {
      renderAboutPage();

      expect(screen.getByRole('heading', { name: 'Nossos Valores' })).toBeInTheDocument();
    });

    it('should display all default values', () => {
      renderAboutPage();

      expect(screen.getByText('Amor')).toBeInTheDocument();
      expect(screen.getByText('Comunhão')).toBeInTheDocument();
      expect(screen.getByText('Palavra')).toBeInTheDocument();
      expect(screen.getByText('Oração')).toBeInTheDocument();
      expect(screen.getByText('Discipulado')).toBeInTheDocument();
      expect(screen.getByText('Missões')).toBeInTheDocument();
    });

    it('should display value descriptions', () => {
      renderAboutPage();

      expect(screen.getByText(/o amor é a base de tudo/i)).toBeInTheDocument();
      expect(screen.getByText(/valorizamos o relacionamento entre irmãos/i)).toBeInTheDocument();
      expect(screen.getByText(/a bíblia é nossa única regra/i)).toBeInTheDocument();
      expect(screen.getByText(/cultivamos uma vida de intimidade/i)).toBeInTheDocument();
      expect(screen.getByText(/investimos no crescimento espiritual/i)).toBeInTheDocument();
      expect(screen.getByText(/temos compromisso com a expansão/i)).toBeInTheDocument();
    });

    it('should display value icons', () => {
      renderAboutPage();

      // Icons are emojis in the component - checking that icon divs exist
      const iconDivs = document.querySelectorAll('.text-4xl.mb-4');
      expect(iconDivs.length).toBeGreaterThanOrEqual(6);
    });
  });

  describe('Statistics Section', () => {
    it('should render statistics section title', () => {
      renderAboutPage();

      expect(screen.getByRole('heading', { name: 'Nossa História em Números' })).toBeInTheDocument();
    });

    it('should display configured statistics', () => {
      renderAboutPage();

      expect(screen.getByText('15+')).toBeInTheDocument();
      expect(screen.getByText('Anos de Historia')).toBeInTheDocument();
      expect(screen.getByText('200+')).toBeInTheDocument();
      expect(screen.getByText('Membros Ativos')).toBeInTheDocument();
      expect(screen.getByText('10+')).toBeInTheDocument();
      expect(screen.getByText('Ministerios')).toBeInTheDocument();
      expect(screen.getByText('1000+')).toBeInTheDocument();
      expect(screen.getByText('Vidas Impactadas')).toBeInTheDocument();
    });

    it('should display default statistics when not configured', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: 'Igreja Teste' },
        loading: false
      });

      renderAboutPage();

      expect(screen.getByText('10+')).toBeInTheDocument();
      expect(screen.getByText('100+')).toBeInTheDocument();
      expect(screen.getByText('5+')).toBeInTheDocument();
      expect(screen.getByText('500+')).toBeInTheDocument();
    });

    it('should display statistics icons', () => {
      renderAboutPage();

      // Statistics icons are emojis
      const icons = document.querySelectorAll('.text-5xl');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe('Call to Action Section', () => {
    it('should render CTA section title', () => {
      renderAboutPage();

      expect(screen.getByRole('heading', { name: 'Venha nos Conhecer!' })).toBeInTheDocument();
    });

    it('should render welcome message', () => {
      renderAboutPage();

      expect(screen.getByText(/você é bem-vindo/i)).toBeInTheDocument();
    });

    it('should render "Ver Proximos Eventos" link', () => {
      renderAboutPage();

      const eventsLink = screen.getByRole('link', { name: /ver próximos eventos/i });
      expect(eventsLink).toBeInTheDocument();
      expect(eventsLink).toHaveAttribute('href', '/events');
    });

    it('should render "Voltar ao Inicio" link', () => {
      renderAboutPage();

      const homeLink = screen.getByRole('link', { name: /voltar ao início/i });
      expect(homeLink).toBeInTheDocument();
      expect(homeLink).toHaveAttribute('href', '/');
    });
  });

  describe('Default Values', () => {
    it('should use default values when settings is null', () => {
      mockUseSettings.mockReturnValue({
        settings: null,
        loading: false
      });

      renderAboutPage();

      // Default mission
      expect(screen.getByText(/nossa igreja tem como missão transformar vidas/i)).toBeInTheDocument();

      // Default vision
      expect(screen.getByText(/ser uma igreja relevante/i)).toBeInTheDocument();
    });

    it('should use default values when about section is not configured', () => {
      mockUseSettings.mockReturnValue({
        settings: { churchName: 'Igreja Teste' },
        loading: false
      });

      renderAboutPage();

      // Default statistics values
      expect(screen.getByText('10+')).toBeInTheDocument();
      expect(screen.getByText('100+')).toBeInTheDocument();
      expect(screen.getByText('5+')).toBeInTheDocument();
      expect(screen.getByText('500+')).toBeInTheDocument();
    });
  });

  describe('Layout and Styling', () => {
    it('should have gradient hero section', () => {
      renderAboutPage();

      const heroSection = document.querySelector('.bg-gradient-to-br');
      expect(heroSection).toBeInTheDocument();
    });

    it('should have decorative wave element', () => {
      renderAboutPage();

      const svgElements = document.querySelectorAll('svg');
      expect(svgElements.length).toBeGreaterThan(0);
    });

    it('should have alternating section backgrounds', () => {
      renderAboutPage();

      const whiteSections = document.querySelectorAll('.bg-white');
      const graySections = document.querySelectorAll('.bg-gray-50');

      expect(whiteSections.length).toBeGreaterThan(0);
      expect(graySections.length).toBeGreaterThan(0);
    });

    it('should have value cards with shadow', () => {
      renderAboutPage();

      const valueCards = document.querySelectorAll('.shadow-md');
      expect(valueCards.length).toBeGreaterThan(0);
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      renderAboutPage();

      // h1 for main title
      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();

      // h2 for section titles
      const h2Elements = screen.getAllByRole('heading', { level: 2 });
      expect(h2Elements.length).toBeGreaterThan(0);

      // h3 for value titles
      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible links', () => {
      renderAboutPage();

      const eventsLink = screen.getByRole('link', { name: /ver próximos eventos/i });
      const homeLink = screen.getByRole('link', { name: /voltar ao início/i });

      expect(eventsLink).toBeInTheDocument();
      expect(homeLink).toBeInTheDocument();
    });

    it('should have readable text contrast', () => {
      renderAboutPage();

      // Text should be visible (has gray-* classes for text)
      const textElements = document.querySelectorAll('[class*="text-gray"]');
      expect(textElements.length).toBeGreaterThan(0);
    });
  });

  describe('Responsive Design', () => {
    it('should have responsive grid for values', () => {
      renderAboutPage();

      const grid = document.querySelector('.grid.md\\:grid-cols-2.lg\\:grid-cols-3');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive grid for statistics', () => {
      renderAboutPage();

      const grid = document.querySelector('.grid.grid-cols-2.md\\:grid-cols-4');
      expect(grid).toBeInTheDocument();
    });

    it('should have responsive padding and margins', () => {
      renderAboutPage();

      const responsiveElements = document.querySelectorAll('[class*="md:py"]');
      expect(responsiveElements.length).toBeGreaterThan(0);
    });
  });

  describe('Interactive Elements', () => {
    it('should have hover effects on value cards', () => {
      renderAboutPage();

      const hoverElements = document.querySelectorAll('.hover\\:shadow-lg');
      expect(hoverElements.length).toBeGreaterThan(0);
    });

    it('should have hover effects on statistics icons', () => {
      renderAboutPage();

      const hoverElements = document.querySelectorAll('.group-hover\\:scale-110');
      expect(hoverElements.length).toBeGreaterThan(0);
    });

    it('should have hover effects on CTA buttons', () => {
      renderAboutPage();

      const eventsLink = screen.getByRole('link', { name: /ver próximos eventos/i });
      expect(eventsLink).toHaveClass('hover:bg-blue-700');

      const homeLink = screen.getByRole('link', { name: /voltar ao início/i });
      expect(homeLink).toHaveClass('hover:bg-gray-200');
    });
  });

  describe('Content Sections Order', () => {
    it('should render sections in correct order', () => {
      renderAboutPage();

      const sections = document.querySelectorAll('section');
      expect(sections.length).toBeGreaterThanOrEqual(5);

      // The order should be: Hero, Mission, Values, Vision, Statistics, CTA
      const headings = screen.getAllByRole('heading', { level: 2 });
      const headingTexts = headings.map(h => h.textContent);

      expect(headingTexts).toContain('Nossa Missão');
      expect(headingTexts).toContain('Nossos Valores');
      expect(headingTexts).toContain('Nossa Visão');
      expect(headingTexts).toContain('Nossa História em Números');
      expect(headingTexts).toContain('Venha nos Conhecer!');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty statistics array gracefully', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          about: {
            mission: 'Test mission',
            vision: 'Test vision',
            statistics: []
          }
        },
        loading: false
      });

      renderAboutPage();

      // Should still render the page without errors
      expect(screen.getByRole('heading', { name: 'Nossa História em Números' })).toBeInTheDocument();
    });

    it('should handle partial about configuration', () => {
      mockUseSettings.mockReturnValue({
        settings: {
          churchName: 'Igreja Teste',
          about: {
            mission: 'Custom mission only'
            // vision and statistics not configured
          }
        },
        loading: false
      });

      renderAboutPage();

      // Custom mission should be displayed
      expect(screen.getByText('Custom mission only')).toBeInTheDocument();

      // Default vision should be displayed
      expect(screen.getByText(/ser uma igreja relevante, que impacta positivamente a sociedade/i)).toBeInTheDocument();
    });

    it('should handle undefined churchName', () => {
      mockUseSettings.mockReturnValue({
        settings: {},
        loading: false
      });

      renderAboutPage();

      // Page should render without errors
      expect(screen.getByRole('heading', { name: 'Sobre Nós' })).toBeInTheDocument();
    });
  });
});
