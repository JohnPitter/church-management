import { render, screen } from '@testing-library/react';
import AdminVerseOfTheDay from '../AdminVerseOfTheDay';

const mockGetTodaysAdminVerse = jest.fn();
const mockUseSettings = jest.fn();

jest.mock('../../../services/AdminVerseService', () => ({
  adminVerseService: {
    getTodaysAdminVerse: () => mockGetTodaysAdminVerse(),
  },
}));

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings(),
}));

describe('AdminVerseOfTheDay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockUseSettings.mockReturnValue({
      settings: {
        primaryColor: '#2563eb',
        secondaryColor: '#7c3aed',
      },
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza loading e depois o versiculo do lider', async () => {
    mockGetTodaysAdminVerse.mockReturnValue({
      text: 'Ora, e necessario que o administrador seja fiel.',
      reference: '1 Corintios 4:2',
      version: 'NTLH',
    });

    render(<AdminVerseOfTheDay />);

    expect(await screen.findByText(/administrador seja fiel/i)).toBeInTheDocument();
    expect(screen.getByText(/1 Corintios 4:2/)).toBeInTheDocument();
  });

  it('usa fallback em erro', async () => {
    mockGetTodaysAdminVerse.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    render(<AdminVerseOfTheDay />);

    expect(await screen.findByText(/1 Coríntios 4:2/)).toBeInTheDocument();
    expect(mockGetTodaysAdminVerse).toHaveBeenCalledTimes(1);
  });
});
