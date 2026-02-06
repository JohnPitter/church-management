// Unit Tests - Welcome Page
// Comprehensive tests for post-setup welcome page

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import WelcomePage from '../WelcomePage';

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

describe('WelcomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderWelcomePage = () => {
    return render(
      <MemoryRouter>
        <WelcomePage />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render welcome message', () => {
      renderWelcomePage();

      expect(screen.getByRole('heading', { name: /bem-vindo/i })).toBeInTheDocument();
    });

    it('should render success description', () => {
      renderWelcomePage();

      expect(screen.getByText(/sistema de gerenciamento da igreja foi configurado com sucesso/i)).toBeInTheDocument();
    });

    it('should render success icon (checkmark)', () => {
      renderWelcomePage();

      // The SVG checkmark icon is present in the component
      const iconContainer = document.querySelector('.bg-green-100');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render "O que foi configurado" section', () => {
      renderWelcomePage();

      expect(screen.getByText(/o que foi configurado/i)).toBeInTheDocument();
    });

    it('should list all configured items', () => {
      renderWelcomePage();

      expect(screen.getByText('Primeiro administrador criado')).toBeInTheDocument();
      expect(screen.getByText('Sistema inicializado')).toBeInTheDocument();
      expect(screen.getByText('Permissões configuradas')).toBeInTheDocument();
      expect(screen.getByText('Firebase integrado')).toBeInTheDocument();
    });

    it('should render "Proximos passos" section', () => {
      renderWelcomePage();

      expect(screen.getByText(/próximos passos/i)).toBeInTheDocument();
    });

    it('should list all next steps', () => {
      renderWelcomePage();

      expect(screen.getByText(/acesse o painel administrativo/i)).toBeInTheDocument();
      expect(screen.getByText(/configure informações básicas/i)).toBeInTheDocument();
      expect(screen.getByText(/crie eventos, posts do blog e transmissões/i)).toBeInTheDocument();
      expect(screen.getByText(/configure o google auth/i)).toBeInTheDocument();
    });

    it('should render "Ir para Painel Administrativo" button', () => {
      renderWelcomePage();

      expect(screen.getByRole('button', { name: /ir para painel administrativo/i })).toBeInTheDocument();
    });

    it('should render "Ver Site da Igreja" button', () => {
      renderWelcomePage();

      expect(screen.getByRole('button', { name: /ver site da igreja/i })).toBeInTheDocument();
    });

    it('should render footer message', () => {
      renderWelcomePage();

      expect(screen.getByText(/sistema de gerenciamento de igreja.*configuração concluída/i)).toBeInTheDocument();
    });
  });

  describe('Navigation', () => {
    it('should navigate to /admin when "Ir para Painel Administrativo" button is clicked', async () => {
      renderWelcomePage();

      const adminButton = screen.getByRole('button', { name: /ir para painel administrativo/i });
      await userEvent.click(adminButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should navigate to / when "Ver Site da Igreja" button is clicked', async () => {
      renderWelcomePage();

      const homeButton = screen.getByRole('button', { name: /ver site da igreja/i });
      await userEvent.click(homeButton);

      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  describe('Button Styling', () => {
    it('should have primary styling for admin panel button', () => {
      renderWelcomePage();

      const adminButton = screen.getByRole('button', { name: /ir para painel administrativo/i });
      expect(adminButton).toHaveClass('bg-blue-600');
    });

    it('should have secondary styling for home button', () => {
      renderWelcomePage();

      const homeButton = screen.getByRole('button', { name: /ver site da igreja/i });
      expect(homeButton).toHaveClass('border-gray-300');
    });
  });

  describe('Layout', () => {
    it('should have a card-like container', () => {
      renderWelcomePage();

      const container = document.querySelector('.bg-white.rounded-lg.shadow-xl');
      expect(container).toBeInTheDocument();
    });

    it('should have centered content', () => {
      renderWelcomePage();

      const wrapper = document.querySelector('.text-center');
      expect(wrapper).toBeInTheDocument();
    });
  });

  describe('Configuration Status Indicators', () => {
    it('should display green status indicators for all configured items', () => {
      renderWelcomePage();

      const greenDots = document.querySelectorAll('.bg-green-500');
      expect(greenDots.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('Accessibility', () => {
    it('should have accessible button names', () => {
      renderWelcomePage();

      expect(screen.getByRole('button', { name: /ir para painel administrativo/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /ver site da igreja/i })).toBeInTheDocument();
    });

    it('should have semantic heading structure', () => {
      renderWelcomePage();

      const mainHeading = screen.getByRole('heading', { level: 1 });
      expect(mainHeading).toBeInTheDocument();
    });
  });
});
