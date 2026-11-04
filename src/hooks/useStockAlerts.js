import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

const ALERT_ROLES = ['admin', 'cajero', 'almacenero'];

export function useStockAlerts() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState({
    out_of_stock: [],
    low_stock: [],
    total_alerts: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const canViewAlerts = user && ALERT_ROLES.includes(user.role);

  const fetchAlerts = useCallback(async () => {
    if (!canViewAlerts) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get('/inventory/alerts');
      const payload = data?.data || { out_of_stock: [], low_stock: [], total_alerts: 0, total: 0 };
      setAlerts({
        out_of_stock: payload.out_of_stock || [],
        low_stock: payload.low_stock || [],
        total_alerts: payload.total_alerts ?? payload.total ?? 0,
        total: payload.total ?? payload.total_alerts ?? 0,
      });
    } catch (err) {
      if (err.response?.status !== 403) {
        setError(err.response?.data?.error?.message || 'Error al obtener alertas de stock');
      }
    } finally {
      setLoading(false);
    }
  }, [canViewAlerts]);

  // Carga inicial y sondeo periódico cada 2 minutos (120 000 ms)
  useEffect(() => {
    if (!canViewAlerts) return;

    let ignore = false;
    const initialFetch = async () => {
      try {
        const { data } = await client.get('/inventory/alerts');
        if (!ignore) {
          const payload = data?.data || { out_of_stock: [], low_stock: [], total_alerts: 0, total: 0 };
          setAlerts({
            out_of_stock: payload.out_of_stock || [],
            low_stock: payload.low_stock || [],
            total_alerts: payload.total_alerts ?? payload.total ?? 0,
            total: payload.total ?? payload.total_alerts ?? 0,
          });
        }
      } catch (err) {
        if (!ignore && err.response?.status !== 403) {
          setError(err.response?.data?.error?.message || 'Error al obtener alertas de stock');
        }
      }
    };

    initialFetch();

    const interval = setInterval(() => {
      fetchAlerts();
    }, 120_000);

    // Escucha de eventos de venta completada para refresco inmediato
    const handleSaleCompleted = () => {
      fetchAlerts();
    };

    window.addEventListener('mototrack:sale-completed', handleSaleCompleted);

    return () => {
      ignore = true;
      clearInterval(interval);
      window.removeEventListener('mototrack:sale-completed', handleSaleCompleted);
    };
  }, [canViewAlerts, fetchAlerts]);

  return {
    alerts,
    loading,
    error,
    refresh: fetchAlerts,
  };
}
