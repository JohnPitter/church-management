import { DataMigrationService } from '../DataMigrationService';

jest.mock('@/config/firebase', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(() => 'collection-ref'),
  doc: jest.fn(() => 'doc-ref'),
  setDoc: jest.fn().mockResolvedValue(undefined),
  Timestamp: {
    now: () => ({ toDate: () => new Date('2026-03-10T10:00:00') }),
  },
}));

describe('DataMigrationService', () => {
  const service = DataMigrationService.getInstance() as any;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mantem singleton e faz parse de datas', () => {
    expect(DataMigrationService.getInstance()).toBe(DataMigrationService.getInstance());
    expect(service.parseDate('10/03/2026')).toEqual(new Date(2026, 2, 10));
    expect(service.parseDate('')).toBeNull();
    expect(service.parseDate('2026-03-10')).toBeNull();
  });

  it('mapeia escolaridade e estados civis para os enums novos', () => {
    expect(service.mapEscolaridade(8)).toBeDefined();
    expect(service.mapSituacaoFamiliar(2)).toBeDefined();
    expect(service.mapMaritalStatus(4)).toBeDefined();
  });

  it('valida estrutura minima dos dados antigos', () => {
    expect(service.validateOldData(null).valid).toBe(false);
    expect(service.validateOldData({ foo: {} }).valid).toBe(false);
    expect(service.validateOldData({ assistidos: {} }).valid).toBe(true);
  });

  it('executa migracao com colecoes suportadas', async () => {
    jest.spyOn(service, 'migrateAssistidos').mockResolvedValue(undefined);
    jest.spyOn(service, 'migrateMembros').mockResolvedValue(undefined);
    jest.spyOn(service, 'migrateEventos').mockResolvedValue(undefined);

    const result = await service.migrateData({
      assistidos: { a: {} },
      membros: { b: {} },
      eventos: { c: {} },
    });

    expect(service.migrateAssistidos).toHaveBeenCalled();
    expect(service.migrateMembros).toHaveBeenCalled();
    expect(service.migrateEventos).toHaveBeenCalled();
    expect(result.totalRecords).toBe(3);
    expect(result.success).toBe(true);
  });

  it('encapsula erro da migracao completa', async () => {
    jest.spyOn(service, 'migrateAssistidos').mockRejectedValueOnce(new Error('boom'));

    await expect(
      service.migrateData({ assistidos: { a: {} } })
    ).rejects.toThrow('Erro na migração');
  });
});
