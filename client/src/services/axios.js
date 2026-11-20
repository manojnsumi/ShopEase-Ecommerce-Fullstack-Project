/**
 * src/services/axios.js
 * One shared axios instance for the whole client.
 * - baseURL "/api" is proxied to http://localhost:5000 by vite.config.js
 * - a request interceptor attaches the JWT token if we are logged in
 */
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// small helper so components can read API error messages easily
export function getErrorMessage(err, fallback = 'Something went wrong') {
  return err?.response?.data?.message || err?.message || fallback;
}

export default api;
