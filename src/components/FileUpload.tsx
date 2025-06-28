import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, Shield, AlertCircle } from 'lucide-react';
import { parseCSVFile, ParsedData } from '../utils/csvParser';

interface FileUploadProps {
  onFileUploaded: (data: ParsedData) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    try {
      const parsedData = await parseCSVFile(file);
      onFileUploaded(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    disabled: isProcessing
  });

  const generateSampleData = () => {
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

    onFileUploaded(mockParsedData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Data</h2>
        <p className="text-lg text-gray-600">
          Upload your dataset to get started with AI-powered statistical analysis
        </p>
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
          isDragActive 
            ? 'border-blue-400 bg-blue-50' 
            : isProcessing 
            ? 'border-gray-300 bg-gray-50' 
            : 'border-gray-300 hover:border-blue-400'
        }`}
        {...getRootProps()}
      >
        <input {...getInputProps()} />
        
        <div className="space-y-6">
          <div className="mx-auto w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            ) : (
              <Upload className={`h-12 w-12 ${isDragActive ? 'text-blue-600 animate-bounce' : 'text-blue-500'}`} />
            )}
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              {isProcessing 
                ? 'Processing your file...' 
                : isDragActive 
                ? 'Drop your file here' 
                : 'Drop your CSV file here'
              }
            </h3>
            {!isProcessing && (
              <>
                <p className="text-gray-600 mb-4">or click to browse</p>
                <p className="text-sm text-gray-500">
                  Supports CSV and Excel files up to 100MB
                </p>
              </>
            )}
          </div>

          {!isProcessing && (
            <button 
              className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              disabled={isProcessing}
            >
              Choose File
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
          <h4 className="font-semibold text-gray-900 mb-2">Secure Processing</h4>
          <p className="text-sm text-gray-600">
            All data processing happens locally in your browser
          </p>
        </motion.div>
      </div>

      {/* Sample Data Option */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">Don't have data ready? Try our sample dataset</p>
        <button 
          onClick={generateSampleData}
          disabled={isProcessing}
          className="text-blue-600 hover:text-blue-700 font-medium underline disabled:opacity-50"
        >
          Use Sample Clinical Trial Data (120 patients)
        </button>
      </div>
    </div>
  );
};

export default FileUpload;