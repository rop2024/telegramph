import React from 'react';

const DraftStats = ({ stats }) => {
  return (
    <div className="draft-stats">
      <div className="stat-card">
        <div className="stat-icon">📝</div>
        <div className="stat-info">
          <h3>Drafts</h3>
          <div className="stat-number">{stats.draft}</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">⏰</div>
        <div className="stat-info">
          <h3>Scheduled</h3>
          <div className="stat-number">{stats.scheduled}</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📤</div>
        <div className="stat-info">
          <h3>Sent</h3>
          <div className="stat-number">{stats.sent}</div>
        </div>
      </div>
      <div className="stat-card">
        <div className="stat-icon">📊</div>
        <div className="stat-info">
          <h3>Total</h3>
          <div className="stat-number">{stats.total}</div>
        </div>
      </div>
    </div>
  );
};

export default DraftStats;