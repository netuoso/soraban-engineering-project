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
import { getTransactions } from '../services/transactions';
import TransactionForm from './TransactionForm';
import CsvUploadForm from './CsvUploadForm';
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

  const columns = [
    {
      header: 'Date',
      accessorKey: 'attributes.formatted_date',
      cell: info => format(new Date(info.getValue()), 'MMM dd, yyyy')
    },
    {
      header: 'Description',
      accessorKey: 'attributes.description'
    },
    {
      header: 'Amount',
      accessorKey: 'attributes.formatted_amount',
      cell: info => new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(info.getValue())
    },
    {
      header: 'Category',
      accessorKey: 'attributes.category.name',
      cell: info => info.getValue() || 'Uncategorized'
    },
    {
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
      sorting
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await getTransactions(filters);
      setData(response.data);
      setPagination({
        currentPage: response.meta.current_page,
        totalPages: response.meta.total_pages,
        totalCount: response.meta.total_count
      });
      setError(null);
    } catch (err) {
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
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.map(row => (
                    <tr
                      key={row.id}
                      onClick={() => navigate(`/transactions/${row.original.id}`)}
                      style={{ cursor: 'pointer' }}
                    >
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
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
