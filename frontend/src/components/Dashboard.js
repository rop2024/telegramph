import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../utils/api';
import AuthService from '../utils/auth';
import './Dashboard.css';

const Dashboard = () => {
  const [user, setUser] = useState(null);
  const [protectedData, setProtectedData] = useState('');
  const [loading, setLoading] = useState(false);
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
    </div>
  );
};

export default Dashboard;