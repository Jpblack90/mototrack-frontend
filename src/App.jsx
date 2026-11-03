import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout      from './components/layout/AppLayout';
import LoginPage      from './pages/LoginPage';
import SplashPage     from './pages/SplashPage';
import DashboardPage  from './pages/DashboardPage';
import InventoryPage  from './pages/InventoryPage';
import WorkOrdersPage from './pages/WorkOrdersPage';
import SalesPage      from './pages/SalesPage';
import InvoicingPage  from './pages/InvoicingPage';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <TooltipProvider delayDuration={200}>
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
