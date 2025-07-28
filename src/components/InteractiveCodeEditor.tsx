import React, { useState, useEffect } from 'react';
import { Code, Play, RotateCcw, Settings } from 'lucide-react';

interface InteractiveCodeEditorProps {
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
  isVisible: boolean;
}

interface CodeParameters {
  figure_width: number;
  figure_height: number;
  title_font_size: number;
  label_font_size: number;
  tick_font_size: number;
  line_width: number;
  marker_size: number;
  dpi: number;
  font_weight: 'normal' | 'bold';
  grid_alpha: number;
}

const defaultParameters: CodeParameters = {
  figure_width: 4.5,
  figure_height: 3.5,
  title_font_size: 18,
  label_font_size: 16,
  tick_font_size: 14,
  line_width: 1.5,
  marker_size: 8,
  dpi: 300,
  font_weight: 'bold',
  grid_alpha: 0.3
};

export const InteractiveCodeEditor: React.FC<InteractiveCodeEditorProps> = ({
  data,
  outcomeVariable,
  groupVariable,
  analysisType,
  timeVariable,
  eventVariable,
  customLabels,
  journalStyle = 'nature',
  onFigureGenerated,
  isVisible
}) => {
  const [parameters, setParameters] = useState<CodeParameters>(defaultParameters);
  const [figureData, setFigureData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    if (isVisible && data && data.length > 0) {
      generateFigure();
    }
  }, [isVisible, journalStyle]);

  const generateFigure = async () => {
    if (!data || data.length === 0) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/generate_code_edit_figure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data,
          outcome_variable: outcomeVariable,
          group_variable: groupVariable,
          analysis_type: analysisType,
          time_variable: timeVariable,
          event_variable: eventVariable,
          custom_labels: customLabels,
          journal_style: journalStyle,
          code_parameters: parameters
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setFigureData(result.figure);
      
      if (onFigureGenerated) {
        onFigureGenerated(result.figure, parameters);
      }

    } catch (err) {
      console.error('Error generating figure:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate figure');
    } finally {
      setIsLoading(false);
    }
  };

  const handleParameterChange = (key: keyof CodeParameters, value: number | string) => {
    setParameters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const resetParameters = () => {
    setParameters(defaultParameters);
  };

  const applyChanges = () => {
    generateFigure();
  };

  const updateMainFigure = () => {
    if (figureData && onFigureGenerated) {
      // First clear, then set to trigger re-render, passing code parameters
      onFigureGenerated(null);
      setTimeout(() => {
        onFigureGenerated(figureData, parameters);
      }, 100);
    }
  };

  const downloadFigure = async (format: 'png' | 'pdf' | 'svg' | 'eps' = 'png') => {
    if (!figureData && format === 'png') {
      alert('No figure to download. Please generate a figure first.');
      return;
    }

    try {
      let downloadData = figureData;
      
      // For non-PNG formats, regenerate with the backend
      if (format !== 'png') {
        const response = await fetch('http://localhost:8000/generate_code_edit_figure', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            data,
            outcome_variable: outcomeVariable,
            group_variable: groupVariable,
            analysis_type: analysisType,
            time_variable: timeVariable,
            event_variable: eventVariable,
            custom_labels: customLabels,
            journal_style: journalStyle,
            code_parameters: parameters,
            format: format
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Backend response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        downloadData = result.figure;
        
        // Validate base64 data for PDF
        if (format === 'pdf' && downloadData) {
          try {
            // Test if it's valid base64
            atob(downloadData);
          } catch (e) {
            console.error('Invalid base64 PDF data:', downloadData.substring(0, 100));
            throw new Error('PDF generation failed - invalid data format');
          }
        }
      }
      
      // Create download link
      const link = document.createElement('a');
      
      if (format === 'png') {
        link.href = `data:image/png;base64,${downloadData}`;
      } else if (format === 'pdf') {
        // Ensure proper PDF MIME type and validate data
        console.log('PDF download data length:', downloadData?.length);
        console.log('PDF data starts with:', downloadData?.substring(0, 50));
        link.href = `data:application/pdf;base64,${downloadData}`;
      } else if (format === 'svg') {
        link.href = `data:image/svg+xml;base64,${downloadData}`;
      } else if (format === 'eps') {
        link.href = `data:application/postscript;base64,${downloadData}`;
      }
      
      link.download = `code_edited_figure_${Date.now()}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Download error:', err);
      alert(`Download failed: ${err.message}. Please try again.`);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <Code className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Interactive Code Editor</h3>
          <span className="text-sm text-gray-500">Customize figure parameters in real-time</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center space-x-1"
          >
            <Settings className="h-4 w-4" />
            <span>{showAdvanced ? 'Basic' : 'Advanced'}</span>
          </button>
          <button
            onClick={resetParameters}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200 transition-colors flex items-center space-x-1"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Parameter Controls */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Figure Parameters</h4>
          
          {/* Basic Parameters */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Figure Width
              </label>
              <input
                type="number"
                min="2"
                max="12"
                step="0.1"
                value={parameters.figure_width}
                onChange={(e) => handleParameterChange('figure_width', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              />
              <span className="text-xs text-gray-500">inches</span>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Figure Height
              </label>
              <input
                type="number"
                min="2"
                max="10"
                step="0.1"
                value={parameters.figure_height}
                onChange={(e) => handleParameterChange('figure_height', parseFloat(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              />
              <span className="text-xs text-gray-500">inches</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title Font Size
              </label>
              <input
                type="number"
                min="8"
                max="32"
                value={parameters.title_font_size}
                onChange={(e) => handleParameterChange('title_font_size', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Label Font Size
              </label>
              <input
                type="number"
                min="6"
                max="24"
                value={parameters.label_font_size}
                onChange={(e) => handleParameterChange('label_font_size', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tick Font Size
              </label>
              <input
                type="number"
                min="6"
                max="20"
                value={parameters.tick_font_size}
                onChange={(e) => handleParameterChange('tick_font_size', parseInt(e.target.value))}
                className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
              />
            </div>
          </div>

          {/* Advanced Parameters */}
          {showAdvanced && (
            <div className="space-y-4 pt-4 border-t">
              <h5 className="font-medium text-gray-800">Advanced Styling</h5>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Line Width
                  </label>
                  <input
                    type="number"
                    min="0.5"
                    max="5"
                    step="0.1"
                    value={parameters.line_width}
                    onChange={(e) => handleParameterChange('line_width', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Marker Size
                  </label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={parameters.marker_size}
                    onChange={(e) => handleParameterChange('marker_size', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    DPI
                  </label>
                  <select
                    value={parameters.dpi}
                    onChange={(e) => handleParameterChange('dpi', parseInt(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value={150}>150 (Draft)</option>
                    <option value={300}>300 (Print)</option>
                    <option value={600}>600 (High-res)</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Weight
                  </label>
                  <select
                    value={parameters.font_weight}
                    onChange={(e) => handleParameterChange('font_weight', e.target.value)}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                  >
                    <option value="normal">Normal</option>
                    <option value="bold">Bold</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Grid Alpha
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="1"
                    step="0.1"
                    value={parameters.grid_alpha}
                    onChange={(e) => handleParameterChange('grid_alpha', parseFloat(e.target.value))}
                    className="w-full border border-gray-300 rounded px-3 py-1 text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-3 pt-4">
            <button
              onClick={applyChanges}
              disabled={isLoading}
              className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              <span>{isLoading ? 'Generating...' : 'Apply Changes'}</span>
            </button>
            
            {figureData && (
              <>
                <button
                  onClick={updateMainFigure}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <span>📊 Update Main Figure</span>
                </button>
                
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => downloadFigure('png')}
                    className="bg-green-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                  >
                    📥 PNG
                  </button>
                  <button
                    onClick={() => downloadFigure('pdf')}
                    className="bg-red-600 text-white py-2 px-3 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                  >
                    📄 PDF
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Figure Preview */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 border-b pb-2">Live Preview</h4>
          
          {isLoading && (
            <div className="flex items-center justify-center p-8 bg-gray-50 rounded-lg">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-3 text-gray-600">Generating figure...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {figureData && !isLoading && (
            <div className="bg-gray-50 rounded-lg p-4">
              <img
                src={`data:image/png;base64,${figureData}`}
                alt="Code-customized figure"
                className="w-full h-auto rounded border"
                style={{ maxHeight: '400px', objectFit: 'contain' }}
              />
              <div className="mt-2 text-xs text-gray-500 text-center">
                {parameters.figure_width}" × {parameters.figure_height}" • {parameters.dpi} DPI
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Code Preview */}
      <div className="mt-6 pt-6 border-t">
        <h4 className="font-medium text-gray-900 mb-3">Current Parameters (Python-style)</h4>
        <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
          <div className="space-y-1">
            <div># Figure dimensions</div>
            <div>figure_width = {parameters.figure_width}</div>
            <div>figure_height = {parameters.figure_height}</div>
            <div></div>
            <div># Font sizes</div>
            <div>title_font_size = {parameters.title_font_size}</div>
            <div>label_font_size = {parameters.label_font_size}</div>
            <div>tick_font_size = {parameters.tick_font_size}</div>
            <div></div>
            <div># Styling</div>
            <div>line_width = {parameters.line_width}</div>
            <div>marker_size = {parameters.marker_size}</div>
            <div>font_weight = '{parameters.font_weight}'</div>
            <div>dpi = {parameters.dpi}</div>
            <div>grid_alpha = {parameters.grid_alpha}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCodeEditor;