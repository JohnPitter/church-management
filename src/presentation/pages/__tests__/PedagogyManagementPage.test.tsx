import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { UserRole, UserStatus } from '@/domain/entities/User';
import PedagogyManagementPage from '../PedagogyManagementPage';

jest.mock('@/config/firebase', () => ({
  db: {},
  auth: {},
  storage: {}
}));

jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: { error: jest.fn(), success: jest.fn() }
}));

const mockCurrentUser = {
  id: 'coord-1',
  email: 'coord@example.com',
  displayName: 'Coordenação',
  role: UserRole.Admin,
  status: UserStatus.Approved,
  createdAt: new Date(),
  updatedAt: new Date()
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser,
    user: mockCurrentUser,
    loading: false
  })
}));

jest.mock('@modules/user-management/users/infrastructure/repositories/FirebaseUserRepository', () => ({
  FirebaseUserRepository: class {
    findByRole() {
      return Promise.resolve([
        {
          id: 'e1',
          email: 'ana@example.com',
          displayName: 'Ana Educadora',
          role: 'educator',
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'e2',
          email: 'bruno@example.com',
          displayName: 'Bruno Educador',
          role: 'educator',
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ]);
    }
  }
}));

const mockListSessions = jest.fn();
const mockGetDashboardStats = jest.fn();

jest.mock('@modules/pedagogy/application/services/PedagogyService', () => ({
  pedagogyService: {
    listGuidelines: jest.fn().mockResolvedValue([]),
    listSessions: (...args: unknown[]) => mockListSessions(...args),
    listDifficulties: jest.fn().mockResolvedValue([]),
    listApplications: jest.fn().mockResolvedValue([]),
    listAllFeedback: jest.fn().mockResolvedValue([]),
    getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
    getTopDifficulties: jest.fn().mockReturnValue([])
  }
}));

describe('PedagogyManagementPage pending educators tab', () => {
  beforeEach(() => {
    mockListSessions.mockResolvedValue([
      {
        id: 's1',
        organization: PedagogyOrganization.Church,
        educatorId: 'e2',
        educatorName: 'Bruno Educador',
        classGroup: 'Turma A',
        sessionDate: new Date('2026-08-20'),
        totalStudents: 10,
        presentCount: 8,
        engagedCount: 6,
        lowEngagementCount: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    mockGetDashboardStats.mockResolvedValue({
      studentsServed: 10,
      averageAttendance: 80,
      averageEngagement: 75,
      studentsNeedingFollowup: 0,
      educatorsWithPendingRecords: 1,
      activeGuidelineTitle: 'Diretriz vigente'
    });
  });

  const renderPage = () =>
    render(
      <MemoryRouter initialEntries={['/admin/pedagogia']}>
        <PedagogyManagementPage />
      </MemoryRouter>
    );

  it('lists educators without a session record on the Pendentes tab', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Pendentes (1)' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: 'Pendentes (1)' }));

    expect(await screen.findByText('Ana Educadora')).toBeInTheDocument();
    expect(screen.getByText('ana@example.com')).toBeInTheDocument();
    expect(screen.queryByText('Bruno Educador')).not.toBeInTheDocument();
  });

  it('opens the pending list from the dashboard card', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText('Arte-educadores com registros pendentes')).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('button', { name: /Arte-educadores com registros pendentes/i }));

    expect(await screen.findByText('Ana Educadora')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Enviar orientação' })).toBeInTheDocument();
  });
});
