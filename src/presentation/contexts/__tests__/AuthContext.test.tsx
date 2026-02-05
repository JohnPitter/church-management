// Unit Tests - AuthContext
// Comprehensive tests for authentication context and provider

import React from 'react';
import { renderHook, waitFor, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { User, UserRole, UserStatus } from '@/domain/entities/User';
import { container } from '@/infrastructure/di/container';
import type { IAuthService } from '@modules/user-management/auth/domain/services/IAuthService';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';

// Mock dependencies
jest.mock('@/infrastructure/di/container');
jest.mock('@modules/shared-kernel/logging/infrastructure/services/LoggingService', () => ({
  loggingService: {
    setUserContext: jest.fn(),
    logAuth: jest.fn(),
  },
}));

describe('AuthContext', () => {
  // Mock auth service
  let mockAuthService: jest.Mocked<IAuthService>;
  let authStateChangeCallback: ((user: User | null) => void) | null = null;

  // Helper to create test user
  const createTestUser = (overrides: Partial<User> = {}): User => ({
    id: '1',
    email: 'test@example.com',
    displayName: 'Test User',
    role: UserRole.Member,
    status: UserStatus.Approved,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  });

  beforeEach(() => {
    // Reset auth state callback
    authStateChangeCallback = null;

    // Create mock auth service
    mockAuthService = {
      login: jest.fn(),
      register: jest.fn(),
      signInWithGoogle: jest.fn(),
      logout: jest.fn(),
      getCurrentUser: jest.fn(),
      onAuthStateChanged: jest.fn((callback) => {
        authStateChangeCallback = callback;
        return jest.fn(); // Return unsubscribe function
      }),
      linkEmailPassword: jest.fn(),
      getSignInMethods: jest.fn(),
    };

    // Mock container to return our mock service
    (container.get as jest.Mock).mockReturnValue(mockAuthService);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('AuthProvider', () => {
    it('should initialize with loading state', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);
      expect(result.current.currentUser).toBeNull();
      expect(result.current.user).toBeNull();
    });

    it('should register auth state change listener on mount', () => {
      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(mockAuthService.onAuthStateChanged).toHaveBeenCalledTimes(1);
      expect(mockAuthService.onAuthStateChanged).toHaveBeenCalledWith(
        expect.any(Function)
      );
    });

    it('should set user context in logging service when auth state changes', async () => {
      const testUser = createTestUser();

      renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Simulate auth state change
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(loggingService.setUserContext).toHaveBeenCalledWith(testUser);
      });
    });

    it('should update currentUser when auth state changes', async () => {
      const testUser = createTestUser();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Simulate auth state change
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(testUser);
        expect(result.current.user).toEqual(testUser);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after auth state is determined', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current.loading).toBe(true);

      // Simulate auth state change with no user
      act(() => {
        authStateChangeCallback?.(null);
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should unsubscribe from auth state changes on unmount', () => {
      const unsubscribeMock = jest.fn();
      mockAuthService.onAuthStateChanged.mockReturnValue(unsubscribeMock);

      const { unmount } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      unmount();

      expect(unsubscribeMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('useAuth hook', () => {
    it('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');

      consoleSpy.mockRestore();
    });

    it('should return context value when used within AuthProvider', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      expect(result.current).toMatchObject({
        currentUser: null,
        user: null,
        loading: expect.any(Boolean),
        login: expect.any(Function),
        register: expect.any(Function),
        signInWithGoogle: expect.any(Function),
        logout: expect.any(Function),
        refreshUser: expect.any(Function),
        canCreateContent: expect.any(Function),
        isProfessional: expect.any(Function),
        canAccessSystem: expect.any(Function),
        linkEmailPassword: expect.any(Function),
        getSignInMethods: expect.any(Function),
      });
    });
  });

  describe('login', () => {
    it('should successfully login user', async () => {
      const testUser = createTestUser();
      mockAuthService.login.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      let loginResult: User | undefined;
      await act(async () => {
        loginResult = await result.current.login('test@example.com', 'password123');
      });

      expect(mockAuthService.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123'
      );
      expect(loginResult).toEqual(testUser);
      expect(result.current.currentUser).toEqual(testUser);
      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User logged in successfully',
        expect.stringContaining('test@example.com'),
        testUser
      );
    });

    it('should handle login errors', async () => {
      const error = new Error('Invalid credentials');
      mockAuthService.login.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid credentials');
      });

      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'warning',
        'Failed login attempt',
        expect.stringContaining('test@example.com'),
      );
      expect(result.current.currentUser).toBeNull();
    });

    it('should log auth info with user role on successful login', async () => {
      const testUser = createTestUser({ role: UserRole.Admin });
      mockAuthService.login.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('admin@example.com', 'password123');
      });

      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User logged in successfully',
        expect.stringContaining('admin'),
        testUser
      );
    });
  });

  describe('register', () => {
    it('should successfully register user', async () => {
      const testUser = createTestUser();
      mockAuthService.register.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      let registerResult: User | undefined;
      await act(async () => {
        registerResult = await result.current.register(
          'newuser@example.com',
          'password123',
          'New User'
        );
      });

      expect(mockAuthService.register).toHaveBeenCalledWith(
        'newuser@example.com',
        'password123',
        'New User'
      );
      expect(registerResult).toEqual(testUser);
      expect(result.current.currentUser).toEqual(testUser);
      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User registered successfully',
        expect.stringContaining('newuser@example.com'),
        testUser
      );
    });

    it('should handle registration errors', async () => {
      const error = new Error('Email already exists');
      mockAuthService.register.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await expect(
          result.current.register('existing@example.com', 'password123', 'Test User')
        ).rejects.toThrow('Email already exists');
      });

      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'error',
        'Registration failed',
        expect.stringContaining('existing@example.com'),
      );
      expect(result.current.currentUser).toBeNull();
    });

    it('should log user name on successful registration', async () => {
      const testUser = createTestUser({ displayName: 'John Doe' });
      mockAuthService.register.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.register('john@example.com', 'password123', 'John Doe');
      });

      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User registered successfully',
        expect.stringContaining('John Doe'),
        testUser
      );
    });
  });

  describe('signInWithGoogle', () => {
    it('should successfully sign in with Google', async () => {
      const testUser = createTestUser({ email: 'google@example.com' });
      mockAuthService.signInWithGoogle.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      let googleResult: User | undefined;
      await act(async () => {
        googleResult = await result.current.signInWithGoogle();
      });

      expect(mockAuthService.signInWithGoogle).toHaveBeenCalledTimes(1);
      expect(googleResult).toEqual(testUser);
      expect(result.current.currentUser).toEqual(testUser);
      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User signed in with Google',
        expect.stringContaining('google@example.com'),
        testUser
      );
    });

    it('should handle Google sign in errors', async () => {
      const error = new Error('Google sign in cancelled');
      mockAuthService.signInWithGoogle.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await expect(result.current.signInWithGoogle()).rejects.toThrow(
          'Google sign in cancelled'
        );
      });

      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'warning',
        'Google sign in failed',
        expect.stringContaining('Error'),
      );
      expect(result.current.currentUser).toBeNull();
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      const testUser = createTestUser({ email: 'test@example.com' });
      mockAuthService.logout.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(testUser);
      });

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(result.current.currentUser).toBeNull();
      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User logged out',
        expect.stringContaining('test@example.com'),
        testUser
      );
    });

    it('should handle logout errors', async () => {
      const testUser = createTestUser();
      const error = new Error('Logout failed');
      mockAuthService.logout.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(testUser);
      });

      // Attempt logout
      await act(async () => {
        await expect(result.current.logout()).rejects.toThrow('Logout failed');
      });

      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'error',
        'Logout failed',
        expect.stringContaining('Error'),
        testUser
      );
    });

    it('should handle logout when no user is logged in', async () => {
      mockAuthService.logout.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.logout();
      });

      expect(mockAuthService.logout).toHaveBeenCalledTimes(1);
      expect(loggingService.logAuth).toHaveBeenCalledWith(
        'info',
        'User logged out',
        expect.any(String),
        null
      );
    });
  });

  describe('refreshUser', () => {
    it('should refresh current user data', async () => {
      const initialUser = createTestUser({ displayName: 'Old Name' });
      const updatedUser = createTestUser({ displayName: 'New Name' });

      mockAuthService.getCurrentUser.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback?.(initialUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(initialUser);
      });

      // Refresh user
      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result.current.currentUser).toEqual(updatedUser);
    });

    it('should handle refresh when no user is logged in', async () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.refreshUser();
      });

      expect(mockAuthService.getCurrentUser).not.toHaveBeenCalled();
      expect(result.current.currentUser).toBeNull();
    });

    it('should handle refresh errors gracefully', async () => {
      const testUser = createTestUser();
      const error = new Error('Failed to refresh user');
      mockAuthService.getCurrentUser.mockRejectedValue(error);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(testUser);
      });

      // Attempt refresh
      await act(async () => {
        await result.current.refreshUser();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error refreshing user:', error);
      expect(result.current.currentUser).toEqual(testUser); // Should keep old user

      consoleSpy.mockRestore();
    });

    it('should not update user if refresh returns null', async () => {
      const testUser = createTestUser();
      mockAuthService.getCurrentUser.mockResolvedValue(null);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(testUser);
      });

      // Refresh user
      await act(async () => {
        await result.current.refreshUser();
      });

      expect(result.current.currentUser).toEqual(testUser); // Should keep old user
    });
  });

  describe('linkEmailPassword', () => {
    it('should link email and password to account', async () => {
      const testUser = createTestUser();
      const updatedUser = createTestUser({ email: 'updated@example.com' });

      mockAuthService.linkEmailPassword.mockResolvedValue();
      mockAuthService.getCurrentUser.mockResolvedValue(updatedUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Set initial user
      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.currentUser).toEqual(testUser);
      });

      // Link email password
      await act(async () => {
        await result.current.linkEmailPassword('newpassword123');
      });

      expect(mockAuthService.linkEmailPassword).toHaveBeenCalledWith('newpassword123');
      expect(mockAuthService.getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result.current.currentUser).toEqual(updatedUser);
    });

    it('should handle link errors', async () => {
      const error = new Error('Link failed');
      mockAuthService.linkEmailPassword.mockRejectedValue(error);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await expect(
          result.current.linkEmailPassword('password123')
        ).rejects.toThrow('Link failed');
      });
    });
  });

  describe('getSignInMethods', () => {
    it('should return sign in methods for email', async () => {
      const methods = ['password', 'google.com'];
      mockAuthService.getSignInMethods.mockResolvedValue(methods);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      let methodsResult: string[] | undefined;
      await act(async () => {
        methodsResult = await result.current.getSignInMethods('test@example.com');
      });

      expect(mockAuthService.getSignInMethods).toHaveBeenCalledWith('test@example.com');
      expect(methodsResult).toEqual(methods);
    });

    it('should return empty array for non-existent email', async () => {
      mockAuthService.getSignInMethods.mockResolvedValue([]);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      let methodsResult: string[] | undefined;
      await act(async () => {
        methodsResult = await result.current.getSignInMethods('nonexistent@example.com');
      });

      expect(methodsResult).toEqual([]);
    });
  });

  describe('canCreateContent', () => {
    it('should return true for admin users', () => {
      const adminUser = createTestUser({ role: UserRole.Admin });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(adminUser);
      });

      waitFor(() => {
        expect(result.current.canCreateContent()).toBe(true);
      });
    });

    it('should return true for secretary users', () => {
      const secretaryUser = createTestUser({ role: UserRole.Secretary });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(secretaryUser);
      });

      waitFor(() => {
        expect(result.current.canCreateContent()).toBe(true);
      });
    });

    it('should return false for member users', () => {
      const memberUser = createTestUser({ role: UserRole.Member });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(memberUser);
      });

      waitFor(() => {
        expect(result.current.canCreateContent()).toBe(false);
      });
    });

    it('should return false when no user is logged in', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(null);
      });

      waitFor(() => {
        expect(result.current.canCreateContent()).toBe(false);
      });
    });
  });

  describe('isProfessional', () => {
    it('should return true for professional users', () => {
      const professionalUser = createTestUser({ role: UserRole.Professional });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(professionalUser);
      });

      waitFor(() => {
        expect(result.current.isProfessional()).toBe(true);
      });
    });

    it('should return false for non-professional users', () => {
      const adminUser = createTestUser({ role: UserRole.Admin });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(adminUser);
      });

      waitFor(() => {
        expect(result.current.isProfessional()).toBe(false);
      });
    });

    it('should return false when no user is logged in', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(null);
      });

      waitFor(() => {
        expect(result.current.isProfessional()).toBe(false);
      });
    });
  });

  describe('canAccessSystem', () => {
    it('should return true for approved users', () => {
      const approvedUser = createTestUser({ status: UserStatus.Approved });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(approvedUser);
      });

      waitFor(() => {
        expect(result.current.canAccessSystem()).toBe(true);
      });
    });

    it('should return false for pending users', () => {
      const pendingUser = createTestUser({ status: UserStatus.Pending });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(pendingUser);
      });

      waitFor(() => {
        expect(result.current.canAccessSystem()).toBe(false);
      });
    });

    it('should return false for rejected users', () => {
      const rejectedUser = createTestUser({ status: UserStatus.Rejected });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(rejectedUser);
      });

      waitFor(() => {
        expect(result.current.canAccessSystem()).toBe(false);
      });
    });

    it('should return false for suspended users', () => {
      const suspendedUser = createTestUser({ status: UserStatus.Suspended });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(suspendedUser);
      });

      waitFor(() => {
        expect(result.current.canAccessSystem()).toBe(false);
      });
    });

    it('should return false when no user is logged in', () => {
      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(null);
      });

      waitFor(() => {
        expect(result.current.canAccessSystem()).toBe(false);
      });
    });
  });

  describe('backward compatibility', () => {
    it('should expose user property as alias for currentUser', async () => {
      const testUser = createTestUser();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      act(() => {
        authStateChangeCallback?.(testUser);
      });

      await waitFor(() => {
        expect(result.current.user).toEqual(result.current.currentUser);
        expect(result.current.user).toEqual(testUser);
      });
    });

    it('should keep user and currentUser in sync', async () => {
      const testUser = createTestUser();
      mockAuthService.login.mockResolvedValue(testUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.user).toEqual(result.current.currentUser);
      expect(result.current.user).toEqual(testUser);
    });
  });

  describe('integration scenarios', () => {
    it('should handle complete user authentication flow', async () => {
      const testUser = createTestUser();
      mockAuthService.login.mockResolvedValue(testUser);
      mockAuthService.logout.mockResolvedValue();

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Initially no user
      expect(result.current.currentUser).toBeNull();

      // Login
      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.currentUser).toEqual(testUser);
      expect(result.current.canAccessSystem()).toBe(true);

      // Logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.canAccessSystem()).toBe(false);
    });

    it('should handle user registration and immediate access', async () => {
      const newUser = createTestUser({
        email: 'newuser@example.com',
        status: UserStatus.Approved
      });
      mockAuthService.register.mockResolvedValue(newUser);

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      await act(async () => {
        await result.current.register(
          'newuser@example.com',
          'password123',
          'New User'
        );
      });

      expect(result.current.currentUser).toEqual(newUser);
      expect(result.current.canAccessSystem()).toBe(true);
    });

    it('should handle role-based permissions correctly', async () => {
      const adminUser = createTestUser({ role: UserRole.Admin });
      const memberUser = createTestUser({ role: UserRole.Member });

      const { result } = renderHook(() => useAuth(), {
        wrapper: AuthProvider,
      });

      // Admin user
      act(() => {
        authStateChangeCallback?.(adminUser);
      });

      await waitFor(() => {
        expect(result.current.canCreateContent()).toBe(true);
        expect(result.current.isProfessional()).toBe(false);
      });

      // Switch to member user
      act(() => {
        authStateChangeCallback?.(memberUser);
      });

      await waitFor(() => {
        expect(result.current.canCreateContent()).toBe(false);
        expect(result.current.isProfessional()).toBe(false);
      });
    });
  });
});
