import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';
import LoginPage      from './pages/LoginPage';
import SplashPage     from './pages/SplashPage';
import { Skeleton }   from './components/ui/skeleton';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { ROUTE_ROLES } from './lib/roles';

const RegisterPage       = lazy(() => import('./pages/RegisterPage'));
const DashboardPage      = lazy(() => import('./pages/DashboardPage'));
const InventoryPage      = lazy(() => import('./pages/InventoryPage'));
const WorkOrdersPage     = lazy(() => import('./pages/WorkOrdersPage'));
const SalesPage          = lazy(() => import('./pages/SalesPage'));
const InvoicingPage      = lazy(() => import('./pages/InvoicingPage'));
const SettingsPage       = lazy(() => import('./pages/SettingsPage'));
const UsersPage          = lazy(() => import('./pages/UsersPage'));
const AuditPage          = lazy(() => import('./pages/AuditPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));

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

            {/* Raíz: splash → redirige según rol */}
            <Route path="/" element={<SplashPage />} />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" richColors />
      </BrowserRouter>
    </TooltipProvider>
  );
}
