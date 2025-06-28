import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Plot from 'react-plotly.js';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Copy, 
  BarChart3, 
  FileText, 
  Settings,
  CheckCircle,
  AlertTriangle,
  Loader,
  Edit3
} from 'lucide-react';
import { EngineOrchestrator, AnalysisWorkflow, StatisticalResult } from '../utils/statisticalEngine';
import { FigureGenerator } from '../utils/figureGenerator';

interface ResultsViewProps {
  analysisConfig: any;
  onBack: () => void;
  onNewAnalysis: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ analysisConfig, onBack, onNewAnalysis }) => {
  const [figureStyle, setFigureStyle] = useState('nature');
  const [colorScheme, setColorScheme] = useState('default');
  const [exportFormat, setExportFormat] = useState('png');
  const [analysisResults, setAnalysisResults] = useState<AnalysisWorkflow | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Custom labels state
  const [customLabels, setCustomLabels] = useState({
    x: '',
    y: '',
    title: ''
  });
  const [showLabelEditor, setShowLabelEditor] = useState(false);

  useEffect(() => {
    runAnalysis();
  }, []);

  const runAnalysis = async () => {
    setIsAnalyzing(true);
    setError(null);

    try {
      const orchestrator = new EngineOrchestrator();
      
      let results: AnalysisWorkflow;
      
      // Handle different analysis types
      if (['chi_square', 'fisher_exact', 'kaplan_meier'].includes(analysisConfig.type)) {
        // For special analyses that need custom handling
        results = orchestrator.runCustomAnalysis(
          analysisConfig.data,
          analysisConfig.type,
          analysisConfig.outcomeVariable,
          analysisConfig.groupVariable,
          analysisConfig.timeVariable,
          analysisConfig.eventVariable
        );
      } else {
        // Standard analyses
        results = orchestrator.runAnalysis(
          analysisConfig.data,
          analysisConfig.outcomeVariable,
          analysisConfig.groupVariable,
          analysisConfig.timeVariable,
          analysisConfig.eventVariable
        );
      }
      
      setAnalysisResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMethodsText = (result: StatisticalResult): string => {
    if ('error' in result) return '';

    const testName = result.test_name;
    const summary = result.summary;
    
    let methodsText = `A ${testName.toLowerCase()} was conducted to `;
    
    if (testName.includes('Chi-Square')) {
      methodsText += `test the association between ${analysisConfig.outcomeVariable} and ${analysisConfig.groupVariable}. `;
    } else if (testName.includes('Fisher')) {
      methodsText += `test the association between ${analysisConfig.outcomeVariable} and ${analysisConfig.groupVariable} using an exact test. `;
    } else if (testName.includes('Survival') || testName.includes('Kaplan-Meier')) {
      methodsText += `analyze time-to-event data. `;
    } else {
      methodsText += `compare ${analysisConfig.outcomeVariable} between groups. `;
    }
    
    if (result.groups) {
      const groupNames = Object.keys(result.groups);
      const groupStats = Object.values(result.groups);
      
      methodsText += groupNames.map((name, i) => 
        `${name} (M=${groupStats[i].mean.toFixed(2)}, SD=${groupStats[i].std_dev.toFixed(2)}, n=${groupStats[i].n})`
      ).join(' and ') + '. ';
    }
    
    methodsText += `${summary}`;
    
    if (result.effect_size) {
      methodsText += `, ${result.effect_size.name}=${result.effect_size.value.toFixed(2)}`;
    }
    
    methodsText += '.';
    
    return methodsText;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const generateFigure = () => {
    if (!analysisResults || 'error' in analysisResults.final_result) return null;

    const result = analysisResults.final_result as StatisticalResult;
    
    try {
      const labels = {
        x: customLabels.x || undefined,
        y: customLabels.y || undefined,
        title: customLabels.title || undefined
      };

      if (result.test_name.includes('T-Test') || result.test_name.includes('Mann-Whitney')) {
        return FigureGenerator.generateBoxPlot(
          analysisConfig.data,
          analysisConfig.groupVariable,
          analysisConfig.outcomeVariable,
          result,
          figureStyle,
          labels
        );
      } else if (result.test_name.includes('ANOVA') || result.test_name.includes('Kruskal')) {
        return FigureGenerator.generateBarPlot(
          analysisConfig.data,
          analysisConfig.groupVariable,
          analysisConfig.outcomeVariable,
          result,
          figureStyle,
          labels
        );
      } else if (result.test_name.includes('Chi-Square') || result.test_name.includes('Fisher')) {
        return FigureGenerator.generateContingencyHeatmap(
          result,
          analysisConfig.groupVariable,
          analysisConfig.outcomeVariable,
          figureStyle,
          labels
        );
      } else if (result.test_name.includes('Survival') || result.test_name.includes('Kaplan-Meier')) {
        return FigureGenerator.generateSurvivalCurve(result, figureStyle, labels);
      }
    } catch (err) {
      console.error('Figure generation error:', err);
      return null;
    }
    
    return null;
  };

  if (isAnalyzing) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center"
        >
          <Loader className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Running Statistical Analysis...</h3>
          <p className="text-gray-600">
            Analyzing your data with {analysisConfig.type.replace('_', ' ')} and checking assumptions.
          </p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center"
        >
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Error</h3>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={runAnalysis}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </motion.div>
      </div>
    );
  }

  if (!analysisResults) return null;

  const result = analysisResults.final_result;
  const isError = 'error' in result;
  const figure = !isError ? generateFigure() : null;

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Results</h2>
        <p className="text-lg text-gray-600">
          Your statistical analysis is complete with publication-ready outputs
        </p>
      </div>

      {isError ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center"
        >
          <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Issues</h3>
          <p className="text-red-600 mb-4">{result.error}</p>
          {result.details && (
            <ul className="text-sm text-red-600 mb-4">
              {result.details.map((detail, index) => (
                <li key={index}>• {detail}</li>
              ))}
            </ul>
          )}
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Results Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Statistical Results */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-xl font-semibold text-gray-900 mb-6">{result.test_name} Results</h3>
              
              <div className="bg-blue-50 rounded-lg p-6 mb-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-3">Test Statistics</h4>
                    <div className="space-y-2 text-sm">
                      {Object.entries(result.statistic).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                          <span className="text-gray-600">{key.replace('_', ' ')}:</span>
                          <span className="font-medium">{typeof value === 'number' ? value.toFixed(3) : value}</span>
                        </div>
                      ))}
                      <div className="flex justify-between">
                        <span className="text-gray-600">p-value:</span>
                        <span className="font-medium">
                          {result.p_value < 0.001 ? 'p < 0.001' : `p = ${result.p_value.toFixed(3)}`}
                        </span>
                      </div>
                    </div>
                  </div>
                  {result.effect_size && (
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-3">Effect Size</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">{result.effect_size.name}:</span>
                          <span className="font-medium">{result.effect_size.value.toFixed(3)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Interpretation:</span>
                          <span className="font-medium text-green-600">
                            {Math.abs(result.effect_size.value) < 0.2 ? 'Small' : 
                             Math.abs(result.effect_size.value) < 0.5 ? 'Medium' : 'Large'} effect
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Assumptions Check */}
              {analysisResults.assumption_checks && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">Assumption Checks</h4>
                  <div className="space-y-2">
                    {Object.entries(analysisResults.assumption_checks.results).map(([assumption, result]) => {
                      const assumptionResult = result as any;
                      const passed = typeof assumptionResult === 'object' && 'passed' in assumptionResult 
                        ? assumptionResult.passed 
                        : Object.values(assumptionResult).every((r: any) => r.passed);
                      
                      return (
                        <div key={assumption} className="flex items-center space-x-3">
                          {passed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-600" />
                          )}
                          <span className="text-sm text-gray-700">
                            {assumption.replace('_', ' ')}: {passed ? 'Passed' : 'Failed'}
                          </span>
                        </div>
                      );
                    })}
                
                  </div>
                </div>
              )}
            </motion.div>

            {/* Generated Figure */}
            {figure && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Publication-Ready Figure</h3>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setShowLabelEditor(!showLabelEditor)}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <Edit3 className="h-4 w-4" />
                      <span>Edit Labels</span>
                    </button>
                    <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                      Download
                    </button>
                  </div>
                </div>

                {/* Label Editor */}
                {showLabelEditor && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-3">Customize Labels</h4>
                    <div className="grid md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">X-axis Label</label>
                        <input
                          type="text"
                          value={customLabels.x}
                          onChange={(e) => setCustomLabels(prev => ({ ...prev, x: e.target.value }))}
                          placeholder="e.g., Treatment Group"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Y-axis Label</label>
                        <input
                          type="text"
                          value={customLabels.y}
                          onChange={(e) => setCustomLabels(prev => ({ ...prev, y: e.target.value }))}
                          placeholder="e.g., Response Score"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                        <input
                          type="text"
                          value={customLabels.title}
                          onChange={(e) => setCustomLabels(prev => ({ ...prev, title: e.target.value }))}
                          placeholder="e.g., Treatment Efficacy"
                          className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="bg-gray-50 rounded-lg p-4">
                  <Plot
                    data={figure.data}
                    layout={figure.layout}
                    config={figure.config}
                    style={{ width: '100%', height: '500px' }}
                  />
                </div>
              </motion.div>
            )}

            {/* Methods Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Methods Text (Copy for Paper)</h3>
                <button 
                  onClick={() => copyToClipboard(generateMethodsText(result as StatisticalResult))}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {generateMethodsText(result as StatisticalResult)}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Options Panel */}
          <div className="space-y-6">
            {/* Figure Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Figure Options</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Journal Style
                  </label>
                  <select 
                    value={figureStyle}
                    onChange={(e) => setFigureStyle(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="nature">Nature</option>
                    <option value="science">Science</option>
                    <option value="nejm">NEJM</option>
                    <option value="jama">JAMA</option>
                    <option value="plos">PLOS ONE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <div className="space-y-2">
                    {['png', 'svg', 'pdf', 'eps'].map((format) => (
                      <label key={format} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="exportFormat"
                          value={format}
                          checked={exportFormat === format}
                          onChange={(e) => setExportFormat(e.target.value)}
                          className="text-blue-600"
                        />
                        <span className="text-sm text-gray-700">
                          {format.toUpperCase()} {format === 'png' && '(300 DPI)'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Export Options */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Share</h3>
              <div className="space-y-3">
                <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                  <Download className="h-4 w-4" />
                  <span>Download All</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <Share className="h-4 w-4" />
                  <span>Share Project</span>
                </button>
                <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                  <FileText className="h-4 w-4" />
                  <span>Generate Report</span>
                </button>
              </div>
            </motion.div>

            {/* Next Steps */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎉 Analysis Complete!</h3>
              <div className="space-y-3 text-sm text-gray-700">
                <p>Your analysis is ready for publication. Consider:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Adding this figure to your manuscript</li>
                  <li>• Running sensitivity analyses</li>
                  <li>• Exploring subgroup analyses</li>
                  <li>• Checking for additional covariates</li>
                </ul>
              </div>
            </motion.div>
          </div>
        </div>
      )}

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
          onClick={onNewAnalysis}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          New Analysis
        </button>
      </div>
    </div>
  );
};

export default ResultsView;