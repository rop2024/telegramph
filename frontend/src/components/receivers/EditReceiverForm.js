import React, { useState } from 'react';
import API from '../../utils/api';

const EditReceiverForm = ({ receiver, onReceiverUpdated, onCancel }) => {
  const [formData, setFormData] = useState({
    name: receiver.name,
    email: receiver.email,
    phone: receiver.phone || '',
    company: receiver.company || '',
    department: receiver.department || '',
    tags: receiver.tags?.join(', ') || '',
    notes: receiver.notes || ''
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

      const response = await API.put(`/receivers/${receiver._id}`, payload);

      if (response.data.success) {
        onReceiverUpdated(response.data.data.receiver);
      }
    } catch (error) {
      setError(
        error.response?.data?.message || 
        'Failed to update receiver. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="receiver-item editing">
      <form onSubmit={handleSubmit}>
        {error && <div className="alert alert-error">{error}</div>}

        <div className="form-row">
          <div className="form-group">
            <label>Name *</label>
            <input
              type="text"
              name="name"
              value={name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Phone</label>
            <input
              type="text"
              name="phone"
              value={phone}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Company</label>
            <input
              type="text"
              name="company"
              value={company}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              name="department"
              value={department}
              onChange={handleChange}
            />
          </div>

          <div className="form-group">
            <label>Tags</label>
            <input
              type="text"
              name="tags"
              value={tags}
              onChange={handleChange}
              placeholder="Separate with commas"
            />
          </div>
        </div>

        <div className="form-group">
          <label>Notes</label>
          <textarea
            name="notes"
            value={notes}
            onChange={handleChange}
            rows="2"
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
            {loading ? 'Updating...' : 'Update'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditReceiverForm;