// Unit Tests - ONG Settings Page
// Comprehensive tests for ONG settings management and permissions

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ONGSettingsPage from '../ONGSettingsPage';
import { ONGInfo, ONGEntity } from '@modules/ong-management/settings/domain/entities/ONG';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock AuthContext
let mockCurrentUser: any = {
  id: 'user-123',
  email: 'admin@test.com',
  displayName: 'Test Admin',
  role: 'admin',
  status: 'approved'
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
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
  })
}));

// Mock usePermissions
let mockHasPermission = jest.fn();

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission
  })
}));

// Mock FirebaseONGRepository
const mockGetONGInfo = jest.fn();
const mockUpdateONGInfo = jest.fn();
const mockUploadONGLogo = jest.fn();

jest.mock('@modules/ong-management/settings/infrastructure/repositories/FirebaseONGRepository', () => {
  function FirebaseONGRepositoryMock(this: any) {
    this.getONGInfo = mockGetONGInfo;
    this.updateONGInfo = mockUpdateONGInfo;
    this.uploadONGLogo = mockUploadONGLogo;
  }

  return {
    FirebaseONGRepository: FirebaseONGRepositoryMock
  };
});

// Mock window.alert and window.history
const mockAlert = jest.fn();
const mockHistoryBack = jest.fn();

beforeAll(() => {
  window.alert = mockAlert;
  Object.defineProperty(window, 'history', {
    value: { back: mockHistoryBack },
    writable: true
  });
});

// Helper to create mock ONG info
const createMockONGInfo = (overrides: Partial<ONGInfo> = {}): ONGInfo => ({
  id: 'ong-1',
  nome: 'Test ONG',
  descricao: 'Test Description',
  logo: 'https://example.com/logo.png',
  missao: 'Test Mission',
  visao: 'Test Vision',
  valores: ['Value 1', 'Value 2'],
  endereco: {
    logradouro: 'Test Street',
    numero: '123',
    complemento: 'Suite 1',
    bairro: 'Test Neighborhood',
    cidade: 'Test City',
    estado: 'SP',
    cep: '01234567',
    pais: 'Brasil'
  },
  contato: {
    telefone: '11999999999',
    telefone2: '11888888888',
    email: 'ong@test.com',
    emailContato: 'contact@test.com',
    website: 'https://test.org'
  },
  redesSociais: {
    facebook: 'https://facebook.com/testong',
    instagram: 'https://instagram.com/testong',
    twitter: 'https://twitter.com/testong',
    linkedin: 'https://linkedin.com/company/testong',
    youtube: 'https://youtube.com/testong',
    whatsapp: '11999999999'
  },
  dataCriacao: new Date(),
  cnpj: '12345678000195',
  registroONG: 'REG123456',
  areasAtuacao: ['Education', 'Health'],
  updatedAt: new Date(),
  updatedBy: 'admin@test.com',
  ...overrides
});

