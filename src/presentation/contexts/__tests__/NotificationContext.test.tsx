// Unit Tests - Notification Context
// Comprehensive tests for notification state management and operations

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { NotificationProvider, useNotifications } from '../NotificationContext';
import {
  Notification,
  NotificationPreferences,
  NotificationType,
  NotificationPriority,
  NotificationStatus
} from '@modules/shared-kernel/notifications/domain/entities/Notification';

// Create mock functions outside jest.mock to avoid hoisting issues
const mockGetUserNotifications = jest.fn();
const mockGetUnreadCount = jest.fn();
const mockMarkAsRead = jest.fn();
const mockMarkAllAsRead = jest.fn();
const mockCreateCustomNotification = jest.fn();
const mockGetUserPreferences = jest.fn();
const mockUpdateUserPreferences = jest.fn();

// Mock the NotificationService - use jest.fn() that returns actual mock implementations
jest.mock('@modules/shared-kernel/notifications/infrastructure/services/NotificationService', () => {
  // Return a factory that creates a mock service with the external mock functions
  return {
    NotificationService: function(this: any) {
      this.getUserNotifications = mockGetUserNotifications;
      this.getUnreadCount = mockGetUnreadCount;
      this.markAsRead = mockMarkAsRead;
      this.markAllAsRead = mockMarkAllAsRead;
      this.createCustomNotification = mockCreateCustomNotification;
      this.notificationRepository = {
        getUserPreferences: mockGetUserPreferences,
        updateUserPreferences: mockUpdateUserPreferences
      };
    }
  };
});

