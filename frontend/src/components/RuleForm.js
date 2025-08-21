import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categories';
import CategorySelect from './CategorySelect';

const RuleForm = ({ rule, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    condition_type: 'description_contains',
    condition_value: '',
    action_type: 'set_category',
    action_value: '',
    category_id: ''
  });
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await getCategories();
        setCategories(response?.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  // Set initial form data if editing a rule
  useEffect(() => {
    if (rule) {
      setFormData({
        condition_type: rule.attributes.condition_type,
        condition_value: rule.attributes.condition_value,
        action_type: rule.attributes.action_type,
        action_value: rule.attributes.action_value,
        category_id: rule.relationships?.category?.data?.id || ''
      });
    }
  }, [rule]);

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId,
      action_value: categoryId
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const conditionTypes = [
    { value: 'description_contains', label: 'Description contains' },
    { value: 'amount_greater_than', label: 'Amount greater than' },
    { value: 'amount_less_than', label: 'Amount less than' }
  ];

  const actionTypes = [
    { value: 'set_category', label: 'Set Category' },
    { value: 'set_status', label: 'Set Status' }
  ];

  if (loading) {
    return (
      <div className="text-center p-3">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger m-3" role="alert">
        {error}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-3">
      <div className="mb-3">
        <label className="form-label">If</label>
        <select
          className="form-select mb-2"
          value={formData.condition_type}
          onChange={(e) => setFormData(prev => ({ ...prev, condition_type: e.target.value }))}
        >
          {conditionTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        
        <input
          type={formData.condition_type.includes('amount') ? 'number' : 'text'}
          className="form-control"
          value={formData.condition_value}
          onChange={(e) => setFormData(prev => ({ ...prev, condition_value: e.target.value }))}
          placeholder={formData.condition_type.includes('amount') ? "Enter amount..." : "Enter text to match..."}
          step={formData.condition_type.includes('amount') ? "0.01" : undefined}
        />
      </div>

      <div className="mb-3">
        <label className="form-label">Then</label>
        <select
          className="form-select mb-2"
          value={formData.action_type}
          onChange={(e) => setFormData(prev => ({ ...prev, action_type: e.target.value }))}
        >
          {actionTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>

        {formData.action_type === 'set_category' ? (
          <CategorySelect
            value={formData.category_id}
            onChange={handleCategoryChange}
            categories={categories}
            onCategoryCreated={(newCategory) => {
              setCategories(prev => [...prev, newCategory]);
              handleCategoryChange(newCategory.id);
            }}
          />
        ) : (
          <select
            className="form-select"
            value={formData.action_value}
            onChange={(e) => setFormData(prev => ({ ...prev, action_value: e.target.value }))}
          >
            <option value="">Select a status...</option>
            <option value="valid">Valid</option>
            <option value="invalid">Invalid</option>
            <option value="high_value">High Value</option>
          </select>
        )}
      </div>

      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          {rule ? 'Update Rule' : 'Create Rule'}
        </button>
      </div>
    </form>
  );
};

export default RuleForm;
