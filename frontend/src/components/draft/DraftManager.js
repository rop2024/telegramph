import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import DraftList from './DraftList';
import DraftEditor from './DraftEditor';
import DraftStats from './DraftStats';
import TemplateSelector from './TemplateSelector';
import './DraftManager.css';

const DraftManager = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    search: ''
  });
  const [stats, setStats] = useState({ draft: 0, scheduled: 0, sent: 0, total: 0 });

  const fetchDrafts = async (page = 1, filters = {}) => {
    setLoading(true);
    try {
      const params = { page, limit: 10, ...filters };
      const response = await API.get('/drafts', { params });
      
      if (response.data.success) {
        setDrafts(response.data.data.drafts);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await API.get('/drafts/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchDrafts();
    fetchStats();
  }, []);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    fetchDrafts(1, newFilters);
  };

  const handlePageChange = (newPage) => {
    fetchDrafts(newPage, filters);
  };

  const handleDraftCreated = (newDraft) => {
    setDrafts(prev => [newDraft, ...prev]);
    setShowEditor(false);
    setEditingDraft(null);
    setShowTemplates(false);
    fetchStats();
  };

  const handleDraftUpdated = (updatedDraft) => {
    setDrafts(prev => 
      prev.map(draft => 
        draft._id === updatedDraft._id ? updatedDraft : draft
      )
    );
    setShowEditor(false);
    setEditingDraft(null);
  };

  const handleDraftDeleted = (draftId) => {
    setDrafts(prev => prev.filter(draft => draft._id !== draftId));
    fetchStats();
  };

  const handleEditDraft = (draft) => {
    setEditingDraft(draft);
    setShowEditor(true);
    setShowTemplates(false);
  };

  const handleNewDraft = () => {
    setEditingDraft(null);
    setShowEditor(true);
    setShowTemplates(false);
  };

  const handleTemplateSelect = () => {
    setEditingDraft(null);
    setShowEditor(false);
    setShowTemplates(true);
  };

  const handleTemplateChosen = (template) => {
    setEditingDraft({
      title: `New ${template.name} Draft`,
      subject: template.subject,
      body: template.body,
      template: {
        name: template.name,
        category: template.category
      },
      receivers: [],
      tags: []
    });
    setShowTemplates(false);
    setShowEditor(true);
  };

  return (
    <div className="draft-manager">
      <div className="draft-header">
        <div className="header-content">
          <h1>Email Drafts</h1>
          <p>Create, manage, and send email campaigns</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={handleTemplateSelect}
          >
            📋 Choose Template
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleNewDraft}
          >
            ✏️ New Draft
          </button>
        </div>
      </div>

      <DraftStats stats={stats} />

      {showTemplates && (
        <TemplateSelector
          onTemplateSelect={handleTemplateChosen}
          onCancel={() => setShowTemplates(false)}
        />
      )}

      {showEditor && (
        <DraftEditor
          draft={editingDraft}
          onDraftSaved={editingDraft ? handleDraftUpdated : handleDraftCreated}
          onCancel={() => {
            setShowEditor(false);
            setEditingDraft(null);
          }}
        />
      )}

      <DraftList
        drafts={drafts}
        loading={loading}
        pagination={pagination}
        filters={filters}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        onEditDraft={handleEditDraft}
        onDraftDeleted={handleDraftDeleted}
        onRefresh={() => fetchDrafts(pagination.currentPage, filters)}
      />
    </div>
  );
};

export default DraftManager;