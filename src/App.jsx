import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';
import LoginPage      from './pages/LoginPage';
import DashboardPage  from './pages/DashboardPage';
import InventoryPage  from './pages/InventoryPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import SalesPage      from './pages/SalesPage';
import InvoicingPage  from './pages/InvoicingPage';

/** Ruta raíz "/" → redirige a la página por defecto del rol autenticado */
function RootRedirect() {
  const { isAuthenticated, user, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user.role === 'admin')    return <Navigate to="/dashboard"  replace />;
  if (user.role === 'cajero')   return <Navigate to="/sales"      replace />;
  if (user.role === 'mecanico') return <Navigate to="/workorders" replace />;
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<LoginPage />} />

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
              <ProtectedRoute allowedRoles={['admin']}>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          {/* Inventario — admin y cajero */}
          <Route
            path="/inventory"
            element={
              <ProtectedRoute allowedRoles={['admin', 'cajero']}>
                <InventoryPage />
              </ProtectedRoute>
            }
          />

          {/* Órdenes de Trabajo — todos los roles autenticados */}
          <Route path="/workorders" element={<WorkOrdersPage />} />

          {/* Ventas — admin y cajero */}
          <Route
            path="/sales"
            element={
              <ProtectedRoute allowedRoles={['admin', 'cajero']}>
                <SalesPage />
              </ProtectedRoute>
            }
          />

          {/* Facturación — todos los roles autenticados */}
          <Route path="/invoicing" element={<InvoicingPage />} />
        </Route>

        {/* Raíz: redirige según rol */}
        <Route path="/" element={<RootRedirect />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
