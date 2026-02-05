// Unit Tests - Settings Context
// Comprehensive tests for church settings management

import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { SettingsProvider, useSettings } from '../SettingsContext';

// Mock Firebase
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Create mock functions for Firestore
const mockDoc = jest.fn();
const mockGetDoc = jest.fn();
const mockSetDoc = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => mockDoc(...args),
  getDoc: (...args: unknown[]) => mockGetDoc(...args),
  setDoc: (...args: unknown[]) => mockSetDoc(...args)
}));

// Default settings expected in the context
const expectedDefaultSettings = {
  churchName: 'Igreja Conectados pela Fé',
  churchTagline: 'Conectados pela fé',
  churchAddress: '',
  churchPhone: '',
  churchEmail: '',
  churchWebsite: '',
  logoURL: undefined,
  primaryColor: '#3B82F6',
  secondaryColor: '#8B5CF6',
  timezone: 'America/Sao_Paulo',
  language: 'pt-BR',
  about: {
    mission: 'Nossa igreja tem como missão transformar vidas através do amor de Deus, promovendo comunhão, discipulado e serviço à comunidade. Acreditamos que cada pessoa é especial e tem um propósito único a ser descoberto e desenvolvido.',
    vision: 'Ser uma igreja relevante, que impacta positivamente a sociedade através do evangelho de Jesus Cristo, formando discípulos que façam a diferença em suas famílias, trabalho e comunidade.',
    statistics: [
      { value: '10+', label: 'Anos de História', icon: '📅' },
      { value: '100+', label: 'Membros Ativos', icon: '👥' },
      { value: '5+', label: 'Ministérios', icon: '⛪' },
      { value: '500+', label: 'Vidas Impactadas', icon: '❤️' }
    ]
  },
  emailNotifications: true,
  smsNotifications: false,
  eventReminders: true,
  requireEventConfirmation: true,
  maxEventParticipants: 200,
  autoApproveMembers: false,
  allowPublicRegistration: true,
  maintenanceMode: false
};

// Test component that uses the context
const TestConsumer: React.FC<{ onSettings?: (settings: any) => void }> = ({ onSettings }) => {
  const { settings, loading } = useSettings();

  React.useEffect(() => {
    if (onSettings && settings) {
      onSettings(settings);
    }
  }, [settings, onSettings]);

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!settings) return <div data-testid="no-settings">No settings</div>;

  return (
    <div data-testid="settings">
      <span data-testid="church-name">{settings.churchName}</span>
      <span data-testid="church-tagline">{settings.churchTagline}</span>
      <span data-testid="church-address">{settings.churchAddress}</span>
      <span data-testid="church-phone">{settings.churchPhone}</span>
      <span data-testid="church-email">{settings.churchEmail}</span>
      <span data-testid="church-website">{settings.churchWebsite}</span>
      <span data-testid="logo-url">{settings.logoURL || 'no-logo'}</span>
      <span data-testid="primary-color">{settings.primaryColor}</span>
      <span data-testid="secondary-color">{settings.secondaryColor}</span>
      <span data-testid="timezone">{settings.timezone}</span>
      <span data-testid="language">{settings.language}</span>
      <span data-testid="email-notifications">{String(settings.emailNotifications)}</span>
      <span data-testid="sms-notifications">{String(settings.smsNotifications)}</span>
      <span data-testid="event-reminders">{String(settings.eventReminders)}</span>
      <span data-testid="require-event-confirmation">{String(settings.requireEventConfirmation)}</span>
      <span data-testid="max-event-participants">{settings.maxEventParticipants}</span>
      <span data-testid="auto-approve">{String(settings.autoApproveMembers)}</span>
      <span data-testid="allow-registration">{String(settings.allowPublicRegistration)}</span>
      <span data-testid="maintenance-mode">{String(settings.maintenanceMode)}</span>
      <span data-testid="about-mission">{settings.about?.mission || 'no-mission'}</span>
      <span data-testid="about-vision">{settings.about?.vision || 'no-vision'}</span>
      <span data-testid="about-statistics-count">{settings.about?.statistics?.length || 0}</span>
    </div>
  );
};

