import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions } from '../services/transactions';
import BulkImport from './BulkImport';
import ImportHistory from './ImportHistory';

const Dashboard = () => {
  const [stats, setStats] = useState({
    uncategorized: { count: 0, transactions: [] },
    flagged: { count: 0, transactions: [] },
    anomalies: { count: 0, transactions: [] },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const handleImportComplete = (importData) => {
    // Refresh dashboard data after successful import
    console.log('Import completed:', importData);
    // Reload the page data or refetch specific components
    window.location.reload(); // Simple approach, could be optimized
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch uncategorized transactions (no category assigned, any status)
        const uncategorizedResponse = await getTransactions({
          category: '',  // Empty category means uncategorized
          page: 1,
          perPage: 5
        });
        
        // Fetch flagged transactions (status invalid, any category)
        const flaggedResponse = await getTransactions({
          status: 'invalid',
          page: 1,
          perPage: 5
        });

        // Fetch transactions with anomalies (transactions with notes containing [ANOMALY:])
        const anomaliesResponse = await getTransactions({
          page: 1,
          perPage: 100 // Get more to count anomalies accurately
        });

        // Filter transactions that have anomaly flags in their notes
        const anomalousTransactions = anomaliesResponse.data.filter(transaction => 
          transaction.attributes.notes && transaction.attributes.notes.includes('[ANOMALY:')
        );

        setStats({
          uncategorized: {
            count: uncategorizedResponse.meta.total_count,
            transactions: uncategorizedResponse.data
          },
          flagged: {
            count: flaggedResponse.meta.total_count,
            transactions: flaggedResponse.data
          },
          anomalies: {
            count: anomalousTransactions.length,
            transactions: anomalousTransactions.slice(0, 5) // Show only first 5 for recent list
          }
        });

        setError(null);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mt-4">
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <h1 className="mb-4">Dashboard</h1>

      {/* Bulk Import Section */}
      <BulkImport onImportComplete={handleImportComplete} />

      <div className="row">
        {/* Quick Stats */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Uncategorized Transactions</h5>
              <h2 className="card-text text-primary">{stats.uncategorized.count}</h2>
              <Link 
                to={{
                  pathname: '/transactions',
                  search: `?${new URLSearchParams({
                    category: ''
                  }).toString()}`
                }}
                className="btn btn-primary"
              >
                Review All
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Flagged Transactions</h5>
              <h2 className="card-text text-warning">{stats.flagged.count}</h2>
              <Link 
                to="/transactions?status=invalid" 
                className="btn btn-warning"
              >
                Review All
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Transactions with Anomalies</h5>
              <h2 className="card-text text-danger">{stats.anomalies.count}</h2>
              <Link 
                to="/transactions?status=invalid" 
                className="btn btn-danger"
              >
                Review All
              </Link>
              <div className="mt-3">
                <small className="text-muted">
                  Includes duplicates, unusual amounts, and missing metadata
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uncategorized Transactions */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Recent Uncategorized Transactions</h5>
            <Link to={{
              pathname: '/transactions',
              search: `?${new URLSearchParams({
                category: ''
              }).toString()}`
            }}>View All</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.uncategorized.transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.attributes.date).toLocaleDateString()}</td>
                    <td>{transaction.attributes.description}</td>
                    <td>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(transaction.attributes.amount)}
                    </td>
                    <td>
                      <span className={`badge bg-${transaction.attributes.status === 'valid' ? 'success' : 'warning'}`}>
                        {transaction.attributes.status}
                      </span>
                    </td>
                    <td>
                      <Link 
                        to={{
                          pathname: '/transactions',
                          search: `?${new URLSearchParams({
                            focus: transaction.id,
                            category: ''
                          }).toString()}`
                        }}
                        className="btn btn-sm btn-primary me-2"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Flagged Transactions */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Recent Flagged Transactions</h5>
            <Link to={{
              pathname: '/transactions',
              search: `?${new URLSearchParams({
                status: 'invalid'
              }).toString()}`
            }}>View All</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Category</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.flagged.transactions.map(transaction => (
                  <tr key={transaction.id}>
                    <td>{new Date(transaction.attributes.date).toLocaleDateString()}</td>
                    <td>{transaction.attributes.description}</td>
                    <td>
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: 'USD'
                      }).format(transaction.attributes.amount)}
                    </td>
                    <td>{transaction.attributes.category_name || 'Uncategorized'}</td>
                    <td>
                      <Link 
                        to={{
                          pathname: '/transactions',
                          search: `?${new URLSearchParams({
                            focus: transaction.id,
                            status: transaction.attributes.status,
                            category: transaction.attributes.category_name || ''
                          }).toString()}`
                        }}
                        className="btn btn-sm btn-primary me-2"
                      >
                        <i className="fas fa-edit"></i>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Recent Transactions with Anomalies */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Recent Transactions with Anomalies</h5>
            <Link to={{
              pathname: '/transactions',
              search: `?${new URLSearchParams({
                status: 'invalid'
              }).toString()}`
            }}>View All</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>Anomaly Types</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {stats.anomalies.transactions.map(transaction => {
                  // Extract anomaly types from notes
                  const anomalyTypes = transaction.attributes.notes 
                    ? transaction.attributes.notes.match(/\[ANOMALY:([^\]]+)\]/g) || []
                    : [];
                  const anomalyLabels = anomalyTypes.map(type => 
                    type.replace('[ANOMALY:', '').replace(']', '')
                  );

                  return (
                    <tr key={transaction.id}>
                      <td>{new Date(transaction.attributes.date).toLocaleDateString()}</td>
                      <td>{transaction.attributes.description}</td>
                      <td>
                        {new Intl.NumberFormat('en-US', {
                          style: 'currency',
                          currency: 'USD'
                        }).format(transaction.attributes.amount)}
                      </td>
                      <td>
                        {anomalyLabels.map((label, index) => (
                          <span key={index} className="badge bg-warning me-1">
                            {label.replace('_', ' ')}
                          </span>
                        ))}
                      </td>
                      <td>
                        <Link 
                          to={{
                            pathname: '/transactions',
                            search: `?${new URLSearchParams({
                              focus: transaction.id,
                              status: transaction.attributes.status
                            }).toString()}`
                          }}
                          className="btn btn-sm btn-primary me-2"
                        >
                          <i className="fas fa-edit"></i>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import History */}
      <ImportHistory />
    </div>
  );
};

export default Dashboard;
