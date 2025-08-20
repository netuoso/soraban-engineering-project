import React, { useState, useRef } from 'react';
import { uploadTransactions } from '../services/transactions';

const CsvUploadForm = ({ onSuccess, onCancel }) => {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file && file.type !== 'text/csv') {
      setError('Please select a CSV file');
      fileInputRef.current.value = '';
      return;
    }
    setSelectedFile(file);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a file to upload');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await uploadTransactions(selectedFile);
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">Upload Transactions CSV</h5>
        <button type="button" className="btn-close" onClick={onCancel}></button>
      </div>
      <div className="modal-body">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Select CSV File</label>
            <input
              type="file"
              className="form-control"
              accept=".csv"
              onChange={handleFileSelect}
              ref={fileInputRef}
              required
            />
            <div className="form-text">
              The CSV file should have the following columns: date, description, amount, category (optional), notes (optional)
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !selectedFile}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : 'Upload CSV'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CsvUploadForm;
