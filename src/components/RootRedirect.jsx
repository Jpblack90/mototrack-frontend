import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultRouteFor } from '../lib/roles';

/** Ruta raíz → redirige a la página por defecto del rol autenticado */
export default function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={defaultRouteFor(user?.role)} replace />;
}
