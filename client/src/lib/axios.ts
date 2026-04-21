import axios from 'axios';
import { useAuthStore } from '../store/auth.store';

// Vite injects this via `define` in vite.config.ts; Jest injects it via jest.polyfills.cjs.
declare const __APP_API_BASE_URL__: string;

function resolveBaseUrl(): string {
  if (typeof __APP_API_BASE_URL__ !== 'undefined') return __APP_API_BASE_URL__;
  return '/api';
}

export const api = axios.create({
  baseURL: resolveBaseUrl(),
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      useAuthStore.getState().logout();
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  },
);
