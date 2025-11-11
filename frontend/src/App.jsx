import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Receivers from './pages/Receivers';
import Drafts from './pages/Drafts';
import Logs from './pages/Logs';
import SendMail from './pages/SendMail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/receivers" element={
            <ProtectedRoute>
              <Layout>
                <Receivers />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/drafts" element={
            <ProtectedRoute>
              <Layout>
                <Drafts />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/send" element={
            <ProtectedRoute>
              <Layout>
                <SendMail />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="/logs" element={
            <ProtectedRoute>
              <Layout>
                <Logs />
              </Layout>
            </ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;