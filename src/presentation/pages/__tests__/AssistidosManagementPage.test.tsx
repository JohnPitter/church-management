// Unit Tests - AssistidosManagementPage
// Comprehensive tests for assistidos (assisted persons) management page component

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssistidosManagementPage from '../AssistidosManagementPage';
import {
  Assistido,
  StatusAssistido,
  NecessidadeAssistido,
  TipoAtendimento
} from '@modules/assistance/assistidos/domain/entities/Assistido';

// ============================================================================
// Mock Setup
// ============================================================================

// Mock AuthContext
const mockCurrentUser = {
  id: 'user-1',
  email: 'admin@church.com',
  displayName: 'Admin User',
  photoURL: 'https://example.com/photo.jpg',
  role: 'admin',
  status: 'approved'
};

const mockAuthContext = {
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
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthContext
}));

// Mock SettingsContext
const mockSettings = {
  primaryColor: '#3B82F6',
  churchName: 'Test Church',
  id: 'settings-1',
  logoUrl: 'https://example.com/logo.png'
};

const mockSettingsContext = {
  settings: mockSettings,
  loading: false,
  updateSettings: jest.fn(),
  refreshSettings: jest.fn()
};

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockSettingsContext
}));