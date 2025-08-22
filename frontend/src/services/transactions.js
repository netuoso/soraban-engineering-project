import api from './api';

export const getTransactions = async (filters = {}) => {
  try {
    // Transform camelCase to snake_case for backend compatibility
    const transformedParams = { ...filters };
    
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

export const uploadTransactions = async (file) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/transactions/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to upload transactions');
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
