import { useState, useEffect } from 'react';
import { apiClient, Project } from '../services/apiClient';
import { useAuth } from '../providers/ApiAuthProvider';

interface UseProjectsResult {
  projects: Project[];
  loading: boolean;
  error: string | null;
  createProject: (name: string, description?: string) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<Project>;
  deleteProject: (id: string) => Promise<boolean>;
  getProject: (id: string) => Promise<Project>;
  refreshProjects: () => Promise<void>;
}

export const useProjects = (): UseProjectsResult => {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch projects on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshProjects();
    } else {
      // Clear projects when user logs out
      setProjects([]);
      setLoading(false);
    }
  }, [user?.id]);

  // Function to refresh projects from the backend
  const refreshProjects = async (): Promise<void> => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.projects.list();
      setProjects(response.projects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  // Create a new project
  const createProject = async (name: string, description?: string): Promise<Project> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const newProject = await apiClient.projects.create({
        name,
        description,
        is_shared: false
      });
      
      // Update local state
      setProjects(prev => [...prev, newProject]);
      
      return newProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing project
  const updateProject = async (id: string, updates: Partial<Project>): Promise<Project> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const updatedProject = await apiClient.projects.update(id, {
        name: updates.name,
        description: updates.description,
        study_type: updates.study_type,
        is_shared: updates.is_shared
      });
      
      // Update local state
      setProjects(prev => prev.map(p => p.id === id ? updatedProject : p));
      
      return updatedProject;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Delete a project
  const deleteProject = async (id: string): Promise<boolean> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.projects.delete(id);
      
      // Update local state
      setProjects(prev => prev.filter(p => p.id !== id));
      
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Get a single project by ID
  const getProject = async (id: string): Promise<Project> => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      const project = await apiClient.projects.get(id);
      return project;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get project');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    projects,
    loading,
    error,
    createProject,
    updateProject,
    deleteProject,
    getProject,
    refreshProjects
  };
}; 