// Presentation Component - LoginForm
// Clean component following SOLID principles

import React, { useState, FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LoginFormInput } from './LoginFormInput';
import { ErrorMessage } from '../common/ErrorMessage';
import { LoadingButton } from '../common/LoadingButton';

export const LoginForm: React.FC = () => {
  const { login, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await login(formData);
    } catch (error) {
      // Error is handled by the hook
    }
  };

  const handleChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
  };

  const isFormValid = formData.email && formData.password;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <LoginFormInput
        id="email"
        type="email"
        label="Email"
        value={formData.email}
        onChange={handleChange('email')}
        required
        autoComplete="email"
        placeholder="seu@email.com"
      />

      <LoginFormInput
        id="password"
        type="password"
        label="Senha"
        value={formData.password}
        onChange={handleChange('password')}
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />

      {error && <ErrorMessage message={error} />}

      <LoadingButton
        type="submit"
        loading={loading}
        disabled={!isFormValid}
        fullWidth
      >
        Entrar
      </LoadingButton>

      <div className="text-sm text-center">
        <span className="text-gray-600">Não tem uma conta? </span>
        <Link
          to="/register"
          className="font-medium text-indigo-600 hover:text-indigo-500"
        >
          Criar conta
        </Link>
      </div>
    </form>
  );
};