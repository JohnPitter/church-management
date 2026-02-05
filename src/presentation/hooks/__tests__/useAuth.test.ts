// Unit Tests - useAuth Hook
// Comprehensive tests for authentication hook functionality

import { renderHook, waitFor, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import * as container from '@/infrastructure/di/container';
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

// Mock dependencies
jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(() => jest.fn())
}));

jest.mock('@/config/firebase', () => ({
  auth: {}
}));

jest.mock('firebase/auth', () => ({
  onAuthStateChanged: jest.fn()
}));

jest.mock('@/infrastructure/di/container', () => ({
  getLoginUseCase: jest.fn(),
  getRegisterUseCase: jest.fn(),
  getUserRepository: jest.fn()
}));

// Test utilities
const createMockUser = (overrides: Partial<User> = {}): User => ({
  id: 'test-user-id',
  email: 'test@example.com',
  displayName: 'Test User',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides
});

describe('useAuth Hook', () => {
  let mockNavigate: jest.Mock;
  let mockLoginUseCase: any;
  let mockRegisterUseCase: any;
  let mockUserRepository: any;
  let authStateCallback: ((user: any) => void) | null;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    authStateCallback = null;

    // Setup navigate mock
    mockNavigate = jest.fn();
    const useNavigate = require('react-router-dom').useNavigate;
    useNavigate.mockReturnValue(mockNavigate);

    // Setup login use case mock
    mockLoginUseCase = {
      execute: jest.fn()
    };
    (container.getLoginUseCase as jest.Mock).mockReturnValue(mockLoginUseCase);

    // Setup register use case mock
    mockRegisterUseCase = {
      execute: jest.fn()
    };
    (container.getRegisterUseCase as jest.Mock).mockReturnValue(mockRegisterUseCase);

    // Setup user repository mock
    mockUserRepository = {
      findById: jest.fn()
    };
    (container.getUserRepository as jest.Mock).mockReturnValue(mockUserRepository);

    // Setup auth state changed mock
    (onAuthStateChanged as jest.Mock).mockImplementation((authInstance, callback) => {
      authStateCallback = callback;
      return jest.fn(); // Unsubscribe function
    });
  });

  describe('Initial State', () => {
    it('should initialize with loading true and no user', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should setup Firebase auth state listener on mount', () => {
      renderHook(() => useAuth());

      expect(onAuthStateChanged).toHaveBeenCalledWith(auth, expect.any(Function));
    });

    it('should cleanup auth state listener on unmount', () => {
      const unsubscribe = jest.fn();
      (onAuthStateChanged as jest.Mock).mockReturnValue(unsubscribe);

      const { unmount } = renderHook(() => useAuth());
      unmount();

      expect(unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Auth State Changes', () => {
    it('should update state when user logs in', async () => {
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      // Simulate Firebase auth state change
      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(mockUser);
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(true);
      });

      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUser.id);
    });

    it('should update state when user logs out', async () => {
      const { result } = renderHook(() => useAuth());

      // Simulate Firebase auth state change with no user
      act(() => {
        authStateCallback?.(null);
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it('should handle error when fetching user data fails', async () => {
      mockUserRepository.findById.mockRejectedValue(new Error('Database error'));

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: 'test-user-id' });
      });

      await waitFor(() => {
        expect(result.current.user).toBeNull();
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBe('Erro ao carregar dados do usuário');
      });
    });
  });

  describe('Login Method', () => {
    it('should successfully login and navigate to admin for admin users', async () => {
      const mockUser = createMockUser({ role: UserRole.Admin });
      mockLoginUseCase.execute.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockNavigate).toHaveBeenCalledWith('/admin');
    });

    it('should successfully login and navigate to painel for non-admin users', async () => {
      const mockUser = createMockUser({ role: UserRole.Member });
      mockLoginUseCase.execute.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth());

      await act(async () => {
        await result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(mockNavigate).toHaveBeenCalledWith('/painel');
    });

    it('should set loading state during login', async () => {
      const mockUser = createMockUser();
      mockLoginUseCase.execute.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100))
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.login({ email: 'test@example.com', password: 'password123' });
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle login error with custom message', async () => {
      const errorMessage = 'Invalid credentials';
      mockLoginUseCase.execute.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError.message).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
      expect(result.current.user).toBeNull();
    });

    it('should handle login error without message', async () => {
      mockLoginUseCase.execute.mockRejectedValue({});

      const { result } = renderHook(() => useAuth());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(result.current.error).toBe('Erro ao fazer login');
    });
  });

  describe('Register Method', () => {
    it('should successfully register a new user', async () => {
      const mockUser = createMockUser();
      mockRegisterUseCase.execute.mockResolvedValue({ user: mockUser });

      const { result } = renderHook(() => useAuth());

      const registerParams = {
        email: 'new@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        displayName: 'New User'
      };

      await act(async () => {
        await result.current.register(registerParams);
      });

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(registerParams);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should set loading state during registration', async () => {
      const mockUser = createMockUser();
      mockRegisterUseCase.execute.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve({ user: mockUser }), 100))
      );

      const { result } = renderHook(() => useAuth());

      act(() => {
        result.current.register({
          email: 'new@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          displayName: 'New User'
        });
      });

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle registration error with custom message', async () => {
      const errorMessage = 'Email already exists';
      mockRegisterUseCase.execute.mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuth());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.register({
            email: 'existing@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            displayName: 'Test User'
          });
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError.message).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });

    it('should handle registration error without message', async () => {
      mockRegisterUseCase.execute.mockRejectedValue({});

      const { result } = renderHook(() => useAuth());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.register({
            email: 'new@example.com',
            password: 'password123',
            confirmPassword: 'password123',
            displayName: 'Test User'
          });
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError).toBeDefined();
      expect(result.current.error).toBe('Erro ao criar conta');
    });
  });

  describe('Logout Method', () => {
    it('should successfully logout user', async () => {
      const mockSignOut = jest.fn().mockResolvedValue(undefined);
      (auth as any).signOut = mockSignOut;

      const { result } = renderHook(() => useAuth());

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(result.current.user).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });

    it('should handle logout error', async () => {
      const errorMessage = 'Network error';
      const mockSignOut = jest.fn().mockRejectedValue(new Error(errorMessage));
      (auth as any).signOut = mockSignOut;

      const { result } = renderHook(() => useAuth());

      let thrownError: any;
      await act(async () => {
        try {
          await result.current.logout();
        } catch (error) {
          thrownError = error;
        }
      });

      expect(thrownError.message).toBe(errorMessage);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Erro ao sair');
    });
  });

  describe('clearError Method', () => {
    it('should clear error state', async () => {
      mockLoginUseCase.execute.mockRejectedValue(new Error('Login failed'));

      const { result } = renderHook(() => useAuth());

      // Trigger an error
      await act(async () => {
        try {
          await result.current.login({ email: 'test@example.com', password: 'wrong' });
        } catch (error) {
          // Expected error
        }
      });

      expect(result.current.error).toBe('Login failed');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Role Checks', () => {
    it('should correctly identify admin user', async () => {
      const mockUser = createMockUser({ role: UserRole.Admin });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(true);
        expect(result.current.isSecretary).toBe(false);
        expect(result.current.isMember).toBe(false);
      });
    });

    it('should correctly identify secretary user', async () => {
      const mockUser = createMockUser({ role: UserRole.Secretary });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isSecretary).toBe(true);
        expect(result.current.isMember).toBe(false);
      });
    });

    it('should correctly identify member user', async () => {
      const mockUser = createMockUser({ role: UserRole.Member });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.isAdmin).toBe(false);
        expect(result.current.isSecretary).toBe(false);
        expect(result.current.isMember).toBe(true);
      });
    });

    it('should return false for all roles when no user', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.(null);
      });

      expect(result.current.isAdmin).toBe(false);
      expect(result.current.isSecretary).toBe(false);
      expect(result.current.isMember).toBe(false);
    });
  });

  describe('Permission Checks', () => {
    it('should allow admin to approve users', async () => {
      const mockUser = createMockUser({ role: UserRole.Admin });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canApproveUsers).toBe(true);
      });
    });

    it('should allow secretary to approve users', async () => {
      const mockUser = createMockUser({ role: UserRole.Secretary });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canApproveUsers).toBe(true);
      });
    });

    it('should not allow member to approve users', async () => {
      const mockUser = createMockUser({ role: UserRole.Member });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canApproveUsers).toBe(false);
      });
    });

    it('should allow admin to create content', async () => {
      const mockUser = createMockUser({ role: UserRole.Admin });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canCreateContent).toBe(true);
      });
    });

    it('should allow secretary to create content', async () => {
      const mockUser = createMockUser({ role: UserRole.Secretary });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canCreateContent).toBe(true);
      });
    });

    it('should only allow admin to manage finances', async () => {
      const mockUser = createMockUser({ role: UserRole.Admin });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canManageFinances).toBe(true);
      });
    });

    it('should not allow non-admin to manage finances', async () => {
      const mockUser = createMockUser({ role: UserRole.Secretary });
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.canManageFinances).toBe(false);
      });
    });

    it('should return false for all permissions when no user', () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.(null);
      });

      expect(result.current.canApproveUsers).toBe(false);
      expect(result.current.canCreateContent).toBe(false);
      expect(result.current.canManageFinances).toBe(false);
    });
  });

  describe('isAuthenticated Property', () => {
    it('should return true when user is logged in', async () => {
      const mockUser = createMockUser();
      mockUserRepository.findById.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.({ uid: mockUser.id });
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(true);
      });
    });

    it('should return false when user is logged out', async () => {
      const { result } = renderHook(() => useAuth());

      act(() => {
        authStateCallback?.(null);
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });
  });

  describe('Hook Stability', () => {
    it('should maintain function references across re-renders', () => {
      const { result, rerender } = renderHook(() => useAuth());

      const firstLogin = result.current.login;
      const firstRegister = result.current.register;
      const firstLogout = result.current.logout;
      const firstClearError = result.current.clearError;

      rerender();

      expect(result.current.login).toBe(firstLogin);
      expect(result.current.register).toBe(firstRegister);
      expect(result.current.logout).toBe(firstLogout);
      expect(result.current.clearError).toBe(firstClearError);
    });
  });

  describe('Return Values', () => {
    it('should return all expected properties and methods', () => {
      const { result } = renderHook(() => useAuth());

      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('loading');
      expect(result.current).toHaveProperty('error');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('clearError');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isAdmin');
      expect(result.current).toHaveProperty('isSecretary');
      expect(result.current).toHaveProperty('isMember');
      expect(result.current).toHaveProperty('canApproveUsers');
      expect(result.current).toHaveProperty('canCreateContent');
      expect(result.current).toHaveProperty('canManageFinances');
    });

    it('should have correct function types', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.login).toBe('function');
      expect(typeof result.current.register).toBe('function');
      expect(typeof result.current.logout).toBe('function');
      expect(typeof result.current.clearError).toBe('function');
    });

    it('should have correct boolean types', () => {
      const { result } = renderHook(() => useAuth());

      expect(typeof result.current.loading).toBe('boolean');
      expect(typeof result.current.isAuthenticated).toBe('boolean');
      expect(typeof result.current.isAdmin).toBe('boolean');
      expect(typeof result.current.isSecretary).toBe('boolean');
      expect(typeof result.current.isMember).toBe('boolean');
      expect(typeof result.current.canApproveUsers).toBe('boolean');
      expect(typeof result.current.canCreateContent).toBe('boolean');
      expect(typeof result.current.canManageFinances).toBe('boolean');
    });
  });
});
