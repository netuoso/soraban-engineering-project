import React, { useState, useEffect } from 'react';
import { getRules, createRule, updateRule, deleteRule } from '../services/rules';
import RuleForm from './RuleForm';

const Rules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const response = await getRules();
      setRules(response?.data || []);
    } catch (err) {
      setError(err.message);
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const handleSubmit = async (formData) => {
    try {
      if (editingRule) {
        await updateRule(editingRule.id, formData);
      } else {
        await createRule(formData);
      }
      await fetchRules();
      setShowForm(false);
      setEditingRule(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (ruleId) => {
    if (window.confirm('Are you sure you want to delete this rule?')) {
      try {
        await deleteRule(ruleId);
        await fetchRules();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const formatCondition = (rule) => {
    const conditionType = rule.attributes.condition_type;
    const conditionValue = rule.attributes.condition_value;
    
    switch (conditionType) {
      case 'description_contains':
        return `Description contains "${conditionValue}"`;
      case 'amount_greater_than':
        return `Amount greater than $${conditionValue}`;
      case 'amount_less_than':
        return `Amount less than $${conditionValue}`;
      default:
        return `${conditionType} ${conditionValue}`;
    }
  };

  const formatAction = (rule) => {
    const actionType = rule.attributes.action_type;
    const actionValue = rule.attributes.action_value;
    
    if (actionType === 'set_category') {
      const categoryName = rule.relationships?.category?.data?.attributes?.name || 'Unknown Category';
      return `Set category to "${categoryName}"`;
    } else {
      return `Set status to "${actionValue}"`;
    }
  };

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="d-flex justify-content-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Transaction Rules</h2>
        <button
          className="btn btn-primary"
          onClick={() => setShowForm(true)}
          disabled={showForm}
        >
          <i className="fas fa-plus me-2"></i>
          Create New Rule
        </button>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {showForm && (
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">{editingRule ? 'Edit Rule' : 'Create New Rule'}</h5>
          </div>
          <div className="card-body">
            <RuleForm
              rule={editingRule}
              onSubmit={handleSubmit}
              onCancel={() => {
                setShowForm(false);
                setEditingRule(null);
              }}
            />
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {Array.isArray(rules) && rules.length > 0 ? (
            <div className="list-group list-group-flush">
              {rules.map(rule => (
                <div key={rule.id} className="list-group-item d-flex justify-content-between align-items-start">
                  <div className="flex-grow-1">
                    <div className="fw-bold mb-1">
                      <span className="badge bg-primary me-2">If</span>
                      {formatCondition(rule)}
                    </div>
                    <div className="text-muted">
                      <span className="badge bg-success me-2">Then</span>
                      {formatAction(rule)}
                    </div>
                  </div>
                  <div className="btn-group">
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => {
                        setEditingRule(rule);
                        setShowForm(true);
                      }}
                    >
                      <i className="fas fa-edit"></i> Edit
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(rule.id)}
                    >
                      <i className="fas fa-trash"></i> Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="mb-3">
                <i className="fas fa-robot fa-3x text-muted"></i>
              </div>
              <h5 className="text-muted">No rules found</h5>
              <p className="text-muted mb-3">
                Create your first rule to automatically categorize transactions!
              </p>
              <button
                className="btn btn-primary"
                onClick={() => setShowForm(true)}
              >
                <i className="fas fa-plus me-2"></i>
                Create Your First Rule
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="card">
          <div className="card-header">
            <h6 className="mb-0"><i className="fas fa-info-circle me-2"></i>How Rules Work</h6>
          </div>
          <div className="card-body">
            <p className="small mb-2">
              Rules automatically process transactions when they're added to the system. Multiple rules can apply to the same transaction:
            </p>
            <ul className="small mb-3">
              <li><strong>Description contains "Amazon"</strong> → Set category to "Shopping"</li>
              <li><strong>Amount greater than $1000</strong> → Set status to "High Value"</li>
              <li><strong>Description contains "Starbucks"</strong> → Set category to "Dining"</li>
            </ul>
            <div className="alert alert-info small py-2 mb-0">
              <strong>Multiple Rule Application:</strong>
              <ul className="mb-0 mt-1">
                <li>For <strong>categories</strong>: First matching rule wins (based on priority order)</li>
                <li>For <strong>status</strong>: Last matching rule wins (allows status overrides)</li>
                <li>Rules are processed in priority order (lower numbers = higher priority)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;
