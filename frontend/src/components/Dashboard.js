import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getTransactions } from '../services/transactions';
import { getCategoryTotals } from '../services/summaryService';
import CategoryPieChart from './CategoryPieChart';

const Dashboard = () => {
  const [stats, setStats] = useState({
    uncategorized: { count: 0, transactions: [] },
    flagged: { count: 0, transactions: [] },
  });
  const [categoryTotals, setCategoryTotals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch uncategorized transactions
        const uncategorizedResponse = await getTransactions({
          status: 'invalid',
          category: null,
          page: 1,
          perPage: 5
        });
        
        // Fetch flagged transactions
        const flaggedResponse = await getTransactions({
          status: 'invalid',
          page: 1,
          perPage: 5
        });

        // Fetch category totals for the pie chart
        const totalsResponse = await getCategoryTotals();

        setStats({
          uncategorized: {
            count: uncategorizedResponse.meta.total_count,
            transactions: uncategorizedResponse.data
          },
          flagged: {
            count: flaggedResponse.meta.total_count,
            transactions: flaggedResponse.data
          }
        });

        setCategoryTotals(totalsResponse.data);
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

      <div className="row">
        {/* Quick Stats */}
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h5 className="card-title">Uncategorized Transactions</h5>
              <h2 className="card-text text-primary">{stats.uncategorized.count}</h2>
              <Link 
                to="/transactions?status=invalid&category=null" 
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
              <h5 className="card-title">Category Distribution</h5>
              <CategoryPieChart 
                data={categoryTotals}
                height={200}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Uncategorized Transactions */}
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="card-title mb-0">Recent Uncategorized Transactions</h5>
            <Link to="/transactions?status=invalid&category=null">View All</Link>
          </div>
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
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
                      <Link 
                        to={`/transactions?focus=${transaction.id}`}
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
            <Link to="/transactions?status=invalid">View All</Link>
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
                        to={`/transactions?focus=${transaction.id}`}
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
    </div>
  );
};

export default Dashboard;
