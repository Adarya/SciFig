import { useState, useEffect } from 'react';
import { apiClient, Dataset, AnalysisConfig, AnalysisResult, Figure } from '../services/apiClient';
import { AnalysisWorkflow, StatisticalResult } from '../utils/statisticalEngine';

// Add imports for new comprehensive analysis types
import type { ComprehensiveAnalysisResult, DataProfile, TestRecommendation, AssumptionResult } from '../services/apiClient';

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

// Add new interfaces
interface UseEnhancedAnalysisState {
  analysisResult: ComprehensiveAnalysisResult | null;
  loading: boolean;
  error: string | null;
  dataProfile: DataProfile | null;
  testRecommendation: TestRecommendation | null;
  assumptions: AssumptionResult[] | null;
  runAnalysis: () => Promise<void>;
  getTestRecommendation: () => Promise<void>;
  checkAssumptions: (testType: string) => Promise<void>;
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

// Add enhanced analysis hook
export function useEnhancedAnalysis({
  dataset,
  config
}: {
  dataset?: Dataset;
  config?: {
    outcome_variable: string;
    group_variable?: string;
    test_type?: string;
    time_variable?: string;
    event_variable?: string;
    check_assumptions?: boolean;
  };
}): UseEnhancedAnalysisState {
  const [analysisResult, setAnalysisResult] = useState<ComprehensiveAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataProfile, setDataProfile] = useState<DataProfile | null>(null);
  const [testRecommendation, setTestRecommendation] = useState<TestRecommendation | null>(null);
  const [assumptions, setAssumptions] = useState<AssumptionResult[] | null>(null);

  // Create data profile from dataset
  useEffect(() => {
    if (dataset && config) {
      const profile: DataProfile = {
        outcome_type: 'continuous', // TODO: Infer from data
        n_groups: config.group_variable ? 2 : 1, // Default assumption
        sample_size: dataset.rows,
        time_variable: config.time_variable,
        event_variable: config.event_variable,
        columns: dataset.columns
      };
      setDataProfile(profile);
    }
  }, [dataset, config]);

  const runAnalysis = async () => {
    if (!dataset || !config) {
      setError('Dataset and configuration are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.analysis.runEnhanced(dataset.id, {
        outcome_variable: config.outcome_variable,
        group_variable: config.group_variable,
        test_type: config.test_type,
        time_variable: config.time_variable,
        event_variable: config.event_variable,
        check_assumptions: config.check_assumptions ?? true
      });

      setAnalysisResult(result);
      setAssumptions(result.assumptions_checked);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const getTestRecommendation = async () => {
    if (!dataProfile) {
      setError('Data profile is required for test recommendation');
      return;
    }

    try {
      const recommendation = await apiClient.analysis.recommendTest(dataProfile);
      setTestRecommendation(recommendation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Test recommendation failed');
    }
  };

  const checkAssumptions = async (testType: string) => {
    if (!dataset || !config) {
      setError('Dataset and configuration are required');
      return;
    }

    try {
      // Get dataset data first
      const dataResponse = await apiClient.files.getDatasetData(dataset.id) as { data: any[] };
      
      const result = await apiClient.analysis.checkAssumptions({
        data: dataResponse.data,
        outcome_variable: config.outcome_variable,
        group_variable: config.group_variable,
        analysis_type: testType
      });

      setAssumptions(result.assumptions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Assumption check failed');
    }
  };

  return {
    analysisResult,
    loading,
    error,
    dataProfile,
    testRecommendation,
    assumptions,
    runAnalysis,
    getTestRecommendation,
    checkAssumptions
  };
} 