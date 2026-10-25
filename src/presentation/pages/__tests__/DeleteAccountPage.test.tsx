// Unit Tests - Delete Account Page

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DeleteAccountPage } from '../DeleteAccountPage';
import { UserRole, UserStatus } from '@/domain/entities/User';

const mockFirebaseAuth: { currentUser: any } = { currentUser: null };
jest.mock('@/config/firebase', () => ({
  get auth() {
    return mockFirebaseAuth;
  }
}));

const mockReauthenticateWithCredential = jest.fn();
const mockReauthenticateWithPopup = jest.fn();
const mockCredential = jest.fn((email: string, password: string) => ({ email, password }));
jest.mock('firebase/auth', () => ({
  EmailAuthProvider: { credential: (email: string, password: string) => mockCredential(email, password) },
  GoogleAuthProvider: jest.fn(),
  reauthenticateWithCredential: (...args: any[]) => mockReauthenticateWithCredential(...args),
  reauthenticateWithPopup: (...args: any[]) => mockReauthenticateWithPopup(...args)
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { success: jest.fn(), error: jest.fn() }
}));

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}));

const mockDeleteAccount = jest.fn();
const mockGetIdToken = jest.fn();
let mockAuthState: any;
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockAuthState
}));

const loggedUser = {
  id: 'u1',
  email: 'ana@example.com',
  displayName: 'Ana',
  role: UserRole.Member,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date()
};

const renderPage = () =>
  render(
    <MemoryRouter>
      <DeleteAccountPage />
    </MemoryRouter>
  );

const submitButton = () => screen.getByRole('button', { name: /excluir minha conta permanentemente/i });

