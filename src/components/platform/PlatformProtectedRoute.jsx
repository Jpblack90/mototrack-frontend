import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Skeleton } from '../ui/skeleton';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';

/**
 * Guardia de rutas exclusiva para el panel de plataforma (/plataforma/*).
 * Redirige a /plataforma/login si no hay sesión o a /plataforma/change-password
 * cuando el administrador tiene cambio obligatorio pendiente.
 */
export default function PlatformProtectedRoute() {
  const { admin, loading, isAuthenticated } = usePlatformAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-7 w-48 mx-auto" />
          <Skeleton className="h-4 w-64 mx-auto" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/plataforma/login" replace state={{ from: location.pathname }} />;
  }

  const isChangePasswordRoute = location.pathname === '/plataforma/change-password';

  if (admin?.must_change_password && !isChangePasswordRoute) {
    return <Navigate to="/plataforma/change-password" replace />;
  }

  if (!admin?.must_change_password && isChangePasswordRoute) {
    return <Navigate to="/plataforma" replace />;
  }

  return <Outlet />;
}
