import api from './api';

export const getTransactions = async (filters = {}) => {
  try {
    // Transform camelCase to snake_case for backend compatibility
    const transformedParams = { ...filters };
    
    // Handle custom status filtering - only send status_id if it's a custom status
    if (transformedParams.status && transformedParams.status.startsWith('status_')) {
      // For custom statuses, only send status_id, not the prefixed status
      console.log('Custom status filter detected:', transformedParams.status, 'sending status_id:', transformedParams.status_id);
      delete transformedParams.status;
    } else if (transformedParams.status_id) {
      // If we have status_id but status doesn't start with 'status_', clear status_id
      console.log('System status filter detected:', transformedParams.status, 'clearing status_id');
      delete transformedParams.status_id;
    }
    
    console.log('Final transaction filter params:', transformedParams);
    
    // Handle parameter name transformations
    if (transformedParams.perPage) {
      transformedParams.per_page = transformedParams.perPage;
      delete transformedParams.perPage;
    }
    
    if (transformedParams.startDate) {
      transformedParams.start_date = transformedParams.startDate;
      delete transformedParams.startDate;
    }
    
    if (transformedParams.endDate) {
      transformedParams.end_date = transformedParams.endDate;
      delete transformedParams.endDate;
    }
    
    const response = await api.get('/transactions', { params: transformedParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw error;
  }
};

export const getTransaction = async (id) => {
  try {
    const response = await api.get(`/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch transaction');
  }
};

export const createTransaction = async (data) => {
  try {
    const response = await api.post('/transactions', { transaction: data });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create transaction');
  }
};

export const updateTransaction = async (id, data) => {
  try {
    const response = await api.put(`/transactions/${id}`, { transaction: data });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update transaction');
  }
};

export const deleteTransaction = async (id) => {
  try {
    await api.delete(`/transactions/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete transaction');
  }
};

export const getCategoryTotals = async (filters = {}) => {
  try {
    // Transform camelCase to snake_case for backend compatibility
    const transformedParams = { ...filters };
    
    if (transformedParams.startDate) {
      transformedParams.start_date = transformedParams.startDate;
      delete transformedParams.startDate;
    }
    
    if (transformedParams.endDate) {
      transformedParams.end_date = transformedParams.endDate;
      delete transformedParams.endDate;
    }
    
    const response = await api.get('/transactions/category_totals', { params: transformedParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching category totals:', error);
    throw error;
  }
};

export const bulkDeleteTransactions = async (ids) => {
  try {
    await api.delete('/transactions/bulk_delete', { data: { ids } });
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete transactions');
  }
};

export const bulkUpdateTransactions = async (ids, data) => {
  try {
    const response = await api.put('/transactions/bulk_update', { ids, ...data });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update transactions');
  }
};
