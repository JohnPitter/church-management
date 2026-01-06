// Presentation Hook - useAuth
// Clean implementation following Clean Architecture principles

import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, UserEntity } from '@/domain/entities/User';
import { getLoginUseCase, getRegisterUseCase, getUserRepository } from '../../infrastructure/di/container';
import { auth } from '@/config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

interface LoginParams {
  email: string;
  password: string;
}

interface RegisterParams {
  email: string;
  password: string;
  confirmPassword: string;
  displayName: string;
}

export const useAuth = () => {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null
  });

  const navigate = useNavigate();
  const loginUseCase = getLoginUseCase();
  const registerUseCase = getRegisterUseCase();

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Get full user data from Firestore
          const userRepository = getUserRepository();
          const user = await userRepository.findById(firebaseUser.uid);
          
          setState({
            user,
            loading: false,
            error: null
          });
        } catch (error) {
          setState({
            user: null,
            loading: false,
            error: 'Erro ao carregar dados do usuário'
          });
        }
      } else {
        setState({
          user: null,
          loading: false,
          error: null
        });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login method
  const login = useCallback(async (params: LoginParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await loginUseCase.execute(params);
      
      setState({
        user: result.user,
        loading: false,
        error: null
      });

      // Navigate based on user role
      if (UserEntity.isAdmin(result.user)) {
        navigate('/admin');
      } else {
        navigate('/painel');
      }

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao fazer login'
      }));
      throw error;
    }
  }, [loginUseCase, navigate]);

  // Register method
  const register = useCallback(async (params: RegisterParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const result = await registerUseCase.execute(params);
      
      setState({
        user: result.user,
        loading: false,
        error: null
      });

      return result;
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error.message || 'Erro ao criar conta'
      }));
      throw error;
    }
  }, [registerUseCase]);

  // Logout method
  const logout = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));

    try {
      await auth.signOut();
      
      setState({
        user: null,
        loading: false,
        error: null
      });

      navigate('/login');
    } catch (error: any) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Erro ao sair'
      }));
      throw error;
    }
  }, [navigate]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    error: state.error,
    login,
    register,
    logout,
    clearError,
    isAuthenticated: !!state.user,
    isAdmin: state.user ? UserEntity.isAdmin(state.user) : false,
    isSecretary: state.user ? UserEntity.isSecretary(state.user) : false,
    isMember: state.user ? UserEntity.isMember(state.user) : false,
    canApproveUsers: state.user ? UserEntity.canApproveUsers(state.user) : false,
    canCreateContent: state.user ? UserEntity.canCreateContent(state.user) : false,
    canManageFinances: state.user ? UserEntity.canManageFinances(state.user) : false
  };
};