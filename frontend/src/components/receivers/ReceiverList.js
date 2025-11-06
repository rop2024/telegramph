import React, { useState } from 'react';
import ReceiverItem from './ReceiverItem';
import './ReceiverList.css';

const ReceiverList = ({ 
  receivers, 
  loading, 
  pagination, 
  onPageChange, 
  onReceiverUpdated,
  onReceiverDeleted,
  onRefresh 
}) => {
  const [editingReceiver, setEditingReceiver] = useState(null);

  if (loading) {
    return (
      <div className="receiver-list loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading receivers...</p>
        </div>
      </div>
    );
  }

  if (receivers.length === 0) {
    return (
      <div className="receiver-list empty">
        <div className="empty-state">
          <div className="empty-icon">👥</div>
          <h3>No receivers found</h3>
          <p>Get started by adding your first receiver to your secure list</p>
          <button onClick={onRefresh} className="btn btn-primary">
            Refresh List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="receiver-list">
      <div className="list-header">
        <div className="list-info">
          <span className="receivers-count">
            Showing {receivers.length} of {pagination.totalReceivers} receivers
          </span>
          {pagination.totalReceivers > 10 && (
            <span className="page-info">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
          )}
        </div>
        <div className="list-actions">
          <button onClick={onRefresh} className="btn btn-outline btn-sm">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="receivers-grid">
        {receivers.map(receiver => (
          <ReceiverItem
            key={receiver._id}
            receiver={receiver}
            isEditing={editingReceiver === receiver._id}
            onEditStart={() => setEditingReceiver(receiver._id)}
            onEditCancel={() => setEditingReceiver(null)}
            onReceiverUpdated={(updatedReceiver) => {
              onReceiverUpdated(updatedReceiver);
              setEditingReceiver(null);
            }}
            onReceiverDeleted={onReceiverDeleted}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => onPageChange(pagination.currentPage - 1)}
            disabled={!pagination.hasPrev}
            className="btn btn-outline btn-sm"
          >
            ← Previous
          </button>
          
          <div className="pagination-info">
            <span>Page {pagination.currentPage} of {pagination.totalPages}</span>
          </div>
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="btn btn-outline btn-sm"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiverList;