import { HomeSettingsService } from '../HomeSettingsService';
import { DEFAULT_HOME_SETTINGS } from '../../../domain/entities/HomeSettings';

var mockGetDoc: jest.Mock;
var mockSetDoc: jest.Mock;
var mockDoc: jest.Mock;
var mockTimestampNow: jest.Mock;

jest.mock('firebase/firestore', () => ({
  getDoc: (docRef: unknown) => mockGetDoc(docRef),
  setDoc: (docRef: unknown, data: unknown, options?: unknown) => mockSetDoc(docRef, data, options),
  doc: (...args: unknown[]) => mockDoc(...args),
  Timestamp: {
    now: () => mockTimestampNow(),
  },
}));

jest.mock('@/config/firebase', () => ({
  db: {},
}));

describe('HomeSettingsService', () => {
  const service = new HomeSettingsService();

  beforeEach(() => {
    mockGetDoc = jest.fn();
    mockSetDoc = jest.fn();
    mockDoc = jest.fn(() => 'doc-ref');
    mockTimestampNow = jest.fn(() => 'ts-now');
    jest.clearAllMocks();
  });

  it('retorna configuracoes salvas quando o documento existe', async () => {
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      id: 'config',
      data: () => ({
        layoutStyle: 'modern',
        sections: { hero: true },
        customization: { title: 'Home' },
        updatedAt: { toDate: () => new Date('2024-01-01') },
        updatedBy: 'user-1',
      }),
    });

    const result = await service.getSettings();

    expect(result.id).toBe('config');
    expect(result.layoutStyle).toBe('modern');
    expect(result.updatedBy).toBe('user-1');
  });

  it('retorna defaults quando o documento nao existe', async () => {
    mockGetDoc.mockResolvedValue({ exists: () => false });

    const result = await service.getSettings();

    expect(result.id).toBe('config');
    expect(result.layoutStyle).toBe(DEFAULT_HOME_SETTINGS.layoutStyle);
    expect(mockSetDoc).not.toHaveBeenCalled();
  });

  it('persiste layout, sections, customization, settings completos e reset', async () => {
    await service.updateLayoutStyle('classic' as any, 'user-a');
    await service.updateSections({ hero: false } as any, 'user-b');
    await service.updateCustomization({ heroTitle: 'Oi' } as any, 'user-c');
    await service.updateSettings({ layoutStyle: 'modern' as any }, 'user-d');
    await service.resetToDefaults('user-e');

    expect(mockSetDoc).toHaveBeenCalledTimes(5);
    expect(mockSetDoc.mock.calls[0][1]).toEqual(
      expect.objectContaining({ layoutStyle: 'classic', updatedBy: 'user-a' })
    );
    expect(mockSetDoc.mock.calls[0][2]).toEqual({ merge: true });
    expect(mockSetDoc.mock.calls[4][1]).toEqual(
      expect.objectContaining({ updatedBy: 'user-e' })
    );
  });

  it('propaga erros dos metodos de escrita e leitura', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('read failed'));
    await expect(service.getSettings()).rejects.toThrow('read failed');

    mockSetDoc.mockRejectedValueOnce(new Error('write failed'));
    await expect(service.updateLayoutStyle('classic' as any, 'user')).rejects.toThrow('write failed');
  });
});
