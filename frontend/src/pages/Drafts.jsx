import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Edit, Trash2, Copy, Send, X } from 'lucide-react';
import { draftsAPI } from '../services/api';

const Drafts = () => {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDraft, setEditingDraft] = useState(null);
  
  // Filter states
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTag, setFilterTag] = useState('');
  
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    body: '',
    category: '',
    tags: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      console.log('📋 Fetching drafts...');
      const response = await draftsAPI.getAll();
      console.log('✅ Drafts loaded:', response.data.data.length);
      setDrafts(response.data.data);
    } catch (error) {
      console.error('❌ Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (draft = null) => {
    if (draft) {
      setEditingDraft(draft);
      setFormData({
        title: draft.title || '',
        subject: draft.subject || '',
        body: draft.body || '',
        category: draft.category || '',
        tags: draft.tags?.join(', ') || '',
        status: draft.status || 'draft'
      });
    } else {
      setEditingDraft(null);
      setFormData({
        title: '',
        subject: '',
        body: '',
        category: '',
        tags: '',
        status: 'draft'
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDraft(null);
    setFormData({
      title: '',
      subject: '',
      body: '',
      category: '',
      tags: '',
      status: 'draft'
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const draftData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
      };

      console.log(editingDraft ? '📝 Updating draft...' : '✨ Creating new draft...');

      if (editingDraft) {
        await draftsAPI.update(editingDraft._id, draftData);
        console.log('✅ Draft updated successfully');
      } else {
        await draftsAPI.create(draftData);
        console.log('✅ Draft created successfully');
      }

      fetchDrafts();
      handleCloseModal();
    } catch (error) {
      console.error('❌ Failed to save draft:', error);
      alert('Failed to save draft. Please try again.');
    }
  };

  const handleDelete = async (draftId) => {
    if (window.confirm('Are you sure you want to delete this draft?')) {
      try {
        console.log('🗑️ Deleting draft...');
        await draftsAPI.delete(draftId);
        console.log('✅ Draft deleted successfully');
        fetchDrafts();
      } catch (error) {
        console.error('❌ Failed to delete draft:', error);
        alert('Failed to delete draft. Please try again.');
      }
    }
  };

  const handleDuplicate = async (draftId) => {
    try {
      console.log('📋 Duplicating draft...');
      await draftsAPI.duplicate(draftId);
      console.log('✅ Draft duplicated successfully');
      fetchDrafts();
    } catch (error) {
      console.error('❌ Failed to duplicate draft:', error);
      alert('Failed to duplicate draft. Please try again.');
    }
  };

  const handleSend = (draft) => {
    console.log('📧 Navigating to send page with draft:', draft._id);
    navigate('/send', { state: { draft } });
  };

  // Extract unique categories, statuses, and tags
  const uniqueCategories = useMemo(() => {
    const categories = new Set();
    drafts.forEach(draft => {
      if (draft.category) categories.add(draft.category);
    });
    return Array.from(categories).sort();
  }, [drafts]);

  const uniqueStatuses = useMemo(() => {
    const statuses = new Set();
    drafts.forEach(draft => {
      if (draft.status) statuses.add(draft.status);
    });
    return Array.from(statuses).sort();
  }, [drafts]);

  const uniqueTags = useMemo(() => {
    const tags = new Set();
    drafts.forEach(draft => {
      if (draft.tags && Array.isArray(draft.tags)) {
        draft.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [drafts]);

  const filteredDrafts = useMemo(() => {
    return drafts.filter(draft => {
      // Search filter
      const matchesSearch = draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           draft.subject.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Category filter
      const matchesCategory = !filterCategory || draft.category === filterCategory;
      
      // Status filter
      const matchesStatus = !filterStatus || draft.status === filterStatus;
      
      // Tag filter
      const matchesTag = !filterTag || (draft.tags && Array.isArray(draft.tags) && draft.tags.includes(filterTag));
      
      return matchesSearch && matchesCategory && matchesStatus && matchesTag;
    });
  }, [drafts, searchTerm, filterCategory, filterStatus, filterTag]);

  const handleClearFilters = () => {
    setFilterCategory('');
    setFilterStatus('');
    setFilterTag('');
    setSearchTerm('');
  };

  const activeFilterCount = [filterCategory, filterStatus, filterTag].filter(Boolean).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Email Drafts</h1>
          <p className="mt-2 text-gray-600">
            Create and manage your email drafts before sending.
          </p>
        </div>
        <button className="btn btn-primary flex items-center" onClick={() => handleOpenModal()}>
          <Plus className="h-4 w-4 mr-2" />
          Create Draft
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search drafts by title or subject..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button 
              className={`btn ${showFilters ? 'btn-primary' : 'btn-secondary'} flex items-center relative`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="border-t border-gray-200 pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">Filter Options</h3>
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearFilters}
                    className="text-xs text-primary-600 hover:text-primary-700 flex items-center"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Clear All
                  </button>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">All Categories</option>
                    {uniqueCategories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">All Statuses</option>
                    {uniqueStatuses.map(status => (
                      <option key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Tags</label>
                  <select
                    value={filterTag}
                    onChange={(e) => setFilterTag(e.target.value)}
                    className="input text-sm"
                  >
                    <option value="">All Tags</option>
                    {uniqueTags.map(tag => (
                      <option key={tag} value={tag}>#{tag}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Active Filters Display */}
              {activeFilterCount > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {filterCategory && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      Category: {filterCategory}
                      <button
                        onClick={() => setFilterCategory('')}
                        className="ml-1.5 hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filterStatus && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      Status: {filterStatus}
                      <button
                        onClick={() => setFilterStatus('')}
                        className="ml-1.5 hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  {filterTag && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700">
                      Tag: #{filterTag}
                      <button
                        onClick={() => setFilterTag('')}
                        className="ml-1.5 hover:text-primary-900"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrafts.map((draft) => (
          <div key={draft._id} className="card p-6 hover:shadow-lg transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1 min-w-0 mr-3">
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                  {draft.title}
                </h3>
                <p className="text-sm text-gray-600 line-clamp-2">{draft.subject}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                draft.status === 'draft' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : draft.status === 'sent'
                  ? 'bg-green-100 text-green-800'
                  : draft.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {draft.status}
              </span>
            </div>

            {/* Preview of body */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 line-clamp-3">
                {draft.body?.replace(/<[^>]*>/g, '') || 'No content'}
              </p>
            </div>

            <div className="space-y-2 mb-4 pb-4 border-b border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Receivers</span>
                <span className="font-medium text-gray-900">{draft.receiverCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Updated</span>
                <span className="font-medium text-gray-900">
                  {new Date(draft.updatedAt || draft.lastEdited).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>
              {draft.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium text-gray-900">{draft.category}</span>
                </div>
              )}
            </div>

            {draft.tags && draft.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1.5">
                  {draft.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-primary-100 text-primary-700"
                    >
                      #{tag}
                    </span>
                  ))}
                  {draft.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-600">
                      +{draft.tags.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button 
                className="btn btn-secondary flex-1 flex items-center justify-center text-sm"
                onClick={() => handleOpenModal(draft)}
                title="Edit draft"
              >
                <Edit className="h-4 w-4 mr-1.5" />
                Edit
              </button>
              <button 
                className="btn btn-primary flex items-center justify-center text-sm px-3"
                onClick={() => handleSend(draft)}
                title="Send email"
              >
                <Send className="h-4 w-4" />
              </button>
              <button 
                className="btn btn-secondary flex items-center justify-center text-sm px-3"
                onClick={() => handleDuplicate(draft._id)}
                title="Duplicate draft"
              >
                <Copy className="h-4 w-4" />
              </button>
              <button 
                className="btn btn-danger flex items-center justify-center text-sm px-3"
                onClick={() => handleDelete(draft._id)}
                title="Delete draft"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredDrafts.length === 0 && (
        <div className="card text-center py-12">
          <div className="mx-auto h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Plus className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {drafts.length === 0 ? 'No drafts' : 'No drafts match your filters'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {drafts.length === 0 
              ? 'Get started by creating a new email draft.'
              : 'Try adjusting your search or filter criteria.'
            }
          </p>
          <div className="mt-6 flex justify-center gap-3">
            {drafts.length > 0 && (
              <button className="btn btn-secondary" onClick={handleClearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </button>
            )}
            <button className="btn btn-primary" onClick={() => handleOpenModal()}>
              <Plus className="h-4 w-4 mr-2" />
              Create Draft
            </button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {editingDraft ? 'Edit Draft' : 'Create New Draft'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <Plus className="h-6 w-6 rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  maxLength={200}
                  className="input"
                  placeholder="Internal title for this draft"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  required
                  className="input"
                  placeholder="Email subject line"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Body <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="body"
                  value={formData.body}
                  onChange={handleInputChange}
                  required
                  rows="8"
                  className="input"
                  placeholder="Email content..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="input"
                    placeholder="e.g., Newsletter, Promotion"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="input"
                  >
                    <option value="draft">Draft</option>
                    <option value="scheduled">Scheduled</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tags
                </label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleInputChange}
                  className="input"
                  placeholder="marketing, newsletter, urgent (comma separated)"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Separate tags with commas
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                >
                  {editingDraft ? 'Update' : 'Create'} Draft
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drafts;