// Unit Tests - AdminLiveManagementPage
// Tests for live stream admin management functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminLiveManagementPage } from '../AdminLiveManagementPage';

// Mock Firebase
jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {}
}));

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  onSnapshot: jest.fn((ref, callback) => {
    callback({ docs: [] });
    return jest.fn(); // Unsubscribe function
  }),
  doc: jest.fn()
}));

// Mock Firebase Storage
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  uploadBytes: jest.fn(),
  getDownloadURL: jest.fn()
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  format: jest.fn((date, formatStr) => {
    const d = new Date(date);
    if (formatStr === 'dd/MM/yyyy') {
      return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
    }
    if (formatStr === 'HH:mm') {
      return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    }
    return d.toISOString();
  })
}));

// Mock the LiveStreamRepository - Create mock functions outside jest.mock to avoid hoisting issues
const mockFindAll = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockUpdateStatus = jest.fn();

jest.mock('@modules/content-management/live-streaming/infrastructure/repositories/FirebaseLiveStreamRepository', () => {
  return {
    FirebaseLiveStreamRepository: function() {
      return {
        findAll: mockFindAll,
        create: mockCreate,
        update: mockUpdate,
        delete: mockDelete,
        updateStatus: mockUpdateStatus
      };
    }
  };
});

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-1',
  email: 'admin@test.com',
  displayName: 'Admin User',
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

// Mock useNotificationActions
const mockNotifyNewLiveStream = jest.fn().mockResolvedValue(5);

jest.mock('../../hooks/useNotificationActions', () => ({
  useNotificationActions: () => ({
    notifyNewLiveStream: mockNotifyNewLiveStream
  })
}));

// Mock loggingService
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logDatabase: jest.fn(),
    logApi: jest.fn()
  }
}));

// Sample test data
const mockStreams = [
  {
    id: 'stream-1',
    title: 'Culto Dominical',
    description: 'Transmissao ao vivo do culto',
    streamUrl: 'https://youtube.com/watch?v=abc123',
    thumbnailUrl: 'https://example.com/thumb1.jpg',
    isLive: true,
    scheduledDate: new Date('2024-01-15T10:00:00'),
    duration: 3600,
    viewCount: 150,
    category: 'culto',
    createdAt: new Date('2024-01-10'),
    createdBy: 'Admin',
    status: 'live'
  },
  {
    id: 'stream-2',
    title: 'Estudo Biblico',
    description: 'Estudo sobre o livro de Romanos',
    streamUrl: 'https://youtube.com/watch?v=def456',
    thumbnailUrl: undefined,
    isLive: false,
    scheduledDate: new Date('2024-01-20T19:00:00'),
    duration: undefined,
    viewCount: 0,
    category: 'estudo',
    createdAt: new Date('2024-01-12'),
    createdBy: 'Secretary',
    status: 'scheduled'
  },
  {
    id: 'stream-3',
    title: 'Reuniao de Oracao',
    description: 'Reuniao semanal de oracao',
    streamUrl: 'https://youtube.com/watch?v=ghi789',
    thumbnailUrl: 'https://example.com/thumb3.jpg',
    isLive: false,
    scheduledDate: new Date('2024-01-10T18:00:00'),
    duration: 1800,
    viewCount: 75,
    category: 'reuniao',
    createdAt: new Date('2024-01-05'),
    createdBy: 'Leader',
    status: 'ended'
  }
];

