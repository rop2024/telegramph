import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import './DraftSendPanel.css';

const DraftSendPanel = ({ draft, onSendComplete, onClose }) => {
  const [selectedReceivers, setSelectedReceivers] = useState([]);
  const [availableReceivers, setAvailableReceivers] = useState([]);
  const [sending, setSending] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (draft) {
      // Use draft receivers or fetch all available receivers
      setSelectedReceivers(draft.receivers || []);
      fetchAvailableReceivers();
    }
  }, [draft]);

  const fetchAvailableReceivers = async () => {
    try {
      const response = await API.get('/receivers', { params: { limit: 1000 } });
      if (response.data.success) {
        setAvailableReceivers(response.data.data.receivers);
      }
    } catch (error) {
      console.error('Error fetching receivers:', error);
    }
  };

  const handleReceiverToggle = (receiver) => {
    const isSelected = selectedReceivers.some(selected => selected._id === receiver._id);
    
    if (isSelected) {
      setSelectedReceivers(selectedReceivers.filter(selected => selected._id !== receiver._id));
    } else {
      setSelectedReceivers([...selectedReceivers, receiver]);
    }
  };

  const handleSelectAll = () => {
    if (selectedReceivers.length === availableReceivers.length) {
      setSelectedReceivers([]);
    } else {
      setSelectedReceivers([...availableReceivers]);
    }
  };

  const handleSendTest = async () => {
    setSendingTest(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.post('/mail/send-test', {
        draftId: draft._id
      });

      if (response.data.success) {
        setSuccess('Test email sent successfully! Check your inbox.');
      } else {
        setError(response.data.message || 'Failed to send test email');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send test email');
    } finally {
      setSendingTest(false);
    }
  };

  const handleSendEmails = async () => {
    if (selectedReceivers.length === 0) {
      setError('Please select at least one receiver');
      return;
    }

    setSending(true);
    setError('');
    setSuccess('');
    setProgress({ sent: 0, total: selectedReceivers.length });

    try {
      const response = await API.post('/mail/send', {
        draftId: draft._id,
        receiverIds: selectedReceivers.map(rec => rec._id)
      });

      if (response.data.success) {
        setSuccess(`Emails sent successfully! ${response.data.data.sent} sent, ${response.data.data.failed} failed`);
        if (onSendComplete) {
          onSendComplete(response.data.data);
        }
      } else {
        setError(response.data.message || 'Failed to send emails');
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send emails');
    } finally {
      setSending(false);
      setProgress(null);
    }
  };

  const isReceiverSelected = (receiver) => {
    return selectedReceivers.some(selected => selected._id === receiver._id);
  };

  return (
    <div className="draft-send-panel-overlay">
      <div className="draft-send-panel">
        <div className="panel-header">
          <h2>Send Email Campaign</h2>
          <button className="btn btn-close" onClick={onClose}>×</button>
        </div>

        <div className="panel-content">
          <div className="draft-info">
            <h4>{draft?.title}</h4>
            <p><strong>Subject:</strong> {draft?.subject}</p>
            <p><strong>Template:</strong> {draft?.template?.name}</p>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="send-actions">
            <div className="action-group">
              <h5>Test Email</h5>
              <p>Send a test email to yourself first</p>
              <button 
                onClick={handleSendTest}
                disabled={sendingTest || sending}
                className="btn btn-outline"
              >
                {sendingTest ? 'Sending Test...' : 'Send Test Email'}
              </button>
            </div>

            <div className="action-group">
              <h5>Send to Receivers</h5>
              <p>Select receivers and send the campaign</p>
              
              <div className="receivers-selection">
                <div className="selection-header">
                  <button 
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={handleSelectAll}
                  >
                    {selectedReceivers.length === availableReceivers.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <span className="selection-count">
                    {selectedReceivers.length} of {availableReceivers.length} selected
                  </span>
                </div>

                <div className="receivers-list">
                  {availableReceivers.map(receiver => (
                    <div 
                      key={receiver._id} 
                      className={`receiver-item ${isReceiverSelected(receiver) ? 'selected' : ''}`}
                      onClick={() => handleReceiverToggle(receiver)}
                    >
                      <input
                        type="checkbox"
                        checked={isReceiverSelected(receiver)}
                        onChange={() => handleReceiverToggle(receiver)}
                      />
                      <div className="receiver-info">
                        <div className="receiver-name">{receiver.name}</div>
                        <div className="receiver-email">{receiver.email}</div>
                        {receiver.company && (
                          <div className="receiver-company">{receiver.company}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={handleSendEmails}
                disabled={sending || selectedReceivers.length === 0}
                className="btn btn-primary send-button"
              >
                {sending ? (
                  <>
                    <div className="sending-spinner"></div>
                    Sending... ({progress?.sent}/{progress?.total})
                  </>
                ) : (
                  `Send to ${selectedReceivers.length} Receiver(s)`
                )}
              </button>
            </div>
          </div>

          {progress && (
            <div className="sending-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${(progress.sent / progress.total) * 100}%` }}
                ></div>
              </div>
              <div className="progress-text">
                Sending {progress.sent} of {progress.total} emails...
              </div>
            </div>
          )}
        </div>

        <div className="panel-footer">
          <button 
            onClick={onClose}
            className="btn btn-secondary"
            disabled={sending}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftSendPanel;