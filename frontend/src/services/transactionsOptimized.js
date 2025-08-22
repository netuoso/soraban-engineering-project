import api from './api';

// Optimized transaction fetching with lightweight response
export const getTransactionsOptimized = async (params = {}) => {
  try {
    // Transform camelCase to snake_case for backend compatibility
    const transformedParams = { ...params };
    
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
    
    const response = await api.get('/transactions/optimized', { params: transformedParams });
    return response.data;
  } catch (error) {
    console.error('Error fetching optimized transactions:', error);
    throw error;
  }
};

// Get categories with transaction counts efficiently
export const getCategoriesSummary = async () => {
  try {
    const response = await api.get('/transactions/categories_summary');
    return response.data;
  } catch (error) {
    console.error('Error fetching categories summary:', error);
    throw error;
  }
};

// Get category totals efficiently
export const getCategoryTotalsOptimized = async () => {
  try {
    const response = await api.get('/transactions/category_totals');
    return response.data;
  } catch (error) {
    console.error('Error fetching optimized category totals:', error);
    throw error;
  }
};
