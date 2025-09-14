import React, { useState, useEffect } from 'react';
import { StatisticalResult } from '../utils/statisticalEngine';

interface PythonFigureDisplayProps {
  data: any[];
  outcomeVariable: string;
  groupVariable: string;
  analysisType: string;
  timeVariable?: string;
  eventVariable?: string;
  customLabels?: {
    x?: string;
    y?: string;
    title?: string;
  };
  journalStyle?: 'nature' | 'science' | 'cell' | 'nejm';
  onFigureGenerated?: (figureData: string, codeParams?: any) => void;
  externalFigureData?: string | null; // New prop for external figure updates
  externalCodeParameters?: any; // Code parameters from code editor
  templateInfo?: { // New prop for template-based generation
    template: any;
    plot_type: string;
    settings: any;
  };
}

interface FigureResponse {
  figure: string;
  format: string;
  journal_style: string;
  data_complexity: string;
  n_groups: number;
  message: string;
}

export const PythonFigureDisplay: React.FC<PythonFigureDisplayProps> = ({
  data,
  outcomeVariable,
  groupVariable,
  analysisType,
  timeVariable,
  eventVariable,
  customLabels,
  journalStyle = 'nature',
  onFigureGenerated,
  externalFigureData,
  externalCodeParameters,
  templateInfo
}) => {
  const [figureData, setFigureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [figureInfo, setFigureInfo] = useState<Partial<FigureResponse> | null>(null);

  useEffect(() => {
    generateFigure();
  }, [data, outcomeVariable, groupVariable, analysisType, timeVariable, eventVariable, customLabels, journalStyle, templateInfo]);

  // Effect to handle external figure updates
  useEffect(() => {
    if (externalFigureData) {
      setFigureData(externalFigureData);
      if (onFigureGenerated) {
        onFigureGenerated(externalFigureData);
      }
    }
  }, [externalFigureData]);

  const generateFigure = async () => {
    if (!data || data.length === 0) {
      setError('No data available for visualization');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Clean data to handle NaN values that can't be JSON serialized
      const cleanedData = data.map(row => {
        const cleanedRow: any = {};
        Object.keys(row).forEach(key => {
          const value = row[key];
          // Replace NaN, null, and undefined with empty string or 0 for numbers
          if (value === null || value === undefined || (typeof value === 'number' && isNaN(value))) {
            cleanedRow[key] = typeof value === 'number' ? 0 : '';
          } else {
            cleanedRow[key] = value;
          }
        });
        return cleanedRow;
      });

      let response: Response;

      // Handle template-based generation with specific endpoints
      if (templateInfo && analysisType === 'template_based') {
        const plotType = templateInfo.plot_type;
        const settings = templateInfo.settings || {};
        
        console.log(`🎨 Generating template-based ${plotType} plot`);
        
        // Choose appropriate endpoint based on plot type
        if (plotType === 'volcano') {
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/visualization/generate_volcano_plot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: cleanedData,
              log2fc_col: settings.log2fc_col || 'log2FoldChange',
              pvalue_col: settings.pvalue_col || 'pvalue',
              gene_col: settings.gene_col,
              fc_threshold: settings.fc_threshold || 1.0,
              pvalue_threshold: settings.pvalue_threshold || 0.05,
              title: customLabels?.title || settings.title,
              highlight_genes: settings.highlight_genes,
              format: 'png',
              journal_style: journalStyle
            })
          });
        } else if (plotType === 'heatmap') {
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/visualization/generate_heatmap`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: cleanedData,
              title: customLabels?.title || settings.title,
              custom_labels: customLabels,
              cmap: settings.cmap || 'RdBu_r',
              show_values: settings.show_values !== false,
              cluster_rows: settings.cluster_rows || false,
              cluster_cols: settings.cluster_cols || false,
              format: 'png',
              journal_style: journalStyle
            })
          });
        } else if (plotType === 'violin') {
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/visualization/generate_violin_plot`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: cleanedData,
              outcome_variable: outcomeVariable,
              group_variable: groupVariable,
              title: customLabels?.title || settings.title,
              custom_labels: customLabels,
              show_box: settings.show_box !== false,
              show_points: settings.show_points !== false,
              show_stats: settings.show_stats !== false,
              format: 'png',
              journal_style: journalStyle
            })
          });
        } else if (plotType === 'roc_curve') {
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/visualization/generate_roc_curve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              y_true: cleanedData.map(row => row[outcomeVariable]),
              y_scores: cleanedData.map(row => row[groupVariable]),
              title: customLabels?.title || settings.title,
              format: 'png',
              journal_style: journalStyle
            })
          });
        } else {
          // Fallback to display figure for unsupported template types
          console.warn(`Template plot type '${plotType}' not directly supported, using display figure`);
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/generate_display_figure`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              data: cleanedData,
              outcome_variable: outcomeVariable,
              group_variable: groupVariable,
              analysis_type: 'independent_ttest', // Safe fallback
              time_variable: timeVariable,
              event_variable: eventVariable,
              custom_labels: customLabels,
              journal_style: journalStyle
            })
          });
        }
      } else {
        // Standard analysis-based generation
        response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/generate_display_figure`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            data: cleanedData,
            outcome_variable: outcomeVariable,
            group_variable: groupVariable,
            analysis_type: analysisType,
            time_variable: timeVariable,
            event_variable: eventVariable,
            custom_labels: customLabels,
            journal_style: journalStyle
          })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
      }

      const result: FigureResponse = await response.json();
      setFigureData(result.figure);
      setFigureInfo(result);
      
      // Notify parent component about the generated figure
      if (onFigureGenerated) {
        onFigureGenerated(result.figure);
      }

    } catch (err) {
      console.error('Error generating figure:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate figure');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadFigure = async (format: 'png' | 'pdf' | 'svg' | 'eps' = 'png') => {
    try {
      let downloadData = figureData;
      
      // For PNG format, use current figure data if available (including code-edited versions)
      // For other formats, regenerate with the backend to ensure proper format
      if (format !== 'png' || !figureData) {
        // If we have code parameters from the code editor, use the code edit endpoint
        const endpoint = externalCodeParameters ? 
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/generate_code_edit_figure` : 
          `${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/generate_publication_figure`;
        
        const requestBody = externalCodeParameters ? {
          data,
          outcome_variable: outcomeVariable,
          group_variable: groupVariable,
          analysis_type: analysisType,
          time_variable: timeVariable,
          event_variable: eventVariable,
          custom_labels: customLabels,
          journal_style: journalStyle,
          code_parameters: externalCodeParameters,
          format
        } : {
          data,
          outcome_variable: outcomeVariable,
          group_variable: groupVariable,
          analysis_type: analysisType,
          time_variable: timeVariable,
          event_variable: eventVariable,
          format,
          custom_labels: customLabels,
          publication_settings: {
            journal_style: journalStyle,
            dpi: 300
          }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
          throw new Error('Download failed');
        }

        const result = await response.json();
        downloadData = result.figure;
      }
      
      // Create download link
      const link = document.createElement('a');
      if (format === 'png') {
        link.href = `data:image/png;base64,${downloadData}`;
      } else if (format === 'pdf') {
        link.href = `data:application/pdf;base64,${downloadData}`;
      } else if (format === 'svg') {
        link.href = `data:image/svg+xml;base64,${downloadData}`;
      } else if (format === 'eps') {
        link.href = `data:application/postscript;base64,${downloadData}`;
      }
      
      link.download = `figure_${journalStyle}_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Download error:', err);
      alert('Download failed. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-3 text-gray-600">Generating publication-ready figure...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Figure Generation Error</h3>
            <p className="mt-1 text-sm text-red-700">{error}</p>
            <button
              onClick={generateFigure}
              className="mt-2 text-sm text-red-800 underline hover:text-red-600"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!figureData) {
    return (
      <div className="text-center p-8 text-gray-500">
        No figure data available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Figure Display */}
      <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
        <img
          src={`data:image/png;base64,${figureData}`}
          alt="Publication-ready scientific figure"
          className="w-full h-auto max-w-full"
          style={{ maxHeight: '600px', objectFit: 'contain' }}
        />
      </div>

      {/* Figure Information */}
      {figureInfo && (
        <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="font-medium">Journal Style:</span> {figureInfo.journal_style}
            </div>
            <div>
              <span className="font-medium">Data Complexity:</span> {figureInfo.data_complexity}
            </div>
            <div>
              <span className="font-medium">Groups:</span> {figureInfo.n_groups}
            </div>
            <div>
              <span className="font-medium">Format:</span> {figureInfo.format?.toUpperCase()}
            </div>
          </div>
          {figureInfo.message && (
            <div className="mt-2 text-xs text-gray-500">
              {figureInfo.message}
            </div>
          )}
        </div>
      )}

      {/* Download Controls */}
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => downloadFigure('png')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
        >
          Download PNG
        </button>
        <button
          onClick={() => downloadFigure('pdf')}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors text-sm font-medium"
        >
          Download PDF
        </button>
        <button
          onClick={() => downloadFigure('svg')}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm font-medium"
        >
          Download SVG
        </button>
        <button
          onClick={() => downloadFigure('eps')}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors text-sm font-medium"
        >
          Download EPS
        </button>
      </div>

      {/* Journal Style Selector */}
      <div className="flex items-center justify-center space-x-4 text-sm">
        <span className="text-gray-600">Journal Style:</span>
        <select
          value={journalStyle}
          onChange={(e) => {
            // This would trigger a re-render with new style
            // Parent component should handle this prop change
          }}
          className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="nature">Nature</option>
          <option value="science">Science</option>
          <option value="cell">Cell</option>
          <option value="nejm">NEJM</option>
        </select>
        <button
          onClick={generateFigure}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm"
        >
          Regenerate
        </button>
      </div>
    </div>
  );
};

export default PythonFigureDisplay;