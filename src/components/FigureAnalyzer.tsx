import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  ArrowLeft, 
  Upload, 
  Image, 
  Brain, 
  CheckCircle, 
  AlertTriangle, 
  Lightbulb,
  Target,
  Palette,
  Type,
  BarChart3
} from 'lucide-react';

interface FigureAnalyzerProps {
  onNavigate: (view: string) => void;
}

const FigureAnalyzer: React.FC<FigureAnalyzerProps> = ({ onNavigate }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setUploadedImage(reader.result as string);
        analyzeImage();
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.pdf']
    },
    multiple: false
  });

  const analyzeImage = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysis({
        overall: {
          score: 7.2,
          assessment: 'Good foundation with room for improvement'
        },
        strengths: [
          'Clear data visualization with appropriate chart type',
          'Proper axis labels and units',
          'Good use of color contrast',
          'Statistical significance clearly marked'
        ],
        weaknesses: [
          'Font sizes too small for publication standards',
          'Legend placement could be optimized',
          'Missing error bars on some data points',
          'Color scheme not colorblind-friendly'
        ],
        recommendations: [
          {
            category: 'Typography',
            priority: 'High',
            issue: 'Font sizes below publication standards',
            solution: 'Increase axis labels to 12pt, title to 14pt minimum',
            impact: 'Improves readability and meets journal requirements'
          },
          {
            category: 'Accessibility',
            priority: 'High',
            issue: 'Color scheme not accessible to colorblind readers',
            solution: 'Use colorblind-safe palette (e.g., viridis, plasma)',
            impact: 'Makes figure accessible to 8% of male population'
          },
          {
            category: 'Statistical Clarity',
            priority: 'Medium',
            issue: 'Missing confidence intervals',
            solution: 'Add error bars showing 95% confidence intervals',
            impact: 'Provides better understanding of data uncertainty'
          },
          {
            category: 'Layout',
            priority: 'Medium',
            issue: 'Legend placement interferes with data',
            solution: 'Move legend outside plot area or use direct labeling',
            impact: 'Reduces visual clutter and improves data visibility'
          },
          {
            category: 'Professional Polish',
            priority: 'Low',
            issue: 'Generic styling',
            solution: 'Apply journal-specific formatting (Nature, Science, etc.)',
            impact: 'Matches target publication aesthetic'
          }
        ],
        alternatives: [
          {
            type: 'Forest Plot',
            reason: 'Better for showing effect sizes with confidence intervals',
            suitability: 'High'
          },
          {
            type: 'Violin Plot',
            reason: 'Shows distribution shape in addition to summary statistics',
            suitability: 'Medium'
          }
        ]
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'text-red-600 bg-red-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Low': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Typography': return Type;
      case 'Accessibility': return Target;
      case 'Statistical Clarity': return BarChart3;
      case 'Layout': return Image;
      case 'Professional Polish': return Palette;
      default: return Lightbulb;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('landing')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Back</span>
              </button>
              <div className="h-6 w-px bg-gray-300" />
              <h1 className="text-xl font-semibold text-gray-900">Figure Analyzer</h1>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!uploadedImage ? (
          /* Upload Interface */
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Analyze Your Scientific Figure</h2>
              <p className="text-lg text-gray-600">
                Upload your figure to get AI-powered feedback on clarity, accessibility, and publication readiness
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-gray-300 p-12 text-center hover:border-blue-400 transition-colors"
              {...getRootProps()}
            >
              <input {...getInputProps()} />
              
              <div className="space-y-6">
                <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                  <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-600 animate-bounce' : 'text-blue-500'}`} />
                </div>
                
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {isDragActive ? 'Drop your figure here' : 'Upload your scientific figure'}
                  </h3>
                  <p className="text-gray-600 mb-4">or click to browse</p>
                  <p className="text-sm text-gray-500">
                    Supports PNG, JPG, SVG, and PDF files up to 10MB
                  </p>
                </div>

                <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                  Choose Figure
                </button>
              </div>
            </motion.div>

            {/* Features */}
            <div className="grid md:grid-cols-3 gap-6 mt-12">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center"
              >
                <Brain className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">AI-Powered Analysis</h4>
                <p className="text-sm text-gray-600">
                  Advanced computer vision analyzes your figure for scientific best practices
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center"
              >
                <Target className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Publication Standards</h4>
                <p className="text-sm text-gray-600">
                  Checks against journal requirements and scientific visualization guidelines
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center"
              >
                <Lightbulb className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                <h4 className="font-semibold text-gray-900 mb-2">Actionable Feedback</h4>
                <p className="text-sm text-gray-600">
                  Specific, prioritized recommendations for improving your figure
                </p>
              </motion.div>
            </div>
          </div>
        ) : (
          /* Analysis Results */
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Uploaded Figure */}
            <div className="lg:col-span-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Figure</h3>
                <div className="bg-gray-100 rounded-lg p-4">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded figure" 
                    className="w-full h-auto rounded"
                  />
                </div>
                <button 
                  onClick={() => {
                    setUploadedImage(null);
                    setAnalysis(null);
                  }}
                  className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Upload Different Figure
                </button>
              </motion.div>
            </div>

            {/* Analysis Results */}
            <div className="lg:col-span-2 space-y-6">
              {isAnalyzing ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
                >
                  <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Figure...</h3>
                  <p className="text-gray-600">Our AI is examining your figure for clarity, accessibility, and publication standards.</p>
                </motion.div>
              ) : analysis && (
                <>
                  {/* Overall Assessment */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Overall Assessment</h3>
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="text-3xl font-bold text-blue-600">{analysis.overall.score}/10</div>
                      <div>
                        <p className="font-medium text-gray-900">{analysis.overall.assessment}</p>
                        <p className="text-sm text-gray-600">Publication readiness score</p>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-green-700 mb-3 flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Strengths
                        </h4>
                        <ul className="space-y-2">
                          {analysis.strengths.map((strength: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      <div>
                        <h4 className="font-medium text-red-700 mb-3 flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-2" />
                          Areas for Improvement
                        </h4>
                        <ul className="space-y-2">
                          {analysis.weaknesses.map((weakness: string, index: number) => (
                            <li key={index} className="text-sm text-gray-700 flex items-start">
                              <span className="w-2 h-2 bg-red-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                              {weakness}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </motion.div>

                  {/* Detailed Recommendations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Detailed Recommendations</h3>
                    <div className="space-y-6">
                      {analysis.recommendations.map((rec: any, index: number) => {
                        const CategoryIcon = getCategoryIcon(rec.category);
                        return (
                          <div key={index} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-start space-x-4">
                              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                                <CategoryIcon className="h-5 w-5 text-blue-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center space-x-3 mb-2">
                                  <h4 className="font-semibold text-gray-900">{rec.category}</h4>
                                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                    {rec.priority} Priority
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Issue:</strong> {rec.issue}
                                </p>
                                <p className="text-sm text-gray-700 mb-2">
                                  <strong>Solution:</strong> {rec.solution}
                                </p>
                                <p className="text-sm text-blue-600">
                                  <strong>Impact:</strong> {rec.impact}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Alternative Visualizations */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 mb-4">Alternative Visualizations</h3>
                    <p className="text-gray-600 mb-4">Consider these alternative chart types for your data:</p>
                    <div className="space-y-3">
                      {analysis.alternatives.map((alt: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{alt.type}</h4>
                            <p className="text-sm text-gray-600">{alt.reason}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            alt.suitability === 'High' ? 'bg-green-100 text-green-800' :
                            alt.suitability === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {alt.suitability} Suitability
                          </span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FigureAnalyzer;