import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { 
  getTransactions, 
  bulkDeleteTransactions, 
  bulkUpdateTransactions,
  updateTransaction
} from '../services/transactions';
import TransactionForm from './TransactionForm';
import CsvUploadForm from './CsvUploadForm';
import BulkCategorySelect from './BulkCategorySelect';
import CategorySelect from './CategorySelect';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/TransactionList.css";

const TransactionList = () => {
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: '',
    search: '',
    page: 1,
    perPage: 20
  });
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingRow, setEditingRow] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  const columns = [
    {
      id: 'select',
      header: ({ table }) => (
        <input
          type="checkbox"
          checked={table.getIsAllRowsSelected()}
          onChange={table.getToggleAllRowsSelectedHandler()}
          className="form-check-input"
        />
      ),
      cell: ({ row }) => (
        <input
          type="checkbox"
          checked={row.getIsSelected()}
          onChange={row.getToggleSelectedHandler()}
          onClick={(e) => e.stopPropagation()}
          className="form-check-input"
        />
      ),
      size: 40
    },
    {
      id: 'date',
      header: 'Date & Time (UTC)',
      accessorKey: 'attributes.formatted_datetime',
      cell: info => {
        const isEditing = editingRow === info.row.original.id;
        if (isEditing) {
          return (
            <DatePicker
              selected={editFormData.date}
              onChange={(date) => handleEditChange('date', date)}
              className="form-control form-control-sm"
              dateFormat="MMM dd, yyyy HH:mm:ss"
              showTimeSelect
              timeFormat="HH:mm:ss"
              timeIntervals={15}
              timeCaption="Time (UTC)"
              utcOffset={0}
            />
          );
        }
        // Parse the ISO8601 string and format it
        const date = new Date(info.getValue());
        return format(date, "MMM dd, yyyy HH:mm:ss 'UTC'");
      }
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'attributes.description',
      cell: info => {
        const isEditing = editingRow === info.row.original.id;
        if (isEditing) {
          return (
            <input
              type="text"
              className="form-control form-control-sm"
              value={editFormData.description}
              onChange={(e) => handleEditChange('description', e.target.value)}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        return info.getValue();
      }
    },
    {
      id: 'amount',
      header: 'Amount',
      accessorKey: 'attributes.formatted_amount',
      cell: info => {
        const isEditing = editingRow === info.row.original.id;
        if (isEditing) {
          return (
            <input
              type="number"
              step="0.01"
              className="form-control form-control-sm"
              value={editFormData.amount}
              onChange={(e) => handleEditChange('amount', parseFloat(e.target.value))}
              onClick={(e) => e.stopPropagation()}
            />
          );
        }
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(info.getValue());
      }
    },
    {
      id: 'category',
      header: 'Category',
      accessorKey: 'attributes.category_name',
      cell: info => {
        const isEditing = editingRow === info.row.original.id;
        if (isEditing) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <CategorySelect
                value={editFormData.category_id}
                onChange={(value) => handleEditChange('category_id', value)}
              />
            </div>
          );
        }
        const value = info.getValue();
        return value || 'Uncategorized';
      }
    },
    {
      id: 'status',
      header: 'Status',
      accessorKey: 'attributes.status',
      cell: info => (
        <span className={`badge bg-${info.getValue() === 'valid' ? 'success' : 'warning'}`}>
          {info.getValue()}
        </span>
      )
    }
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection: selectedRows,
    },
    enableRowSelection: true,
    onRowSelectionChange: setSelectedRows,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    meta: {
      included: data.included
    }
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions(filters);
      console.log('Transaction response:', response); // Debug log
      setData(response.data);
      setPagination({
        currentPage: response.meta.current_page,
        totalPages: response.meta.total_pages,
        totalCount: response.meta.total_count
      });
      setError(null);
    } catch (err) {
      console.error('Transaction fetch error:', err); // Debug log
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      // Only reset page to 1 when changing filters other than page
      page: key === 'page' ? value : 1
    }));
  };

  const startEditing = (row) => {
    const transaction = row.original;
    setEditingRow(transaction.id);
    setEditFormData({
      date: new Date(transaction.attributes.formatted_datetime), // Use the UTC datetime
      description: transaction.attributes.description,
      amount: transaction.attributes.formatted_amount,
      category_id: transaction.relationships?.category?.data?.id || '',
      notes: transaction.attributes.notes || ''
    });
  };

  const cancelEditing = () => {
    setEditingRow(null);
    setEditFormData(null);
  };

  const handleEditChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const saveEdit = async () => {
    try {
      setIsProcessing(true);
      await updateTransaction(editingRow, editFormData);
      setEditingRow(null);
      setEditFormData(null);
      fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm('Are you sure you want to delete the selected transactions?')) {
      return;
    }

    try {
      setIsProcessing(true);
      const selectedIds = Object.keys(selectedRows).map(index => data[index].id);
      await bulkDeleteTransactions(selectedIds);
      setSelectedRows({});
      fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    try {
      setIsProcessing(true);
      const selectedIds = Object.keys(selectedRows).map(index => data[index].id);
      await bulkUpdateTransactions(selectedIds, { status });
      setSelectedRows({});
      fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBulkCategoryUpdate = async (categoryId) => {
    try {
      setIsProcessing(true);
      const selectedIds = Object.keys(selectedRows).map(index => data[index].id);
      await bulkUpdateTransactions(selectedIds, { category_id: categoryId });
      setShowCategoryModal(false);
      setSelectedRows({});
      fetchTransactions();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = Object.keys(selectedRows).length;

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Transactions</h2>
        <div>
          <button 
            className="btn btn-primary me-2"
            onClick={() => setShowTransactionForm(true)}
          >
            <i className="fas fa-plus me-2"></i>
            Add Transaction
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setShowUploadForm(true)}
          >
            <i className="fas fa-upload me-2"></i>
            Upload CSV
          </button>
        </div>
      </div>

      {selectedCount > 0 && (
        <div className="alert alert-info d-flex justify-content-between align-items-center">
          <span>{selectedCount} transaction(s) selected</span>
          <div>
            <button
              className="btn btn-success btn-sm me-2"
              onClick={() => handleBulkStatusUpdate('valid')}
              disabled={isProcessing}
            >
              <i className="fas fa-check me-1"></i>
              Mark Valid
            </button>
            <button
              className="btn btn-warning btn-sm me-2"
              onClick={() => handleBulkStatusUpdate('invalid')}
              disabled={isProcessing}
            >
              <i className="fas fa-exclamation-triangle me-1"></i>
              Mark Invalid
            </button>
            <button
              className="btn btn-info btn-sm me-2"
              onClick={() => setShowCategoryModal(true)}
              disabled={isProcessing}
            >
              <i className="fas fa-tag me-1"></i>
              Set Category
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleBulkDelete}
              disabled={isProcessing}
            >
              <i className="fas fa-trash me-1"></i>
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Category Selection Modal */}
      {showCategoryModal && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Set Category for Selected Transactions</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCategoryModal(false)}
                  disabled={isProcessing}
                ></button>
              </div>
              <div className="modal-body">
                <BulkCategorySelect
                  onSelect={handleBulkCategoryUpdate}
                  onCancel={() => setShowCategoryModal(false)}
                  disabled={isProcessing}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction Form Modal */}
      {showTransactionForm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <TransactionForm
              onSuccess={() => {
                setShowTransactionForm(false);
                fetchTransactions();
              }}
              onCancel={() => setShowTransactionForm(false)}
            />
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      {showUploadForm && (
        <div className="modal d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <CsvUploadForm
              onSuccess={() => {
                setShowUploadForm(false);
                fetchTransactions();
              }}
              onCancel={() => setShowUploadForm(false)}
            />
          </div>
        </div>
      )}

      <div className="card mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-3">
              <label className="form-label">Start Date</label>
              <DatePicker
                selected={filters.startDate}
                onChange={date => handleFilterChange('startDate', date)}
                className="form-control"
                placeholderText="Start Date"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">End Date</label>
              <DatePicker
                selected={filters.endDate}
                onChange={date => handleFilterChange('endDate', date)}
                className="form-control"
                placeholderText="End Date"
              />
            </div>
            <div className="col-md-3">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={filters.status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value="">All</option>
                <option value="valid">Valid</option>
                <option value="invalid">Invalid</option>
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search description..."
                value={filters.search}
                onChange={e => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      <div className="card">
        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  {table.getHeaderGroups().map(headerGroup => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map(header => (
                        <th
                          key={header.id}
                          onClick={header.column.getToggleSortingHandler()}
                          style={{ cursor: 'pointer' }}
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                        </th>
                      ))}
                      {editingRow && <th style={{ width: '100px' }}>Actions</th>}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => {
                    const isEditing = editingRow === row.original.id;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => !isEditing && startEditing(row)}
                        style={{ cursor: isEditing ? 'default' : 'pointer' }}
                      >
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id}>
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                        {isEditing && (
                          <td className="text-end">
                            <div className="btn-group btn-group-sm">
                              <button
                                className="btn btn-success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEdit();
                                }}
                                disabled={isProcessing}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-secondary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditing();
                                }}
                                disabled={isProcessing}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <div className="d-flex justify-content-between align-items-center mt-4">
        <div>
          <select
            className="form-select"
            value={filters.perPage}
            onChange={e => handleFilterChange('perPage', Number(e.target.value))}
          >
            <option value="10">10 per page</option>
            <option value="20">20 per page</option>
            <option value="50">50 per page</option>
            <option value="100">100 per page</option>
          </select>
        </div>
        <nav>
          <ul className="pagination mb-0">
            <li className={`page-item ${pagination.currentPage === 1 ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handleFilterChange('page', pagination.currentPage - 1)}
                disabled={pagination.currentPage === 1}
              >
                Previous
              </button>
            </li>
            <li className="page-item">
              <span className="page-link border-0 bg-transparent">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
            </li>
            <li className={`page-item ${pagination.currentPage >= pagination.totalPages ? 'disabled' : ''}`}>
              <button
                className="page-link"
                onClick={() => handleFilterChange('page', pagination.currentPage + 1)}
                disabled={pagination.currentPage >= pagination.totalPages}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default TransactionList;