describe('DeleteAccountPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthState = { currentUser: loggedUser, loading: false, deleteAccount: mockDeleteAccount };
    mockFirebaseAuth.currentUser = {
      uid: 'u1',
      email: 'ana@example.com',
      providerData: [{ providerId: 'password' }],
      getIdToken: mockGetIdToken
    };
    mockGetIdToken.mockResolvedValue('fresh-token');
    // CRA's jest config uses resetMocks, so implementations are set per test.
    mockCredential.mockImplementation((email: string, password: string) => ({ email, password }));
    mockReauthenticateWithCredential.mockResolvedValue(undefined);
    mockReauthenticateWithPopup.mockResolvedValue(undefined);
    mockDeleteAccount.mockResolvedValue(undefined);
  });

  it('shows the explanation and a login button for logged-out visitors', () => {
    mockAuthState = { currentUser: null, loading: false, deleteAccount: mockDeleteAccount };
    mockFirebaseAuth.currentUser = null;
    renderPage();

    expect(screen.getByRole('heading', { name: 'Excluir minha conta' })).toBeInTheDocument();
    expect(screen.getByText('O que é apagado')).toBeInTheDocument();
    expect(screen.getByText('O que é anonimizado')).toBeInTheDocument();
    expect(screen.getByText('O que é mantido')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Política de Privacidade' })).toHaveAttribute('href', '/privacidade');
    expect(screen.queryByLabelText(/digite/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Entrar para excluir minha conta' }));
    expect(mockNavigate).toHaveBeenCalledWith('/login', { state: { from: '/excluir-conta' } });
  });

  it('keeps the delete button disabled until the exact confirmation word is typed', () => {
    renderPage();
    expect(screen.getByText(/permanente e não pode ser desfeita/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'secret123' } });
    const confirmation = screen.getByLabelText(/para confirmar/i);

    expect(submitButton()).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: 'excluir' } });
    expect(submitButton()).toBeDisabled();
    fireEvent.change(confirmation, { target: { value: 'EXCLUI' } });
    expect(submitButton()).toBeDisabled();

    fireEvent.submit(submitButton().closest('form')!);
    expect(mockDeleteAccount).not.toHaveBeenCalled();

    fireEvent.change(confirmation, { target: { value: 'EXCLUIR' } });
    expect(submitButton()).toBeEnabled();
  });

  it('requires the password for password accounts', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    expect(submitButton()).toBeDisabled();
  });

  it('re-authenticates with the password, deletes the account and navigates to the confirmation page', async () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/conta-excluida', { replace: true }));
    expect(mockCredential).toHaveBeenCalledWith('ana@example.com', 'secret123');
    expect(mockReauthenticateWithCredential).toHaveBeenCalledWith(mockFirebaseAuth.currentUser, { email: 'ana@example.com', password: 'secret123' });
    expect(mockDeleteAccount).toHaveBeenCalledTimes(1);
    expect(mockGetIdToken).toHaveBeenCalledWith(true);
    // reauthenticate -> force token refresh (fresh auth_time) -> callable
    expect(mockReauthenticateWithCredential.mock.invocationCallOrder[0]).toBeLessThan(mockGetIdToken.mock.invocationCallOrder[0]);
    expect(mockGetIdToken.mock.invocationCallOrder[0]).toBeLessThan(mockDeleteAccount.mock.invocationCallOrder[0]);
  });

  it('asks to confirm identity again when the server refuses an old login', async () => {
    mockDeleteAccount.mockRejectedValue(Object.assign(new Error('Por segurança, confirme sua senha'), {
      code: 'functions/unauthenticated',
      details: { reason: 'recent-login-required' }
    }));
    renderPage();
    fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    fireEvent.click(submitButton());

    expect(await screen.findByText(/sua confirmação de identidade expirou/i)).toBeInTheDocument();
    expect(screen.queryByText('Não é possível excluir o último administrador')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Confirme sua senha')).toHaveValue('');
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('re-authenticates Google-only accounts with a popup (no password field)', async () => {
    mockFirebaseAuth.currentUser.providerData = [{ providerId: 'google.com' }];
    renderPage();
    expect(screen.queryByLabelText('Confirme sua senha')).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    fireEvent.click(submitButton());

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/conta-excluida', { replace: true }));
    expect(mockReauthenticateWithPopup).toHaveBeenCalledTimes(1);
    expect(mockReauthenticateWithCredential).not.toHaveBeenCalled();
  });

  it('shows a wrong-password error and does not delete', async () => {
    mockReauthenticateWithCredential.mockRejectedValue({ code: 'auth/invalid-credential' });
    renderPage();
    fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'bad' } });
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    fireEvent.click(submitButton());

    expect(await screen.findByText('Senha incorreta. Verifique e tente novamente.')).toBeInTheDocument();
    expect(mockDeleteAccount).not.toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('shows the last-admin error clearly and stays on the page', async () => {
    const message = 'Você é o último administrador do sistema. Promova outro usuário a administrador antes de excluir sua conta.';
    mockDeleteAccount.mockRejectedValue(Object.assign(new Error(message), {
      code: 'functions/failed-precondition',
      details: { reason: 'last-admin' }
    }));
    renderPage();
    fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    fireEvent.click(submitButton());

    expect(await screen.findByText('Não é possível excluir o último administrador')).toBeInTheDocument();
    expect(screen.getByText(message)).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(submitButton()).toBeEnabled();
  });

  it('shows a generic error when the deletion fails', async () => {
    mockDeleteAccount.mockRejectedValue(Object.assign(new Error('Não foi possível concluir a exclusão da sua conta.'), { code: 'functions/internal' }));
    renderPage();
    fireEvent.change(screen.getByLabelText('Confirme sua senha'), { target: { value: 'secret123' } });
    fireEvent.change(screen.getByLabelText(/para confirmar/i), { target: { value: 'EXCLUIR' } });
    fireEvent.click(submitButton());

    expect(await screen.findByText('Não foi possível concluir a exclusão da sua conta.')).toBeInTheDocument();
    expect(screen.queryByText('Não é possível excluir o último administrador')).not.toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
