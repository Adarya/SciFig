import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

// Mock supabase before importing apiClient
vi.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
      }),
    },
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('health check', () => {
    it('should call health endpoint', async () => {
      // Dynamically import to ensure mocks are set up
      const { apiClient } = await import('./apiClient');
      
      const mockResponse = { status: 'ok', timestamp: '2025-01-01' };
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiClient.health.check();
      expect(result).toEqual(mockResponse);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/status'),
        expect.any(Object)
      );
    });
  });
});