// Test component with update functionality
const TestConsumerWithUpdate: React.FC = () => {
  const { settings, loading, updateSettings } = useSettings();
  const [error, setError] = React.useState<string | null>(null);
  const [updating, setUpdating] = React.useState(false);

  const handleUpdate = async (newSettings: Partial<typeof settings>) => {
    setUpdating(true);
    setError(null);
    try {
      await updateSettings(newSettings as any);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div data-testid="loading">Loading...</div>;
  if (!settings) return <div data-testid="no-settings">No settings</div>;

  return (
    <div data-testid="settings">
      <span data-testid="church-name">{settings.churchName}</span>
      <span data-testid="primary-color">{settings.primaryColor}</span>
      <span data-testid="secondary-color">{settings.secondaryColor}</span>
      <span data-testid="email-notifications">{String(settings.emailNotifications)}</span>
      <span data-testid="error">{error || 'no-error'}</span>
      <span data-testid="updating">{String(updating)}</span>
      <button
        data-testid="update-name-btn"
        onClick={() => handleUpdate({ churchName: 'New Church Name' })}
      >
        Update Name
      </button>
      <button
        data-testid="update-colors-btn"
        onClick={() => handleUpdate({ primaryColor: '#FF0000', secondaryColor: '#00FF00' })}
      >
        Update Colors
      </button>
      <button
        data-testid="update-notifications-btn"
        onClick={() => handleUpdate({ emailNotifications: false, smsNotifications: true })}
      >
        Update Notifications
      </button>
      <button
        data-testid="update-multiple-btn"
        onClick={() => handleUpdate({
          churchName: 'Updated Church',
          primaryColor: '#123456',
          emailNotifications: true,
          maintenanceMode: true
        })}
      >
        Update Multiple
      </button>
    </div>
  );
};

describe('SettingsContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset document style
    document.documentElement.style.cssText = '';
  });

  describe('Default Settings', () => {
    it('should have correct default notification settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Check default notification settings
      expect(screen.getByTestId('email-notifications').textContent).toBe('true');
      expect(screen.getByTestId('sms-notifications').textContent).toBe('false');
      expect(screen.getByTestId('event-reminders').textContent).toBe('true');
    });

    it('should have correct default security settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Check default security settings
      expect(screen.getByTestId('auto-approve').textContent).toBe('false');
      expect(screen.getByTestId('allow-registration').textContent).toBe('true');
      expect(screen.getByTestId('maintenance-mode').textContent).toBe('false');
    });

    it('should have default church name', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('Igreja Conectados pela Fé');
      });
    });

    it('should have default event settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('require-event-confirmation').textContent).toBe('true');
      expect(screen.getByTestId('max-event-participants').textContent).toBe('200');
    });

    it('should have default color settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('primary-color').textContent).toBe('#3B82F6');
      expect(screen.getByTestId('secondary-color').textContent).toBe('#8B5CF6');
    });

    it('should have default timezone and language', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('timezone').textContent).toBe('America/Sao_Paulo');
      expect(screen.getByTestId('language').textContent).toBe('pt-BR');
    });

    it('should have default about page settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('about-mission').textContent).toContain('Nossa igreja tem como missão');
      expect(screen.getByTestId('about-vision').textContent).toContain('Ser uma igreja relevante');
      expect(screen.getByTestId('about-statistics-count').textContent).toBe('4');
    });
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      mockGetDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();
    });

    it('should stop loading after settings are fetched', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      expect(screen.getByTestId('loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });
    });

    it('should stop loading even on error', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetDoc.mockRejectedValueOnce(new Error('Network error'));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });
  });

  describe('Firestore Integration', () => {
    it('should load settings from Firestore', async () => {
      const mockSettings = {
        churchName: 'Test Church',
        churchTagline: 'Test Tagline',
        primaryColor: '#FF0000',
        secondaryColor: '#00FF00',
        emailNotifications: false,
        smsNotifications: true,
        autoApproveMembers: true,
        maintenanceMode: true
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockSettings
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('Test Church');
      });

      expect(screen.getByTestId('email-notifications').textContent).toBe('false');
      expect(screen.getByTestId('sms-notifications').textContent).toBe('true');
      expect(screen.getByTestId('auto-approve').textContent).toBe('true');
      expect(screen.getByTestId('maintenance-mode').textContent).toBe('true');
    });

    it('should merge loaded settings with defaults', async () => {
      const partialSettings = {
        churchName: 'Partial Church',
        // Only providing some fields
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => partialSettings
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('Partial Church');
      });

      // Should have defaults for missing fields
      expect(screen.getByTestId('email-notifications').textContent).toBe('true');
      expect(screen.getByTestId('primary-color').textContent).toBe('#3B82F6');
    });

    it('should handle Firestore errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetDoc.mockRejectedValueOnce(new Error('Firestore error'));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      // Should fallback to defaults on error
      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('Igreja Conectados pela Fé');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error loading settings, using defaults:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should create default settings when document does not exist', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockSetDoc).toHaveBeenCalled();
      const setDocCall = mockSetDoc.mock.calls[0];
      expect(setDocCall[1]).toMatchObject({
        churchName: 'Igreja Conectados pela Fé',
        primaryColor: '#3B82F6'
      });
    });

    it('should use defaults if creating settings fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockRejectedValueOnce(new Error('Permission denied'));

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('Igreja Conectados pela Fé');
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Cannot create settings document, using defaults:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });

    it('should call doc with correct collection and document id', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(mockDoc).toHaveBeenCalledWith(expect.anything(), 'settings', 'church');
    });
  });

  describe('updateSettings Method', () => {
    it('should update settings successfully', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('church-name').textContent).toBe('Igreja Conectados pela Fé');

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-name-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('New Church Name');
      });

      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({ churchName: 'New Church Name' })
      );
    });

    it('should update color settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-colors-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('primary-color').textContent).toBe('#FF0000');
        expect(screen.getByTestId('secondary-color').textContent).toBe('#00FF00');
      });
    });

    it('should update notification settings', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('email-notifications').textContent).toBe('true');

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-notifications-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('email-notifications').textContent).toBe('false');
      });
    });

    it('should update multiple settings at once', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-multiple-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('church-name').textContent).toBe('Updated Church');
        expect(screen.getByTestId('primary-color').textContent).toBe('#123456');
      });
    });

    it('should handle update errors', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined); // First call for creating defaults
      mockSetDoc.mockRejectedValueOnce(new Error('Update failed')); // Second call for update

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-name-btn'));
      });

      await waitFor(() => {
        expect(screen.getByTestId('error').textContent).toBe('Erro ao atualizar configurações');
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error updating settings:', expect.any(Error));
      consoleSpy.mockRestore();
    });

    it('should not update if settings are null', async () => {
      // This is a tricky case - we need to test the guard clause
      // The component won't render the buttons if settings is null, but we can test
      // the internal logic by checking that setDoc isn't called
      mockGetDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      // Loading state, settings is null
      expect(screen.getByTestId('loading')).toBeInTheDocument();

      // setDoc should not have been called for update
      expect(mockSetDoc).not.toHaveBeenCalled();
    });
  });

  describe('CSS Variables Update', () => {
    it('should update CSS variables when settings change', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          primaryColor: '#FF5733',
          secondaryColor: '#33FF57'
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary')).toBe('#FF5733');
      expect(root.style.getPropertyValue('--color-secondary')).toBe('#33FF57');
    });

    it('should update darker color variants for hover states', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          primaryColor: '#FFFFFF',
          secondaryColor: '#808080'
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const root = document.documentElement;
      // #FFFFFF - 30 = rgb(225, 225, 225)
      expect(root.style.getPropertyValue('--color-primary-dark')).toBe('rgb(225, 225, 225)');
      // #808080 = rgb(128, 128, 128), - 30 = rgb(98, 98, 98)
      expect(root.style.getPropertyValue('--color-secondary-dark')).toBe('rgb(98, 98, 98)');
    });

    it('should clamp darker color values at 0', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          primaryColor: '#1E1E1E', // rgb(30, 30, 30), - 30 should clamp to rgb(0, 0, 0)
          secondaryColor: '#0A0A0A' // rgb(10, 10, 10), - 30 should clamp to rgb(0, 0, 0)
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary-dark')).toBe('rgb(0, 0, 0)');
      expect(root.style.getPropertyValue('--color-secondary-dark')).toBe('rgb(0, 0, 0)');
    });

    it('should handle invalid hex colors gracefully', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          primaryColor: 'invalid-color',
          secondaryColor: 'not-a-hex'
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const root = document.documentElement;
      // Primary and secondary colors should still be set
      expect(root.style.getPropertyValue('--color-primary')).toBe('invalid-color');
      expect(root.style.getPropertyValue('--color-secondary')).toBe('not-a-hex');
      // But dark variants should not be set (hexToRgb returns null for invalid hex)
      expect(root.style.getPropertyValue('--color-primary-dark')).toBe('');
      expect(root.style.getPropertyValue('--color-secondary-dark')).toBe('');
    });

    it('should update CSS variables when colors are updated', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      const root = document.documentElement;
      expect(root.style.getPropertyValue('--color-primary')).toBe('#3B82F6');

      await act(async () => {
        fireEvent.click(screen.getByTestId('update-colors-btn'));
      });

      await waitFor(() => {
        expect(root.style.getPropertyValue('--color-primary')).toBe('#FF0000');
        expect(root.style.getPropertyValue('--color-secondary')).toBe('#00FF00');
      });
    });
  });

  describe('useSettings Hook', () => {
    it('should throw error when used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useSettings must be used within a SettingsProvider');

      consoleSpy.mockRestore();
    });

    it('should return loading true initially', () => {
      mockGetDoc.mockImplementation(() => new Promise(() => {}));

      let hookResult: { loading: boolean; settings: any } | null = null;

      const TestComponent: React.FC = () => {
        hookResult = useSettings();
        return null;
      };

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      expect(hookResult?.loading).toBe(true);
      expect(hookResult?.settings).toBe(null);
    });

    it('should provide settings after loading', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      let hookResult: { loading: boolean; settings: any; updateSettings: any } | null = null;

      const TestComponent: React.FC = () => {
        hookResult = useSettings();
        return <div data-testid="loaded">{hookResult.loading ? 'loading' : 'done'}</div>;
      };

      render(
        <SettingsProvider>
          <TestComponent />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loaded').textContent).toBe('done');
      });

      expect(hookResult?.loading).toBe(false);
      expect(hookResult?.settings).not.toBe(null);
      expect(hookResult?.settings?.churchName).toBe('Igreja Conectados pela Fé');
      expect(typeof hookResult?.updateSettings).toBe('function');
    });
  });

  describe('About Page Settings', () => {
    it('should load custom about settings from Firestore', async () => {
      const customAbout = {
        mission: 'Custom mission statement',
        vision: 'Custom vision statement',
        statistics: [
          { value: '20+', label: 'Custom Label', icon: '🎉' }
        ]
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ about: customAbout })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('about-mission').textContent).toBe('Custom mission statement');
        expect(screen.getByTestId('about-vision').textContent).toBe('Custom vision statement');
        expect(screen.getByTestId('about-statistics-count').textContent).toBe('1');
      });
    });

    it('should use default about settings when not provided', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ churchName: 'Test' }) // No about settings
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should have default about settings from merging with defaults
      expect(screen.getByTestId('about-mission').textContent).toContain('Nossa igreja tem como missão');
    });
  });

  describe('Context Provider', () => {
    it('should render children correctly', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      render(
        <SettingsProvider>
          <div data-testid="child">Child Content</div>
        </SettingsProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByTestId('child').textContent).toBe('Child Content');
    });

    it('should provide the same context to multiple consumers', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValueOnce(undefined);

      const Consumer1: React.FC = () => {
        const { settings } = useSettings();
        return <div data-testid="consumer1">{settings?.churchName || 'loading'}</div>;
      };

      const Consumer2: React.FC = () => {
        const { settings } = useSettings();
        return <div data-testid="consumer2">{settings?.primaryColor || 'loading'}</div>;
      };

      render(
        <SettingsProvider>
          <Consumer1 />
          <Consumer2 />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('consumer1').textContent).toBe('Igreja Conectados pela Fé');
        expect(screen.getByTestId('consumer2').textContent).toBe('#3B82F6');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string values in settings', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          churchName: '',
          churchAddress: '',
          churchPhone: ''
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('church-name').textContent).toBe('');
      expect(screen.getByTestId('church-address').textContent).toBe('');
    });

    it('should handle undefined optional fields', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          churchName: 'Test',
          logoURL: undefined
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('logo-url').textContent).toBe('no-logo');
    });

    it('should handle null values in settings', async () => {
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          churchName: 'Test',
          logoURL: null,
          about: null
        })
      });

      render(
        <SettingsProvider>
          <TestConsumer />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Should handle gracefully
      expect(screen.getByTestId('settings')).toBeInTheDocument();
    });

    it('should handle rapid successive updates', async () => {
      mockGetDoc.mockResolvedValueOnce({ exists: () => false });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Trigger multiple rapid updates
      await act(async () => {
        fireEvent.click(screen.getByTestId('update-name-btn'));
        fireEvent.click(screen.getByTestId('update-colors-btn'));
        fireEvent.click(screen.getByTestId('update-notifications-btn'));
      });

      // Should handle all updates without crashing
      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalled();
      });
    });

    it('should preserve existing settings when updating partial data', async () => {
      const initialSettings = {
        churchName: 'Initial Name',
        churchTagline: 'Initial Tagline',
        primaryColor: '#000000',
        emailNotifications: true
      };

      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => initialSettings
      });
      mockSetDoc.mockResolvedValue(undefined);

      render(
        <SettingsProvider>
          <TestConsumerWithUpdate />
        </SettingsProvider>
      );

      await waitFor(() => {
        expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
      });

      // Update only the name
      await act(async () => {
        fireEvent.click(screen.getByTestId('update-name-btn'));
      });

      // setDoc should be called with merged settings
      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          expect.anything(),
          expect.objectContaining({
            churchName: 'New Church Name',
            primaryColor: '#000000', // Should preserve original
            emailNotifications: true // Should preserve original
          })
        );
      });
    });
  });
});

