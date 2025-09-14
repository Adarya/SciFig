import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Folder, 
  FolderPlus, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash, 
  Share,
  Lock,
  Globe,
  Loader,
  AlertCircle,
  Search
} from 'lucide-react';
import { useProjects, Project } from '../hooks/useProjects';

interface ProjectListProps {
  onSelectProject: (project: Project) => void;
  className?: string;
}

const ProjectList: React.FC<ProjectListProps> = ({ onSelectProject, className = '' }) => {
  const { projects, loading, error, createProject, deleteProject } = useProjects();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle create project form submission
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;
    
    try {
      const newProject = await createProject(newProjectName, newProjectDescription);
      setNewProjectName('');
      setNewProjectDescription('');
      setIsCreating(false);
      onSelectProject(newProject);
    } catch (err) {
      console.error('Failed to create project:', err);
    }
  };

  // Handle project deletion
  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this project?')) {
      try {
        await deleteProject(id);
        setActiveDropdown(null);
      } catch (err) {
        console.error('Failed to delete project:', err);
      }
    }
  };

  // Toggle dropdown menu
  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // Format date for display
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h2 className="text-lg font-semibold text-gray-900">My Projects</h2>
        <div className="mt-2 flex items-center justify-between">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          {/* Create Project Button */}
          <button
            onClick={() => setIsCreating(true)}
            className="flex items-center space-x-1 bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </button>
        </div>
      </div>

      {/* Create Project Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-b border-gray-200 p-4 bg-gray-50"
        >
          <form onSubmit={handleCreateProject}>
            <div className="mb-4">
              <label htmlFor="projectName" className="block text-sm font-medium text-gray-700 mb-1">
                Project Name
              </label>
              <input
                id="projectName"
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project name"
                required
              />
            </div>
            <div className="mb-4">
              <label htmlFor="projectDescription" className="block text-sm font-medium text-gray-700 mb-1">
                Description (optional)
              </label>
              <textarea
                id="projectDescription"
                value={newProjectDescription}
                onChange={(e) => setNewProjectDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter project description"
                rows={3}
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Project
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="p-8 flex flex-col items-center justify-center">
          <Loader className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <p className="text-gray-500">Loading projects...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-8 flex flex-col items-center justify-center">
          <AlertCircle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-red-500 font-medium">{error}</p>
          <p className="text-gray-500 mt-1">Please try again later</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && filteredProjects.length === 0 && (
        <div className="p-8 flex flex-col items-center justify-center">
          <Folder className="h-12 w-12 text-gray-300 mb-2" />
          <h3 className="text-gray-700 font-medium text-lg">No projects found</h3>
          {searchTerm ? (
            <p className="text-gray-500 mt-1">Try a different search term</p>
          ) : (
            <p className="text-gray-500 mt-1">Create your first project to get started</p>
          )}
        </div>
      )}

      {/* Project List */}
      {!loading && !error && filteredProjects.length > 0 && (
        <ul className="divide-y divide-gray-200">
          {filteredProjects.map((project) => (
            <motion.li
              key={project.id}
              whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
              onClick={() => onSelectProject(project)}
              className="p-4 cursor-pointer relative"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div className="mt-0.5">
                    <Folder className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 font-medium">{project.name}</h3>
                    {project.description && (
                      <p className="text-gray-500 text-sm mt-1">{project.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>Updated {formatDate(project.updated_at)}</span>
                      </div>
                      <div className="flex items-center">
                        {project.is_public ? (
                          <Globe className="h-3 w-3 mr-1" />
                        ) : (
                          <Lock className="h-3 w-3 mr-1" />
                        )}
                        <span>{project.is_public ? 'Public' : 'Private'}</span>
                      </div>
                      {project.datasets && (
                        <div>
                          {project.datasets.length} dataset{project.datasets.length !== 1 ? 's' : ''}
                        </div>
                      )}
                      {project.analyses && (
                        <div>
                          {project.analyses.length} analysis{project.analyses.length !== 1 ? 'es' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Dropdown */}
                <div className="relative">
                  <button
                    onClick={(e) => toggleDropdown(project.id, e)}
                    className="p-1 hover:bg-gray-100 rounded-full"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-500" />
                  </button>
                  
                  {activeDropdown === project.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                      <div className="py-1">
                        <button
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            // Edit functionality would go here
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit Project
                        </button>
                        <button
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdown(null);
                            // Share functionality would go here
                          }}
                        >
                          <Share className="h-4 w-4 mr-2" />
                          Share Project
                        </button>
                        <button
                          className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash className="h-4 w-4 mr-2" />
                          Delete Project
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ProjectList; 