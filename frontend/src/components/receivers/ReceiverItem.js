import React, { useState } from 'react';
import API from '../../utils/api';
import EditReceiverForm from './EditReceiverForm';
import './ReceiverItem.css';

const ReceiverItem = ({ 
  receiver, 
  isEditing, 
  onEditStart, 
  onEditCancel, 
  onReceiverUpdated,
  onReceiverDeleted 
}) => {
  const [deleting, setDeleting] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this receiver? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/receivers/${receiver._id}`);
      onReceiverDeleted(receiver._id);
    } catch (error) {
      console.error('Error deleting receiver:', error);
      alert('Failed to delete receiver. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isEditing) {
    return (
      <EditReceiverForm
        receiver={receiver}
        onReceiverUpdated={onReceiverUpdated}
        onCancel={onEditCancel}
      />
    );
  }

  return (
    <div className={`receiver-item ${showDetails ? 'expanded' : ''}`}>
      <div className="receiver-header">
        <div className="receiver-avatar">
          {receiver.name.charAt(0).toUpperCase()}
        </div>
        <div className="receiver-basic-info">
          <h4 className="receiver-name">{receiver.name}</h4>
          <p className="receiver-email">{receiver.email}</p>
          {receiver.company && (
            <p className="receiver-company">{receiver.company}</p>
          )}
        </div>
        <div className="receiver-actions">
          <button 
            onClick={() => setShowDetails(!showDetails)}
            className="btn btn-icon"
            title={showDetails ? 'Hide details' : 'Show details'}
          >
            {showDetails ? '▲' : '▼'}
          </button>
          <button 
            onClick={onEditStart}
            className="btn btn-icon"
            title="Edit receiver"
            disabled={deleting}
          >
            ✏️
          </button>
          <button 
            onClick={handleDelete}
            className="btn btn-icon btn-danger"
            title="Delete receiver"
            disabled={deleting}
          >
            {deleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>

      {showDetails && (
        <div className="receiver-details">
          <div className="details-grid">
            {receiver.phone && (
              <div className="detail-item">
                <label>Phone:</label>
                <span>{receiver.phone}</span>
              </div>
            )}
            
            {receiver.department && (
              <div className="detail-item">
                <label>Department:</label>
                <span>{receiver.department}</span>
              </div>
            )}

            <div className="detail-item">
              <label>Added:</label>
              <span>{formatDate(receiver.createdAt)}</span>
            </div>

            {receiver.tags && receiver.tags.length > 0 && (
              <div className="detail-item full-width">
                <label>Tags:</label>
                <div className="receiver-tags">
                  {receiver.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}

            {receiver.notes && (
              <div className="detail-item full-width">
                <label>Notes:</label>
                <div className="receiver-notes">
                  {receiver.notes}
                </div>
              </div>
            )}
          </div>

          <div className="receiver-security">
            <span className="security-badge">🔒 Encrypted Storage</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverItem;