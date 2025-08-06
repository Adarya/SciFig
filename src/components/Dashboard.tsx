import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Upload,
  Clock,
  CheckCircle,
  TrendingUp,
  Crown
} from 'lucide-react';
import { User } from '../utils/supabase';
import { useProjects } from '../hooks/useProjects';
import { logger } from '../utils/logger';
import { apiClient } from '../services/apiClient';

interface DashboardProps {
  user: User;
  onNavigate: NavigateFunction;
  onLogout: () => void;
  onSetProject: (project: any) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onLogout, onSetProject }) => {
  const { projects, loading, error, createProject, refreshProjects } = useProjects();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    logger.componentMount('Dashboard');
    logger.info('Dashboard loaded', { 
      userId: user.id,
      userEmail: user.email,
      hasUser: !!user,
      projectsCount: projects.length,
      isLoading: loading,
      hasError: !!error,
      errorMessage: error 
    }, 'Dashboard');

    return () => {
      logger.componentUnmount('Dashboard');
    };
  }, [user.id, projects.length, error, loading]);
  
  // Get recent projects (last 5, sorted by creation date)
  const recentProjects = projects
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)
    .map(project => ({
      id: project.id,
      name: project.name,
      lastModified: new Date(project.updated_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      }),
      status: 'completed', // You can add logic to determine status based on analyses
      type: project.study_type || 'Study'
    }));

  const stats = [
    { 
      label: 'Projects Created', 
      value: projects.length, 
      icon: CheckCircle, 
      color: 'text-green-600' 
    },
    { 
      label: 'Shared Projects', 
      value: projects.filter(p => p.is_shared).length, 
      icon: BarChart3, 
      color: 'text-blue-600' 
    },
    { 
      label: 'Recent Activity', 
      value: projects.filter(p => {
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        return new Date(p.updated_at) > weekAgo;
      }).length, 
      icon: FileText, 
      color: 'text-purple-600' 
    },
    { 
      label: 'Total Analyses', 
      value: projects.reduce((sum, p) => sum + (p.analyses_count || 0), 0), 
      icon: Clock, 
      color: 'text-orange-600' 
    }
  ];

  const getSubscriptionBadge = () => {
    const tier = user.subscription_tier || 'free';
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[tier]}`}>
        {tier === 'free' && 'Free'}
        {tier === 'pro' && 'Pro'}
        {tier === 'enterprise' && 'Enterprise'}
      </span>
    );
  };

  const isTrialActive = () => {
    if (!user.trial_ends_at) return false;
    return new Date(user.trial_ends_at) > new Date();
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    logger.debug('Form submitted', { name: newProjectName, description: newProjectDescription }, 'Dashboard');
    
    if (!newProjectName.trim()) {
      logger.warn('Project name is empty, aborting creation', undefined, 'Dashboard');
      return;
    }
    
    logger.userAction('create_project_attempt', { name: newProjectName });
    setIsCreating(true);
    
    try {
      logger.debug('Calling createProject function', undefined, 'Dashboard');
      const newProject = await createProject(newProjectName, newProjectDescription);
      logger.userAction('create_project_success', { 
        projectId: newProject.id, 
        name: newProjectName 
      });
      setNewProjectName('');
      setNewProjectDescription('');
      setShowCreateForm(false);
    } catch (err) {
      logger.error('Failed to create project from dashboard', err, 'Dashboard');
      // Show error to user
      alert(`Failed to create project: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">SciFig AI</h1>
              <nav className="hidden md:flex space-x-8">
                <button className="text-blue-600 font-medium">Dashboard</button>
                <button className="text-gray-500 hover:text-gray-700">Projects</button>
                <button className="text-gray-500 hover:text-gray-700">Templates</button>
                <button className="text-gray-500 hover:text-gray-700">Help</button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {user.name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="hidden sm:block">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-700 text-sm">{user.name || user.email}</span>
                      {getSubscriptionBadge()}
                    </div>
                    {isTrialActive() && (
                      <div className="text-xs text-orange-600">
                        Trial ends {new Date(user.trial_ends_at!).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700"
                  title="Sign out"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
            >
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user.name?.split(' ')[0] || 'Researcher'}!
              </h2>
              <p className="text-blue-100 mb-6">Ready to create your next publication-ready analysis?</p>
              <div className="flex gap-4">
                <button 
                  onClick={async () => {
                    try {
                      setIsCreating(true);
                      const projectName = `Data Analysis - ${new Date().toLocaleDateString()}`;
                      const newProject = await createProject(projectName, 'Statistical analysis project');
                      onSetProject(newProject);
                      onNavigate('analysis');
                    } catch (error) {
                      console.error('Failed to create project:', error);
                      // Navigate anyway for now
                      onNavigate('analysis');
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                  disabled={isCreating}
                >
                  <Upload className="h-4 w-4" />
                  {isCreating ? 'Creating...' : 'Upload Data'}
                </button>
                <button 
                  onClick={async () => {
                    try {
                      setIsCreating(true);
                      const projectName = `Figure Analysis - ${new Date().toLocaleDateString()}`;
                      const newProject = await createProject(projectName, 'Figure analysis project');
                      onSetProject(newProject);
                      onNavigate('figure-analyzer');
                    } catch (error) {
                      console.error('Failed to create project:', error);
                      // Navigate anyway for now
                      onNavigate('figure-analyzer');
                    } finally {
                      setIsCreating(false);
                    }
                  }}
                  className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                  disabled={isCreating}
                >
                  {isCreating ? 'Creating...' : 'Analyze Figure'}
                </button>
              </div>
            </motion.div>

            {/* Subscription Status */}
            {user.subscription_tier === 'free' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-2xl p-6"
              >
                <div className="flex items-center space-x-3 mb-4">
                  <Crown className="h-6 w-6 text-orange-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Upgrade to Pro</h3>
                </div>
                <p className="text-gray-700 mb-4">
                  Unlock unlimited analyses, advanced statistical tests, and collaboration features.
                </p>
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => onNavigate('pricing')}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors font-medium"
                  >
                    View Plans
                  </button>
                  <span className="text-sm text-gray-600">
                    4 of 5 free analyses used this month
                  </span>
                </div>
              </motion.div>
            )}

            {/* Recent Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Projects</h3>
                                  <div className="flex space-x-2">
                    <button 
                      onClick={() => {
                        logger.userAction('manual_refresh_projects');
                        refreshProjects();
                      }}
                      className="text-green-600 hover:text-green-700 font-medium text-sm"
                    >
                      🔄 Refresh
                    </button>
                    <span className="text-gray-300">|</span>
                    <button 
                      onClick={() => setShowCreateForm(true)}
                      className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                      + New Project
                    </button>
                    <span className="text-gray-300">|</span>
                    <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
                  </div>
              </div>
              <div className="space-y-4">
                {showCreateForm && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-4">
                    <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h4>
                    <form onSubmit={handleCreateProject}>
                      <div className="mb-4">
                        <label htmlFor="dashboardProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                          Project Name
                        </label>
                        <input
                          id="dashboardProjectName"
                          type="text"
                          value={newProjectName}
                          onChange={(e) => setNewProjectName(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter project name"
                          required
                          disabled={isCreating}
                        />
                      </div>
                      <div className="mb-4">
                        <label htmlFor="dashboardProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                          Description (optional)
                        </label>
                        <textarea
                          id="dashboardProjectDescription"
                          value={newProjectDescription}
                          onChange={(e) => setNewProjectDescription(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter project description"
                          rows={3}
                          disabled={isCreating}
                        />
                      </div>
                      <div className="flex justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowCreateForm(false);
                            setNewProjectName('');
                            setNewProjectDescription('');
                          }}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                          disabled={isCreating}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          disabled={isCreating || !newProjectName.trim()}
                        >
                          {isCreating ? 'Creating...' : 'Create Project'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-gray-600">Loading projects...</span>
                  </div>
                ) : error ? (
                  <div className="text-center py-8">
                    <div className="text-red-500 mb-2">⚠️ Error loading projects</div>
                    <p className="text-sm text-gray-600">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
                    >
                      Reload page
                    </button>
                  </div>
                ) : recentProjects.length > 0 ? (
                  recentProjects.map((project) => (
                    <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <BarChart3 className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{project.name}</h4>
                          <p className="text-sm text-gray-500">{project.type} • {project.lastModified}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          project.status === 'completed' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {project.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                        <button 
                          onClick={async () => {
                            try {
                              // Set the project context
                              onSetProject(project);
                              
                              // Check if project has analyses
                              const projectStats = await apiClient.projects.getStats(project.id);
                              
                              if (projectStats.analyses > 0) {
                                // Project has analyses, fetch the latest one
                                const analysesResponse = await apiClient.analyses.list(1, 1, project.id);
                                if (analysesResponse.analyses.length > 0) {
                                  const latestAnalysis = analysesResponse.analyses[0];
                                  // TODO: Navigate to a results view for this analysis
                                  // For now, navigate to analysis view with project context
                                  onNavigate('analysis');
                                } else {
                                  // No analyses found, start new analysis
                                  onNavigate('analysis');
                                }
                              } else {
                                // No analyses yet, start new analysis
                                onNavigate('analysis');
                              }
                            } catch (error) {
                              console.error('Failed to check project state:', error);
                              // Fallback to analysis view
                              onSetProject(project);
                              onNavigate('analysis');
                            }
                          }}
                          className="text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    {!showCreateForm ? (
                      <>
                        <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                        <h4 className="text-lg font-medium text-gray-900 mb-2">No projects yet</h4>
                        <p className="text-gray-500 mb-4">Start by creating your first project</p>
                        <button 
                          onClick={() => setShowCreateForm(true)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                          Create Project
                        </button>
                      </>
                    ) : (
                      <div className="max-w-md mx-auto text-left">
                        <h4 className="text-lg font-medium text-gray-900 mb-4">Create New Project</h4>
                        <form onSubmit={handleCreateProject}>
                          <div className="mb-4">
                            <label htmlFor="dashboardProjectName" className="block text-sm font-medium text-gray-700 mb-1">
                              Project Name
                            </label>
                            <input
                              id="dashboardProjectName"
                              type="text"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter project name"
                              required
                              disabled={isCreating}
                            />
                          </div>
                          <div className="mb-4">
                            <label htmlFor="dashboardProjectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                              Description (optional)
                            </label>
                            <textarea
                              id="dashboardProjectDescription"
                              value={newProjectDescription}
                              onChange={(e) => setNewProjectDescription(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter project description"
                              rows={3}
                              disabled={isCreating}
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCreateForm(false);
                                setNewProjectName('');
                                setNewProjectDescription('');
                              }}
                              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                              disabled={isCreating}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                              disabled={isCreating || !newProjectName.trim()}
                            >
                              {isCreating ? 'Creating...' : 'Create Project'}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Start</h3>
              <button 
                onClick={() => onNavigate('analysis')}
                className="w-full bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:bg-blue-100 transition-colors group"
              >
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-blue-600 font-semibold">Upload Data</p>
                <p className="text-blue-500 text-sm mt-1">CSV, Excel, or SPSS files</p>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Stats This Month</h3>
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className="text-gray-700">{stat.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Pro Tip</h3>
              <p className="text-gray-700 text-sm mb-4">
                Use natural language to describe your analysis goals. Our AI will recommend the best statistical approach.
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Learn More →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;