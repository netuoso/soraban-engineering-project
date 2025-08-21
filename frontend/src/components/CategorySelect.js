import React, { useState, useEffect } from 'react';
import { getCategories, createCategory } from '../services/categories';

const CategorySelect = ({ value, onChange, onError }) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      // Initialize as empty array if response.data is undefined
      const categoriesData = response?.data || [];
      console.log('Categories loaded:', categoriesData); // Debug log
      setCategories(categoriesData);
      setError(null);
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
      setCategories([]); // Ensure categories is an array even on error
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      const response = await createCategory({ name: newCategoryName.trim() });
      if (response?.data) {
        setCategories(prev => [...prev, response.data]);
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
  };

  const handleCreateSubmit = async () => {
    if (!newCategoryName.trim()) return;

    try {
      setLoading(true);
      const response = await createCategory({ name: newCategoryName.trim() });
      if (response?.data) {
        const newCategory = response.data;
        console.log('New category created:', newCategory); // Debug log
        setCategories(prev => [...prev, newCategory]);
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
  };

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
        {categories.map(category => {
          console.log('Rendering category:', category); // Debug log
          return (
            <option 
              key={category.id} 
              value={category.id}
            >
              {category.attributes?.name || 'Unnamed Category'}
            </option>
          );
        })}
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
};

export default CategorySelect;
