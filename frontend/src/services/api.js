import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';
const AUTH_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (email, password) => {
  try {
    const response = await axios.post(`${AUTH_URL}/users/sign_in`, {
      user: { email, password },
    });
    const token = response.headers.authorization;
    return { user: response.data.data, token };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Login failed');
  }
};

export const register = async (email, password) => {
  try {
    const response = await axios.post(`${AUTH_URL}/users`, {
      user: { email, password },
    });
    const token = response.headers.authorization;
    return { user: response.data.data, token };
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Registration failed');
  }
};

export const logout = async () => {
  try {
    await axios.delete(`${AUTH_URL}/users/sign_out`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
    });
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export default api;
