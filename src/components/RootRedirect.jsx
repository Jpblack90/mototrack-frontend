import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Ruta raíz → redirige a la página por defecto del rol autenticado */
export default function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'admin')    return <Navigate to="/dashboard"  replace />;
  if (user.role === 'cajero')   return <Navigate to="/sales"      replace />;
  if (user.role === 'mecanico') return <Navigate to="/workorders" replace />;
  return <Navigate to="/login" replace />;
}
