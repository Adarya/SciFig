import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@monaco-editor/react';
import Plot from 'react-plotly.js';
import { 
  Code, 
  MessageSquare, 
  Play, 
  Download, 
  Save, 
  RotateCcw, 
  Check, 
  X, 
  Send,
  Copy,
  Eye,
  EyeOff,
  Lightbulb,
  AlertCircle,
  Loader
} from 'lucide-react';
import { StatisticalResult } from '../utils/statisticalEngine';
import { FigureGenerator } from '../utils/figureGenerator';

interface VisualizationEditorProps {
  analysisConfig: any;
  result: StatisticalResult;
  initialFigure: any;
  onFigureUpdate: (newFigure: any) => void;
}

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  codeChanges?: string;
  preview?: any;
}

interface CodeChange {
  id: string;
  description: string;
  code: string;
  timestamp: Date;
  applied: boolean;
}

const VisualizationEditor: React.FC<VisualizationEditorProps> = ({
  analysisConfig,
  result,
  initialFigure,
  onFigureUpdate
}) => {
  const [editorMode, setEditorMode] = useState<'code' | 'chat'>('code');
  const [currentCode, setCurrentCode] = useState('');
  const [originalCode, setOriginalCode] = useState('');
  const [previewFigure, setPreviewFigure] = useState(initialFigure);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);
  
  // Chat mode state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isProcessingChat, setIsProcessingChat] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<CodeChange[]>([]);
  
  // History
  const [changeHistory, setChangeHistory] = useState<CodeChange[]>([]);
  
  // Refs for proper cleanup and sizing
  const editorRef = useRef<any>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const plotContainerRef = useRef<HTMLDivElement>(null);
  const plotRef = useRef<any>(null);

  useEffect(() => {
    // Generate initial code based on the figure
    const code = generateFigureCode(analysisConfig, result);
    setCurrentCode(code);
    setOriginalCode(code);
    
    // Add welcome message for chat mode
    setChatMessages([{
      id: '1',
      type: 'system',
      content: 'Welcome to the Figure Editor! You can describe changes you\'d like to make to your figure in plain English. For example:\n\n• "Make the bars blue"\n• "Add a title saying \'Treatment Comparison\'"\n• "Increase font size to 14pt"\n• "Change the y-axis label to \'Response Rate\'"\n\nI\'ll convert your requests into code changes and show you a preview before applying them.',
      timestamp: new Date()
    }]);
  }, [analysisConfig, result]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Fix for figure distortion - ensure proper cleanup and re-rendering
  useEffect(() => {
    if (previewFigure && plotRef.current) {
      // Force a clean re-render of the plot
      const timeoutId = setTimeout(() => {
        if (plotRef.current && plotRef.current.resizeHandler) {
          plotRef.current.resizeHandler();
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [previewFigure, showPreview]);

  const generateFigureCode = (config: any, result: StatisticalResult): string => {
    const testType = result.test_name;
    
    if (testType.includes('T-Test') || testType.includes('Mann-Whitney')) {
      return generateBoxPlotCode(config, result);
    } else if (testType.includes('ANOVA') || testType.includes('Kruskal')) {
      return generateBarPlotCode(config, result);
    } else if (testType.includes('Chi-Square') || testType.includes('Fisher')) {
      return generateHeatmapCode(config, result);
    } else if (testType.includes('Survival') || testType.includes('Kaplan-Meier')) {
      return generateSurvivalCode(config, result);
    }
    
    return generateBoxPlotCode(config, result);
  };

  const generateBoxPlotCode = (config: any, result: StatisticalResult): string => {
    return `// Box Plot Configuration - Fixed Layout
const data = [
  {
    y: groupData1, // ${config.groupVariable} = Group1
    type: 'box',
    name: 'Group 1',
    marker: {
      color: '#1f77b4',
      size: 8,
      line: { color: '#000', width: 1 }
    },
    boxpoints: 'outliers',
    jitter: 0.3,
    pointpos: -1.8
  },
  {
    y: groupData2, // ${config.groupVariable} = Group2
    type: 'box',
    name: 'Group 2',
    marker: {
      color: '#ff7f0e',
      size: 8,
      line: { color: '#000', width: 1 }
    },
    boxpoints: 'outliers',
    jitter: 0.3,
    pointpos: -1.8
  }
];

const layout = {
  title: {
    text: '${config.outcomeVariable} by ${config.groupVariable}',
    font: { size: 18, family: 'Arial, sans-serif', color: '#000' },
    x: 0.5,
    pad: { t: 20 }
  },
  xaxis: {
    title: {
      text: '${config.groupVariable}',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: false,
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  yaxis: {
    title: {
      text: '${config.outcomeVariable}',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: true,
    gridcolor: '#E5E5E5',
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  showlegend: false,
  plot_bgcolor: 'white',
  paper_bgcolor: 'white',
  margin: { l: 80, r: 40, t: 80, b: 80 },
  width: 500,
  height: 400,
  autosize: false
};

// Configuration for stable rendering
const config = {
  displayModeBar: true,
  responsive: false,
  staticPlot: false,
  toImageButtonOptions: {
    format: 'png',
    filename: 'figure',
    height: 400,
    width: 500,
    scale: 2
  }
};

${result.p_value < 0.05 ? `
// Statistical annotation
const annotations = [{
  x: 0.5, y: 1.15, xref: 'paper', yref: 'paper',
  text: '${result.p_value < 0.001 ? '***' : result.p_value < 0.01 ? '**' : '*'}',
  showarrow: false,
  font: { size: 18, color: '#000', family: 'Arial, sans-serif' }
}];
layout.annotations = annotations;` : ''}`;
  };

  const generateBarPlotCode = (config: any, result: StatisticalResult): string => {
    return `// Bar Plot Configuration - Fixed Layout
const data = [{
  x: groupNames,
  y: groupMeans,
  type: 'bar',
  marker: {
    color: '#1f77b4',
    line: { color: '#000', width: 2 }
  },
  error_y: {
    type: 'data',
    array: standardErrors,
    visible: true,
    color: '#000',
    thickness: 2,
    width: 8
  }
}];

const layout = {
  title: {
    text: 'Mean ${config.outcomeVariable} by ${config.groupVariable}',
    font: { size: 18, family: 'Arial, sans-serif', color: '#000' },
    x: 0.5,
    pad: { t: 20 }
  },
  xaxis: {
    title: {
      text: '${config.groupVariable}',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: false,
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  yaxis: {
    title: {
      text: 'Mean ${config.outcomeVariable}',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: true,
    gridcolor: '#E5E5E5',
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  showlegend: false,
  plot_bgcolor: 'white',
  paper_bgcolor: 'white',
  margin: { l: 80, r: 40, t: 80, b: 80 },
  width: 500,
  height: 400,
  autosize: false
};

const config = {
  displayModeBar: true,
  responsive: false,
  staticPlot: false
};`;
  };

  const generateHeatmapCode = (config: any, result: StatisticalResult): string => {
    return `// Heatmap Configuration - Fixed Layout
const data = [{
  z: contingencyMatrix,
  type: 'heatmap',
  colorscale: [
    [0, '#ffffff'],
    [0.5, '#1f77b480'],
    [1, '#1f77b4']
  ],
  showscale: true,
  text: contingencyMatrix.map(row => row.map(cell => cell.toString())),
  texttemplate: '%{text}',
  textfont: { size: 16, color: '#000', family: 'Arial, sans-serif' },
  hovertemplate: 'Count: %{z}<extra></extra>',
  x: outcomeNames,
  y: groupNames
}];

const layout = {
  title: {
    text: '${config.outcomeVariable} vs ${config.groupVariable}',
    font: { size: 18, family: 'Arial, sans-serif', color: '#000' },
    x: 0.5,
    pad: { t: 20 }
  },
  xaxis: {
    title: {
      text: '${config.outcomeVariable}',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: false,
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  yaxis: {
    title: {
      text: '${config.groupVariable}',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: false,
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  showlegend: false,
  plot_bgcolor: 'white',
  paper_bgcolor: 'white',
  margin: { l: 100, r: 40, t: 80, b: 100 },
  width: 500,
  height: 400,
  autosize: false
};

const config = {
  displayModeBar: true,
  responsive: false,
  staticPlot: false
};`;
  };

  const generateSurvivalCode = (config: any, result: StatisticalResult): string => {
    return `// Survival Curve Configuration - Fixed Layout
const data = survivalGroups.map((group, index) => ({
  x: group.times,
  y: group.survival,
  type: 'scatter',
  mode: 'lines',
  name: group.name,
  line: {
    color: colors[index],
    width: 3,
    shape: 'hv'
  }
}));

const layout = {
  title: {
    text: 'Kaplan-Meier Survival Curves',
    font: { size: 18, family: 'Arial, sans-serif', color: '#000' },
    x: 0.5,
    pad: { t: 20 }
  },
  xaxis: {
    title: {
      text: 'Time',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: true,
    gridcolor: '#E5E5E5',
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true
  },
  yaxis: {
    title: {
      text: 'Survival Probability',
      font: { size: 14, family: 'Arial, sans-serif', color: '#000' },
      standoff: 20
    },
    showgrid: true,
    gridcolor: '#E5E5E5',
    linecolor: '#000',
    linewidth: 2,
    tickfont: { size: 12, family: 'Arial, sans-serif', color: '#000' },
    automargin: true,
    range: [0, 1]
  },
  showlegend: true,
  legend: {
    x: 0.7, y: 0.9,
    bgcolor: 'rgba(255,255,255,0.8)',
    bordercolor: '#000',
    borderwidth: 1,
    font: { size: 12, family: 'Arial, sans-serif', color: '#000' }
  },
  plot_bgcolor: 'white',
  paper_bgcolor: 'white',
  margin: { l: 80, r: 40, t: 80, b: 80 },
  width: 500,
  height: 400,
  autosize: false
};

const config = {
  displayModeBar: true,
  responsive: false,
  staticPlot: false
};

${result.p_value < 0.05 ? `
// Add statistical annotations
const annotations = [{
  x: 0.02, y: 0.98, xref: 'paper', yref: 'paper',
  text: 'p = ${result.p_value.toFixed(3)}',
  showarrow: false,
  font: { size: 12, color: '#000', family: 'Arial, sans-serif' },
  bgcolor: 'rgba(255,255,255,0.8)',
  bordercolor: '#000',
  borderwidth: 1
}];
layout.annotations = annotations;` : ''}`;
  };

  const executeCode = async () => {
    setIsExecuting(true);
    setExecutionError(null);

    try {
      // Simulate code execution and figure generation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Create a new figure with fixed dimensions and proper configuration
      const newFigure = {
        ...initialFigure,
        layout: {
          ...initialFigure.layout,
          autosize: false,
          width: 500,
          height: 400,
          margin: { l: 80, r: 40, t: 80, b: 80 }
        },
        config: {
          displayModeBar: true,
          responsive: false,
          staticPlot: false,
          toImageButtonOptions: {
            format: 'png',
            filename: 'figure',
            height: 400,
            width: 500,
            scale: 2
          }
        }
      };
      
      setPreviewFigure(newFigure);
      onFigureUpdate(newFigure);
      
      // Add to history
      const change: CodeChange = {
        id: Date.now().toString(),
        description: 'Manual code execution',
        code: currentCode,
        timestamp: new Date(),
        applied: true
      };
      setChangeHistory(prev => [...prev, change]);
      
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'Execution failed');
    } finally {
      setIsExecuting(false);
    }
  };

  const resetToOriginal = () => {
    setCurrentCode(originalCode);
    setPreviewFigure(initialFigure);
    setExecutionError(null);
    onFigureUpdate(initialFigure);
  };

  const handleChatSubmit = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsProcessingChat(true);

    try {
      // Simulate AI processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const response = await processNaturalLanguageRequest(chatInput);
      
      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: response.description,
        timestamp: new Date(),
        codeChanges: response.code,
        preview: response.preview
      };

      setChatMessages(prev => [...prev, assistantMessage]);
      
      // Add to pending changes
      const change: CodeChange = {
        id: Date.now().toString(),
        description: response.description,
        code: response.code,
        timestamp: new Date(),
        applied: false
      };
      setPendingChanges(prev => [...prev, change]);
      
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: 'Sorry, I couldn\'t process that request. Please try rephrasing or being more specific.',
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsProcessingChat(false);
    }
  };

  const processNaturalLanguageRequest = async (request: string): Promise<{
    description: string;
    code: string;
    preview: any;
  }> => {
    const lowerRequest = request.toLowerCase();
    
    // Simple pattern matching for demo purposes
    // In a real implementation, this would use an LLM
    
    if (lowerRequest.includes('color') && lowerRequest.includes('red')) {
      return {
        description: 'I\'ll change the color to red for you.',
        code: currentCode.replace(/color: '#[^']*'/g, "color: '#dc2626'"),
        preview: null
      };
    }
    
    if (lowerRequest.includes('title')) {
      const titleMatch = lowerRequest.match(/title[^a-z]*['"]([^'"]*)['"]/);
      const newTitle = titleMatch ? titleMatch[1] : 'New Title';
      return {
        description: `I'll change the title to "${newTitle}".`,
        code: currentCode.replace(/text: '[^']*'/g, `text: '${newTitle}'`),
        preview: null
      };
    }
    
    if (lowerRequest.includes('font size')) {
      const sizeMatch = lowerRequest.match(/(\d+)/);
      const newSize = sizeMatch ? sizeMatch[1] : '16';
      return {
        description: `I'll change the font size to ${newSize}pt.`,
        code: currentCode.replace(/size: \d+/g, `size: ${newSize}`),
        preview: null
      };
    }
    
    if (lowerRequest.includes('background') && lowerRequest.includes('white')) {
      return {
        description: 'I\'ll set the background to white.',
        code: currentCode.replace(/plot_bgcolor: '[^']*'/g, "plot_bgcolor: 'white'"),
        preview: null
      };
    }
    
    return {
      description: 'I understand you want to modify the figure. Could you be more specific about what changes you\'d like to make?',
      code: currentCode,
      preview: null
    };
  };

  const applyChange = (changeId: string) => {
    const change = pendingChanges.find(c => c.id === changeId);
    if (!change) return;

    setCurrentCode(change.code);
    setPendingChanges(prev => prev.filter(c => c.id !== changeId));
    setChangeHistory(prev => [...prev, { ...change, applied: true }]);
    
    // Execute the change
    executeCode();
  };

  const rejectChange = (changeId: string) => {
    setPendingChanges(prev => prev.filter(c => c.id !== changeId));
  };

  const exportFigure = (format: 'png' | 'svg' | 'html') => {
    // Implementation would depend on the plotting library
    console.log(`Exporting figure as ${format}`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">Interactive Figure Editor</h3>
        <div className="flex items-center space-x-4">
          {/* Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setEditorMode('code')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                editorMode === 'code'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Code className="h-4 w-4" />
              <span>Code Editor</span>
            </button>
            <button
              onClick={() => setEditorMode('chat')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${
                editorMode === 'chat'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="h-4 w-4" />
              <span>Natural Language</span>
            </button>
          </div>

          {/* Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            <span className="text-sm">{showPreview ? 'Hide' : 'Show'} Preview</span>
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Editor Panel */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {editorMode === 'code' ? (
              <motion.div
                key="code-editor"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Code Editor Toolbar */}
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-gray-900">Figure Code</h4>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={executeCode}
                      disabled={isExecuting}
                      className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                    >
                      {isExecuting ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                      <span>Run</span>
                    </button>
                    <button
                      onClick={resetToOriginal}
                      className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                    >
                      <RotateCcw className="h-4 w-4" />
                      <span>Reset</span>
                    </button>
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <Editor
                    height="400px"
                    defaultLanguage="javascript"
                    value={currentCode}
                    onChange={(value) => setCurrentCode(value || '')}
                    onMount={(editor) => {
                      editorRef.current = editor;
                    }}
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      theme: 'vs-light',
                      wordWrap: 'on'
                    }}
                  />
                </div>

                {/* Error Display */}
                {executionError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h5 className="font-medium text-red-900">Execution Error</h5>
                      <p className="text-sm text-red-700 mt-1">{executionError}</p>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat-interface"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Chat Interface */}
                <div className="border border-gray-300 rounded-lg">
                  {/* Chat Messages */}
                  <div className="h-96 overflow-y-auto p-4 space-y-4">
                    {chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.type === 'user'
                              ? 'bg-blue-600 text-white'
                              : message.type === 'system'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-gray-200 text-gray-900'
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.codeChanges && (
                            <div className="mt-2 p-2 bg-gray-800 rounded text-xs text-green-400 font-mono">
                              <pre className="whitespace-pre-wrap">{message.codeChanges.substring(0, 100)}...</pre>
                            </div>
                          )}
                          <p className="text-xs opacity-75 mt-1">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                    {isProcessingChat && (
                      <div className="flex justify-start">
                        <div className="bg-gray-200 text-gray-900 px-4 py-2 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Loader className="h-4 w-4 animate-spin" />
                            <span className="text-sm">Processing your request...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={chatEndRef} />
                  </div>

                  {/* Chat Input */}
                  <div className="border-t border-gray-300 p-4">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
                        placeholder="Describe the changes you'd like to make..."
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={isProcessingChat}
                      />
                      <button
                        onClick={handleChatSubmit}
                        disabled={isProcessingChat || !chatInput.trim()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Pending Changes */}
                {pendingChanges.length > 0 && (
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">Pending Changes</h5>
                    {pendingChanges.map((change) => (
                      <div key={change.id} className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="text-sm text-gray-900">{change.description}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {change.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <button
                              onClick={() => applyChange(change.id)}
                              className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition-colors"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => rejectChange(change.id)}
                              className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Quick Suggestions */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2 mb-3">
                    <Lightbulb className="h-5 w-5 text-blue-600" />
                    <h5 className="font-medium text-blue-900">Quick Suggestions</h5>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {[
                      'Make the bars blue',
                      'Add a title "Treatment Comparison"',
                      'Increase font size to 16pt',
                      'Change background to white',
                      'Add error bars'
                    ].map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setChatInput(suggestion)}
                        className="text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Live Preview</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => exportFigure('png')}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>PNG</span>
                </button>
                <button
                  onClick={() => exportFigure('svg')}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>SVG</span>
                </button>
                <button
                  onClick={() => exportFigure('html')}
                  className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors flex items-center space-x-2"
                >
                  <Download className="h-4 w-4" />
                  <span>HTML</span>
                </button>
              </div>
            </div>

            {/* Figure Preview - Fixed Container */}
            <div 
              ref={plotContainerRef}
              className="border border-gray-300 rounded-lg p-4 bg-gray-50"
              style={{ width: '100%', height: '450px' }}
            >
              {previewFigure && (
                <Plot
                  ref={plotRef}
                  data={previewFigure.data}
                  layout={{
                    ...previewFigure.layout,
                    autosize: false,
                    width: 500,
                    height: 400
                  }}
                  config={{
                    ...previewFigure.config,
                    responsive: false,
                    staticPlot: false
                  }}
                  style={{ width: '100%', height: '100%' }}
                  useResizeHandler={false}
                  onInitialized={(figure) => {
                    // Store reference for manual resize handling
                    plotRef.current = figure;
                  }}
                />
              )}
            </div>

            {/* Change History */}
            {changeHistory.length > 0 && (
              <div className="space-y-3">
                <h5 className="font-medium text-gray-900">Change History</h5>
                <div className="max-h-32 overflow-y-auto space-y-2">
                  {changeHistory.slice(-5).map((change) => (
                    <div key={change.id} className="bg-gray-50 border border-gray-200 rounded p-3">
                      <p className="text-sm text-gray-900">{change.description}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {change.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default VisualizationEditor;