describe('ONGSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCurrentUser = {
      id: 'user-123',
      email: 'admin@test.com',
      displayName: 'Test Admin',
      role: 'admin',
      status: 'approved'
    };
    mockHasPermission.mockReturnValue(true);
    mockGetONGInfo.mockResolvedValue(null);
  });

  describe('Permission Checks', () => {
    it('should show access denied when user lacks ONG management permission', async () => {
      mockHasPermission.mockReturnValue(false);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
        expect(screen.getByText(/Voce precisa ser um administrador aprovado/)).toBeInTheDocument();
      });
    });

    it('should show access denied when user status is not approved', async () => {
      mockCurrentUser = { ...mockCurrentUser, status: 'pending' };
      mockHasPermission.mockReturnValue(true);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Acesso Restrito')).toBeInTheDocument();
      });
    });

    it('should display debug information in access denied view', async () => {
      mockHasPermission.mockReturnValue(false);
      mockCurrentUser = {
        ...mockCurrentUser,
        displayName: 'Test User',
        role: 'member',
        status: 'pending'
      };

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText(/Usuario:/)).toBeInTheDocument();
        expect(screen.getByText(/Role:/)).toBeInTheDocument();
        expect(screen.getByText(/Status:/)).toBeInTheDocument();
        expect(screen.getByText(/Pode Gerenciar ONG:/)).toBeInTheDocument();
      });
    });

    it('should have back button in access denied view', async () => {
      mockHasPermission.mockReturnValue(false);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const backButton = screen.getByText('Voltar');
        fireEvent.click(backButton);
        expect(mockHistoryBack).toHaveBeenCalled();
      });
    });

    it('should render settings page when user has permission', async () => {
      mockHasPermission.mockReturnValue(true);
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Configuracoes da ONG')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('should show loading indicator while fetching ONG info', async () => {
      mockGetONGInfo.mockImplementation(() => new Promise(() => {}));

      render(<ONGSettingsPage />);

      expect(screen.getByText('Carregando configuracoes...')).toBeInTheDocument();
    });

    it('should hide loading after ONG info is fetched', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.queryByText('Carregando configuracoes...')).not.toBeInTheDocument();
        expect(screen.getByText('Configuracoes da ONG')).toBeInTheDocument();
      });
    });
  });

  describe('Tabs Navigation', () => {
    it('should render all tabs', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Informacoes Basicas')).toBeInTheDocument();
        expect(screen.getByText('Contato')).toBeInTheDocument();
        expect(screen.getByText('Endereco')).toBeInTheDocument();
        expect(screen.getByText('Redes Sociais')).toBeInTheDocument();
        expect(screen.getByText('Missao e Valores')).toBeInTheDocument();
      });
    });

    it('should switch between tabs when clicked', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Nome da ONG *')).toBeInTheDocument();
      });

      // Switch to Contact tab
      fireEvent.click(screen.getByText('Contato'));

      await waitFor(() => {
        expect(screen.getByText('Email Principal *')).toBeInTheDocument();
      });

      // Switch to Address tab
      fireEvent.click(screen.getByText('Endereco'));

      await waitFor(() => {
        expect(screen.getByText('CEP')).toBeInTheDocument();
        expect(screen.getByText('Logradouro')).toBeInTheDocument();
      });

      // Switch to Social Media tab
      fireEvent.click(screen.getByText('Redes Sociais'));

      await waitFor(() => {
        expect(screen.getByText(/Facebook/)).toBeInTheDocument();
        expect(screen.getByText(/Instagram/)).toBeInTheDocument();
      });

      // Switch to Mission and Values tab
      fireEvent.click(screen.getByText('Missao e Valores'));

      await waitFor(() => {
        expect(screen.getByText(/Missao/)).toBeInTheDocument();
        expect(screen.getByText(/Visao/)).toBeInTheDocument();
        expect(screen.getByText(/Valores/)).toBeInTheDocument();
      });
    });
  });

  describe('Basic Info Tab', () => {
    it('should display ONG basic info form', async () => {
      const ongInfo = createMockONGInfo({ nome: 'My ONG', cnpj: '12345678000195' });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByDisplayValue('My ONG')).toBeInTheDocument();
        expect(screen.getByDisplayValue('12345678000195')).toBeInTheDocument();
      });
    });

    it('should display logo preview if available', async () => {
      const ongInfo = createMockONGInfo({ logo: 'https://example.com/logo.png' });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const logoImage = document.querySelector('img[alt="Logo Preview"]');
        expect(logoImage).toBeInTheDocument();
        expect(logoImage).toHaveAttribute('src', 'https://example.com/logo.png');
      });
    });

    it('should handle logo file upload', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        expect(fileInput).toBeInTheDocument();
      });
    });

    it('should reject logo files larger than 5MB', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.png', { type: 'image/png' });

        if (fileInput) {
          fireEvent.change(fileInput, { target: { files: [largeFile] } });
        }
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('5MB'));
      });
    });
  });

  describe('Contact Tab', () => {
    it('should display contact info form', async () => {
      const ongInfo = createMockONGInfo({
        contato: {
          email: 'contact@ong.org',
          telefone: '11999999999',
          website: 'https://ong.org'
        }
      });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Contato'));
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('contact@ong.org')).toBeInTheDocument();
        expect(screen.getByDisplayValue('11999999999')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://ong.org')).toBeInTheDocument();
      });
    });
  });

  describe('Address Tab', () => {
    it('should display address form', async () => {
      const ongInfo = createMockONGInfo({
        endereco: {
          logradouro: 'Main Street',
          numero: '456',
          bairro: 'Downtown',
          cidade: 'Sao Paulo',
          estado: 'SP',
          cep: '01234567',
          pais: 'Brasil'
        }
      });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Endereco'));
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Main Street')).toBeInTheDocument();
        expect(screen.getByDisplayValue('456')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Downtown')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Sao Paulo')).toBeInTheDocument();
      });
    });

    it('should display state dropdown options', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Endereco'));
      });

      await waitFor(() => {
        const stateSelect = screen.getByRole('combobox');
        expect(stateSelect).toBeInTheDocument();

        // Check some state options exist
        expect(screen.getByText('Sao Paulo')).toBeInTheDocument();
        expect(screen.getByText('Rio de Janeiro')).toBeInTheDocument();
      });
    });
  });

  describe('Social Media Tab', () => {
    it('should display social media form', async () => {
      const ongInfo = createMockONGInfo({
        redesSociais: {
          facebook: 'https://facebook.com/myong',
          instagram: 'https://instagram.com/myong'
        }
      });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Redes Sociais'));
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('https://facebook.com/myong')).toBeInTheDocument();
        expect(screen.getByDisplayValue('https://instagram.com/myong')).toBeInTheDocument();
      });
    });
  });

  describe('Mission and Values Tab', () => {
    it('should display mission and vision', async () => {
      const ongInfo = createMockONGInfo({
        missao: 'Our mission is to help',
        visao: 'Our vision is to transform'
      });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Missao e Valores'));
      });

      await waitFor(() => {
        expect(screen.getByDisplayValue('Our mission is to help')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Our vision is to transform')).toBeInTheDocument();
      });
    });

    it('should display values list', async () => {
      const ongInfo = createMockONGInfo({
        valores: ['Integrity', 'Compassion', 'Excellence']
      });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Missao e Valores'));
      });

      await waitFor(() => {
        expect(screen.getByText('Integrity')).toBeInTheDocument();
        expect(screen.getByText('Compassion')).toBeInTheDocument();
        expect(screen.getByText('Excellence')).toBeInTheDocument();
      });
    });

    it('should add new value', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({ valores: [] }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Missao e Valores'));
      });

      await waitFor(() => {
        const valueInput = screen.getByPlaceholderText('Digite um valor');
        fireEvent.change(valueInput, { target: { value: 'New Value' } });
      });

      fireEvent.click(screen.getByText('Adicionar'));

      await waitFor(() => {
        expect(screen.getByText('New Value')).toBeInTheDocument();
      });
    });

    it('should remove value', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({ valores: ['Value to Remove'] }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Missao e Valores'));
      });

      await waitFor(() => {
        expect(screen.getByText('Value to Remove')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Remover'));

      await waitFor(() => {
        expect(screen.queryByText('Value to Remove')).not.toBeInTheDocument();
      });
    });
  });

  describe('Areas of Operation', () => {
    it('should display areas of operation', async () => {
      const ongInfo = createMockONGInfo({
        areasAtuacao: ['Education', 'Health', 'Environment']
      });
      mockGetONGInfo.mockResolvedValue(ongInfo);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Education')).toBeInTheDocument();
        expect(screen.getByText('Health')).toBeInTheDocument();
        expect(screen.getByText('Environment')).toBeInTheDocument();
      });
    });

    it('should add new area of operation', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({ areasAtuacao: [] }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const areaInput = screen.getByPlaceholderText('Digite uma area de atuacao');
        fireEvent.change(areaInput, { target: { value: 'New Area' } });
      });

      const addButtons = screen.getAllByText('Adicionar');
      fireEvent.click(addButtons[0]); // First add button is for areas

      await waitFor(() => {
        expect(screen.getByText('New Area')).toBeInTheDocument();
      });
    });

    it('should remove area of operation', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({ areasAtuacao: ['Area to Remove'] }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Area to Remove')).toBeInTheDocument();
      });

      // Click the remove button (X) on the area tag
      const removeButton = screen.getByText('Area to Remove').parentElement?.querySelector('button');
      if (removeButton) {
        fireEvent.click(removeButton);
      }

      await waitFor(() => {
        expect(screen.queryByText('Area to Remove')).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('should validate required ONG name', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({ nome: '' }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Nome da ONG'));
      });
    });

    it('should validate required email', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({
        nome: 'Test ONG',
        contato: { email: '', telefone: '11999999999' }
      }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Email'));
      });
    });

    it('should validate required phone', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({
        nome: 'Test ONG',
        contato: { email: 'test@test.com', telefone: '' }
      }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Telefone'));
      });
    });

    it('should validate CNPJ format', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo({
        nome: 'Test ONG',
        contato: { email: 'test@test.com', telefone: '11999999999' },
        cnpj: '12345678900000' // Invalid CNPJ
      }));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('CNPJ'));
      });
    });
  });

  describe('Save ONG Info', () => {
    it('should show saving state when saving', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());
      mockUpdateONGInfo.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(screen.getByText('Salvando...')).toBeInTheDocument();
      });
    });

    it('should save ONG info successfully', async () => {
      const ongInfo = createMockONGInfo();
      mockGetONGInfo.mockResolvedValue(ongInfo);
      mockUpdateONGInfo.mockResolvedValue(undefined);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(mockUpdateONGInfo).toHaveBeenCalled();
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('atualizadas com sucesso'));
      });
    });

    it('should upload logo when file is selected before saving', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());
      mockUpdateONGInfo.mockResolvedValue(undefined);
      mockUploadONGLogo.mockResolvedValue('https://new-logo-url.com/logo.png');

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const fileInput = document.querySelector('input[type="file"]');
        const file = new File(['logo content'], 'logo.png', { type: 'image/png' });

        if (fileInput) {
          fireEvent.change(fileInput, { target: { files: [file] } });
        }
      });

      fireEvent.click(screen.getByText('Salvar Alteracoes'));

      await waitFor(() => {
        expect(mockUploadONGLogo).toHaveBeenCalled();
        expect(mockUpdateONGInfo).toHaveBeenCalledWith(
          expect.objectContaining({
            logo: 'https://new-logo-url.com/logo.png'
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle error when loading ONG info fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetONGInfo.mockRejectedValue(new Error('Network error'));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro'));
      });

      consoleSpy.mockRestore();
    });

    it('should handle error when saving ONG info fails', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());
      mockUpdateONGInfo.mockRejectedValue(new Error('Save failed'));

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Salvar Alteracoes'));
      });

      await waitFor(() => {
        expect(mockAlert).toHaveBeenCalledWith(expect.stringContaining('Erro'));
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Form Input Changes', () => {
    it('should update nested field values correctly', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        fireEvent.click(screen.getByText('Contato'));
      });

      await waitFor(() => {
        const emailInput = screen.getByPlaceholderText('contato@ong.org.br');
        fireEvent.change(emailInput, { target: { value: 'new@email.com' } });
        expect(emailInput).toHaveValue('new@email.com');
      });
    });

    it('should update simple field values correctly', async () => {
      mockGetONGInfo.mockResolvedValue(createMockONGInfo());

      render(<ONGSettingsPage />);

      await waitFor(() => {
        const nameInput = screen.getByPlaceholderText('Nome da organizacao');
        fireEvent.change(nameInput, { target: { value: 'New ONG Name' } });
        expect(nameInput).toHaveValue('New ONG Name');
      });
    });
  });

  describe('Empty State', () => {
    it('should handle empty ONG info (new ONG)', async () => {
      mockGetONGInfo.mockResolvedValue(null);

      render(<ONGSettingsPage />);

      await waitFor(() => {
        expect(screen.getByText('Configuracoes da ONG')).toBeInTheDocument();
        // Form should be empty but functional
        const nameInput = screen.getByPlaceholderText('Nome da organizacao');
        expect(nameInput).toHaveValue('');
      });
    });
  });
});
