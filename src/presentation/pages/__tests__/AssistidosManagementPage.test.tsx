// Unit Tests - AssistidosManagementPage
// Comprehensive tests for assistidos (assisted persons) management page component

import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AssistidosManagementPage from '../AssistidosManagementPage';



// ============================================================================
// Mock Setup
// ============================================================================

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-1',
  email: 'admin@church.com',
  displayName: 'Admin User',
  photoURL: 'https://example.com/photo.jpg',
  role: 'admin',
  status: 'approved'
};

const mockAuthContext = {
  currentUser: mockCurrentUser,
  user: mockCurrentUser,
  loading: false,
  login: jest.fn(),
  register: jest.fn(),
  signInWithGoogle: jest.fn(),
  logout: jest.fn(),
  refreshUser: jest.fn(),
  canCreateContent: jest.fn().mockReturnValue(true),
  isProfessional: jest.fn().mockReturnValue(false),
  canAccessSystem: jest.fn().mockReturnValue(true),
  linkEmailPassword: jest.fn(),
  getSignInMethods: jest.fn()
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock SettingsContext
const mockSettings = {
  primaryColor: '#3B82F6',
  churchName: 'Test Church',
  id: 'settings-1',
  logoUrl: 'https://example.com/logo.png'
};

const mockSettingsContext = {
  settings: mockSettings,
  loading: false,
  updateSettings: jest.fn(),
  refreshSettings: jest.fn()
};

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockSettingsContext
}));

// Mock AssistidoService
const mockGetAllAssistidos = jest.fn().mockResolvedValue([]);
const mockGetStatistics = jest.fn().mockResolvedValue({
  totalAssistidos: 0,
  porStatus: {},
  porNecessidade: {},
  porTipoAtendimento: {},
  atendimentosPorMes: []
});
const mockCreateAssistido = jest.fn().mockResolvedValue({ id: 'new-1' });
const mockUpdateAssistido = jest.fn().mockResolvedValue({});
const mockDeleteAssistido = jest.fn().mockResolvedValue(undefined);
const mockAddAtendimento = jest.fn().mockResolvedValue(undefined);
const mockGetAssistidoById = jest.fn().mockResolvedValue(null);
const mockUpdateAssistidoStatus = jest.fn().mockResolvedValue(undefined);

jest.mock('@modules/assistance/assistidos/application/services/AssistidoService', () => {
  function AssistidoServiceMock(this: any) {
    this.getAllAssistidos = mockGetAllAssistidos;
    this.getStatistics = mockGetStatistics;
    this.createAssistido = mockCreateAssistido;
    this.updateAssistido = mockUpdateAssistido;
    this.deleteAssistido = mockDeleteAssistido;
    this.addAtendimento = mockAddAtendimento;
    this.getAssistidoById = mockGetAssistidoById;
    this.updateAssistidoStatus = mockUpdateAssistidoStatus;
  }
  return { AssistidoService: AssistidoServiceMock };
});

// Mock modal components
jest.mock('@modules/assistance/assistidos/presentation/components/AssistidoModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return <div data-testid="assistido-modal"><button onClick={onClose}>Close</button></div>;
  }
}));

jest.mock('../../components/AtendimentoModal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null;
    return <div data-testid="atendimento-modal"><button onClick={onClose}>Close</button></div>;
  }
}));

// ============================================================================
// Tests
// ============================================================================

describe('AssistidosManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllAssistidos.mockResolvedValue([]);
    mockGetStatistics.mockResolvedValue({
      totalAssistidos: 0,
      porStatus: {},
      porNecessidade: {},
      porTipoAtendimento: {},
      atendimentosPorMes: []
    });
  });

  it('should render the page title', async () => {
    render(<AssistidosManagementPage />);

    await waitFor(() => {
      expect(screen.getByText('Gerenciar Assistidos')).toBeInTheDocument();
    });
  });

  it('should load assistidos on mount', async () => {
    render(<AssistidosManagementPage />);

    await waitFor(() => {
      expect(mockGetAllAssistidos).toHaveBeenCalledTimes(1);
    });
  });

  it('should load statistics on mount', async () => {
    render(<AssistidosManagementPage />);

    await waitFor(() => {
      expect(mockGetStatistics).toHaveBeenCalled();
    });
  });
});