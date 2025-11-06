import React from 'react';
import DraftItem from './DraftItem';
import './DraftList.css';

const DraftList = ({ 
  drafts, 
  loading, 
  pagination, 
  filters,
  onFilterChange, 
  onPageChange, 
  onEditDraft,
  onDraftDeleted,
  onRefresh 
}) => {
  const handleFilterChange = (key, value) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  if (loading) {
    return (
      <div className="draft-list loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading drafts...</p>
        </div>
      </div>
    );
  }

  if (drafts.length === 0) {
    return (
      <div className="draft-list empty">
        <div className="empty-state">
          <div className="empty-icon">📝</div>
          <h3>No drafts found</h3>
          <p>Create your first draft to get started with email campaigns</p>
          <button onClick={onRefresh} className="btn btn-primary">
            Refresh List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="draft-list">
      <div className="list-header">
        <div className="list-filters">
          <div className="filter-group">
            <label>Status:</label>
            <select 
              value={filters.status} 
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="scheduled">Scheduled</option>
              <option value="sent">Sent</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Category:</label>
            <select 
              value={filters.category} 
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="all">All Categories</option>
              <option value="business">Business</option>
              <option value="newsletter">Newsletter</option>
              <option value="promotional">Promotional</option>
              <option value="personal">Personal</option>
              <option value="notification">Notification</option>
            </select>
          </div>
          
          <div className="filter-group">
            <label>Search:</label>
            <input
              type="text"
              placeholder="Search drafts..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
        
        <div className="list-actions">
          <button onClick={onRefresh} className="btn btn-outline btn-sm">
            🔄 Refresh
          </button>
        </div>
      </div>

      <div className="drafts-grid">
        {drafts.map(draft => (
          <DraftItem
            key={draft._id}
            draft={draft}
            onEditDraft={onEditDraft}
            onDraftDeleted={onDraftDeleted}
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

export default DraftList;