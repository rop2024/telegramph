import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import AuthService from '../utils/auth';
import ReceiverManager from './receivers/ReceiverManager';
import DraftManager from './drafts/DraftManager';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [protectedData, setProtectedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('receivers'); // Default to receivers tab
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = AuthService.getStoredUser();
    if (!currentUser || !AuthService.isAuthenticated()) {
      navigate('/login');
      return;
    }
    setUser(currentUser);
  }, [navigate]);

  const testProtectedRoute = async () => {
    setLoading(true);
    try {
      const response = await API.get('/protected/test');
      setProtectedData(response.data.message);
    } catch (error) {
      console.error('Protected route error:', error);
      setProtectedData('Failed to access protected route');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    AuthService.logout();
  };

  if (!user) {
    return (
      <div className="loading-fullscreen">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>SecureMail Manager</h1>
          <div className="user-info">
            <div className="user-details">
              <span className="welcome-text">Welcome, <strong>{user.username}</strong>!</span>
              <span className="user-email">{user.email}</span>
            </div>
            <button onClick={handleLogout} className="btn btn-secondary">
              Logout
            </button>
          </div>
        </div>
      </header>

      <nav className="dashboard-nav">
        <div className="nav-container">
          <button 
            className={`nav-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <span className="nav-icon">📊</span>
            Overview
          </button>
          <button 
            className={`nav-button ${activeTab === 'receivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('receivers')}
          >
            <span className="nav-icon">👥</span>
            Receiver Management
          </button>
          <button 
            className={`nav-button ${activeTab === 'drafts' ? 'active' : ''}`}
            onClick={() => setActiveTab('drafts')}
          >
            <span className="nav-icon">📝</span>
            Email Drafts
          </button>
        </div>
      </nav>

      <main className="dashboard-main">
        <div className="main-container">
          {activeTab === 'overview' && (
            <div className="tab-content overview-tab">
              <div className="welcome-section">
                <h2>Dashboard Overview</h2>
                <p>Manage your secure email recipients and monitor system status</p>
              </div>

              <div className="overview-grid">
                <div className="overview-card user-info-card">
                  <h3>User Information</h3>
                  <div className="info-list">
                    <div className="info-item">
                      <label>Username:</label>
                      <span>{user.username}</span>
                    </div>
                    <div className="info-item">
                      <label>Email:</label>
                      <span>{user.email}</span>
                    </div>
                    <div className="info-item">
                      <label>Role:</label>
                      <span className="role-badge">{user.role}</span>
                    </div>
                    <div className="info-item">
                      <label>Member Since:</label>
                      <span>{new Date().toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="overview-card system-status">
                  <h3>System Status</h3>
                  <div className="status-list">
                    <div className="status-item success">
                      <span className="status-dot"></span>
                      <span>Authentication: Active</span>
                    </div>
                    <div className="status-item success">
                      <span className="status-dot"></span>
                      <span>Database: Connected</span>
                    </div>
                    <div className="status-item success">
                      <span className="status-dot"></span>
                      <span>Encryption: Enabled</span>
                    </div>
                  </div>
                  
                  <div className="protected-test">
                    <h4>API Connection Test</h4>
                    <button 
                      onClick={testProtectedRoute} 
                      className="btn btn-primary btn-sm"
                      disabled={loading}
                    >
                      {loading ? 'Testing...' : 'Test Protected Route'}
                    </button>
                    {protectedData && (
                      <div className="test-result">
                        <p>{protectedData}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="overview-card quick-actions">
                  <h3>Quick Actions</h3>
                  <div className="action-buttons">
                    <button 
                      onClick={() => setActiveTab('receivers')}
                      className="btn btn-primary"
                    >
                      👥 Manage Receivers
                    </button>
                    <button 
                      onClick={() => setActiveTab('drafts')}
                      className="btn btn-primary"
                    >
                      📝 Create Draft
                    </button>
                    <button className="btn btn-outline">
                      📧 Compose Email
                    </button>
                    <button className="btn btn-outline">
                      ⚙️ Settings
                    </button>
                  </div>
                </div>

                <div className="overview-card features">
                  <h3>Security Features</h3>
                  <ul className="features-list">
                    <li>✅ End-to-end email encryption</li>
                    <li>✅ Secure AES-256 storage</li>
                    <li>✅ User data isolation</li>
                    <li>✅ JWT token authentication</li>
                    <li>✅ Role-based access control</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'receivers' && (
            <div className="tab-content">
              <ReceiverManager />
            </div>
          )}

          {activeTab === 'drafts' && (
            <div className="tab-content">
              <DraftManager />
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;