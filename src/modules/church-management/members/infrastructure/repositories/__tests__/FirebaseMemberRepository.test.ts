import {
  MaritalStatus,
  Member,
  MemberStatus,
  MemberType
} from '../../../domain/entities/Member';
import { FirebaseMemberRepository } from '../FirebaseMemberRepository';

jest.mock('@/config/firebase', () => ({
  db: {}
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  Timestamp: {
    now: jest.fn(),
    fromDate: jest.fn()
  },
  addDoc: jest.fn()
}));

const firestore = jest.requireMock('firebase/firestore');
const mockCollection = firestore.collection as jest.Mock;
const mockDoc = firestore.doc as jest.Mock;
const mockGetDoc = firestore.getDoc as jest.Mock;
const mockGetDocs = firestore.getDocs as jest.Mock;
const mockUpdateDoc = firestore.updateDoc as jest.Mock;
const mockDeleteDoc = firestore.deleteDoc as jest.Mock;
const mockQuery = firestore.query as jest.Mock;
const mockWhere = firestore.where as jest.Mock;
const mockOrderBy = firestore.orderBy as jest.Mock;
const mockTimestampNow = firestore.Timestamp.now as jest.Mock;
const mockTimestampFromDate = firestore.Timestamp.fromDate as jest.Mock;
const mockAddDoc = firestore.addDoc as jest.Mock;

