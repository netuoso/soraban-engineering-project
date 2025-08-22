import React, { useState, useCallback, useEffect } from 'react';
import { startBulkImport, validateCSVFile, formatDuration } from '../services/bulkImport';
import actionCableService from '../services/actioncable';
import './BulkImport.css';

const BulkImport = ({ onImportComplete }) => {
  const [file, setFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({
    percentage: 0,
    processed: 0,
    total: 0,
    imported: 0,
    errors: 0,
    status: 'pending'
  });
  const [sessionId, setSessionId] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscription) {
        actionCableService.unsubscribeFromImportProgress(sessionId);
      }
    };
  }, [subscription, sessionId]);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    setValidationErrors([]);
    
    if (selectedFile) {
      const errors = validateCSVFile(selectedFile);
      if (errors.length > 0) {
        setValidationErrors(errors);
        setFile(null);
      } else {
        setFile(selectedFile);
      }
    } else {
      setFile(null);
    }
  };

  const connectToProgressChannel = useCallback((sessionId) => {
    const newSubscription = actionCableService.subscribeToImportProgress(sessionId, {
      connected() {
        console.log('Connected to import progress channel');
      },
      
      disconnected() {
        console.log('Disconnected from import progress channel');
      },
      
      received(data) {
        console.log('Progress update:', data);
        setProgress(prevProgress => ({
          ...prevProgress,
          ...data
        }));
        
        // If import is complete, cleanup
        if (data.status === 'completed' || data.status === 'failed') {
          setImporting(false);
          if (data.status === 'completed' && onImportComplete) {
            onImportComplete(data);
          }
          // Cleanup will happen in useEffect
        }
      },
      
      rejected() {
        console.error('Connection to progress channel was rejected');
        setImporting(false);
      }
    });
    
    setSubscription(newSubscription);
    return newSubscription;
  }, [onImportComplete]);

  const startImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress({
      percentage: 0,
      processed: 0,
      total: 0,
      imported: 0,
      errors: 0,
      status: 'pending'
    });

    try {
      const result = await startBulkImport(file);
      setSessionId(result.session_id);
      
      // Connect to progress channel
      connectToProgressChannel(result.session_id);
      
    } catch (error) {
      console.error('Error starting import:', error);
      setImporting(false);
      
      // Handle specific error types
      if (error.response?.data?.details) {
        setValidationErrors(error.response.data.details);
      } else {
        alert(error.response?.data?.error || 'Failed to start import. Please try again.');
      }
    }
  };

  const cancelImport = () => {
    if (subscription && sessionId) {
      actionCableService.unsubscribeFromImportProgress(sessionId);
      setSubscription(null);
    }
    setImporting(false);
    setSessionId(null);
    setProgress({
      percentage: 0,
      processed: 0,
      total: 0,
      imported: 0,
      errors: 0,
      status: 'pending'
    });
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getStatusMessage = () => {
    switch (progress.status) {
      case 'pending':
        return 'Preparing import...';
      case 'processing':
        return 'Processing transactions...';
      case 'completed':
        return 'Import completed successfully!';
      case 'failed':
        return 'Import failed. Please check the file and try again.';
      default:
        return 'Unknown status';
    }
  };

  return (
    <div className="bulk-import">
      <h3>Bulk Transaction Import</h3>
      
      {!importing ? (
        <div className="upload-section">
          <div className="file-input-wrapper">
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              disabled={importing}
              id="csv-file-input"
            />
            <label htmlFor="csv-file-input" className="file-input-label">
              {file ? file.name : 'Choose CSV File'}
            </label>
          </div>
          
          <button
            onClick={startImport}
            disabled={!file || importing}
            className="import-button"
          >
            Start Import
          </button>
          
          {validationErrors.length > 0 && (
            <div className="validation-errors">
              <h6>File Validation Errors:</h6>
              <ul>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="import-info">
            <p>Supported format: CSV with columns: date, amount, description, category</p>
            <p>Maximum file size: 50MB</p>
          </div>
        </div>
      ) : (
        <div className="progress-section">
          <div className="progress-header">
            <h4>{getStatusMessage()}</h4>
            <button onClick={cancelImport} className="cancel-button">
              Cancel
            </button>
          </div>
          
          <div className="progress-bar-container">
            <div 
              className="progress-bar"
              style={{ width: `${progress.percentage}%` }}
            />
            <span className="progress-text">
              {progress.percentage.toFixed(1)}%
            </span>
          </div>
          
          <div className="progress-stats">
            <div className="stat">
              <span className="stat-label">Processed:</span>
              <span className="stat-value">{progress.processed.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{progress.total.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Imported:</span>
              <span className="stat-value">{progress.imported.toLocaleString()}</span>
            </div>
            {progress.errors > 0 && (
              <div className="stat error">
                <span className="stat-label">Errors:</span>
                <span className="stat-value">{progress.errors.toLocaleString()}</span>
              </div>
            )}
          </div>
          
          {progress.estimated_completion && (
            <div className="eta">
              <span>Estimated completion: {formatDuration(progress.estimated_completion)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BulkImport;
