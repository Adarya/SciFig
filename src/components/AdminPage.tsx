import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings,
  Users,
  BarChart3,
  FileText,
  Database,
  Shield,
  Activity,
  TrendingUp,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  DollarSign,
  Globe,
  Zap,
  Crown,
  Building
} from 'lucide-react';

interface AdminPageProps {
  onNavigate: NavigateFunction;
}

const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'analytics' | 'system'>('overview');

  // Mock admin data
  const stats = {
    totalUsers: 12543,
    activeUsers: 8921,
    totalAnalyses: 156789,
    monthlyRevenue: 45670,
    systemHealth: 99.8,
    storageUsed: 2.4, // TB
    apiCalls: 892341
  };

  const recentUsers = [
    { id: 1, name: 'Dr. Sarah Chen', email: 'sarah.chen@stanford.edu', plan: 'pro', joined: '2024-01-15', status: 'active' },
    { id: 2, name: 'Prof. Michael Rodriguez', email: 'm.rodriguez@harvard.edu', plan: 'enterprise', joined: '2024-01-14', status: 'active' },
    { id: 3, name: 'Dr. Emily Watson', email: 'e.watson@mayo.edu', plan: 'free', joined: '2024-01-13', status: 'trial' },
    { id: 4, name: 'Dr. James Liu', email: 'j.liu@ucsf.edu', plan: 'pro', joined: '2024-01-12', status: 'active' },
    { id: 5, name: 'Dr. Anna Kowalski', email: 'a.kowalski@mit.edu', plan: 'free', joined: '2024-01-11', status: 'active' }
  ];

  const systemAlerts = [
    { type: 'warning', message: 'High API usage detected - 95% of daily limit', time: '5 minutes ago' },
    { type: 'info', message: 'Database backup completed successfully', time: '2 hours ago' },
    { type: 'success', message: 'New deployment v2.1.3 completed', time: '6 hours ago' }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'system', name: 'System', icon: Settings }
  ];

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: 'bg-gray-100 text-gray-800',
      pro: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800'
    };
    
    const icons = {
      free: Zap,
      pro: Crown,
      enterprise: Building
    };

    const Icon = icons[plan as keyof typeof icons];
    
    return (
      <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${colors[plan as keyof typeof colors]}`}>
        <Icon className="h-3 w-3" />
        <span className="capitalize">{plan}</span>
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800',
      inactive: 'bg-red-100 text-red-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600">+12% from last month</p>
            </div>
            <Users className="h-12 w-12 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</p>
              <p className="text-sm text-green-600">+8% from last month</p>
            </div>
            <Activity className="h-12 w-12 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-900">{stats.totalAnalyses.toLocaleString()}</p>
              <p className="text-sm text-green-600">+25% from last month</p>
            </div>
            <BarChart3 className="h-12 w-12 text-purple-600" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${stats.monthlyRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+18% from last month</p>
            </div>
            <DollarSign className="h-12 w-12 text-orange-600" />
          </div>
        </div>
      </div>

      {/* System Health */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Uptime</span>
              <span className="text-sm font-medium text-green-600">{stats.systemHealth}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: `${stats.systemHealth}%` }}></div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Storage Used</span>
              <span className="text-sm font-medium text-blue-600">{stats.storageUsed} TB</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '48%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Calls Today</span>
              <span className="text-sm font-medium text-purple-600">{stats.apiCalls.toLocaleString()}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '75%' }}></div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Alerts</h3>
          <div className="space-y-3">
            {systemAlerts.map((alert, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50">
                {alert.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />}
                {alert.type === 'info' && <Clock className="h-5 w-5 text-blue-600 mt-0.5" />}
                {alert.type === 'success' && <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />}
                <div className="flex-1">
                  <p className="text-sm text-gray-900">{alert.message}</p>
                  <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <div className="flex items-center space-x-3">
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
            Export Users
          </button>
          <button className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-medium text-gray-900">User</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Plan</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Status</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Joined</th>
                <th className="text-left py-3 px-6 font-medium text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getPlanBadge(user.plan)}
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(user.status)}
                  </td>
                  <td className="py-4 px-6 text-sm text-gray-500">
                    {new Date(user.joined).toLocaleDateString()}
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">Analytics Dashboard</h3>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Usage Trends</h4>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Chart placeholder - Usage over time</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Popular Features</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">T-Test Analysis</span>
              <span className="text-sm font-medium">45%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-blue-600 h-2 rounded-full" style={{ width: '45%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">ANOVA</span>
              <span className="text-sm font-medium">32%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-green-600 h-2 rounded-full" style={{ width: '32%' }}></div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Survival Analysis</span>
              <span className="text-sm font-medium">23%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-purple-600 h-2 rounded-full" style={{ width: '23%' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">System Administration</h3>
      
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Database Status</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Connection Pool</span>
              <span className="text-sm font-medium text-green-600">Healthy</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Query Performance</span>
              <span className="text-sm font-medium text-green-600">Optimal</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Backup</span>
              <span className="text-sm font-medium text-gray-900">2 hours ago</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h4 className="font-medium text-gray-900 mb-4">Quick Actions</h4>
          <div className="space-y-3">
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
              Run System Diagnostics
            </button>
            <button className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors">
              Backup Database
            </button>
            <button className="w-full bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors">
              Clear Cache
            </button>
            <button className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors">
              Emergency Maintenance
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Shield className="h-8 w-8 text-red-600" />
              <h1 className="text-xl font-semibold text-gray-900">SciFig AI Admin</h1>
              <span className="bg-red-100 text-red-800 text-xs font-medium px-2 py-1 rounded-full">
                Admin Access
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('landing')}
                className="text-gray-600 hover:text-gray-900 font-medium"
              >
                Back to App
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                  A
                </div>
                <span className="text-gray-700">Admin User</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <TabIcon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'users' && renderUsers()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'system' && renderSystem()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;