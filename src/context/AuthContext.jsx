import { createContext, useContext, useState, useEffect } from 'react';
import client from '../api/client';

const TOKEN_KEY = 'mototrack_token';
const USER_KEY  = 'mototrack_user';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user,  setUser]  = useState(null);
  const [token, setToken] = useState(null);
  // null = cargando todavía, false/object = ya sabemos
  const [loading, setLoading] = useState(true);

  // Al montar: restaurar sesión si hay token en localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY);
    const savedUser  = localStorage.getItem(USER_KEY);

    if (!savedToken) {
      setLoading(false);
      return;
    }

    // Validar token llamando a /auth/me
    client.get('/auth/me')
      .then(({ data }) => {
        setToken(savedToken);
        setUser(data.data);
      })
      .catch(() => {
        // Token expirado o inválido — limpiamos
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
      })
      .finally(() => setLoading(false));
  }, []);

  /**
   * Login: llama a POST /auth/login, persiste token + user, retorna el user
   * (el caller decide a dónde redirigir según el rol).
   */
  async function login(email, password) {
    const { data } = await client.post('/auth/login', { email, password });
    const { token: newToken, user: newUser } = data.data;

    localStorage.setItem(TOKEN_KEY, newToken);
    localStorage.setItem(USER_KEY, JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }

  /**
   * Logout: limpia localStorage y el estado — el componente que llama se
   * encarga de redirigir a /login.
   */
  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
