import { useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';
import { User } from '../utils/supabase';

interface UsageLimits {
  remaining: number;
  limit: number;
  unlimited: boolean;
}

interface UseUsageLimitsResult {
  usage: UsageLimits;
  loading: boolean;
  error: string | null;
  refreshUsage: () => Promise<void>;
  hasReachedLimit: boolean;
}

export const useUsageLimits = (
  user: User | null | undefined,
  featureType: 'statistical_analysis' | 'figure_analysis' = 'statistical_analysis'
): UseUsageLimitsResult => {
  const [usage, setUsage] = useState<UsageLimits>({
    remaining: 0,
    limit: 0,
    unlimited: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshUsage = async () => {
    // Both authenticated and anonymous users now have limits
    setLoading(true);
    setError(null);

    try {
      if (featureType === 'statistical_analysis') {
        const result = await apiClient.statistical.getUsage();
        setUsage(result);
      } else if (featureType === 'figure_analysis') {
        const result = await apiClient.figureAnalysis.getUsage();
        setUsage(result);
      } else {
        // Fallback for unknown feature types
        setUsage({ remaining: 0, limit: 1, unlimited: false });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch usage limits');
      // Fallback to conservative limits on error
      setUsage({ remaining: 0, limit: 1, unlimited: false });
    } finally {
      setLoading(false);
    }
  };

  // Load usage on mount and when user changes
  useEffect(() => {
    refreshUsage();
  }, [user?.id, featureType]);

  const hasReachedLimit = usage.remaining <= 0;

  return {
    usage,
    loading,
    error,
    refreshUsage,
    hasReachedLimit
  };
}; 