import axios, { AxiosError } from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';

// Token en memoria (no en localStorage para seguridad XSS)
let accessToken: string | null = null;
let refreshToken: string | null = null;

// Notificar cambios en el token
type TokenListener = (token: string | null) => void;
const listeners: TokenListener[] = [];

export const onTokenChange = (listener: TokenListener) => {
  listeners.push(listener);
  return () => {
    const idx = listeners.indexOf(listener);
    if (idx >= 0) listeners.splice(idx, 1);
  };
};

const notifyListeners = () => {
  listeners.forEach((l) => l(accessToken));
};

export const setTokens = (access: string | null, refresh: string | null) => {
  accessToken = access;
  refreshToken = refresh;
  notifyListeners();
};

export const getAccessToken = () => accessToken;
export const getRefreshToken = () => refreshToken;

export const clearTokens = () => {
  accessToken = null;
  refreshToken = null;
  notifyListeners();
};

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000,
  withCredentials: true,
});

// Request interceptor — agregar token desde memoria
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken && config.headers) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Response interceptor — manejar 401 y renovar token
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken }, { withCredentials: true });
          const newToken = data.data.accessToken;
          accessToken = newToken;
          notifyListeners();
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        } catch {
          try {
            await axios.post('/api/auth/logout', { refreshToken }, { withCredentials: true });
          } catch {}
          clearTokens();
          window.location.href = '/login';
        }
      } else {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default api;
