import React, { useState, memo, useCallback } from 'react';
import { createCategory } from '../services/categories';

const CategorySelect = memo(({ value, onChange, onError, categories = [], onCategoryCreated }) => {
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState(null);

  const handleCreateCategory = useCallback(async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      const response = await createCategory({ name: newCategoryName.trim() });
      if (response?.data) {
        onCategoryCreated?.(response.data);
        onChange(response.data.id);
        setNewCategoryName('');
        setShowNewCategory(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [newCategoryName, onCategoryCreated, onChange, onError]);

  const handleCreateSubmit = useCallback(async () => {
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      const response = await createCategory({ name: newCategoryName.trim() });
      if (response?.data) {
        const newCategory = response.data;
        onCategoryCreated?.(newCategory);
        onChange(newCategory.id);
        setNewCategoryName('');
        setShowNewCategory(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [newCategoryName, onCategoryCreated, onChange, onError]);

  if (showNewCategory) {
    return (
      <div className="new-category-form">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter category name"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            disabled={loading}
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
            disabled={loading || !newCategoryName.trim()}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : 'Create'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowNewCategory(false)}
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="input-group">
      <select
        className="form-select"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={loading}
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
        disabled={loading}
      >
        <i className="fas fa-plus"></i> New
      </button>
    </div>
  );
});

export default CategorySelect;
