import React, { useState, useEffect } from 'react';
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
  Building,
  Edit,
  Trash2,
  Plus,
  RotateCcw,
  UserPlus,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../providers/ApiAuthProvider';
import { apiClient } from '../services/apiClient';

interface AdminPageProps {
  onNavigate: NavigateFunction;
}

interface SystemStats {
  total_users: number;
  active_users_today: number;
  active_users_week: number;
  total_analyses: number;
  analyses_today: number;
  analyses_week: number;
  total_storage_gb: number;
  api_calls_today: number;
  system_health: number;
}

interface UserUsage {
  user_id: string;
  user_email: string;
  user_name: string | null;
  user_role: string;
  statistical_analysis_used: number;
  statistical_analysis_limit: number;
  figure_analysis_used: number;
  figure_analysis_limit: number;
  last_activity: string | null;
  is_unlimited: boolean;
}

interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  organization: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

const AdminPage: React.FC<AdminPageProps> = ({ onNavigate }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'usage' | 'analytics' | 'system'>('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userUsage, setUserUsage] = useState<UserUsage[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserUsage | null>(null);
  const [showPasswordField, setShowPasswordField] = useState(false);
  
  // Form states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    full_name: '',
    organization: '',
    role: 'user'
  });

  const { user, getAccessToken } = useAuth();

  useEffect(() => {
    if (user && user.role === 'admin') {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    if (!user || user.role !== 'admin') {
      setError('Access denied. Admin privileges required.');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const [statsData, usersData, usageData] = await Promise.all([
        apiClient.admin.getStats(),
        apiClient.admin.getUsers(),
        apiClient.admin.getUsersUsage()
      ]);
      
      setStats(statsData as SystemStats);
      setUsers(usersData as User[]);
      setUserUsage(usageData as UserUsage[]);
    } catch (error) {
      setError('Failed to load dashboard data. Please try again.');
      console.error('Dashboard load error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await apiClient.admin.updateUserRole(userId, newRole);
      await loadDashboardData(); // Reload data
    } catch (error) {
      setError('Failed to update user role');
    }
  };

  const handleResetUserUsage = async (userId: string, featureType?: string) => {
    try {
      await apiClient.admin.resetUserUsage(userId, featureType);
      await loadDashboardData(); // Reload data
    } catch (error) {
      setError('Failed to reset user usage');
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.password) {
      setError('Email and password are required');
      return;
    }

    try {
      await apiClient.admin.createUser(newUser);
      setShowCreateUser(false);
      setNewUser({ email: '', password: '', full_name: '', organization: '', role: 'user' });
      setShowPasswordField(false);
      await loadDashboardData(); // Reload data
    } catch (error) {
      setError('Failed to create user');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      await apiClient.admin.deleteUser(userId);
      await loadDashboardData(); // Reload data
    } catch (error) {
      setError('Failed to delete user');
    }
  };

  // Check admin access
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8">
          <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Authentication Required</h1>
          <p className="text-gray-600 mb-4">Please sign in to access the admin panel.</p>
          <button
            onClick={() => onNavigate('landing')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center p-8">
          <AlertTriangle className="h-16 w-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-4">You need admin privileges to access this page.</p>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'users', name: 'Users', icon: Users },
    { id: 'usage', name: 'Usage Management', icon: Activity },
    { id: 'analytics', name: 'Analytics', icon: TrendingUp },
    { id: 'system', name: 'System', icon: Settings }
  ];

  const getRoleBadge = (role: string) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      researcher: 'bg-purple-100 text-purple-800',
      analyst: 'bg-blue-100 text-blue-800',
      user: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[role as keyof typeof colors] || colors.user}`}>
        {role}
      </span>
    );
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_users || 0}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Today</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.active_users_today || 0}</p>
            </div>
            <Activity className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Analyses</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.total_analyses || 0}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Health</p>
              <p className="text-3xl font-bold text-gray-900">{stats?.system_health || 99}%</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Status</h3>
        <div className="space-y-3">
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">Database connectivity: Healthy</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">API endpoints: Operational</span>
          </div>
          <div className="flex items-center space-x-3">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-gray-700">Authentication service: Active</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">User Management</h3>
        <button
          onClick={() => setShowCreateUser(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create User</span>
        </button>
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New User</h3>
            <div className="space-y-4">
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <div className="relative">
                <input
                  type={showPasswordField ? "text" : "password"}
                  placeholder="Password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswordField(!showPasswordField)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswordField ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <input
                type="text"
                placeholder="Full Name (optional)"
                value={newUser.full_name}
                onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Organization (optional)"
                value={newUser.organization}
                onChange={(e) => setNewUser({...newUser, organization: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="user">User</option>
                <option value="analyst">Analyst</option>
                <option value="researcher">Researcher</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleCreateUser}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create User
              </button>
              <button
                onClick={() => {
                  setShowCreateUser(false);
                  setNewUser({ email: '', password: '', full_name: '', organization: '', role: 'user' });
                  setShowPasswordField(false);
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.full_name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                      className="text-sm px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="user">User</option>
                      <option value="analyst">Analyst</option>
                      <option value="researcher">Researcher</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.organization || 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      onClick={() => handleDeleteUser(user.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
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

  const renderUsageManagement = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Usage Management</h3>
        <button
          onClick={loadDashboardData}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statistical Analyses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Figure Analyses</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {userUsage.map((usage) => (
                <tr key={usage.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{usage.user_name || 'No name'}</div>
                      <div className="text-sm text-gray-500">{usage.user_email}</div>
                      <div className="text-xs text-gray-400">{getRoleBadge(usage.user_role)}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {usage.statistical_analysis_used} / {usage.is_unlimited ? '∞' : usage.statistical_analysis_limit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{
                          width: usage.is_unlimited ? '100%' : `${Math.min(100, (usage.statistical_analysis_used / usage.statistical_analysis_limit) * 100)}%`
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {usage.figure_analysis_used} / {usage.is_unlimited ? '∞' : usage.figure_analysis_limit}
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                      <div 
                        className="bg-purple-600 h-2 rounded-full" 
                        style={{
                          width: usage.is_unlimited ? '100%' : `${Math.min(100, (usage.figure_analysis_used / usage.figure_analysis_limit) * 100)}%`
                        }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {usage.last_activity ? new Date(usage.last_activity).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleResetUserUsage(usage.user_id, 'statistical_analysis')}
                        className="text-blue-600 hover:text-blue-800 transition-colors text-xs"
                        title="Reset Statistical Analysis Usage"
                      >
                        Reset Stats
                      </button>
                      <button
                        onClick={() => handleResetUserUsage(usage.user_id, 'figure_analysis')}
                        className="text-purple-600 hover:text-purple-800 transition-colors text-xs"
                        title="Reset Figure Analysis Usage"
                      >
                        Reset Figs
                      </button>
                      <button
                        onClick={() => handleResetUserUsage(usage.user_id)}
                        className="text-green-600 hover:text-green-800 transition-colors text-xs"
                        title="Reset All Usage"
                      >
                        Reset All
                      </button>
                    </div>
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
      <h3 className="text-lg font-semibold text-gray-900">System Analytics</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Weekly Activity</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyses This Week</span>
              <span className="font-medium">{stats?.analyses_week || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Active Users This Week</span>
              <span className="font-medium">{stats?.active_users_week || 0}</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Today's Activity</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Analyses Today</span>
              <span className="font-medium">{stats?.analyses_today || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Active Users Today</span>
              <span className="font-medium">{stats?.active_users_today || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSystem = () => (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900">System Management</h3>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-4">System Information</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">System Health</label>
            <div className="mt-1 text-lg font-semibold text-green-600">{stats?.system_health || 99}%</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Storage Used</label>
            <div className="mt-1 text-lg font-semibold text-blue-600">{stats?.total_storage_gb || 0} GB</div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h4 className="text-md font-semibold text-gray-900 mb-4">Quick Actions</h4>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={loadDashboardData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh Data</span>
          </button>
          <button
            onClick={() => onNavigate('dashboard')}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
              <p className="text-gray-600 mt-1">Manage users, usage, and system settings</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                Logged in as: <span className="font-medium">{user.email}</span>
              </div>
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-700">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
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
                    <Icon className="h-4 w-4" />
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
          {activeTab === 'usage' && renderUsageManagement()}
          {activeTab === 'analytics' && renderAnalytics()}
          {activeTab === 'system' && renderSystem()}
        </motion.div>
      </div>
    </div>
  );
};

export default AdminPage;