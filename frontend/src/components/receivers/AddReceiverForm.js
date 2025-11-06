import React, { useState } from 'react';
import API from '../../utils/api';

const AddReceiverForm = ({ onReceiverAdded, onCancel }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company: '',
    department: '',
    tags: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { name, email, phone, company, department, tags, notes } = formData;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const payload = {
        ...formData,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };

      const response = await API.post('/receivers', payload);

      if (response.data.success) {
        onReceiverAdded(response.data.data.receiver);
        setFormData({
          name: '',
          email: '',
          phone: '',
          company: '',
          department: '',
          tags: '',
          notes: ''
        });
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to add receiver. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receiver-form-overlay">
      <div className="receiver-form">
        <h2>Add New Receiver</h2>
        
        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={handleChange}
                required
                placeholder="Enter receiver's full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={handleChange}
                required
                placeholder="Enter receiver's email"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="phone">Phone</label>
              <input
                type="text"
                id="phone"
                name="phone"
                value={phone}
                onChange={handleChange}
                placeholder="Enter phone number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="company">Company</label>
              <input
                type="text"
                id="company"
                name="company"
                value={company}
                onChange={handleChange}
                placeholder="Enter company name"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="department">Department</label>
              <input
                type="text"
                id="department"
                name="department"
                value={department}
                onChange={handleChange}
                placeholder="Enter department"
              />
            </div>

            <div className="form-group">
              <label htmlFor="tags">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={tags}
                onChange={handleChange}
                placeholder="Separate tags with commas"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              name="notes"
              value={notes}
              onChange={handleChange}
              placeholder="Additional notes (max 500 characters)"
              rows="3"
              maxLength="500"
            />
          </div>

          <div className="form-actions">
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
              {loading ? 'Adding...' : 'Add Receiver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddReceiverForm;