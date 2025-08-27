import React, { useState, memo, useCallback } from 'react';
import { createStatus } from '../services/statuses';

const StatusSelect = memo(({ value, onChange, onError, statuses = [], onStatusCreated }) => {
  const [loading, setLoading] = useState(false);
  const [showNewStatus, setShowNewStatus] = useState(false);
  const [newStatusName, setNewStatusName] = useState('');
  const [error, setError] = useState(null);

  const handleCreateStatus = useCallback(async (e) => {
    e.preventDefault();
    if (!newStatusName.trim()) return;

    try {
      setLoading(true);
      const response = await createStatus({ name: newStatusName.trim() });
      if (response?.data) {
        onStatusCreated?.(response.data);
        onChange(response.data.id);
        setNewStatusName('');
        setShowNewStatus(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [newStatusName, onStatusCreated, onChange, onError]);

  const handleCreateSubmit = useCallback(async () => {
    if (!newStatusName.trim()) return;

    try {
      setLoading(true);
      const response = await createStatus({ name: newStatusName.trim() });
      if (response?.data) {
        const newStatus = response.data;
        onStatusCreated?.(newStatus);
        onChange(newStatus.id);
        setNewStatusName('');
        setShowNewStatus(false);
        setError(null);
      }
    } catch (err) {
      setError(err.message);
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, [newStatusName, onStatusCreated, onChange, onError]);

  if (showNewStatus) {
    return (
      <div className="new-status-form">
        <div className="input-group">
          <input
            type="text"
            className="form-control"
            placeholder="Enter status name"
            value={newStatusName}
            onChange={(e) => setNewStatusName(e.target.value)}
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
            disabled={loading || !newStatusName.trim()}
          >
            {loading ? (
              <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : 'Create'}
          </button>
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => setShowNewStatus(false)}
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
        disabled={loading}
      >
        <i className="fas fa-plus"></i> New
      </button>
    </div>
  );
});

StatusSelect.displayName = 'StatusSelect';

export default StatusSelect;
