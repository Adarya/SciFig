import React from 'react';
import { motion } from 'framer-motion';
import { Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useAnalysisProgress } from '../hooks/useAnalysisProgress';

interface AnalysisProgressIndicatorProps {
  analysisId?: string | null;
  onComplete?: () => void;
  className?: string;
}

const AnalysisProgressIndicator: React.FC<AnalysisProgressIndicatorProps> = ({
  analysisId,
  onComplete,
  className = ''
}) => {
  // For demo purposes, we'll simulate progress updates
  // In a real implementation, this would use the useAnalysisProgress hook
  const [progress, setProgress] = React.useState({
    status: 'pending' as 'pending' | 'running' | 'completed' | 'failed',
    progress: 0,
    stage: 'Initializing',
    message: 'Preparing analysis...',
    estimated_time_remaining: 30
  });
  const [error, setError] = React.useState<string | null>(null);
  
  // Simulate progress updates
  React.useEffect(() => {
    if (!analysisId) return;
    
    // Start with pending status
    setProgress({
      status: 'pending',
      progress: 10,
      stage: 'Initializing',
      message: 'Preparing analysis...',
      estimated_time_remaining: 30
    });
    
    // After 2 seconds, move to running
    const runningTimer = setTimeout(() => {
      setProgress({
        status: 'running',
        progress: 30,
        stage: 'Processing',
        message: 'Running statistical calculations...',
        estimated_time_remaining: 20
      });
      
      // Update progress every second
      let currentProgress = 30;
      const progressInterval = setInterval(() => {
        currentProgress += 5;
        setProgress(prev => ({
          ...prev,
          progress: Math.min(currentProgress, 95),
          estimated_time_remaining: Math.max(0, prev.estimated_time_remaining - 1)
        }));
        
        // Complete after reaching 95%
        if (currentProgress >= 95) {
          clearInterval(progressInterval);
          
          // Complete after a short delay
          setTimeout(() => {
            setProgress({
              status: 'completed',
              progress: 100,
              stage: 'Completed',
              message: 'Analysis completed successfully',
              estimated_time_remaining: 0
            });
            
            // Call onComplete callback
            if (onComplete) onComplete();
          }, 1000);
        }
      }, 1000);
      
      return () => {
        clearInterval(progressInterval);
      };
    }, 2000);
    
    return () => {
      clearTimeout(runningTimer);
    };
  }, [analysisId, onComplete]);

  // Call onComplete when status changes to completed
  React.useEffect(() => {
    if (progress.status === 'completed' && onComplete) {
      onComplete();
    }
  }, [progress.status, onComplete]);

  if (!analysisId) return null;

  // Format estimated time remaining
  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds) return '';
    if (seconds < 60) return `${seconds} seconds remaining`;
    return `${Math.ceil(seconds / 60)} minutes remaining`;
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-4">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {progress.status === 'pending' && (
            <Loader className="h-6 w-6 text-blue-500 animate-spin" />
          )}
          {progress.status === 'running' && (
            <Loader className="h-6 w-6 text-blue-500 animate-spin" />
          )}
          {progress.status === 'completed' && (
            <CheckCircle className="h-6 w-6 text-green-500" />
          )}
          {progress.status === 'failed' && (
            <AlertCircle className="h-6 w-6 text-red-500" />
          )}
        </div>

        {/* Status Text */}
        <div className="flex-grow">
          <h3 className="text-sm font-medium text-gray-900">{progress.stage}</h3>
          <p className="text-sm text-gray-500">{progress.message}</p>
        </div>

        {/* Time Remaining */}
        {progress.estimated_time_remaining && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="h-4 w-4 mr-1" />
            <span>{formatTimeRemaining(progress.estimated_time_remaining)}</span>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="mt-3 h-2 bg-gray-200 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${
            progress.status === 'failed'
              ? 'bg-red-500'
              : progress.status === 'completed'
              ? 'bg-green-500'
              : 'bg-blue-500'
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress.progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 flex items-center">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default AnalysisProgressIndicator; 