import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';
import { UserRole, UserStatus } from '@/domain/entities/User';
import PedagogyManagementPage from '../PedagogyManagementPage';
import mockInstrument from '../../../../functions/src/pedagogy/instrument.json';

jest.mock('react-chartjs-2', () => ({ Line: () => null, Bar: () => null }));
jest.mock('@modules/pedagogy/application/services/DevelopmentEvaluationService', () => ({
  developmentEvaluationService: {
    getInstrument: () => Promise.resolve(mockInstrument),
    report: () => Promise.resolve({ records: [], evolution: [], studentCount: 0, methodology: '' })
  }
}));

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

jest.mock('../../utils/attendanceReportExport', () => ({
  generateAttendanceReportPDF: (...args: unknown[]) => mockGenerateAttendanceReportPDF(...args),
  generateAttendanceRollPDF: (...args: unknown[]) => mockGenerateAttendanceRollPDF(...args)
}));

const mockListSessions = jest.fn();
const mockListAttendanceRolls = jest.fn();
const mockGetDashboardStats = jest.fn();
const mockGenerateAttendanceReportPDF = jest.fn();
const mockGenerateAttendanceRollPDF = jest.fn();

jest.mock('@modules/pedagogy/application/services/PedagogyService', () => ({
  pedagogyService: {
    listGuidelines: jest.fn().mockResolvedValue([]),
    listSessions: (...args: unknown[]) => mockListSessions(...args),
    listDifficulties: jest.fn().mockResolvedValue([]),
    listApplications: jest.fn().mockResolvedValue([]),
    listAllFeedback: jest.fn().mockResolvedValue([]),
    listAttendanceRolls: (...args: unknown[]) => mockListAttendanceRolls(...args),
    listRosters: jest.fn().mockResolvedValue([]),
    createRoster: jest.fn(),
    createAttendanceRoll: jest.fn(),
    getDashboardStats: (...args: unknown[]) => mockGetDashboardStats(...args),
    getTopDifficulties: jest.fn().mockReturnValue([])
  }
}));

describe('PedagogyManagementPage pending educators tab', () => {
  beforeEach(() => {
    [pedagogyService.listGuidelines, pedagogyService.listDifficulties, pedagogyService.listApplications,
      pedagogyService.listAllFeedback, pedagogyService.listRosters].forEach(method => {
      (method as jest.Mock).mockResolvedValue([]);
    });
    mockGenerateAttendanceReportPDF.mockClear();
    mockGenerateAttendanceRollPDF.mockClear();
    mockListAttendanceRolls.mockResolvedValue([]);
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

  it('abre o formulário em Avaliação e mantém consulta e exportação apenas em Relatórios', async () => {
    mockListAttendanceRolls.mockResolvedValue([{
      id: 'roll-1', organization: PedagogyOrganization.Church, educatorId: 'e1', educatorName: 'Ana',
      classGroup: 'Artes', students: [{ name: 'Maria', present: true }],
      sessionDate: new Date('2026-10-07T12:00:00Z'), createdAt: new Date(), updatedAt: new Date()
    }]);
    renderPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Avaliação' }));
    expect(await screen.findByLabelText('Chamada e turma')).toBeInTheDocument();
    userEvent.selectOptions(screen.getByLabelText('Chamada e turma'), 'roll-1');
    expect(screen.getByRole('option', { name: 'Maria' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar avaliação' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Exportar PDF' })).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Relatórios' }));
    expect(await screen.findByRole('button', { name: 'Exportar PDF' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Exportar Word' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Chamada e turma')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Salvar avaliação' })).not.toBeInTheDocument();
    expect(await screen.findByText('Nenhuma avaliação neste período e ciclo.')).toBeInTheDocument();
  });

  it('mantém Aplicação distinta dos Relatórios qualitativos', async () => {
    (pedagogyService.listApplications as jest.Mock).mockResolvedValue([{
      id: 'application-1', organization: PedagogyOrganization.Church, guidelineTitle: 'Convivência',
      educatorName: 'Ana Educadora', month: 10, year: 2026, applicationDifficulties: '',
      applicationNarrative: 'Atividade realizada em grupo.', strategies: 'Trabalho em duplas.',
      observedResults: 'Participação ampliada.'
    }]);
    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Aplicação' }));
    expect(screen.getByRole('tab', { name: 'Aplicação' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Aplicação das diretrizes')).toBeInTheDocument();
    expect(screen.getByText('Atividade realizada em grupo.')).toBeInTheDocument();
    expect(screen.queryByText('Relatório qualitativo individual e coletivo')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: 'Relatórios' }));
    expect(screen.getByRole('tab', { name: 'Relatórios' })).toHaveAttribute('aria-selected', 'true');
    expect(await screen.findByText('Relatório qualitativo individual e coletivo')).toBeInTheDocument();
    expect(screen.queryByText('Atividade realizada em grupo.')).not.toBeInTheDocument();
  });

  it('lists educators without a session record on the Pendentes tab', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Pendentes (1)' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('tab', { name: 'Pendentes (1)' }));

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

  it('opens the electronic attendance roll tab', async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Chamada' })).toBeInTheDocument();
    });

    await userEvent.click(screen.getByRole('tab', { name: 'Chamada' }));

    expect(await screen.findByText('Caderneta de chamada')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Puxar chamada' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar chamada' })).toBeInTheDocument();
  });

  it('opens the class roster tab for coordination', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Turmas' }));

    expect(await screen.findByText('Cadastrar turma')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Salvar turma' })).toBeInTheDocument();
  });

  it('exports the attendance report as PDF', async () => {
    mockListAttendanceRolls.mockResolvedValue([
      {
        id: 'r1',
        organization: PedagogyOrganization.Church,
        educatorId: 'e1',
        educatorName: 'Ana Educadora',
        classGroup: 'Turma A',
        sessionDate: new Date('2026-09-08T12:00:00'),
        students: [
          { name: 'Mariane', present: true },
          { name: 'Pedro', present: false }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Chamada' }));

    await userEvent.click(await screen.findByRole('button', { name: 'Exportar relatório PDF' }));

    expect(mockGenerateAttendanceReportPDF).toHaveBeenCalledTimes(1);
    expect(mockGenerateAttendanceReportPDF.mock.calls[0][0]).toHaveLength(1);
    expect(mockGenerateAttendanceReportPDF.mock.calls[0][1]).toBe(PedagogyOrganization.Church);
  });
});
