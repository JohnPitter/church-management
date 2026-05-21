describe('reportWebVitals', () => {
  beforeEach(() => {
    jest.resetModules();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('nao faz nada quando o callback nao e uma funcao', async () => {
    const webVitals = await import('web-vitals');
    const mockGetCLS = jest.spyOn(webVitals, 'getCLS').mockImplementation(jest.fn() as never);
    const mockGetFID = jest.spyOn(webVitals, 'getFID').mockImplementation(jest.fn() as never);
    const mockGetFCP = jest.spyOn(webVitals, 'getFCP').mockImplementation(jest.fn() as never);
    const mockGetLCP = jest.spyOn(webVitals, 'getLCP').mockImplementation(jest.fn() as never);
    const mockGetTTFB = jest.spyOn(webVitals, 'getTTFB').mockImplementation(jest.fn() as never);

    const { default: reportWebVitals } = await import('../reportWebVitals');

    reportWebVitals(undefined);
    reportWebVitals('invalid' as never);
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(mockGetCLS).not.toHaveBeenCalled();
    expect(mockGetFID).not.toHaveBeenCalled();
    expect(mockGetFCP).not.toHaveBeenCalled();
    expect(mockGetLCP).not.toHaveBeenCalled();
    expect(mockGetTTFB).not.toHaveBeenCalled();
  });

  it('registra todas as metricas quando recebe um callback valido', async () => {
    const webVitals = await import('web-vitals');
    const mockGetCLS = jest.spyOn(webVitals, 'getCLS').mockImplementation(jest.fn() as never);
    const mockGetFID = jest.spyOn(webVitals, 'getFID').mockImplementation(jest.fn() as never);
    const mockGetFCP = jest.spyOn(webVitals, 'getFCP').mockImplementation(jest.fn() as never);
    const mockGetLCP = jest.spyOn(webVitals, 'getLCP').mockImplementation(jest.fn() as never);
    const mockGetTTFB = jest.spyOn(webVitals, 'getTTFB').mockImplementation(jest.fn() as never);
    const mockOnPerfEntry = () => undefined;

    const { default: reportWebVitals } = await import('../reportWebVitals');

    await reportWebVitals(mockOnPerfEntry);

    expect(mockGetCLS).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetFID).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetFCP).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetLCP).toHaveBeenCalledWith(mockOnPerfEntry);
    expect(mockGetTTFB).toHaveBeenCalledWith(mockOnPerfEntry);
  });
});

export {};
