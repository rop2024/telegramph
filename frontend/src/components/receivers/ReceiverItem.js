import React, { useState } from 'react';
import API from '../../utils/api';
import EditReceiverForm from './EditReceiverForm';

const ReceiverItem = ({ 
  receiver, 
  isEditing, 
  onEditStart, 
  onEditCancel, 
  onReceiverUpdated,
  onReceiverDeleted 
}) => {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this receiver?')) {
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
    <div className="receiver-item">
      <div className="receiver-header">
        <h4>{receiver.name}</h4>
        <div className="receiver-actions">
          <button 
            onClick={onEditStart}
            className="btn btn-sm btn-outline"
            disabled={deleting}
          >
            Edit
          </button>
          <button 
            onClick={handleDelete}
            className="btn btn-sm btn-danger"
            disabled={deleting}
          >
            {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>

      <div className="receiver-details">
        <p className="receiver-email">{receiver.email}</p>
        
        {receiver.phone && (
          <p><strong>Phone:</strong> {receiver.phone}</p>
        )}
        
        {receiver.company && (
          <p><strong>Company:</strong> {receiver.company}</p>
        )}
        
        {receiver.department && (
          <p><strong>Department:</strong> {receiver.department}</p>
        )}

        {receiver.tags && receiver.tags.length > 0 && (
          <div className="receiver-tags">
            {receiver.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}

        {receiver.notes && (
          <p className="receiver-notes">{receiver.notes}</p>
        )}

        <p className="receiver-meta">
          Added {new Date(receiver.createdAt).toLocaleDateString()}
        </p>
      </div>
    </div>
  );
};

export default ReceiverItem;