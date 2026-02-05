// Unit Tests - useAdminCheck Hook
// Tests for admin existence checking logic and system initialization verification

import { renderHook, waitFor } from '@testing-library/react';
import { act } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { useAdminCheck } from '../useAdminCheck';

// Mock Firebase Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {},
}));

describe('useAdminCheck', () => {
  const mockDoc = doc as jest.MockedFunction<typeof doc>;
  const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset console.error mock to avoid pollution
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Initial State', () => {
    it('should initialize with loading state', () => {
      mockGetDoc.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useAdminCheck());

      expect(result.current.hasAdmin).toBeNull();
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBeNull();
    });

    it('should provide recheck function', () => {
      mockGetDoc.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useAdminCheck());

      expect(result.current.recheck).toBeDefined();
      expect(typeof result.current.recheck).toBe('function');
    });
  });

  describe('System Initialization Check', () => {
    it('should return true when system is initialized', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(true);
      expect(result.current.error).toBeNull();
      expect(mockDoc).toHaveBeenCalledWith({}, 'settings', 'system');
    });

    it('should return false when system is not initialized', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: false }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return false when system document does not exist', async () => {
      const mockDocSnapshot = {
        exists: () => false,
        data: () => null,
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle system document with missing initialized field', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ someOtherField: 'value' }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should handle Firestore errors gracefully', async () => {
      const error = new Error('Firestore error');
      mockGetDoc.mockRejectedValue(error);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
      expect(result.current.error).toBe('Falha ao verificar configuração do sistema');
      expect(console.error).toHaveBeenCalledWith('Error checking system setup:', error);
    });

    it('should set hasAdmin to false on error', async () => {
      mockGetDoc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
    });

    it('should handle permission errors', async () => {
      const permissionError = new Error('Permission denied');
      mockGetDoc.mockRejectedValue(permissionError);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
      expect(result.current.error).toBe('Falha ao verificar configuração do sistema');
    });
  });

  describe('Recheck Functionality', () => {
    it('should recheck system status when recheck is called', async () => {
      const mockDocSnapshot1 = {
        exists: () => true,
        data: () => ({ initialized: false }),
      };

      const mockDocSnapshot2 = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc
        .mockResolvedValueOnce(mockDocSnapshot1 as any)
        .mockResolvedValueOnce(mockDocSnapshot2 as any);

      const { result } = renderHook(() => useAdminCheck());

      // Wait for initial check
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);

      // Trigger recheck
      act(() => {
        result.current.recheck();
      });

      // Wait for recheck to complete
      await waitFor(() => {
        expect(result.current.hasAdmin).toBe(true);
      });

      expect(mockGetDoc).toHaveBeenCalledTimes(2);
    });

    it('should set loading state during recheck', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      act(() => {
        result.current.recheck();
      });

      // Should be loading immediately after recheck
      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should clear previous errors on recheck', async () => {
      mockGetDoc
        .mockRejectedValueOnce(new Error('First error'))
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ initialized: true }),
        } as any);

      const { result } = renderHook(() => useAdminCheck());

      // Wait for initial error
      await waitFor(() => {
        expect(result.current.error).toBe('Falha ao verificar configuração do sistema');
      });

      // Trigger recheck
      act(() => {
        result.current.recheck();
      });

      // Wait for successful recheck - check both error cleared and hasAdmin set
      await waitFor(() => {
        expect(result.current.error).toBeNull();
        expect(result.current.hasAdmin).toBe(true);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle multiple rapid recheck calls', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Call recheck multiple times rapidly
      act(() => {
        result.current.recheck();
        result.current.recheck();
        result.current.recheck();
      });

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should still work correctly
      expect(result.current.hasAdmin).toBe(true);
      expect(result.current.error).toBeNull();
    });
  });

  describe('Edge Cases', () => {
    it('should handle null system data', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => null,
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
    });

    it('should handle undefined system data', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => undefined,
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
    });

    it('should handle initialized field with non-boolean value', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: 'yes' }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Should handle truthy/falsy values
      expect(result.current.hasAdmin).toBe(false); // 'yes' !== true
    });

    it('should handle initialized field with number value', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: 1 }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false); // 1 !== true (strict equality)
    });

    it('should handle empty system data object', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({}),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasAdmin).toBe(false);
    });
  });

  describe('Loading State Management', () => {
    it('should set loading to true at start of check', () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockGetDoc.mockReturnValue(promise as any);

      const { result } = renderHook(() => useAdminCheck());

      expect(result.current.loading).toBe(true);

      // Clean up
      act(() => {
        resolvePromise!({
          exists: () => false,
        });
      });
    });

    it('should set loading to false after successful check', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      const { result } = renderHook(() => useAdminCheck());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });

    it('should set loading to false after error', async () => {
      mockGetDoc.mockRejectedValue(new Error('Test error'));

      const { result } = renderHook(() => useAdminCheck());

      expect(result.current.loading).toBe(true);

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle system initialization flow', async () => {
      // Scenario: Check system, find it not initialized, user sets it up, recheck
      const mockDocSnapshot1 = {
        exists: () => false,
      };

      const mockDocSnapshot2 = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc
        .mockResolvedValueOnce(mockDocSnapshot1 as any)
        .mockResolvedValueOnce(mockDocSnapshot2 as any);

      const { result } = renderHook(() => useAdminCheck());

      // Initial check - system not initialized
      await waitFor(() => {
        expect(result.current.hasAdmin).toBe(false);
        expect(result.current.loading).toBe(false);
      });

      // After setup, recheck
      act(() => {
        result.current.recheck();
      });

      // Should now show as initialized
      await waitFor(() => {
        expect(result.current.hasAdmin).toBe(true);
        expect(result.current.loading).toBe(false);
      });
    });

    it('should handle network reconnection scenario', async () => {
      // Scenario: Network error, then successful reconnection
      mockGetDoc
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ initialized: true }),
        } as any);

      const { result } = renderHook(() => useAdminCheck());

      // Initial error
      await waitFor(() => {
        expect(result.current.error).toBe('Falha ao verificar configuração do sistema');
      });

      // Retry after network comes back
      act(() => {
        result.current.recheck();
      });

      await waitFor(() => {
        expect(result.current.hasAdmin).toBe(true);
        expect(result.current.error).toBeNull();
      });
    });
  });

  describe('Firestore Document Reference', () => {
    it('should query correct Firestore path', async () => {
      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(mockDoc).toHaveBeenCalledWith({}, 'settings', 'system');
      });
    });

    it('should call getDoc with document reference', async () => {
      const mockDocRef = { id: 'system', path: 'settings/system' };
      mockDoc.mockReturnValue(mockDocRef as any);

      const mockDocSnapshot = {
        exists: () => true,
        data: () => ({ initialized: true }),
      };

      mockGetDoc.mockResolvedValue(mockDocSnapshot as any);

      renderHook(() => useAdminCheck());

      await waitFor(() => {
        expect(mockGetDoc).toHaveBeenCalledWith(mockDocRef);
      });
    });
  });
});
