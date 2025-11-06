import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import ReceiverSelector from './ReceiverSelector';
import './DraftEditor.css';

const DraftEditor = ({ draft, onDraftSaved, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    body: '',
    receivers: [],
    template: {
      name: 'default',
      category: 'business'
    },
    tags: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('compose');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (draft) {
      setFormData({
        title: draft.title || '',
        subject: draft.subject || '',
        body: draft.body || '',
        receivers: draft.receivers || [],
        template: draft.template || { name: 'default', category: 'business' },
        tags: draft.tags || []
      });
    }
  }, [draft]);

  const handleChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setError('');
  };

  const handleTemplateChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      template: {
        ...prev.template,
        [field]: value
      }
    }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleTagInputKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        receivers: formData.receivers.map(rec => rec._id || rec)
      };

      let response;
      if (draft?._id) {
        response = await API.put(`/drafts/${draft._id}`, payload);
      } else {
        response = await API.post('/drafts', payload);
      }

      if (response.data.success) {
        onDraftSaved(response.data.data.draft);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        `Failed to ${draft ? 'update' : 'create'} draft. Please try again.`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleReceiversChange = (selectedReceivers) => {
    setFormData(prev => ({
      ...prev,
      receivers: selectedReceivers
    }));
  };

  return (
    <div className="draft-editor-overlay">
      <div className="draft-editor">
        <div className="editor-header">
          <h2>{draft ? 'Edit Draft' : 'Create New Draft'}</h2>
          <button className="btn btn-close" onClick={onCancel}>×</button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="editor-tabs">
            <button 
              type="button"
              className={`tab-button ${activeTab === 'compose' ? 'active' : ''}`}
              onClick={() => setActiveTab('compose')}
            >
              ✏️ Compose
            </button>
            <button 
              type="button"
              className={`tab-button ${activeTab === 'receivers' ? 'active' : ''}`}
              onClick={() => setActiveTab('receivers')}
            >
              👥 Receivers
            </button>
            <button 
              type="button"
              className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              ⚙️ Settings
            </button>
          </div>

          <div className="editor-content">
            {activeTab === 'compose' && (
              <div className="compose-tab">
                <div className="form-group">
                  <label htmlFor="title">Draft Title *</label>
                  <input
                    type="text"
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleChange('title', e.target.value)}
                    required
                    placeholder="Enter a descriptive title for this draft"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="subject">Email Subject *</label>
                  <input
                    type="text"
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleChange('subject', e.target.value)}
                    required
                    placeholder="Enter email subject line"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="body">Email Body *</label>
                  <textarea
                    id="body"
                    value={formData.body}
                    onChange={(e) => handleChange('body', e.target.value)}
                    required
                    placeholder="Compose your email message. HTML is supported."
                    rows="15"
                  />
                  <div className="editor-help">
                    <small>💡 Tip: You can use HTML tags for formatting</small>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'receivers' && (
              <div className="receivers-tab">
                <ReceiverSelector
                  selectedReceivers={formData.receivers}
                  onReceiversChange={handleReceiversChange}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="settings-tab">
                <div className="form-group">
                  <label htmlFor="templateCategory">Template Category</label>
                  <select
                    id="templateCategory"
                    value={formData.template.category}
                    onChange={(e) => handleTemplateChange('category', e.target.value)}
                  >
                    <option value="business">Business</option>
                    <option value="newsletter">Newsletter</option>
                    <option value="promotional">Promotional</option>
                    <option value="personal">Personal</option>
                    <option value="notification">Notification</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="templateName">Template Name</label>
                  <input
                    type="text"
                    id="templateName"
                    value={formData.template.name}
                    onChange={(e) => handleTemplateChange('name', e.target.value)}
                    placeholder="Custom template name"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tags">Tags</label>
                  <div className="tags-input">
                    <input
                      type="text"
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleTagInputKeyPress}
                      placeholder="Add tags to organize your drafts"
                    />
                    <button 
                      type="button" 
                      className="btn btn-outline btn-sm"
                      onClick={handleAddTag}
                    >
                      Add
                    </button>
                  </div>
                  <div className="tags-list">
                    {formData.tags.map(tag => (
                      <span key={tag} className="tag">
                        {tag}
                        <button 
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="editor-footer">
            <div className="draft-info">
              {formData.receivers.length > 0 && (
                <span className="receivers-count">
                  📧 {formData.receivers.length} receiver(s) selected
                </span>
              )}
              {formData.tags.length > 0 && (
                <span className="tags-count">
                  🏷️ {formData.tags.length} tag(s)
                </span>
              )}
            </div>
            <div className="editor-actions">
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={onCancel}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Saving...' : (draft ? 'Update Draft' : 'Save Draft')}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DraftEditor;