import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import ReceiverList from './ReceiverList';
import AddReceiverForm from './AddReceiverForm';
import ReceiverStats from './ReceiverStats';
import './ReceiverManager.css';

const ReceiverManager = () => {
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [pagination, setPagination] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({ total: 0, recent: 0 });

  const fetchReceivers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await API.get('/receivers', {
        params: { page, limit: 10, search }
      });
      
      if (response.data.success) {
        setReceivers(response.data.data.receivers);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching receivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/receivers/stats/count');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchReceivers();
    fetchStats();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchReceivers(1, searchTerm);
  };

  const handlePageChange = (newPage) => {
    fetchReceivers(newPage, searchTerm);
  };

  const handleReceiverAdded = (newReceiver) => {
    setReceivers(prev => [newReceiver, ...prev]);
    setShowAddForm(false);
    fetchStats(); // Refresh stats
  };

  const handleReceiverUpdated = (updatedReceiver) => {
    setReceivers(prev => 
      prev.map(rec => 
        rec._id === updatedReceiver._id ? updatedReceiver : rec
      )
    );
  };

  const handleReceiverDeleted = (receiverId) => {
    setReceivers(prev => prev.filter(rec => rec._id !== receiverId));
    fetchStats(); // Refresh stats
  };

  return (
    <div className="receiver-manager">
      <div className="receiver-header">
        <h1>Receiver Management</h1>
        <p>Securely manage your email recipients</p>
      </div>

      <ReceiverStats stats={stats} />

      <div className="receiver-actions">
        <div className="search-box">
          <form onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Search receivers by name, company, or tags..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">Search</button>
          </form>
        </div>
        
        <button 
          className="btn btn-primary"
          onClick={() => setShowAddForm(true)}
        >
          + Add New Receiver
        </button>
      </div>

      {showAddForm && (
        <AddReceiverForm
          onReceiverAdded={handleReceiverAdded}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      <ReceiverList
        receivers={receivers}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
        onReceiverUpdated={handleReceiverUpdated}
        onReceiverDeleted={handleReceiverDeleted}
        onRefresh={() => fetchReceivers(pagination.currentPage, searchTerm)}
      />
    </div>
  );
};

export default ReceiverManager;