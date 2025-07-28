import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Brain,
  Download,
  Share,
  Zap,
  Crown,
  AlertTriangle,
  Loader
} from 'lucide-react';
import FileUpload from './FileUpload';
import DataPreview from './DataPreview';
import AnalysisSelection from './AnalysisSelection';
import ResultsView from './ResultsView';
import { ParsedData } from '../utils/csvParser';
import { Dataset } from '../services/apiClient';
import { User } from '../utils/supabase';
import AnalysisProgressIndicator from './AnalysisProgressIndicator';

interface AnalysisWorkflowProps {
  onNavigate: NavigateFunction;
  user?: User | null;
  onLogin?: (mode?: 'signin' | 'signup') => void;
}

type WorkflowStep = 'upload' | 'preview' | 'analysis' | 'results';

const AnalysisWorkflow: React.FC<AnalysisWorkflowProps> = ({ onNavigate, user, onLogin }) => {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('upload');
  const [uploadedData, setUploadedData] = useState<ParsedData | null>(null);
  const [uploadedDataset, setUploadedDataset] = useState<Dataset | null>(null);
  const [outcomeVariable, setOutcomeVariable] = useState<string>('');
  const [groupVariable, setGroupVariable] = useState<string>('');
  const [timeVariable, setTimeVariable] = useState<string>('');
  const [eventVariable, setEventVariable] = useState<string>('');
  const [analysisConfig, setAnalysisConfig] = useState<any>(null);
  const [analysisCount, setAnalysisCount] = useState(0);

  // Free tier limits
  const FREE_ANALYSIS_LIMIT = 2;
  const isFreeTier = !user;
  const hasReachedLimit = isFreeTier && analysisCount >= FREE_ANALYSIS_LIMIT;

  const steps = [
    { id: 'upload', title: 'Upload Data', icon: Upload },
    { id: 'preview', title: 'Preview & Configure', icon: FileText },
    { id: 'analysis', title: 'Choose Analysis', icon: Brain },
    { id: 'results', title: 'Results & Figures', icon: BarChart3 }
  ];

  const handleNext = () => {
    const stepOrder: WorkflowStep[] = ['upload', 'preview', 'analysis', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const stepOrder: WorkflowStep[] = ['upload', 'preview', 'analysis', 'results'];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  const handleFileUploaded = (data: ParsedData, dataset?: Dataset) => {
    if (hasReachedLimit) {
      return; // Don't process if limit reached
    }

    setUploadedData(data);
    setUploadedDataset(dataset || null);
    
    // Auto-detect variables
    const outcomeKeywords = ['outcome', 'score', 'result', 'response', 'efficacy', 'effect'];
    const groupKeywords = ['treatment', 'group', 'condition', 'arm', 'therapy'];
    const timeKeywords = ['time', 'duration', 'survival', 'follow', 'days', 'months', 'years'];
    const eventKeywords = ['event', 'death', 'status', 'censor', 'died', 'dead'];

    const likelyOutcome = data.columns.find(col => 
      outcomeKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );
    
    const likelyGroup = data.columns.find(col => 
      groupKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );

    const likelyTime = data.columns.find(col => 
      timeKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );

    const likelyEvent = data.columns.find(col => 
      eventKeywords.some(keyword => col.toLowerCase().includes(keyword))
    );

    if (likelyOutcome) setOutcomeVariable(likelyOutcome);
    if (likelyGroup) setGroupVariable(likelyGroup);
    if (likelyTime) setTimeVariable(likelyTime);
    if (likelyEvent) setEventVariable(likelyEvent);
    
    handleNext();
  };

  const handlePreviewNext = (outcomeVar: string, groupVar: string, timeVar?: string, eventVar?: string) => {
    setOutcomeVariable(outcomeVar);
    setGroupVariable(groupVar);
    setTimeVariable(timeVar || '');
    setEventVariable(eventVar || '');
    handleNext();
  };

  const [analysisInProgress, setAnalysisInProgress] = useState(false);
  const [analysisProgressId, setAnalysisProgressId] = useState<string | null>(null);

  const handleAnalysisSelected = async (config: any) => {
    if (hasReachedLimit) {
      return; // Don't process if limit reached
    }

    try {
      // If we have a dataset ID from the backend, use it for server-side analysis
      if (uploadedDataset && user) {
        // Add the dataset ID to the config
        const configWithDataset = {
          ...config,
          dataset_id: uploadedDataset.id
        };
        
        // Store the config for the UI
        setAnalysisConfig(configWithDataset);
        
        // Set analysis in progress to show progress indicator
        setAnalysisInProgress(true);
        
        // If this is a real backend analysis, we'll get an ID for progress tracking
        if (configWithDataset.dataset_id) {
          // In a real implementation, we'd get this from the API response
          // For now, we'll use a mock ID
          setAnalysisProgressId('analysis-123');
        }
      } else {
        // Just use the client-side config
        setAnalysisConfig(config);
      }
      
      // Increment analysis count and proceed
      setAnalysisCount(prev => prev + 1);
      handleNext();
    } catch (error) {
      console.error("Error preparing analysis:", error);
      // Continue with client-side analysis as fallback
      setAnalysisConfig(config);
      setAnalysisCount(prev => prev + 1);
      handleNext();
    }
  };

  const handleUpgradeClick = () => {
    if (onLogin) {
      onLogin('signup');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'upload':
        return (
          <FileUpload 
            onFileUploaded={handleFileUploaded}
            disabled={hasReachedLimit}
            user={user}
            onLogin={onLogin}
          />
        );
      case 'preview':
        return uploadedData ? (
          <DataPreview 
            data={uploadedData}
            onNext={handlePreviewNext}
            onBack={handleBack}
          />
        ) : null;
      case 'analysis':
        return uploadedData ? (
          <AnalysisSelection 
            data={uploadedData}
            outcomeVariable={outcomeVariable}
            groupVariable={groupVariable}
            timeVariable={timeVariable}
            eventVariable={eventVariable}
            onAnalysisSelected={handleAnalysisSelected}
            onBack={handleBack}
          />
        ) : null;
      case 'results':
        return analysisConfig ? (
          <ResultsView 
            analysisConfig={analysisConfig}
            onBack={handleBack}
            onNewAnalysis={() => {
              setCurrentStep('upload');
              setUploadedData(null);
              setUploadedDataset(null);
              setAnalysisConfig(null);
              setOutcomeVariable('');
              setGroupVariable('');
              setTimeVariable('');
              setEventVariable('');
            }}
            dataset={uploadedDataset || undefined}
          />
        ) : null;
      default:
        return null;
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
              <h1 className="text-xl font-semibold text-gray-900">Statistical Analysis</h1>
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

      {/* Free Tier Usage Banner */}
      {isFreeTier && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <div className={`p-4 rounded-lg border ${
              hasReachedLimit 
                ? 'bg-red-50 border-red-200' 
                : 'bg-blue-50 border-blue-200'
            }`}>
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
                        ? 'Sign up for unlimited statistical analysis and advanced features'
                        : 'Sign up for unlimited analyses and publication-ready outputs'
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
            </div>
          </div>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = step.id === currentStep;
              const isCompleted = steps.findIndex(s => s.id === currentStep) > index;
              const StepIcon = step.icon;

              return (
                <div key={step.id} className="flex items-center">
                  <div className={`flex items-center space-x-3 ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-400'
                  }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
                      isActive 
                        ? 'border-blue-600 bg-blue-50' 
                        : isCompleted 
                        ? 'border-green-600 bg-green-50' 
                        : 'border-gray-300 bg-gray-50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <StepIcon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="font-medium hidden sm:block">{step.title}</span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-px mx-4 ${
                      isCompleted ? 'bg-green-600' : 'bg-gray-300'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analysis Progress Indicator */}
        {analysisInProgress && analysisProgressId && (
          <div className="mb-6">
            <AnalysisProgressIndicator 
              analysisId={analysisProgressId}
              onComplete={() => setAnalysisInProgress(false)}
            />
          </div>
        )}
        
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderStepContent()}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalysisWorkflow;