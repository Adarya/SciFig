import React from 'react';
import { motion } from 'framer-motion';
import { 
  Plus, 
  FileText, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  Upload,
  Clock,
  CheckCircle,
  TrendingUp
} from 'lucide-react';

interface DashboardProps {
  user: any;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate, onLogout }) => {
  const recentProjects = [
    {
      id: 1,
      name: 'COVID-19 Treatment Study',
      lastModified: '2 days ago',
      status: 'completed',
      type: 'Clinical Trial'
    },
    {
      id: 2,
      name: 'Drug Efficacy Analysis',
      lastModified: '5 days ago',
      status: 'in-progress',
      type: 'Randomized Trial'
    },
    {
      id: 3,
      name: 'Biomarker Correlation',
      lastModified: '1 week ago',
      status: 'completed',
      type: 'Observational'
    }
  ];

  const stats = [
    { label: 'Analyses Completed', value: 12, icon: CheckCircle, color: 'text-green-600' },
    { label: 'Figures Generated', value: 8, icon: BarChart3, color: 'text-blue-600' },
    { label: 'Papers Submitted', value: 3, icon: FileText, color: 'text-purple-600' },
    { label: 'Time Saved (hours)', value: 48, icon: Clock, color: 'text-orange-600' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">SciFig AI</h1>
              <nav className="hidden md:flex space-x-8">
                <button className="text-blue-600 font-medium">Dashboard</button>
                <button className="text-gray-500 hover:text-gray-700">Projects</button>
                <button className="text-gray-500 hover:text-gray-700">Templates</button>
                <button className="text-gray-500 hover:text-gray-700">Help</button>
              </nav>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('analysis')}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                New Project
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-gray-700">{user?.name || 'User'}</span>
                <button 
                  onClick={onLogout}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Welcome Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white"
            >
              <h2 className="text-3xl font-bold mb-2">Welcome back, {user?.name?.split(' ')[0] || 'User'}!</h2>
              <p className="text-blue-100 mb-6">Ready to create your next publication-ready analysis?</p>
              <div className="flex gap-4">
                <button 
                  onClick={() => onNavigate('analysis')}
                  className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Data
                </button>
                <button 
                  onClick={() => onNavigate('figure-analyzer')}
                  className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  Analyze Figure
                </button>
              </div>
            </motion.div>

            {/* Recent Projects */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">Recent Projects</h3>
                <button className="text-blue-600 hover:text-blue-700 font-medium">View All</button>
              </div>
              <div className="space-y-4">
                {recentProjects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{project.name}</h4>
                        <p className="text-sm text-gray-500">{project.type} • {project.lastModified}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        project.status === 'completed' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {project.status === 'completed' ? 'Completed' : 'In Progress'}
                      </span>
                      <button className="text-blue-600 hover:text-blue-700 font-medium">Continue</button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Start */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Quick Start</h3>
              <button 
                onClick={() => onNavigate('analysis')}
                className="w-full bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:bg-blue-100 transition-colors group"
              >
                <Upload className="h-12 w-12 text-blue-600 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <p className="text-blue-600 font-semibold">Upload Data</p>
                <p className="text-blue-500 text-sm mt-1">CSV, Excel, or SPSS files</p>
              </button>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-4">Your Stats This Month</h3>
              <div className="space-y-4">
                {stats.map((stat, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <stat.icon className={`h-5 w-5 ${stat.color}`} />
                      <span className="text-gray-700">{stat.label}</span>
                    </div>
                    <span className="font-bold text-gray-900">{stat.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Tips */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-200"
            >
              <h3 className="text-lg font-bold text-gray-900 mb-3">💡 Pro Tip</h3>
              <p className="text-gray-700 text-sm mb-4">
                Use natural language to describe your analysis goals. Our AI will recommend the best statistical approach.
              </p>
              <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                Learn More →
              </button>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;