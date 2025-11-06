import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import AuthService from '../utils/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [protectedData, setProtectedData] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
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
    return <div>Loading...</div>;
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout} className="btn btn-secondary">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button 
            className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={`tab-button ${activeTab === 'receivers' ? 'active' : ''}`}
            onClick={() => setActiveTab('receivers')}
          >
            Receiver Management
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="tab-content">
            <div className="user-card">
              <h3>User Information</h3>
              <p><strong>Username:</strong> {user.username}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Role:</strong> {user.role}</p>
            </div>

            <div className="protected-test">
              <h3>Protected Route Test</h3>
              <button 
                onClick={testProtectedRoute} 
                className="btn btn-primary"
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
        )}

        {activeTab === 'receivers' && (
          <div className="tab-content">
            {/* ReceiverManager will be imported and used here */}
            <p>Receiver management interface will be implemented in the next step.</p>
            <p>This will include:</p>
            <ul>
              <li>Add new receivers with encrypted email storage</li>
              <li>View and manage your receiver list</li>
              <li>Edit and delete receivers</li>
              <li>Search and filter functionality</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;