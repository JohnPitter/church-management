// Unit Tests - LeadershipPage
// Tests for the public leadership page displaying church leaders

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { LeadershipPage } from '../LeadershipPage';
import { LeadershipService } from '@modules/content-management/leadership/application/services/LeadershipService';
import { Leader, LeaderRole, LeaderStatus } from '@modules/content-management/leadership/domain/entities/Leader';

// Mock the LeadershipService
jest.mock('@modules/content-management/leadership/application/services/LeadershipService');

describe('LeadershipPage', () => {
  const mockLeaders: Leader[] = [
    {
      id: '1',
      nome: 'Pastor Joao Silva',
      cargo: LeaderRole.Pastor,
      cargoPersonalizado: undefined,
      ministerio: 'Ministerio Geral',
      bio: 'Pastor titular com 20 anos de ministerio.',
      foto: 'https://example.com/photo1.jpg',
      email: 'pastor@igreja.com',
      telefone: '(11) 99999-1111',
      ordem: 1,
      status: LeaderStatus.Ativo,
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      criadoPor: 'admin'
    },
    {
      id: '2',
      nome: 'Maria Santos',
      cargo: LeaderRole.Lider,
      cargoPersonalizado: 'Lider de Louvor',
      ministerio: 'Ministerio de Louvor',
      bio: undefined,
      foto: undefined,
      email: 'maria@igreja.com',
      telefone: undefined,
      ordem: 2,
      status: LeaderStatus.Ativo,
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      criadoPor: 'admin'
    },
    {
      id: '3',
      nome: 'Pedro Oliveira',
      cargo: LeaderRole.Diacono,
      cargoPersonalizado: undefined,
      ministerio: undefined,
      bio: 'Diacono dedicado ao servico.',
      foto: 'https://example.com/photo3.jpg',
      email: undefined,
      telefone: '(11) 99999-3333',
      ordem: 3,
      status: LeaderStatus.Ativo,
      dataCadastro: new Date(),
      dataAtualizacao: new Date(),
      criadoPor: 'admin'
    }
  ];

  const mockGetActiveLeaders = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (LeadershipService as jest.Mock).mockImplementation(() => ({
      getActiveLeaders: mockGetActiveLeaders
    }));
  });

  describe('Loading State', () => {
    it('should show loading spinner while fetching leaders', () => {
      mockGetActiveLeaders.mockReturnValue(new Promise(() => {})); // Never resolves

      render(<LeadershipPage />);

      expect(screen.getByText('Carregando lideranca...')).toBeInTheDocument();
    });

    it('should show loading animation', () => {
      mockGetActiveLeaders.mockReturnValue(new Promise(() => {}));

      render(<LeadershipPage />);

      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Success State', () => {
    it('should render page header', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Nossa Lideranca', { exact: false })).toBeInTheDocument();
      });
    });

    it('should render page description', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText(/Conheca os lideres e pastores/)).toBeInTheDocument();
      });
    });

    it('should display all leaders when data is loaded', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Pastor Joao Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Oliveira')).toBeInTheDocument();
      });
    });

    it('should display leader roles correctly', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Pastor')).toBeInTheDocument();
        expect(screen.getByText('Lider de Louvor')).toBeInTheDocument(); // Custom role
        expect(screen.getByText('Diacono')).toBeInTheDocument();
      });
    });

    it('should display leader ministry when available', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText(/Ministerio Geral/)).toBeInTheDocument();
        expect(screen.getByText(/Ministerio de Louvor/)).toBeInTheDocument();
      });
    });

    it('should display leader bio when available', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText(/Pastor titular com 20 anos/)).toBeInTheDocument();
        expect(screen.getByText(/Diacono dedicado ao servico/)).toBeInTheDocument();
      });
    });

    it('should render leader photo when available', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        const images = screen.getAllByRole('img');
        expect(images.length).toBe(2); // Only 2 leaders have photos
      });
    });

    it('should render placeholder icon when photo is not available', async () => {
      mockGetActiveLeaders.mockResolvedValue([mockLeaders[1]]); // Leader without photo

      render(<LeadershipPage />);

      await waitFor(() => {
        const placeholder = screen.queryByAltText('Maria Santos');
        expect(placeholder).not.toBeInTheDocument();
      });
    });

    it('should render email link when email is available', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        const emailLinks = document.querySelectorAll('a[href^="mailto:"]');
        expect(emailLinks.length).toBe(2); // Two leaders have email
      });
    });

    it('should render phone link when phone is available', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        const phoneLinks = document.querySelectorAll('a[href^="tel:"]');
        expect(phoneLinks.length).toBe(2); // Two leaders have phone
      });
    });
  });

  describe('Empty State', () => {
    it('should show empty message when no leaders exist', async () => {
      mockGetActiveLeaders.mockResolvedValue([]);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum lider cadastrado')).toBeInTheDocument();
        expect(screen.getByText('Em breve voce conhecera nossa equipe pastoral.')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error gracefully and show empty state', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetActiveLeaders.mockRejectedValue(new Error('Network error'));

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum lider cadastrado')).toBeInTheDocument();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error loading leaders:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Custom Role Display', () => {
    it('should prefer custom role over default role label', async () => {
      const leaderWithCustomRole: Leader[] = [{
        id: '1',
        nome: 'Teste Leader',
        cargo: LeaderRole.Outro,
        cargoPersonalizado: 'Cargo Especial',
        ministerio: undefined,
        bio: undefined,
        foto: undefined,
        email: undefined,
        telefone: undefined,
        ordem: 1,
        status: LeaderStatus.Ativo,
        dataCadastro: new Date(),
        dataAtualizacao: new Date(),
        criadoPor: 'admin'
      }];
      mockGetActiveLeaders.mockResolvedValue(leaderWithCustomRole);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Cargo Especial')).toBeInTheDocument();
        expect(screen.queryByText('Outro')).not.toBeInTheDocument();
      });
    });

    it('should fall back to default role label when custom is not set', async () => {
      const leaderWithoutCustomRole: Leader[] = [{
        id: '1',
        nome: 'Teste Leader',
        cargo: LeaderRole.Evangelista,
        cargoPersonalizado: undefined,
        ministerio: undefined,
        bio: undefined,
        foto: undefined,
        email: undefined,
        telefone: undefined,
        ordem: 1,
        status: LeaderStatus.Ativo,
        dataCadastro: new Date(),
        dataAtualizacao: new Date(),
        criadoPor: 'admin'
      }];
      mockGetActiveLeaders.mockResolvedValue(leaderWithoutCustomRole);

      render(<LeadershipPage />);

      await waitFor(() => {
        expect(screen.getByText('Evangelista')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        const h1 = screen.getByRole('heading', { level: 1 });
        expect(h1).toBeInTheDocument();
      });
    });

    it('should have alt text on images', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        const image = screen.getByAltText('Pastor Joao Silva');
        expect(image).toBeInTheDocument();
      });
    });

    it('should have title attributes on contact links', async () => {
      mockGetActiveLeaders.mockResolvedValue(mockLeaders);

      render(<LeadershipPage />);

      await waitFor(() => {
        const emailLink = document.querySelector('a[title="Enviar email"]');
        const phoneLink = document.querySelector('a[title="Ligar"]');
        expect(emailLink).toBeInTheDocument();
        expect(phoneLink).toBeInTheDocument();
      });
    });
  });
});
