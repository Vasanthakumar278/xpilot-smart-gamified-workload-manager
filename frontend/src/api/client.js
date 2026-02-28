/**
 * api/client.js — Axios base client
 * Reads JWT from localStorage and attaches to every request.
 */
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
  headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request if present
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('xpilot_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 → clear storage and reload to login
client.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('xpilot_token');
      localStorage.removeItem('xpilot_user');
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);

export default client;
