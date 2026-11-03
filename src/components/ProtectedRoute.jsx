import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { defaultRouteFor } from '../lib/roles';

/**
 * Envuelve rutas privadas.
 * - Sin sesión → redirige a /login.
 * - Con sesión pero rol no permitido → redirige a la ruta por defecto del rol
 *   (ya está logueado, solo no tiene permiso en esa ruta).
 */
export default function ProtectedRoute({ children, allowedRoles, allowMustChangePassword = false }) {
  const { isAuthenticated, user, loading } = useAuth();

  // Mientras se restaura la sesión no renderizamos nada (evita flash a /login)
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el usuario tiene cambio obligatorio de contraseña y no está en /change-password
  if (user?.must_change_password && !allowMustChangePassword) {
    return <Navigate to="/change-password" replace />;
  }

  // Si el usuario ya no tiene cambio pendiente e intenta ir a /change-password
  if (!user?.must_change_password && allowMustChangePassword) {
    return <Navigate to={defaultRouteFor(user?.role)} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={defaultRouteFor(user.role)} replace />;
  }

  return children;
}
