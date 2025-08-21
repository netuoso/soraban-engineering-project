import api from './api';

export const getRules = async () => {
  try {
    const response = await api.get('/rules');
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to fetch rules');
  }
};

export const createRule = async (ruleData) => {
  try {
    const response = await api.post('/rules', { rule: ruleData });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to create rule');
  }
};

export const updateRule = async (id, ruleData) => {
  try {
    const response = await api.put(`/rules/${id}`, { rule: ruleData });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to update rule');
  }
};

export const deleteRule = async (id) => {
  try {
    await api.delete(`/rules/${id}`);
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Failed to delete rule');
  }
};
