import React, { useState, useEffect } from 'react';
import API from '../../utils/api';
import './TemplateSelector.css';

const TemplateSelector = ({ onTemplateSelect, onCancel }) => {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [previewTemplate, setPreviewTemplate] = useState(null);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await API.get('/drafts/templates');
      if (response.data.success) {
        setTemplates(response.data.data.templates);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['all', 'business', 'newsletter', 'promotional', 'personal', 'notification'];

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(template => template.category === selectedCategory);

  const getCategoryIcon = (category) => {
    const icons = {
      business: '💼',
      newsletter: '📰',
      promotional: '🎁',
      personal: '👤',
      notification: '🔔'
    };
    return icons[category] || '📧';
  };

  if (loading) {
    return (
      <div className="template-selector-overlay">
        <div className="template-selector">
          <div className="loading-spinner">Loading templates...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="template-selector-overlay">
      <div className="template-selector">
        <div className="template-header">
          <h2>Choose a Template</h2>
          <p>Select from professionally designed email templates</p>
          <button className="btn btn-close" onClick={onCancel}>×</button>
        </div>

        <div className="template-categories">
          {categories.map(category => (
            <button
              key={category}
              className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {category !== 'all' && getCategoryIcon(category)}
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>

        <div className="templates-grid">
          {filteredTemplates.map(template => (
            <div 
              key={template.id} 
              className={`template-card ${previewTemplate?.id === template.id ? 'previewing' : ''}`}
            >
              <div className="template-preview">
                <div className="template-icon">
                  {getCategoryIcon(template.category)}
                </div>
                <h4>{template.name}</h4>
                <p className="template-description">
                  {template.category.charAt(0).toUpperCase() + template.category.slice(1)} template
                </p>
                <div className="template-variables">
                  <small>Variables: {template.variables.join(', ')}</small>
                </div>
              </div>
              
              <div className="template-actions">
                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => setPreviewTemplate(previewTemplate?.id === template.id ? null : template)}
                >
                  {previewTemplate?.id === template.id ? 'Hide Preview' : 'Preview'}
                </button>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => onTemplateSelect(template)}
                >
                  Use Template
                </button>
              </div>

              {previewTemplate?.id === template.id && (
                <div className="template-preview-details">
                  <h5>Subject:</h5>
                  <p className="preview-subject">{template.subject}</p>
                  <h5>Preview:</h5>
                  <div 
                    className="preview-html"
                    dangerouslySetInnerHTML={{ __html: template.body }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="template-footer">
          <button className="btn btn-secondary" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default TemplateSelector;