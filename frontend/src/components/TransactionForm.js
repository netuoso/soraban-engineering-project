import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import { createTransaction } from '../services/transactions';
import CategorySelect from './CategorySelect';

const TransactionForm = ({ onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    date: new Date(),
    description: '',
    amount: '',
    category_id: '',
    notes: ''
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      date
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const amount = parseFloat(formData.amount); // Keep as decimal value
      const transaction = {
        ...formData,
        amount
      };

      await createTransaction(transaction);
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
        <h5 className="modal-title">Add New Transaction</h5>
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
            <label className="form-label">Date</label>
            <DatePicker
              selected={formData.date}
              onChange={handleDateChange}
              className="form-control"
              dateFormat="MMM dd, yyyy HH:mm:ss"
              showTimeSelect
              timeFormat="HH:mm:ss"
              timeIntervals={15}
              timeCaption="Time (UTC)"
              utcOffset={0}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Description</label>
            <input
              type="text"
              className="form-control"
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Amount</label>
            <div className="input-group">
              <span className="input-group-text">$</span>
              <input
                type="number"
                className="form-control"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                required
              />
            </div>
          </div>

          <div className="mb-3">
            <label className="form-label">Category</label>
            <CategorySelect
              value={formData.category_id}
              onChange={(value) => handleChange({ target: { name: 'category_id', value } })}
              onError={(errorMessage) => setError(errorMessage)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Notes</label>
            <textarea
              className="form-control"
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
            />
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
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Saving...
                </>
              ) : 'Save Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionForm;
