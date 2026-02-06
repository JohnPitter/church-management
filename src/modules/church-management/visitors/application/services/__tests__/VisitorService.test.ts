// Unit Tests - VisitorService
// Comprehensive tests for Visitor Service application layer

import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  writeBatch,
  increment,
  DocumentSnapshot,
  QuerySnapshot,
  DocumentReference,
  WriteBatch
} from 'firebase/firestore';
import {
  Visitor,
  VisitorStatus,
  FollowUpStatus,
  ContactAttempt,
  ContactType,
  ContactMethod,
  ServiceType
} from '../../../domain/entities/Visitor';
import { VisitorFilters } from '../../../infrastructure/persistence/FirebaseVisitorRepository';

// Import service after mocking
import { visitorService } from '../../../infrastructure/persistence/FirebaseVisitorRepository';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('config/firebase', () => ({
  db: {}
}));

// Mock implementations
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockLimit = limit as jest.MockedFunction<typeof limit>;
const mockStartAfter = startAfter as jest.MockedFunction<typeof startAfter>;
const mockWriteBatch = writeBatch as jest.MockedFunction<typeof writeBatch>;
const mockIncrement = increment as jest.MockedFunction<typeof increment>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;

// Mock Timestamp class
const mockTimestamp = Timestamp as jest.MockedClass<typeof Timestamp>;
(Timestamp.fromDate as jest.Mock) = jest.fn((date: Date) => ({
  toDate: () => date,
  seconds: Math.floor(date.getTime() / 1000),
  nanoseconds: (date.getTime() % 1000) * 1000000
})) as any;

// Helper function to create test visitor data
const createTestVisitorData = (overrides: Partial<Visitor> = {}): Omit<Visitor, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'contactAttempts'> => ({
  name: 'Maria Santos',
  email: 'maria@example.com',
  phone: '(11) 99999-9999',
  address: {
    street: 'Rua das Flores',
    city: 'Sao Paulo',
    state: 'SP',
    zipCode: '01234567'
  },
  birthDate: new Date('1990-05-15'),
  gender: 'feminino',
  maritalStatus: 'casado',
  profession: 'Professora',
  howDidYouKnow: 'Convite de amigo',
  interests: ['Louvor', 'Grupos de Estudo'],
  observations: 'Primeira visita muito positiva',
  createdBy: 'admin-1',
  status: VisitorStatus.ACTIVE,
  firstVisitDate: new Date('2024-01-15'),
  lastVisitDate: new Date('2024-02-20'),
  followUpStatus: FollowUpStatus.PENDING,
  assignedTo: 'leader-1',
  isMember: false,
  ...overrides
});

// Helper function to create a full test visitor
const createTestVisitor = (overrides: Partial<Visitor> = {}): Visitor => ({
  id: 'visitor-1',
  ...createTestVisitorData(),
  totalVisits: 3,
  contactAttempts: [],
  createdAt: new Date('2024-01-15'),
  updatedAt: new Date('2024-01-15'),
  ...overrides
});

// Helper to create Firestore document snapshot mock
const createDocSnapshotMock = (data: any, exists = true): Partial<DocumentSnapshot> => ({
  exists: () => exists,
  data: () => {
    if (!data) return undefined;
    const { id, ...rest } = data;
    return rest;
  },
  id: data?.id || 'doc-id',
  ref: {} as DocumentReference
});

// Helper to create Firestore query snapshot mock
const createQuerySnapshotMock = (docs: any[]): Partial<QuerySnapshot> => ({
  docs: docs.map((data, index) => {
    const { id, ...rest } = data;
    return {
      id: id || `doc-${index}`,
      data: () => rest,
      exists: () => true,
      ref: {} as DocumentReference
    };
  }) as any[],
  size: docs.length,
  forEach: function(this: { docs: any[] }, callback: (doc: any) => void) {
    this.docs.forEach(callback);
  }
});

