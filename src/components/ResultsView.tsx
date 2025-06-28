import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Download, 
  Share, 
  Copy, 
  BarChart3, 
  FileText, 
  Settings,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

interface ResultsViewProps {
  data: any;
  analysisConfig: any;
  onBack: () => void;
  onNewAnalysis: () => void;
}

const ResultsView: React.FC<ResultsViewProps> = ({ data, analysisConfig, onBack, onNewAnalysis }) => {
  const [figureStyle, setFigureStyle] = useState('nature');
  const [colorScheme, setColorScheme] = useState('default');
  const [exportFormat, setExportFormat] = useState('png');

  // Mock analysis results
  const results = {
    test: 'Independent T-Test',
    groups: ['Drug A', 'Drug B'],
    meanDifference: 0.15,
    confidenceInterval: [0.08, 0.22],
    tStatistic: 4.23,
    degreesOfFreedom: 148,
    pValue: 0.001,
    cohensD: 0.69,
    effectSizeInterpretation: 'Medium effect',
    assumptions: {
      normality: { passed: true, pValue: 0.12 },
      equalVariance: { passed: true, pValue: 0.34 }
    }
  };

  const methodsText = `An independent samples t-test was conducted to compare outcomes between Drug A (M=0.82, SD=0.11) and Drug B (M=0.67, SD=0.13). There was a significant difference in outcomes between the two groups; t(148)=4.23, p<.001, Cohen's d=0.69, indicating a medium effect size. The assumptions of normality and equal variances were met.`;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Analysis Results</h2>
        <p className="text-lg text-gray-600">
          Your statistical analysis is complete with publication-ready outputs
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Results Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Statistical Results */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-xl font-semibold text-gray-900 mb-6">{results.test} Results</h3>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Test Statistics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Mean Difference:</span>
                      <span className="font-medium">{results.meanDifference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">95% CI:</span>
                      <span className="font-medium">[{results.confidenceInterval.join(', ')}]</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">t-statistic:</span>
                      <span className="font-medium">t({results.degreesOfFreedom}) = {results.tStatistic}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">p-value:</span>
                      <span className="font-medium">p &lt; {results.pValue}</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Effect Size</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Cohen's d:</span>
                      <span className="font-medium">{results.cohensD}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Interpretation:</span>
                      <span className="font-medium text-green-600">{results.effectSizeInterpretation}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Assumptions Check */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3">Assumption Checks</h4>
              <div className="space-y-2">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Normality: Shapiro-Wilk test, p = {results.assumptions.normality.pValue}
                  </span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="text-sm text-gray-700">
                    Equal Variances: Levene's test, p = {results.assumptions.equalVariance.pValue}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Generated Figure */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Generated Figure</h3>
              <div className="flex items-center space-x-2">
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Edit Figure
                </button>
                <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                  Download
                </button>
              </div>
            </div>
            
            {/* Mock Figure */}
            <div className="bg-gray-100 rounded-lg p-8 text-center">
              <div className="w-full h-64 bg-white rounded border-2 border-gray-200 flex items-center justify-center">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 font-medium">Box Plot: Drug A vs Drug B</p>
                  <p className="text-sm text-gray-500 mt-2">Publication-ready figure with statistical annotations</p>
                  <div className="mt-4 text-xs text-gray-500">
                    <p>*** p &lt; 0.001</p>
                    <p>Cohen's d = 0.69</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Methods Text */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-gray-900">Methods Text (Copy for Paper)</h3>
              <button 
                onClick={() => copyToClipboard(methodsText)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
              >
                <Copy className="h-4 w-4" />
                <span>Copy</span>
              </button>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-700 leading-relaxed">
                {methodsText}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Options Panel */}
        <div className="space-y-6">
          {/* Figure Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Figure Options</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Journal Style
                </label>
                <select 
                  value={figureStyle}
                  onChange={(e) => setFigureStyle(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="nature">Nature</option>
                  <option value="science">Science</option>
                  <option value="nejm">NEJM</option>
                  <option value="jama">JAMA</option>
                  <option value="plos">PLOS ONE</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Color Scheme
                </label>
                <select 
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="default">Default</option>
                  <option value="colorblind">Colorblind Safe</option>
                  <option value="grayscale">Grayscale</option>
                  <option value="vibrant">Vibrant</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Format
                </label>
                <div className="space-y-2">
                  {['png', 'svg', 'pdf', 'eps'].map((format) => (
                    <label key={format} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="exportFormat"
                        value={format}
                        checked={exportFormat === format}
                        onChange={(e) => setExportFormat(e.target.value)}
                        className="text-blue-600"
                      />
                      <span className="text-sm text-gray-700">
                        {format.toUpperCase()} {format === 'png' && '(300 DPI)'}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Export Options */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Export & Share</h3>
            <div className="space-y-3">
              <button className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download All</span>
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                <Share className="h-4 w-4" />
                <span>Share Project</span>
              </button>
              <button className="w-full bg-gray-100 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Generate Report</span>
              </button>
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-green-50 to-blue-50 rounded-xl border border-green-200 p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🎉 Analysis Complete!</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>Your analysis is ready for publication. Consider:</p>
              <ul className="space-y-1 ml-4">
                <li>• Adding this figure to your manuscript</li>
                <li>• Running sensitivity analyses</li>
                <li>• Exploring subgroup analyses</li>
                <li>• Checking for additional covariates</li>
              </ul>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mt-8">
        <button 
          onClick={onBack}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 font-medium"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back</span>
        </button>
        <button 
          onClick={onNewAnalysis}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          New Analysis
        </button>
      </div>
    </div>
  );
};

export default ResultsView;