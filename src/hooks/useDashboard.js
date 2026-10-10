import { useState, useCallback } from 'react';
import client from '../api/client';

/**
 * Hook puro de datos del Dashboard — SOLO lógica y llamadas API, sin JSX.
 * Sigue el mismo patrón que useSales.js / useWorkOrders.js.
 * NO cambia qué endpoint se llama ni la forma del JSON que devuelve el backend.
 */
export function useDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/dashboard');
      setData(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Error al cargar el dashboard.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  // Datos derivados — misma lógica que tenía DashboardPage, extraída al hook
  const sales         = data?.sales;
  const inventory     = data?.inventory;
  const workorders    = data?.workorders;
  const invoicing     = data?.invoicing;

  const pendingCount  = invoicing?.pending_contingency?.length ?? 0;
  const lowStock      = inventory?.low_stock_products ?? [];

  // ⚠️ Limitación documentada: el endpoint /dashboard devuelve totales agregados,
  // NO una serie temporal. No se puede construir un gráfico de tendencia sin
  // un endpoint dedicado que exponga datos por período (día/semana/mes).
  // La Tarea 4 queda pendiente hasta que el backend exponga esa serie.
  const salesTimeSeries = null; // placeholder explícito

  return {
    data,
    loading,
    error,
    fetchDashboard,
    // KPIs
    sales,
    inventory,
    workorders,
    invoicing,
    pendingCount,
    lowStock,
    salesTimeSeries,
  };
}
