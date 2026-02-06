// Unit Tests - MemberService
// Tests for Member service layer operations

import { MemberService } from '../MemberService';
import { Member, MemberStatus, MaritalStatus, MemberType, Address } from '@modules/church-management/members/domain/entities/Member';
import { FirebaseMemberRepository } from '@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository';

// Mock Firebase to prevent auth/invalid-api-key error in CI
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock the FirebaseMemberRepository
jest.mock('@modules/church-management/members/infrastructure/repositories/FirebaseMemberRepository');

describe('MemberService', () => {
  let memberService: MemberService;
  let mockRepository: jest.Mocked<FirebaseMemberRepository>;

  // Test data factories
  const createTestAddress = (overrides: Partial<Address> = {}): Address => ({
    street: 'Rua das Flores',
    number: '123',
    neighborhood: 'Centro',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01234567',
    ...overrides
  });

  const createTestMember = (overrides: Partial<Member> = {}): Member => ({
    id: 'member-1',
    name: 'João Silva',
    email: 'joao@example.com',
    phone: '(11) 99999-9999',
    birthDate: new Date('1990-01-15'),
    address: createTestAddress(),
    maritalStatus: MaritalStatus.Single,
    memberType: MemberType.Member,
    baptismDate: new Date('2010-01-01'),
    conversionDate: new Date('2009-01-01'),
    ministries: ['Louvor', 'Jovens'],
    status: MemberStatus.Active,
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-06-01'),
    createdBy: 'admin-1',
    ...overrides
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a fresh mock instance
    mockRepository = new FirebaseMemberRepository() as jest.Mocked<FirebaseMemberRepository>;

    // Create service instance (it will use the mocked repository)
    memberService = new MemberService();

    // Access the private repository and replace with our mock
    (memberService as any).memberRepository = mockRepository;
  });

  // ===========================================
  // CRUD OPERATIONS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('getAllMembers', () => {
      it('should return all members from repository', async () => {
        const members = [
          createTestMember({ id: 'member-1', name: 'João Silva' }),
          createTestMember({ id: 'member-2', name: 'Maria Santos' }),
          createTestMember({ id: 'member-3', name: 'Pedro Costa' })
        ];
        mockRepository.findAll.mockResolvedValue(members);

        const result = await memberService.getAllMembers();

        expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
        expect(result).toHaveLength(3);
        expect(result).toEqual(members);
      });

      it('should return empty array when no members exist', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        const result = await memberService.getAllMembers();

        expect(result).toEqual([]);
        expect(mockRepository.findAll).toHaveBeenCalledTimes(1);
      });

      it('should propagate repository errors', async () => {
        const error = new Error('Database connection failed');
        mockRepository.findAll.mockRejectedValue(error);

        await expect(memberService.getAllMembers()).rejects.toThrow('Database connection failed');
      });
    });

    describe('getMemberById', () => {
      it('should return member when found', async () => {
        const member = createTestMember({ id: 'member-123' });
        mockRepository.findById.mockResolvedValue(member);

        const result = await memberService.getMemberById('member-123');

        expect(mockRepository.findById).toHaveBeenCalledWith('member-123');
        expect(result).toEqual(member);
      });

      it('should return null when member not found', async () => {
        mockRepository.findById.mockResolvedValue(null);

        const result = await memberService.getMemberById('non-existent-id');

        expect(mockRepository.findById).toHaveBeenCalledWith('non-existent-id');
        expect(result).toBeNull();
      });

      it('should propagate repository errors', async () => {
        mockRepository.findById.mockRejectedValue(new Error('Erro ao buscar membro'));

        await expect(memberService.getMemberById('any-id')).rejects.toThrow('Erro ao buscar membro');
      });
    });

    describe('createMember', () => {
      it('should create a new member successfully', async () => {
        const memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'Novo Membro',
          email: 'novo@example.com',
          phone: '(11) 88888-8888',
          birthDate: new Date('1995-05-10'),
          address: createTestAddress(),
          maritalStatus: MaritalStatus.Married,
          memberType: MemberType.Member,
          ministries: ['Diaconia'],
          status: MemberStatus.Active,
          createdBy: 'admin-1'
        };

        const createdMember: Member = {
          ...memberData,
          id: 'new-member-id',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepository.create.mockResolvedValue(createdMember);

        const result = await memberService.createMember(memberData);

        expect(mockRepository.create).toHaveBeenCalledWith(memberData);
        expect(result).toEqual(createdMember);
        expect(result.id).toBe('new-member-id');
      });

      it('should create member with optional fields', async () => {
        const memberData: Omit<Member, 'id' | 'createdAt' | 'updatedAt'> = {
          name: 'Membro Simples',
          email: 'simples@example.com',
          phone: '(11) 77777-7777',
          birthDate: new Date('2000-01-01'),
          address: createTestAddress(),
          maritalStatus: MaritalStatus.Single,
          memberType: MemberType.Congregant,
          ministries: [],
          status: MemberStatus.Active,
          createdBy: 'admin-1',
          baptismDate: undefined,
          conversionDate: undefined
        };

        const createdMember: Member = {
          ...memberData,
          id: 'congregant-id',
          createdAt: new Date(),
          updatedAt: new Date()
        };

        mockRepository.create.mockResolvedValue(createdMember);

        const result = await memberService.createMember(memberData);

        expect(result.memberType).toBe(MemberType.Congregant);
        expect(result.baptismDate).toBeUndefined();
      });

      it('should propagate creation errors', async () => {
        mockRepository.create.mockRejectedValue(new Error('Erro ao criar membro'));

        await expect(memberService.createMember({
          name: 'Test',
          email: 'test@test.com',
          phone: '(11) 99999-9999',
          birthDate: new Date(),
          address: createTestAddress(),
          maritalStatus: MaritalStatus.Single,
          memberType: MemberType.Member,
          ministries: [],
          status: MemberStatus.Active,
          createdBy: 'admin'
        })).rejects.toThrow('Erro ao criar membro');
      });
    });

    describe('updateMember', () => {
      it('should update member successfully', async () => {
        const existingMember = createTestMember({ id: 'member-1', name: 'João Silva' });
        const updatedMember = { ...existingMember, name: 'João Silva Santos', updatedAt: new Date() };

        mockRepository.update.mockResolvedValue(updatedMember);

        const result = await memberService.updateMember('member-1', { name: 'João Silva Santos' });

        expect(mockRepository.update).toHaveBeenCalledWith('member-1', { name: 'João Silva Santos' });
        expect(result.name).toBe('João Silva Santos');
      });

      it('should update multiple fields at once', async () => {
        const updates: Partial<Member> = {
          email: 'newemail@example.com',
          phone: '(21) 99999-9999',
          ministries: ['Louvor', 'Diaconia', 'Jovens']
        };

        const updatedMember = createTestMember({ ...updates, id: 'member-1' });
        mockRepository.update.mockResolvedValue(updatedMember);

        const result = await memberService.updateMember('member-1', updates);

        expect(mockRepository.update).toHaveBeenCalledWith('member-1', updates);
        expect(result.email).toBe('newemail@example.com');
        expect(result.phone).toBe('(21) 99999-9999');
        expect(result.ministries).toHaveLength(3);
      });

      it('should propagate update errors', async () => {
        mockRepository.update.mockRejectedValue(new Error('Erro ao atualizar membro'));

        await expect(memberService.updateMember('any-id', { name: 'New Name' }))
          .rejects.toThrow('Erro ao atualizar membro');
      });
    });

    describe('deleteMember', () => {
      it('should delete member successfully', async () => {
        mockRepository.delete.mockResolvedValue(undefined);

        await memberService.deleteMember('member-to-delete');

        expect(mockRepository.delete).toHaveBeenCalledWith('member-to-delete');
        expect(mockRepository.delete).toHaveBeenCalledTimes(1);
      });

      it('should propagate deletion errors', async () => {
        mockRepository.delete.mockRejectedValue(new Error('Erro ao deletar membro'));

        await expect(memberService.deleteMember('any-id')).rejects.toThrow('Erro ao deletar membro');
      });
    });
  });

  // ===========================================
  // SEARCH AND FILTERING
  // ===========================================
  describe('Search and Filtering', () => {
    describe('getMembersByStatus', () => {
      it('should return members with Active status', async () => {
        const activeMembers = [
          createTestMember({ id: 'active-1', status: MemberStatus.Active }),
          createTestMember({ id: 'active-2', status: MemberStatus.Active })
        ];
        mockRepository.findByStatus.mockResolvedValue(activeMembers);

        const result = await memberService.getMembersByStatus(MemberStatus.Active);

        expect(mockRepository.findByStatus).toHaveBeenCalledWith(MemberStatus.Active);
        expect(result).toHaveLength(2);
        result.forEach(member => {
          expect(member.status).toBe(MemberStatus.Active);
        });
      });

      it('should return members with Inactive status', async () => {
        const inactiveMembers = [
          createTestMember({ id: 'inactive-1', status: MemberStatus.Inactive })
        ];
        mockRepository.findByStatus.mockResolvedValue(inactiveMembers);

        const result = await memberService.getMembersByStatus(MemberStatus.Inactive);

        expect(mockRepository.findByStatus).toHaveBeenCalledWith(MemberStatus.Inactive);
        expect(result[0].status).toBe(MemberStatus.Inactive);
      });

      it('should return members with Transferred status', async () => {
        const transferredMembers = [
          createTestMember({ id: 'transferred-1', status: MemberStatus.Transferred })
        ];
        mockRepository.findByStatus.mockResolvedValue(transferredMembers);

        const result = await memberService.getMembersByStatus(MemberStatus.Transferred);

        expect(mockRepository.findByStatus).toHaveBeenCalledWith(MemberStatus.Transferred);
        expect(result[0].status).toBe(MemberStatus.Transferred);
      });

      it('should return members with Disciplined status', async () => {
        const disciplinedMembers = [
          createTestMember({ id: 'disciplined-1', status: MemberStatus.Disciplined })
        ];
        mockRepository.findByStatus.mockResolvedValue(disciplinedMembers);

        const result = await memberService.getMembersByStatus(MemberStatus.Disciplined);

        expect(mockRepository.findByStatus).toHaveBeenCalledWith(MemberStatus.Disciplined);
        expect(result[0].status).toBe(MemberStatus.Disciplined);
      });

      it('should return empty array when no members match status', async () => {
        mockRepository.findByStatus.mockResolvedValue([]);

        const result = await memberService.getMembersByStatus(MemberStatus.Disciplined);

        expect(result).toEqual([]);
      });
    });

    describe('searchMembers', () => {
      it('should search members by name', async () => {
        const matchingMembers = [
          createTestMember({ id: 'member-1', name: 'João Silva' }),
          createTestMember({ id: 'member-2', name: 'João Pedro' })
        ];
        mockRepository.search.mockResolvedValue(matchingMembers);

        const result = await memberService.searchMembers('João');

        expect(mockRepository.search).toHaveBeenCalledWith('João');
        expect(result).toHaveLength(2);
      });

      it('should search members by email', async () => {
        const matchingMembers = [
          createTestMember({ id: 'member-1', email: 'joao@example.com' })
        ];
        mockRepository.search.mockResolvedValue(matchingMembers);

        const result = await memberService.searchMembers('joao@example.com');

        expect(mockRepository.search).toHaveBeenCalledWith('joao@example.com');
        expect(result).toHaveLength(1);
      });

      it('should search members by phone', async () => {
        const matchingMembers = [
          createTestMember({ id: 'member-1', phone: '(11) 99999-9999' })
        ];
        mockRepository.search.mockResolvedValue(matchingMembers);

        const result = await memberService.searchMembers('99999-9999');

        expect(mockRepository.search).toHaveBeenCalledWith('99999-9999');
        expect(result).toHaveLength(1);
      });

      it('should return empty array when no members match search query', async () => {
        mockRepository.search.mockResolvedValue([]);

        const result = await memberService.searchMembers('nonexistent');

        expect(result).toEqual([]);
      });

      it('should handle empty search query', async () => {
        mockRepository.search.mockResolvedValue([]);

        const result = await memberService.searchMembers('');

        expect(mockRepository.search).toHaveBeenCalledWith('');
        expect(result).toEqual([]);
      });
    });

    describe('getMembersByMinistry', () => {
      it('should return members in a specific ministry', async () => {
        const louvorMembers = [
          createTestMember({ id: 'member-1', ministries: ['Louvor', 'Jovens'] }),
          createTestMember({ id: 'member-2', ministries: ['Louvor'] })
        ];
        mockRepository.findByMinistry.mockResolvedValue(louvorMembers);

        const result = await memberService.getMembersByMinistry('Louvor');

        expect(mockRepository.findByMinistry).toHaveBeenCalledWith('Louvor');
        expect(result).toHaveLength(2);
      });

      it('should return empty array when no members in ministry', async () => {
        mockRepository.findByMinistry.mockResolvedValue([]);

        const result = await memberService.getMembersByMinistry('NonExistentMinistry');

        expect(result).toEqual([]);
      });
    });

    describe('getBirthdays', () => {
      it('should return members with birthdays in specified month', async () => {
        const januaryBirthdays = [
          createTestMember({ id: 'member-1', birthDate: new Date('1990-01-15') }),
          createTestMember({ id: 'member-2', birthDate: new Date('1985-01-20') })
        ];
        mockRepository.findBirthdays.mockResolvedValue(januaryBirthdays);

        const result = await memberService.getBirthdays(1);

        expect(mockRepository.findBirthdays).toHaveBeenCalledWith(1);
        expect(result).toHaveLength(2);
      });

      it('should use current month when no month is specified', async () => {
        const currentMonth = new Date().getMonth() + 1;
        mockRepository.findBirthdays.mockResolvedValue([]);

        await memberService.getBirthdays();

        expect(mockRepository.findBirthdays).toHaveBeenCalledWith(currentMonth);
      });

      it('should return empty array when no birthdays in month', async () => {
        mockRepository.findBirthdays.mockResolvedValue([]);

        const result = await memberService.getBirthdays(12);

        expect(result).toEqual([]);
      });
    });
  });

  // ===========================================
  // STATUS UPDATES
  // ===========================================
  describe('Status Updates', () => {
    describe('updateMemberStatus', () => {
      it('should update member status to Active', async () => {
        const member = createTestMember({ id: 'member-1', status: MemberStatus.Inactive });
        const updatedMember = { ...member, status: MemberStatus.Active };
        mockRepository.update.mockResolvedValue(updatedMember);

        const result = await memberService.updateMemberStatus('member-1', MemberStatus.Active);

        expect(mockRepository.update).toHaveBeenCalledWith('member-1', { status: MemberStatus.Active });
        expect(result.status).toBe(MemberStatus.Active);
      });

      it('should update member status to Inactive', async () => {
        const member = createTestMember({ id: 'member-1', status: MemberStatus.Active });
        const updatedMember = { ...member, status: MemberStatus.Inactive };
        mockRepository.update.mockResolvedValue(updatedMember);

        const result = await memberService.updateMemberStatus('member-1', MemberStatus.Inactive);

        expect(mockRepository.update).toHaveBeenCalledWith('member-1', { status: MemberStatus.Inactive });
        expect(result.status).toBe(MemberStatus.Inactive);
      });
    });

    describe('transferMember', () => {
      it('should transfer member to another church', async () => {
        mockRepository.transferMember.mockResolvedValue(undefined);

        await memberService.transferMember('member-1', 'Igreja Central', 'admin-1');

        expect(mockRepository.transferMember).toHaveBeenCalledWith(
          'member-1',
          'Igreja Central',
          'admin-1'
        );
        expect(mockRepository.transferMember).toHaveBeenCalledTimes(1);
      });

      it('should propagate transfer errors', async () => {
        mockRepository.transferMember.mockRejectedValue(new Error('Erro ao transferir membro'));

        await expect(memberService.transferMember('member-1', 'Igreja', 'admin'))
          .rejects.toThrow('Erro ao transferir membro');
      });
    });

    describe('disciplineMember', () => {
      it('should discipline member with reason', async () => {
        mockRepository.disciplineMember.mockResolvedValue(undefined);

        await memberService.disciplineMember(
          'member-1',
          'Violação de conduta',
          'pastor-1'
        );

        expect(mockRepository.disciplineMember).toHaveBeenCalledWith(
          'member-1',
          'Violação de conduta',
          'pastor-1'
        );
        expect(mockRepository.disciplineMember).toHaveBeenCalledTimes(1);
      });

      it('should propagate discipline errors', async () => {
        mockRepository.disciplineMember.mockRejectedValue(new Error('Erro ao disciplinar membro'));

        await expect(memberService.disciplineMember('member-1', 'reason', 'admin'))
          .rejects.toThrow('Erro ao disciplinar membro');
      });
    });

    describe('restoreMember', () => {
      it('should restore disciplined member', async () => {
        mockRepository.restoreMember.mockResolvedValue(undefined);

        await memberService.restoreMember('member-1', 'pastor-1');

        expect(mockRepository.restoreMember).toHaveBeenCalledWith(
          'member-1',
          'pastor-1'
        );
        expect(mockRepository.restoreMember).toHaveBeenCalledTimes(1);
      });

      it('should propagate restoration errors', async () => {
        mockRepository.restoreMember.mockRejectedValue(new Error('Erro ao restaurar membro'));

        await expect(memberService.restoreMember('member-1', 'admin'))
          .rejects.toThrow('Erro ao restaurar membro');
      });
    });
  });

  // ===========================================
  // STATISTICS
  // ===========================================
  describe('Statistics', () => {
    describe('getStatistics', () => {
      it('should return complete statistics', async () => {
        const ageDistribution = new Map<string, number>([
          ['0-17', 5],
          ['18-29', 20],
          ['30-49', 35],
          ['50-69', 25],
          ['70+', 15]
        ]);

        mockRepository.countTotal.mockResolvedValue(100);
        mockRepository.countByStatus
          .mockResolvedValueOnce(80)  // Active
          .mockResolvedValueOnce(10)  // Inactive
          .mockResolvedValueOnce(7)   // Transferred
          .mockResolvedValueOnce(3);  // Disciplined
        mockRepository.getAgeDistribution.mockResolvedValue(ageDistribution);
        mockRepository.getGrowthStats.mockResolvedValue(5);

        const result = await memberService.getStatistics();

        expect(result.total).toBe(100);
        expect(result.active).toBe(80);
        expect(result.inactive).toBe(10);
        expect(result.transferred).toBe(7);
        expect(result.disciplined).toBe(3);
        expect(result.ageDistribution).toEqual(ageDistribution);
        expect(result.monthlyGrowth).toBe(5);
      });

      it('should handle zero statistics', async () => {
        const emptyAgeDistribution = new Map<string, number>([
          ['0-17', 0],
          ['18-29', 0],
          ['30-49', 0],
          ['50-69', 0],
          ['70+', 0]
        ]);

        mockRepository.countTotal.mockResolvedValue(0);
        mockRepository.countByStatus.mockResolvedValue(0);
        mockRepository.getAgeDistribution.mockResolvedValue(emptyAgeDistribution);
        mockRepository.getGrowthStats.mockResolvedValue(0);

        const result = await memberService.getStatistics();

        expect(result.total).toBe(0);
        expect(result.active).toBe(0);
        expect(result.inactive).toBe(0);
        expect(result.monthlyGrowth).toBe(0);
      });

      it('should call repository methods with correct parameters', async () => {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        mockRepository.countTotal.mockResolvedValue(0);
        mockRepository.countByStatus.mockResolvedValue(0);
        mockRepository.getAgeDistribution.mockResolvedValue(new Map());
        mockRepository.getGrowthStats.mockResolvedValue(0);

        await memberService.getStatistics();

        expect(mockRepository.countTotal).toHaveBeenCalledTimes(1);
        expect(mockRepository.countByStatus).toHaveBeenCalledWith(MemberStatus.Active);
        expect(mockRepository.countByStatus).toHaveBeenCalledWith(MemberStatus.Inactive);
        expect(mockRepository.countByStatus).toHaveBeenCalledWith(MemberStatus.Transferred);
        expect(mockRepository.countByStatus).toHaveBeenCalledWith(MemberStatus.Disciplined);
        expect(mockRepository.getAgeDistribution).toHaveBeenCalledTimes(1);

        // Check that getGrowthStats was called with date range
        expect(mockRepository.getGrowthStats).toHaveBeenCalledWith(
          expect.any(Date),
          expect.any(Date)
        );
      });
    });
  });

  // ===========================================
  // EXPORT AND REPORTS
  // ===========================================
  describe('Export and Reports', () => {
    describe('exportMembers', () => {
      it('should export all members in correct format', async () => {
        const members = [
          createTestMember({
            id: 'member-1',
            name: 'João Silva',
            email: 'joao@example.com',
            phone: '(11) 99999-9999',
            birthDate: new Date('1990-01-15'),
            address: createTestAddress({ street: 'Rua A', city: 'São Paulo' }),
            maritalStatus: MaritalStatus.Single,
            baptismDate: new Date('2010-05-20'),
            ministries: ['Louvor', 'Jovens'],
            status: MemberStatus.Active,
            createdAt: new Date('2023-01-01')
          })
        ];
        mockRepository.findAll.mockResolvedValue(members);

        const result = await memberService.exportMembers();

        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('id', 'member-1');
        expect(result[0]).toHaveProperty('name', 'João Silva');
        expect(result[0]).toHaveProperty('email', 'joao@example.com');
        expect(result[0]).toHaveProperty('phone', '(11) 99999-9999');
        expect(result[0]).toHaveProperty('birthDate');
        expect(result[0]).toHaveProperty('address');
        expect(result[0]).toHaveProperty('maritalStatus', MaritalStatus.Single);
        expect(result[0]).toHaveProperty('baptismDate');
        expect(result[0]).toHaveProperty('ministries', 'Louvor, Jovens');
        expect(result[0]).toHaveProperty('status', MemberStatus.Active);
        expect(result[0]).toHaveProperty('createdAt');
      });

      it('should handle members without optional fields', async () => {
        const members = [
          createTestMember({
            id: 'member-1',
            baptismDate: undefined,
            ministries: [],
            address: undefined as any
          })
        ];
        mockRepository.findAll.mockResolvedValue(members);

        const result = await memberService.exportMembers();

        expect(result[0].baptismDate).toBe('');
        expect(result[0].ministries).toBe('');
        expect(result[0].address).toBe('');
      });

      it('should export empty array when no members', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        const result = await memberService.exportMembers();

        expect(result).toEqual([]);
      });
    });

    describe('generateReport', () => {
      beforeEach(() => {
        // Setup common mocks for statistics
        mockRepository.countTotal.mockResolvedValue(100);
        mockRepository.countByStatus.mockResolvedValue(25);
        mockRepository.getAgeDistribution.mockResolvedValue(new Map());
        mockRepository.getGrowthStats.mockResolvedValue(5);
      });

      it('should generate report for all members', async () => {
        const allMembers = [
          createTestMember({ id: 'member-1' }),
          createTestMember({ id: 'member-2' })
        ];
        mockRepository.findAll.mockResolvedValue(allMembers);

        const result = await memberService.generateReport('all');

        expect(result.type).toBe('all');
        expect(result.members).toHaveLength(2);
        expect(result.count).toBe(2);
        expect(result.generatedAt).toBeInstanceOf(Date);
        expect(result.statistics).toBeDefined();
      });

      it('should generate report for active members', async () => {
        const activeMembers = [
          createTestMember({ id: 'active-1', status: MemberStatus.Active })
        ];
        mockRepository.findByStatus.mockResolvedValue(activeMembers);

        const result = await memberService.generateReport('active');

        expect(result.type).toBe('active');
        expect(mockRepository.findByStatus).toHaveBeenCalledWith(MemberStatus.Active);
        expect(result.members).toHaveLength(1);
      });

      it('should generate report for inactive members', async () => {
        const inactiveMembers = [
          createTestMember({ id: 'inactive-1', status: MemberStatus.Inactive })
        ];
        mockRepository.findByStatus.mockResolvedValue(inactiveMembers);

        const result = await memberService.generateReport('inactive');

        expect(result.type).toBe('inactive');
        expect(mockRepository.findByStatus).toHaveBeenCalledWith(MemberStatus.Inactive);
      });

      it('should generate report for birthdays', async () => {
        const birthdayMembers = [
          createTestMember({ id: 'birthday-1' })
        ];
        mockRepository.findBirthdays.mockResolvedValue(birthdayMembers);

        const result = await memberService.generateReport('birthdays');

        expect(result.type).toBe('birthdays');
        expect(mockRepository.findBirthdays).toHaveBeenCalled();
      });

      it('should default to all members when type not specified', async () => {
        const allMembers = [createTestMember()];
        mockRepository.findAll.mockResolvedValue(allMembers);

        const result = await memberService.generateReport();

        expect(result.type).toBe('all');
        expect(mockRepository.findAll).toHaveBeenCalled();
      });

      it('should include statistics in report', async () => {
        mockRepository.findAll.mockResolvedValue([]);

        const result = await memberService.generateReport('all');

        expect(result.statistics).toHaveProperty('total');
        expect(result.statistics).toHaveProperty('active');
        expect(result.statistics).toHaveProperty('inactive');
        expect(result.statistics).toHaveProperty('transferred');
        expect(result.statistics).toHaveProperty('disciplined');
        expect(result.statistics).toHaveProperty('ageDistribution');
        expect(result.statistics).toHaveProperty('monthlyGrowth');
      });
    });
  });

  // ===========================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================
  describe('Edge Cases and Error Handling', () => {
    it('should handle concurrent operations', async () => {
      const member1 = createTestMember({ id: 'member-1' });
      const member2 = createTestMember({ id: 'member-2' });

      mockRepository.findById
        .mockResolvedValueOnce(member1)
        .mockResolvedValueOnce(member2);

      const [result1, result2] = await Promise.all([
        memberService.getMemberById('member-1'),
        memberService.getMemberById('member-2')
      ]);

      expect(result1?.id).toBe('member-1');
      expect(result2?.id).toBe('member-2');
      expect(mockRepository.findById).toHaveBeenCalledTimes(2);
    });

    it('should handle special characters in search query', async () => {
      mockRepository.search.mockResolvedValue([]);

      await memberService.searchMembers('João "Test" <script>');

      expect(mockRepository.search).toHaveBeenCalledWith('João "Test" <script>');
    });

    it('should handle unicode characters in member data', async () => {
      const memberWithUnicode = createTestMember({
        name: 'José María García',
        address: createTestAddress({ street: 'Rua São João' })
      });
      mockRepository.findById.mockResolvedValue(memberWithUnicode);

      const result = await memberService.getMemberById('member-1');

      expect(result?.name).toBe('José María García');
    });

    it('should handle very long ministry lists', async () => {
      const manyMinistries = Array.from({ length: 50 }, (_, i) => `Ministry-${i}`);
      const memberWithManyMinistries = createTestMember({ ministries: manyMinistries });
      mockRepository.findAll.mockResolvedValue([memberWithManyMinistries]);

      const result = await memberService.exportMembers();

      expect(result[0].ministries.split(', ')).toHaveLength(50);
    });
  });

  // ===========================================
  // INTEGRATION SCENARIOS
  // ===========================================
  describe('Integration Scenarios', () => {
    it('should handle member lifecycle: create -> update -> discipline -> restore', async () => {
      // Create
      const newMember = createTestMember({ id: 'lifecycle-member' });
      mockRepository.create.mockResolvedValue(newMember);

      const created = await memberService.createMember({
        name: newMember.name,
        email: newMember.email,
        phone: newMember.phone,
        birthDate: newMember.birthDate,
        address: newMember.address,
        maritalStatus: newMember.maritalStatus,
        memberType: newMember.memberType,
        ministries: newMember.ministries,
        status: newMember.status,
        createdBy: newMember.createdBy
      });
      expect(created.id).toBe('lifecycle-member');

      // Update
      mockRepository.update.mockResolvedValue({ ...newMember, email: 'updated@example.com' });
      const updated = await memberService.updateMember('lifecycle-member', { email: 'updated@example.com' });
      expect(updated.email).toBe('updated@example.com');

      // Discipline
      mockRepository.disciplineMember.mockResolvedValue(undefined);
      await memberService.disciplineMember('lifecycle-member', 'Test reason', 'admin');
      expect(mockRepository.disciplineMember).toHaveBeenCalled();

      // Restore
      mockRepository.restoreMember.mockResolvedValue(undefined);
      await memberService.restoreMember('lifecycle-member', 'admin');
      expect(mockRepository.restoreMember).toHaveBeenCalled();
    });

    it('should handle search with filtering combination', async () => {
      const activeJoaos = [
        createTestMember({ id: '1', name: 'João Silva', status: MemberStatus.Active }),
        createTestMember({ id: '2', name: 'João Pedro', status: MemberStatus.Active })
      ];

      mockRepository.search.mockResolvedValue(activeJoaos);

      const searchResults = await memberService.searchMembers('João');

      expect(searchResults).toHaveLength(2);
      searchResults.forEach(member => {
        expect(member.name).toContain('João');
      });
    });
  });
});
