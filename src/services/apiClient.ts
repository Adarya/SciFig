// SciFig AI: API Client Service
// Centralized service for backend communication

import { supabase } from '../utils/supabase';

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

// =====================================
// API Client Class
// =====================================

class ApiClient {
  private baseURL: string;
  
  constructor() {
    this.baseURL = `${API_BASE_URL}${API_PREFIX}`;
  }

  // Private helper to get auth headers
  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  // Generic request method with error handling
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const config: RequestInit = {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.detail || errorData.message || errorMessage;
        } catch {
          // If can't parse JSON, use status text
        }
        
        throw new Error(errorMessage);
      }

      // Handle empty responses (204 No Content)
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network request failed');
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
      return this.request<{ valid: boolean; user?: User }>('/auth/check');
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
      return this.request<AnalysisResult>('/analysis/run', {
        method: 'POST',
        body: JSON.stringify({
          dataset_id: datasetId,
          ...config,
        }),
      });
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