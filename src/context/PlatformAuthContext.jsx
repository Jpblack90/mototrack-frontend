import { useState, useEffect, useCallback } from 'react';
import platformClient, {
  PLATFORM_TOKEN_KEY,
  PLATFORM_ADMIN_KEY,
} from '../api/platformClient';
import { PlatformAuthContext } from './platformAuthStore';

function readStoredAdmin() {
  try {
    const raw = localStorage.getItem(PLATFORM_ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearStoredSession() {
  localStorage.removeItem(PLATFORM_TOKEN_KEY);
  localStorage.removeItem(PLATFORM_ADMIN_KEY);
}

/**
 * Proveedor de sesión exclusivo para el panel de plataforma (/plataforma).
 * Mantiene su propio token y estado independiente de AuthContext del taller.
 */
export function PlatformAuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem(PLATFORM_TOKEN_KEY)));

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem(PLATFORM_TOKEN_KEY);
    if (!token) {
      return undefined;
    }

    const cachedAdmin = readStoredAdmin();

    platformClient
      .get('/platform/auth/me')
      .then((res) => {
        if (!active) return;
        const freshAdmin = res.data.data;
        localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(freshAdmin));
        setAdmin(freshAdmin);
      })
      .catch((err) => {
        if (!active) return;
        const code = err?.response?.data?.error?.code;
        if (err?.response?.status === 403 && code === 'PASSWORD_CHANGE_REQUIRED') {
          const pendingAdmin = { ...(cachedAdmin || {}), must_change_password: true };
          localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(pendingAdmin));
          setAdmin(pendingAdmin);
          return;
        }
        clearStoredSession();
        setAdmin(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await platformClient.post('/platform/auth/login', { email, password });
    const { token, admin: loggedAdmin } = res.data.data;
    localStorage.setItem(PLATFORM_TOKEN_KEY, token);
    localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(loggedAdmin));
    setAdmin(loggedAdmin);
    return loggedAdmin;
  }, []);

  const logout = useCallback(() => {
    clearStoredSession();
    setAdmin(null);
  }, []);

  const markPasswordChanged = useCallback(() => {
    setAdmin((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, must_change_password: false };
      localStorage.setItem(PLATFORM_ADMIN_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <PlatformAuthContext.Provider
      value={{
        admin,
        loading,
        isAuthenticated: Boolean(admin),
        login,
        logout,
        markPasswordChanged,
      }}
    >
      {children}
    </PlatformAuthContext.Provider>
  );
}
