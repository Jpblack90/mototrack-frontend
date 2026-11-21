import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';
import { PlatformAuthProvider } from './context/PlatformAuthContext';
import PlatformProtectedRoute   from './components/platform/PlatformProtectedRoute';
import PlatformLayout           from './components/platform/PlatformLayout';
import LoginPage      from './pages/LoginPage';
import SplashPage     from './pages/SplashPage';
import { Skeleton }   from './components/ui/skeleton';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { ROUTE_ROLES } from './lib/roles';
import ErrorBoundary from './components/ErrorBoundary';

/**
 * lazyWithRetry (A-04): reintenta una vez si el chunk falla al cargar
 * (red inestable, deploy intermedio). Si falla dos veces, recarga la página.
 */
function lazyWithRetry(importer) {
  return lazy(() =>
    importer().catch(() =>
      importer().catch((err) => {
        // A-04: recarga una sola vez por sesión para evitar un bucle de recargas
        const KEY = 'mototrack_chunk_reload';
        let reloaded = false;
        try { reloaded = sessionStorage.getItem(KEY) === '1'; } catch { /* sin storage */ }
        if (!reloaded) {
          try { sessionStorage.setItem(KEY, '1'); } catch { /* sin storage */ }
          window.location.reload();
          return { default: () => null };
        }
        throw err; // segundo fallo: lo muestra el ErrorBoundary
      })
    )
  );
}

const RegisterPage       = lazyWithRetry(() => import('./pages/RegisterPage'));
const DashboardPage      = lazyWithRetry(() => import('./pages/DashboardPage'));
const InventoryPage      = lazyWithRetry(() => import('./pages/InventoryPage'));
const WorkOrdersPage     = lazyWithRetry(() => import('./pages/WorkOrdersPage'));
const SalesPage          = lazyWithRetry(() => import('./pages/SalesPage'));
const InvoicingPage      = lazyWithRetry(() => import('./pages/InvoicingPage'));
const SettingsPage       = lazyWithRetry(() => import('./pages/SettingsPage'));
const UsersPage          = lazyWithRetry(() => import('./pages/UsersPage'));
const AuditPage          = lazyWithRetry(() => import('./pages/AuditPage'));
const ChangePasswordPage         = lazyWithRetry(() => import('./pages/ChangePasswordPage'));
const PlatformLoginPage          = lazyWithRetry(() => import('./pages/platform/PlatformLoginPage'));
const PlatformChangePasswordPage = lazyWithRetry(() => import('./pages/platform/PlatformChangePasswordPage'));
const PlatformSummaryPage        = lazyWithRetry(() => import('./pages/platform/PlatformSummaryPage'));
const PlatformCompaniesPage      = lazyWithRetry(() => import('./pages/platform/PlatformCompaniesPage'));
const PlatformCompanyDetailPage  = lazyWithRetry(() => import('./pages/platform/PlatformCompanyDetailPage'));

function PageFallback() {
  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto animate-pulse">
      <div className="flex items-center justify-between pb-4 border-b border-border">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-80 w-full" />
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <TooltipProvider delayDuration={200}>
        <BrowserRouter>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Pública */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Cambio obligatorio de contraseña (sin layout) */}
              <Route
                path="/change-password"
                element={
                  <ProtectedRoute allowMustChangePassword>
                    <ChangePasswordPage />
                  </ProtectedRoute>
                }
              />

              {/* Rutas protegidas bajo AppLayout */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                {/* Dashboard — solo admin */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.dashboard}>
                      <DashboardPage />
                    </ProtectedRoute>
                  }
                />

                {/* Inventario — admin, cajero, almacenero y mecánico (solo lectura) */}
                <Route
                  path="/inventory"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.inventory}>
                      <InventoryPage />
                    </ProtectedRoute>
                  }
                />

                {/* Órdenes de Trabajo — todos los roles autenticados */}
                <Route
                  path="/workorders"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.workorders}>
                      <WorkOrdersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Ventas — admin y cajero */}
                <Route
                  path="/sales"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.sales}>
                      <SalesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Facturación — admin y cajero */}
                <Route
                  path="/invoicing"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.invoicing}>
                      <InvoicingPage />
                    </ProtectedRoute>
                  }
                />

                {/* Configuración del Taller — solo admin */}
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.settings}>
                      <SettingsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Gestión de Usuarios — solo admin */}
                <Route
                  path="/users"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.users}>
                      <UsersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Auditoría Inmutable (RF-09) — solo admin */}
                <Route
                  path="/audit"
                  element={
                    <ProtectedRoute allowedRoles={ROUTE_ROLES.audit}>
                      <AuditPage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* Panel de plataforma (super-admin) — sesión y rutas separadas */}
              <Route
                path="/plataforma"
                element={
                  <PlatformAuthProvider>
                    <Outlet />
                  </PlatformAuthProvider>
                }
              >
                <Route path="login" element={<PlatformLoginPage />} />
                <Route element={<PlatformProtectedRoute />}>
                  <Route path="change-password" element={<PlatformChangePasswordPage />} />
                  <Route element={<PlatformLayout />}>
                    <Route index element={<PlatformSummaryPage />} />
                    <Route path="talleres" element={<PlatformCompaniesPage />} />
                    <Route path="talleres/:id" element={<PlatformCompanyDetailPage />} />
                  </Route>
                </Route>
                <Route path="*" element={<Navigate to="/plataforma" replace />} />
              </Route>

              {/* Raíz: splash → redirige según rol */}
              <Route path="/" element={<SplashPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-right" richColors />
        </BrowserRouter>
      </TooltipProvider>
    </ErrorBoundary>
  );
}
