// Presentation Context - Auth Context
// Clean implementation using Clean Architecture

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserEntity } from '../../domain/entities/User';
import { container } from '../../infrastructure/di/container';
import type { IAuthService } from '@modules/user-management/auth/domain/services/IAuthService';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';

interface AuthContextType {
  currentUser: User | null;
  user: User | null;  // For backward compatibility
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string, displayName: string) => Promise<User>;
  signInWithGoogle: () => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  canCreateContent: () => boolean;
  isProfessional: () => boolean;
  canAccessSystem: () => boolean;
  linkEmailPassword: (password: string) => Promise<void>;
  getSignInMethods: (email: string) => Promise<string[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const authService = container.get('IAuthService') as IAuthService;

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((user) => {
      setCurrentUser(user);
      // Set user context in logging service
      loggingService.setUserContext(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [authService]);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const user = await authService.login(email, password);
      setCurrentUser(user);
      await loggingService.logAuth('info', 'User logged in successfully', `Email: ${email}, Role: ${user.role}`, user);
      return user;
    } catch (error) {
      await loggingService.logAuth('warning', 'Failed login attempt', `Email: ${email}, Error: ${error}`);
      throw error;
    }
  };

  const register = async (email: string, password: string, displayName: string): Promise<User> => {
    try {
      const user = await authService.register(email, password, displayName);
      setCurrentUser(user);
      await loggingService.logAuth('info', 'User registered successfully', `Email: ${email}, Name: ${displayName}`, user);
      return user;
    } catch (error) {
      await loggingService.logAuth('error', 'Registration failed', `Email: ${email}, Error: ${error}`);
      throw error;
    }
  };

  const signInWithGoogle = async (): Promise<User> => {
    try {
      const user = await authService.signInWithGoogle();
      setCurrentUser(user);
      await loggingService.logAuth('info', 'User signed in with Google', `Email: ${user.email}, Role: ${user.role}`, user);
      return user;
    } catch (error) {
      await loggingService.logAuth('warning', 'Google sign in failed', `Error: ${error}`);
      throw error;
    }
  };

  const logout = async (): Promise<void> => {
    const userEmail = currentUser?.email;
    try {
      await authService.logout();
      setCurrentUser(null);
      await loggingService.logAuth('info', 'User logged out', `Email: ${userEmail}`, currentUser);
    } catch (error) {
      await loggingService.logAuth('error', 'Logout failed', `Email: ${userEmail}, Error: ${error}`, currentUser);
      throw error;
    }
  };

  const linkEmailPassword = async (password: string): Promise<void> => {
    await authService.linkEmailPassword(password);
    // Refresh user data after linking
    await refreshUser();
  };

  const getSignInMethods = async (email: string): Promise<string[]> => {
    return await authService.getSignInMethods(email);
  };

  const canCreateContent = (): boolean => {
    if (!currentUser) return false;
    return UserEntity.canCreateContent(currentUser);
  };


  const isProfessional = (): boolean => {
    if (!currentUser) return false;
    return currentUser.role === 'professional';
  };

  const canAccessSystem = (): boolean => {
    if (!currentUser) return false;
    return UserEntity.canAccessSystem(currentUser);
  };

  const refreshUser = async (): Promise<void> => {
    if (!currentUser) return;
    try {
      const refreshedUser = await authService.getCurrentUser();
      if (refreshedUser) {
        setCurrentUser(refreshedUser);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
    }
  };

  const value: AuthContextType = {
    currentUser,
    user: currentUser, // For backward compatibility
    loading,
    login,
    register,
    signInWithGoogle,
    logout,
    refreshUser,
    canCreateContent,
    isProfessional,
    canAccessSystem,
    linkEmailPassword,
    getSignInMethods
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};