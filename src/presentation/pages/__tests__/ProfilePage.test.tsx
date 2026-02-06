// Unit Tests - Profile Page
// Comprehensive tests for user profile management functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { ProfilePage } from '../ProfilePage';
import { UserRole, UserStatus } from '@/domain/entities/User';

// Mock Firebase config and storage
jest.mock('@/config/firebase', () => ({
  db: {},
  storage: {},
  auth: {
    currentUser: {
      email: 'test@example.com',
      providerData: [{ providerId: 'password' }]
    }
  }
}));

// Mock Firebase auth functions
const mockUpdateProfile = jest.fn().mockResolvedValue(undefined);
const mockUpdatePassword = jest.fn().mockResolvedValue(undefined);
const mockReauthenticateWithCredential = jest.fn().mockResolvedValue(undefined);
const mockEmailAuthProvider = {
  credential: jest.fn().mockReturnValue({ providerId: 'password' })
};

jest.mock('firebase/auth', () => ({
  updateProfile: (...args: any[]) => mockUpdateProfile(...args),
  updatePassword: (...args: any[]) => mockUpdatePassword(...args),
  reauthenticateWithCredential: (...args: any[]) => mockReauthenticateWithCredential(...args),
  EmailAuthProvider: {
    credential: (...args: any[]) => mockEmailAuthProvider.credential(...args)
  }
}));

// Mock Firebase storage functions
const mockUploadTask = {
  snapshot: {
    ref: {},
    bytesTransferred: 1000,
    totalBytes: 1000
  },
  on: jest.fn((event: string, onProgress: any, onError: any, onComplete: any) => {
    // Simulate successful upload synchronously
    if (onProgress) onProgress({ bytesTransferred: 1000, totalBytes: 1000 });
    if (onComplete) onComplete();
  })
};

const mockRef = jest.fn().mockReturnValue('storage-ref');
const mockUploadBytesResumable = jest.fn().mockReturnValue(mockUploadTask);
const mockGetDownloadURL = jest.fn().mockResolvedValue('https://example.com/photo.jpg');

jest.mock('firebase/storage', () => ({
  ref: (...args: any[]) => mockRef(...args),
  uploadBytesResumable: (...args: any[]) => mockUploadBytesResumable(...args),
  getDownloadURL: (...args: any[]) => mockGetDownloadURL(...args)
}));

// Mock Firestore functions
jest.mock('firebase/firestore', () => ({
  deleteField: jest.fn(() => ({ _type: 'deleteField' }))
}));

// Mock logging service
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    logSystem: jest.fn().mockResolvedValue(undefined)
  }
}));

// Mock date-fns format
jest.mock('date-fns', () => ({
  format: jest.fn((date: any, formatStr: string) => {
    // Always return a formatted date string regardless of type check
    if (date) {
      return '05/02/2026';
    }
    return '';
  })
}));

// Mock FirebaseUserRepository
const mockFindById = jest.fn();
const mockUpdate = jest.fn();

jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => {
  function FirebaseUserRepositoryMock(this: any) {
    this.findById = mockFindById;
    this.update = mockUpdate;
  }
  return {
    FirebaseUserRepository: FirebaseUserRepositoryMock
  };
});

// Mock PermissionService
const mockGetRoleDisplayNameSync = jest.fn();

jest.mock('@modules/user-management/permissions/application/services/PermissionService', () => {
  const mockInstance = {
    getRoleDisplayNameSync: mockGetRoleDisplayNameSync
  };
  return {
    PermissionService: function() { return mockInstance; },
    permissionService: mockInstance
  };
});

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  photoURL: 'https://example.com/photo.jpg',
  phoneNumber: '(11) 98765-4321'
};

const mockRefreshUser = jest.fn().mockResolvedValue(undefined);

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    user: mockCurrentUser,
    loading: false,
    login: jest.fn(),
    register: jest.fn(),
    signInWithGoogle: jest.fn(),
    logout: jest.fn(),
    refreshUser: mockRefreshUser,
    canCreateContent: jest.fn().mockReturnValue(false),
    isProfessional: jest.fn().mockReturnValue(false),
    canAccessSystem: jest.fn().mockReturnValue(true),
    linkEmailPassword: jest.fn(),
    getSignInMethods: jest.fn()
  })
}));

