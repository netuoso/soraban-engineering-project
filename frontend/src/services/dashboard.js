import api from './api';

// Get dashboard summary stats
export const getDashboardSummary = async () => {
  try {
    const response = await api.get('/dashboard/summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching dashboard summary:', error);
    throw error;
  }
};

// Get recent uncategorized transactions
export const getUncategorizedTransactions = async () => {
  try {
    const response = await api.get('/dashboard/uncategorized_transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching uncategorized transactions:', error);
    throw error;
  }
};

// Get recent flagged transactions
export const getFlaggedTransactions = async () => {
  try {
    const response = await api.get('/dashboard/flagged_transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching flagged transactions:', error);
    throw error;
  }
};

// Get recent anomaly transactions
export const getAnomalyTransactions = async () => {
  try {
    const response = await api.get('/dashboard/anomaly_transactions');
    return response.data;
  } catch (error) {
    console.error('Error fetching anomaly transactions:', error);
    throw error;
  }
};
