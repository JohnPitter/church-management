// Unit Tests - Admin Settings Page
// Comprehensive tests for system settings functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminSettingsPage } from '../AdminSettingsPage';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config and storage
jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock Firebase storage functions
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytes: jest.fn().mockResolvedValue({ ref: {} }),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/logo.png')
}));

// Mock logging service
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logSystem: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'admin@example.com',
  displayName: 'Test Admin',
  role: UserRole.Admin,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date()
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    user: mockCurrentUser,
    loading: false,
    login: jest.fn().mockResolvedValue(mockCurrentUser),
    register: jest.fn().mockResolvedValue(mockCurrentUser),
    signInWithGoogle: jest.fn().mockResolvedValue(mockCurrentUser),
    logout: jest.fn().mockResolvedValue(undefined),
    refreshUser: jest.fn().mockResolvedValue(undefined),
    canCreateContent: jest.fn().mockReturnValue(true),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn().mockResolvedValue(undefined),
    getSignInMethods: jest.fn().mockResolvedValue(['password']).mockResolvedValue(['password'])
  })
}));

// Mock SettingsContext
const mockSettings = {
  churchName: 'Test Church',
  churchTagline: 'Faith in Action',
  churchAddress: '123 Church Street',
  churchPhone: '(11) 1234-5678',
  churchEmail: 'contact@testchurch.com',
  churchWebsite: 'https://testchurch.com',
  logoURL: undefined as string | undefined,
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  emailNotifications: true,
  smsNotifications: false,
  eventReminders: true,
  autoApproveMembers: false,
  requireEventConfirmation: true,
  maxEventParticipants: 200,
  allowPublicRegistration: true,
  maintenanceMode: false,
  about: {
    mission: 'Test mission',
    vision: 'Test vision',
    statistics: [
      { value: '10+', label: 'Years', icon: '📅' },
      { value: '100+', label: 'Members', icon: '👥' },
      { value: '5+', label: 'Ministries', icon: '⛪' },
      { value: '500+', label: 'Lives', icon: '❤️' }
    ]
  }
};

