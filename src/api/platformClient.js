import axios from 'axios';

export const PLATFORM_TOKEN_KEY = 'mototrack_platform_token';
export const PLATFORM_ADMIN_KEY = 'mototrack_platform_admin';

/**
 * Cliente HTTP exclusivo para el panel de plataforma (/api/platform/*).
 * Totalmente independiente del cliente del taller y de sus claves de sesion.
 */
const platformClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

platformClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

platformClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const reqUrl = err.config?.url || '';
    const isCredentialCheck =
      reqUrl.includes('/platform/auth/login') ||
      reqUrl.includes('/platform/auth/change-password');

    if (err.response?.status === 401 && !isCredentialCheck) {
      localStorage.removeItem(PLATFORM_TOKEN_KEY);
      localStorage.removeItem(PLATFORM_ADMIN_KEY);
      if (!window.location.pathname.startsWith('/plataforma/login')) {
        window.location.assign('/plataforma/login');
      }
    }
    return Promise.reject(err);
  }
);

export default platformClient;
