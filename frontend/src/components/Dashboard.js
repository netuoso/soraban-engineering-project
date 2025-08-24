import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  // Ref for ImportHistory component
  const importHistoryRef = useRef();
  
  // Polling state
  const [pollingEnabled, setPollingEnabled] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollingIntervalRef = useRef(null); // Use ref instead of state for interval
  
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

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Polling logic
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
    }
    
    const interval = setInterval(() => {
      console.log('Dashboard polling: refreshing data');
      loadDashboardData(false); // false = don't reset loading states for polling updates
      setLastUpdated(new Date());
    }, 5000); // 5 second interval
    
    pollingIntervalRef.current = interval;
  }, []); // Remove pollingInterval from dependencies to prevent infinite loop

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []); // Remove pollingInterval from dependencies

  const togglePolling = useCallback(() => {
    if (pollingEnabled) {
      stopPolling();
      setPollingEnabled(false);
    } else {
      startPolling();
      setPollingEnabled(true);
    }
  }, [pollingEnabled, startPolling, stopPolling]);

  const handleImportComplete = (importData) => {
    console.log('Import completed:', importData);
    // Refresh all dashboard data
    loadDashboardData();
    // Refresh import history table
    if (importHistoryRef.current) {
      importHistoryRef.current.refresh();
    }
    setLastUpdated(new Date());
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
  const loadDashboardData = (resetLoadingStates = true) => {
    if (resetLoadingStates) {
      setStatsLoading(true);
      setUncategorizedLoading(true);
      setFlaggedLoading(true);
      setAnomaliesLoading(true);
    }
    
    // Load data in parallel
    loadSummaryStats();
    loadUncategorizedTransactions();
    loadFlaggedTransactions();
    loadAnomalyTransactions();
  };

  useEffect(() => {
    loadDashboardData();
    setLastUpdated(new Date());
    // Start polling automatically since pollingEnabled is true by default
    startPolling();
  }, []); // Empty dependency array to run only once on mount

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
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="mb-0">Dashboard</h1>
        
        {/* Polling Controls */}
        <div className="d-flex align-items-center">
          {lastUpdated && (
            <small className="text-muted me-3">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </small>
          )}
          
          <div className="d-flex align-items-center">
            <button
              className={`btn btn-sm me-2 ${pollingEnabled ? 'btn-success' : 'btn-outline-secondary'}`}
              onClick={togglePolling}
              title={pollingEnabled ? 'Disable auto-refresh' : 'Enable auto-refresh (5s interval)'}
            >
              <i className={`fas ${pollingEnabled ? 'fa-pause' : 'fa-play'} me-1`}></i>
              {pollingEnabled ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
            </button>
            
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => {
                loadDashboardData();
                setLastUpdated(new Date());
              }}
              title="Refresh dashboard data"
            >
              <i className="fas fa-sync-alt me-1"></i>
              Refresh
            </button>
          </div>
        </div>
      </div>

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
          linkTo="/transactions?status=invalid&exclude_anomalies=true"
          buttonText="Review All"
          buttonClass="btn-warning"
          description="Manually flagged or rule-based invalid transactions"
        />

        <DashboardCard
          title="Transactions with Anomalies"
          count={stats.anomaly_count}
          loading={statsLoading}
          linkTo="/transactions?has_anomalies=true"
          buttonText="Review All"
          buttonClass="btn-danger"
          description="System-detected duplicates, unusual amounts, and missing metadata"
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
        viewAllLink="/transactions?status=invalid&exclude_anomalies=true"
        showCategory={true}
      />

      <TransactionTable
        title="Recent Transactions with Anomalies"
        transactions={anomalyTransactions}
        loading={anomaliesLoading}
        viewAllLink="/transactions?has_anomalies=true"
        showAnomalies={true}
      />

      {/* Bulk Import Section */}
      <BulkImport onImportComplete={handleImportComplete} />

      {/* Import History */}
      <ImportHistory ref={importHistoryRef} />
    </div>
  );
};

export default Dashboard;
