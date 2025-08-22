import React, { useState, useEffect } from 'react';
import { getBulkImportHistory, formatDuration } from '../services/bulkImport';
import './ImportHistory.css';

const ImportHistory = () => {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    setLoading(true);
    try {
      const data = await getBulkImportHistory();
      setImports(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch import history:', err);
      setError('Failed to load import history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'processing':
        return 'primary';
      case 'pending':
        return 'secondary';
      case 'failed':
        return 'danger';
      default:
        return 'secondary';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="import-history-loading">
        <div className="spinner-border spinner-border-sm" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <span className="ms-2">Loading import history...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="import-history">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Recent Imports</h5>
        <button 
          className="btn btn-sm btn-outline-primary"
          onClick={fetchImportHistory}
        >
          <i className="fas fa-refresh me-1"></i>
          Refresh
        </button>
      </div>

      {imports.length === 0 ? (
        <div className="no-imports">
          <p className="text-muted mb-0">No imports found. Start your first bulk import above!</p>
        </div>
      ) : (
        <div className="imports-list">
          {imports.map((importRecord) => (
            <div key={importRecord.id} className="import-item">
              <div className="import-header">
                <div className="import-status">
                  <span className={`badge bg-${getStatusBadgeClass(importRecord.status)}`}>
                    {importRecord.status}
                  </span>
                  <span className="import-date">
                    {formatDate(importRecord.created_at)}
                  </span>
                </div>
                <div className="import-stats">
                  <span className="stat">
                    <i className="fas fa-file-csv text-muted me-1"></i>
                    {importRecord.total_rows?.toLocaleString() || 0} rows
                  </span>
                </div>
              </div>

              <div className="import-details">
                <div className="row">
                  <div className="col-md-3">
                    <div className="detail-item">
                      <small className="text-muted">Imported</small>
                      <div className="detail-value text-success">
                        {importRecord.imported_count?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="detail-item">
                      <small className="text-muted">Errors</small>
                      <div className="detail-value text-danger">
                        {importRecord.error_count?.toLocaleString() || 0}
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="detail-item">
                      <small className="text-muted">Progress</small>
                      <div className="detail-value">
                        {importRecord.progress_percentage?.toFixed(1) || 0}%
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="detail-item">
                      <small className="text-muted">Duration</small>
                      <div className="detail-value">
                        {importRecord.duration ? formatDuration(importRecord.duration) : 'N/A'}
                      </div>
                    </div>
                  </div>
                </div>

                {importRecord.status === 'processing' && (
                  <div className="progress mt-2">
                    <div 
                      className="progress-bar" 
                      style={{ width: `${importRecord.progress_percentage || 0}%` }}
                      role="progressbar"
                    />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImportHistory;
