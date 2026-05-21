import { render, screen, waitFor } from '@testing-library/react';
import HomeSimplified from '../HomeSimplified';

const mockNavigate = jest.fn();
const mockHasPermission = jest.fn();
const mockGetSettings = jest.fn();
const mockGetVerseOfTheDay = jest.fn();

jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}));

jest.mock('presentation/hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: mockHasPermission,
  }),
}));

jest.mock('@modules/content-management/home-settings/application/services/HomeSettingsService', () => ({
  HomeSettingsService: class {
    getSettings = mockGetSettings;
  },
}));

jest.mock('data/verses', () => ({
  getVerseOfTheDay: () => mockGetVerseOfTheDay(),
}));

jest.mock('presentation/components/HomeLayouts/CanvaHomeLayout', () => ({
  CanvaHomeLayout: ({ sections }: any) => <div>Canva Layout {String(sections.hero)}</div>,
}));

jest.mock('presentation/components/HomeLayouts/AppleHomeLayout', () => ({
  AppleHomeLayout: () => <div>Apple Layout</div>,
}));

jest.mock('presentation/components/HomeLayouts/EnterpriseHomeLayout', () => ({
  EnterpriseHomeLayout: () => <div>Enterprise Layout</div>,
}));

describe('HomeSimplified', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    mockGetVerseOfTheDay.mockReturnValue({ text: 'Verse', reference: 'Jo 3:16' });
    mockGetSettings.mockResolvedValue({
      id: 'cfg',
      layoutStyle: 'canva',
      sections: { hero: true },
      updatedAt: new Date(),
      updatedBy: '',
    });
    mockHasPermission.mockReturnValue(false);
    localStorage.clear();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('mostra loading e depois renderiza layout canva', async () => {
    render(<HomeSimplified />);

    expect(await screen.findByText(/Canva Layout/)).toBeInTheDocument();
  });

  it('usa fallback default quando falha ao buscar configuracoes', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    mockGetSettings.mockRejectedValueOnce(new Error('boom'));

    render(<HomeSimplified />);

    expect(await screen.findByText(/Canva Layout/)).toBeInTheDocument();
  });

  it('renderiza layouts alternativos e redireciona profissionais', async () => {
    localStorage.setItem('currentUser', JSON.stringify({ role: 'professional' }));
    mockHasPermission.mockReturnValue(true);

    mockGetSettings.mockResolvedValueOnce({
      id: 'cfg1',
      layoutStyle: 'apple',
      sections: { hero: true },
      updatedAt: new Date(),
      updatedBy: '',
    });
    const { unmount } = render(<HomeSimplified />);
    expect(await screen.findByText('Apple Layout')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/professional');

    unmount();

    mockGetSettings.mockResolvedValueOnce({
      id: 'cfg2',
      layoutStyle: 'enterprise',
      sections: { hero: true },
      updatedAt: new Date(),
      updatedBy: '',
    });
    render(<HomeSimplified />);
    await waitFor(() => {
      expect(screen.getByText('Enterprise Layout')).toBeInTheDocument();
    });
  });
});
