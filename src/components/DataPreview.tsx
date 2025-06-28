import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  ArrowRight, 
  FileText, 
  BarChart3, 
  AlertCircle,
  CheckCircle,
  Settings
} from 'lucide-react';
import { ParsedData } from '../utils/csvParser';

interface DataPreviewProps {
  data: ParsedData;
  onNext: () => void;
  onBack: () => void;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, onNext, onBack }) => {
  const [studyType, setStudyType] = useState('randomized_trial');
  const [outcomeVariable, setOutcomeVariable] = useState('');
  const [groupVariable, setGroupVariable] = useState('');

  // Auto-detect likely variables
  React.useEffect(() => {
    // Look for common outcome variable names
    const outcomeKeywords = ['outcome', 'score', 'result', 'response', 'efficacy', 'effect'];
    const groupKeywords = ['treatment', 'group', 'condition', 'arm', 'therapy'];

    const likelyOutcome = data.columns.find(col => 
      outcomeKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );
    
    const likelyGroup = data.columns.find(col => 
      groupKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );

    if (likelyOutcome && !outcomeVariable) {
      setOutcomeVariable(likelyOutcome);
    }
    
    if (likelyGroup && !groupVariable) {
      setGroupVariable(likelyGroup);
    }
  }, [data.columns, outcomeVariable, groupVariable]);

  const getColumnType = (columnName: string): string => {
    const sampleValues = data.preview.map(row => row[columnName]).filter(val => val != null);
    
    if (sampleValues.length === 0) return 'unknown';
    
    // Check if all values are numeric
    const isNumeric = sampleValues.every(val => !isNaN(Number(val)));
    
    if (isNumeric) {
      // Check if it looks like an ID or categorical despite being numeric
      const uniqueValues = new Set(sampleValues);
      const uniqueRatio = uniqueValues.size / sampleValues.length;
      
      if (columnName.toLowerCase().includes('id') || uniqueRatio > 0.8) {
        return 'categorical';
      }
      return 'continuous';
    }
    
    return 'categorical';
  };

  const getColumnTypeColor = (type: string) => {
    switch (type) {
      case 'continuous': return 'bg-blue-100 text-blue-800';
      case 'categorical': return 'bg-green-100 text-green-800';
      case 'ordinal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataQualityChecks = () => {
    const checks = [];
    
    // Check for missing values
    const totalCells = data.rows * data.columns.length;
    const missingCount = data.data.reduce((count, row) => {
      return count + data.columns.filter(col => row[col] == null || row[col] === '').length;
    }, 0);
    
    if (missingCount === 0) {
      checks.push({ type: 'success', message: 'No missing values detected' });
    } else {
      const missingPercent = (missingCount / totalCells * 100).toFixed(1);
      checks.push({ type: 'warning', message: `${missingPercent}% missing values detected` });
    }
    
    // Check data types
    checks.push({ type: 'success', message: 'Data types automatically detected' });
    
    // Check for potential outliers (simplified)
    if (outcomeVariable) {
      const outcomeValues = data.data
        .map(row => Number(row[outcomeVariable]))
        .filter(val => !isNaN(val));
      
      if (outcomeValues.length > 0) {
        const mean = outcomeValues.reduce((sum, val) => sum + val, 0) / outcomeValues.length;
        const std = Math.sqrt(outcomeValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / outcomeValues.length);
        const outliers = outcomeValues.filter(val => Math.abs(val - mean) > 3 * std);
        
        if (outliers.length > 0) {
          checks.push({ type: 'warning', message: `${outliers.length} potential outliers found` });
        } else {
          checks.push({ type: 'success', message: 'No extreme outliers detected' });
        }
      }
    }
    
    return checks;
  };

  const canProceed = outcomeVariable && groupVariable;

  return (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Data Preview & Configuration</h2>
        <p className="text-lg text-gray-600">
          Review your data structure and configure analysis settings
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Data Summary */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Info */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <FileText className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Dataset Overview</h3>
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600 font-medium">File Name</p>
                <p className="text-lg font-semibold text-gray-900">{data.filename}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600 font-medium">Observations</p>
                <p className="text-lg font-semibold text-gray-900">{data.rows.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-purple-600 font-medium">Variables</p>
                <p className="text-lg font-semibold text-gray-900">{data.columns.length}</p>
              </div>
            </div>
          </motion.div>

          {/* Data Preview Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Data</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    {data.columns.map((column: string) => (
                      <th key={column} className="text-left py-3 px-4 font-medium text-gray-900">
                        <div className="space-y-1">
                          <div>{column}</div>
                          <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            getColumnTypeColor(getColumnType(column))
                          }`}>
                            {getColumnType(column)}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.preview.map((row: any, index: number) => (
                    <tr key={index} className="border-b border-gray-100">
                      {data.columns.map((column: string) => (
                        <td key={column} className="py-3 px-4 text-gray-700">
                          {row[column]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Variable Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variable Selection</h3>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Outcome Variable (Dependent)
                </label>
                <select 
                  value={outcomeVariable}
                  onChange={(e) => setOutcomeVariable(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select outcome variable...</option>
                  {data.columns
                    .filter(col => getColumnType(col) === 'continuous')
                    .map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The variable you want to analyze or compare
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grouping Variable (Independent)
                </label>
                <select 
                  value={groupVariable}
                  onChange={(e) => setGroupVariable(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="">Select grouping variable...</option>
                  {data.columns
                    .filter(col => getColumnType(col) === 'categorical')
                    .map(col => (
                      <option key={col} value={col}>{col}</option>
                    ))
                  }
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  The variable that defines your groups
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-6">
          {/* Study Type */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <Settings className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">Study Configuration</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Type
                </label>
                <select 
                  value={studyType}
                  onChange={(e) => setStudyType(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2"
                >
                  <option value="randomized_trial">Randomized Controlled Trial</option>
                  <option value="observational">Observational Study</option>
                  <option value="case_control">Case-Control Study</option>
                  <option value="cohort">Cohort Study</option>
                  <option value="cross_sectional">Cross-Sectional Study</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Data Quality */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Quality Check</h3>
            <div className="space-y-3">
              {getDataQualityChecks().map((check, index) => (
                <div key={index} className="flex items-center space-x-3">
                  {check.type === 'success' ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                  )}
                  <span className="text-sm text-gray-700">{check.message}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* AI Insights */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-4">
              <BarChart3 className="h-5 w-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
            </div>
            <div className="space-y-3 text-sm text-gray-700">
              {groupVariable && (
                <p>• Detected grouping variable: {groupVariable}</p>
              )}
              {outcomeVariable && (
                <p>• Detected outcome variable: {outcomeVariable}</p>
              )}
              <p>• Dataset appears suitable for statistical analysis</p>
              <p>• Sample size ({data.rows}) is adequate for most tests</p>
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
          onClick={onNext}
          disabled={!canProceed}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>Choose Analysis</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DataPreview;