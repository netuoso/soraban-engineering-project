import React, { useState, useEffect } from 'react';
import { getCategories, createCategory } from '../services/categories';

const BulkCategorySelect = ({ onSelect, onCancel, disabled }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      const categoriesData = response?.data || [];
      console.log('Categories loaded:', categoriesData);
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      const response = await createCategory({ name: newCategoryName.trim() });
      if (response?.data) {
        const newCategory = response.data;
        setCategories(prev => [...prev, newCategory]);
        setSelectedCategoryId(newCategory.id);
        setNewCategoryName('');
        setShowNewCategory(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedCategoryId) {
      onSelect(selectedCategoryId);
    }
  };

  if (showNewCategory) {
    return (
      <div>
        <div className="mb-3">
          <label className="form-label">New Category Name</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter category name"
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              disabled={loading || disabled}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleCreateSubmit();
                }
              }}
            />
            <button 
              type="button"
              className="btn btn-primary"
              onClick={handleCreateSubmit}
              disabled={loading || disabled || !newCategoryName.trim()}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
              ) : 'Create'}
            </button>
          </div>
        </div>
        <div className="d-flex justify-content-end">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowNewCategory(false)}
            disabled={loading || disabled}
          >
            Back to Selection
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-3">
        <label className="form-label">Select Category</label>
        <div className="input-group">
          <select
            className="form-select"
            value={selectedCategoryId}
            onChange={(e) => setSelectedCategoryId(e.target.value)}
            disabled={loading || disabled}
          >
            <option value="">Select a category</option>
            {categories.map(category => (
              <option 
                key={category.id} 
                value={category.id}
              >
                {category.attributes?.name || 'Unnamed Category'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setShowNewCategory(true)}
            disabled={loading || disabled}
          >
            <i className="fas fa-plus"></i> New
          </button>
        </div>
      </div>
      {error && (
        <div className="alert alert-danger mb-3" role="alert">
          {error}
        </div>
      )}
      <div className="d-flex justify-content-end gap-2">
        <button
          type="button"
          className="btn btn-secondary"
          onClick={onCancel}
          disabled={disabled}
        >
          Cancel
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleConfirm}
          disabled={!selectedCategoryId || loading || disabled}
        >
          Apply Category
        </button>
      </div>
    </div>
  );
};

export default BulkCategorySelect;
