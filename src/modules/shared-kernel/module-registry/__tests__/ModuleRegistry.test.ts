import { ModuleDefinition, ModuleRegistry } from '../ModuleRegistry';

const createModule = (
  name: string,
  dependencies: string[] = [],
  initializeImpl?: jest.Mock
): ModuleDefinition => ({
  config: {
    name,
    version: '1.0.0',
    dependencies,
  },
  register: jest.fn(),
  initialize: initializeImpl ?? jest.fn().mockResolvedValue(undefined),
});

describe('ModuleRegistry', () => {
  let consoleLogSpy: jest.SpyInstance;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    ModuleRegistry.clear();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    ModuleRegistry.clear();
    jest.restoreAllMocks();
  });

  it('registra modulos e alerta sobre dependencias ausentes', () => {
    const module = createModule('users', ['shared']);

    ModuleRegistry.register(module);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "Module 'users' declares dependency 'shared' which is not registered yet"
    );
    expect(module.register).toHaveBeenCalledTimes(1);
    expect(ModuleRegistry.getModule('users')).toBe(module);
    expect(ModuleRegistry.listModules()).toEqual([module.config]);
  });

  it('inicializa dependencias antes do modulo e evita reinicializacao dupla', async () => {
    const initOrder: string[] = [];
    const shared = createModule('shared', [], jest.fn().mockImplementation(async () => {
      initOrder.push('shared');
    }));
    const users = createModule('users', ['shared'], jest.fn().mockImplementation(async () => {
      initOrder.push('users');
    }));

    ModuleRegistry.register(shared);
    ModuleRegistry.register(users);

    await ModuleRegistry.initialize('users');
    await ModuleRegistry.initialize('users');

    expect(initOrder).toEqual(['shared', 'users']);
    expect(shared.initialize).toHaveBeenCalledTimes(1);
    expect(users.initialize).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith("ModuleRegistry: initializing module 'shared'...");
    expect(consoleLogSpy).toHaveBeenCalledWith("ModuleRegistry: module 'users' initialized");
  });

  it('inicializa todos os modulos registrados e falha para modulos ausentes', async () => {
    const alpha = createModule('alpha');
    const beta = createModule('beta');

    ModuleRegistry.register(alpha);
    ModuleRegistry.register(beta);

    await ModuleRegistry.initializeAll();

    expect(alpha.initialize).toHaveBeenCalledTimes(1);
    expect(beta.initialize).toHaveBeenCalledTimes(1);
    expect(consoleLogSpy).toHaveBeenCalledWith('ModuleRegistry: all modules initialized');

    await expect(ModuleRegistry.initialize('missing')).rejects.toThrow(
      "Module 'missing' not found in registry"
    );
  });
});
