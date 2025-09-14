import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  FlaskConical, 
  Clock, 
  MoreVertical, 
  Edit, 
  Trash, 
  Eye,
  Filter,
  Loader,
  AlertCircle,
  Search,
  BarChart3
} from 'lucide-react';
import { useAnalyses, Analysis } from '../hooks/useAnalyses';

interface AnalysisListProps {
  onSelectAnalysis?: (analysis: Analysis) => void;
  projectId?: string; // Filter by project
  className?: string;
}

const AnalysisList: React.FC<AnalysisListProps> = ({ 
  onSelectAnalysis, 
  projectId,
  className = '' 
}) => {
  const { analyses, loading, error } = useAnalyses();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  // Filter analyses based on search term, type, and project
  const filteredAnalyses = analyses.filter(analysis => {
    const matchesSearch = analysis.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         analysis.analysis_type.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = !selectedType || analysis.analysis_type === selectedType;
    const matchesProject = !projectId || analysis.project_id === projectId;
    
    return matchesSearch && matchesType && matchesProject;
  });

  // Get unique analysis types for filter
  const analysisTypes = Array.from(new Set(analyses.map(a => a.analysis_type)));

  // Toggle dropdown menu
  const toggleDropdown = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveDropdown(activeDropdown === id ? null : id);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid date';
    }
  };

  // Format analysis type for display
  const formatAnalysisType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <FlaskConical className="h-6 w-6 text-indigo-600" />
            <h2 className="text-xl font-semibold text-gray-900">
              {projectId ? 'Project Analyses' : 'All Analyses'}
            </h2>
            {!loading && (
              <span className="bg-gray-100 text-gray-600 text-sm px-2 py-1 rounded-full">
                {filteredAnalyses.length}
              </span>
            )}
          </div>
        </div>

        {/* Search and Filter Controls */}
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search analyses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Type Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="">All Types</option>
              {analysisTypes.map(type => (
                <option key={type} value={type}>
                  {formatAnalysisType(type)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader className="h-8 w-8 text-indigo-600 animate-spin" />
            <span className="ml-2 text-gray-600">Loading analyses...</span>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <span className="ml-2 text-red-600">{error}</span>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredAnalyses.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm || selectedType ? 'No matching analyses' : 'No analyses yet'}
            </h3>
            <p className="text-gray-500">
              {searchTerm || selectedType 
                ? 'Try adjusting your search or filter criteria.'
                : 'Start by uploading a dataset and running an analysis.'
              }
            </p>
          </div>
        )}

        {/* Analysis List */}
        {!loading && !error && filteredAnalyses.length > 0 && (
          <ul className="divide-y divide-gray-200">
            {filteredAnalyses.map((analysis) => (
              <motion.li
                key={analysis.id}
                whileHover={{ backgroundColor: 'rgba(243, 244, 246, 0.5)' }}
                onClick={() => onSelectAnalysis?.(analysis)}
                className="p-4 cursor-pointer relative"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className="mt-0.5">
                      <FlaskConical className="h-5 w-5 text-indigo-500" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-gray-900 font-medium">
                        {analysis.name || `Analysis ${analysis.id.slice(0, 8)}`}
                      </h3>
                      {analysis.description && (
                        <p className="text-gray-500 text-sm mt-1">{analysis.description}</p>
                      )}
                      <div className="flex items-center mt-2 space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <BarChart3 className="h-4 w-4 mr-1" />
                          {formatAnalysisType(analysis.analysis_type)}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {formatDate(analysis.created_at)}
                        </span>
                        {analysis.is_public && (
                          <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                            Public
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className="relative">
                    <button
                      onClick={(e) => toggleDropdown(analysis.id, e)}
                      className="p-2 rounded-full hover:bg-gray-100"
                    >
                      <MoreVertical className="h-4 w-4 text-gray-500" />
                    </button>

                    {activeDropdown === analysis.id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-10"
                      >
                        <div className="py-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAnalysis?.(analysis);
                              setActiveDropdown(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Eye className="h-4 w-4 mr-3" />
                            View Results
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle edit
                              setActiveDropdown(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left"
                          >
                            <Edit className="h-4 w-4 mr-3" />
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Handle delete
                              if (window.confirm('Are you sure you want to delete this analysis?')) {
                                // Delete analysis
                              }
                              setActiveDropdown(null);
                            }}
                            className="flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100 w-full text-left"
                          >
                            <Trash className="h-4 w-4 mr-3" />
                            Delete
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default AnalysisList; 