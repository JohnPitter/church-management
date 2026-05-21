import { DIContainer } from '../Container';

class SampleService {
  value = 'ok';
}

describe('DIContainer', () => {
  beforeEach(() => {
    DIContainer.clear();
  });

  it('registra e resolve singletons', () => {
    DIContainer.registerSingleton('sample-singleton', SampleService);

    const first = DIContainer.resolve<SampleService>('sample-singleton');
    const second = DIContainer.resolve<SampleService>('sample-singleton');

    expect(first).toBeInstanceOf(SampleService);
    expect(second).toBe(first);
    expect(DIContainer.isRegistered('sample-singleton')).toBe(true);
  });

  it('registra transient e instancias especificas', () => {
    DIContainer.register('sample-transient', SampleService);
    const instance = { fixed: true };
    DIContainer.registerInstance('sample-instance', instance);

    const first = DIContainer.resolve<SampleService>('sample-transient');
    const second = DIContainer.resolve<SampleService>('sample-transient');

    expect(first).toBeInstanceOf(SampleService);
    expect(second).toBeInstanceOf(SampleService);
    expect(second).not.toBe(first);
    expect(DIContainer.resolve('sample-instance')).toBe(instance);
  });
});
