// SciFig AI: API Client Service
// Centralized service for backend communication

import { supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

// Backend URL configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_PREFIX = '/api/v1';

// =====================================
// Type Definitions
// =====================================

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'canceled' | 'past_due';
  trial_ends_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Dataset {
  id: string;
  name: string;
  filename: string;
  file_size: number;
  columns: string[];
  rows: number;
  created_at: string;
  user_id: string;
  metadata: {
    encoding?: string;
    separator?: string;
    column_types?: Record<string, string>;
    column_roles?: Record<string, string>;
    summary_stats?: Record<string, any>;
  };
}

export interface AnalysisConfig {
  outcome_variable: string;
  group_variable?: string;
  time_variable?: string;
  event_variable?: string;
  test_type?: string;
  analysis_name?: string;
}

export interface AnalysisResult {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  config: AnalysisConfig;
  results?: {
    test_name: string;
    statistic: Record<string, number>;
    p_value: number;
    effect_size?: { name: string; value: number };
    summary: string;
    groups?: Record<string, any>;
    confidence_interval?: [number, number];
  };
  data_profile?: {
    sample_size: number;
    outcome_type: 'continuous' | 'categorical';
    n_groups?: number;
    group_labels?: string[];
  };
  recommendation?: {
    primary: string;
    alternative: string;
  };
  validation?: {
    issues: string[];
    warnings: string[];
  };
  created_at: string;
  completed_at?: string;
  error_message?: string;
}

export interface Figure {
  id: string;
  analysis_id: string;
  figure_type: string;
  config: {
    style: string;
    color_scheme: string;
    custom_labels?: {
      title?: string;
      x_label?: string;
      y_label?: string;
    };
  };
  plotly_json: any;
  created_at: string;
}

export interface BackendAnalysis {
  id: string;
  name?: string;
  description?: string;
  project_id?: string;
  dataset_id: string;
  user_id: string;
  analysis_type: string;
  parameters: Record<string, any>;
  results: Record<string, any>;
  figures: Record<string, any>;
  created_at: string;
  is_public: boolean;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  study_type?: string;
  created_at: string;
  updated_at: string;
  is_shared: boolean;
  user_id: string;
  datasets_count?: number;
  analyses_count?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name?: string;
}

export interface AuthResponse {
  user: User;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
}

// Add new interfaces for comprehensive analysis
export interface DataProfile {
  outcome_type: 'continuous' | 'categorical';
  n_groups: number;
  sample_size: number;
  time_variable?: string;
  event_variable?: string;
  columns: string[];
}

export interface AssumptionResult {
  test: string;
  passed: boolean;
  statistic?: number;
  p_value?: number;
  reason?: string;
}

export interface ComprehensiveAnalysisRequest {
  data: any[];
  outcome_variable: string;
  group_variable?: string;
  analysis_type?: string;
  time_variable?: string;
  event_variable?: string;
  check_assumptions?: boolean;
}

export interface ComprehensiveAnalysisResult {
  test_name: string;
  statistic: number;
  p_value: number;
  effect_size?: {
    name: string;
    value: number;
  };
  confidence_interval?: [number, number];
  summary: string;
  interpretation: string;
  assumptions_checked: AssumptionResult[];
  assumptions_met: boolean;
  recommended_test: string;
  alternative_test?: string;
  sample_sizes: Record<string, number>;
  descriptive_stats: Record<string, any>;
  data_profile: DataProfile;
}

export interface TestRecommendation {
  recommended_test: string;
  alternative_test?: string;
  reasoning: string;
}

// =====================================
// API Client Class
// =====================================

class ApiClient {
  private baseURL: string;
  private backendToken: string | null = null;
  
  constructor() {
    this.baseURL = `${API_BASE_URL}${API_PREFIX}`;
  }

  // Method to set backend token
  setBackendToken(token: string | null) {
    this.backendToken = token;
  }

  // Private helper to get auth headers
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Use backend token if available, otherwise fall back to Supabase session
    if (this.backendToken) {
      headers['Authorization'] = `Bearer ${this.backendToken}`;
      logger.debug('Backend token added to headers', undefined, 'API');
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      
      logger.debug('Getting auth headers', { 
        hasSession: !!session,
        hasToken: !!session?.access_token,
        userId: session?.user?.id 
      }, 'API');

      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
        logger.debug('Auth token added to headers', undefined, 'API');
      } else {
        logger.warn('No auth token available - user may not be logged in', undefined, 'API');
      }
    }

    return headers;
  }

  // Generic request method with error handling
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const method = options.method || 'GET';
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    // Log the outgoing request
    logger.apiRequest(method, endpoint, options.body ? JSON.parse(options.body as string) : undefined);

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
          logger.apiResponse(method, endpoint, response.status, errorData);
        } catch {
          // If can't parse JSON, use status text
          logger.apiResponse(method, endpoint, response.status, { error: errorMessage });
        }
        
        throw new Error(errorMessage);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        logger.apiResponse(method, endpoint, response.status);
        return {} as T;
      }

      const data = await response.json();
      logger.apiResponse(method, endpoint, response.status, data);
      return data;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`API request failed: ${method} ${endpoint}`, error, 'API');
        throw error;
      }
      const networkError = new Error('Network request failed');
      logger.error(`Network error: ${method} ${endpoint}`, networkError, 'API');
      throw networkError;
    }
  }

  // =====================================
  // Authentication Service
  // =====================================

  auth = {
    login: async (credentials: LoginRequest): Promise<AuthResponse> => {
      return this.request<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
    },

    signup: async (data: SignupRequest): Promise<AuthResponse> => {
      return this.request<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    logout: async (): Promise<void> => {
      return this.request<void>('/auth/logout', {
        method: 'POST',
      });
    },

    me: async (): Promise<User> => {
      return this.request<User>('/auth/me');
    },

    checkSession: async (): Promise<{ valid: boolean; user?: User }> => {
      try {
        const user = await this.request<User>('/auth/check');
        return { valid: true, user };
      } catch (error) {
        return { valid: false };
      }
    },

    getLimits: async (): Promise<{
      analyses_remaining: number;
      figures_remaining: number;
      storage_used: number;
      storage_limit: number;
    }> => {
      return this.request('/auth/limits');
    },
  };

  // =====================================
  // File Service
  // =====================================

  files = {
    upload: async (file: File): Promise<Dataset> => {
      const formData = new FormData();
      formData.append('file', file);

      // Special handling for file uploads - don't set Content-Type
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = {};
      
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const response = await fetch(`${this.baseURL}/files/upload`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Upload failed: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // Fallback to status text
        }
        throw new Error(errorMessage);
      }

      return response.json();
    },

    getDataset: async (datasetId: string): Promise<Dataset> => {
      return this.request<Dataset>(`/files/datasets/${datasetId}`);
    },

    getDatasetData: async (datasetId: string, limit?: number, offset?: number) => {
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (offset) params.append('offset', offset.toString());
      
      const endpoint = `/files/datasets/${datasetId}/data${params.toString() ? '?' + params.toString() : ''}`;
      return this.request(endpoint);
    },

    deleteDataset: async (datasetId: string): Promise<void> => {
      return this.request<void>(`/files/datasets/${datasetId}`, {
        method: 'DELETE',
      });
    },
  };

  // =====================================
  // Analysis Service
  // =====================================

  analysis = {
    run: async (datasetId: string, config: AnalysisConfig): Promise<AnalysisResult> => {
      // First get the dataset data
      const datasetData = await this.files.getDatasetData(datasetId);
      
      // Call the consolidated server's analyze endpoint
      const authHeaders = await this.getAuthHeaders();
      const response = await fetch(`${this.baseURL}/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          data: (datasetData as { data: any[] }).data,
          outcome_variable: config.outcome_variable,
          group_variable: config.group_variable,
          analysis_type: config.test_type || 'independent_ttest',
          time_variable: config.time_variable,
          event_variable: config.event_variable,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Convert legacy server response to expected AnalysisResult format
      return {
        id: `analysis_${Date.now()}`, // Generate a temp ID
        status: 'completed',
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        config: config,
        results: result,
        data_profile: {
          sample_size: (datasetData as { data: any[] }).data.length,
          outcome_type: 'continuous', // Default
          n_groups: config.group_variable ? 2 : 1,
        },
        recommendation: {
          primary: result.test_name || 'Statistical test',
          alternative: ''
        },
        validation: {
          issues: [],
          warnings: []
        }
      };
    },

    get: async (analysisId: string): Promise<AnalysisResult> => {
      return this.request<AnalysisResult>(`/analysis/${analysisId}`);
    },

    list: async (): Promise<AnalysisResult[]> => {
      return this.request<AnalysisResult[]>('/analysis/');
    },

    getFigures: async (analysisId: string): Promise<Figure[]> => {
      return this.request<Figure[]>(`/analysis/${analysisId}/figures`);
    },

    regenerateFigures: async (
      analysisId: string, 
      config: { style?: string; color_scheme?: string; custom_labels?: any }
    ): Promise<Figure[]> => {
      return this.request<Figure[]>(`/analysis/${analysisId}/figures/regenerate`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },

    // Enhanced comprehensive analysis endpoint
    runComprehensive: async (request: ComprehensiveAnalysisRequest): Promise<ComprehensiveAnalysisResult> => {
      // Note: This endpoint is on the statistical server (port 8000), not the main API
      const response = await fetch(`${API_BASE_URL}/analyze/comprehensive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Analysis failed: ${response.status}`);
      }

      return response.json();
    },

    // Get test recommendation
    recommendTest: async (dataProfile: DataProfile): Promise<TestRecommendation> => {
      const response = await fetch(`${API_BASE_URL}/recommend_test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataProfile)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Test recommendation failed: ${response.status}`);
      }

      return response.json();
    },

    // Check statistical assumptions
    checkAssumptions: async (request: {
      data: any[];
      outcome_variable: string;
      group_variable?: string;
      analysis_type: string;
    }): Promise<{
      assumptions: AssumptionResult[];
      all_met: boolean;
    }> => {
      const response = await fetch(`${API_BASE_URL}/check_assumptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || `Assumption check failed: ${response.status}`);
      }

      return response.json();
    },

    // Enhanced run method that uses comprehensive analysis by default
    runEnhanced: async (datasetId: string, config: {
      outcome_variable: string;
      group_variable?: string;
      test_type?: string;
      time_variable?: string;
      event_variable?: string;
      check_assumptions?: boolean;
    }): Promise<ComprehensiveAnalysisResult> => {
      // Get dataset data first from main API
      const response = await fetch(`${API_BASE_URL}${API_PREFIX}/files/datasets/${datasetId}/data`, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to get dataset data: ${response.status}`);
      }
      
      const datasetData = await response.json();
      
      // Run comprehensive analysis on statistical server
      return apiClient.analysis.runComprehensive({
        data: datasetData.data,
        outcome_variable: config.outcome_variable,
        group_variable: config.group_variable,
        analysis_type: config.test_type,
        time_variable: config.time_variable,
        event_variable: config.event_variable,
        check_assumptions: config.check_assumptions ?? true
      });
    },
  };

  // =====================================
  // Projects Service
  // =====================================

  projects = {
    list: async (page: number = 1, limit: number = 50, search?: string): Promise<{
      projects: Project[];
      total: number;
      page: number;
      limit: number;
    }> => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (search) params.append('search', search);
      
      return this.request(`/projects?${params.toString()}`);
    },

    create: async (projectData: {
      name: string;
      description?: string;
      study_type?: string;
      is_shared?: boolean;
    }): Promise<Project> => {
      return this.request<Project>('/projects', {
        method: 'POST',
        body: JSON.stringify(projectData),
      });
    },

    get: async (projectId: string): Promise<Project> => {
      return this.request<Project>(`/projects/${projectId}`);
    },

    update: async (projectId: string, updates: {
      name?: string;
      description?: string;
      study_type?: string;
      is_shared?: boolean;
    }): Promise<Project> => {
      return this.request<Project>(`/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (projectId: string): Promise<void> => {
      return this.request<void>(`/projects/${projectId}`, {
        method: 'DELETE',
      });
    },

    getStats: async (projectId: string): Promise<{
      project_id: string;
      datasets: number;
      analyses: number;
      figures: number;
      created_at: string;
      last_updated: string;
    }> => {
      return this.request(`/projects/${projectId}/stats`);
    },
  };

  // =====================================
  // Analyses Service
  // =====================================

  analyses = {
    list: async (page: number = 1, limit: number = 50, projectId?: string, analysisType?: string): Promise<{
      analyses: BackendAnalysis[];
      total: number;
      page: number;
      limit: number;
      has_next: boolean;
      has_prev: boolean;
    }> => {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', limit.toString());
      if (projectId) params.append('project_id', projectId);
      if (analysisType) params.append('analysis_type', analysisType);
      
      return this.request(`/analyses?${params.toString()}`);
    },

    create: async (data: {
      name: string;
      description?: string;
      project_id?: string;
      dataset_id: string;
      analysis_type: string;
      parameters: Record<string, any>;
      is_public?: boolean;
    }): Promise<BackendAnalysis> => {
      return this.request<BackendAnalysis>('/analyses', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },

    get: async (analysisId: string): Promise<BackendAnalysis> => {
      return this.request<BackendAnalysis>(`/analyses/${analysisId}`);
    },

    update: async (analysisId: string, updates: {
      name?: string;
      description?: string;
      is_public?: boolean;
      results?: any;
      figures?: any;
    }): Promise<BackendAnalysis> => {
      return this.request<BackendAnalysis>(`/analyses/${analysisId}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },

    delete: async (analysisId: string): Promise<void> => {
      return this.request<void>(`/analyses/${analysisId}`, {
        method: 'DELETE',
      });
    },
  };

  // =====================================
  // Health Check
  // =====================================

  health = {
    check: async (): Promise<{ status: string; timestamp: string }> => {
      return this.request<{ status: string; timestamp: string }>('/status');
    },
  };
}

// =====================================
// Export singleton instance
// =====================================

export const apiClient = new ApiClient();

// =====================================
// Utility Functions
// =====================================

export const handleApiError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

export const isApiError = (error: unknown): error is Error => {
  return error instanceof Error;
};

// =====================================
// Environment Configuration Helper
// =====================================

export const getApiConfig = () => ({
  baseURL: API_BASE_URL,
  prefix: API_PREFIX,
  fullURL: `${API_BASE_URL}${API_PREFIX}`,
}); 