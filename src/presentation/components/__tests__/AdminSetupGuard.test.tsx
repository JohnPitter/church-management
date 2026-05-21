import React from 'react';
import { render, screen } from '@testing-library/react';
import AdminSetupGuard from '../AdminSetupGuard';

const mockUseAdminCheck = jest.fn();

jest.mock('../../hooks/useAdminCheck', () => ({
  useAdminCheck: () => mockUseAdminCheck(),
}));

jest.mock('../../pages/SetupPage', () => ({
  __esModule: true,
  default: () => <div>Setup Page Mock</div>,
}));

describe('AdminSetupGuard', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('mostra loading enquanto verifica a configuracao', () => {
    mockUseAdminCheck.mockReturnValue({
      hasAdmin: false,
      loading: true,
      error: null,
    });

    render(
      <AdminSetupGuard>
        <div>Conteudo Protegido</div>
      </AdminSetupGuard>
    );

    expect(screen.getByText('Verificando configuração do sistema...')).toBeInTheDocument();
  });

  it('mostra a tela de setup quando nao existe admin', () => {
    mockUseAdminCheck.mockReturnValue({
      hasAdmin: false,
      loading: false,
      error: new Error('missing'),
    });

    render(
      <AdminSetupGuard>
        <div>Conteudo Protegido</div>
      </AdminSetupGuard>
    );

    expect(screen.getByText('Setup Page Mock')).toBeInTheDocument();
  });

  it('renderiza o conteudo quando ja existe admin', () => {
    mockUseAdminCheck.mockReturnValue({
      hasAdmin: true,
      loading: false,
      error: null,
    });

    render(
      <AdminSetupGuard>
        <div>Conteudo Protegido</div>
      </AdminSetupGuard>
    );

    expect(screen.getByText('Conteudo Protegido')).toBeInTheDocument();
  });
});
