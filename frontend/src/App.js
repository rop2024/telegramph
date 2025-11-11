import React from 'react';import React from 'react';

import './App.css';import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './components/Login';

function App() {import Register from './components/Register';

  return (import Dashboard from './components/Dashboard';

    <div className="App">import AuthService from './utils/auth';

      <header className="App-header">import './App.css';

        <h1>Telegraph</h1>

        <p>Welcome to the Telegraph frontend (development stub).</p>// Protected Route Component

      </header>const ProtectedRoute = ({ children }) => {

    </div>  return AuthService.isAuthenticated() ? children : <Navigate to="/login" />;

  );};

}

// Public Route Component (redirect to dashboard if already authenticated)

export default App;const PublicRoute = ({ children }) => {

  return !AuthService.isAuthenticated() ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" />} />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          {/* Add a catch-all route */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
