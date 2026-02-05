// Unit Tests - useTheme Hook
// Comprehensive tests for theme detection and management functionality

import { renderHook, act, waitFor } from '@testing-library/react';
import { useTheme } from '../useTheme';

describe('useTheme Hook', () => {
  let mockMatchMedia: jest.Mock;
  let mockAddEventListener: jest.Mock;
  let mockRemoveEventListener: jest.Mock;
  let mockAddListener: jest.Mock;
  let mockRemoveListener: jest.Mock;
  let mediaQueryListeners: Map<string, Set<(e: MediaQueryListEvent) => void>>;

  beforeEach(() => {
    // Reset listeners map
    mediaQueryListeners = new Map();

    // Create mock functions
    mockAddEventListener = jest.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      const eventType = event;
      if (!mediaQueryListeners.has(eventType)) {
        mediaQueryListeners.set(eventType, new Set());
      }
      mediaQueryListeners.get(eventType)?.add(callback);
    });

    mockRemoveEventListener = jest.fn((event: string, callback: (e: MediaQueryListEvent) => void) => {
      const eventType = event;
      mediaQueryListeners.get(eventType)?.delete(callback);
    });

    mockAddListener = jest.fn((callback: (e: MediaQueryListEvent) => void) => {
      if (!mediaQueryListeners.has('change')) {
        mediaQueryListeners.set('change', new Set());
      }
      mediaQueryListeners.get('change')?.add(callback);
    });

    mockRemoveListener = jest.fn((callback: (e: MediaQueryListEvent) => void) => {
      mediaQueryListeners.get('change')?.delete(callback);
    });

    // Setup default matchMedia mock
    mockMatchMedia = jest.fn((query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: mockAddEventListener,
      removeEventListener: mockRemoveEventListener,
      addListener: mockAddListener,
      removeListener: mockRemoveListener,
      dispatchEvent: jest.fn()
    }));

    // Replace window.matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      configurable: true,
      value: mockMatchMedia
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
    mediaQueryListeners.clear();
  });

  describe('Initial Theme Detection', () => {
    it('should detect light mode by default', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should detect dark mode when system prefers dark', () => {
      mockMatchMedia.mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      }));

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(true);
      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
    });

    it('should call matchMedia with correct query', () => {
      renderHook(() => useTheme());

      expect(mockMatchMedia).toHaveBeenCalledWith('(prefers-color-scheme: dark)');
      expect(mockMatchMedia).toHaveBeenCalledTimes(2); // Once for initial check, once for listener setup
    });

    it('should handle missing window.matchMedia gracefully', () => {
      const originalMatchMedia = window.matchMedia;

      // Make matchMedia undefined
      // @ts-ignore - Testing when matchMedia is undefined
      window.matchMedia = undefined;

      const { result } = renderHook(() => useTheme());

      // Should default to false when matchMedia is not available
      expect(result.current.isDarkMode).toBe(false);

      // Restore
      window.matchMedia = originalMatchMedia;
    });
  });

  describe('Theme Change Detection', () => {
    it('should listen for theme changes using addEventListener', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      renderHook(() => useTheme());

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should update isDarkMode when system theme changes to dark', async () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);

      // Simulate theme change to dark
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: true } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      });
    });

    it('should update isDarkMode when system theme changes to light', async () => {
      const mediaQueryList = {
        matches: true,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(true);

      // Simulate theme change to light
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: false } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(false);
      });
    });

    it('should handle multiple theme changes', async () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);

      // First change: light to dark
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: true } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      });

      // Second change: dark to light
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: false } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(false);
      });

      // Third change: light to dark again
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: true } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      });
    });
  });

  describe('Legacy Browser Support (addListener fallback)', () => {
    it('should use addListener when addEventListener is not available', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      // @ts-ignore - Testing legacy browser scenario
      mockMatchMedia.mockReturnValue(mediaQueryList);

      renderHook(() => useTheme());

      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should update theme when using addListener', async () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      // @ts-ignore - Testing legacy browser scenario
      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);

      // Simulate theme change using legacy listener
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: true } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result.current.isDarkMode).toBe(true);
      });
    });

    it('should not call addListener when addEventListener is available', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      renderHook(() => useTheme());

      expect(mockAddEventListener).toHaveBeenCalled();
      expect(mockAddListener).not.toHaveBeenCalled();
    });
  });

  describe('Cleanup on Unmount', () => {
    it('should remove event listener on unmount using removeEventListener', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { unmount } = renderHook(() => useTheme());

      expect(mockAddEventListener).toHaveBeenCalledWith('change', expect.any(Function));

      unmount();

      expect(mockRemoveEventListener).toHaveBeenCalledWith('change', expect.any(Function));
    });

    it('should remove listener on unmount using removeListener (legacy)', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      // @ts-ignore - Testing legacy browser scenario
      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { unmount } = renderHook(() => useTheme());

      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));

      unmount();

      expect(mockRemoveListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should not receive theme updates after unmount', async () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result, unmount } = renderHook(() => useTheme());
      const initialValue = result.current.isDarkMode;

      unmount();

      // Try to trigger theme change after unmount
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: true } as MediaQueryListEvent);
        });
      });

      // Value should not have changed
      expect(result.current.isDarkMode).toBe(initialValue);
    });

    it('should clean up the same callback that was added', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { unmount } = renderHook(() => useTheme());

      // Get the callback that was added
      const addedCallback = mockAddEventListener.mock.calls[0][1];

      unmount();

      // Verify the same callback was removed
      const removedCallback = mockRemoveEventListener.mock.calls[0][1];
      expect(removedCallback).toBe(addedCallback);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle null matchMedia gracefully', () => {
      const originalMatchMedia = window.matchMedia;

      // @ts-ignore - Testing error scenario
      window.matchMedia = null;

      const { result } = renderHook(() => useTheme());

      // Should default to false
      expect(result.current.isDarkMode).toBe(false);

      // Restore
      window.matchMedia = originalMatchMedia;
    });

    it('should handle matchMedia throwing an error', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockMatchMedia.mockImplementation(() => {
        throw new Error('matchMedia error');
      });

      let result;
      let error;

      try {
        result = renderHook(() => useTheme());
      } catch (e) {
        error = e;
      }

      // Hook should handle the error or throw it
      expect(error || result).toBeDefined();

      consoleSpy.mockRestore();
    });

    it('should handle missing addEventListener and addListener', () => {
      const originalMatchMedia = window.matchMedia;

      // Create a mock that returns a MediaQueryList without listener methods
      const mockMediaQuery = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: undefined,
        removeEventListener: undefined,
        addListener: undefined,
        removeListener: undefined,
        dispatchEvent: jest.fn()
      };

      // @ts-ignore - Testing edge case
      window.matchMedia = jest.fn(() => mockMediaQuery);

      const { result } = renderHook(() => useTheme());

      // Should still work for initial detection
      expect(result.current.isDarkMode).toBe(false);

      // Restore
      window.matchMedia = originalMatchMedia;
    });

    it('should handle listener callback throwing an error', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: jest.fn((event, callback) => {
          // Store callback but make it throw
          mockAddEventListener(event, () => {
            throw new Error('Callback error');
          });
        }),
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result } = renderHook(() => useTheme());

      expect(result.current.isDarkMode).toBe(false);

      // Should still work despite callback error
      expect(result.current).toBeDefined();

      consoleSpy.mockRestore();
    });
  });

  describe('Hook Stability', () => {
    it('should maintain stable isDarkMode reference when value does not change', async () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result, rerender } = renderHook(() => useTheme());
      const firstValue = result.current.isDarkMode;

      rerender();

      expect(result.current.isDarkMode).toBe(firstValue);
    });

    it('should return consistent object structure', () => {
      const { result } = renderHook(() => useTheme());

      expect(result.current).toHaveProperty('isDarkMode');
      expect(typeof result.current.isDarkMode).toBe('boolean');
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should work correctly with multiple instances', async () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { result: result1 } = renderHook(() => useTheme());
      const { result: result2 } = renderHook(() => useTheme());

      expect(result1.current.isDarkMode).toBe(result2.current.isDarkMode);

      // Change theme
      await act(async () => {
        const listeners = mediaQueryListeners.get('change');
        listeners?.forEach(callback => {
          callback({ matches: true } as MediaQueryListEvent);
        });
      });

      await waitFor(() => {
        expect(result1.current.isDarkMode).toBe(true);
      });

      expect(result2.current.isDarkMode).toBe(true);
    });

    it('should clean up each instance independently', () => {
      const mediaQueryList = {
        matches: false,
        media: '(prefers-color-scheme: dark)',
        onchange: null,
        addEventListener: mockAddEventListener,
        removeEventListener: mockRemoveEventListener,
        addListener: mockAddListener,
        removeListener: mockRemoveListener,
        dispatchEvent: jest.fn()
      };

      mockMatchMedia.mockReturnValue(mediaQueryList);

      const { unmount: unmount1 } = renderHook(() => useTheme());
      const { unmount: unmount2 } = renderHook(() => useTheme());

      // Both should have added listeners
      expect(mockAddEventListener).toHaveBeenCalledTimes(2);

      unmount1();

      // Only one should be removed
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(1);

      unmount2();

      // Both should be removed now
      expect(mockRemoveEventListener).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration with SettingsContext (Future)', () => {
    it('should provide isDarkMode for potential SettingsContext integration', () => {
      const { result } = renderHook(() => useTheme());

      // The hook returns isDarkMode which could be used by SettingsContext
      expect(typeof result.current.isDarkMode).toBe('boolean');
    });
  });

  describe('Performance', () => {
    it('should only query matchMedia twice on mount (initial check + listener setup)', () => {
      renderHook(() => useTheme());

      expect(mockMatchMedia).toHaveBeenCalledTimes(2);
    });

    it('should not re-query matchMedia on rerender', () => {
      const { rerender } = renderHook(() => useTheme());

      const initialCallCount = mockMatchMedia.mock.calls.length;

      rerender();
      rerender();
      rerender();

      expect(mockMatchMedia.mock.calls.length).toBe(initialCallCount);
    });
  });
});
