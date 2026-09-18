import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/** Devuelve la ruta por defecto de cada rol */
function defaultRouteFor(role) {
  if (role === 'admin')    return '/dashboard';
  if (role === 'cajero')   return '/sales';
  if (role === 'mecanico') return '/workorders';
  return '/login';
}

/**
 * Envuelve rutas privadas.
 * - Sin sesión → redirige a /login.
 * - Con sesión pero rol no permitido → redirige a la ruta por defecto del rol
 *   (ya está logueado, solo no tiene permiso en esa ruta).
 */
export default function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Mientras se restaura la sesión no renderizamos nada (evita flash a /login)
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user.role)} replace />;
  }

  return children;
}
