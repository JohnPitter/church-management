import { ReportsService } from '../ReportsService';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  Timestamp: {
    fromDate: jest.fn()
  },
  getCountFromServer: jest.fn()
}));

const firestore = jest.requireMock('firebase/firestore');
const mockCollection = firestore.collection as jest.Mock;
const mockGetDocs = firestore.getDocs as jest.Mock;
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;
const mockGetCountFromServer = firestore.getCountFromServer as jest.Mock;

describe('ReportsService', () => {
  let service: ReportsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ReportsService();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockTimestampFromDate.mockImplementation((date: Date) => ({ toDate: () => date }));
  });

  it('generates user, event, project and engagement sections', async () => {
    mockGetCountFromServer
      .mockResolvedValueOnce({ data: () => ({ count: 100 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 10 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 25 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 110 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 15 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 30 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 2 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 3 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 4 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 1 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 1 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 2 }) })
      .mockResolvedValueOnce({ data: () => ({ count: 5 }) });

    mockGetDocs
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ maxParticipants: 30, category: 'Conferência' }) },
          { data: () => ({ maxParticipants: 50, category: { name: 'Workshop' } }) }
        ]
      })
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ budget: 1000, participants: ['a', 'b'] }) },
          { data: () => ({ budget: 500, participants: ['c'] }) }
        ]
      })
      .mockResolvedValueOnce({
        docs: [
          { data: () => ({ views: 100 }) },
          { data: () => ({ views: 40 }) }
        ]
      });

    const userGrowth = await (service as any).getUserGrowthData(2);
    const eventStats = await (service as any).getEventStats(2);
    const projectStats = await (service as any).getProjectStats();
    const engagementStats = await (service as any).getEngagementStats();

    expect(userGrowth).toHaveLength(2);
    expect(userGrowth[0]).toEqual(expect.objectContaining({ totalUsers: 100, newUsers: 10, activeUsers: 25 }));
    expect(userGrowth[1]).toEqual(expect.objectContaining({ totalUsers: 110, newUsers: 15, activeUsers: 30 }));
    expect(eventStats).toEqual(
      expect.objectContaining({
        totalEvents: 2,
        avgAttendance: 40,
        monthlyEvents: expect.arrayContaining([
          expect.objectContaining({ count: 2 }),
          expect.objectContaining({ count: 3 })
        ])
      })
    );
    expect(eventStats.popularCategories).toEqual(
      expect.arrayContaining([
        { name: 'Conferência', count: 1 },
        { name: 'Workshop', count: 1 }
      ])
    );
    expect(projectStats).toEqual({
      totalProjects: 4,
      activeProjects: 1,
      completedProjects: 1,
      totalBudget: 1500,
      totalParticipants: 3
    });
    expect(engagementStats).toEqual({
      blogViews: 140,
      blogPosts: 2,
      forumPosts: 0,
      avgSessionTime: 'N/A'
    });
  });

  it('exports report data as blobs and wraps generation errors', async () => {
    const data = {
      userGrowth: [],
      eventStats: { totalEvents: 0, avgAttendance: 0, popularCategories: [], monthlyEvents: [] },
      projectStats: { totalProjects: 0, activeProjects: 0, completedProjects: 0, totalBudget: 0, totalParticipants: 0 },
      engagementStats: { blogViews: 0, blogPosts: 0, forumPosts: 0, avgSessionTime: 'N/A' }
    };

    const pdfBlob = await service.exportReport('pdf', data);
    const excelBlob = await service.exportReport('excel', data);

    expect(pdfBlob).toBeInstanceOf(Blob);
    expect(excelBlob).toBeInstanceOf(Blob);

    jest.spyOn(service as any, 'getUserGrowthData').mockRejectedValueOnce(new Error('count failed'));
    jest.spyOn(service as any, 'getEventStats').mockResolvedValueOnce(data.eventStats);
    jest.spyOn(service as any, 'getProjectStats').mockResolvedValueOnce(data.projectStats);
    jest.spyOn(service as any, 'getEngagementStats').mockResolvedValueOnce(data.engagementStats);
    await expect(service.generateReportData(1)).rejects.toThrow('Erro ao gerar dados do relatório');
  });
});
