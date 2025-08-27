import React, { useState, useEffect } from 'react';
import { getStatuses, createStatus } from '../services/statuses';

const BulkStatusSelect = ({ onSelect, onCancel, disabled }) => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewStatus, setShowNewStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [error, setError] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState('');

  useEffect(() => {
    fetchStatuses();
  }, []);

  const fetchStatuses = async () => {
    try {
      setLoading(true);
      const response = await getStatuses();
      const statusesData = response?.data || [];
      console.log('Statuses loaded:', statusesData);
      setStatuses(statusesData);
      setError(null);
    } catch (err) {
      setError(err.message);
      setStatuses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async () => {
    if (!newStatusName.trim()) return;

    try {
      setLoading(true);
      const response = await createStatus({ name: newStatusName.trim() });
      if (response?.data) {
        const newStatus = response.data;
        setStatuses(prev => [...prev, newStatus]);
        setSelectedStatusId(newStatus.id);
        setNewStatusName('');
        setShowNewStatus(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedStatusId) {
      onSelect(selectedStatusId);
    }
  };

  if (showNewStatus) {
    return (
      <div>
        <div className="mb-3">
          <label className="form-label">New Status Name</label>
          <div className="input-group">
            <input
              type="text"
              className="form-control"
              placeholder="Enter status name"
              value={newStatusName}
              onChange={(e) => setNewStatusName(e.target.value)}
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
              disabled={loading || disabled || !newStatusName.trim()}
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
            onClick={() => setShowNewStatus(false)}
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
        <label className="form-label">Select Status</label>
        <div className="input-group">
          <select
            className="form-select"
            value={selectedStatusId}
            onChange={(e) => setSelectedStatusId(e.target.value)}
            disabled={loading || disabled}
          >
            <option value="">Select a status</option>
            {statuses.map(status => (
              <option 
                key={status.id} 
                value={status.id}
              >
                {status.attributes?.name || 'Unnamed Status'}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="btn btn-outline-primary"
            onClick={() => setShowNewStatus(true)}
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
          disabled={!selectedStatusId || loading || disabled}
        >
          Apply Status
        </button>
      </div>
    </div>
  );
};

export default BulkStatusSelect;
