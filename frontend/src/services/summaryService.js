import api from './api';

export const getCategoryTotals = async () => {
  const response = await api.get('/summaries/category_totals');
  return response.data;
};
