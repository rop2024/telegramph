import React from 'react';

const ReceiverStats = ({ stats }) => {
  return (
    <div className="receiver-stats">
      <div className="stat-card">
        <h3>Total Receivers</h3>
        <div className="stat-number">{stats.total}</div>
      </div>
      <div className="stat-card">
        <h3>Added This Week</h3>
        <div className="stat-number">{stats.recent}</div>
      </div>
    </div>
  );
};

export default ReceiverStats;