import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Mail,
  Eye,
  MousePointer,
  XCircle,
  CheckCircle,
  Clock,
  Users,
  FileText
} from 'lucide-react';
import { mailAPI } from '../services/api';

const Analytics = () => {
  const [period, setPeriod] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      console.log(`📊 Fetching analytics for period: ${period}...`);
      
      const response = await mailAPI.getAnalytics({ period });
      console.log('✅ Analytics data received:', response.data.data);
      
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('❌ Failed to fetch analytics:', error);
      console.error('   Error message:', error.message);
      if (error.response) {
        console.error('   Response status:', error.response.status);
        console.error('   Response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const periodOptions = [
    { value: '24h', label: 'Last 24 Hours' },
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">Failed to load analytics data</p>
      </div>
    );
  }

  const { statistics, recentActivity } = analytics;
  
  // Calculate total emails sent (excluding pending)
  const totalEmailsSent = (statistics.sent || 0) + (statistics.delivered || 0) + 
                          (statistics.opened || 0) + (statistics.clicked || 0);
  
  // Total including failed
  const totalEmails = totalEmailsSent + (statistics.failed || 0) + (statistics.bounced || 0);

  // Stats cards configuration
  const statsCards = [
    {
      name: 'Total Sent',
      value: totalEmails,
      icon: Mail,
      color: 'blue',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-600',
      description: 'Total emails sent in period'
    },
    {
      name: 'Delivered',
      value: statistics.delivered || 0,
      percentage: totalEmails > 0 ? (((statistics.delivered || 0) / totalEmails) * 100).toFixed(1) : 0,
      icon: CheckCircle,
      color: 'green',
      bgColor: 'bg-green-100',
      textColor: 'text-green-600',
      description: 'Successfully delivered emails'
    },
    {
      name: 'Opened',
      value: statistics.opened || 0,
      percentage: totalEmailsSent > 0 ? (((statistics.opened || 0) / totalEmailsSent) * 100).toFixed(1) : 0,
      icon: Eye,
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      description: 'Emails opened by recipients'
    },
    {
      name: 'Clicked',
      value: statistics.clicked || 0,
      percentage: totalEmailsSent > 0 ? (((statistics.clicked || 0) / totalEmailsSent) * 100).toFixed(1) : 0,
      icon: MousePointer,
      color: 'indigo',
      bgColor: 'bg-indigo-100',
      textColor: 'text-indigo-600',
      description: 'Emails with link clicks'
    },
    {
      name: 'Failed',
      value: (statistics.failed || 0) + (statistics.bounced || 0),
      percentage: totalEmails > 0 ? ((((statistics.failed || 0) + (statistics.bounced || 0)) / totalEmails) * 100).toFixed(1) : 0,
      icon: XCircle,
      color: 'red',
      bgColor: 'bg-red-100',
      textColor: 'text-red-600',
      description: 'Failed delivery attempts'
    },
    {
      name: 'Open Rate',
      value: `${statistics.openRate || '0.00'}%`,
      icon: TrendingUp,
      color: 'amber',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
      description: 'Percentage of opened emails'
    }
  ];

  // Engagement metrics
  const engagementMetrics = [
    {
      name: 'Delivery Rate',
      value: `${statistics.deliveryRate || '0.00'}%`,
      target: '95%',
      status: parseFloat(statistics.deliveryRate || 0) >= 95 ? 'good' : 'warning'
    },
    {
      name: 'Open Rate',
      value: `${statistics.openRate || '0.00'}%`,
      target: '20%',
      status: parseFloat(statistics.openRate || 0) >= 20 ? 'good' : 'warning'
    },
    {
      name: 'Click Rate',
      value: `${statistics.clickRate || '0.00'}%`,
      target: '3%',
      status: parseFloat(statistics.clickRate || 0) >= 3 ? 'good' : 'warning'
    },
    {
      name: 'Click-to-Open Rate',
      value: `${statistics.clickToOpenRate || '0.00'}%`,
      target: '15%',
      status: parseFloat(statistics.clickToOpenRate || 0) >= 15 ? 'good' : 'warning'
    }
  ];

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Analytics</h1>
          <p className="mt-2 text-gray-600">
            Track your email campaign performance and engagement metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="input"
          >
            {periodOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Overview Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-8">
        {statsCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="card p-6">
              <div className="flex items-center justify-between mb-3">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <Icon className={`h-5 w-5 ${card.textColor}`} />
                </div>
                {card.percentage && (
                  <span className={`text-xs font-medium ${card.textColor}`}>
                    {card.percentage}%
                  </span>
                )}
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{card.value}</p>
              <p className="text-xs text-gray-500">{card.name}</p>
            </div>
          );
        })}
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary-600" />
            Performance Metrics
          </h3>
          <div className="space-y-4">
            {engagementMetrics.map((metric) => (
              <div key={metric.name}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{metric.value}</span>
                    <span className="text-xs text-gray-500">
                      (Target: {metric.target})
                    </span>
                    {metric.status === 'good' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-amber-500" />
                    )}
                  </div>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      metric.status === 'good' ? 'bg-green-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${Math.min(parseFloat(metric.value), 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-primary-600" />
            Engagement Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Mail className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Emails</p>
                  <p className="text-xl font-bold text-gray-900">{totalEmails}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <Eye className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Opens</p>
                  <p className="text-xl font-bold text-gray-900">{statistics.totalOpens || 0}</p>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
              <div className="flex items-center gap-3">
                <MousePointer className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                  <p className="text-xl font-bold text-gray-900">{statistics.totalClicks || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {recentActivity && recentActivity.length > 0 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-primary-600" />
              Recent Activity
            </h3>
            <Link to="/logs" className="text-sm text-primary-600 hover:text-primary-700">
              View All Logs →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Subject
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Recipient
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Engagement
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {recentActivity.slice(0, 10).map((activity) => {
                  const statusConfig = {
                    sent: { color: 'bg-blue-100 text-blue-800', label: 'Sent' },
                    delivered: { color: 'bg-green-100 text-green-800', label: 'Delivered' },
                    opened: { color: 'bg-purple-100 text-purple-800', label: 'Opened' },
                    clicked: { color: 'bg-indigo-100 text-indigo-800', label: 'Clicked' },
                    failed: { color: 'bg-red-100 text-red-800', label: 'Failed' },
                    bounced: { color: 'bg-orange-100 text-orange-800', label: 'Bounced' }
                  };
                  const config = statusConfig[activity.status] || statusConfig.sent;

                  return (
                    <tr key={activity._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 truncate max-w-xs">
                          {activity.subject}
                        </p>
                        {activity.draft?.title && (
                          <p className="text-xs text-gray-500">
                            {activity.draft.title}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-900">
                          {activity.receiver?.name || activity.receiverName}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.receiverEmail}
                        </p>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3 text-xs">
                          {activity.openCount > 0 && (
                            <span className="flex items-center text-purple-600">
                              <Eye className="h-3 w-3 mr-1" />
                              {activity.openCount}
                            </span>
                          )}
                          {activity.clickCount > 0 && (
                            <span className="flex items-center text-indigo-600">
                              <MousePointer className="h-3 w-3 mr-1" />
                              {activity.clickCount}
                            </span>
                          )}
                          {activity.openCount === 0 && activity.clickCount === 0 && (
                            <span className="text-gray-400">-</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(activity.sentAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* No Data State */}
      {totalEmails === 0 && (
        <div className="card p-12 text-center">
          <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Yet</h3>
          <p className="text-gray-600 mb-6">
            Start sending emails to see your analytics and engagement metrics here
          </p>
          <Link to="/send" className="btn btn-primary inline-flex items-center">
            <Mail className="h-4 w-4 mr-2" />
            Send Your First Email
          </Link>
        </div>
      )}
    </div>
  );
};

export default Analytics;
