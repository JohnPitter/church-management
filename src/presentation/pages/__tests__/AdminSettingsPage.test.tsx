import React from 'react';
import { fireEvent, render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AdminSettingsPage } from '../AdminSettingsPage';
import { UserRole, UserStatus } from '@/domain/entities/User';

jest.mock('../../components/ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: jest.fn(async (options?: any) => global.confirm(options?.message ?? '')),
    prompt: jest.fn().mockResolvedValue(''),
  }),
  ConfirmDialogProvider: ({ children }: any) => children,
}));

jest.mock('react-hot-toast', () => {
  const toast = (message: string) => global.alert(message);
  toast.success = (message: string) => global.alert(message);
  toast.error = (message: string) => global.alert(message);
  return { __esModule: true, default: toast };
});

jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
}));

const mockRef = jest.fn();
const mockUploadBytes = jest.fn().mockResolvedValue({ ref: {} });
const mockGetDownloadURL = jest.fn().mockResolvedValue('https://example.com/logo.png');

jest.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytes: (...args: any[]) => mockUploadBytes(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args),
}));

const mockLogSystem = jest.fn().mockResolvedValue(undefined);

jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logSystem: (...args: any[]) => mockLogSystem(...args),
  },
}));

const mockCurrentUser = {
  id: 'user-123',
  email: 'admin@example.com',
  displayName: 'Test Admin',
  role: UserRole.Admin,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date(),
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
  }),
}));

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
      { value: '500+', label: 'Lives', icon: '❤️' },
    ],
  },
};

const mockUpdateSettings = jest.fn();
let mockContextSettings = mockSettings;
let mockContextLoading = false;

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => ({
    settings: mockContextSettings,
    loading: mockContextLoading,
    updateSettings: mockUpdateSettings,
  }),
}));

describe('AdminSettingsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockContextSettings = mockSettings;
    mockContextLoading = false;
    mockUpdateSettings.mockResolvedValue(undefined);
    jest.spyOn(window, 'alert').mockImplementation(() => undefined);
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderComponent = () =>
    render(
      <MemoryRouter>
        <AdminSettingsPage />
      </MemoryRouter>
    );

  it('renderiza cabecalho e abas principais', () => {
    renderComponent();

    expect(screen.getByText('Configurações do Sistema')).toBeInTheDocument();
    expect(screen.getByText('Configure as preferências gerais do sistema')).toBeInTheDocument();
    expect(screen.getAllByText('Geral')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Aparência')[0]).toBeInTheDocument();
    expect(screen.getByText('Sobre Nós')).toBeInTheDocument();
    expect(screen.getByText('Pagamentos')).toBeInTheDocument();
    expect(screen.getByText('Segurança')).toBeInTheDocument();
  });

  it('mostra estado de carregamento e erro', () => {
    mockContextLoading = true;
    renderComponent();

    expect(screen.getByText('Carregando configurações...')).toBeInTheDocument();

    cleanup();
    mockContextLoading = false;
    mockContextSettings = null as any;
    renderComponent();

    expect(screen.getByText('Erro ao carregar configurações.')).toBeInTheDocument();
  });

  it('renderiza os campos da aba geral com os valores atuais', () => {
    renderComponent();

    expect(screen.getByDisplayValue('Test Church')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Faith in Action')).toBeInTheDocument();
    expect(screen.getByDisplayValue('123 Church Street')).toBeInTheDocument();
    expect(screen.getByDisplayValue('(11) 1234-5678')).toBeInTheDocument();
    expect(screen.getByDisplayValue('contact@testchurch.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('https://testchurch.com')).toBeInTheDocument();
    expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('America/Sao_Paulo');
  });

  it('permite navegar entre abas e mostra os campos corretos', async () => {
    renderComponent();

    await userEvent.click(screen.getAllByText('Aparência')[0]);
    expect(screen.getByText('Logo da Igreja')).toBeInTheDocument();
    expect(screen.getByText('Cor Primária')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Sobre Nós'));
    expect(screen.getByDisplayValue('Test mission')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test vision')).toBeInTheDocument();
    expect(screen.getByText('Estatísticas (exibidas na página Sobre Nós)')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Notificações'));
    expect(screen.getByText('Notificações por E-mail')).toBeInTheDocument();

    await userEvent.click(screen.getAllByText('Eventos')[0]);
    expect(screen.getByText('Exigir Confirmação de Presença')).toBeInTheDocument();

    await userEvent.click(screen.getByText('Segurança'));
    expect(screen.getByText('Permitir Registro Público')).toBeInTheDocument();
  });

  it('salva configuracoes com sucesso', async () => {
    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(mockUpdateSettings).toHaveBeenCalledWith(
        expect.objectContaining({
          churchName: 'Test Church',
          churchTagline: 'Faith in Action',
        })
      );
    });
    expect(window.alert).toHaveBeenCalledWith('Configurações salvas com sucesso!');
  });

  it('mostra erro quando salvar falha', async () => {
    mockUpdateSettings.mockRejectedValueOnce(new Error('save failed'));
    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('Erro ao salvar configurações.');
    });
  });

  it('restaura configuracoes locais para os padroes quando confirmado', async () => {
    renderComponent();

    await userEvent.click(screen.getByRole('button', { name: 'Restaurar Padrões' }));

    expect(window.confirm).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Salvar Alterações' })).toBeInTheDocument();
  });

  it('valida upload de logo para tipo e tamanho de arquivo', async () => {
    renderComponent();
    await userEvent.click(screen.getAllByText('Aparência')[0]);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const invalidFile = new File(['text'], 'doc.txt', { type: 'text/plain' });
    fireEvent.change(fileInput, { target: { files: [invalidFile] } });
    expect(window.alert).toHaveBeenCalledWith('Por favor, selecione apenas arquivos de imagem.');

    const oversizedFile = new File(['image'], 'big.png', { type: 'image/png' });
    Object.defineProperty(oversizedFile, 'size', { value: 6 * 1024 * 1024 });
    fireEvent.change(fileInput, { target: { files: [oversizedFile] } });
    expect(window.alert).toHaveBeenCalledWith('O arquivo é muito grande. O tamanho máximo é 5MB.');
  });

  it('faz upload do logo quando o arquivo e valido', async () => {
    renderComponent();
    await userEvent.click(screen.getAllByText('Aparência')[0]);

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const imageFile = new File(['image'], 'logo.png', { type: 'image/png' });

    fireEvent.change(fileInput, { target: { files: [imageFile] } });

    await waitFor(() => {
      expect(mockRef).toHaveBeenCalled();
      expect(mockUploadBytes).toHaveBeenCalled();
    });
  });
});
