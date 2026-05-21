import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { PublicRoute } from '../PublicRoute';
import { PermissionAction, SystemModule } from '../../../domain/entities/Permission';

const mockUseAuth = jest.fn();
const mockHasPermission = jest.fn();
const mockGetPublicPageConfigs = jest.fn();

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
}));

jest.mock('@modules/content-management/public-pages/application/services/PublicPageService', () => ({
  PublicPageService: class {
    getPublicPageConfigs = mockGetPublicPageConfigs;
  },
}));

jest.mock('../common/LoadingSpinner', () => ({
  LoadingSpinner: () => <div>Loading Spinner</div>,
}));

const renderRoute = (props: Partial<React.ComponentProps<typeof PublicRoute>> = {}) =>
  render(
    <MemoryRouter initialEntries={['/current']}>
      <Routes>
        <Route
          path="/current"
          element={
            <PublicRoute publicPage={'home' as any} {...props}>
              <div>Protected Content</div>
            </PublicRoute>
          }
        />
        <Route path="/login" element={<div>Login Page</div>} />
        <Route path="/pending-approval" element={<div>Pending Approval</div>} />
        <Route path="/painel" element={<div>Painel Page</div>} />
      </Routes>
    </MemoryRouter>
  );

describe('PublicRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ user: null, loading: false });
    mockHasPermission.mockReturnValue(true);
    mockGetPublicPageConfigs.mockResolvedValue([{ page: 'home', isPublic: true }]);
  });

  it('mostra loading enquanto auth ou public config carregam', () => {
    mockUseAuth.mockReturnValue({ user: null, loading: true });
    renderRoute();

    expect(screen.getByText('Loading Spinner')).toBeInTheDocument();
  });

  it('renderiza children quando a pagina e publica', async () => {
    renderRoute();
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });

  it('redireciona para login quando a pagina nao e publica e nao ha usuario', async () => {
    mockGetPublicPageConfigs.mockResolvedValue([{ page: 'home', isPublic: false }]);
    renderRoute();
    expect(await screen.findByText('Login Page')).toBeInTheDocument();
  });

  it('redireciona para aprovacao pendente quando usuario nao esta aprovado', async () => {
    mockGetPublicPageConfigs.mockResolvedValue([{ page: 'home', isPublic: false }]);
    mockUseAuth.mockReturnValue({ user: { status: 'pending', role: 'member' }, loading: false });
    renderRoute();
    expect(await screen.findByText('Pending Approval')).toBeInTheDocument();
  });

  it('respeita permissao de modulo e acesso admin', async () => {
    mockGetPublicPageConfigs.mockResolvedValue([{ page: 'home', isPublic: false }]);
    mockUseAuth.mockReturnValue({ user: { status: 'approved', role: 'member' }, loading: false });
    mockHasPermission.mockReturnValue(false);
    renderRoute({ requireModule: SystemModule.Events, requireAction: PermissionAction.View });
    expect(await screen.findByText('Painel Page')).toBeInTheDocument();

    mockUseAuth.mockReturnValue({ user: { status: 'approved', role: 'admin' }, loading: false });
    renderRoute({
      requireModule: SystemModule.Events,
      requireAction: PermissionAction.View,
      allowAdminAccess: true,
    });
    expect(await screen.findByText('Protected Content')).toBeInTheDocument();
  });
});