describe('FirebaseMemberRepository', () => {
  let repository: FirebaseMemberRepository;

  const createTimestamp = (date: Date) => ({
    toDate: () => date
  });

  const createMember = (overrides: Partial<Member> = {}): Member => ({
    id: 'member-1',
    name: 'Maria Silva',
    email: 'maria@example.com',
    phone: '(11) 99999-9999',
    birthDate: new Date('1990-01-01T12:00:00.000Z'),
    address: {
      street: 'Rua A',
      number: '10',
      neighborhood: 'Centro',
      city: 'Sao Paulo',
      state: 'SP',
      zipCode: '01000-000'
    },
    maritalStatus: MaritalStatus.Single,
    memberType: MemberType.Member,
    baptismDate: new Date('2010-01-01T12:00:00.000Z'),
    conversionDate: new Date('2009-01-01T12:00:00.000Z'),
    ministries: ['Louvor'],
    role: 'Lider',
    observations: 'Obs',
    photoURL: 'https://example.com/photo.jpg',
    status: MemberStatus.Active,
    createdAt: new Date('2025-01-01T12:00:00.000Z'),
    updatedAt: new Date('2025-01-02T12:00:00.000Z'),
    createdBy: 'admin',
    ...overrides
  });

  const createDocSnapshot = (data: any, exists = true) => ({
    id: data?.id ?? 'doc-1',
    exists: () => exists,
    data: () => {
      if (!exists) return null;
      return {
        ...data,
        birthDate: data.birthDate ? createTimestamp(data.birthDate) : undefined,
        dataNascimento: data.dataNascimento ? createTimestamp(data.dataNascimento) : undefined,
        baptismDate: data.baptismDate ? createTimestamp(data.baptismDate) : undefined,
        conversionDate: data.conversionDate ? createTimestamp(data.conversionDate) : undefined,
        dadosBatismo: data.dadosBatismo,
        createdAt: data.createdAt ? createTimestamp(data.createdAt) : undefined,
        updatedAt: data.updatedAt ? createTimestamp(data.updatedAt) : undefined
      };
    }
  });

  const createQuerySnapshot = (docs: any[], empty = false) => ({
    empty,
    size: docs.length,
    docs: docs.map(item => createDocSnapshot(item))
  });

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new FirebaseMemberRepository();
    mockCollection.mockImplementation((...args) => ({ kind: 'collection', args }));
    mockDoc.mockImplementation((...args) => ({ kind: 'doc', args }));
    mockQuery.mockImplementation((...args) => ({ kind: 'query', args }));
    mockWhere.mockImplementation((...args) => ({ kind: 'where', args }));
    mockOrderBy.mockImplementation((...args) => ({ kind: 'orderBy', args }));
    mockTimestampNow.mockReturnValue(createTimestamp(new Date('2025-01-03T12:00:00.000Z')));
    mockTimestampFromDate.mockImplementation((date: Date) => createTimestamp(date));
  });

  it('finds members by id and email and returns null when not found', async () => {
    const member = createMember({ id: 'member-found' });
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(member));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(null, false));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([member]));
    mockGetDocs.mockResolvedValueOnce(createQuerySnapshot([], true));

    await expect(repository.findById('member-found')).resolves.toEqual(expect.objectContaining({ id: 'member-found' }));
    await expect(repository.findById('missing')).resolves.toBeNull();
    await expect(repository.findByEmail('MARIA@example.com')).resolves.toEqual(expect.objectContaining({ id: 'member-found' }));
    await expect(repository.findByEmail('missing@example.com')).resolves.toBeNull();
    expect(mockWhere).toHaveBeenCalledWith('email', '==', 'maria@example.com');
  });

  it('lists and filters members and supports birthday and search helpers', async () => {
    const maria = createMember({ id: 'maria', birthDate: new Date('1990-05-01T12:00:00.000Z') });
    const joao = createMember({
      id: 'joao',
      name: 'João Souza',
      email: 'joao@example.com',
      phone: '(11) 98888-7777',
      birthDate: new Date('1985-08-01T12:00:00.000Z'),
      status: MemberStatus.Inactive,
      ministries: ['Infantil']
    });
    mockGetDocs
      .mockResolvedValueOnce(createQuerySnapshot([maria, joao]))
      .mockResolvedValueOnce(createQuerySnapshot([maria]))
      .mockResolvedValueOnce(createQuerySnapshot([joao]));
    jest.spyOn(repository, 'findAll').mockResolvedValueOnce([maria, joao]).mockResolvedValueOnce([maria, joao]);

    await expect(repository.findAll()).resolves.toHaveLength(2);
    await expect(repository.findByStatus(MemberStatus.Active)).resolves.toEqual(
      expect.arrayContaining([expect.objectContaining({ id: 'maria' })])
    );
    await expect(repository.findByMinistry('Infantil')).resolves.toHaveLength(1);
    await expect(repository.findBirthdays(5)).resolves.toEqual([expect.objectContaining({ id: 'maria' })]);
    await expect(repository.search('joao')).resolves.toEqual([expect.objectContaining({ id: 'joao' })]);

    expect(mockOrderBy).toHaveBeenCalledWith('name', 'asc');
    expect(mockWhere).toHaveBeenCalledWith('status', '==', MemberStatus.Active);
    expect(mockWhere).toHaveBeenCalledWith('ministries', 'array-contains', 'Infantil');
  });

  it('creates and updates members with date conversion and backward-compatible mapping', async () => {
    const legacyMember = createMember({
      id: 'legacy',
      name: undefined as any,
      email: '',
      phone: undefined as any,
      birthDate: undefined as any,
      address: undefined as any,
      maritalStatus: undefined as any,
      ministries: undefined as any,
      memberType: undefined as any
    });
    const legacyData = {
      ...legacyMember,
      nome: 'Legado',
      telefone: '(11) 90000-0000',
      endereco: createMember().address,
      estadoCivil: MaritalStatus.Married,
      dataNascimento: new Date('1980-01-01T12:00:00.000Z'),
      ministerios: ['Intercessão'],
      dadosBatismo: { data: createTimestamp(new Date('2000-01-01T12:00:00.000Z')) }
    };

    mockAddDoc.mockResolvedValueOnce({ id: 'member-created' });
    jest.spyOn(repository, 'findById').mockResolvedValueOnce(createMember({ id: 'member-updated', name: 'Atualizado' }));
    mockGetDoc.mockResolvedValueOnce(createDocSnapshot(legacyData));

    const baseMember = createMember();
    const created = await repository.create({
      name: baseMember.name,
      email: baseMember.email,
      phone: baseMember.phone,
      birthDate: baseMember.birthDate,
      address: baseMember.address,
      maritalStatus: baseMember.maritalStatus,
      memberType: baseMember.memberType,
      baptismDate: baseMember.baptismDate,
      conversionDate: baseMember.conversionDate,
      ministries: baseMember.ministries,
      role: baseMember.role,
      observations: baseMember.observations,
      photoURL: baseMember.photoURL,
      status: baseMember.status,
      createdBy: baseMember.createdBy
    });
    const updated = await repository.update('member-updated', {
      id: 'ignore',
      createdAt: new Date(),
      name: 'Atualizado',
      birthDate: createMember().birthDate,
      baptismDate: createMember().baptismDate,
      conversionDate: createMember().conversionDate
    });
    const legacy = await repository.findById('legacy');

    expect(created).toEqual(expect.objectContaining({ id: 'member-created' }));
    expect(mockTimestampFromDate).toHaveBeenCalledWith(createMember().birthDate);
    expect(updated).toEqual(expect.objectContaining({ id: 'member-updated', name: 'Atualizado' }));
    expect(legacy).toEqual(expect.objectContaining({
      id: 'legacy',
      name: 'Legado',
      phone: '(11) 90000-0000',
      ministries: ['Intercessão'],
      memberType: MemberType.Member
    }));
  });

  it('deletes, transfers, disciplines, restores and counts members', async () => {
    mockGetDocs
      .mockResolvedValueOnce({ size: 10 })
      .mockResolvedValueOnce({ size: 7 })
      .mockResolvedValueOnce({ size: 3 });

    await repository.delete('member-delete');
    await repository.transferMember('member-transfer', 'Igreja B', 'admin');
    await repository.disciplineMember('member-discipline', 'Falta', 'pastor');
    await repository.restoreMember('member-restore', 'pastor');
    const total = await repository.countTotal();
    const active = await repository.countByStatus(MemberStatus.Active);
    const ministry = await repository.countByMinistry('Louvor');

    expect(mockDeleteDoc).toHaveBeenCalled();
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: MemberStatus.Transferred, transferredTo: 'Igreja B' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: MemberStatus.Disciplined, disciplineReason: 'Falta' }));
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ status: MemberStatus.Active, restoredBy: 'pastor' }));
    expect(total).toBe(10);
    expect(active).toBe(7);
    expect(ministry).toBe(3);
  });

  it('calculates age distribution and growth stats', async () => {
    const today = new Date();
    const members = [
      createMember({ birthDate: new Date(today.getFullYear() - 10, 0, 1) }),
      createMember({ birthDate: new Date(today.getFullYear() - 25, 0, 1), id: 'm2' }),
      createMember({ birthDate: new Date(today.getFullYear() - 40, 0, 1), id: 'm3' }),
      createMember({ birthDate: new Date(today.getFullYear() - 60, 0, 1), id: 'm4' }),
      createMember({ birthDate: new Date(today.getFullYear() - 80, 0, 1), id: 'm5' })
    ];
    jest.spyOn(repository, 'findAll').mockResolvedValueOnce(members);
    mockGetDocs.mockResolvedValueOnce({ size: 4 });

    const distribution = await repository.getAgeDistribution();
    const growth = await repository.getGrowthStats(new Date('2025-01-01T00:00:00.000Z'), new Date('2025-12-31T23:59:59.999Z'));

    expect(distribution.get('0-17')).toBe(1);
    expect(distribution.get('18-29')).toBe(1);
    expect(distribution.get('30-49')).toBe(1);
    expect(distribution.get('50-69')).toBe(1);
    expect(distribution.get('70+')).toBe(1);
    expect(growth).toBe(4);
  });
});
