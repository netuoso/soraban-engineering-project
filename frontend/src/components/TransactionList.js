import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePolling } from '../hooks/usePolling';
import { useDebounce } from '../hooks/useDebounce';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
} from '@tanstack/react-table';
import CategoryPieChart from './CategoryPieChart';
import DatePicker from 'react-datepicker';
import { format } from 'date-fns';
import { 
  getTransactions,
  getCategoryTotals,
  bulkDeleteTransactions, 
  bulkUpdateTransactions,
  updateTransaction
} from '../services/transactions';
import { getCategories } from '../services/categories';
import TransactionForm from './TransactionForm';
import BulkCategorySelect from './BulkCategorySelect';
import CategorySelect from './CategorySelect';
import { EditableText, EditableNumber } from './EditableFields';
import { TableSkeleton, FiltersSkeleton, ChartSkeleton } from './LoadingSkeletons';
import "react-datepicker/dist/react-datepicker.css";
import "../styles/TransactionList.css";

const TransactionList = () => {
  const navigate = useNavigate();
  
  // Separate loading states for progressive loading
  const [transactionsLoading, setTransactionsLoading] = useState(true);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoryTotalsLoading, setCategoryTotalsLoading] = useState(true);
  
  // Data states
  const [data, setData] = useState([]);
  const [sorting, setSorting] = useState([]);
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  
  // Get URL search params
  const searchParams = new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState({
    startDate: null,
    endDate: null,
    status: searchParams.get('status') || '',
    search: searchParams.get('search') || '',
    category: searchParams.has('category') ? searchParams.get('category') : undefined,
    page: parseInt(searchParams.get('page')) || 1,
    perPage: parseInt(searchParams.get('perPage')) || 20
  });
  
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0
  });
  
  const [showTransactionForm, setShowTransactionForm] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedRows, setSelectedRows] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [editingCell, setEditingCell] = useState({ rowId: null, field: null });
  const [editFormData, setEditFormData] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const handleEditChange = useCallback((field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Helper functions for anomaly detection and styling
  const getAnomalyTypes = (transaction) => {
    const notes = transaction?.attributes?.notes || '';
    if (!notes) return [];
    
    const matches = notes.match(/\[ANOMALY:([^\]]+)\]/g);
    if (!matches) return [];
    
    return matches.map(match => match.replace(/\[ANOMALY:|\]/g, ''));
  };

  const getRowClassName = (transaction) => {
    const status = transaction?.attributes?.status;
    const anomalyTypes = getAnomalyTypes(transaction);
    
    if (status === 'invalid') {
      if (anomalyTypes.includes('duplicate')) {
        return 'transaction-row-duplicate';
      } else if (anomalyTypes.includes('amount_anomaly')) {
        return 'transaction-row-amount-anomaly';
      } else if (anomalyTypes.includes('incomplete_metadata')) {
        return 'transaction-row-incomplete';
      } else {
        return 'transaction-row-invalid';
      }
    }
    
    return '';
  };

  // Optimized data fetching functions
  const fetchTransactions = useCallback(async (showLoading = true) => {
    try {
      if (showLoading) setTransactionsLoading(true);
      const response = await getTransactions(filters);
      setData(response.data || []);
      setPagination({
        currentPage: response.meta?.current_page || 1,
        totalPages: response.meta?.total_pages || 1,
        totalCount: response.meta?.total_count || 0
      });
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      console.error('Transaction fetch error:', err);
      setError(err.message);
    } finally {
      if (showLoading) setTransactionsLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await getCategories();
      setCategories(response.data || []);
      setCategoriesLoading(false);
    } catch (err) {
      console.error('Categories fetch error:', err);
      setCategoriesLoading(false);
    }
  }, []);

  const fetchCategoryTotals = useCallback(async () => {
    try {
      const response = await getCategoryTotals();
      setCategoryTotals(response.data || []);
      setCategoryTotalsLoading(false);
    } catch (err) {
      console.error('Category totals fetch error:', err);
      setCategoryTotalsLoading(false);
    }
  }, []);

  // Load all data in parallel
  const loadAllData = useCallback(() => {
    setTransactionsLoading(true);
    setCategoriesLoading(true);
    setCategoryTotalsLoading(true);
    
    // Start all requests in parallel
    fetchTransactions();
    fetchCategories();
    fetchCategoryTotals();
  }, [fetchTransactions, fetchCategories, fetchCategoryTotals]);

  // Function to clear all filters and refresh data
  const clearAllFilters = useCallback(async () => {
    const clearedFilters = {
      startDate: null,
      endDate: null,
      status: '',
      search: '',
      category: undefined,
      page: 1,
      perPage: filters.perPage
    };
    
    // Clear URL params first
    navigate('/transactions', { replace: true });
    
    // Update filters
    setFilters(clearedFilters);
    
    // Force data refresh with new filters will be handled by useEffect
  }, [filters.perPage, navigate]);

  // Optimized columns definition
  const columns = React.useMemo(() => [
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
        const isEditing = editingCell.rowId === info.row.original.id && editingCell.field === 'date';
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
              autoFocus
            />
          );
        }
        const date = new Date(info.getValue());
        return format(date, "MMM dd, yyyy HH:mm:ss 'UTC'");
      }
    },
    {
      id: 'description',
      header: 'Description',
      accessorKey: 'attributes.description',
      cell: info => {
        const isEditing = editingCell.rowId === info.row.original.id && editingCell.field === 'description';
        if (isEditing) {
          return (
            <EditableText
              value={editFormData.description}
              onChange={(value) => handleEditChange('description', value)}
              id={`description-${info.row.original.id}`}
              autoFocus
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
        const isEditing = editingCell.rowId === info.row.original.id && editingCell.field === 'amount';
        if (isEditing) {
          return (
            <EditableNumber
              value={editFormData.amount}
              onChange={(value) => handleEditChange('amount', value)}
              step="0.01"
              id={`amount-${info.row.original.id}`}
              autoFocus
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
        const isEditing = editingCell.rowId === info.row.original.id && editingCell.field === 'category';
        if (isEditing) {
          return (
            <div onClick={(e) => e.stopPropagation()}>
              <CategorySelect
                value={editFormData.category_id}
                onChange={(value) => handleEditChange('category_id', value)}
                categories={categories}
                onCategoryCreated={(newCategory) => setCategories(prev => [...prev, newCategory])}
                autoFocus
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
      cell: info => {
        const status = info.getValue();
        const transaction = info.row.original;
        const anomalyTypes = getAnomalyTypes(transaction);
        
        return (
          <div className="d-flex flex-column align-items-start gap-1">
            <span className={`badge bg-${status === 'valid' ? 'success' : 'danger'}`}>
              {status}
            </span>
            {anomalyTypes.length > 0 && (
              <div className="d-flex flex-wrap gap-1">
                {anomalyTypes.map((type, index) => (
                  <span 
                    key={index}
                    className={`badge text-dark ${
                      type === 'duplicate' ? 'bg-warning' :
                      type === 'amount_anomaly' ? 'bg-info' :
                      type === 'incomplete_metadata' ? 'bg-secondary' :
                      'bg-light'
                    }`}
                    style={{ fontSize: '0.7em' }}
                    title={`Anomaly: ${type.replace('_', ' ')}`}
                  >
                    {type === 'duplicate' ? 'DUP' :
                     type === 'amount_anomaly' ? 'AMT' :
                     type === 'incomplete_metadata' ? 'META' :
                     type.toUpperCase().substring(0, 3)}
                  </span>
                ))}
              </div>
            )}
          </div>
        );
      }
    }
  ], [categories, editFormData, editingCell, handleEditChange]);

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

  // Initial data loading
  useEffect(() => {
    loadAllData();
    
    // Check for focused transaction
    const focusedId = searchParams.get('focus');
    if (focusedId && data.length > 0) {
      const focusedRow = data.find(row => row.id === focusedId);
      if (focusedRow) {
        startEditing({ original: focusedRow }, 'category');
      }
    }
  }, []);

  // Reload transactions when filters change
  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Set up polling for auto-refresh
  usePolling(
    () => {
      if (autoRefresh && !showTransactionForm && !editingCell.rowId) {
        fetchTransactions(false);
        fetchCategoryTotals();
      }
    },
    10000,
    [autoRefresh, showTransactionForm, editingCell.rowId]
  );

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: value,
      page: key === 'page' ? value : 1
    };
    setFilters(newFilters);

    // Update URL params
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v && v !== '') {
        params.set(k, v);
      }
    });
    navigate(`/transactions?${params.toString()}`, { replace: true });
  };

  // Debounce search input
  const debouncedSearch = useDebounce((searchValue) => {
    handleFilterChange('search', searchValue);
  }, 500);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setFilters(prev => ({ ...prev, search: value }));
    debouncedSearch(value);
  };

  const startEditing = (row, field) => {
    const transaction = row.original;
    setEditingCell({ rowId: transaction.id, field });
    setEditFormData({
      date: new Date(transaction.attributes.formatted_datetime),
      description: transaction.attributes.description,
      amount: transaction.attributes.formatted_amount,
      category_id: transaction.relationships?.category?.data?.id || '',
      notes: transaction.attributes.notes || ''
    });
  };

  const cancelEditing = () => {
    setEditingCell({ rowId: null, field: null });
    setEditFormData(null);
  };

  const saveEdit = async () => {
    try {
      setIsProcessing(true);
      await updateTransaction(editingCell.rowId, editFormData);
      setEditingCell({ rowId: null, field: null });
      setEditFormData(null);
      
      // Refresh data to ensure UI is in sync with backend
      await Promise.all([
        fetchTransactions(), 
        fetchCategoryTotals()
      ]);
      
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
      
      // Perform bulk delete
      await bulkDeleteTransactions(selectedIds);
      
      // Clear selections immediately
      setSelectedRows({});
      
      // Refresh data to ensure UI is in sync with backend
      await Promise.all([
        fetchTransactions(), 
        fetchCategoryTotals()
      ]);
      
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
      
      // Perform bulk status update
      await bulkUpdateTransactions(selectedIds, { status });
      
      // Clear selections immediately
      setSelectedRows({});
      
      // Refresh data to ensure UI is in sync with backend
      await Promise.all([
        fetchTransactions(), 
        fetchCategoryTotals()
      ]);
      
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
      
      // Perform bulk category update
      await bulkUpdateTransactions(selectedIds, { category_id: categoryId });
      
      // Close modal and clear selections immediately
      setShowCategoryModal(false);
      setSelectedRows({});
      
      // Refresh data to ensure UI is in sync with backend
      await Promise.all([
        fetchTransactions(), 
        fetchCategoryTotals()
      ]);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedCount = Object.keys(selectedRows).length;

  return (
    <div className="container mt-4">
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <h2>Transactions</h2>
          <div className="d-flex align-items-center">
            <small className="text-muted me-3">
              <i className="fas fa-info-circle me-1"></i>
              To upload CSV files, use the <strong>Bulk Import</strong> feature on the Dashboard
            </small>
            <button 
              className="btn btn-primary"
              onClick={() => setShowTransactionForm(true)}
            >
              <i className="fas fa-plus me-2"></i>
              Add Transaction
            </button>
          </div>
        </div>
        <div className="d-flex justify-content-between align-items-center mt-2 text-muted small">
          <div>
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
          <div className="d-flex align-items-center">
            <div className="form-check form-switch">
              <input
                className="form-check-input"
                type="checkbox"
                id="autoRefreshToggle"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
              />
              <label className="form-check-label" htmlFor="autoRefreshToggle">
                Auto-refresh
              </label>
            </div>
            <button
              className="btn btn-link btn-sm text-muted p-0 ms-3"
              onClick={() => fetchTransactions()}
              disabled={transactionsLoading}
            >
              <i className="fas fa-sync-alt"></i> Refresh Now
            </button>
          </div>
        </div>
      </div>

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
                fetchCategories();
                fetchCategoryTotals(); // Refresh category totals for pie chart
              }}
              onCancel={() => setShowTransactionForm(false)}
            />
          </div>
        </div>
      )}

      {/* Category Summary Pie Chart */}
      {categoryTotalsLoading ? (
        <ChartSkeleton />
      ) : (
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title mb-4">
              Category Summary
              {filters.category && (
                <span className="ms-2 text-muted">
                  (Filtered by: {filters.category})
                </span>
              )}
            </h5>
            <CategoryPieChart 
              data={categoryTotals}
              onCategoryClick={(category) => handleFilterChange('category', category)}
              selectedCategory={filters.category}
            />
          </div>
        </div>
      )}

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

      {/* Filters */}
      {categoriesLoading ? (
        <FiltersSkeleton />
      ) : (
        <div className="card mb-4">
          <div className="card-body">
            <div className="row g-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Filters</h6>
                {(filters.startDate || filters.endDate || filters.status || filters.search || filters.category) && (
                  <button
                    className="btn btn-outline-secondary btn-sm"
                    onClick={clearAllFilters}
                  >
                    <i className="fas fa-times me-1"></i>
                    Clear All Filters
                  </button>
                )}
              </div>
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
                  onChange={handleSearchChange}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {/* Transactions Table */}
      <div className="card">
        <div className="card-body">
          {transactionsLoading ? (
            <TableSkeleton rows={filters.perPage} columns={6} />
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
                      {editingCell.rowId && <th style={{ width: '100px' }}>Actions</th>}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr key={row.id} className={getRowClassName(row.original)}>
                      {row.getVisibleCells().map(cell => (
                        <td 
                          key={cell.id}
                          onClick={(e) => {
                            const columnId = cell.column.id;
                            if (columnId !== 'select' && columnId !== 'status') {
                              e.stopPropagation();
                              startEditing(row, columnId);
                            }
                          }}
                        >
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                          {editingCell.rowId === row.original.id && editingCell.field === cell.column.id && (
                            <div className="d-inline-flex ms-2">
                              <button
                                className="btn btn-success btn-sm me-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveEdit();
                                }}
                                disabled={isProcessing}
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  cancelEditing();
                                }}
                                disabled={isProcessing}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
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
