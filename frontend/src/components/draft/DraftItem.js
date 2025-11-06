import React, { useState } from 'react';
import API from '../../utils/api';
import './DraftItem.css';

const DraftItem = ({ draft, onEditDraft, onDraftDeleted }) => {
  const [deleting, setDeleting] = useState(false);
  const [duplicating, setDuplicating] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this draft? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      await API.delete(`/drafts/${draft._id}`);
      onDraftDeleted(draft._id);
    } catch (error) {
      console.error('Error deleting draft:', error);
      alert('Failed to delete draft. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      await API.post(`/drafts/${draft._id}/duplicate`);
      // The duplicate will appear in the list after refresh
      alert('Draft duplicated successfully!');
    } catch (error) {
      console.error('Error duplicating draft:', error);
      alert('Failed to duplicate draft. Please try again.');
    } finally {
      setDuplicating(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusIcon = (status) => {
    const icons = {
      draft: '📝',
      scheduled: '⏰',
      sent: '📤'
    };
    return icons[status] || '📧';
  };

  const getCategoryIcon = (category) => {
    const icons = {
      business: '💼',
      newsletter: '📰',
      promotional: '🎁',
      personal: '👤',
      notification: '🔔'
    };
    return icons[category] || '📧';
  };

  return (
    <div className="draft-item">
      <div className="draft-header">
        <div className="draft-meta">
          <span className="draft-id">#{draft.draftId}</span>
          <span className={`status-badge status-${draft.status}`}>
            {getStatusIcon(draft.status)} {draft.status}
          </span>
          <span className="category-badge">
            {getCategoryIcon(draft.template.category)} {draft.template.category}
          </span>
        </div>
        <div className="draft-actions">
          <button 
            onClick={() => onEditDraft(draft)}
            className="btn btn-icon"
            title="Edit draft"
          >
            ✏️
          </button>
          <button 
            onClick={handleDuplicate}
            className="btn btn-icon"
            title="Duplicate draft"
            disabled={duplicating}
          >
            {duplicating ? '⏳' : '📋'}
          </button>
          <button 
            onClick={handleDelete}
            className="btn btn-icon btn-danger"
            title="Delete draft"
            disabled={deleting}
          >
            {deleting ? '⏳' : '🗑️'}
          </button>
        </div>
      </div>

      <div className="draft-content">
        <h4 className="draft-title">{draft.title}</h4>
        <p className="draft-subject">
          <strong>Subject:</strong> {draft.subject}
        </p>
        
        <div className="draft-preview">
          <div 
            className="body-preview"
            dangerouslySetInnerHTML={{ 
              __html: draft.body.length > 150 
                ? draft.body.substring(0, 150) + '...' 
                : draft.body 
            }}
          />
        </div>

        {draft.receivers && draft.receivers.length > 0 && (
          <div className="draft-receivers">
            <strong>To:</strong> 
            {draft.receivers.slice(0, 3).map(rec => rec.name).join(', ')}
            {draft.receivers.length > 3 && ` and ${draft.receivers.length - 3} more`}
          </div>
        )}

        {draft.tags && draft.tags.length > 0 && (
          <div className="draft-tags">
            {draft.tags.map((tag, index) => (
              <span key={index} className="tag">{tag}</span>
            ))}
          </div>
        )}
      </div>

      <div className="draft-footer">
        <div className="draft-dates">
          <span>Created: {formatDate(draft.createdAt)}</span>
          <span>Last edited: {formatDate(draft.lastEdited)}</span>
        </div>
        <div className="template-info">
          Template: {draft.template.name}
        </div>
      </div>
    </div>
  );
};

export default DraftItem;