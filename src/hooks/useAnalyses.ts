import { useState, useEffect } from 'react';
import { apiClient, BackendAnalysis } from '../services/apiClient';
import { useAuth } from '../providers/ApiAuthProvider';

export type Analysis = BackendAnalysis;

interface UseAnalysesResult {
  analyses: Analysis[];
  loading: boolean;
  error: string | null;
  refreshAnalyses: () => Promise<void>;
  getAnalysesByProject: (projectId: string) => Analysis[];
}

export const useAnalyses = (): UseAnalysesResult => {
  const { user } = useAuth();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch analyses on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshAnalyses();
    } else {
      // Clear analyses when user logs out
      setAnalyses([]);
      setLoading(false);
    }
  }, [user?.id]);

  // Function to refresh analyses from the backend
  const refreshAnalyses = async (): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.analyses.list();
      setAnalyses(response.analyses);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analyses');
    } finally {
      setLoading(false);
    }
  };

  // Function to get analyses filtered by project
  const getAnalysesByProject = (projectId: string): Analysis[] => {
    return analyses.filter(analysis => analysis.project_id === projectId);
  };

  return {
    analyses,
    loading,
    error,
    refreshAnalyses,
    getAnalysesByProject
  };
}; 