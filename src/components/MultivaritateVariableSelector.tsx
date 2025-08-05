import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Target, AlertCircle, Info } from 'lucide-react';

interface MultivariateVariableSelectorProps {
  columns: string[];
  outcomeVariable: string;
  selectedPredictors: string[];
  onPredictorsChange: (predictors: string[]) => void;
  timeVariable?: string;
  eventVariable?: string;
}

export const MultivariateVariableSelector: React.FC<MultivariateVariableSelectorProps> = ({
  columns,
  outcomeVariable,
  selectedPredictors,
  onPredictorsChange,
  timeVariable,
  eventVariable
}) => {
  const [availableVariables, setAvailableVariables] = useState<string[]>([]);

  useEffect(() => {
    // Filter out outcome, time, and event variables from available predictors
    const excluded = [outcomeVariable, timeVariable, eventVariable].filter(Boolean);
    const available = columns.filter(col => !excluded.includes(col));
    setAvailableVariables(available);
  }, [columns, outcomeVariable, timeVariable, eventVariable]);

  const addPredictor = (variable: string) => {
    if (!selectedPredictors.includes(variable)) {
      onPredictorsChange([...selectedPredictors, variable]);
    }
  };

  const removePredictor = (variable: string) => {
    onPredictorsChange(selectedPredictors.filter(pred => pred !== variable));
  };

  const getVariableType = (columnName: string): 'categorical' | 'continuous' => {
    // This is a simplified type detection - in real implementation, 
    // you might want to use the same logic as in AnalysisSelection.tsx
    return columnName.toLowerCase().includes('id') ? 'categorical' : 'continuous';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
    >
      <div className="flex items-center space-x-3 mb-4">
        <Target className="h-5 w-5 text-purple-600" />
        <h3 className="text-lg font-semibold text-gray-900">Multivariate Analysis Variables</h3>
      </div>

      <div className="mb-4 p-4 bg-purple-50 border border-purple-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="h-5 w-5 text-purple-600 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-purple-800">About Multivariate Analysis</p>
            <p className="text-xs text-purple-700 mt-1">
              Analyze the relationship between multiple predictor variables and your outcome variable simultaneously. 
              This helps identify independent associations while controlling for confounding factors.
            </p>
          </div>
        </div>
      </div>

      {/* Selected Predictors */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Selected Predictor Variables ({selectedPredictors.length})
        </label>
        {selectedPredictors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-300 rounded-lg">
            <Target className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No predictor variables selected</p>
            <p className="text-xs">Choose variables from the list below</p>
          </div>
        ) : (
          <div className="space-y-2">
            {selectedPredictors.map((predictor, index) => (
              <motion.div
                key={predictor}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between p-3 bg-purple-50 border border-purple-200 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-medium text-purple-700">{index + 1}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-900">{predictor}</span>
                    <span className="ml-2 px-2 py-1 text-xs bg-white rounded text-gray-600">
                      {getVariableType(predictor)}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => removePredictor(predictor)}
                  className="p-1 hover:bg-red-100 rounded-full transition-colors"
                  title="Remove variable"
                >
                  <X className="h-4 w-4 text-red-600" />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Available Variables */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Available Variables ({availableVariables.filter(v => !selectedPredictors.includes(v)).length})
        </label>
        {selectedPredictors.length >= 10 && (
          <div className="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium text-amber-800">
                Many Variables Selected
              </span>
            </div>
            <p className="text-xs text-amber-700 mt-1">
              With {selectedPredictors.length} variables, ensure you have sufficient sample size (rule of thumb: 10-15 observations per variable).
            </p>
          </div>
        )}
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
          {availableVariables
            .filter(variable => !selectedPredictors.includes(variable))
            .map((variable) => (
              <button
                key={variable}
                onClick={() => addPredictor(variable)}
                className="flex items-center justify-between p-2 text-left bg-gray-50 hover:bg-purple-50 border border-gray-200 hover:border-purple-300 rounded-lg transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium text-gray-900 truncate block">
                    {variable}
                  </span>
                  <span className="text-xs text-gray-500">
                    {getVariableType(variable)}
                  </span>
                </div>
                <Plus className="h-4 w-4 text-gray-400 ml-2" />
              </button>
            ))}
        </div>
      </div>

      {/* Minimum Sample Size Warning */}
      {selectedPredictors.length > 0 && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-800">Sample Size Recommendation</p>
              <p className="text-xs text-blue-700 mt-1">
                For {selectedPredictors.length} predictor variable{selectedPredictors.length > 1 ? 's' : ''}, 
                you should have at least {Math.max(selectedPredictors.length * 10, 50)} observations 
                for reliable results.
              </p>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}; 