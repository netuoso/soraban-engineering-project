import React, { useState, useEffect } from 'react';
import { getCategories } from '../services/categories';
import { getStatuses } from '../services/statuses';
import CategorySelect from './CategorySelect';
import StatusSelect from './StatusSelect';

const RuleForm = ({ rule, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    condition_type: 'description_contains',
    condition_value: '',
    action_type: 'set_category',
    action_value: '',
    category_id: '',
    status_id: '',
    order: ''
  });
  const [categories, setCategories] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch categories and statuses on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [categoriesResponse, statusesResponse] = await Promise.all([
          getCategories(),
          getStatuses()
        ]);
        setCategories(categoriesResponse?.data || []);
        setStatuses(statusesResponse?.data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Set initial form data if editing a rule
  useEffect(() => {
    if (rule) {
      setFormData({
        condition_type: rule.attributes.condition_type,
        condition_value: rule.attributes.condition_value,
        action_type: rule.attributes.action_type,
        action_value: rule.attributes.action_value,
        category_id: rule.relationships?.category?.data?.id || '',
        status_id: rule.relationships?.status?.data?.id || '',
        order: rule.attributes.order || ''
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

  const handleStatusChange = (statusId) => {
    setFormData(prev => ({
      ...prev,
      status_id: statusId,
      action_value: statusId
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
          <StatusSelect
            value={formData.status_id}
            onChange={handleStatusChange}
            statuses={statuses}
            onStatusCreated={(newStatus) => {
              setStatuses(prev => [...prev, newStatus]);
              handleStatusChange(newStatus.id);
            }}
          />
        )}
      </div>

      <div className="mb-3">
        <label className="form-label">Priority Order (optional)</label>
        <input
          type="number"
          className="form-control"
          value={formData.order}
          onChange={(e) => setFormData(prev => ({ ...prev, order: e.target.value }))}
          placeholder="Leave blank for automatic ordering"
          min="0"
        />
        <div className="form-text">
          Lower numbers have higher priority. Leave blank to add at the end.
        </div>
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