const mockUpdateSettings = jest.fn();
let mockContextSettings = mockSettings;
let mockContextLoading = false;

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockContextSettings,
    loading: mockContextLoading,
    updateSettings: mockUpdateSettings
  })
}));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextSettings = mockSettings;
    mockContextLoading = false;
    mockUpdateSettings.mockResolvedValue(undefined);
    // Mock window.alert and window.confirm
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    );
  };

  describe('Rendering', () => {
    it('should render the page header', () => {
      renderComponent();

      expect(screen.getByText('Configurações do Sistema')).toBeInTheDocument();
      expect(screen.getByText('Configure as preferências gerais do sistema')).toBeInTheDocument();
    });

    it('should render save and reset buttons', () => {
      renderComponent();

      expect(screen.getByText('Salvar Alterações')).toBeInTheDocument();
      expect(screen.getByText('Restaurar Padrões')).toBeInTheDocument();
    });

    it('should render all navigation tabs', () => {
      renderComponent();

      expect(screen.getAllByText('Geral')[0]).toBeInTheDocument();
      expect(screen.getAllByText('Aparência')[0]).toBeInTheDocument();
      expect(screen.getByText('Sobre Nós')).toBeInTheDocument();
      expect(screen.getByText('Notificações')).toBeInTheDocument();
      expect(screen.getAllByText('Eventos')[0]).toBeInTheDocument();
      expect(screen.getByText('Segurança')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when context is loading', () => {
      mockContextLoading = true;
      renderComponent();

      expect(screen.getByText('Carregando configuracoes...')).toBeInTheDocument();
    });

    it('should show error message when settings is null', () => {
      mockContextSettings = null as any;
      renderComponent();

      expect(screen.getByText('Erro ao carregar configuracoes.')).toBeInTheDocument();
    });

    it('should disable buttons when loading', () => {
      mockContextLoading = true;
      renderComponent();

      expect(screen.getByText('Salvar Alterações')).toBeDisabled();
      expect(screen.getByText('Restaurar Padrões')).toBeDisabled();
    });
  });

  describe('General Tab', () => {
    it('should display church name field with correct value', () => {
      renderComponent();

      const churchNameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
      expect(churchNameInput.value).toBe('Test Church');
    });

    it('should display church tagline field', () => {
      renderComponent();

      const taglineInput = screen.getAllByRole('textbox')[1] as HTMLInputElement;
      expect(taglineInput.value).toBe('Faith in Action');
    });

    it('should display church address field', () => {
      renderComponent();

      const addressTextarea = screen.getByLabelText('Endereco') as HTMLTextAreaElement;
      expect(addressTextarea.value).toBe('123 Church Street');
    });

    it('should display phone field', () => {
      renderComponent();

      const phoneInput = screen.getAllByRole('textbox')[3] as HTMLInputElement;
      expect(phoneInput.value).toBe('(11) 1234-5678');
    });

    it('should display email field', () => {
      renderComponent();

      const emailInput = screen.getAllByRole('textbox')[4] as HTMLInputElement;
      expect(emailInput.value).toBe('contact@testchurch.com');
    });

    it('should display website field', () => {
      renderComponent();

      const websiteInput = screen.getAllByRole('textbox')[5] as HTMLInputElement;
      expect(websiteInput.value).toBe('https://testchurch.com');
    });

    it('should display timezone selector', () => {
      renderComponent();

      const timezoneSelect = screen.getByLabelText('Fuso Horario') as HTMLSelectElement;
      expect(timezoneSelect.value).toBe('America/Sao_Paulo');
    });

    it('should display language selector', () => {
      renderComponent();

      const languageSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
      expect(languageSelect.value).toBe('pt-BR');
    });

    it('should update church name on change', async () => {
      renderComponent();

      const churchNameInput = screen.getByLabelText('Nome da Igreja') as HTMLInputElement;
      await userEvent.clear(churchNameInput);
      await userEvent.type(churchNameInput, 'New Church Name');

      expect(churchNameInput.value).toBe('New Church Name');
    });
  });

  describe('Tab Navigation', () => {
    it('should switch to Appearance tab when clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      expect(screen.getByText('Logo da Igreja')).toBeInTheDocument();
      expect(screen.getByText('Cor Primaria')).toBeInTheDocument();
      expect(screen.getByText('Cor Secundaria')).toBeInTheDocument();
    });

    it('should switch to About tab when clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Sobre Nós'));

      expect(screen.getByText('Missao da Igreja')).toBeInTheDocument();
      expect(screen.getByText('Visao da Igreja')).toBeInTheDocument();
    });

    it('should switch to Notifications tab when clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Notificações'));

      expect(screen.getByText('Notificações por E-mail')).toBeInTheDocument();
      expect(screen.getByText('Notificações por SMS')).toBeInTheDocument();
      expect(screen.getByText('Lembretes de Eventos')).toBeInTheDocument();
    });

    it('should switch to Events tab when clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Eventos')[0]);

      expect(screen.getByText('Exigir Confirmacao de Presenca')).toBeInTheDocument();
      expect(screen.getByText('Maximo de Participantes por Evento (Padrao)')).toBeInTheDocument();
    });

    it('should switch to Security tab when clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Segurança'));

      expect(screen.getByText('Aprovar Membros Automaticamente')).toBeInTheDocument();
      expect(screen.getByText('Permitir Registro Publico')).toBeInTheDocument();
      expect(screen.getByText('Modo de Manutencao')).toBeInTheDocument();
    });
  });

  describe('Appearance Tab', () => {
    it('should display primary color picker', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      const colorInputs = screen.getAllByDisplayValue('#3B82F6');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('should display secondary color picker', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      const colorInputs = screen.getAllByDisplayValue('#8B5CF6');
      expect(colorInputs.length).toBeGreaterThan(0);
    });

    it('should show logo upload button', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      expect(screen.getByText('Alterar Logo')).toBeInTheDocument();
    });

    it('should show remove logo button when logo exists', async () => {
      mockContextSettings = { ...mockSettings, logoURL: 'https://example.com/logo.png' };
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      expect(screen.getByText('Remover')).toBeInTheDocument();
    });
  });

  describe('Notifications Tab', () => {
    it('should toggle email notifications', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Notificações'));

      const emailCheckbox = screen.getByRole('checkbox', { name: /Notificações por E-mail/i });
      await userEvent.click(emailCheckbox);

      // The checkbox should be toggled
      expect(emailCheckbox).not.toBeChecked();
    });

    it('should toggle SMS notifications', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Notificações'));

      const smsCheckbox = screen.getByRole('checkbox', { name: /Notificações por SMS/i });
      await userEvent.click(smsCheckbox);

      expect(smsCheckbox).toBeChecked();
    });

    it('should toggle event reminders', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Notificações'));

      const remindersCheckbox = screen.getByRole('checkbox', { name: /Lembretes de Eventos/i });
      await userEvent.click(remindersCheckbox);

      expect(remindersCheckbox).not.toBeChecked();
    });
  });

  describe('Events Tab', () => {
    it('should toggle require event confirmation', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Eventos')[0]);

      const confirmationCheckbox = screen.getByRole('checkbox', { name: /Exigir Confirmacao de Presenca/i });
      await userEvent.click(confirmationCheckbox);

      expect(confirmationCheckbox).not.toBeChecked();
    });

    it('should update max participants', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Eventos')[0]);

      const maxParticipantsInput = screen.getByLabelText('Maximo de Participantes por Evento (Padrao)') as HTMLInputElement;
      await userEvent.clear(maxParticipantsInput);
      await userEvent.type(maxParticipantsInput, '300');

      expect(maxParticipantsInput.value).toBe('300');
    });
  });

  describe('Security Tab', () => {
    it('should toggle auto approve members', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Segurança'));

      const autoApproveCheckbox = screen.getByRole('checkbox', { name: /Aprovar Membros Automaticamente/i });
      await userEvent.click(autoApproveCheckbox);

      expect(autoApproveCheckbox).toBeChecked();
    });

    it('should toggle allow public registration', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Segurança'));

      const publicRegCheckbox = screen.getByRole('checkbox', { name: /Permitir Registro Publico/i });
      await userEvent.click(publicRegCheckbox);

      expect(publicRegCheckbox).not.toBeChecked();
    });

    it('should toggle maintenance mode', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Segurança'));

      const maintenanceCheckbox = screen.getByRole('checkbox', { name: /Modo de Manutencao/i });
      await userEvent.click(maintenanceCheckbox);

      expect(maintenanceCheckbox).toBeChecked();
    });

    it('should show warning when maintenance mode is enabled', async () => {
      mockContextSettings = { ...mockSettings, maintenanceMode: true };
      renderComponent();

      await userEvent.click(screen.getByText('Segurança'));

      expect(screen.getByText('Modo de Manutencao Ativo')).toBeInTheDocument();
      expect(screen.getByText(/O sistema esta em modo de manutencao/i)).toBeInTheDocument();
    });
  });

  describe('About Tab', () => {
    it('should display mission textarea', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Sobre Nós'));

      const missionTextarea = screen.getByPlaceholderText('Descreva a missao da sua igreja...');
      expect(missionTextarea).toHaveValue('Test mission');
    });

    it('should display vision textarea', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Sobre Nós'));

      const visionTextarea = screen.getByPlaceholderText('Descreva a visao da sua igreja...');
      expect(visionTextarea).toHaveValue('Test vision');
    });

    it('should display statistics fields', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Sobre Nós'));

      expect(screen.getByText('Estatisticas (exibidas na pagina Sobre Nos)')).toBeInTheDocument();
    });

    it('should update mission text', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Sobre Nós'));

      const missionTextarea = screen.getByPlaceholderText('Descreva a missao da sua igreja...') as HTMLTextAreaElement;
      await userEvent.clear(missionTextarea);
      await userEvent.type(missionTextarea, 'New mission statement');

      expect(missionTextarea.value).toBe('New mission statement');
    });
  });

  describe('Save Settings', () => {
    it('should call updateSettings when save is clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Salvar Alterações'));

      await waitFor(() => {
        expect(mockUpdateSettings).toHaveBeenCalled();
      });
    });

    it('should show success alert on successful save', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Salvar Alterações'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Configurações salvas com sucesso!');
      });
    });

    it('should show error alert on save failure', async () => {
      mockUpdateSettings.mockRejectedValueOnce(new Error('Save failed'));
      renderComponent();

      await userEvent.click(screen.getByText('Salvar Alterações'));

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao salvar configuracoes.');
      });
    });

    it('should show saving state while saving', async () => {
      let resolvePromise: (value?: unknown) => void;
      mockUpdateSettings.mockImplementationOnce(() => new Promise(resolve => {
        resolvePromise = resolve;
      }));

      renderComponent();

      await userEvent.click(screen.getByText('Salvar Alterações'));

      expect(screen.getByText('Salvando...')).toBeInTheDocument();

      await act(async () => {
        resolvePromise!();
      });
    });
  });

  describe('Reset Settings', () => {
    it('should show confirmation dialog when reset is clicked', async () => {
      renderComponent();

      await userEvent.click(screen.getByText('Restaurar Padrões'));

      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja restaurar as configuracoes padrao?');
    });

    it('should not reset settings when user cancels', async () => {
      (window.confirm as jest.Mock).mockReturnValueOnce(false);
      renderComponent();

      const churchNameInput = screen.getByLabelText('Nome da Igreja') as HTMLInputElement;
      await userEvent.clear(churchNameInput);
      await userEvent.type(churchNameInput, 'Changed Name');

      await userEvent.click(screen.getByText('Restaurar Padrões'));

      expect(churchNameInput.value).toBe('Changed Name');
    });
  });

  describe('Logo Upload', () => {
    it('should validate file type on upload', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const invalidFile = new File([''], 'test.txt', { type: 'text/plain' });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [invalidFile] } });
      });

      expect(window.alert).toHaveBeenCalledWith('Por favor, selecione apenas arquivos de imagem.');
    });

    it('should validate file size on upload', async () => {
      renderComponent();

      await userEvent.click(screen.getAllByText('Aparência')[0]);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      // Create a large file (> 5MB)
      const largeFile = new File([new Array(6 * 1024 * 1024).fill('a').join('')], 'large.png', { type: 'image/png' });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
      });

      expect(window.alert).toHaveBeenCalledWith('O arquivo e muito grande. O tamanho maximo e 5MB.');
    });
  });

  describe('Accessibility', () => {
    it('should have accessible labels for all form fields', () => {
      renderComponent();

      expect(screen.getByLabelText('Nome da Igreja')).toBeInTheDocument();
      expect(screen.getByLabelText('Slogan/Frase da Igreja')).toBeInTheDocument();
      expect(screen.getByLabelText('Endereco')).toBeInTheDocument();
      expect(screen.getByLabelText('Telefone')).toBeInTheDocument();
      expect(screen.getByLabelText('E-mail')).toBeInTheDocument();
      expect(screen.getByLabelText('Website')).toBeInTheDocument();
    });

    it('should have proper button roles', () => {
      renderComponent();

      expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Restaurar Padrões/i })).toBeInTheDocument();
    });
  });

  describe('Timezone Options', () => {
    it('should have Brazilian timezone options', () => {
      renderComponent();

      const timezoneSelect = screen.getByLabelText('Fuso Horario') as HTMLSelectElement;
      const options = Array.from(timezoneSelect.options).map(opt => opt.value);

      expect(options).toContain('America/Sao_Paulo');
      expect(options).toContain('America/Fortaleza');
      expect(options).toContain('America/Manaus');
      expect(options).toContain('America/Rio_Branco');
    });
  });

  describe('Language Options', () => {
    it('should have multiple language options', () => {
      renderComponent();

      const languageSelect = screen.getAllByRole('combobox')[1] as HTMLSelectElement;
      const options = Array.from(languageSelect.options).map(opt => opt.value);

      expect(options).toContain('pt-BR');
      expect(options).toContain('en-US');
      expect(options).toContain('es-ES');
    });
  });
});
