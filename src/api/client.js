import axios from 'axios';

const TOKEN_KEY = 'mototrack_token';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ─── Request interceptor: agrega Bearer token si existe ───────────────────────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response interceptor: 401 → limpia sesión y redirige a /login ────────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('mototrack_user');
      // window.location en lugar de hooks — el interceptor vive fuera del árbol React
      window.location.replace('/login');
    }
    return Promise.reject(error);
  }
);

export default client;
