import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// Set base URL for API calls
axios.defaults.baseURL = process.env.REACT_APP_API_URL;

function App() {
  const [serverStatus, setServerStatus] = useState('');
  const [testMessage, setTestMessage] = useState('');

  // Test server connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const healthResponse = await axios.get('/health');
        setServerStatus(healthResponse.data.status);
        
        const testResponse = await axios.get('/test');
        setTestMessage(testResponse.data.message);
      } catch (error) {
        console.error('Connection error:', error);
        setServerStatus('Failed to connect to server');
      }
    };

    testConnection();
  }, []);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Project Setup Complete 🎉</h1>
        <div className="status-container">
          <h2>Connection Status</h2>
          <p><strong>Server:</strong> {serverStatus || 'Testing...'}</p>
          <p><strong>Test Message:</strong> {testMessage || 'Loading...'}</p>
        </div>
        <p>
          React Frontend + Express Backend + MongoDB Atlas
        </p>
      </header>
    </div>
  );
}

export default App;
