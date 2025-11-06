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
        <div className="loading-spinner">Loading receivers...</div>
      </div>
    );
  }

  if (receivers.length === 0) {
    return (
      <div className="receiver-list empty">
        <div className="empty-state">
          <h3>No receivers found</h3>
          <p>Get started by adding your first receiver</p>
        </div>
      </div>
    );
  }

  return (
    <div className="receiver-list">
      <div className="list-header">
        <span>Showing {receivers.length} of {pagination.totalReceivers} receivers</span>
        <button onClick={onRefresh} className="btn btn-sm btn-secondary">
          Refresh
        </button>
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
            className="btn btn-sm"
          >
            Previous
          </button>
          
          <span className="page-info">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(pagination.currentPage + 1)}
            disabled={!pagination.hasNext}
            className="btn btn-sm"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default ReceiverList;