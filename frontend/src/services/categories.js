import api from './api';

export const getCategories = async () => {
  try {
    const response = await api.get('/categories');
    console.log('Categories API response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('Categories API error:', error.response); // Debug log
    throw new Error(error.response?.data?.message || 'Failed to fetch categories');
  }
};

export const createCategory = async (data) => {
  try {
    const response = await api.post('/categories', { category: data });
    console.log('Create category response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('Create category error:', error.response); // Debug log
    throw new Error(error.response?.data?.message || 'Failed to create category');
  }
};