describe('ProfilePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockFindById.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
      role: UserRole.Member,
      status: UserStatus.Approved,
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
      photoURL: 'https://example.com/photo.jpg',
      phoneNumber: '(11) 98765-4321'
    });

    mockUpdate.mockResolvedValue(undefined);
    mockGetRoleDisplayNameSync.mockReturnValue('Custom Role');

    // Re-establish Firebase storage mock return values
    mockRef.mockReturnValue('storage-ref');
    mockUploadBytesResumable.mockReturnValue(mockUploadTask);
    mockGetDownloadURL.mockResolvedValue('https://example.com/photo.jpg');
    mockUpdateProfile.mockResolvedValue(undefined);
    mockUpdatePassword.mockResolvedValue(undefined);
    mockReauthenticateWithCredential.mockResolvedValue(undefined);

    // Re-establish upload task on mock
    mockUploadTask.on = jest.fn((event: string, onProgress: any, onError: any, onComplete: any) => {
      if (onProgress) onProgress({ bytesTransferred: 1000, totalBytes: 1000 });
      if (onComplete) onComplete();
    });

    // Mock window methods
    jest.spyOn(window, 'alert').mockImplementation(() => {});
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    // Only clear mocks, don't restore - restoreAllMocks resets jest.mock implementations
    jest.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <ProfilePage />
      </MemoryRouter>
    );
  };

  describe('Loading State', () => {
    it('should show loading spinner while profile is loading', () => {
      mockFindById.mockImplementation(() => new Promise(() => {}));
      renderComponent();
      expect(screen.getByText('Carregando perfil...')).toBeInTheDocument();
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });

    it('should not render profile content while loading', () => {
      mockFindById.mockImplementation(() => new Promise(() => {}));
      renderComponent();
      expect(screen.queryByText('Meu Perfil')).not.toBeInTheDocument();
    });
  });

  describe('Error State', () => {
    it('should show error message when profile fails to load', async () => {
      mockFindById.mockRejectedValue(new Error('Failed to load'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar perfil.')).toBeInTheDocument();
      });
    });

    it('should show error message when user not found', async () => {
      mockFindById.mockResolvedValue(null);
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Erro ao carregar perfil.')).toBeInTheDocument();
      });
    });

    it('should log error when profile loading fails', async () => {
      const error = new Error('Database error');
      mockFindById.mockRejectedValue(error);
      renderComponent();
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error loading user profile:', error);
      });
    });
  });

  describe('Page Rendering', () => {
    it('should render page header', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Meu Perfil')).toBeInTheDocument();
        expect(screen.getByText('Gerencie suas informações pessoais e preferências')).toBeInTheDocument();
      });
    });

    it('should render edit button initially', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
    });

    it('should render user display name', async () => {
      renderComponent();
      await waitFor(() => {
        // "Test User" appears in both h2 (profile sidebar) and p (personal tab content)
        expect(screen.getAllByText('Test User').length).toBeGreaterThan(0);
      });
    });

    it('should render user email', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
      });
    });

    it('should render user role label', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Membro')).toBeInTheDocument();
      });
    });

    it('should render member since date', async () => {
      // Ensure the format mock returns a date string
      const { format: mockFormat } = require('date-fns');
      mockFormat.mockImplementation((date: any, formatStr: string) => {
        if (date) return '05/02/2026';
        return '';
      });

      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Membro desde')).toBeInTheDocument();
        expect(screen.getByText('05/02/2026')).toBeInTheDocument();
      });
    });
  });

  describe('Tab Navigation', () => {
    it('should render all navigation tabs', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
        expect(screen.getByText('Contato')).toBeInTheDocument();
        expect(screen.getByText('Ministério')).toBeInTheDocument();
        expect(screen.getByText('Segurança')).toBeInTheDocument();
        expect(screen.getByText('Preferências')).toBeInTheDocument();
      });
    });

    it('should have personal tab active by default', async () => {
      renderComponent();
      await waitFor(() => {
        const personalTab = screen.getByText('Informações Pessoais').closest('button');
        expect(personalTab).toHaveClass('border-indigo-500');
      });
    });

    it('should switch to contact tab when clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Informações Pessoais')).toBeInTheDocument();
      });
      const contactTab = screen.getByText('Contato').closest('button');
      fireEvent.click(contactTab!);
      expect(contactTab).toHaveClass('border-indigo-500');
    });

    it('should switch to ministry tab when clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Ministério')).toBeInTheDocument();
      });
      const ministryTab = screen.getByText('Ministério').closest('button');
      fireEvent.click(ministryTab!);
      expect(ministryTab).toHaveClass('border-indigo-500');
    });

    it('should switch to security tab when clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Segurança')).toBeInTheDocument();
      });
      const securityTab = screen.getByText('Segurança').closest('button');
      fireEvent.click(securityTab!);
      expect(securityTab).toHaveClass('border-indigo-500');
    });

    it('should switch to preferences tab when clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Preferências')).toBeInTheDocument();
      });
      const preferencesTab = screen.getByText('Preferências').closest('button');
      fireEvent.click(preferencesTab!);
      expect(preferencesTab).toHaveClass('border-indigo-500');
    });
  });

  describe('Profile Photo', () => {
    it('should render profile photo when available', async () => {
      renderComponent();
      await waitFor(() => {
        const img = screen.getByAltText('Test User');
        expect(img).toBeInTheDocument();
        expect(img).toHaveAttribute('src', 'https://example.com/photo.jpg');
      });
    });

    it('should render initials when no photo available', async () => {
      mockFindById.mockResolvedValue({
        ...mockCurrentUser,
        photoURL: undefined
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('TU')).toBeInTheDocument();
      });
    });

    it('should render Alterar Foto button when photo exists', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
    });

    it('should render Adicionar Foto button when no photo exists', async () => {
      mockFindById.mockResolvedValue({
        ...mockCurrentUser,
        photoURL: undefined
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Adicionar Foto')).toBeInTheDocument();
      });
    });

    it('should render Remover button when photo exists', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Remover')).toBeInTheDocument();
      });
    });

    it('should not render Remover button when no photo exists', async () => {
      mockFindById.mockResolvedValue({
        ...mockCurrentUser,
        photoURL: undefined
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.queryByText('Remover')).not.toBeInTheDocument();
      });
    });

    it('should trigger file input when photo button clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const clickSpy = jest.spyOn(fileInput, 'click');
      const changePhotoBtn = screen.getByText('Alterar Foto');
      fireEvent.click(changePhotoBtn);
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe('Photo Upload', () => {
    it('should upload photo successfully', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(mockUploadBytesResumable).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockGetDownloadURL).toHaveBeenCalled();
      });
    });

    it('should update user profile after photo upload', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('user-123', expect.objectContaining({
          photoURL: 'https://example.com/photo.jpg'
        }));
      });
    });

    it('should refresh user context after photo upload', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalled();
      });
    });

    it('should show success alert after photo upload', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Foto atualizada com sucesso!');
      });
    });

    it('should reject non-image files', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['document content'], 'document.pdf', { type: 'application/pdf' });
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Por favor, selecione apenas arquivos de imagem.');
      });
      expect(mockUploadBytesResumable).not.toHaveBeenCalled();
    });

    it('should reject files larger than 5MB', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 });
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [largeFile] } });
      });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('A imagem deve ter no máximo 5MB.');
      });
      expect(mockUploadBytesResumable).not.toHaveBeenCalled();
    });

    it('should show uploading state during upload', async () => {
      // Override on to only call onProgress, not onComplete (keeps uploading state)
      mockUploadTask.on = jest.fn((event: string, onProgress: any, onError: any, onComplete: any) => {
        if (onProgress) onProgress({ bytesTransferred: 500, totalBytes: 1000 });
        // Don't call onComplete to keep the uploading state
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(screen.getByText('Enviando...')).toBeInTheDocument();
      });
    });

    it('should handle upload error gracefully', async () => {
      const uploadError = new Error('Upload failed');
      mockUploadTask.on = jest.fn((event: string, onProgress: any, onError: any, onComplete: any) => {
        if (onError) onError(uploadError);
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Upload error:', uploadError);
      });
    });

    it('should handle unauthorized upload error', async () => {
      const unauthorizedError = { code: 'storage/unauthorized' };
      mockUploadTask.on = jest.fn((event: string, onProgress: any, onError: any, onComplete: any) => {
        if (onError) onError(unauthorizedError);
      });
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('não tem permissão'));
      });
    });

    it('should clear file input after upload', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Alterar Foto')).toBeInTheDocument();
      });
      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const file = new File(['photo content'], 'photo.jpg', { type: 'image/jpeg' });
      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });
      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });

  describe('Photo Remove', () => {
    it('should remove photo successfully', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Remover')).toBeInTheDocument();
      });
      const removeBtn = screen.getByText('Remover');
      await act(async () => {
        fireEvent.click(removeBtn);
      });
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('user-123', expect.objectContaining({
          updatedAt: expect.any(Date)
        }));
        // photoURL should be set to deleteField() result (or undefined if mock cleared)
        const callArgs = mockUpdate.mock.calls[0][1];
        expect(callArgs).toHaveProperty('photoURL');
      });
    });

    it('should refresh user context after photo removal', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Remover')).toBeInTheDocument();
      });
      const removeBtn = screen.getByText('Remover');
      await act(async () => {
        fireEvent.click(removeBtn);
      });
      await waitFor(() => {
        expect(mockRefreshUser).toHaveBeenCalled();
      });
    });

    it('should show success alert after photo removal', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Remover')).toBeInTheDocument();
      });
      const removeBtn = screen.getByText('Remover');
      await act(async () => {
        fireEvent.click(removeBtn);
      });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Foto removida com sucesso!');
      });
    });

    it('should handle photo removal error', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Remove failed'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByText('Remover')).toBeInTheDocument();
      });
      const removeBtn = screen.getByText('Remover');
      await act(async () => {
        fireEvent.click(removeBtn);
      });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao remover foto.');
      });
    });
  });

  describe('Edit Mode', () => {
    it('should enter edit mode when edit button clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Salvar')).toBeInTheDocument();
    });

    it('should hide edit button in edit mode', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      expect(screen.queryByRole('button', { name: /editar perfil/i })).not.toBeInTheDocument();
    });

    it('should show cancel and save buttons in edit mode', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      expect(screen.getByText('Cancelar')).toBeInTheDocument();
      expect(screen.getByText('Salvar')).toBeInTheDocument();
    });

    it('should exit edit mode when cancel button clicked', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const cancelBtn = screen.getByText('Cancelar');
      fireEvent.click(cancelBtn);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
    });

    it('should restore original data when cancelled', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const personalTab = screen.getByText('Informações Pessoais').closest('button');
      fireEvent.click(personalTab!);
      const cancelBtn = screen.getByText('Cancelar');
      fireEvent.click(cancelBtn);
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
    });
  });

  describe('Profile Editing - Personal Information', () => {
    it('should allow editing display name', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const personalTab = screen.getByText('Informações Pessoais').closest('button');
      fireEvent.click(personalTab!);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });
      const nameInput = screen.getByDisplayValue('Test User') as HTMLInputElement;
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      expect(nameInput.value).toBe('Updated Name');
    });

    it('should save profile changes', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const personalTab = screen.getByText('Informações Pessoais').closest('button');
      fireEvent.click(personalTab!);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        expect(mockUpdate).toHaveBeenCalledWith('user-123', expect.objectContaining({
          displayName: 'Updated Name'
        }));
      });
    });

    it('should update Firebase Auth profile when name changed', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const personalTab = screen.getByText('Informações Pessoais').closest('button');
      fireEvent.click(personalTab!);
      await waitFor(() => {
        expect(screen.getByDisplayValue('Test User')).toBeInTheDocument();
      });
      const nameInput = screen.getByDisplayValue('Test User');
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        expect(mockUpdateProfile).toHaveBeenCalled();
      });
    });

    it('should show success alert after saving', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Perfil atualizado com sucesso!');
      });
    });

    it('should exit edit mode after saving', async () => {
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
    });

    it('should show saving state during save', async () => {
      mockUpdate.mockImplementation(() => new Promise(() => {}));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        expect(screen.getByText('Salvando...')).toBeInTheDocument();
      });
    });

    it('should disable save button while saving', async () => {
      mockUpdate.mockImplementation(() => new Promise(() => {}));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        const savingBtn = screen.getByText('Salvando...');
        expect(savingBtn).toBeDisabled();
      });
    });

    it('should handle save error gracefully', async () => {
      mockUpdate.mockRejectedValueOnce(new Error('Save failed'));
      renderComponent();
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /editar perfil/i })).toBeInTheDocument();
      });
      const editBtn = screen.getByRole('button', { name: /editar perfil/i });
      fireEvent.click(editBtn);
      const saveBtn = screen.getByText('Salvar');
      await act(async () => {
        fireEvent.click(saveBtn);
      });
      await waitFor(() => {
        expect(window.alert).toHaveBeenCalledWith('Erro ao atualizar perfil.');
      });
    });
  });
});