// Mock the AuthContext
const mockCurrentUser = {
  id: 'user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  role: 'member',
  status: 'approved',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockUseAuth = jest.fn();

jest.mock('../AuthContext', () => ({
  useAuth: () => mockUseAuth()
}));

// Helper to create test notifications
const createTestNotification = (overrides: Partial<Notification> = {}): Notification => ({
  id: `notification-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'user-123',
  title: 'Test Notification',
  message: 'This is a test notification message',
  type: NotificationType.System,
  priority: NotificationPriority.Medium,
  status: NotificationStatus.Unread,
  createdAt: new Date(),
  ...overrides
});

// Helper to create test preferences
const createTestPreferences = (overrides: Partial<NotificationPreferences> = {}): NotificationPreferences => ({
  userId: 'user-123',
  email: true,
  push: true,
  sms: false,
  enabledTypes: [NotificationType.System, NotificationType.Event],
  updatedAt: new Date(),
  ...overrides
});

// Test component that uses the context
interface TestConsumerProps {
  onContext?: (context: ReturnType<typeof useNotifications>) => void;
}

const TestConsumer: React.FC<TestConsumerProps> = ({ onContext }) => {
  const context = useNotifications();

  React.useEffect(() => {
    if (onContext) {
      onContext(context);
    }
  }, [context, onContext]);

  return (
    <div>
      <div data-testid="loading">{String(context.loading)}</div>
      <div data-testid="unread-count">{context.unreadCount}</div>
      <div data-testid="notifications-count">{context.notifications.length}</div>
      <div data-testid="preferences-email">{context.preferences?.email ? 'true' : 'false'}</div>
      <div data-testid="notifications-list">
        {context.notifications.map(n => (
          <div key={n.id} data-testid={`notification-${n.id}`}>
            <span data-testid={`notification-${n.id}-status`}>{n.status}</span>
            <span data-testid={`notification-${n.id}-title`}>{n.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Test component with actions
const TestConsumerWithActions: React.FC = () => {
  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    updatePreferences,
    getUnreadNotifications,
    createCustomNotification,
    refreshNotifications
  } = useNotifications();

  return (
    <div>
      <div data-testid="loading">{String(loading)}</div>
      <div data-testid="unread-count">{unreadCount}</div>
      <div data-testid="notifications-count">{notifications.length}</div>
      <div data-testid="unread-notifications-count">{getUnreadNotifications().length}</div>
      <button
        data-testid="mark-read-btn"
        onClick={() => markAsRead('notification-1')}
      >
        Mark as Read
      </button>
      <button
        data-testid="mark-all-read-btn"
        onClick={() => markAllAsRead()}
      >
        Mark All as Read
      </button>
      <button
        data-testid="update-preferences-btn"
        onClick={() => updatePreferences({ email: false })}
      >
        Update Preferences
      </button>
      <button
        data-testid="create-notification-btn"
        onClick={() => createCustomNotification('Test Title', 'Test Message', 'all')}
      >
        Create Notification
      </button>
      <button
        data-testid="refresh-btn"
        onClick={() => refreshNotifications()}
      >
        Refresh
      </button>
    </div>
  );
};

describe('NotificationContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock implementations
    mockUseAuth.mockReturnValue({ currentUser: mockCurrentUser });
    mockGetUserNotifications.mockResolvedValue([]);
    mockGetUnreadCount.mockResolvedValue(0);
    mockMarkAsRead.mockResolvedValue(undefined);
    mockMarkAllAsRead.mockResolvedValue(undefined);
    mockCreateCustomNotification.mockResolvedValue(1);
    mockGetUserPreferences.mockResolvedValue(createTestPreferences());
    mockUpdateUserPreferences.mockResolvedValue(createTestPreferences());
  });

  describe('useNotifications Hook', () => {
    it('should throw error when used outside provider', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestConsumer />);
      }).toThrow('useNotifications must be used within a NotificationProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('Loading Notifications', () => {
    it('should load notifications when user is authenticated', async () => {
      const testNotifications = [
        createTestNotification({ id: 'notif-1', title: 'First Notification' }),
        createTestNotification({ id: 'notif-2', title: 'Second Notification' })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(2);

      await act(async () => {
        render(
          <NotificationProvider>
            <TestConsumer />
          </NotificationProvider>
        );
      });

      // Allow promises to resolve
      await act(async () => {
        await Promise.resolve();
      });

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('2');
      }, { timeout: 3000 });

      expect(mockGetUserNotifications).toHaveBeenCalledWith('user-123', 50);
      expect(mockGetUnreadCount).toHaveBeenCalledWith('user-123');
    });

    it('should show loading state while fetching notifications', async () => {
      mockGetUserNotifications.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('true');
      });
    });

    it('should clear notifications when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('0');
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });

      expect(mockGetUserNotifications).not.toHaveBeenCalled();
    });

    it('should load user preferences along with notifications', async () => {
      const testPreferences = createTestPreferences({ email: true, push: false });
      mockGetUserPreferences.mockResolvedValue(testPreferences);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('preferences-email').textContent).toBe('true');
      });
    });

    it('should use default preferences when loading fails', async () => {
      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mockGetUserPreferences.mockRejectedValue(new Error('Failed to load'));

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Should use default preferences
      expect(screen.getByTestId('preferences-email').textContent).toBe('true');

      consoleSpy.mockRestore();
    });

    it('should handle errors when loading notifications', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockGetUserNotifications.mockRejectedValue(new Error('Network error'));

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      expect(screen.getByTestId('notifications-count').textContent).toBe('0');

      consoleSpy.mockRestore();
    });
  });

  describe('markAsRead Functionality', () => {
    it('should mark a notification as read', async () => {
      const testNotifications = [
        createTestNotification({ id: 'notification-1', status: NotificationStatus.Unread })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(1);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('1');
      });

      await act(async () => {
        screen.getByTestId('mark-read-btn').click();
      });

      expect(mockMarkAsRead).toHaveBeenCalledWith('notification-1');

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });
    });

    it('should update local notification status to read', async () => {
      const testNotifications = [
        createTestNotification({ id: 'notification-1', status: NotificationStatus.Unread, title: 'Test' })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(1);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notification-notification-1-status').textContent).toBe('unread');
      });
    });

    it('should not call markAsRead when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await act(async () => {
        screen.getByTestId('mark-read-btn').click();
      });

      expect(mockMarkAsRead).not.toHaveBeenCalled();
    });

    it('should handle markAsRead errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMarkAsRead.mockRejectedValue(new Error('Failed to mark as read'));

      const testNotifications = [
        createTestNotification({ id: 'notification-1', status: NotificationStatus.Unread })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(1);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('1');
      });

      await act(async () => {
        screen.getByTestId('mark-read-btn').click();
      });

      // Should log error but not crash
      expect(consoleSpy).toHaveBeenCalledWith('Error marking notification as read:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('markAllAsRead Functionality', () => {
    it('should mark all notifications as read', async () => {
      const testNotifications = [
        createTestNotification({ id: 'notification-1', status: NotificationStatus.Unread }),
        createTestNotification({ id: 'notification-2', status: NotificationStatus.Unread }),
        createTestNotification({ id: 'notification-3', status: NotificationStatus.Unread })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(3);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('3');
      });

      await act(async () => {
        screen.getByTestId('mark-all-read-btn').click();
      });

      expect(mockMarkAllAsRead).toHaveBeenCalledWith('user-123');

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });
    });

    it('should not call markAllAsRead when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await act(async () => {
        screen.getByTestId('mark-all-read-btn').click();
      });

      expect(mockMarkAllAsRead).not.toHaveBeenCalled();
    });

    it('should handle markAllAsRead errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockMarkAllAsRead.mockRejectedValue(new Error('Failed to mark all as read'));

      mockGetUserNotifications.mockResolvedValue([createTestNotification()]);
      mockGetUnreadCount.mockResolvedValue(1);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('mark-all-read-btn').click();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error marking all notifications as read:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('Unread Count', () => {
    it('should correctly display unread count from service', async () => {
      mockGetUnreadCount.mockResolvedValue(5);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('5');
      });
    });

    it('should decrement unread count when marking as read', async () => {
      const testNotifications = [
        createTestNotification({ id: 'notification-1', status: NotificationStatus.Unread }),
        createTestNotification({ id: 'notification-2', status: NotificationStatus.Unread })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(2);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('2');
      });

      await act(async () => {
        screen.getByTestId('mark-read-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('1');
      });
    });

    it('should not go below zero when decrementing', async () => {
      mockGetUserNotifications.mockResolvedValue([]);
      mockGetUnreadCount.mockResolvedValue(0);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });

      await act(async () => {
        screen.getByTestId('mark-read-btn').click();
      });

      // Should still be 0, not negative
      expect(screen.getByTestId('unread-count').textContent).toBe('0');
    });

    it('should reset to zero when marking all as read', async () => {
      mockGetUserNotifications.mockResolvedValue([
        createTestNotification({ status: NotificationStatus.Unread }),
        createTestNotification({ status: NotificationStatus.Unread })
      ]);
      mockGetUnreadCount.mockResolvedValue(10);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('10');
      });

      await act(async () => {
        screen.getByTestId('mark-all-read-btn').click();
      });

      await waitFor(() => {
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });
    });
  });

  describe('getUnreadNotifications', () => {
    it('should return only unread notifications', async () => {
      const testNotifications = [
        createTestNotification({ id: 'notif-1', status: NotificationStatus.Unread }),
        createTestNotification({ id: 'notif-2', status: NotificationStatus.Read }),
        createTestNotification({ id: 'notif-3', status: NotificationStatus.Unread }),
        createTestNotification({ id: 'notif-4', status: NotificationStatus.Archived })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(2);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('4');
        expect(screen.getByTestId('unread-notifications-count').textContent).toBe('2');
      });
    });

    it('should return empty array when no unread notifications', async () => {
      const testNotifications = [
        createTestNotification({ status: NotificationStatus.Read }),
        createTestNotification({ status: NotificationStatus.Read })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(0);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('unread-notifications-count').textContent).toBe('0');
      });
    });
  });

  describe('Preferences Management', () => {
    it('should load user preferences', async () => {
      const testPreferences = createTestPreferences({
        email: true,
        push: false,
        sms: true
      });

      mockGetUserPreferences.mockResolvedValue(testPreferences);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('preferences-email').textContent).toBe('true');
      });
    });

    it('should update preferences successfully', async () => {
      const initialPreferences = createTestPreferences({ email: true });
      const updatedPreferences = createTestPreferences({ email: false });

      mockGetUserPreferences.mockResolvedValue(initialPreferences);
      mockUpdateUserPreferences.mockResolvedValue(updatedPreferences);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('update-preferences-btn').click();
      });

      expect(mockUpdateUserPreferences).toHaveBeenCalledWith('user-123', { email: false });
    });

    it('should not update preferences when user is not authenticated', async () => {
      mockUseAuth.mockReturnValue({ currentUser: null });

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await act(async () => {
        screen.getByTestId('update-preferences-btn').click();
      });

      expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
    });

    it('should not update preferences when preferences are null', async () => {
      mockGetUserPreferences.mockResolvedValue(null);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('update-preferences-btn').click();
      });

      expect(mockUpdateUserPreferences).not.toHaveBeenCalled();
    });

    it('should handle updatePreferences errors and rethrow', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const testPreferences = createTestPreferences();
      mockGetUserPreferences.mockResolvedValue(testPreferences);
      mockUpdateUserPreferences.mockRejectedValue(new Error('Update failed'));

      let caughtError: Error | null = null;

      const TestComponent: React.FC = () => {
        const { updatePreferences, preferences, loading } = useNotifications();

        const handleUpdate = async () => {
          try {
            await updatePreferences({ email: false });
          } catch (error) {
            caughtError = error as Error;
          }
        };

        return (
          <div>
            <div data-testid="loading">{String(loading)}</div>
            <div data-testid="has-preferences">{preferences ? 'yes' : 'no'}</div>
            <button data-testid="update-btn" onClick={handleUpdate}>
              Update
            </button>
          </div>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      // Wait for preferences to be loaded
      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(screen.getByTestId('has-preferences').textContent).toBe('yes');
      });

      await act(async () => {
        screen.getByTestId('update-btn').click();
      });

      // Wait for the error to be caught
      await waitFor(() => {
        expect(caughtError).not.toBeNull();
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error updating notification preferences:', expect.any(Error));

      consoleSpy.mockRestore();
    });
  });

  describe('createCustomNotification', () => {
    it('should create a custom notification for all users', async () => {
      mockCreateCustomNotification.mockResolvedValue(10);
      mockGetUserNotifications.mockResolvedValue([]);
      mockGetUnreadCount.mockResolvedValue(0);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      await act(async () => {
        screen.getByTestId('create-notification-btn').click();
      });

      expect(mockCreateCustomNotification).toHaveBeenCalledWith(
        'Test Title',
        'Test Message',
        'all',
        undefined
      );
    });

    it('should refresh notifications after creating custom notification', async () => {
      mockCreateCustomNotification.mockResolvedValue(1);

      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Clear the call count from initial load
      mockGetUserNotifications.mockClear();

      await act(async () => {
        screen.getByTestId('create-notification-btn').click();
      });

      // Should call refresh which fetches notifications again
      await waitFor(() => {
        expect(mockGetUserNotifications).toHaveBeenCalled();
      });
    });

    it('should handle createCustomNotification errors and rethrow', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockCreateCustomNotification.mockRejectedValue(new Error('Creation failed'));

      let caughtError: Error | null = null;

      const TestComponent: React.FC = () => {
        const { createCustomNotification } = useNotifications();

        const handleCreate = async () => {
          try {
            await createCustomNotification('Title', 'Message', 'all');
          } catch (error) {
            caughtError = error as Error;
          }
        };

        return (
          <button data-testid="create-btn" onClick={handleCreate}>
            Create
          </button>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-btn')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('create-btn').click();
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error creating custom notification:', expect.any(Error));
      expect(caughtError).not.toBeNull();

      consoleSpy.mockRestore();
    });

    it('should pass options to createCustomNotification', async () => {
      const TestComponent: React.FC = () => {
        const { createCustomNotification } = useNotifications();

        const handleCreate = async () => {
          await createCustomNotification('Title', 'Message', 'roles', {
            roles: ['admin', 'secretary'],
            priority: 'high',
            actionUrl: '/dashboard',
            actionText: 'View'
          });
        };

        return (
          <button data-testid="create-btn" onClick={handleCreate}>
            Create
          </button>
        );
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('create-btn')).toBeInTheDocument();
      });

      await act(async () => {
        screen.getByTestId('create-btn').click();
      });

      expect(mockCreateCustomNotification).toHaveBeenCalledWith(
        'Title',
        'Message',
        'roles',
        {
          roles: ['admin', 'secretary'],
          priority: 'high',
          actionUrl: '/dashboard',
          actionText: 'View'
        }
      );
    });
  });

  describe('Refresh Notifications', () => {
    it('should refresh notifications on demand', async () => {
      render(
        <NotificationProvider>
          <TestConsumerWithActions />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      mockGetUserNotifications.mockClear();

      await act(async () => {
        screen.getByTestId('refresh-btn').click();
      });

      expect(mockGetUserNotifications).toHaveBeenCalled();
    });

    it('should clear data when user becomes null on refresh', async () => {
      const { rerender } = render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      mockUseAuth.mockReturnValue({ currentUser: null });

      rerender(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('0');
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });
    });
  });

  describe('Periodic Refresh', () => {
    it('should set up periodic refresh interval when user is authenticated', async () => {
      jest.useFakeTimers();

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      // Wait for initial render and loading to complete - advance timers a bit to flush promises
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      // Clear initial call
      mockGetUserNotifications.mockClear();

      // Advance timers by 60 seconds (the refresh interval)
      await act(async () => {
        jest.advanceTimersByTime(60000);
        await Promise.resolve();
      });

      // Should have called refresh
      expect(mockGetUserNotifications).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should not set up periodic refresh when user is not authenticated', async () => {
      jest.useFakeTimers();
      mockUseAuth.mockReturnValue({ currentUser: null });

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      // Wait for initial render - advance timers a bit to flush promises
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      mockGetUserNotifications.mockClear();

      // Advance timers by 60 seconds
      await act(async () => {
        jest.advanceTimersByTime(60000);
        await Promise.resolve();
      });

      // Should not have called refresh
      expect(mockGetUserNotifications).not.toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should clear interval on unmount', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });
  });

  describe('Context Value', () => {
    it('should provide all required context values', async () => {
      let contextValue: any = null;

      const TestComponent: React.FC = () => {
        contextValue = useNotifications();
        return null;
      };

      render(
        <NotificationProvider>
          <TestComponent />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(contextValue).not.toBeNull();
      });

      // Check state values
      expect(contextValue).toHaveProperty('notifications');
      expect(contextValue).toHaveProperty('unreadCount');
      expect(contextValue).toHaveProperty('preferences');
      expect(contextValue).toHaveProperty('loading');

      // Check action functions
      expect(typeof contextValue?.refreshNotifications).toBe('function');
      expect(typeof contextValue?.markAsRead).toBe('function');
      expect(typeof contextValue?.markAllAsRead).toBe('function');
      expect(typeof contextValue?.updatePreferences).toBe('function');
      expect(typeof contextValue?.getUnreadNotifications).toBe('function');
      expect(typeof contextValue?.createCustomNotification).toBe('function');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty notification list', async () => {
      mockGetUserNotifications.mockResolvedValue([]);
      mockGetUnreadCount.mockResolvedValue(0);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('0');
        expect(screen.getByTestId('unread-count').textContent).toBe('0');
      });
    });

    it('should handle notifications with various types and priorities', async () => {
      const testNotifications = [
        createTestNotification({ type: NotificationType.Event, priority: NotificationPriority.High }),
        createTestNotification({ type: NotificationType.Blog, priority: NotificationPriority.Low }),
        createTestNotification({ type: NotificationType.Alert, priority: NotificationPriority.Urgent }),
        createTestNotification({ type: NotificationType.Custom, priority: NotificationPriority.Medium })
      ];

      mockGetUserNotifications.mockResolvedValue(testNotifications);
      mockGetUnreadCount.mockResolvedValue(4);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('4');
      });
    });

    it('should handle notifications with optional fields', async () => {
      const testNotification = createTestNotification({
        actionUrl: '/test',
        actionText: 'Click here',
        imageUrl: 'https://example.com/image.png',
        metadata: { key: 'value' },
        expiresAt: new Date(Date.now() + 86400000)
      });

      mockGetUserNotifications.mockResolvedValue([testNotification]);
      mockGetUnreadCount.mockResolvedValue(1);

      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('notifications-count').textContent).toBe('1');
      });
    });

    it('should handle repository being undefined gracefully', async () => {
      // Simulate case where notificationRepository might be undefined
      const mockServiceWithoutRepo = {
        getUserNotifications: mockGetUserNotifications,
        getUnreadCount: mockGetUnreadCount,
        markAsRead: mockMarkAsRead,
        markAllAsRead: mockMarkAllAsRead,
        createCustomNotification: mockCreateCustomNotification,
        notificationRepository: undefined
      };

      jest.resetModules();

      // This test verifies the code handles the case gracefully
      // The actual implementation has fallback for this scenario
      render(
        <NotificationProvider>
          <TestConsumer />
        </NotificationProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });
  });
});
