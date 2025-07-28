import { useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';

interface AnalysisProgress {
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number; // 0-100
  stage: string;
  message: string;
  estimated_time_remaining?: number; // seconds
}

interface UseAnalysisProgressProps {
  analysisId?: string | null;
  pollingInterval?: number; // milliseconds
  autoStart?: boolean;
}

interface UseAnalysisProgressResult {
  progress: AnalysisProgress;
  isPolling: boolean;
  error: string | null;
  startPolling: () => void;
  stopPolling: () => void;
}

const DEFAULT_POLLING_INTERVAL = 2000; // 2 seconds
const DEFAULT_PROGRESS: AnalysisProgress = {
  status: 'pending',
  progress: 0,
  stage: 'Initializing',
  message: 'Preparing analysis...'
};

export const useAnalysisProgress = ({
  analysisId,
  pollingInterval = DEFAULT_POLLING_INTERVAL,
  autoStart = true
}: UseAnalysisProgressProps): UseAnalysisProgressResult => {
  const [progress, setProgress] = useState<AnalysisProgress>(DEFAULT_PROGRESS);
  const [isPolling, setIsPolling] = useState<boolean>(autoStart);
  const [error, setError] = useState<string | null>(null);
  
  // Use a ref to track the polling interval ID for cleanup
  const pollingRef = useRef<number | null>(null);
  
  // Function to fetch progress
  const fetchProgress = async () => {
    if (!analysisId) return;
    
    try {
      // In a real implementation, this would call a backend endpoint
      // For now, we'll simulate with the analysis GET endpoint
      const analysis = await apiClient.analysis.get(analysisId);
      
      // Map the analysis status to progress information
      const newProgress: AnalysisProgress = {
        status: analysis.status,
        progress: getProgressFromStatus(analysis.status),
        stage: getStageFromStatus(analysis.status),
        message: getMessageFromStatus(analysis.status),
        estimated_time_remaining: getEstimatedTimeRemaining(analysis.status)
      };
      
      setProgress(newProgress);
      
      // Stop polling if analysis is complete or failed
      if (analysis.status === 'completed' || analysis.status === 'failed') {
        stopPolling();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch analysis progress');
      stopPolling();
    }
  };
  
  // Helper functions to map status to UI information
  const getProgressFromStatus = (status: string): number => {
    switch (status) {
      case 'pending': return 10;
      case 'running': return 50;
      case 'completed': return 100;
      case 'failed': return 0;
      default: return 0;
    }
  };
  
  const getStageFromStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'Initializing';
      case 'running': return 'Processing';
      case 'completed': return 'Completed';
      case 'failed': return 'Failed';
      default: return 'Unknown';
    }
  };
  
  const getMessageFromStatus = (status: string): string => {
    switch (status) {
      case 'pending': return 'Preparing analysis...';
      case 'running': return 'Running statistical calculations...';
      case 'completed': return 'Analysis completed successfully';
      case 'failed': return 'Analysis failed';
      default: return 'Unknown status';
    }
  };
  
  const getEstimatedTimeRemaining = (status: string): number | undefined => {
    if (status === 'running') {
      return 30; // Mock 30 seconds remaining
    }
    return undefined;
  };
  
  // Start polling function
  const startPolling = () => {
    if (pollingRef.current) return; // Already polling
    
    setIsPolling(true);
    
    // Fetch immediately
    fetchProgress();
    
    // Then start interval
    pollingRef.current = window.setInterval(() => {
      fetchProgress();
    }, pollingInterval);
  };
  
  // Stop polling function
  const stopPolling = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
    setIsPolling(false);
  };
  
  // Start/stop polling when analysisId changes
  useEffect(() => {
    if (analysisId && autoStart) {
      startPolling();
    } else {
      stopPolling();
      setProgress(DEFAULT_PROGRESS);
    }
    
    // Cleanup on unmount
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [analysisId, autoStart]);
  
  return {
    progress,
    isPolling,
    error,
    startPolling,
    stopPolling
  };
}; 