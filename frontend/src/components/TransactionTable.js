import React from 'react';
import { Link } from 'react-router-dom';

const TransactionTableSkeleton = () => (
  <div className="table-responsive">
    <table className="table table-hover">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Status/Category</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {[...Array(3)].map((_, index) => (
          <tr key={index}>
            <td><span className="placeholder col-8"></span></td>
            <td><span className="placeholder col-12"></span></td>
            <td><span className="placeholder col-6"></span></td>
            <td><span className="placeholder col-7"></span></td>
            <td><span className="placeholder col-4"></span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const TransactionTable = ({ 
  title, 
  transactions, 
  loading, 
  viewAllLink, 
  showStatus = false, 
  showCategory = false, 
  showAnomalies = false 
}) => {
  return (
    <div className="card mb-4">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h5 className="card-title mb-0">{title}</h5>
          {loading ? (
            <span className="placeholder col-2"></span>
          ) : (
            <Link to={viewAllLink}>View All</Link>
          )}
        </div>
        
        {loading ? (
          <TransactionTableSkeleton />
        ) : (
          <div className="table-responsive">
            <table className="table table-hover">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Description</th>
                  <th>Amount</th>
                  <th>{showStatus ? 'Status' : showCategory ? 'Category' : showAnomalies ? 'Anomaly Types' : 'Info'}</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center text-muted">
                      No transactions found
                    </td>
                  </tr>
                ) : (
                  transactions.map(transaction => {
                    // Extract anomaly types if showing anomalies
                    let anomalyTypes = [];
                    let anomalyLabels = [];
                    if (showAnomalies && transaction.attributes.notes) {
                      anomalyTypes = transaction.attributes.notes.match(/\[ANOMALY:([^\]]+)\]/g) || [];
                      anomalyLabels = anomalyTypes.map(type => 
                        type.replace('[ANOMALY:', '').replace(']', '')
                      );
                    }

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
                          {showStatus && (
                            <span className={`badge bg-${transaction.attributes.status === 'valid' ? 'success' : 'warning'}`}>
                              {transaction.attributes.status}
                            </span>
                          )}
                          {showCategory && (
                            <span>{transaction.attributes.category_name || 'Uncategorized'}</span>
                          )}
                          {showAnomalies && (
                            <div>
                              {anomalyLabels.map((label, index) => (
                                <span key={index} className="badge bg-warning me-1">
                                  {label.replace('_', ' ')}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <Link 
                            to={{
                              pathname: '/transactions',
                              search: `?${new URLSearchParams({
                                focus: transaction.id,
                                ...(showStatus && { status: transaction.attributes.status }),
                                ...(showCategory && { category: transaction.attributes.category_name || '' })
                              }).toString()}`
                            }}
                            className="btn btn-sm btn-primary"
                          >
                            <i className="fas fa-edit"></i>
                          </Link>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionTable;
