import { LogSeederService } from '../LogSeederService';

const mockCreate = jest.fn();
const mockClearAll = jest.fn();

jest.mock('@modules/shared-kernel/logging/infrastructure/repositories/FirebaseLogRepository', () => ({
  FirebaseLogRepository: jest.fn().mockImplementation(() => ({
    create: (...args: any[]) => mockCreate(...args),
    clearAll: (...args: any[]) => mockClearAll(...args),
  })),
}));

describe('LogSeederService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cria logs de exemplo e continua mesmo se um create falhar', async () => {
    mockCreate.mockRejectedValueOnce(new Error('fail')).mockResolvedValue(undefined);

    const service = new LogSeederService();
    (service as any).logRepository = { create: mockCreate, clearAll: mockClearAll };
    await service.createSampleLogs();

    expect(mockCreate).toHaveBeenCalled();
    expect(mockCreate.mock.calls.length).toBeGreaterThan(10);
    expect(console.error).toHaveBeenCalledWith('Error creating sample log:', expect.any(Error));
  });

  it('limpa logs existentes antes de recriar o seed', async () => {
    mockCreate.mockResolvedValue(undefined);
    mockClearAll.mockResolvedValue(undefined);

    const service = new LogSeederService();
    (service as any).logRepository = { create: mockCreate, clearAll: mockClearAll };
    await service.clearAndCreateSampleLogs();

    expect(mockClearAll).toHaveBeenCalledTimes(1);
    expect(mockCreate).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Sample logs created successfully!');
  });

  it('loga erro quando falha ao limpar e recriar', async () => {
    mockClearAll.mockRejectedValueOnce(new Error('clear failed'));

    const service = new LogSeederService();
    (service as any).logRepository = { create: mockCreate, clearAll: mockClearAll };
    await expect(service.clearAndCreateSampleLogs()).resolves.toBeUndefined();

    expect(console.error).toHaveBeenCalledWith('Error creating sample logs:', expect.any(Error));
  });
});
