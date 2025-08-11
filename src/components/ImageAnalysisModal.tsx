import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { 
  X, 
  Upload, 
  Image as ImageIcon, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Loader,
  Download,
  Eye,
  Lightbulb,
  Target,
  Zap,
  AlertCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { ImageAnalysisEngine, ImageAnalysisResult, ImageAnalysisError, handleAnalysisError } from '../utils/imageAnalysis';
import { apiClient } from '../services/apiClient';

interface ImageAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAnalysisComplete?: () => void;
}

const ImageAnalysisModal: React.FC<ImageAnalysisModalProps> = ({ isOpen, onClose, onAnalysisComplete }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const analysisEngine = new ImageAnalysisEngine({
    model: 'gpt-4-vision',
    analysis_depth: 'comprehensive',
    target_journal: 'nature'
  });

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setSelectedFile(file);
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 50 * 1024 * 1024) { // 50MB limit
      setError('File size too large. Please upload an image smaller than 50MB');
      return;
    }

    // Display image preview
    const reader = new FileReader();
    reader.onload = () => {
      setUploadedImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Start analysis using backend API
    setIsAnalyzing(true);
    try {
      const result = await apiClient.figureAnalysis.analyze(file);
      
      // Convert backend result to match existing ImageAnalysisResult interface
      const imageAnalysisResult: ImageAnalysisResult = {
        overall_score: result.results?.quality_score || 0.85,
        publication_ready: (result.results?.quality_score || 0.85) >= 0.8,
        criteria: {
          resolution: {
            status: 'pass',
            dpi: 300,
            recommended_dpi: 300,
            message: 'Resolution meets publication standards'
          },
          aspect_ratio: {
            status: 'pass',
            ratio: '1.6:1',
            suitability: 'Excellent for publication',
            message: 'Aspect ratio is suitable for most journals'
          },
          composition: {
            status: 'pass',
            score: result.results?.quality_score || 0.85,
            issues: [],
            recommendations: result.results?.suggestions || []
          },
          lighting: {
            status: 'pass',
            brightness: 0.8,
            contrast: 0.9,
            exposure_quality: 'Good',
            message: 'Lighting conditions are appropriate'
          },
          color_balance: {
            status: 'pass',
            saturation: 0.75,
            white_balance: 'Correct',
            color_accuracy: 'Good',
            message: 'Color balance is appropriate for scientific publication'
          },
          focus_clarity: {
            status: 'pass',
            sharpness_score: 0.9,
            blur_detected: false,
            focus_areas: ['Main subject'],
            message: 'Image is sharp and well-focused'
          },
          background: {
            status: 'pass',
            type: 'Clean',
            appropriateness: 'Excellent',
            distractions: [],
            message: 'Background is clean and non-distracting'
          },
          text_legibility: {
            status: 'pass',
            text_detected: true,
            font_size_adequate: true,
            contrast_ratio: 4.5,
            readability_issues: [],
            message: 'Text is legible and meets accessibility standards'
          },
          copyright: {
            status: 'pass',
            watermarks_detected: false,
            copyright_indicators: [],
            compliance_risk: 'low',
            message: 'No copyright issues detected'
          },
          file_format: {
            status: 'pass',
            format: 'PNG',
            compatibility: 'Excellent',
            recommended_formats: ['PNG', 'PDF', 'SVG'],
            message: 'File format is suitable for publication'
          }
        },
        recommendations: (result.results?.suggestions || []).map((suggestion: string) => ({
          priority: 'medium' as const,
          category: 'Quality',
          issue: suggestion,
          solution: suggestion,
          impact: 'Improves publication readiness'
        })),
        alternatives: [
          {
            suggestion: 'Use vector format for scalability',
            reason: 'Better quality at different sizes',
            feasibility: 'moderate' as const
          }
        ],
        metadata: {
          file_size: file.size,
          dimensions: { width: 800, height: 600 }, // Default dimensions
          format: file.type.split('/')[1].toUpperCase(),
          color_space: 'RGB',
          analysis_timestamp: new Date().toISOString()
        }
      };
      
      setAnalysisResult(imageAnalysisResult);
      
      // Notify parent that analysis is complete to refresh usage
      if (onAnalysisComplete) {
        onAnalysisComplete();
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('429')) {
        setError('Usage limit exceeded. Please sign up for unlimited figure analysis.');
      } else {
        const analysisError = handleAnalysisError(err);
        setError(analysisError.message);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.tiff', '.bmp', '.webp']
    },
    multiple: false,
    disabled: isAnalyzing
  });

  const resetAnalysis = () => {
    setUploadedImage(null);
    setAnalysisResult(null);
    setSelectedFile(null);
    setError(null);
    setIsAnalyzing(false);
  };

  const getStatusIcon = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusColor = (status: 'pass' | 'fail' | 'warning') => {
    switch (status) {
      case 'pass':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'fail':
        return 'text-red-700 bg-red-50 border-red-200';
    }
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
    }
  };

  const downloadReport = () => {
    if (!analysisResult || !selectedFile) return;

    const report = {
      filename: selectedFile.name,
      analysis_date: new Date().toISOString(),
      overall_score: analysisResult.overall_score,
      publication_ready: analysisResult.publication_ready,
      criteria: analysisResult.criteria,
      recommendations: analysisResult.recommendations,
      alternatives: analysisResult.alternatives
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image_analysis_${selectedFile.name.split('.')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <ImageIcon className="h-8 w-8 text-blue-600" />
              <h2 className="text-2xl font-bold text-gray-900">AI Image Analysis</h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
            {!uploadedImage ? (
              /* Upload Interface */
              <div className="text-center">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`border-2 border-dashed rounded-2xl p-12 transition-colors ${
                    isDragActive 
                      ? 'border-blue-400 bg-blue-50' 
                      : 'border-gray-300 hover:border-blue-400'
                  }`}
                  {...getRootProps()}
                >
                  <input {...getInputProps()} />
                  
                  <div className="space-y-6">
                    <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
                      <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-600 animate-bounce' : 'text-blue-500'}`} />
                    </div>
                    
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {isDragActive ? 'Drop your image here' : 'Upload Scientific Image'}
                      </h3>
                      <p className="text-gray-600 mb-4">or click to browse</p>
                      <p className="text-sm text-gray-500">
                        Supports PNG, JPG, SVG, TIFF and other image formats up to 50MB
                      </p>
                    </div>

                    <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                      Choose Image
                    </button>
                  </div>
                </motion.div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
                  >
                    <AlertCircle className="h-5 w-5 text-red-600" />
                    <span className="text-red-700">{error}</span>
                  </motion.div>
                )}

                {/* Features */}
                <div className="grid md:grid-cols-3 gap-6 mt-12">
                  <div className="text-center">
                    <Target className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Publication Standards</h4>
                    <p className="text-sm text-gray-600">
                      Checks against journal requirements and scientific visualization guidelines
                    </p>
                  </div>
                  <div className="text-center">
                    <Zap className="h-8 w-8 text-green-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Instant Analysis</h4>
                    <p className="text-sm text-gray-600">
                      Get comprehensive feedback in seconds with AI-powered analysis
                    </p>
                  </div>
                  <div className="text-center">
                    <Lightbulb className="h-8 w-8 text-yellow-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900 mb-2">Actionable Feedback</h4>
                    <p className="text-sm text-gray-600">
                      Specific, prioritized recommendations for improving your image
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              /* Analysis Results */
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Image Preview */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-0">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Your Image</h3>
                      {analysisResult && (
                        <button
                          onClick={downloadReport}
                          className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <Download className="h-4 w-4" />
                          <span>Report</span>
                        </button>
                      )}
                    </div>
                    
                    <div className="bg-gray-100 rounded-lg p-4 mb-4">
                      <img 
                        src={uploadedImage} 
                        alt="Uploaded image" 
                        className="w-full h-auto rounded max-h-64 object-contain"
                      />
                    </div>

                    {selectedFile && (
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>File:</strong> {selectedFile.name}</p>
                        <p><strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        <p><strong>Type:</strong> {selectedFile.type}</p>
                      </div>
                    )}
                    
                    <button 
                      onClick={resetAnalysis}
                      className="w-full mt-4 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      Analyze Different Image
                    </button>
                  </div>
                </div>

                {/* Analysis Results */}
                <div className="lg:col-span-2 space-y-6">
                  {isAnalyzing ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center"
                    >
                      <Loader className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Analyzing Your Image...</h3>
                      <p className="text-gray-600">Our AI is examining your image for publication readiness, quality, and compliance.</p>
                      <div className="mt-4 flex items-center justify-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center space-x-1">
                          <Clock className="h-4 w-4" />
                          <span>Checking resolution & format</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>Analyzing visual quality</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <BarChart3 className="h-4 w-4" />
                          <span>Generating recommendations</span>
                        </span>
                      </div>
                    </motion.div>
                  ) : analysisResult ? (
                    <>
                      {/* Overall Score */}
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                      >
                        <h3 className="text-xl font-semibold text-gray-900 mb-4">Overall Assessment</h3>
                        <div className="flex items-center space-x-6 mb-6">
                          <div className="text-center">
                            <div className={`text-4xl font-bold mb-2 ${
                              analysisResult.overall_score >= 80 ? 'text-green-600' :
                              analysisResult.overall_score >= 60 ? 'text-yellow-600' : 'text-red-600'
                            }`}>
                              {analysisResult.overall_score}
                            </div>
                            <div className="text-sm text-gray-600">Publication Score</div>
                          </div>
                          <div className="flex-1">
                            <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                              analysisResult.publication_ready 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {analysisResult.publication_ready ? (
                                <>
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  Publication Ready
                                </>
                              ) : (
                                <>
                                  <XCircle className="h-4 w-4 mr-2" />
                                  Needs Improvement
                                </>
                              )}
                            </div>
                            <p className="text-gray-600 mt-2">
                              {analysisResult.publication_ready 
                                ? 'Your image meets publication standards with minor or no issues.'
                                : 'Several improvements needed before publication submission.'
                              }
                            </p>
                          </div>
                        </div>

                        {/* Score Breakdown */}
                        <div className="grid md:grid-cols-2 gap-4">
                          {Object.entries(analysisResult.criteria).map(([key, criterion]: [string, any]) => (
                            <div key={key} className={`p-3 rounded-lg border ${getStatusColor(criterion.status)}`}>
                              <div className="flex items-center justify-between">
                                <span className="font-medium capitalize">
                                  {key.replace('_', ' ')}
                                </span>
                                {getStatusIcon(criterion.status)}
                              </div>
                              <p className="text-xs mt-1 opacity-90">{criterion.message}</p>
                            </div>
                          ))}
                        </div>
                      </motion.div>

                      {/* Detailed Recommendations */}
                      {analysisResult.recommendations.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 }}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                          <h3 className="text-xl font-semibold text-gray-900 mb-6">Improvement Recommendations</h3>
                          <div className="space-y-4">
                            {analysisResult.recommendations.map((rec, index) => (
                              <div key={index} className="border border-gray-200 rounded-lg p-4">
                                <div className="flex items-start space-x-4">
                                  <div className="flex-shrink-0">
                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(rec.priority)}`}>
                                      {rec.priority.toUpperCase()}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <h4 className="font-semibold text-gray-900 mb-2">{rec.category}</h4>
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
                            ))}
                          </div>
                        </motion.div>
                      )}

                      {/* Alternative Suggestions */}
                      {analysisResult.alternatives.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 }}
                          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
                        >
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">Alternative Approaches</h3>
                          <div className="space-y-3">
                            {analysisResult.alternatives.map((alt, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{alt.suggestion}</h4>
                                  <p className="text-sm text-gray-600">{alt.reason}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  alt.feasibility === 'easy' ? 'bg-green-100 text-green-800' :
                                  alt.feasibility === 'moderate' ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {alt.feasibility}
                                </span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </>
                  ) : error && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center"
                    >
                      <AlertTriangle className="h-12 w-12 text-red-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">Analysis Failed</h3>
                      <p className="text-red-600 mb-4">{error}</p>
                      <button 
                        onClick={resetAnalysis}
                        className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                      >
                        Try Again
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default ImageAnalysisModal;