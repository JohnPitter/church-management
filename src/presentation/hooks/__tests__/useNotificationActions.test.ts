// Unit Tests - useNotificationActions Hook
// Comprehensive tests for notification actions functionality

import { renderHook, act } from '@testing-library/react';
import React from 'react';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock functions need to be in module scope for Jest hoisting
let mockNotifyNewEvent: any;
let mockNotifyNewBlogPost: any;
let mockNotifyNewProject: any;
let mockNotifyNewLiveStream: any;
let mockCleanupExpiredNotifications: any;
let mockRefreshNotifications: any;

// Mock NotificationService
jest.mock('@modules/shared-kernel/notifications/infrastructure/services/NotificationService');

// Mock NotificationContext
jest.mock('../../contexts/NotificationContext');

// Mock AuthContext
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn().mockReturnValue({
    currentUser: null,
    loading: false
  })
}));

// Import after mocks
import { useNotificationActions } from '../useNotificationActions';
import { NotificationService } from '@modules/shared-kernel/notifications/infrastructure/services/NotificationService';
import { useNotifications } from '../../contexts/NotificationContext';

describe('useNotificationActions Hook', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Create fresh mock functions
    mockNotifyNewEvent = jest.fn();
    mockNotifyNewBlogPost = jest.fn();
    mockNotifyNewProject = jest.fn();
    mockNotifyNewLiveStream = jest.fn();
    mockCleanupExpiredNotifications = jest.fn();
    mockRefreshNotifications = jest.fn();

    // Setup NotificationService mock
    (NotificationService as jest.Mock).mockImplementation(() => ({
      notifyNewEvent: mockNotifyNewEvent,
      notifyNewBlogPost: mockNotifyNewBlogPost,
      notifyNewProject: mockNotifyNewProject,
      notifyNewLiveStream: mockNotifyNewLiveStream,
      cleanupExpiredNotifications: mockCleanupExpiredNotifications
    }));

    // Setup NotificationContext mock
    (useNotifications as jest.Mock).mockReturnValue({
      refreshNotifications: mockRefreshNotifications
    });
  });

  describe('notifyNewEvent', () => {
    it('should successfully notify new event and refresh notifications', async () => {
      const eventId = 'event-123';
      const eventTitle = 'Sunday Service';
      const eventDate = new Date('2026-03-01T10:00:00');
      const expectedCount = 50;

      mockNotifyNewEvent.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let notifiedCount: number = 0;
      await act(async () => {
        notifiedCount = await result.current.notifyNewEvent(eventId, eventTitle, eventDate);
      });

      expect(mockNotifyNewEvent).toHaveBeenCalledWith(eventId, eventTitle, eventDate);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(notifiedCount).toBe(expectedCount);
    });

    it('should handle errors when notifying new event', async () => {
      const eventId = 'event-123';
      const eventTitle = 'Sunday Service';
      const eventDate = new Date('2026-03-01T10:00:00');
      const error = new Error('Failed to notify event');

      mockNotifyNewEvent.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useNotificationActions());

      await expect(async () => {
        await act(async () => {
          await result.current.notifyNewEvent(eventId, eventTitle, eventDate);
        });
      }).rejects.toThrow('Failed to notify event');

      expect(consoleSpy).toHaveBeenCalledWith('Error notifying new event:', error);
      expect(mockRefreshNotifications).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should throw error if service throws', async () => {
      mockNotifyNewEvent.mockRejectedValue(new Error('Service error'));

      const { result } = renderHook(() => useNotificationActions());
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(
        act(async () => {
          await result.current.notifyNewEvent('event-1', 'Test Event', new Date());
        })
      ).rejects.toThrow('Service error');

      consoleSpy.mockRestore();
    });

    it('should call refresh even if count is zero', async () => {
      mockNotifyNewEvent.mockResolvedValue(0);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Test Event', new Date());
      });

      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('notifyNewBlogPost', () => {
    it('should successfully notify new blog post without image', async () => {
      const postId = 'post-123';
      const postTitle = 'New Blog Post';
      const expectedCount = 45;

      mockNotifyNewBlogPost.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let notifiedCount: number = 0;
      await act(async () => {
        notifiedCount = await result.current.notifyNewBlogPost(postId, postTitle);
      });

      expect(mockNotifyNewBlogPost).toHaveBeenCalledWith(postId, postTitle, undefined);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(notifiedCount).toBe(expectedCount);
    });

    it('should successfully notify new blog post with image', async () => {
      const postId = 'post-123';
      const postTitle = 'New Blog Post';
      const postImageUrl = 'https://example.com/image.jpg';
      const expectedCount = 45;

      mockNotifyNewBlogPost.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let notifiedCount: number = 0;
      await act(async () => {
        notifiedCount = await result.current.notifyNewBlogPost(postId, postTitle, postImageUrl);
      });

      expect(mockNotifyNewBlogPost).toHaveBeenCalledWith(postId, postTitle, postImageUrl);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(notifiedCount).toBe(expectedCount);
    });

    it('should handle errors when notifying new blog post', async () => {
      const postId = 'post-123';
      const postTitle = 'New Blog Post';
      const error = new Error('Failed to notify blog post');

      mockNotifyNewBlogPost.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useNotificationActions());

      await expect(async () => {
        await act(async () => {
          await result.current.notifyNewBlogPost(postId, postTitle);
        });
      }).rejects.toThrow('Failed to notify blog post');

      expect(consoleSpy).toHaveBeenCalledWith('Error notifying new blog post:', error);
      expect(mockRefreshNotifications).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle empty image URL', async () => {
      mockNotifyNewBlogPost.mockResolvedValue(10);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewBlogPost('post-1', 'Test Post', '');
      });

      expect(mockNotifyNewBlogPost).toHaveBeenCalledWith('post-1', 'Test Post', '');
    });
  });

  describe('notifyNewProject', () => {
    it('should successfully notify new project and refresh notifications', async () => {
      const projectId = 'project-123';
      const projectName = 'Community Outreach';
      const expectedCount = 30;

      mockNotifyNewProject.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let notifiedCount: number = 0;
      await act(async () => {
        notifiedCount = await result.current.notifyNewProject(projectId, projectName);
      });

      expect(mockNotifyNewProject).toHaveBeenCalledWith(projectId, projectName);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(notifiedCount).toBe(expectedCount);
    });

    it('should handle errors when notifying new project', async () => {
      const projectId = 'project-123';
      const projectName = 'Community Outreach';
      const error = new Error('Failed to notify project');

      mockNotifyNewProject.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useNotificationActions());

      await expect(async () => {
        await act(async () => {
          await result.current.notifyNewProject(projectId, projectName);
        });
      }).rejects.toThrow('Failed to notify project');

      expect(consoleSpy).toHaveBeenCalledWith('Error notifying new project:', error);
      expect(mockRefreshNotifications).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle special characters in project name', async () => {
      const projectName = 'Projeto "Ajuda & Amor" - 2026!';
      mockNotifyNewProject.mockResolvedValue(5);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewProject('project-1', projectName);
      });

      expect(mockNotifyNewProject).toHaveBeenCalledWith('project-1', projectName);
    });
  });

  describe('notifyNewLiveStream', () => {
    it('should successfully notify new live stream without image', async () => {
      const streamId = 'stream-123';
      const streamTitle = 'Sunday Live Worship';
      const expectedCount = 100;

      mockNotifyNewLiveStream.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let notifiedCount: number = 0;
      await act(async () => {
        notifiedCount = await result.current.notifyNewLiveStream(streamId, streamTitle);
      });

      expect(mockNotifyNewLiveStream).toHaveBeenCalledWith(streamId, streamTitle, undefined);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(notifiedCount).toBe(expectedCount);
    });

    it('should successfully notify new live stream with image', async () => {
      const streamId = 'stream-123';
      const streamTitle = 'Sunday Live Worship';
      const streamImageUrl = 'https://example.com/thumbnail.jpg';
      const expectedCount = 100;

      mockNotifyNewLiveStream.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let notifiedCount: number = 0;
      await act(async () => {
        notifiedCount = await result.current.notifyNewLiveStream(streamId, streamTitle, streamImageUrl);
      });

      expect(mockNotifyNewLiveStream).toHaveBeenCalledWith(streamId, streamTitle, streamImageUrl);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(notifiedCount).toBe(expectedCount);
    });

    it('should handle errors when notifying new live stream', async () => {
      const streamId = 'stream-123';
      const streamTitle = 'Sunday Live Worship';
      const error = new Error('Failed to notify live stream');

      mockNotifyNewLiveStream.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useNotificationActions());

      await expect(async () => {
        await act(async () => {
          await result.current.notifyNewLiveStream(streamId, streamTitle);
        });
      }).rejects.toThrow('Failed to notify live stream');

      expect(consoleSpy).toHaveBeenCalledWith('Error notifying new live stream:', error);
      expect(mockRefreshNotifications).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle very long stream titles', async () => {
      const longTitle = 'A'.repeat(500);
      mockNotifyNewLiveStream.mockResolvedValue(1);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewLiveStream('stream-1', longTitle);
      });

      expect(mockNotifyNewLiveStream).toHaveBeenCalledWith('stream-1', longTitle, undefined);
    });
  });

  describe('cleanupExpiredNotifications', () => {
    it('should successfully cleanup expired notifications', async () => {
      const expectedCount = 25;

      mockCleanupExpiredNotifications.mockResolvedValue(expectedCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let cleanedCount: number = 0;
      await act(async () => {
        cleanedCount = await result.current.cleanupExpiredNotifications();
      });

      expect(mockCleanupExpiredNotifications).toHaveBeenCalledTimes(1);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
      expect(cleanedCount).toBe(expectedCount);
    });

    it('should handle errors when cleaning up notifications', async () => {
      const error = new Error('Failed to cleanup notifications');

      mockCleanupExpiredNotifications.mockRejectedValue(error);
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useNotificationActions());

      await expect(async () => {
        await act(async () => {
          await result.current.cleanupExpiredNotifications();
        });
      }).rejects.toThrow('Failed to cleanup notifications');

      expect(consoleSpy).toHaveBeenCalledWith('Error cleaning up expired notifications:', error);
      expect(mockRefreshNotifications).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should return zero when no expired notifications', async () => {
      mockCleanupExpiredNotifications.mockResolvedValue(0);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let cleanedCount: number = -1;
      await act(async () => {
        cleanedCount = await result.current.cleanupExpiredNotifications();
      });

      expect(cleanedCount).toBe(0);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);
    });
  });

  describe('Multiple Operations', () => {
    it('should handle multiple notifications in sequence', async () => {
      mockNotifyNewEvent.mockResolvedValue(10);
      mockNotifyNewBlogPost.mockResolvedValue(15);
      mockNotifyNewProject.mockResolvedValue(20);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Event 1', new Date());
        await result.current.notifyNewBlogPost('post-1', 'Post 1');
        await result.current.notifyNewProject('project-1', 'Project 1');
      });

      expect(mockNotifyNewEvent).toHaveBeenCalledTimes(1);
      expect(mockNotifyNewBlogPost).toHaveBeenCalledTimes(1);
      expect(mockNotifyNewProject).toHaveBeenCalledTimes(1);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(3);
    });

    it('should continue after one operation fails', async () => {
      mockNotifyNewEvent.mockRejectedValue(new Error('Event failed'));
      mockNotifyNewBlogPost.mockResolvedValue(10);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // First call - expect it to fail
      const { result: result1 } = renderHook(() => useNotificationActions());

      let eventError: Error | null = null;
      await act(async () => {
        try {
          await result1.current.notifyNewEvent('event-1', 'Event 1', new Date());
        } catch (e) {
          eventError = e as Error;
        }
      });
      expect(eventError).toBeTruthy();

      // Second operation should still work (fresh renderHook)
      const { result: result2 } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result2.current.notifyNewBlogPost('post-1', 'Post 1');
      });

      expect(mockNotifyNewBlogPost).toHaveBeenCalledTimes(1);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });
  });

  describe('Edge Cases', () => {
    it('should handle refresh notifications failure after successful notification', async () => {
      mockNotifyNewEvent.mockResolvedValue(10);
      mockRefreshNotifications.mockRejectedValue(new Error('Refresh failed'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      const { result } = renderHook(() => useNotificationActions());

      let caughtError: any = null;
      await act(async () => {
        try {
          await result.current.notifyNewEvent('event-1', 'Event 1', new Date());
        } catch (e) {
          caughtError = e as Error;
        }
      });

      expect(caughtError?.message).toBe('Refresh failed');
      expect(mockNotifyNewEvent).toHaveBeenCalledTimes(1);
      expect(mockRefreshNotifications).toHaveBeenCalledTimes(1);

      consoleSpy.mockRestore();
    });

    it('should handle empty string IDs', async () => {
      mockNotifyNewEvent.mockResolvedValue(0);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('', 'Event with empty ID', new Date());
      });

      expect(mockNotifyNewEvent).toHaveBeenCalledWith('', 'Event with empty ID', expect.any(Date));
    });

    it('should handle empty string titles', async () => {
      mockNotifyNewBlogPost.mockResolvedValue(0);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewBlogPost('post-1', '');
      });

      expect(mockNotifyNewBlogPost).toHaveBeenCalledWith('post-1', '', undefined);
    });

    it('should handle past dates for events', async () => {
      const pastDate = new Date('2020-01-01T00:00:00');
      mockNotifyNewEvent.mockResolvedValue(5);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Past Event', pastDate);
      });

      expect(mockNotifyNewEvent).toHaveBeenCalledWith('event-1', 'Past Event', pastDate);
    });

    it('should handle future dates for events', async () => {
      const futureDate = new Date('2030-12-31T23:59:59');
      mockNotifyNewEvent.mockResolvedValue(50);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Future Event', futureDate);
      });

      expect(mockNotifyNewEvent).toHaveBeenCalledWith('event-1', 'Future Event', futureDate);
    });

    it('should handle very large notification counts', async () => {
      const largeCount = 999999;
      mockNotifyNewEvent.mockResolvedValue(largeCount);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let count: number = 0;
      await act(async () => {
        count = await result.current.notifyNewEvent('event-1', 'Event', new Date());
      });

      expect(count).toBe(largeCount);
    });

    it('should handle negative counts gracefully', async () => {
      mockNotifyNewEvent.mockResolvedValue(-1);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      let count: number = 0;
      await act(async () => {
        count = await result.current.notifyNewEvent('event-1', 'Event', new Date());
      });

      expect(count).toBe(-1);
    });
  });

  describe('Hook Stability', () => {
    it('should return stable function references', () => {
      const { result, rerender } = renderHook(() => useNotificationActions());

      const firstRender = {
        notifyNewEvent: result.current.notifyNewEvent,
        notifyNewBlogPost: result.current.notifyNewBlogPost,
        notifyNewProject: result.current.notifyNewProject,
        notifyNewLiveStream: result.current.notifyNewLiveStream,
        cleanupExpiredNotifications: result.current.cleanupExpiredNotifications
      };

      rerender();

      expect(result.current.notifyNewEvent).toBe(firstRender.notifyNewEvent);
      expect(result.current.notifyNewBlogPost).toBe(firstRender.notifyNewBlogPost);
      expect(result.current.notifyNewProject).toBe(firstRender.notifyNewProject);
      expect(result.current.notifyNewLiveStream).toBe(firstRender.notifyNewLiveStream);
      expect(result.current.cleanupExpiredNotifications).toBe(firstRender.cleanupExpiredNotifications);
    });

    it('should not recreate service instance on rerender', async () => {
      mockNotifyNewEvent.mockResolvedValue(1);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result, rerender } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Event', new Date());
      });

      const callCountBefore = mockNotifyNewEvent.mock.calls.length;
      rerender();
      const callCountAfter = mockNotifyNewEvent.mock.calls.length;

      expect(callCountAfter).toBe(callCountBefore);
    });
  });

  describe('Integration with NotificationContext', () => {
    it('should always call refreshNotifications after successful operations', async () => {
      mockNotifyNewEvent.mockResolvedValue(10);
      mockNotifyNewBlogPost.mockResolvedValue(15);
      mockNotifyNewProject.mockResolvedValue(20);
      mockNotifyNewLiveStream.mockResolvedValue(25);
      mockCleanupExpiredNotifications.mockResolvedValue(5);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Event', new Date());
      });

      await act(async () => {
        await result.current.notifyNewBlogPost('post-1', 'Post');
      });

      await act(async () => {
        await result.current.notifyNewProject('project-1', 'Project');
      });

      await act(async () => {
        await result.current.notifyNewLiveStream('stream-1', 'Stream');
      });

      await act(async () => {
        await result.current.cleanupExpiredNotifications();
      });

      expect(mockRefreshNotifications).toHaveBeenCalledTimes(5);
    });

    it('should not call refreshNotifications on service errors', async () => {
      mockNotifyNewEvent.mockRejectedValue(new Error('Service error'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const { result } = renderHook(() => useNotificationActions());

      await expect(
        act(async () => {
          await result.current.notifyNewEvent('event-1', 'Event', new Date());
        })
      ).rejects.toThrow();

      expect(mockRefreshNotifications).not.toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Service Instance', () => {
    it('should create new NotificationService instance', () => {
      renderHook(() => useNotificationActions());

      expect(NotificationService).toHaveBeenCalled();
    });

    it('should use same service instance for all operations', async () => {
      mockNotifyNewEvent.mockResolvedValue(1);
      mockNotifyNewBlogPost.mockResolvedValue(1);
      mockRefreshNotifications.mockResolvedValue(undefined);

      const { result } = renderHook(() => useNotificationActions());

      await act(async () => {
        await result.current.notifyNewEvent('event-1', 'Event', new Date());
        await result.current.notifyNewBlogPost('post-1', 'Post');
      });

      // Both should use the same service instance
      expect(mockNotifyNewEvent).toHaveBeenCalledTimes(1);
      expect(mockNotifyNewBlogPost).toHaveBeenCalledTimes(1);
    });
  });
});
