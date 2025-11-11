import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Edit, Trash2, Copy, Send } from 'lucide-react';
import { draftsAPI } from '../services/api';

const Drafts = () => {
  const [drafts, setDrafts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchDrafts();
  }, []);

  const fetchDrafts = async () => {
    try {
      const response = await draftsAPI.getAll();
      setDrafts(response.data.data);
    } catch (error) {
      console.error('Failed to fetch drafts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDrafts = drafts.filter(draft =>
    draft.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    draft.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <button className="btn btn-primary flex items-center">
          <Plus className="h-4 w-4 mr-2" />
          Create Draft
        </button>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 mb-6">
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
          <button className="btn btn-secondary flex items-center">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </button>
        </div>
      </div>

      {/* Drafts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDrafts.map((draft) => (
          <div key={draft._id} className="card p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900 truncate">
                  {draft.title}
                </h3>
                <p className="text-sm text-gray-500 mt-1">{draft.subject}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                draft.status === 'draft' 
                  ? 'bg-yellow-100 text-yellow-800'
                  : draft.status === 'sent'
                  ? 'bg-green-100 text-green-800'
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {draft.status}
              </span>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Receivers</span>
                <span className="font-medium">{draft.receiverCount}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Last Edited</span>
                <span className="font-medium">
                  {new Date(draft.lastEdited).toLocaleDateString()}
                </span>
              </div>
              {draft.category && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Category</span>
                  <span className="font-medium">{draft.category}</span>
                </div>
              )}
            </div>

            {draft.tags && draft.tags.length > 0 && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-1">
                  {draft.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-800"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between space-x-2">
              <button className="btn btn-secondary flex-1 flex items-center justify-center text-sm">
                <Edit className="h-4 w-4 mr-1" />
                Edit
              </button>
              <button className="btn btn-secondary flex items-center justify-center text-sm px-3">
                <Copy className="h-4 w-4" />
              </button>
              <button className="btn btn-primary flex items-center justify-center text-sm px-3">
                <Send className="h-4 w-4" />
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
          <h3 className="mt-2 text-sm font-medium text-gray-900">No drafts</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new email draft.
          </p>
          <div className="mt-6">
            <button className="btn btn-primary">
              <Plus className="h-4 w-4 mr-2" />
              Create Draft
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Drafts;