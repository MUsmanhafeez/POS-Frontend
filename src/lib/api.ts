import axios from 'axios';

function readToken(): string | null {
  if (typeof window === 'undefined') return null;

  // Primary key written on login
  const raw = localStorage.getItem('forkiva_auth');
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token) return token;
    } catch {
      /* ignore */
    }
  }

  // Fallback: zustand persist store
  const zustand = localStorage.getItem('forkiva-auth-store');
  if (zustand) {
    try {
      const parsed = JSON.parse(zustand);
      const token = parsed?.state?.token;
      if (token) return token;
    } catch {
      /* ignore */
    }
  }

  return null;
}

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:4000/api/v1',
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = readToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (typeof window !== 'undefined' && error?.response?.status === 401) {
      localStorage.removeItem('forkiva_auth');
      localStorage.removeItem('forkiva-auth-store');
      if (!window.location.pathname.startsWith('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
