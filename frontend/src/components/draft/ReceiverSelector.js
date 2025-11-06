import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import './ReceiverSelector.css';

const ReceiverSelector = ({ selectedReceivers, onReceiversChange }) => {
  const [receivers, setReceivers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchReceivers();
  }, []);

  const fetchReceivers = async () => {
    setLoading(true);
    try {
      const response = await API.get('/receivers', {
        params: { limit: 100 } // Get more receivers for selection
      });
      if (response.data.success) {
        setReceivers(response.data.data.receivers);
      }
    } catch (error) {
      console.error('Error fetching receivers:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredReceivers = receivers.filter(receiver =>
    receiver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receiver.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    receiver.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleReceiverToggle = (receiver) => {
    const isSelected = selectedReceivers.some(selected => selected._id === receiver._id);
    
    if (isSelected) {
      onReceiversChange(selectedReceivers.filter(selected => selected._id !== receiver._id));
    } else {
      onReceiversChange([...selectedReceivers, receiver]);
    }
  };

  const handleSelectAll = () => {
    if (selectedReceivers.length === filteredReceivers.length) {
      onReceiversChange([]);
    } else {
      onReceiversChange(filteredReceivers);
    }
  };

  const isReceiverSelected = (receiver) => {
    return selectedReceivers.some(selected => selected._id === receiver._id);
  };

  if (loading) {
    return <div className="receiver-selector loading">Loading receivers...</div>;
  }

  return (
    <div className="receiver-selector">
      <div className="selector-header">
        <h4>Select Receivers</h4>
        <div className="search-box">
          <input
            type="text"
            placeholder="Search receivers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="selector-actions">
        <button 
          type="button"
          className="btn btn-outline btn-sm"
          onClick={handleSelectAll}
        >
          {selectedReceivers.length === filteredReceivers.length ? 'Deselect All' : 'Select All'}
        </button>
        <span className="selection-count">
          {selectedReceivers.length} of {filteredReceivers.length} selected
        </span>
      </div>

      <div className="receivers-list">
        {filteredReceivers.map(receiver => (
          <div 
            key={receiver._id} 
            className={`receiver-item ${isReceiverSelected(receiver) ? 'selected' : ''}`}
            onClick={() => handleReceiverToggle(receiver)}
          >
            <div className="receiver-checkbox">
              <input
                type="checkbox"
                checked={isReceiverSelected(receiver)}
                onChange={() => handleReceiverToggle(receiver)}
              />
            </div>
            <div className="receiver-info">
              <div className="receiver-name">{receiver.name}</div>
              <div className="receiver-email">{receiver.email}</div>
              {receiver.company && (
                <div className="receiver-company">{receiver.company}</div>
              )}
            </div>
          </div>
        ))}
        
        {filteredReceivers.length === 0 && (
          <div className="no-receivers">
            {searchTerm ? 'No receivers match your search' : 'No receivers found'}
          </div>
        )}
      </div>

      {selectedReceivers.length > 0 && (
        <div className="selected-summary">
          <h5>Selected Receivers:</h5>
          <div className="selected-tags">
            {selectedReceivers.map(receiver => (
              <span key={receiver._id} className="selected-tag">
                {receiver.name}
                <button 
                  type="button"
                  onClick={() => handleReceiverToggle(receiver)}
                  className="tag-remove"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReceiverSelector;