import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  BookOpen, 
  BarChart3, 
  Activity, 
  Beaker,
  Brain,
  Clock,
  TrendingUp,
  Zap,
  Star,
  ArrowRight,
  Tag,
  Info
} from 'lucide-react';
import { apiClient, FigureTemplate, TemplateLibraryResponse } from '../services/apiClient';
import { logger } from '../utils/logger';

interface TemplateLibraryProps {
  data?: any[];
  onTemplateSelect: (template: FigureTemplate) => void;
  onClose: () => void;
  analysisGoal?: string;
}

const CATEGORY_ICONS = {
  'basic_statistics': BarChart3,
  'clinical_trials': Activity,
  'genomics': Beaker,
  'proteomics': Beaker,
  'time_series': Clock,
  'correlations': TrendingUp,
  'distributions': BarChart3,
  'survival': Clock,
  'machine_learning': Brain,
} as const;

const TemplateLibrary: React.FC<TemplateLibraryProps> = ({ 
  data, 
  onTemplateSelect, 
  onClose,
  analysisGoal 
}) => {
  const [templates, setTemplates] = useState<FigureTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showRecommended, setShowRecommended] = useState(false);
  const [recommendedTemplates, setRecommendedTemplates] = useState<FigureTemplate[]>([]);

  useEffect(() => {
    loadTemplates();
    if (data && data.length > 0) {
      loadRecommendations();
    }
  }, [data, analysisGoal]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response: TemplateLibraryResponse = await apiClient.templates.getAll();
      setTemplates(response.templates);
      setCategories(response.categories);
      logger.info(`Loaded ${response.total_count} figure templates`, response.categories);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load templates';
      setError(errorMsg);
      logger.error('Failed to load templates', err);
    } finally {
      setLoading(false);
    }
  };

  const loadRecommendations = async () => {
    if (!data || data.length === 0) return;
    
    try {
      const response = await apiClient.templates.recommend(data, analysisGoal);
      setRecommendedTemplates(response.recommendations);
      logger.info(`Got ${response.count} template recommendations`, response.data_characteristics);
    } catch (err) {
      logger.warn('Failed to load template recommendations', err);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = !searchQuery || 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const displayTemplates = showRecommended && recommendedTemplates.length > 0 
    ? recommendedTemplates 
    : filteredTemplates;

  const getCategoryName = (category: string): string => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const getCategoryIcon = (category: string) => {
    const IconComponent = CATEGORY_ICONS[category as keyof typeof CATEGORY_ICONS] || BookOpen;
    return IconComponent;
  };

  const getJournalStyleColor = (style: string): string => {
    const colors = {
      'nature': 'text-green-600 bg-green-50 border-green-200',
      'science': 'text-red-600 bg-red-50 border-red-200',
      'cell': 'text-blue-600 bg-blue-50 border-blue-200',
      'nejm': 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colors[style as keyof typeof colors] || 'text-gray-600 bg-gray-50 border-gray-200';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md mx-auto">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-700">Loading templates...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 max-w-md mx-auto">
          <div className="text-center">
            <div className="text-red-600 mb-4">Failed to load templates</div>
            <div className="text-gray-600 text-sm mb-4">{error}</div>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <BookOpen className="h-6 w-6 text-blue-600" />
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Figure Template Library</h2>
              <p className="text-sm text-gray-600">Choose from pre-configured publication-ready templates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 space-y-4">
          {/* Search and Filters */}
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search templates by name, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {getCategoryName(category)}
                </option>
              ))}
            </select>
          </div>

          {/* Recommendation Toggle */}
          {recommendedTemplates.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium text-gray-700">
                  {recommendedTemplates.length} templates recommended for your data
                </span>
              </div>
              <button
                onClick={() => setShowRecommended(!showRecommended)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  showRecommended 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showRecommended ? 'Show All' : 'Show Recommended'}
              </button>
            </div>
          )}
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {displayTemplates.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {displayTemplates.map((template, index) => {
                  const CategoryIcon = getCategoryIcon(template.category);
                  const isRecommended = recommendedTemplates.some(rt => rt.id === template.id);
                  
                  return (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-lg hover:shadow-lg transition-all duration-200 cursor-pointer group"
                      onClick={() => onTemplateSelect(template)}
                    >
                      {/* Card Header */}
                      <div className="p-4 pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <CategoryIcon className="h-5 w-5 text-blue-600" />
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                              {getCategoryName(template.category)}
                            </span>
                          </div>
                          {isRecommended && (
                            <div className="flex items-center space-x-1 bg-yellow-50 border border-yellow-200 rounded-full px-2 py-1">
                              <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              <span className="text-xs text-yellow-700 font-medium">Recommended</span>
                            </div>
                          )}
                        </div>
                        
                        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                          {template.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {template.description}
                        </p>
                        
                        {/* Journal Style Badge */}
                        <div className={`inline-flex items-center px-2 py-1 rounded-full border text-xs font-medium ${getJournalStyleColor(template.journal_style)}`}>
                          {template.journal_style.toUpperCase()} Style
                        </div>
                      </div>

                      {/* Card Body */}
                      <div className="px-4 pb-4 space-y-3">
                        {/* Plot Type */}
                        <div className="text-xs">
                          <span className="text-gray-500">Plot Type:</span>
                          <span className="ml-1 font-medium text-gray-700 capitalize">
                            {template.plot_type.replace(/_/g, ' ')}
                          </span>
                        </div>

                        {/* Required Variables */}
                        {template.required_variables.length > 0 && (
                          <div className="text-xs">
                            <span className="text-gray-500">Required:</span>
                            <div className="mt-1 flex flex-wrap gap-1">
                              {template.required_variables.slice(0, 3).map(variable => (
                                <span key={variable} className="bg-red-50 text-red-700 px-2 py-1 rounded text-xs">
                                  {variable.replace(/_/g, ' ')}
                                </span>
                              ))}
                              {template.required_variables.length > 3 && (
                                <span className="text-gray-500 text-xs">
                                  +{template.required_variables.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Tags */}
                        {template.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {template.tags.slice(0, 3).map(tag => (
                              <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Example Data Shape */}
                        <div className="text-xs text-gray-500 border-t pt-2">
                          <div className="flex items-start space-x-1">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            <span>{template.example_data_shape}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer - Select Button */}
                      <div className="px-4 pb-4">
                        <div className="flex items-center justify-between text-blue-600 font-medium text-sm group-hover:text-blue-700">
                          <span>Use This Template</span>
                          <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing {displayTemplates.length} of {templates.length} templates
              {showRecommended && recommendedTemplates.length > 0 && (
                <span className="ml-2 text-blue-600">(AI Recommended)</span>
              )}
            </div>
            <button
              onClick={onClose}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Close Library
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TemplateLibrary;