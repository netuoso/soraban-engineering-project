import React, { useState, useEffect } from 'react';
import { 
  getDashboardSummary, 
  getUncategorizedTransactions, 
  getFlaggedTransactions, 
  getAnomalyTransactions 
} from '../services/dashboard';
import BulkImport from './BulkImport';
import ImportHistory from './ImportHistory';
import DashboardCard from './DashboardCard';
import TransactionTable from './TransactionTable';

const Dashboard = () => {
  // Separate loading states for different sections
  const [statsLoading, setStatsLoading] = useState(true);
  const [uncategorizedLoading, setUncategorizedLoading] = useState(true);
  const [flaggedLoading, setFlaggedLoading] = useState(true);
  const [anomaliesLoading, setAnomaliesLoading] = useState(true);

  // Data states
  const [stats, setStats] = useState({
    uncategorized_count: 0,
    flagged_count: 0,
    anomaly_count: 0,
    total_transactions: 0,
    recent_import_count: 0
  });
  
  const [uncategorizedTransactions, setUncategorizedTransactions] = useState([]);
  const [flaggedTransactions, setFlaggedTransactions] = useState([]);
  const [anomalyTransactions, setAnomalyTransactions] = useState([]);
  
  const [error, setError] = useState(null);

  const handleImportComplete = (importData) => {
    console.log('Import completed:', importData);
    // Refresh all dashboard data
    loadDashboardData();
  };

  // Load dashboard summary stats (fastest query)
  const loadSummaryStats = async () => {
    try {
      const response = await getDashboardSummary();
      setStats(response.data);
      setStatsLoading(false);
    } catch (err) {
      console.error('Error loading summary stats:', err);
      setError('Failed to load dashboard summary');
      setStatsLoading(false);
    }
  };

  // Load uncategorized transactions
  const loadUncategorizedTransactions = async () => {
    try {
      const response = await getUncategorizedTransactions();
      setUncategorizedTransactions(response.data || []);
      setUncategorizedLoading(false);
    } catch (err) {
      console.error('Error loading uncategorized transactions:', err);
      setUncategorizedLoading(false);
    }
  };

  // Load flagged transactions
  const loadFlaggedTransactions = async () => {
    try {
      const response = await getFlaggedTransactions();
      setFlaggedTransactions(response.data || []);
      setFlaggedLoading(false);
    } catch (err) {
      console.error('Error loading flagged transactions:', err);
      setFlaggedLoading(false);
    }
  };

  // Load anomaly transactions
  const loadAnomalyTransactions = async () => {
    try {
      const response = await getAnomalyTransactions();
      setAnomalyTransactions(response.data || []);
      setAnomaliesLoading(false);
    } catch (err) {
      console.error('Error loading anomaly transactions:', err);
      setAnomaliesLoading(false);
    }
  };

  // Function to reload all data
  const loadDashboardData = () => {
    setStatsLoading(true);
    setUncategorizedLoading(true);
    setFlaggedLoading(true);
    setAnomaliesLoading(true);
    
    // Load data in parallel
    loadSummaryStats();
    loadUncategorizedTransactions();
    loadFlaggedTransactions();
    loadAnomalyTransactions();
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Show error if critical failure
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
        {/* Quick Stats Cards - render immediately with loading states */}
        <DashboardCard
          title="Uncategorized Transactions"
          count={stats.uncategorized_count}
          loading={statsLoading}
          linkTo={{
            pathname: '/transactions',
            search: `?${new URLSearchParams({ category: '' }).toString()}`
          }}
          buttonText="Review All"
          buttonClass="btn-primary"
        />

        <DashboardCard
          title="Flagged Transactions"
          count={stats.flagged_count}
          loading={statsLoading}
          linkTo="/transactions?status=invalid"
          buttonText="Review All"
          buttonClass="btn-warning"
        />

        <DashboardCard
          title="Transactions with Anomalies"
          count={stats.anomaly_count}
          loading={statsLoading}
          linkTo="/transactions?status=invalid"
          buttonText="Review All"
          buttonClass="btn-danger"
          description="Includes duplicates, unusual amounts, and missing metadata"
        />
      </div>

      {/* Transaction Tables - render immediately with loading skeletons */}
      <TransactionTable
        title="Recent Uncategorized Transactions"
        transactions={uncategorizedTransactions}
        loading={uncategorizedLoading}
        viewAllLink={{
          pathname: '/transactions',
          search: `?${new URLSearchParams({ category: '' }).toString()}`
        }}
        showStatus={true}
      />

      <TransactionTable
        title="Recent Flagged Transactions"
        transactions={flaggedTransactions}
        loading={flaggedLoading}
        viewAllLink="/transactions?status=invalid"
        showCategory={true}
      />

      <TransactionTable
        title="Recent Transactions with Anomalies"
        transactions={anomalyTransactions}
        loading={anomaliesLoading}
        viewAllLink="/transactions?status=invalid"
        showAnomalies={true}
      />

      {/* Bulk Import Section */}
      <BulkImport onImportComplete={handleImportComplete} />

      {/* Import History */}
      <ImportHistory />
    </div>
  );
};

export default Dashboard;
