import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion } from 'framer-motion';
import { Upload, FileText, CheckCircle, Shield } from 'lucide-react';

interface FileUploadProps {
  onFileUploaded: (data: any) => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileUploaded }) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Simulate file processing
      setTimeout(() => {
        const mockData = {
          filename: file.name,
          size: file.size,
          rows: 150,
          columns: ['Patient_ID', 'Age', 'Treatment', 'Outcome', 'Gender', 'BMI'],
          preview: [
            { Patient_ID: '001', Age: 45, Treatment: 'Drug A', Outcome: 0.82, Gender: 'M', BMI: 24.5 },
            { Patient_ID: '002', Age: 52, Treatment: 'Drug B', Outcome: 0.91, Gender: 'F', BMI: 22.1 },
            { Patient_ID: '003', Age: 38, Treatment: 'Drug A', Outcome: 0.76, Gender: 'M', BMI: 26.8 },
            { Patient_ID: '004', Age: 61, Treatment: 'Placebo', Outcome: 0.65, Gender: 'F', BMI: 28.2 },
            { Patient_ID: '005', Age: 29, Treatment: 'Drug B', Outcome: 0.88, Gender: 'M', BMI: 23.7 }
          ]
        };
        onFileUploaded(mockData);
      }, 1500);
    }
  }, [onFileUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/x-spss': ['.sav']
    },
    multiple: false
  });

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Data</h2>
        <p className="text-lg text-gray-600">
          Upload your dataset to get started with AI-powered statistical analysis
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
              {isDragActive ? 'Drop your file here' : 'Drop your CSV/Excel file here'}
            </h3>
            <p className="text-gray-600 mb-4">or click to browse</p>
            <p className="text-sm text-gray-500">
              Supports CSV, Excel (.xlsx, .xls), and SPSS (.sav) files up to 100MB
            </p>
          </div>

          <button className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            Choose File
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
          <h4 className="font-semibold text-gray-900 mb-2">HIPAA Compliant</h4>
          <p className="text-sm text-gray-600">
            Enterprise-grade security for medical research data
          </p>
        </motion.div>
      </div>

      {/* Sample Data Option */}
      <div className="mt-12 text-center">
        <p className="text-gray-600 mb-4">Don't have data ready? Try our sample dataset</p>
        <button 
          onClick={() => {
            const sampleData = {
              filename: 'sample_clinical_trial.csv',
              size: 15420,
              rows: 200,
              columns: ['Patient_ID', 'Age', 'Treatment', 'Outcome', 'Gender', 'BMI', 'Baseline_Score'],
              preview: [
                { Patient_ID: '001', Age: 45, Treatment: 'Drug A', Outcome: 0.82, Gender: 'M', BMI: 24.5, Baseline_Score: 0.65 },
                { Patient_ID: '002', Age: 52, Treatment: 'Drug B', Outcome: 0.91, Gender: 'F', BMI: 22.1, Baseline_Score: 0.58 },
                { Patient_ID: '003', Age: 38, Treatment: 'Drug A', Outcome: 0.76, Gender: 'M', BMI: 26.8, Baseline_Score: 0.72 },
                { Patient_ID: '004', Age: 61, Treatment: 'Placebo', Outcome: 0.65, Gender: 'F', BMI: 28.2, Baseline_Score: 0.61 },
                { Patient_ID: '005', Age: 29, Treatment: 'Drug B', Outcome: 0.88, Gender: 'M', BMI: 23.7, Baseline_Score: 0.55 }
              ]
            };
            onFileUploaded(sampleData);
          }}
          className="text-blue-600 hover:text-blue-700 font-medium underline"
        >
          Use Sample Clinical Trial Data
        </button>
      </div>
    </div>
  );
};

export default FileUpload;