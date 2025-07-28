import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, Shield, AlertCircle, Crown, Zap, Loader } from 'lucide-react';
import { parseCSVFile, ParsedData } from '../utils/csvParser';
import { apiClient, Dataset, handleApiError } from '../services/apiClient';
import { User } from '../utils/supabase';

interface FileUploadProps {
  onFileUploaded: (data: ParsedData, dataset?: Dataset) => void;
  disabled?: boolean;
  user?: User | null;
  onLogin?: (mode?: 'signin' | 'signup') => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded, disabled = false, user, onLogin }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<string>('');

  const processFileWithBackend = async (file: File): Promise<{ parsedData: ParsedData; dataset: Dataset }> => {
    setUploadProgress('Uploading file to server...');
    
    try {
      // Upload file to backend
      const dataset = await apiClient.files.upload(file);
      
      setUploadProgress('Processing file data...');
      
      // Get the processed data from backend
      const dataResponse = await apiClient.files.getDatasetData(dataset.id, 100) as { data: any[]; total: number }; // Get first 100 rows for preview
      
      setUploadProgress('Finalizing...');
      
      // Convert backend response to ParsedData format for compatibility
      const parsedData: ParsedData = {
        data: dataResponse.data || [],
        columns: dataset.columns,
        filename: dataset.filename,
        rows: dataset.rows,
        preview: (dataResponse.data || []).slice(0, 5)
      };

      return { parsedData, dataset };
    } catch (error) {
      throw new Error(handleApiError(error));
    }
  };

  const processFileLocally = async (file: File): Promise<{ parsedData: ParsedData }> => {
    setUploadProgress('Processing file locally...');
    const parsedData = await parseCSVFile(file);
    return { parsedData };
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (disabled) return;

    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setUploadProgress('');

    try {
      // Check if user is authenticated and backend is available
      const useBackend = !!user;
      
      if (useBackend) {
        try {
          // Try backend processing first
          const { parsedData, dataset } = await processFileWithBackend(file);
          onFileUploaded(parsedData, dataset);
        } catch (backendError) {
          console.warn('Backend processing failed, falling back to local processing:', backendError);
          // Fall back to local processing
          const { parsedData } = await processFileLocally(file);
          onFileUploaded(parsedData);
        }
      } else {
        // Use local processing for unauthenticated users
        const { parsedData } = await processFileLocally(file);
        onFileUploaded(parsedData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
      setUploadProgress('');
    }
  }, [onFileUploaded, disabled, user]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: isProcessing || disabled
  });

  const generateSampleData = () => {
    if (disabled) return;

    setIsProcessing(true);
    setUploadProgress('Generating sample data...');

    // Generate realistic clinical trial data
    const treatments = ['Drug A', 'Drug B', 'Placebo'];
    const genders = ['Male', 'Female'];
    const sampleData = [];

    for (let i = 1; i <= 120; i++) {
      const treatment = treatments[Math.floor(Math.random() * treatments.length)];
      const gender = genders[Math.floor(Math.random() * genders.length)];
      const age = Math.floor(Math.random() * 40) + 30; // Age 30-70
      const baselineScore = Math.random() * 0.3 + 0.4; // 0.4-0.7
      
      // Treatment effect simulation
      let outcomeScore = baselineScore;
      if (treatment === 'Drug A') {
        outcomeScore += Math.random() * 0.3 + 0.1; // Better outcome
      } else if (treatment === 'Drug B') {
        outcomeScore += Math.random() * 0.2 + 0.05; // Moderate improvement
      } else {
        outcomeScore += Math.random() * 0.1 - 0.05; // Placebo effect
      }
      
      // Add some noise
      outcomeScore += (Math.random() - 0.5) * 0.1;
      outcomeScore = Math.max(0, Math.min(1, outcomeScore)); // Clamp to 0-1

      sampleData.push({
        Patient_ID: `P${i.toString().padStart(3, '0')}`,
        Age: age,
        Gender: gender,
        Treatment: treatment,
        Baseline_Score: Math.round(baselineScore * 100) / 100,
        Outcome_Score: Math.round(outcomeScore * 100) / 100,
        BMI: Math.round((Math.random() * 10 + 20) * 10) / 10 // BMI 20-30
      });
    }

    const mockParsedData: ParsedData = {
      data: sampleData,
      columns: ['Patient_ID', 'Age', 'Gender', 'Treatment', 'Baseline_Score', 'Outcome_Score', 'BMI'],
      filename: 'sample_clinical_trial.csv',
      rows: sampleData.length,
      preview: sampleData.slice(0, 5)
    };

    setTimeout(() => {
      setIsProcessing(false);
      setUploadProgress('');
      onFileUploaded(mockParsedData);
    }, 1000);
  };

  const handleUpgradeClick = () => {
    if (onLogin) {
      onLogin('signup');
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Data</h2>
        <p className="text-lg text-gray-600">
          Upload your dataset to get started with AI-powered statistical analysis
        </p>
        {!user && (
          <p className="text-sm text-blue-600 mt-2">
            ✨ Try 2 free analyses without signing up!
          </p>
        )}
        {user && (
          <p className="text-sm text-green-600 mt-2">
            ✅ Authenticated - using secure server processing
          </p>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-3"
        >
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-white rounded-2xl shadow-lg border-2 border-dashed p-12 text-center transition-colors ${
          disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : isProcessing 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
        style={!disabled ? getRootProps().style : {}}
        onClick={!disabled ? getRootProps().onClick : undefined}
        onKeyDown={!disabled ? getRootProps().onKeyDown : undefined}
        onFocus={!disabled ? getRootProps().onFocus : undefined}
        onBlur={!disabled ? getRootProps().onBlur : undefined}
        onDrop={!disabled ? getRootProps().onDrop : undefined}
        onDragEnter={!disabled ? getRootProps().onDragEnter : undefined}
        onDragLeave={!disabled ? getRootProps().onDragLeave : undefined}
        onDragOver={!disabled ? getRootProps().onDragOver : undefined}
        tabIndex={!disabled ? getRootProps().tabIndex : undefined}
      >
        {!disabled && <input {...getInputProps()} />}
        
        <div className="space-y-6">
          <div className={`mx-auto w-24 h-24 rounded-full flex items-center justify-center ${
            disabled ? 'bg-gray-100' : 'bg-blue-50'
          }`}>
            {isProcessing ? (
              <Loader className="h-12 w-12 text-blue-600 animate-spin" />
            ) : disabled ? (
              <AlertCircle className="h-12 w-12 text-gray-400" />
            ) : (
              <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-600 animate-bounce' : 'text-blue-500'}`} />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isProcessing 
                ? uploadProgress || 'Processing your file...' 
                : disabled
                ? 'Free trial limit reached'
                : isDragActive 
                ? 'Drop your file here' 
                : 'Drop your CSV file here'
              }
            </h3>
            {!isProcessing && !disabled && (
              <>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports CSV and Excel files up to 100MB
                </p>
              </>
            )}
            {disabled && (
              <p className="text-gray-600 mb-4">
                Sign up to continue with unlimited statistical analysis
              </p>
            )}
          </div>

          {!isProcessing && !disabled && (
            <button 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              disabled={isProcessing}
            >
              Choose File
            </button>
          )}

          {disabled && (
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
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center"
        >
          <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Automatic Detection</h4>
          <p className="text-sm text-gray-600">
            AI automatically detects column types and data structure
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center"
        >
          <FileText className="h-8 w-8 text-blue-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">Missing Data Handling</h4>
          <p className="text-sm text-gray-600">
            Smart suggestions for handling missing values and outliers
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 text-center"
        >
          <Shield className="h-8 w-8 text-purple-600 mx-auto mb-3" />
          <h4 className="font-semibold text-gray-900 mb-2">
            {user ? 'Secure Server Processing' : 'Local Processing'}
          </h4>
          <p className="text-sm text-gray-600">
            {user 
              ? 'Data processed securely on our servers with persistent storage'
              : 'All data processing happens locally in your browser'
            }
          </p>
        </motion.div>
      </div>

      {/* Sample Data Option */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">Don't have data ready? Try our sample dataset</p>
        <button 
          onClick={generateSampleData}
          disabled={isProcessing || disabled}
          className={`font-medium underline transition-colors ${
            disabled 
              ? 'text-gray-400 cursor-not-allowed' 
              : 'text-blue-600 hover:text-blue-700'
          }`}
        >
          {disabled ? 'Sign up to use sample data' : 'Use Sample Clinical Trial Data (120 patients)'}
        </button>
      </div>

      {/* Upgrade Prompt for Free Users */}
      {!user && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-12 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200 p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <Crown className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Unlock Full Statistical Power</h3>
          </div>
          <p className="text-gray-700 mb-4">
            Get unlimited analyses, advanced statistical tests, and publication-ready outputs.
          </p>
          <div className="flex items-center space-x-4">
            <button 
              onClick={handleUpgradeClick}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Start Free Trial
            </button>
            <button 
              onClick={() => onLogin && onLogin('signin')}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Already have an account? Sign in →
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default FileUpload;