describe('AdminLiveManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFindAll.mockResolvedValue(mockStreams);
    window.confirm = jest.fn().mockReturnValue(true);
    window.alert = jest.fn();
  });

  describe('Rendering', () => {
    it('should render the page header correctly', async () => {
      render(<AdminLiveManagementPage />);

      expect(screen.getByText('Gerenciar Transmissões')).toBeInTheDocument();
      expect(screen.getByText('Administre transmissoes ao vivo e gravacoes')).toBeInTheDocument();
    });

    it('should render the "Nova Transmissão" button', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Transmissão/i })).toBeInTheDocument();
      });
    });

    it('should show loading skeleton initially', () => {
      mockFindAll.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<AdminLiveManagementPage />);

      // Loading skeletons should be visible (animate-pulse class)
      const skeletons = document.querySelectorAll('.animate-pulse');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should render streams after loading', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
        expect(screen.getByText('Reuniao de Oracao')).toBeInTheDocument();
      });
    });

    it('should display empty state when no streams exist', async () => {
      mockFindAll.mockResolvedValue([]);
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhuma transmissão cadastrada')).toBeInTheDocument();
        expect(screen.getByText('Comece criando sua primeira transmissão ao vivo')).toBeInTheDocument();
      });
    });
  });

  describe('Statistics Cards', () => {
    it('should display correct counts for each status', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        // Check Ao Vivo count (1 live stream)
        const liveCard = screen.getByText('Ao Vivo').closest('div')?.parentElement;
        expect(liveCard).toContainElement(screen.getByText('1'));

        // Check Agendados count (1 scheduled stream)
        const scheduledCard = screen.getByText('Agendados').closest('div')?.parentElement;
        expect(scheduledCard).toContainElement(screen.getAllByText('1')[0]);

        // Check Finalizados count (1 ended stream)
        const endedCard = screen.getByText('Finalizados').closest('div')?.parentElement;
        expect(endedCard).toContainElement(screen.getAllByText('1')[1]);
      });
    });
  });

  describe('Filtering', () => {
    it('should filter streams by search term', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar transmissoes...');
      fireEvent.change(searchInput, { target: { value: 'Estudo' } });

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
      });
    });

    it('should filter streams by status', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const statusSelect = screen.getByDisplayValue('Todos os Status');
      fireEvent.change(statusSelect, { target: { value: 'scheduled' } });

      await waitFor(() => {
        expect(screen.queryByText('Culto Dominical')).not.toBeInTheDocument();
        expect(screen.getByText('Estudo Biblico')).toBeInTheDocument();
        expect(screen.queryByText('Reuniao de Oracao')).not.toBeInTheDocument();
      });
    });

    it('should filter streams by category', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const categorySelect = screen.getByDisplayValue('Todas as Categorias');
      fireEvent.change(categorySelect, { target: { value: 'culto' } });

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
        expect(screen.queryByText('Estudo Biblico')).not.toBeInTheDocument();
      });
    });

    it('should show "no results" message when filter matches nothing', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Buscar transmissoes...');
      fireEvent.change(searchInput, { target: { value: 'nonexistent search term' } });

      await waitFor(() => {
        expect(screen.getByText('Nenhuma transmissão encontrada')).toBeInTheDocument();
        expect(screen.getByText('Tente ajustar os filtros ou fazer uma nova busca.')).toBeInTheDocument();
      });
    });
  });

  describe('Stream Actions', () => {
    it('should open edit modal when clicking Editar', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Editar Transmissão')).toBeInTheDocument();
      });
    });

    it('should call delete handler when clicking Excluir', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      expect(window.confirm).toHaveBeenCalledWith('Tem certeza que deseja excluir esta transmissão?');

      await waitFor(() => {
        expect(mockDelete).toHaveBeenCalledWith('stream-1');
      });
    });

    it('should not delete when user cancels confirmation', async () => {
      window.confirm = jest.fn().mockReturnValue(false);

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      expect(mockDelete).not.toHaveBeenCalled();
    });

    it('should handle status change', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      // Find status selects in the table
      const statusSelects = screen.getAllByDisplayValue('Ao Vivo');
      fireEvent.change(statusSelects[0], { target: { value: 'ended' } });

      expect(window.confirm).toHaveBeenCalled();

      await waitFor(() => {
        expect(mockUpdateStatus).toHaveBeenCalledWith('stream-1', 'ended');
      });
    });
  });

  describe('Create Stream Modal', () => {
    it('should open create modal when clicking Nova Transmissão', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Transmissão/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Transmissão/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Transmissão')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Ex: Culto Dominical - Domingo Abencoado')).toBeInTheDocument();
      });
    });

    it('should close create modal when clicking Cancelar', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Transmissão/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Transmissão/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Transmissão')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByText('Cancelar'));

      await waitFor(() => {
        expect(screen.queryByText('Nova Transmissão')).not.toBeInTheDocument();
      });
    });

    it('should validate required fields before submission', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Transmissão/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Transmissão/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Transmissão')).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      fireEvent.click(screen.getByText('Criar Transmissão'));

      // Form should have required validation on HTML level
      const titleInput = screen.getByPlaceholderText('Ex: Culto Dominical - Domingo Abencoado');
      expect(titleInput).toBeRequired();
    });

    it('should create stream with valid data', async () => {
      const newStream = {
        id: 'new-stream-1',
        title: 'Novo Culto',
        description: 'Descrição do culto',
        streamUrl: 'https://youtube.com/watch?v=new123',
        category: 'culto',
        status: 'scheduled',
        isLive: false,
        scheduledDate: new Date(),
        viewCount: 0,
        createdAt: new Date(),
        createdBy: 'Admin User'
      };
      mockCreate.mockResolvedValue(newStream);

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Nova Transmissão/i })).toBeInTheDocument();
      });

      fireEvent.click(screen.getByRole('button', { name: /Nova Transmissão/i }));

      await waitFor(() => {
        expect(screen.getByText('Nova Transmissão')).toBeInTheDocument();
      });

      // Fill in the form
      fireEvent.change(screen.getByPlaceholderText('Ex: Culto Dominical - Domingo Abencoado'), {
        target: { value: 'Novo Culto' }
      });
      fireEvent.change(screen.getByPlaceholderText('Descrição da transmissão...'), {
        target: { value: 'Descrição do culto' }
      });
      fireEvent.change(screen.getByPlaceholderText('https://youtube.com/watch?v=...'), {
        target: { value: 'https://youtube.com/watch?v=new123' }
      });

      fireEvent.click(screen.getByText('Criar Transmissão'));

      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Stream Modal', () => {
    it('should populate form with stream data when editing', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Editar Transmissão')).toBeInTheDocument();
        // Check if form is populated with the stream data
        const titleInput = screen.getByDisplayValue('Culto Dominical');
        expect(titleInput).toBeInTheDocument();
      });
    });

    it('should update stream when saving edits', async () => {
      mockUpdate.mockResolvedValue({});

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByText('Editar');
      fireEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Editar Transmissão')).toBeInTheDocument();
      });

      // Change the title
      const titleInput = screen.getByDisplayValue('Culto Dominical');
      fireEvent.change(titleInput, { target: { value: 'Culto Dominical Atualizado' } });

      fireEvent.click(screen.getByText('Salvar Alteracoes'));

      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle load error gracefully', async () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFindAll.mockRejectedValue(new Error('Failed to load streams'));

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(consoleError).toHaveBeenCalled();
      });

      // Should show empty state on error
      await waitFor(() => {
        expect(screen.getByText('Nenhuma transmissão cadastrada')).toBeInTheDocument();
      });

      consoleError.mockRestore();
    });

    it('should handle delete error gracefully', async () => {
      mockDelete.mockRejectedValue(new Error('Failed to delete'));

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByText('Excluir');
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao excluir transmissão.');
      });
    });

    it('should handle status update error gracefully', async () => {
      mockUpdateStatus.mockRejectedValue(new Error('Failed to update status'));

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      const statusSelects = screen.getAllByDisplayValue('Ao Vivo');
      fireEvent.change(statusSelects[0], { target: { value: 'ended' } });

      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao atualizar status.');
      });
    });
  });

  describe('Real-time Updates Simulation', () => {
    it('should set up Firestore listeners for viewer counts', async () => {
      const { onSnapshot } = require('firebase/firestore');

      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      // onSnapshot should be called to listen for viewer updates
      expect(onSnapshot).toHaveBeenCalled();
    });
  });

  describe('Category Display', () => {
    it('should display correct category labels', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto')).toBeInTheDocument();
        expect(screen.getByText('Estudo')).toBeInTheDocument();
        expect(screen.getByText('Reuniao')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible table structure', async () => {
      render(<AdminLiveManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Culto Dominical')).toBeInTheDocument();
      });

      // Check for table headers
      expect(screen.getByText('Transmissao')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
      expect(screen.getByText('Categoria')).toBeInTheDocument();
      expect(screen.getByText('Data/Hora')).toBeInTheDocument();
      expect(screen.getByText('Audiencia')).toBeInTheDocument();
      expect(screen.getByText('Criado por')).toBeInTheDocument();
      expect(screen.getByText('Acoes')).toBeInTheDocument();
    });
  });
});
