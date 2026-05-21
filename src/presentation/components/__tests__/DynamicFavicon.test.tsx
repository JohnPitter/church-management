import { render } from '@testing-library/react';
import { DynamicFavicon } from '../DynamicFavicon';

const mockUseSettings = jest.fn();

jest.mock('../../contexts/SettingsContext', () => ({
  useSettings: () => mockUseSettings(),
}));

describe('DynamicFavicon', () => {
  beforeEach(() => {
    document.head.innerHTML = `
      <link rel="icon" href="old.ico" />
      <link rel="apple-touch-icon" href="old-apple.ico" />
      <meta property="og:image" content="old-og.png" />
      <meta property="twitter:image" content="old-twitter.png" />
      <meta property="og:title" content="Old Title" />
      <meta property="twitter:title" content="Old Title" />
      <meta property="og:site_name" content="Old Site" />
    `;
    document.title = 'Old';
  });

  it('atualiza favicon e metadados quando ha logo e nome', () => {
    mockUseSettings.mockReturnValue({
      settings: {
        logoURL: 'https://example.com/logo.png',
        churchName: 'Test Church',
      },
    });

    render(<DynamicFavicon />);

    expect((document.querySelector("link[rel*='icon']") as HTMLLinkElement).href).toContain('logo.png');
    expect((document.querySelector("link[rel='apple-touch-icon']") as HTMLLinkElement).href).toContain('logo.png');
    expect((document.querySelector("meta[property='og:image']") as HTMLMetaElement).content).toContain('logo.png');
    expect((document.querySelector("meta[property='twitter:image']") as HTMLMetaElement).content).toContain('logo.png');
    expect(document.title).toBe('Test Church');
  });

  it('cria favicon quando nao existe e nao faz nada sem settings', () => {
    document.head.innerHTML = '';
    mockUseSettings.mockReturnValue({ settings: undefined });
    const { rerender } = render(<DynamicFavicon />);

    expect(document.querySelector("link[rel*='icon']")).toBeNull();

    mockUseSettings.mockReturnValue({
      settings: { logoURL: 'https://example.com/new-logo.png', churchName: 'Another Church' },
    });
    rerender(<DynamicFavicon />);

    expect((document.querySelector("link[rel='icon']") as HTMLLinkElement).href).toContain('new-logo.png');
    expect(document.title).toBe('Another Church');
  });
});
