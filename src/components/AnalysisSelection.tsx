import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  Brain, 
  Target, 
  Zap, 
  BarChart3,
  TrendingUp,
  Activity,
  PieChart
} from 'lucide-react';

interface AnalysisSelectionProps {
  data: any;
  onAnalysisSelected: (config: any) => void;
  onBack: () => void;
}

const AnalysisSelection: React.FC<AnalysisSelectionProps> = ({ data, onAnalysisSelected, onBack }) => {
  const [selectedAnalysis, setSelectedAnalysis] = useState('independent_ttest');
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState('');

  const recommendedAnalyses = [
    {
      id: 'independent_ttest',
      name: 'Independent T-Test',
      description: 'Compare Drug A vs Drug B outcomes',
      reason: '2 groups, continuous outcome',
      icon: BarChart3,
      assumptions: ['Normality', 'Equal variance'],
      effectSize: "Cohen's d",
      recommended: true
    },
    {
      id: 'anova',
      name: 'ANOVA with Post-hoc',
      description: 'Compare all 3 treatment groups',
      reason: '3+ groups comparison',
      icon: TrendingUp,
      assumptions: ['Normality', 'Equal variance', 'Independence'],
      effectSize: 'Eta squared',
      recommended: true
    }
  ];

  const otherAnalyses = [
    {
      id: 'linear_regression',
      name: 'Linear Regression',
      description: 'Model outcome with multiple predictors',
      icon: Activity,
      assumptions: ['Linearity', 'Independence', 'Normality']
    },
    {
      id: 'logistic_regression',
      name: 'Logistic Regression',
      description: 'Binary outcome prediction',
      icon: PieChart,
      assumptions: ['Independence', 'Linearity of logit']
    },
    {
      id: 'survival_analysis',
      name: 'Survival Analysis',
      description: 'Time-to-event analysis',
      icon: Activity,
      assumptions: ['Proportional hazards']
    },
    {
      id: 'chi_square',
      name: 'Chi-square Test',
      description: 'Association between categorical variables',
      icon: PieChart,
      assumptions: ['Expected frequencies ≥ 5']
    }
  ];

  const handleRunAnalysis = () => {
    const selectedConfig = recommendedAnalyses.find(a => a.id === selectedAnalysis) || 
                          otherAnalyses.find(a => a.id === selectedAnalysis);
    
    onAnalysisSelected({
      type: selectedAnalysis,
      config: selectedConfig,
      naturalLanguageQuery
    });
  };

  const handleNaturalLanguageSubmit = () => {
    // Simulate AI processing of natural language query
    if (naturalLanguageQuery.toLowerCase().includes('drug a') && naturalLanguageQuery.toLowerCase().includes('drug b')) {
      setSelectedAnalysis('independent_ttest');
    } else if (naturalLanguageQuery.toLowerCase().includes('all groups')) {
      setSelectedAnalysis('anova');
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Choose Your Analysis</h2>
        <p className="text-lg text-gray-600">
          Based on your data structure, we recommend the following statistical approaches
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Analysis Options */}
        <div className="lg:col-span-2 space-y-6">
          {/* Natural Language Input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Brain className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Describe Your Research Question</h3>
            </div>
            <div className="space-y-4">
              <textarea
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                placeholder="e.g., 'I want to show if Drug A works better than Drug B' or 'Compare all treatment groups'"
                className="w-full h-24 border border-gray-300 rounded-lg px-4 py-3 resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <button 
                onClick={handleNaturalLanguageSubmit}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Get AI Recommendation
              </button>
            </div>
          </motion.div>

          {/* Recommended Analyses */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Target className="h-6 w-6 text-green-600" />
              <h3 className="text-lg font-semibold text-gray-900">Recommended for Your Data</h3>
            </div>
            <div className="space-y-4">
              {recommendedAnalyses.map((analysis) => {
                const AnalysisIcon = analysis.icon;
                const isSelected = selectedAnalysis === analysis.id;
                
                return (
                  <div
                    key={analysis.id}
                    onClick={() => setSelectedAnalysis(analysis.id)}
                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                        isSelected ? 'bg-blue-100' : 'bg-gray-100'
                      }`}>
                        <AnalysisIcon className={`h-6 w-6 ${
                          isSelected ? 'text-blue-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h4 className="font-semibold text-gray-900">{analysis.name}</h4>
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2 py-1 rounded-full">
                            Recommended
                          </span>
                        </div>
                        <p className="text-gray-700 mb-2">{analysis.description}</p>
                        <div className="flex items-center space-x-2 text-sm">
                          <Zap className="h-4 w-4 text-yellow-500" />
                          <span className="text-gray-600">Why: {analysis.reason}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {analysis.assumptions.map((assumption) => (
                            <span key={assumption} className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                              {assumption}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Other Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Other Analysis Options</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {otherAnalyses.map((analysis) => {
                const AnalysisIcon = analysis.icon;
                const isSelected = selectedAnalysis === analysis.id;
                
                return (
                  <div
                    key={analysis.id}
                    onClick={() => setSelectedAnalysis(analysis.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <AnalysisIcon className={`h-5 w-5 ${
                        isSelected ? 'text-blue-600' : 'text-gray-600'
                      }`} />
                      <h4 className="font-medium text-gray-900">{analysis.name}</h4>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{analysis.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {analysis.assumptions.map((assumption) => (
                        <span key={assumption} className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">
                          {assumption}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>

        {/* Analysis Details */}
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analysis Details</h3>
            {selectedAnalysis && (
              <div className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Selected Test</h4>
                  <p className="text-sm text-gray-600">
                    {recommendedAnalyses.find(a => a.id === selectedAnalysis)?.name || 
                     otherAnalyses.find(a => a.id === selectedAnalysis)?.name}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Sample Size</h4>
                  <p className="text-sm text-gray-600">{data.rows} observations</p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Power Analysis</h4>
                  <p className="text-sm text-green-600">✓ Adequate power ({'>'} 80%)</p>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">💡 AI Recommendation</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Based on your data structure:</p>
              <ul className="space-y-1 ml-4">
                <li>• Independent T-test is most appropriate</li>
                <li>• Sample size is adequate for reliable results</li>
                <li>• Consider checking normality assumptions</li>
                <li>• Effect size will be reported as Cohen's d</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <button 
          onClick={handleRunAnalysis}
          disabled={!selectedAnalysis}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Run Analysis</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default AnalysisSelection;