// Unit Tests - PendingApprovalPage
// Tests for the page shown to users waiting for admin approval

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PendingApprovalPage } from '../PendingApprovalPage';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn()
}));

describe('PendingApprovalPage', () => {
  const mockNavigate = jest.fn();
  const mockLogout = jest.fn();

  const mockUser = {
    id: '1',
    email: 'user@example.com',
    displayName: 'Test User',
    role: UserRole.Member,
    status: UserStatus.Pending,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const createMockAuthContext = (overrides: any = {}) => ({
    currentUser: overrides.currentUser !== undefined ? overrides.currentUser : mockUser,
    user: overrides.currentUser !== undefined ? overrides.currentUser : mockUser,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: overrides.logout || mockLogout,
    refreshUser: jest.fn(),
    canCreateContent: jest.fn().mockReturnValue(false),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn(),
    ...overrides
  });

  beforeEach(() => {
    jest.clearAllMocks();
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  const renderPendingApprovalPage = () => {
    return render(<PendingApprovalPage />);
  };

  describe('Rendering', () => {
    it('should render the pending approval message', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText('Aguardando Aprovacao')).toBeInTheDocument();
    });

    it('should render success message about account creation', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText('Sua conta foi criada com sucesso!')).toBeInTheDocument();
    });

    it('should display user name in greeting', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText('Ola, Test User!')).toBeInTheDocument();
    });

    it('should display user email', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
    });

    it('should display pending status badge', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText('Aguardando Aprovacao', { selector: 'span.inline-flex' })).toBeInTheDocument();
    });

    it('should render information about approval process', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText('O que acontece agora?')).toBeInTheDocument();
      expect(screen.getByText('Um administrador revisara sua solicitacao')).toBeInTheDocument();
      expect(screen.getByText('Voce sera notificado quando sua conta for aprovada')).toBeInTheDocument();
      expect(screen.getByText('Apos a aprovacao, voce tera acesso completo ao sistema')).toBeInTheDocument();
    });

    it('should render logout button', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText('Sair da Conta')).toBeInTheDocument();
    });

    it('should render help text', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      expect(screen.getByText(/Precisa de ajuda/)).toBeInTheDocument();
    });
  });

  describe('User Display', () => {
    it('should handle user without display name', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext({
        currentUser: { ...mockUser, displayName: undefined }
      }));

      renderPendingApprovalPage();

      expect(screen.getByText('Ola, !')).toBeInTheDocument();
    });

    it('should handle null user gracefully', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext({
        currentUser: null
      }));

      renderPendingApprovalPage();

      // Should still render the page structure
      expect(screen.getByText('Aguardando Aprovacao')).toBeInTheDocument();
    });
  });

  describe('Logout Functionality', () => {
    it('should call logout when button is clicked', async () => {
      mockLogout.mockResolvedValue(undefined);
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      const logoutButton = screen.getByText('Sair da Conta');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockLogout).toHaveBeenCalledTimes(1);
      });
    });

    it('should navigate to home after successful logout', async () => {
      mockLogout.mockResolvedValue(undefined);
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      const logoutButton = screen.getByText('Sair da Conta');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/');
      });
    });

    it('should handle logout error gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockLogout.mockRejectedValue(new Error('Logout failed'));
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      const logoutButton = screen.getByText('Sair da Conta');
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith('Error logging out:', expect.any(Error));
      });

      // Should not navigate on error
      expect(mockNavigate).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Aguardando Aprovacao');

      const h3Elements = screen.getAllByRole('heading', { level: 3 });
      expect(h3Elements.length).toBeGreaterThan(0);
    });

    it('should have accessible button', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      const button = screen.getByRole('button', { name: /Sair da Conta/i });
      expect(button).toBeInTheDocument();
    });

    it('should use semantic list for information items', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      const listItems = screen.getAllByRole('listitem');
      expect(listItems.length).toBeGreaterThan(0);
    });
  });

  describe('Visual Elements', () => {
    it('should render hourglass icon', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      // The hourglass is an emoji in a div with specific class
      const iconElement = document.querySelector('.text-6xl');
      expect(iconElement).toBeInTheDocument();
    });

    it('should render info icon in explanation section', () => {
      (useAuth as jest.Mock).mockReturnValue(createMockAuthContext());

      renderPendingApprovalPage();

      // Info box should exist
      const infoBox = document.querySelector('.bg-blue-50');
      expect(infoBox).toBeInTheDocument();
    });
  });
});
