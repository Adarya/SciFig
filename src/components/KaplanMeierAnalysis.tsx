import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Activity,
  Users,
  Clock,
  TrendingDown,
  AlertCircle,
  Loader,
  FileText,
  BarChart3
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface KaplanMeierAnalysisProps {
  analysisConfig?: any;
  onBack: () => void;
  onNewAnalysis: () => void;
}

interface SurvivalAnalysisResult {
  test_name: string;
  statistic: number;
  p_value: number;
  effect_size?: {
    name: string;
    value: number;
  };
  summary: string;
  interpretation: string;
  assumptions_met: boolean;
  sample_sizes: Record<string, number>;
  descriptive_stats: Record<string, any>;
}

const KaplanMeierAnalysis: React.FC<KaplanMeierAnalysisProps> = ({ 
  analysisConfig: propAnalysisConfig, 
  onBack, 
  onNewAnalysis 
}) => {
  const [analysisResults, setAnalysisResults] = useState<SurvivalAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [survivalData, setSurvivalData] = useState<any>(null);
  const [analysisConfig, setAnalysisConfig] = useState<any>(null);
  const hasInitialized = useRef(false);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    // Prevent double-initialization from React StrictMode
    if (hasInitialized.current) {
      return;
    }
    
    // Function to load and process the configuration
    const loadConfiguration = () => {
      // Load analysis config from props or sessionStorage
      let config = propAnalysisConfig;
      if (!config) {
        const storedConfig = sessionStorage.getItem('kaplanMeierConfig');
        if (storedConfig) {
          try {
            config = JSON.parse(storedConfig);
          } catch (e) {
            console.error('Error parsing stored config:', e);
            return null;
          }
        } else {
          return null;
        }
      }
      
      // Get data from global window variable if not already in config
      if (config && !config.data) {
        const data = (window as any).kaplanMeierData;
        if (data && Array.isArray(data)) {
          config.data = data;
        }
      }
      
      return config;
    };
    
    const config = loadConfiguration();
    
    if (config && config.data && Array.isArray(config.data) && config.data.length > 0) {
      // Mark as initialized to prevent duplicate runs
      hasInitialized.current = true;
      
      // Clear any previous error state
      setError(null);
      setIsAnalyzing(true);
      setAnalysisConfig(config);
      
      // Clean up the window variable now that we have the data
      if ((window as any).kaplanMeierData) {
        delete (window as any).kaplanMeierData;
      }
      
      runAnalysis(config);
    } else {
      setError('No analysis configuration or data found. Please go back and select your analysis.');
      setIsAnalyzing(false);
    }
  }, [propAnalysisConfig]);

  const runAnalysis = async (config?: any) => {
    const configToUse = config || analysisConfig;
    if (!configToUse) {
      setError('No analysis configuration available');
      setIsAnalyzing(false);
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const requestBody = {
        data: configToUse.data,
        outcome_variable: configToUse.outcomeVariable || configToUse.timeVariable, // Use time as outcome for survival
        group_variable: configToUse.groupVariable,
        analysis_type: 'survival_analysis',
        time_variable: configToUse.timeVariable,
        event_variable: configToUse.eventVariable,
      };
      
      console.log('Sending request to /analyze:', {
        ...requestBody,
        data: `[${requestBody.data.length} rows]` // Don't log full data
      });

      // Call the working statistical analysis endpoint
      const response = await fetch('http://localhost:8000/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Backend error response:', errorText);
        throw new Error(`Analysis failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Analysis result:', result);
      setAnalysisResults(result);
      
      // Process data for visualization
      processSurvivalData(configToUse);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
      console.error('Analysis error:', err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const processSurvivalData = (config?: any) => {
    const configToUse = config || analysisConfig;
    if (!configToUse) return;
    
    // Process the uploaded data to create survival curves
    const { data, timeVariable, eventVariable, groupVariable } = configToUse;
    
    const groups = [...new Set(data.map((row: any) => row[groupVariable]))];
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B'];
    
    const datasets = groups.map((group, index) => {
      const groupData = data.filter((row: any) => row[groupVariable] === group);
      
      // Sort by time
      groupData.sort((a: any, b: any) => parseFloat(a[timeVariable]) - parseFloat(b[timeVariable]));
      
      // Calculate Kaplan-Meier survival probabilities
      const survivalPoints = calculateKaplanMeier(groupData, timeVariable, eventVariable);
      
      return {
        label: `${group} (n=${groupData.length})`,
        data: survivalPoints,
        borderColor: colors[index % colors.length],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0, // Make lines straight (no curves)
        pointRadius: 0,
        pointHoverRadius: 4,
        borderWidth: 3,
        stepped: false, // We're creating our own step function
      };
    });

    setSurvivalData({
      datasets,
      groups,
      rawData: data
    });
  };

  const calculateKaplanMeier = (data: any[], timeVar: string, eventVar: string) => {
    // Filter and sort data by time
    const cleanData = data
      .filter(row => row[timeVar] != null && row[eventVar] != null)
      .map(row => ({
        time: parseFloat(row[timeVar]),
        event: parseInt(row[eventVar]) === 1 ? 1 : 0
      }))
      .sort((a, b) => a.time - b.time);

    if (cleanData.length === 0) return [{ x: 0, y: 1 }];

    const points = [{ x: 0, y: 1 }]; // Start at 100% survival
    let survivalProb = 1.0;
    let atRisk = cleanData.length;

    // Get unique event times where actual events occurred
    const eventTimes = [...new Set(
      cleanData
        .filter(d => d.event === 1)
        .map(d => d.time)
    )].sort((a, b) => a - b);

    eventTimes.forEach(eventTime => {
      // Count events at this time
      const eventsAtTime = cleanData.filter(d => d.time === eventTime && d.event === 1).length;
      
      if (eventsAtTime > 0 && atRisk > 0) {
        // Add point just before the drop (horizontal line)
        points.push({ x: eventTime, y: survivalProb });
        
        // Calculate new survival probability
        survivalProb *= (atRisk - eventsAtTime) / atRisk;
        
        // Add point after the drop (vertical line)
        points.push({ x: eventTime, y: survivalProb });
      }

      // Update at-risk count: remove all subjects with time <= current time
      atRisk = cleanData.filter(d => d.time > eventTime).length;
    });

    // Add final point extending to the maximum time
    const maxTime = Math.max(...cleanData.map(d => d.time));
    if (points[points.length - 1].x < maxTime) {
      points.push({ x: maxTime, y: survivalProb });
    }

    console.log(`Kaplan-Meier points for group:`, points.slice(0, 10)); // Log first 10 points
    return points;
  };

  const formatPValue = (pValue: number): string => {
    if (pValue < 0.001) return 'p < 0.001';
    if (pValue < 0.01) return `p = ${pValue.toFixed(3)}`;
    return `p = ${pValue.toFixed(2)}`;
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Kaplan-Meier Survival Curves',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(1)}%`;
          }
        }
      },
    },
    scales: {
      x: {
        type: 'linear' as const,
        display: true,
        title: {
          display: true,
          text: analysisConfig?.timeVariable || 'Time',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        min: 0,
      },
      y: {
        type: 'linear' as const,
        display: true,
        title: {
          display: true,
          text: 'Survival Probability',
          font: {
            size: 14,
            weight: 'bold',
          },
        },
        min: 0,
        max: 1,
        ticks: {
          callback: function(value: any) {
            return (value * 100).toFixed(0) + '%';
          }
        }
      },
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false,
    },
    elements: {
      line: {
        tension: 0 // Ensure straight lines
      },
      point: {
        radius: 0 // Hide points by default
      }
    },
  };

  const downloadChart = () => {
    if (chartRef.current) {
      const canvas = chartRef.current.canvas;
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = 'kaplan_meier_survival_curve.png';
      link.href = url;
      link.click();
    }
  };

  const generateRiskTable = () => {
    if (!survivalData || !analysisConfig) return null;

    const { groups, rawData } = survivalData;
    const timeVar = analysisConfig.timeVariable;
    
    // Create time points for risk table (every 25% of max time)
    const maxTime = Math.max(...rawData.map((row: any) => parseFloat(row[timeVar])));
    const timePoints = [0, maxTime * 0.25, maxTime * 0.5, maxTime * 0.75, maxTime].map(t => Math.round(t));

    return (
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Number at Risk</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border-b text-left text-sm font-medium text-gray-700">Group</th>
                {timePoints.map(time => (
                  <th key={time} className="px-4 py-2 border-b text-center text-sm font-medium text-gray-700">
                    {time}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group: string) => {
                const groupData = rawData.filter((row: any) => row[analysisConfig.groupVariable] === group);
                return (
                  <tr key={group}>
                    <td className="px-4 py-2 border-b text-sm font-medium text-gray-900">{group}</td>
                    {timePoints.map(time => {
                      const atRisk = groupData.filter((row: any) => parseFloat(row[timeVar]) >= time).length;
                      return (
                        <td key={time} className="px-4 py-2 border-b text-center text-sm text-gray-700">
                          {atRisk}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Loader className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Running Kaplan-Meier survival analysis...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3" />
              <div>
                <h3 className="text-lg font-medium text-red-800">Analysis Error</h3>
                <p className="text-red-700 mt-1">{error}</p>
                <button
                  onClick={runAnalysis}
                  className="mt-3 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span>Back</span>
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Kaplan-Meier Survival Analysis</h1>
              <p className="text-gray-600">
                {analysisConfig ? `${analysisConfig.groupVariable} vs ${analysisConfig.timeVariable} (Events: ${analysisConfig.eventVariable})` : 'Loading configuration...'}
              </p>
            </div>
          </div>
          <button
            onClick={onNewAnalysis}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            New Analysis
          </button>
        </div>

        {/* Statistical Results */}
        {analysisResults && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Statistical Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-blue-50 rounded-lg p-4">
                  <BarChart3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Log-rank Test</p>
                  <p className="text-2xl font-bold text-gray-900">{analysisResults.statistic.toFixed(3)}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-green-50 rounded-lg p-4">
                  <TrendingDown className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">P-value</p>
                  <p className="text-2xl font-bold text-gray-900">{formatPValue(analysisResults.p_value)}</p>
                </div>
              </div>
              <div className="text-center">
                <div className="bg-purple-50 rounded-lg p-4">
                  <Activity className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Interpretation</p>
                  <p className="text-lg font-semibold text-gray-900">{analysisResults.interpretation}</p>
                </div>
              </div>
            </div>
            
            {/* Group Statistics */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Group Statistics</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(analysisResults.descriptive_stats).map(([group, stats]: [string, any]) => (
                  <div key={group} className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">{group}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Sample size:</span>
                        <span className="font-medium">{stats.sample_size}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Events:</span>
                        <span className="font-medium">{stats.events}</span>
                      </div>
                      {stats.median_survival && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Median survival:</span>
                          <span className="font-medium">{stats.median_survival.toFixed(1)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Survival Curve */}
        {survivalData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Survival Curves</h2>
              <button
                onClick={downloadChart}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Download PNG</span>
              </button>
            </div>
            <div style={{ height: '400px' }}>
              <Line
                ref={chartRef}
                data={survivalData}
                options={chartOptions}
              />
            </div>
          </div>
        )}

        {/* Risk Table */}
        {survivalData && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            {generateRiskTable()}
          </div>
        )}
      </div>
    </div>
  );
};

export default KaplanMeierAnalysis;