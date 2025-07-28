import { useState, useEffect } from 'react';
import { apiClient, Dataset, AnalysisConfig, AnalysisResult, Figure } from '../services/apiClient';
import { AnalysisWorkflow, StatisticalResult } from '../utils/statisticalEngine';

interface UseBackendAnalysisProps {
  dataset?: Dataset | null;
  config?: AnalysisConfig;
}

interface UseBackendAnalysisState {
  loading: boolean;
  error: string | null;
  analysisResult: AnalysisWorkflow | null;
  figures: Figure[];
  analysisId: string | null;
  runAnalysis: (config: AnalysisConfig) => Promise<AnalysisWorkflow | null>;
  regenerateFigures: (style: string, colorScheme: string, customLabels?: any) => Promise<Figure[]>;
}

export const useBackendAnalysis = ({ dataset, config }: UseBackendAnalysisProps): UseBackendAnalysisState => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisId, setAnalysisId] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisWorkflow | null>(null);
  const [figures, setFigures] = useState<Figure[]>([]);

  // Run analysis with the backend API
  const runAnalysis = async (config: AnalysisConfig): Promise<AnalysisWorkflow | null> => {
    if (!dataset) {
      setError('No dataset available for backend analysis');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      // Call the backend API to run the analysis
      const result = await apiClient.analysis.run(dataset.id, config);
      
      // Store the analysis ID for later use
      setAnalysisId(result.id);
      
      // Convert API result to match frontend AnalysisWorkflow format
      const workflowResult: AnalysisWorkflow = {
        data_profile: {
          sample_size: result.data_profile?.sample_size || 0,
          outcome_variable: config.outcome_variable,
          outcome_type: result.data_profile?.outcome_type || 'continuous',
          group_variable: config.group_variable,
          time_variable: config.time_variable,
          event_variable: config.event_variable,
          is_paired: false,
          variables: dataset.columns || [],
          n_groups: result.data_profile?.n_groups,
          group_labels: result.data_profile?.group_labels
        },
        recommendation: result.recommendation || { 
          primary: '', 
          alternative: '' 
        },
        validation: result.validation || { 
          issues: [], 
          warnings: [] 
        },
        final_selection: {
          selected_test: result.results?.test_name || '',
          reason: 'Server analysis'
        },
        final_result: result.results || { 
          error: 'No results returned from server' 
        }
      };

      setAnalysisResult(workflowResult);
      
      // Fetch figures if available
      try {
        const figureResults = await apiClient.analysis.getFigures(result.id);
        setFigures(figureResults);
      } catch (figureError) {
        console.warn('Error fetching figures:', figureError);
      }

      return workflowResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to run analysis';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Regenerate figures with new styling
  const regenerateFigures = async (
    style: string, 
    colorScheme: string, 
    customLabels?: any
  ): Promise<Figure[]> => {
    if (!analysisId) {
      setError('No analysis available to regenerate figures');
      return [];
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.analysis.regenerateFigures(analysisId, {
        style,
        color_scheme: colorScheme,
        custom_labels: customLabels
      });

      setFigures(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to regenerate figures';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Auto-run analysis if dataset and config are provided initially
  useEffect(() => {
    if (dataset && config) {
      runAnalysis(config);
    }
  }, [dataset?.id, config?.outcome_variable]);

  return {
    loading,
    error,
    analysisResult,
    figures,
    analysisId,
    runAnalysis,
    regenerateFigures
  };
}; 