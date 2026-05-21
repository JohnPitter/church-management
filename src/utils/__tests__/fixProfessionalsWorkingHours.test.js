const mockInitializeApp = jest.fn(() => 'app');
const mockGetFirestore = jest.fn(() => 'db');
const mockCollection = jest.fn(() => 'collection-ref');
const mockGetDocs = jest.fn();
const mockDoc = jest.fn((...args) => ({ args }));
const mockUpdateDoc = jest.fn();

jest.mock('firebase/app', () => ({
  initializeApp: (...args) => mockInitializeApp(...args),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: (...args) => mockGetFirestore(...args),
  collection: (...args) => mockCollection(...args),
  getDocs: (...args) => mockGetDocs(...args),
  updateDoc: (...args) => mockUpdateDoc(...args),
  doc: (...args) => mockDoc(...args),
}));

jest.mock('../../config/firebase', () => ({
  firebaseConfig: { projectId: 'test' },
}));

describe('fixProfessionalsWorkingHours', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('atualiza profissionais sem horarios ou tempo de consulta', async () => {
    const { fixProfessionalsWorkingHours } = require('../fixProfessionalsWorkingHours');

    mockGetDocs.mockResolvedValue({
      docs: [
        {
          id: 'p1',
          data: () => ({ nome: 'Ana', horariosFuncionamento: [], tempoConsulta: 0 }),
        },
        {
          id: 'p2',
          data: () => ({ nome: 'Bruno', horariosFuncionamento: [{ diaSemana: 1 }], tempoConsulta: 50 }),
        },
      ],
    });

    await fixProfessionalsWorkingHours();

    expect(mockInitializeApp).toHaveBeenCalled();
    expect(mockCollection.mock.calls[0][1]).toBe('profissionaisAssistencia');
    expect(mockUpdateDoc).toHaveBeenCalledTimes(1);
    expect(mockUpdateDoc.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        horariosFuncionamento: expect.any(Array),
        tempoConsulta: 50,
      })
    );
  });

  it('loga erro sem propagar quando a consulta falha', async () => {
    const { fixProfessionalsWorkingHours } = require('../fixProfessionalsWorkingHours');
    const error = new Error('boom');
    mockGetDocs.mockRejectedValue(error);

    await expect(fixProfessionalsWorkingHours()).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalledWith('❌ Error fixing professionals:', error);
  });
});
