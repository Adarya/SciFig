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

interface DataPreviewProps {
  data: any;
  onNext: () => void;
  onBack: () => void;
}

const DataPreview: React.FC<DataPreviewProps> = ({ data, onNext, onBack }) => {
  const [studyType, setStudyType] = useState('randomized_trial');

  const columnTypes = {
    'Patient_ID': 'categorical',
    'Age': 'continuous',
    'Treatment': 'categorical',
    'Outcome': 'continuous',
    'Gender': 'categorical',
    'BMI': 'continuous',
    'Baseline_Score': 'continuous'
  };

  const getColumnTypeColor = (type: string) => {
    switch (type) {
      case 'continuous': return 'bg-blue-100 text-blue-800';
      case 'categorical': return 'bg-green-100 text-green-800';
      case 'ordinal': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
                            getColumnTypeColor(columnTypes[column as keyof typeof columnTypes] || 'unknown')
                          }`}>
                            {columnTypes[column as keyof typeof columnTypes] || 'unknown'}
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

          {/* Variable Types */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Variable Classification</h3>
            <div className="grid md:grid-cols-2 gap-4">
              {data.columns.map((column: string) => (
                <div key={column} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">{column}</span>
                  <select 
                    className="text-sm border border-gray-300 rounded px-2 py-1"
                    defaultValue={columnTypes[column as keyof typeof columnTypes] || 'continuous'}
                  >
                    <option value="continuous">Continuous</option>
                    <option value="categorical">Categorical</option>
                    <option value="ordinal">Ordinal</option>
                  </select>
                </div>
              ))}
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
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">No missing values detected</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm text-gray-700">Data types validated</span>
              </div>
              <div className="flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600" />
                <span className="text-sm text-gray-700">2 potential outliers found</span>
              </div>
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
              <p>• Detected 3 treatment groups suitable for ANOVA analysis</p>
              <p>• Continuous outcome variable suggests parametric tests</p>
              <p>• Balanced design with adequate sample size</p>
              <p>• Consider age and BMI as potential covariates</p>
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
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span>Choose Analysis</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default DataPreview;