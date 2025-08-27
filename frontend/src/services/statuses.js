import api from './api';

export const getStatuses = async () => {
  try {
    const response = await api.get('/statuses');
    console.log('Statuses API response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('Statuses API error:', error.response); // Debug log
    throw new Error(error.response?.data?.message || 'Failed to fetch statuses');
  }
};

export const createStatus = async (data) => {
  try {
    const response = await api.post('/statuses', { status: data });
    console.log('Create status response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('Create status error:', error.response); // Debug log
    throw new Error(error.response?.data?.message || 'Failed to create status');
  }
};

export const deleteStatus = async (id) => {
  try {
    const response = await api.delete(`/statuses/${id}`);
    console.log('Delete status response:', response); // Debug log
    return response.data;
  } catch (error) {
    console.error('Delete status error:', error.response); // Debug log
    throw new Error(error.response?.data?.message || 'Failed to delete status');
  }
};
