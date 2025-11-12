import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Mail, 
  BarChart3, 
  Plus
} from 'lucide-react';
import { draftsAPI, receiversAPI, mailAPI } from '../services/api';

// Helper function to format time ago
const formatTimeAgo = (date) => {
  const seconds = Math.floor((new Date() - date) / 1000);
  
  const intervals = {
    year: 31536000,
    month: 2592000,
    week: 604800,
    day: 86400,
    hour: 3600,
    minute: 60
  };
  
  for (const [unit, secondsInUnit] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInUnit);
    if (interval >= 1) {
      return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
    }
  }
  
  return 'Just now';
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    receivers: 0,
    drafts: 0,
    sent: 0,
    deliveryRate: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📊 Fetching dashboard data...');
      
      const [receiversRes, draftsRes, analyticsRes] = await Promise.all([
        receiversAPI.getStats(),
        draftsAPI.getStats(),
        mailAPI.getAnalytics({ period: '7d' })
      ]);

      console.log('✅ Dashboard data fetched successfully');
      console.log('   Receivers:', receiversRes.data.data.total || 0);
      console.log('   Drafts:', draftsRes.data.data.total || 0);
      console.log('   Emails Sent:', analyticsRes.data.data.statistics.sent || 0);
      console.log('   Recent Activity Items:', analyticsRes.data.data.recentActivity?.length || 0);

      setStats({
        receivers: receiversRes.data.data.total || 0,
        drafts: draftsRes.data.data.total || 0,
        sent: analyticsRes.data.data.statistics.sent || 0,
        deliveryRate: analyticsRes.data.data.statistics.deliveryRate || 0
      });

      setRecentActivity(analyticsRes.data.data.recentActivity || []);
      
    } catch (error) {
      console.error('❌ Failed to fetch dashboard data:', error);
      console.error('   Error message:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Receivers',
      value: stats.receivers,
      icon: Users,
      href: '/receivers',
      buttonText: 'Add Receiver',
      buttonIcon: Plus
    },
    {
      name: 'Email Drafts',
      value: stats.drafts,
      icon: FileText,
      href: '/drafts',
      buttonText: 'Create Draft',
      buttonIcon: Plus
    },
    {
      name: 'Emails Sent',
      value: stats.sent,
      icon: Mail,
      href: '/logs',
      buttonText: 'View Logs',
      buttonIcon: BarChart3
    },
    {
      name: 'Delivery Rate',
      value: `${stats.deliveryRate}%`,
      icon: BarChart3,
      href: '/analytics',
      buttonText: 'View Analytics',
      buttonIcon: BarChart3
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Welcome back! Here's what's happening with your email campaigns.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          const ButtonIcon = card.buttonIcon;
          return (
            <div key={card.name} className="card p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-primary-100 rounded-lg">
                    <Icon className="h-6 w-6 text-primary-600" />
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <p className="text-sm font-medium text-gray-600">{card.name}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  to={card.href}
                  className="btn btn-primary w-full flex items-center justify-center text-sm"
                >
                  <ButtonIcon className="h-4 w-4 mr-2" />
                  {card.buttonText}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/receivers/new"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Users className="h-5 w-5 text-gray-400 mr-3" />
              <span>Add New Receiver</span>
            </Link>
            <Link
              to="/drafts/new"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FileText className="h-5 w-5 text-gray-400 mr-3" />
              <span>Create New Draft</span>
            </Link>
            <Link
              to="/logs"
              className="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <span>View Email Logs</span>
            </Link>
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                // Format time ago
                const timeAgo = formatTimeAgo(new Date(activity.sentAt));
                
                // Determine status color and icon
                const statusConfig = {
                  sent: { color: 'text-blue-600', bg: 'bg-blue-50', label: 'Sent' },
                  delivered: { color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' },
                  opened: { color: 'text-purple-600', bg: 'bg-purple-50', label: 'Opened' },
                  clicked: { color: 'text-indigo-600', bg: 'bg-indigo-50', label: 'Clicked' },
                  failed: { color: 'text-red-600', bg: 'bg-red-50', label: 'Failed' },
                  bounced: { color: 'text-orange-600', bg: 'bg-orange-50', label: 'Bounced' },
                  pending: { color: 'text-gray-600', bg: 'bg-gray-50', label: 'Pending' }
                };
                
                const config = statusConfig[activity.status] || statusConfig.pending;
                
                return (
                  <div 
                    key={activity._id} 
                    className={`flex items-start justify-between p-3 ${config.bg} rounded-lg border border-gray-100`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mail className={`h-4 w-4 ${config.color}`} />
                        <p className="text-sm font-medium text-gray-900">
                          {activity.subject || 'No Subject'}
                        </p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${config.color} ${config.bg} border border-current border-opacity-20`}>
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 ml-6">
                        To: <span className="font-medium">{activity.receiver?.name || activity.receiverName}</span>
                        {activity.receiverEmail && (
                          <span className="text-gray-400"> ({activity.receiverEmail})</span>
                        )}
                      </p>
                      {activity.draft?.title && (
                        <p className="text-xs text-gray-500 ml-6 mt-0.5">
                          Draft: {activity.draft.title}
                        </p>
                      )}
                      {activity.openCount > 0 && (
                        <p className="text-xs text-purple-600 ml-6 mt-0.5">
                          📖 Opened {activity.openCount} time{activity.openCount > 1 ? 's' : ''}
                        </p>
                      )}
                      {activity.clickCount > 0 && (
                        <p className="text-xs text-indigo-600 ml-6 mt-0.5">
                          🔗 Clicked {activity.clickCount} time{activity.clickCount > 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 whitespace-nowrap ml-3">{timeAgo}</span>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">No recent activity</p>
                <p className="text-sm text-gray-500 mb-4">
                  Start by creating a draft and sending your first email
                </p>
                <Link
                  to="/drafts/new"
                  className="btn btn-primary inline-flex items-center text-sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create Draft
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;