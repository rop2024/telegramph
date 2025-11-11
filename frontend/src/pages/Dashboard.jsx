import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  FileText, 
  Mail, 
  BarChart3, 
  ArrowUp,
  ArrowDown,
  Plus
} from 'lucide-react';
import { draftsAPI, receiversAPI, mailAPI } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    receivers: 0,
    drafts: 0,
    sent: 0,
    deliveryRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [receiversRes, draftsRes, analyticsRes] = await Promise.all([
        receiversAPI.getStats(),
        draftsAPI.getStats(),
        mailAPI.getAnalytics({ period: '7d' })
      ]);

      setStats({
        receivers: receiversRes.data.data.total || 0,
        drafts: draftsRes.data.data.total || 0,
        sent: analyticsRes.data.data.statistics.sent || 0,
        deliveryRate: analyticsRes.data.data.statistics.deliveryRate || 0
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      name: 'Total Receivers',
      value: stats.receivers,
      icon: Users,
      change: '+4.75%',
      changeType: 'increase',
      href: '/receivers',
      buttonText: 'Add Receiver',
      buttonIcon: Plus
    },
    {
      name: 'Email Drafts',
      value: stats.drafts,
      icon: FileText,
      change: '+12.5%',
      changeType: 'increase',
      href: '/drafts',
      buttonText: 'Create Draft',
      buttonIcon: Plus
    },
    {
      name: 'Emails Sent',
      value: stats.sent,
      icon: Mail,
      change: '+2.5%',
      changeType: 'increase',
      href: '/logs',
      buttonText: 'View Logs',
      buttonIcon: BarChart3
    },
    {
      name: 'Delivery Rate',
      value: `${stats.deliveryRate}%`,
      icon: BarChart3,
      change: '+1.2%',
      changeType: 'increase',
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
                  <div className={`flex items-center text-sm ${
                    card.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {card.changeType === 'increase' ? (
                      <ArrowUp className="h-4 w-4 mr-1" />
                    ) : (
                      <ArrowDown className="h-4 w-4 mr-1" />
                    )}
                    {card.change}
                  </div>
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
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Welcome to Telegraph</p>
                <p className="text-sm text-gray-500">Get started by creating your first email draft</p>
              </div>
              <span className="text-xs text-gray-400">Just now</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-gray-900">Add your receivers</p>
                <p className="text-sm text-gray-500">Import or manually add email recipients</p>
              </div>
              <span className="text-xs text-gray-400">1 min ago</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;