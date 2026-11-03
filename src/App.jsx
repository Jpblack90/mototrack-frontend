import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';
import LoginPage      from './pages/LoginPage';
import RegisterPage   from './pages/RegisterPage';
import SplashPage     from './pages/SplashPage';
import DashboardPage  from './pages/DashboardPage';
import InventoryPage  from './pages/InventoryPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import SalesPage      from './pages/SalesPage';
import InvoicingPage  from './pages/InvoicingPage';
import SettingsPage   from './pages/SettingsPage';
import UsersPage      from './pages/UsersPage';
import AuditPage      from './pages/AuditPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { ROUTE_ROLES } from './lib/roles';

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
      <BrowserRouter>
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
      <Toaster position="top-right" richColors />
    </BrowserRouter>
  </TooltipProvider>
  );
}
