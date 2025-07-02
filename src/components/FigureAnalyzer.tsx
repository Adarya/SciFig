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
  BarChart3,
  Crown,
  Zap,
  Sparkles
} from 'lucide-react';
import { User } from '../utils/supabase';
import ImageAnalysisModal from './ImageAnalysisModal';

interface FigureAnalyzerProps {
  onNavigate: (view: string) => void;
  user?: User | null;
  onLogin?: (mode?: 'signin' | 'signup') => void;
}

const FigureAnalyzer: React.FC<FigureAnalyzerProps> = ({ onNavigate, user, onLogin }) => {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // Free tier limits
  const FREE_ANALYSIS_LIMIT = 3;
  const isFreeTier = !user;
  const hasReachedLimit = isFreeTier && analysisCount >= FREE_ANALYSIS_LIMIT;

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (hasReachedLimit) {
      return; // Don't process if limit reached
    }

    const file = acceptedFiles[0];
    if (file) {
      setShowAnalysisModal(true);
      setAnalysisCount(prev => prev + 1);
    }
  }, [hasReachedLimit]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.svg', '.pdf', '.tiff', '.bmp', '.webp']
    },
    multiple: false,
    disabled: hasReachedLimit
  });

  const handleUpgradeClick = () => {
    if (onLogin) {
      onLogin('signup');
    }
  };

  const handleQuickAnalysis = () => {
    if (hasReachedLimit) {
      handleUpgradeClick();
      return;
    }
    setShowAnalysisModal(true);
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
              <h1 className="text-xl font-semibold text-gray-900">AI Figure Analyzer</h1>
              {isFreeTier && (
                <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2 py-1 rounded-full">
                  Free Trial
                </span>
              )}
            </div>
            {isFreeTier && (
              <button
                onClick={handleUpgradeClick}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Crown className="h-4 w-4" />
                <span>Upgrade for Unlimited</span>
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Free Tier Usage Banner */}
        {isFreeTier && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`mb-6 p-4 rounded-lg border ${
              hasReachedLimit 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {hasReachedLimit ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Zap className="h-5 w-5 text-blue-600" />
                )}
                <div>
                  <p className={`font-medium ${hasReachedLimit ? 'text-red-900' : 'text-blue-900'}`}>
                    {hasReachedLimit 
                      ? 'Free analysis limit reached' 
                      : `Free Trial: ${analysisCount}/${FREE_ANALYSIS_LIMIT} analyses used`
                    }
                  </p>
                  <p className={`text-sm ${hasReachedLimit ? 'text-red-700' : 'text-blue-700'}`}>
                    {hasReachedLimit 
                      ? 'Sign up for unlimited figure analysis and advanced features'
                      : 'Sign up for unlimited analyses and advanced statistical tools'
                    }
                  </p>
                </div>
              </div>
              <button
                onClick={handleUpgradeClick}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  hasReachedLimit
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {hasReachedLimit ? 'Sign Up Now' : 'Upgrade'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Figure Analysis</h2>
              <p className="text-lg text-gray-600">
                Upload your scientific figure to get instant AI-powered feedback on publication readiness, 
                accessibility, and design improvements
              </p>
              {isFreeTier && !hasReachedLimit && (
                <p className="text-sm text-blue-600 mt-2">
                  ✨ Try {FREE_ANALYSIS_LIMIT - analysisCount} more {FREE_ANALYSIS_LIMIT - analysisCount === 1 ? 'analysis' : 'analyses'} free!
                </p>
              )}
            </motion.div>
          </div>

          {/* Upload Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`bg-white rounded-2xl shadow-lg border-2 border-dashed p-12 text-center transition-colors mb-8 ${
              hasReachedLimit 
                ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
                : isDragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-blue-400'
            }`}
            {...(hasReachedLimit ? {} : getRootProps())}
          >
            {!hasReachedLimit && <input {...getInputProps()} />}
            
            <div className="space-y-6">
              <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
                hasReachedLimit ? 'bg-gray-100' : 'bg-blue-50'
              }`}>
                {hasReachedLimit ? (
                  <AlertTriangle className="h-12 w-12 text-gray-400" />
                ) : (
                  <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-600 animate-bounce' : 'text-blue-500'}`} />
                )}
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {hasReachedLimit 
                    ? 'Free trial limit reached' 
                    : isDragActive 
                    ? 'Drop your figure here' 
                    : 'Upload your scientific figure'
                  }
                </h3>
                {!hasReachedLimit && (
                  <>
                    <p className="text-gray-600 mb-4">or click to browse</p>
                    <p className="text-sm text-gray-500">
                      Supports PNG, JPG, SVG, PDF, TIFF and other formats up to 50MB
                    </p>
                  </>
                )}
                {hasReachedLimit && (
                  <p className="text-gray-600 mb-4">
                    Sign up to continue analyzing figures and unlock advanced features
                  </p>
                )}
              </div>

              {!hasReachedLimit && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
                    Choose Figure
                  </button>
                  <button 
                    onClick={handleQuickAnalysis}
                    className="bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors flex items-center space-x-2"
                  >
                    <Sparkles className="h-5 w-5" />
                    <span>Quick Demo</span>
                  </button>
                </div>
              )}
              
              {hasReachedLimit && (
                <button 
                  onClick={handleUpgradeClick}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Sign Up for Unlimited Access
                </button>
              )}
            </div>
          </motion.div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
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

          {/* Analysis Criteria */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-6">What We Analyze</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { icon: BarChart3, title: 'Resolution & DPI', desc: 'Minimum 300 DPI for print' },
                { icon: Image, title: 'Composition', desc: 'Visual balance and clarity' },
                { icon: Palette, title: 'Color Balance', desc: 'Saturation and accessibility' },
                { icon: Type, title: 'Text Legibility', desc: 'Font size and contrast' },
                { icon: CheckCircle, title: 'Format Compatibility', desc: 'Publication-ready formats' },
                { icon: Target, title: 'Copyright Compliance', desc: 'Watermark detection' }
              ].map((item, index) => (
                <div key={index} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                  <item.icon className="h-5 w-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-gray-900 text-sm">{item.title}</h4>
                    <p className="text-xs text-gray-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Upgrade Prompt for Free Users */}
          {isFreeTier && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6"
            >
              <div className="flex items-center space-x-3 mb-4">
                <Crown className="h-6 w-6 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Unlock Full Analysis Power</h3>
              </div>
              <p className="text-gray-700 mb-4">
                Get unlimited figure analysis, advanced statistical tools, and publication-ready outputs.
              </p>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={handleUpgradeClick}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Start Free Trial
                </button>
                <button 
                  onClick={() => onNavigate('pricing')}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  View Pricing →
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Image Analysis Modal */}
      <ImageAnalysisModal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
      />
    </div>
  );
};

export default FigureAnalyzer;