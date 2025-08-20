import api from './api';

export const getTransactions = async (filters = {}) => {
  try {
    const {
      page = 1,
      perPage = 20,
      startDate,
      endDate,
      status,
      search
    } = filters;

    const params = new URLSearchParams({
      page,
      per_page: perPage
    });

    if (startDate) params.append('start_date', startDate.toISOString());
    if (endDate) params.append('end_date', endDate.toISOString());
    if (status) params.append('status', status);
    if (search) params.append('search', search);

    const response = await api.get(`/transactions?${params.toString()}`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch transactions');
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
