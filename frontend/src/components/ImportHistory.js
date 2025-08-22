import React, { useState, useEffect } from 'react';
import { getBulkImportHistory, formatDuration } from '../services/bulkImport';
import './ImportHistory.css';

const ImportHistory = () => {
  const [imports, setImports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(5);

  useEffect(() => {
    fetchImportHistory();
  }, []);

  const fetchImportHistory = async () => {
    setLoading(true);
    try {
      const data = await getBulkImportHistory();
      setImports(data);
      setCurrentPage(1); // Reset to first page when fetching new data
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

  // Pagination calculations
  const totalPages = Math.ceil(imports.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentImports = imports.slice(startIndex, endIndex);

  const goToPage = (page) => {
    setCurrentPage(page);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(
        <button
          key={i}
          className={`btn btn-sm ${currentPage === i ? 'btn-primary' : 'btn-outline-primary'} me-1`}
          onClick={() => goToPage(i)}
        >
          {i}
        </button>
      );
    }

    return (
      <div className="d-flex justify-content-center align-items-center mt-3">
        <button
          className="btn btn-sm btn-outline-secondary me-2"
          onClick={() => goToPage(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        {pages}
        <button
          className="btn btn-sm btn-outline-secondary ms-2"
          onClick={() => goToPage(currentPage + 1)}
          disabled={currentPage === totalPages}
        >
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>
    );
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
        <div className="no-imports text-center py-4">
          <p className="text-muted mb-0">No imports found. Start your first bulk import above!</p>
        </div>
      ) : (
        <>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Total Rows</th>
                  <th>Imported</th>
                  <th>Errors</th>
                  <th>Progress</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                {currentImports.map((importRecord) => (
                  <tr key={importRecord.id}>
                    <td>
                      <div className="fw-medium">
                        {formatDate(importRecord.created_at)}
                      </div>
                    </td>
                    <td>
                      <span className={`badge bg-${getStatusBadgeClass(importRecord.status)}`}>
                        {importRecord.status}
                      </span>
                      {importRecord.status === 'processing' && (
                        <div className="progress mt-1" style={{ height: '4px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ width: `${importRecord.progress_percentage || 0}%` }}
                            role="progressbar"
                          />
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="fw-medium">
                        <i className="fas fa-file-csv text-muted me-1"></i>
                        {importRecord.total_rows?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-success fw-medium">
                        {importRecord.imported_count?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td>
                      <span className="text-danger fw-medium">
                        {importRecord.error_count?.toLocaleString() || 0}
                      </span>
                    </td>
                    <td>
                      <div className="d-flex align-items-center">
                        <span className="me-2">
                          {importRecord.progress_percentage?.toFixed(1) || 0}%
                        </span>
                        {importRecord.status === 'processing' && (
                          <div className="spinner-border spinner-border-sm text-primary" role="status">
                            <span className="visually-hidden">Processing...</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className="text-muted">
                        {importRecord.duration ? formatDuration(importRecord.duration) : 'N/A'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {renderPagination()}
          
          {/* Summary info */}
          <div className="d-flex justify-content-between align-items-center mt-2">
            <small className="text-muted">
              Showing {startIndex + 1}-{Math.min(endIndex, imports.length)} of {imports.length} imports
            </small>
            <small className="text-muted">
              Page {currentPage} of {totalPages}
            </small>
          </div>
        </>
      )}
    </div>
  );
};

export default ImportHistory;