describe('VisitorService', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset Timestamp.fromDate mock
    (Timestamp.fromDate as jest.Mock).mockImplementation((date: Date) => ({
      toDate: () => date,
      seconds: Math.floor(date.getTime() / 1000),
      nanoseconds: (date.getTime() % 1000) * 1000000
    }));

    // Default mock implementations
    mockCollection.mockReturnValue({} as any);
    mockDoc.mockReturnValue({} as any);
    mockQuery.mockImplementation((...args) => args as any);
    mockWhere.mockImplementation((field, op, value) => ({ field, op, value } as any));
    mockOrderBy.mockImplementation((field, direction) => ({ field, direction } as any));
    mockLimit.mockImplementation((count) => ({ limit: count } as any));
    mockStartAfter.mockImplementation((doc) => ({ startAfter: doc } as any));
  });

  describe('createVisitor', () => {
    it('should create a new visitor with all fields', async () => {
      const visitorData = createTestVisitorData();
      const mockDocRef = { id: 'new-visitor-id' } as DocumentReference;
      mockAddDoc.mockResolvedValue(mockDocRef);

      const result = await visitorService.createVisitor(visitorData);

      expect(result).toBe('new-visitor-id');
      expect(mockAddDoc).toHaveBeenCalledTimes(1);

      const calledData = mockAddDoc.mock.calls[0][1] as any;
      expect(calledData.name).toBe('Maria Santos');
      expect(calledData.email).toBe('maria@example.com');
      expect(calledData.totalVisits).toBe(1);
      expect(calledData.contactAttempts).toEqual([]);
      expect(calledData.status).toBe(VisitorStatus.ACTIVE);
    });

    it('should create a visitor with minimal required fields', async () => {
      const minimalData: Omit<Visitor, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'contactAttempts'> = {
        name: 'João Silva',
        status: VisitorStatus.ACTIVE,
        followUpStatus: FollowUpStatus.PENDING,
        firstVisitDate: new Date('2024-01-15'),
        isMember: false,
        createdBy: 'admin-1',
        interests: []
      };

      const mockDocRef = { id: 'minimal-visitor-id' } as DocumentReference;
      mockAddDoc.mockResolvedValue(mockDocRef);

      const result = await visitorService.createVisitor(minimalData);

      expect(result).toBe('minimal-visitor-id');
      expect(mockAddDoc).toHaveBeenCalledTimes(1);

      const calledData = mockAddDoc.mock.calls[0][1] as any;
      expect(calledData.name).toBe('João Silva');
      expect(calledData.totalVisits).toBe(1);
      expect(calledData.email).toBeUndefined();
      expect(calledData.phone).toBeUndefined();
    });

    it('should convert dates to Firestore Timestamps', async () => {
      const visitorData = createTestVisitorData();
      const mockDocRef = { id: 'new-visitor-id' } as DocumentReference;
      mockAddDoc.mockResolvedValue(mockDocRef);

      await visitorService.createVisitor(visitorData);

      const calledData = mockAddDoc.mock.calls[0][1] as any;
      expect(calledData.firstVisitDate).toHaveProperty('toDate');
      expect(calledData.createdAt).toHaveProperty('toDate');
      expect(calledData.updatedAt).toHaveProperty('toDate');
      if (visitorData.birthDate) {
        expect(calledData.birthDate).toHaveProperty('toDate');
      }
    });

    it('should filter out undefined optional fields', async () => {
      const minimalData: Omit<Visitor, 'id' | 'createdAt' | 'updatedAt' | 'totalVisits' | 'contactAttempts'> = {
        name: 'João Silva',
        status: VisitorStatus.ACTIVE,
        followUpStatus: FollowUpStatus.PENDING,
        firstVisitDate: new Date('2024-01-15'),
        isMember: false,
        createdBy: 'admin-1',
        interests: []
      };

      const mockDocRef = { id: 'minimal-visitor-id' } as DocumentReference;
      mockAddDoc.mockResolvedValue(mockDocRef);

      await visitorService.createVisitor(minimalData);

      const calledData = mockAddDoc.mock.calls[0][1];
      expect(calledData).not.toHaveProperty('email');
      expect(calledData).not.toHaveProperty('phone');
      expect(calledData).not.toHaveProperty('address');
      expect(calledData).not.toHaveProperty('memberId');
    });

    it('should handle errors during creation', async () => {
      const visitorData = createTestVisitorData();
      const error = new Error('Firestore error');
      mockAddDoc.mockRejectedValue(error);

      await expect(visitorService.createVisitor(visitorData)).rejects.toThrow('Firestore error');
    });
  });

  describe('getVisitor', () => {
    it('should retrieve a visitor by ID', async () => {
      const firestoreData = {
        id: 'visitor-1',
        name: 'Maria Santos',
        email: 'maria@example.com',
        status: VisitorStatus.ACTIVE,
        followUpStatus: FollowUpStatus.PENDING,
        firstVisitDate: Timestamp.fromDate(new Date('2024-01-15')),
        lastVisitDate: Timestamp.fromDate(new Date('2024-02-20')),
        totalVisits: 3,
        contactAttempts: [],
        isMember: false,
        createdBy: 'admin-1',
        createdAt: Timestamp.fromDate(new Date('2024-01-15')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
        interests: []
      };

      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);

      const result = await visitorService.getVisitor('visitor-1');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('visitor-1');
      expect(result?.name).toBe('Maria Santos');
      expect(result?.firstVisitDate).toBeInstanceOf(Date);
      expect(result?.createdAt).toBeInstanceOf(Date);
    });

    it('should return null for non-existent visitor', async () => {
      mockGetDoc.mockResolvedValue(createDocSnapshotMock(null, false) as DocumentSnapshot);

      const result = await visitorService.getVisitor('non-existent-id');

      expect(result).toBeNull();
    });

    it('should convert Timestamp contact attempts to Date objects', async () => {
      const firestoreData = {
        id: 'visitor-1',
        name: 'Maria Santos',
        status: VisitorStatus.ACTIVE,
        followUpStatus: FollowUpStatus.PENDING,
        firstVisitDate: Timestamp.fromDate(new Date('2024-01-15')),
        totalVisits: 3,
        contactAttempts: [
          {
            id: 'contact-1',
            date: Timestamp.fromDate(new Date('2024-01-20')),
            type: ContactType.WELCOME,
            method: ContactMethod.PHONE,
            notes: 'Welcome call',
            successful: true,
            contactedBy: 'leader-1',
            nextContactDate: Timestamp.fromDate(new Date('2024-02-01'))
          }
        ],
        isMember: false,
        createdBy: 'admin-1',
        createdAt: Timestamp.fromDate(new Date('2024-01-15')),
        updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
        interests: []
      };

      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);

      const result = await visitorService.getVisitor('visitor-1');

      expect(result?.contactAttempts).toHaveLength(1);
      expect(result?.contactAttempts[0].date).toBeInstanceOf(Date);
      expect(result?.contactAttempts[0].nextContactDate).toBeInstanceOf(Date);
    });

    it('should handle errors during retrieval', async () => {
      const error = new Error('Firestore error');
      mockGetDoc.mockRejectedValue(error);

      await expect(visitorService.getVisitor('visitor-1')).rejects.toThrow('Firestore error');
    });
  });

  describe('getVisitors', () => {
    const createFirestoreVisitor = (id: string, name: string) => ({
      id,
      name,
      email: `${name.toLowerCase()}@example.com`,
      status: VisitorStatus.ACTIVE,
      followUpStatus: FollowUpStatus.PENDING,
      firstVisitDate: Timestamp.fromDate(new Date('2024-01-15')),
      totalVisits: 1,
      contactAttempts: [],
      isMember: false,
      createdBy: 'admin-1',
      createdAt: Timestamp.fromDate(new Date('2024-01-15')),
      updatedAt: Timestamp.fromDate(new Date('2024-01-15')),
      interests: []
    });

    it('should retrieve visitors without filters', async () => {
      const visitors = [
        createFirestoreVisitor('v1', 'Maria Santos'),
        createFirestoreVisitor('v2', 'João Silva')
      ];

      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const result = await visitorService.getVisitors();

      expect(result.visitors).toHaveLength(2);
      expect(result.visitors[0].name).toBe('Maria Santos');
      expect(result.visitors[1].name).toBe('João Silva');
      expect(result.hasMore).toBe(false);
    });

    it('should apply status filter', async () => {
      const visitors = [createFirestoreVisitor('v1', 'Maria Santos')];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const filters: VisitorFilters = { status: VisitorStatus.ACTIVE };
      await visitorService.getVisitors(filters);

      expect(mockWhere).toHaveBeenCalledWith('status', '==', VisitorStatus.ACTIVE);
    });

    it('should apply follow-up status filter', async () => {
      const visitors = [createFirestoreVisitor('v1', 'Maria Santos')];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const filters: VisitorFilters = { followUpStatus: FollowUpStatus.PENDING };
      await visitorService.getVisitors(filters);

      expect(mockWhere).toHaveBeenCalledWith('followUpStatus', '==', FollowUpStatus.PENDING);
    });

    it('should apply assignedTo filter', async () => {
      const visitors = [createFirestoreVisitor('v1', 'Maria Santos')];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const filters: VisitorFilters = { assignedTo: 'leader-1' };
      await visitorService.getVisitors(filters);

      expect(mockWhere).toHaveBeenCalledWith('assignedTo', '==', 'leader-1');
    });

    it('should apply date range filter', async () => {
      const visitors = [createFirestoreVisitor('v1', 'Maria Santos')];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const filters: VisitorFilters = {
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      };
      await visitorService.getVisitors(filters);

      expect(mockWhere).toHaveBeenCalledWith(
        'firstVisitDate',
        '>=',
        expect.objectContaining({ toDate: expect.any(Function) })
      );
      expect(mockWhere).toHaveBeenCalledWith(
        'firstVisitDate',
        '<=',
        expect.objectContaining({ toDate: expect.any(Function) })
      );
    });

    it('should apply text search filter (client-side)', async () => {
      const visitors = [
        createFirestoreVisitor('v1', 'Maria Santos'),
        createFirestoreVisitor('v2', 'João Silva')
      ];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const filters: VisitorFilters = { search: 'maria' };
      const result = await visitorService.getVisitors(filters);

      expect(result.visitors).toHaveLength(1);
      expect(result.visitors[0].name).toBe('Maria Santos');
    });

    it('should search by email', async () => {
      const visitors = [
        createFirestoreVisitor('v1', 'Maria Santos'),
        createFirestoreVisitor('v2', 'João Silva')
      ];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const filters: VisitorFilters = { search: 'joão silva@example' };
      const result = await visitorService.getVisitors(filters);

      expect(result.visitors).toHaveLength(1);
      expect(result.visitors[0].name).toBe('João Silva');
    });

    it('should handle pagination', async () => {
      const visitors = Array.from({ length: 21 }, (_, i) =>
        createFirestoreVisitor(`v${i}`, `Visitor ${i}`)
      );
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      const result = await visitorService.getVisitors({}, 20);

      expect(result.visitors).toHaveLength(20);
      expect(result.hasMore).toBe(true);
    });

    it('should order by creation date descending', async () => {
      const visitors = [createFirestoreVisitor('v1', 'Maria Santos')];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitors) as QuerySnapshot);

      await visitorService.getVisitors();

      expect(mockOrderBy).toHaveBeenCalledWith('createdAt', 'desc');
    });

    it('should handle errors during retrieval', async () => {
      const error = new Error('Firestore error');
      mockGetDocs.mockRejectedValue(error);

      await expect(visitorService.getVisitors()).rejects.toThrow('Firestore error');
    });
  });

  describe('updateVisitor', () => {
    it('should update visitor basic fields', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await visitorService.updateVisitor('visitor-1', {
        name: 'Updated Name',
        email: 'updated@example.com',
        status: VisitorStatus.INACTIVE
      });

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const calledData = mockUpdateDoc.mock.calls[0][1] as any;
      expect(calledData.name).toBe('Updated Name');
      expect(calledData.email).toBe('updated@example.com');
      expect(calledData.status).toBe(VisitorStatus.INACTIVE);
      expect(calledData.updatedAt).toHaveProperty('toDate');
    });

    it('should convert date fields to Timestamps', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const lastVisitDate = new Date('2024-02-15');
      await visitorService.updateVisitor('visitor-1', {
        lastVisitDate
      });

      const calledData = mockUpdateDoc.mock.calls[0][1] as any;
      expect(calledData.lastVisitDate).toHaveProperty('toDate');
    });

    it('should update contact attempts with Timestamp conversion', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const contactAttempts: ContactAttempt[] = [
        {
          id: 'contact-1',
          date: new Date('2024-01-20'),
          type: ContactType.WELCOME,
          method: ContactMethod.PHONE,
          notes: 'Welcome call',
          successful: true,
          contactedBy: 'leader-1',
          nextContactDate: new Date('2024-02-01')
        }
      ];

      await visitorService.updateVisitor('visitor-1', { contactAttempts });

      const calledData = mockUpdateDoc.mock.calls[0][1] as any;
      expect(calledData.contactAttempts).toHaveLength(1);
      expect(calledData.contactAttempts[0].date).toHaveProperty('toDate');
      expect(calledData.contactAttempts[0].nextContactDate).toHaveProperty('toDate');
    });

    it('should handle contact attempts without nextContactDate', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      const contactAttempts: ContactAttempt[] = [
        {
          id: 'contact-1',
          date: new Date('2024-01-20'),
          type: ContactType.WELCOME,
          method: ContactMethod.PHONE,
          notes: 'No answer',
          successful: false,
          contactedBy: 'leader-1'
        }
      ];

      await visitorService.updateVisitor('visitor-1', { contactAttempts });

      const calledData = mockUpdateDoc.mock.calls[0][1] as any;
      expect(calledData.contactAttempts[0].nextContactDate).toBeNull();
    });

    it('should update multiple fields at once', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await visitorService.updateVisitor('visitor-1', {
        status: VisitorStatus.CONVERTED,
        isMember: true,
        memberId: 'member-123',
        followUpStatus: FollowUpStatus.COMPLETED
      });

      const calledData = mockUpdateDoc.mock.calls[0][1] as any;
      expect(calledData.status).toBe(VisitorStatus.CONVERTED);
      expect(calledData.isMember).toBe(true);
      expect(calledData.memberId).toBe('member-123');
      expect(calledData.followUpStatus).toBe(FollowUpStatus.COMPLETED);
    });

    it('should handle errors during update', async () => {
      const error = new Error('Firestore error');
      mockUpdateDoc.mockRejectedValue(error);

      await expect(visitorService.updateVisitor('visitor-1', { name: 'Test' }))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('deleteVisitor', () => {
    it('should delete visitor and associated visit records', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);

      const visitRecords = [
        { id: 'visit-1', visitorId: 'visitor-1' },
        { id: 'visit-2', visitorId: 'visitor-1' }
      ];
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visitRecords) as QuerySnapshot);

      await visitorService.deleteVisitor('visitor-1');

      expect(mockBatch.delete).toHaveBeenCalledTimes(3); // 1 visitor + 2 visits
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should delete visitor even when no visit records exist', async () => {
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock([]) as QuerySnapshot);

      await visitorService.deleteVisitor('visitor-1');

      expect(mockBatch.delete).toHaveBeenCalledTimes(1); // Only visitor
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
    });

    it('should handle errors during deletion', async () => {
      const error = new Error('Firestore error');
      const mockBatch = {
        delete: jest.fn(),
        commit: jest.fn().mockRejectedValue(error)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock([]) as QuerySnapshot);

      await expect(visitorService.deleteVisitor('visitor-1')).rejects.toThrow('Firestore error');
    });
  });

  describe('addContactAttempt', () => {
    it('should add a contact attempt to existing visitor', async () => {
      const visitor = createTestVisitor({ contactAttempts: [] });
      const firestoreData = {
        ...visitor,
        firstVisitDate: Timestamp.fromDate(visitor.firstVisitDate),
        lastVisitDate: visitor.lastVisitDate ? Timestamp.fromDate(visitor.lastVisitDate) : undefined,
        birthDate: visitor.birthDate ? Timestamp.fromDate(visitor.birthDate) : undefined,
        createdAt: Timestamp.fromDate(visitor.createdAt),
        updatedAt: Timestamp.fromDate(visitor.updatedAt)
      };

      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);

      const contactAttempt = {
        date: new Date('2024-01-20'),
        type: ContactType.WELCOME,
        method: ContactMethod.PHONE,
        notes: 'Welcome call',
        successful: true,
        contactedBy: 'leader-1'
      };

      await visitorService.addContactAttempt('visitor-1', contactAttempt);

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateCall = mockUpdateDoc.mock.calls[0][1] as any;
      expect(updateCall.contactAttempts).toHaveLength(1);
      expect(updateCall.contactAttempts[0].type).toBe(ContactType.WELCOME);
      expect(updateCall.followUpStatus).toBe(FollowUpStatus.COMPLETED);
    });

    it('should set follow-up status to IN_PROGRESS when contact is unsuccessful', async () => {
      const visitor = createTestVisitor({ contactAttempts: [] });
      const firestoreData = {
        ...visitor,
        firstVisitDate: Timestamp.fromDate(visitor.firstVisitDate),
        lastVisitDate: visitor.lastVisitDate ? Timestamp.fromDate(visitor.lastVisitDate) : undefined,
        birthDate: visitor.birthDate ? Timestamp.fromDate(visitor.birthDate) : undefined,
        createdAt: Timestamp.fromDate(visitor.createdAt),
        updatedAt: Timestamp.fromDate(visitor.updatedAt)
      };

      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);

      const contactAttempt = {
        date: new Date('2024-01-20'),
        type: ContactType.FOLLOW_UP,
        method: ContactMethod.PHONE,
        notes: 'No answer',
        successful: false,
        contactedBy: 'leader-1'
      };

      await visitorService.addContactAttempt('visitor-1', contactAttempt);

      const updateCall = mockUpdateDoc.mock.calls[0][1] as any;
      expect(updateCall.followUpStatus).toBe(FollowUpStatus.IN_PROGRESS);
    });

    it('should generate unique ID for contact attempt', async () => {
      const visitor = createTestVisitor({ contactAttempts: [] });
      const firestoreData = {
        ...visitor,
        firstVisitDate: Timestamp.fromDate(visitor.firstVisitDate),
        lastVisitDate: visitor.lastVisitDate ? Timestamp.fromDate(visitor.lastVisitDate) : undefined,
        birthDate: visitor.birthDate ? Timestamp.fromDate(visitor.birthDate) : undefined,
        createdAt: Timestamp.fromDate(visitor.createdAt),
        updatedAt: Timestamp.fromDate(visitor.updatedAt)
      };

      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);

      const contactAttempt = {
        date: new Date('2024-01-20'),
        type: ContactType.WELCOME,
        method: ContactMethod.PHONE,
        notes: 'Welcome call',
        successful: true,
        contactedBy: 'leader-1'
      };

      await visitorService.addContactAttempt('visitor-1', contactAttempt);

      const updateCall = mockUpdateDoc.mock.calls[0][1] as any;
      expect(updateCall.contactAttempts[0].id).toMatch(/^contact_\d+$/);
    });

    it('should throw error when visitor not found', async () => {
      mockGetDoc.mockResolvedValue(createDocSnapshotMock(null, false) as DocumentSnapshot);

      const contactAttempt = {
        date: new Date('2024-01-20'),
        type: ContactType.WELCOME,
        method: ContactMethod.PHONE,
        notes: 'Welcome call',
        successful: true,
        contactedBy: 'leader-1'
      };

      await expect(visitorService.addContactAttempt('non-existent', contactAttempt))
        .rejects.toThrow('Visitor not found');
    });

    it('should preserve existing contact attempts', async () => {
      const existingAttempt: ContactAttempt = {
        id: 'existing-1',
        date: new Date('2024-01-10'),
        type: ContactType.WELCOME,
        method: ContactMethod.EMAIL,
        notes: 'First contact',
        successful: true,
        contactedBy: 'leader-1'
      };

      const visitor = createTestVisitor({ contactAttempts: [existingAttempt] });
      const firestoreData = {
        ...visitor,
        firstVisitDate: Timestamp.fromDate(visitor.firstVisitDate),
        lastVisitDate: visitor.lastVisitDate ? Timestamp.fromDate(visitor.lastVisitDate) : undefined,
        birthDate: visitor.birthDate ? Timestamp.fromDate(visitor.birthDate) : undefined,
        createdAt: Timestamp.fromDate(visitor.createdAt),
        updatedAt: Timestamp.fromDate(visitor.updatedAt),
        contactAttempts: [
          {
            ...existingAttempt,
            date: Timestamp.fromDate(existingAttempt.date)
          }
        ]
      };

      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);

      const newAttempt = {
        date: new Date('2024-01-20'),
        type: ContactType.FOLLOW_UP,
        method: ContactMethod.PHONE,
        notes: 'Follow up call',
        successful: true,
        contactedBy: 'leader-1'
      };

      await visitorService.addContactAttempt('visitor-1', newAttempt);

      const updateCall = mockUpdateDoc.mock.calls[0][1] as any;
      expect(updateCall.contactAttempts).toHaveLength(2);
    });
  });

  describe('recordVisit', () => {
    it('should create a visit record and update visitor stats', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);
      mockIncrement.mockReturnValue(1 as any);

      const mockVisitRef = { id: 'visit-123' } as DocumentReference;
      mockDoc.mockReturnValue(mockVisitRef);

      const visitData = {
        visitorId: 'visitor-1',
        visitDate: new Date('2024-02-15'),
        service: ServiceType.SUNDAY_MORNING,
        registeredBy: 'secretary-1',
        notes: 'Second visit',
        broughtBy: 'member-1'
      };

      const result = await visitorService.recordVisit(visitData);

      expect(result).toBe('visit-123');
      expect(mockBatch.set).toHaveBeenCalledTimes(1);
      expect(mockBatch.update).toHaveBeenCalledTimes(1);
      expect(mockBatch.commit).toHaveBeenCalledTimes(1);
      expect(mockIncrement).toHaveBeenCalledWith(1);
    });

    it('should convert visit date to Timestamp', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);
      mockIncrement.mockReturnValue(1 as any);

      const visitData = {
        visitorId: 'visitor-1',
        visitDate: new Date('2024-02-15'),
        service: ServiceType.SUNDAY_MORNING,
        registeredBy: 'secretary-1'
      };

      await visitorService.recordVisit(visitData);

      const setCall = mockBatch.set as jest.Mock;
      const visitRecord = setCall.mock.calls[0][1];
      expect(visitRecord.visitDate).toHaveProperty('toDate');
      expect(visitRecord.createdAt).toHaveProperty('toDate');
    });

    it('should update visitor last visit date and total visits', async () => {
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);
      mockIncrement.mockReturnValue(1 as any);

      const visitData = {
        visitorId: 'visitor-1',
        visitDate: new Date('2024-02-15'),
        service: ServiceType.SUNDAY_MORNING,
        registeredBy: 'secretary-1'
      };

      await visitorService.recordVisit(visitData);

      const updateCall = mockBatch.update as jest.Mock;
      const updateData = updateCall.mock.calls[0][1];
      expect(updateData.totalVisits).toBe(1);
      expect(updateData.lastVisitDate).toHaveProperty('toDate');
      expect(updateData.updatedAt).toHaveProperty('toDate');
    });

    it('should handle errors during visit recording', async () => {
      const error = new Error('Firestore error');
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockRejectedValue(error)
      } as unknown as WriteBatch;

      mockWriteBatch.mockReturnValue(mockBatch);

      const visitData = {
        visitorId: 'visitor-1',
        visitDate: new Date('2024-02-15'),
        service: ServiceType.SUNDAY_MORNING,
        registeredBy: 'secretary-1'
      };

      await expect(visitorService.recordVisit(visitData)).rejects.toThrow('Firestore error');
    });
  });

  describe('getVisitHistory', () => {
    it('should retrieve visit history for a visitor', async () => {
      const visits = [
        {
          id: 'visit-1',
          visitorId: 'visitor-1',
          visitDate: Timestamp.fromDate(new Date('2024-02-01')),
          service: ServiceType.SUNDAY_MORNING,
          registeredBy: 'secretary-1',
          createdAt: Timestamp.fromDate(new Date('2024-02-01'))
        },
        {
          id: 'visit-2',
          visitorId: 'visitor-1',
          visitDate: Timestamp.fromDate(new Date('2024-01-15')),
          service: ServiceType.WEDNESDAY_PRAYER,
          registeredBy: 'secretary-1',
          createdAt: Timestamp.fromDate(new Date('2024-01-15'))
        }
      ];

      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visits) as QuerySnapshot);

      const result = await visitorService.getVisitHistory('visitor-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('visit-1');
      expect(result[0].visitDate).toBeInstanceOf(Date);
      expect(result[1].id).toBe('visit-2');
    });

    it('should order visits by date descending', async () => {
      const visits = [
        {
          id: 'visit-1',
          visitorId: 'visitor-1',
          visitDate: Timestamp.fromDate(new Date('2024-02-01')),
          service: ServiceType.SUNDAY_MORNING,
          registeredBy: 'secretary-1',
          createdAt: Timestamp.fromDate(new Date('2024-02-01'))
        }
      ];

      mockGetDocs.mockResolvedValue(createQuerySnapshotMock(visits) as QuerySnapshot);

      await visitorService.getVisitHistory('visitor-1');

      expect(mockWhere).toHaveBeenCalledWith('visitorId', '==', 'visitor-1');
      expect(mockOrderBy).toHaveBeenCalledWith('visitDate', 'desc');
    });

    it('should fallback to client-side sorting when index is missing', async () => {
      const indexError = new Error('index error');
      (indexError as any).code = 'failed-precondition';

      mockGetDocs
        .mockRejectedValueOnce(indexError)
        .mockResolvedValueOnce(createQuerySnapshotMock([
          {
            id: 'visit-1',
            visitorId: 'visitor-1',
            visitDate: Timestamp.fromDate(new Date('2024-01-15')),
            service: ServiceType.SUNDAY_MORNING,
            registeredBy: 'secretary-1',
            createdAt: Timestamp.fromDate(new Date('2024-01-15'))
          },
          {
            id: 'visit-2',
            visitorId: 'visitor-1',
            visitDate: Timestamp.fromDate(new Date('2024-02-01')),
            service: ServiceType.WEDNESDAY_PRAYER,
            registeredBy: 'secretary-1',
            createdAt: Timestamp.fromDate(new Date('2024-02-01'))
          }
        ]) as QuerySnapshot);

      const result = await visitorService.getVisitHistory('visitor-1');

      expect(result).toHaveLength(2);
      expect(result[0].visitDate.getTime()).toBeGreaterThan(result[1].visitDate.getTime());
    });

    it('should return empty array when no visits found', async () => {
      mockGetDocs.mockResolvedValue(createQuerySnapshotMock([]) as QuerySnapshot);

      const result = await visitorService.getVisitHistory('visitor-1');

      expect(result).toEqual([]);
    });

    it('should handle non-index errors properly', async () => {
      const error = new Error('Network error');
      mockGetDocs.mockRejectedValue(error);

      await expect(visitorService.getVisitHistory('visitor-1'))
        .rejects.toThrow('Network error');
    });
  });

  describe('convertToMember', () => {
    it('should convert visitor to member', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);

      await visitorService.convertToMember('visitor-1', 'member-123');

      expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
      const updateData = mockUpdateDoc.mock.calls[0][1] as any;
      expect(updateData.isMember).toBe(true);
      expect(updateData.memberId).toBe('member-123');
      expect(updateData.status).toBe(VisitorStatus.CONVERTED);
      expect(updateData.followUpStatus).toBe(FollowUpStatus.COMPLETED);
      expect(updateData.convertedToMemberAt).toHaveProperty('toDate');
    });

    it('should handle errors during conversion', async () => {
      const error = new Error('Firestore error');
      mockUpdateDoc.mockRejectedValue(error);

      await expect(visitorService.convertToMember('visitor-1', 'member-123'))
        .rejects.toThrow('Firestore error');
    });
  });

  describe('getVisitorStats', () => {
    it('should calculate visitor statistics correctly', async () => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const allVisitors = [
        { id: 'v1', totalVisits: 3, status: VisitorStatus.ACTIVE, followUpStatus: FollowUpStatus.PENDING },
        { id: 'v2', totalVisits: 5, status: VisitorStatus.CONVERTED, followUpStatus: FollowUpStatus.COMPLETED },
        { id: 'v3', totalVisits: 1, status: VisitorStatus.ACTIVE, followUpStatus: FollowUpStatus.PENDING },
        { id: 'v4', totalVisits: 2, status: VisitorStatus.ACTIVE, followUpStatus: FollowUpStatus.IN_PROGRESS }
      ];

      const newThisMonth = [{ id: 'v1' }];
      const activeVisitors = [{ id: 'v1' }, { id: 'v3' }, { id: 'v4' }];
      const convertedVisitors = [{ id: 'v2' }];
      const pendingFollowUp = [{ id: 'v1' }, { id: 'v3' }];

      mockGetDocs
        .mockResolvedValueOnce(createQuerySnapshotMock(allVisitors) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock(newThisMonth) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock(activeVisitors) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock(convertedVisitors) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock(pendingFollowUp) as QuerySnapshot);

      const stats = await visitorService.getVisitorStats();

      expect(stats.totalVisitors).toBe(4);
      expect(stats.newThisMonth).toBe(1);
      expect(stats.activeVisitors).toBe(3);
      expect(stats.convertedToMembers).toBe(1);
      expect(stats.pendingFollowUp).toBe(2);
      expect(stats.averageVisitsPerVisitor).toBe(2.75); // (3+5+1+2) / 4
      expect(stats.retentionRate).toBe(75); // 3 visitors with >1 visit / 4 total
      expect(stats.conversionRate).toBe(25); // 1 converted / 4 total
    });

    it('should handle zero visitors', async () => {
      mockGetDocs
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot);

      const stats = await visitorService.getVisitorStats();

      expect(stats.totalVisitors).toBe(0);
      expect(stats.averageVisitsPerVisitor).toBe(0);
      expect(stats.retentionRate).toBe(0);
      expect(stats.conversionRate).toBe(0);
    });

    it('should round statistics to 2 decimal places', async () => {
      const allVisitors = [
        { id: 'v1', totalVisits: 3 },
        { id: 'v2', totalVisits: 3 },
        { id: 'v3', totalVisits: 3 }
      ];

      mockGetDocs
        .mockResolvedValueOnce(createQuerySnapshotMock(allVisitors) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([{ id: 'v1' }]) as QuerySnapshot)
        .mockResolvedValueOnce(createQuerySnapshotMock([]) as QuerySnapshot);

      const stats = await visitorService.getVisitorStats();

      expect(stats.averageVisitsPerVisitor).toBe(3);
      expect(stats.retentionRate).toBe(100);
      expect(stats.conversionRate).toBe(33.33);
    });

    it('should handle errors during stats retrieval', async () => {
      const error = new Error('Firestore error');
      mockGetDocs.mockRejectedValue(error);

      await expect(visitorService.getVisitorStats()).rejects.toThrow('Firestore error');
    });
  });

  describe('Error Scenarios', () => {
    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      mockGetDocs.mockRejectedValue(timeoutError);

      await expect(visitorService.getVisitors()).rejects.toThrow('Request timeout');
    });

    it('should handle permission denied errors', async () => {
      const permissionError = new Error('Permission denied');
      (permissionError as any).code = 'permission-denied';
      mockAddDoc.mockRejectedValue(permissionError);

      await expect(visitorService.createVisitor(createTestVisitorData()))
        .rejects.toThrow('Permission denied');
    });

    it('should handle invalid data errors', async () => {
      const invalidError = new Error('Invalid data');
      mockUpdateDoc.mockRejectedValue(invalidError);

      await expect(visitorService.updateVisitor('visitor-1', { name: '' }))
        .rejects.toThrow('Invalid data');
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle complete visitor lifecycle', async () => {
      // Create visitor
      const mockDocRef = { id: 'new-visitor' } as DocumentReference;
      mockAddDoc.mockResolvedValue(mockDocRef);

      const visitorData = createTestVisitorData();
      const visitorId = await visitorService.createVisitor(visitorData);
      expect(visitorId).toBe('new-visitor');

      // Add contact attempt
      const visitor = createTestVisitor({ id: visitorId });
      const firestoreData = {
        ...visitor,
        firstVisitDate: Timestamp.fromDate(visitor.firstVisitDate),
        lastVisitDate: visitor.lastVisitDate ? Timestamp.fromDate(visitor.lastVisitDate) : undefined,
        birthDate: visitor.birthDate ? Timestamp.fromDate(visitor.birthDate) : undefined,
        createdAt: Timestamp.fromDate(visitor.createdAt),
        updatedAt: Timestamp.fromDate(visitor.updatedAt)
      };
      mockGetDoc.mockResolvedValue(createDocSnapshotMock(firestoreData) as DocumentSnapshot);
      mockUpdateDoc.mockResolvedValue(undefined);

      await visitorService.addContactAttempt(visitorId, {
        date: new Date(),
        type: ContactType.WELCOME,
        method: ContactMethod.PHONE,
        notes: 'Welcome call',
        successful: true,
        contactedBy: 'leader-1'
      });

      expect(mockUpdateDoc).toHaveBeenCalled();

      // Record visit
      const mockBatch = {
        set: jest.fn(),
        update: jest.fn(),
        commit: jest.fn().mockResolvedValue(undefined)
      } as unknown as WriteBatch;
      mockWriteBatch.mockReturnValue(mockBatch);

      await visitorService.recordVisit({
        visitorId,
        visitDate: new Date(),
        service: ServiceType.SUNDAY_MORNING,
        registeredBy: 'secretary-1'
      });

      expect(mockBatch.commit).toHaveBeenCalled();

      // Convert to member
      await visitorService.convertToMember(visitorId, 'member-123');
      expect(mockUpdateDoc).toHaveBeenCalled();
    });
  });
});