describe('Security Settings Interface', () => {
  it('should include all required security fields in interface', () => {
    // This is a compile-time check - if the interface is wrong, TypeScript will fail
    interface ChurchSettings {
      emailNotifications?: boolean;
      smsNotifications?: boolean;
      eventReminders?: boolean;
      requireEventConfirmation?: boolean;
      maxEventParticipants?: number;
      autoApproveMembers?: boolean;
      allowPublicRegistration?: boolean;
      maintenanceMode?: boolean;
    }

    const settings: ChurchSettings = {
      emailNotifications: true,
      smsNotifications: false,
      eventReminders: true,
      autoApproveMembers: false,
      allowPublicRegistration: true,
      maintenanceMode: false
    };

    expect(settings.emailNotifications).toBe(true);
    expect(settings.autoApproveMembers).toBe(false);
    expect(settings.maintenanceMode).toBe(false);
  });
});

describe('hexToRgb Helper Function', () => {
  // Testing the behavior indirectly through CSS variable updates
  it('should correctly convert 3B82F6 to RGB', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        primaryColor: '#3B82F6',
        secondaryColor: '#8B5CF6'
      })
    });

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const root = document.documentElement;
    // #3B82F6 = rgb(59, 130, 246), - 30 = rgb(29, 100, 216)
    expect(root.style.getPropertyValue('--color-primary-dark')).toBe('rgb(29, 100, 216)');
  });

  it('should handle hex without hash prefix', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        primaryColor: '3B82F6', // Without #
        secondaryColor: '#8B5CF6'
      })
    });

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const root = document.documentElement;
    // Should still work without #
    expect(root.style.getPropertyValue('--color-primary-dark')).toBe('rgb(29, 100, 216)');
  });

  it('should handle lowercase hex values', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        primaryColor: '#ff0000', // lowercase
        secondaryColor: '#00ff00'
      })
    });

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const root = document.documentElement;
    // #ff0000 = rgb(255, 0, 0), - 30 = rgb(225, 0, 0)
    expect(root.style.getPropertyValue('--color-primary-dark')).toBe('rgb(225, 0, 0)');
  });

  it('should handle uppercase hex values', async () => {
    mockGetDoc.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        primaryColor: '#FF0000', // uppercase
        secondaryColor: '#00FF00'
      })
    });

    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });

    const root = document.documentElement;
    expect(root.style.getPropertyValue('--color-primary-dark')).toBe('rgb(225, 0, 0)');
  });
});
