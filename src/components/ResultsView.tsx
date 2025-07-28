import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
  Edit3,
  Code
} from 'lucide-react';
import { EngineOrchestrator, AnalysisWorkflow, StatisticalResult } from '../utils/statisticalEngine';
import { BackendDownloader } from '../utils/backendDownloader';
import PythonFigureDisplay from './PythonFigureDisplay';
import InteractiveCodeEditor from './InteractiveCodeEditor';
import VisualizationEditor from './VisualizationEditor';

interface ResultsViewProps {
  analysisConfig: any;
  onBack: () => void;
  onNewAnalysis: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ analysisConfig, onBack, onNewAnalysis }) => {
  const [figureStyle, setFigureStyle] = useState<'nature' | 'science' | 'cell' | 'nejm'>('nature');
  const [exportFormat, setExportFormat] = useState('png');
  const [analysisResults, setAnalysisResults] = useState<AnalysisWorkflow | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [currentFigureData, setCurrentFigureData] = useState<string | null>(null);
  const [currentCodeParameters, setCurrentCodeParameters] = useState<any>(null);
  
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
      
      // No need to generate initial figure here - PythonFigureDisplay will handle it
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateMethodsText = (result: StatisticalResult): string => {
    if ('error' in result) return '';

    const testName = result.test_name;
    let methodsText = '';
    
    // Data description
    if (result.groups) {
      const totalN = Object.values(result.groups).reduce((sum, stats) => sum + stats.n, 0);
      methodsText += `Data from ${totalN} participants were analyzed. `;
    }
    
    // Test selection rationale and assumptions
    if (testName.includes('T-Test')) {
      methodsText += `An independent samples t-test was conducted to compare ${analysisConfig.outcomeVariable} between ${analysisConfig.groupVariable} groups. `;
      methodsText += `Assumptions of normality and homogeneity of variance were assessed prior to analysis. `;
    } else if (testName.includes('Mann-Whitney')) {
      methodsText += `A Mann-Whitney U test was performed to compare ${analysisConfig.outcomeVariable} between ${analysisConfig.groupVariable} groups. `;
      methodsText += `This non-parametric test was selected due to violations of normality assumptions. `;
    } else if (testName.includes('ANOVA')) {
      methodsText += `A one-way analysis of variance (ANOVA) was conducted to compare ${analysisConfig.outcomeVariable} across ${analysisConfig.groupVariable} groups. `;
      methodsText += `Assumptions of normality, homogeneity of variance, and independence were evaluated. `;
    } else if (testName.includes('Kruskal')) {
      methodsText += `A Kruskal-Wallis test was performed to compare ${analysisConfig.outcomeVariable} across ${analysisConfig.groupVariable} groups. `;
      methodsText += `This non-parametric alternative to ANOVA was selected due to assumption violations. `;
    } else if (testName.includes('Chi-Square')) {
      methodsText += `A chi-square test of independence was conducted to examine the association between ${analysisConfig.outcomeVariable} and ${analysisConfig.groupVariable}. `;
      methodsText += `Expected cell frequencies were verified to meet the assumption of ≥5 per cell. `;
    } else if (testName.includes('Fisher')) {
      methodsText += `Fisher's exact test was performed to examine the association between ${analysisConfig.outcomeVariable} and ${analysisConfig.groupVariable}. `;
      methodsText += `This exact test was selected for precise p-value calculation with small sample sizes. `;
    } else if (testName.includes('Survival') || testName.includes('Kaplan-Meier')) {
      methodsText += `Kaplan-Meier survival analysis was conducted to evaluate time-to-event data. `;
      methodsText += `Survival curves were generated and compared using the log-rank test. `;
    }
    
    // Descriptive statistics
    if (result.groups) {
      const groupNames = Object.keys(result.groups);
      const groupStats = Object.values(result.groups);
      
      methodsText += 'Descriptive statistics by group: ';
      methodsText += groupNames.map((name, i) => {
        const stats = groupStats[i];
        return `${name} (n=${stats.n}, M=${stats.mean.toFixed(2)}, SD=${stats.std_dev.toFixed(2)})`;
      }).join('; ') + '. ';
    }
    
    // Survival-specific details
    if (result.survival_data?.group_stats) {
      const groupStats = Object.entries(result.survival_data.group_stats);
      methodsText += 'Survival characteristics: ';
      methodsText += groupStats.map(([group, stats]) => 
        `${group} group had ${stats.events} events out of ${stats.n} participants (event rate: ${((stats.events/stats.n)*100).toFixed(1)}%), with median survival of ${stats.median_survival.toFixed(1)} time units`
      ).join('; ') + '. ';
    }
    
    // Statistical results
    if (testName.includes('T-Test') && result.statistic.t_statistic) {
      methodsText += `The analysis yielded t(${result.statistic.degrees_of_freedom}) = ${result.statistic.t_statistic.toFixed(3)}, p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
    } else if (testName.includes('ANOVA') && result.statistic.F_statistic) {
      methodsText += `The ANOVA revealed F(${result.statistic.df_num}, ${result.statistic.df_den}) = ${result.statistic.F_statistic.toFixed(3)}, p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
    } else if (testName.includes('Chi-Square') && result.statistic.chi_square) {
      methodsText += `The chi-square analysis yielded χ²(${result.statistic.degrees_of_freedom}) = ${result.statistic.chi_square.toFixed(3)}, p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
    } else {
      methodsText += `Statistical analysis yielded p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
    }
    
    // Effect size interpretation
    if (result.effect_size) {
      const effectSize = Math.abs(result.effect_size.value);
      let magnitude = '';
      
      if (result.effect_size.name.includes('Cohen')) {
        magnitude = effectSize < 0.2 ? 'small' : effectSize < 0.5 ? 'medium' : 'large';
      } else if (result.effect_size.name.includes('Eta')) {
        magnitude = effectSize < 0.01 ? 'small' : effectSize < 0.06 ? 'medium' : 'large';
      } else if (result.effect_size.name.includes('Cramér')) {
        magnitude = effectSize < 0.1 ? 'small' : effectSize < 0.3 ? 'medium' : 'large';
      } else {
        magnitude = 'unknown';
      }
      
      methodsText += `. Effect size was ${result.effect_size.name} = ${result.effect_size.value.toFixed(3)}, indicating a ${magnitude} effect`;
    }
    
    // Statistical significance interpretation
    if (result.p_value < 0.05) {
      methodsText += '. The result was statistically significant';
      if (result.p_value < 0.001) {
        methodsText += ' at the p < 0.001 level';
      } else if (result.p_value < 0.01) {
        methodsText += ' at the p < 0.01 level';
      } else {
        methodsText += ' at the p < 0.05 level';
      }
    } else {
      methodsText += '. No statistically significant difference was detected';
    }
    
    methodsText += '. All analyses were performed using appropriate statistical software with significance set at α = 0.05.';
    
    return methodsText;
  };

  const generateFigureLegend = (result: StatisticalResult): string => {
    if ('error' in result) return '';

    const testName = result.test_name;
    let legendText = '';
    
    if (testName.includes('T-Test') || testName.includes('Mann-Whitney')) {
      // Enhanced legend for t-tests and non-parametric equivalents
      const testType = testName.includes('Mann-Whitney') ? 'Mann-Whitney U test' : 'independent samples t-test';
      const dataDescription = testName.includes('Mann-Whitney') ? 
        'median with interquartile range' : 'mean ± standard deviation';
      
      legendText = `Box plots showing the distribution of ${analysisConfig.outcomeVariable} by ${analysisConfig.groupVariable}. `;
      legendText += `Data are presented as ${dataDescription}. `;
      
      if (result.groups) {
        const groupNames = Object.keys(result.groups);
        const groupStats = Object.values(result.groups);
        legendText += 'Group statistics: ';
        legendText += groupNames.map((name, i) => {
          const stats = groupStats[i];
          return `${name} (n=${stats.n}, M=${stats.mean.toFixed(2)}, SD=${stats.std_dev.toFixed(2)})`;
        }).join('; ') + '. ';
      }
      
      // Statistical results
      legendText += `Statistical analysis: ${testType}. `;
      
      if (testName.includes('T-Test') && result.statistic.t_statistic) {
        legendText += `t(${result.statistic.degrees_of_freedom}) = ${result.statistic.t_statistic.toFixed(2)}, `;
      } else if (testName.includes('Mann-Whitney') && result.statistic.U_statistic) {
        legendText += `U = ${result.statistic.U_statistic.toFixed(0)}, `;
      }
      
      legendText += `p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
      
      if (result.effect_size) {
        const effectSize = Math.abs(result.effect_size.value);
        const magnitude = effectSize < 0.2 ? 'small' : effectSize < 0.5 ? 'medium' : 'large';
        legendText += `, ${result.effect_size.name} = ${result.effect_size.value.toFixed(3)} (${magnitude} effect)`;
      }
      
      if (result.p_value < 0.05) {
        const significance = result.p_value < 0.001 ? '***' : result.p_value < 0.01 ? '**' : '*';
        legendText += ` ${significance}`;
      }
      
      legendText += '.';
      
    } else if (testName.includes('ANOVA') || testName.includes('Kruskal')) {
      // Enhanced legend for ANOVA and Kruskal-Wallis
      const testType = testName.includes('Kruskal') ? 'Kruskal-Wallis test' : 'one-way ANOVA';
      
      legendText = `Bar graph showing mean ± SEM of ${analysisConfig.outcomeVariable} by ${analysisConfig.groupVariable}. `;
      legendText += `Error bars represent standard error of the mean. `;
      
      if (result.groups) {
        const groupNames = Object.keys(result.groups);
        const groupCount = groupNames.length;
        const totalN = Object.values(result.groups).reduce((sum, stats) => sum + stats.n, 0);
        legendText += `Groups compared: ${groupNames.join(', ')} (total n=${totalN}). `;
      }
      
      legendText += `Statistical analysis: ${testType}. `;
      
      if (testName.includes('ANOVA') && result.statistic.F_statistic) {
        legendText += `F(${result.statistic.df_num}, ${result.statistic.df_den}) = ${result.statistic.F_statistic.toFixed(2)}, `;
      }
      
      legendText += `p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
      
      if (result.effect_size) {
        const effectSize = result.effect_size.value;
        const magnitude = effectSize < 0.01 ? 'small' : effectSize < 0.06 ? 'medium' : 'large';
        legendText += `, ${result.effect_size.name} = ${effectSize.toFixed(3)} (${magnitude} effect)`;
      }
      
      if (result.p_value < 0.05) {
        legendText += '. Post-hoc comparisons may be warranted';
      }
      
      legendText += '.';
      
    } else if (testName.includes('Chi-Square') || testName.includes('Fisher')) {
      // Enhanced legend for categorical analyses
      const testType = testName.includes('Fisher') ? "Fisher's exact test" : 'chi-square test of independence';
      
      legendText = `Contingency table heatmap showing the association between ${analysisConfig.outcomeVariable} and ${analysisConfig.groupVariable}. `;
      legendText += `Cell values represent observed frequencies. `;
      
      if (result.contingency_table) {
        const totalN = result.contingency_table.flat().reduce((sum, val) => sum + val, 0);
        legendText += `Total sample size: n=${totalN}. `;
      }
      
      legendText += `Statistical analysis: ${testType}. `;
      
      if (testName.includes('Chi-Square') && result.statistic.chi_square) {
        legendText += `χ²(${result.statistic.degrees_of_freedom}) = ${result.statistic.chi_square.toFixed(2)}, `;
      } else if (testName.includes('Fisher') && result.statistic.odds_ratio) {
        legendText += `Odds ratio = ${result.statistic.odds_ratio.toFixed(2)}, `;
      }
      
      legendText += `p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
      
      if (result.effect_size) {
        const effectSize = result.effect_size.value;
        const magnitude = effectSize < 0.1 ? 'small' : effectSize < 0.3 ? 'medium' : 'large';
        legendText += `, ${result.effect_size.name} = ${effectSize.toFixed(3)} (${magnitude} association)`;
      }
      
      legendText += '.';
      
    } else if (testName.includes('Survival') || testName.includes('Kaplan-Meier')) {
      // Enhanced legend for survival analysis
      legendText = `Kaplan-Meier survival curves showing the probability of event-free survival over time. `;
      legendText += `Step functions represent the survival probability at each time point. `;
      
      if (result.survival_data?.group_stats) {
        const groupStats = Object.entries(result.survival_data.group_stats);
        const totalN = groupStats.reduce((sum, [, stats]) => sum + stats.n, 0);
        const totalEvents = groupStats.reduce((sum, [, stats]) => sum + stats.events, 0);
        
        legendText += `Total sample: n=${totalN}, events=${totalEvents}. `;
        legendText += 'Group-specific statistics: ';
        legendText += groupStats.map(([group, stats]) => {
          const eventRate = ((stats.events / stats.n) * 100).toFixed(1);
          return `${group} (n=${stats.n}, events=${stats.events} [${eventRate}%], median survival=${stats.median_survival.toFixed(1)} time units)`;
        }).join('; ') + '. ';
      }
      
      legendText += `Statistical comparison: log-rank test, `;
      legendText += `p = ${result.p_value < 0.001 ? '<0.001' : result.p_value.toFixed(3)}`;
      
      if (result.p_value < 0.05) {
        legendText += '. Significant difference in survival between groups';
      } else {
        legendText += '. No significant difference in survival between groups';
      }
      
      legendText += '.';
    }
    
    return legendText;
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  // Download functionality is now handled by PythonFigureDisplay component

  // Figure generation is now handled by PythonFigureDisplay component

  const handleFigureGenerated = (figureData: string, codeParams?: any) => {
    setCurrentFigureData(figureData);
    if (codeParams) {
      setCurrentCodeParameters(codeParams);
    }
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

                {/* Survival-specific statistics */}
                {result.survival_data?.group_stats && (
                  <div className="mt-6 pt-6 border-t border-blue-200">
                    <h4 className="font-semibold text-gray-900 mb-3">Survival Statistics</h4>
                    <div className="grid md:grid-cols-2 gap-4">
                      {Object.entries(result.survival_data.group_stats).map(([group, stats]) => (
                        <div key={group} className="bg-white rounded p-3">
                          <h5 className="font-medium text-gray-900 mb-2">{group}</h5>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Sample size:</span>
                              <span className="font-medium">{stats.n}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Events:</span>
                              <span className="font-medium">{stats.events}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Median survival:</span>
                              <span className="font-medium">{stats.median_survival.toFixed(1)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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

            {/* Python-Generated Figure */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">Publication-Ready Figure</h3>
                  <p className="text-sm text-blue-600 mt-1">🐍 Powered by Python scientific visualization engine</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setShowLabelEditor(!showLabelEditor)}
                    className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                  >
                    <Edit3 className="h-4 w-4" />
                    <span>Edit Labels</span>
                  </button>
                  <button 
                    onClick={() => setShowCodeEditor(!showCodeEditor)}
                    className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Code className="h-4 w-4" />
                    <span>Code Editor</span>
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
              
              <PythonFigureDisplay
                data={analysisConfig.data}
                outcomeVariable={analysisConfig.outcomeVariable}
                groupVariable={analysisConfig.groupVariable}
                analysisType={analysisConfig.type}
                timeVariable={analysisConfig.timeVariable}
                eventVariable={analysisConfig.eventVariable}
                customLabels={customLabels}
                journalStyle={figureStyle}
                onFigureGenerated={handleFigureGenerated}
                externalFigureData={currentFigureData}
                externalCodeParameters={currentCodeParameters}
              />
            </motion.div>

            {/* Interactive Code Editor */}
            {showCodeEditor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <InteractiveCodeEditor
                  data={analysisConfig.data}
                  outcomeVariable={analysisConfig.outcomeVariable}
                  groupVariable={analysisConfig.groupVariable}
                  analysisType={analysisConfig.type}
                  timeVariable={analysisConfig.timeVariable}
                  eventVariable={analysisConfig.eventVariable}
                  customLabels={customLabels}
                  journalStyle={figureStyle}
                  onFigureGenerated={handleFigureGenerated}
                  isVisible={showCodeEditor}
                />
              </motion.div>
            )}

            {/* Note: Advanced editor temporarily disabled during Python migration */}
            {showEditor && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-yellow-50 border border-yellow-200 rounded-xl p-6"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Advanced Editor</h3>
                <p className="text-sm text-gray-600">The advanced visualization editor is being updated to work with the new Python visualization engine. Use the journal style selector and custom labels for now.</p>
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

            {/* Figure Legend */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-900">Figure Legend (Copy for Paper)</h3>
                <button 
                  onClick={() => copyToClipboard(generateFigureLegend(result as StatisticalResult))}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Copy className="h-4 w-4" />
                  <span>Copy</span>
                </button>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {generateFigureLegend(result as StatisticalResult)}
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
                    onChange={(e) => setFigureStyle(e.target.value as 'nature' | 'science' | 'cell' | 'nejm')}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="nature">Nature</option>
                    <option value="science">Science</option>
                    <option value="cell">Cell</option>
                    <option value="nejm">NEJM</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Export Format
                  </label>
                  <div className="space-y-2">
                    {[
                      { value: 'png', label: 'PNG (300 DPI)', description: 'Best for manuscripts' },
                      { value: 'pdf', label: 'PDF (Vector)', description: 'Best for printing' },
                      { value: 'svg', label: 'SVG (Vector)', description: 'Best for editing' },
                      { value: 'eps', label: 'EPS (Vector)', description: 'Best for journals' }
                    ].map((format) => (
                      <label key={format.value} className="flex items-center space-x-2">
                        <input
                          type="radio"
                          name="exportFormat"
                          value={format.value}
                          checked={exportFormat === format.value}
                          onChange={(e) => setExportFormat(e.target.value)}
                          className="text-blue-600"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-gray-700">
                            {format.label}
                          </span>
                          <span className="text-xs text-gray-500">
                            {format.description}
                          </span>
                        </div>
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
                <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
                  📥 Download options are now integrated into the figure display above.
                </div>
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
                  <li>• 🎨 Publication-quality figures with Python backend</li>
                  <li>• 📊 Multiple journal-specific styling options</li>
                  <li>• 💾 Vector and raster format downloads</li>
                  <li>• 📝 Auto-generated methods and figure legends</li>
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