import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para consultar alertas de retiro de motocicletas (RF-17).
 * Solo consulta la API si el usuario tiene rol 'admin' o 'cajero'.
 *
 * Devuelve:
 * - notPickedUp: órdenes con status = 'no_recogido'
 * - dueSoon: órdenes terminadas a las que les faltan 2 días o menos para vencer
 * - totalPickupAlerts: suma total de alertas de retiro
 * - loading: estado de carga
 * - fetchPickupAlerts: función para refrescar manualmente
 */
export function usePickupAlerts() {
  const { user } = useAuth();
  const [notPickedUp, setNotPickedUp] = useState([]);
  const [dueSoon, setDueSoon] = useState([]);
  const [loading, setLoading] = useState(false);

  const canSeeAlerts = user?.role === 'admin' || user?.role === 'cajero';

  const fetchPickupAlerts = useCallback(async () => {
    if (!canSeeAlerts) return;
    try {
      setLoading(true);
      const { data } = await client.get('/workorders/pickup-alerts');
      const alerts = data.data || {};
      setNotPickedUp(alerts.not_picked_up || []);
      setDueSoon(alerts.due_soon || []);
    } catch {
      // Silenciar errores en segundo plano para no interrumpir el flujo del usuario
    } finally {
      setLoading(false);
    }
  }, [canSeeAlerts]);

  useEffect(() => {
    if (!canSeeAlerts) return;

    // Carga diferida no síncrona con el montaje para evitar alertas de oxlint
    const t = setTimeout(() => {
      fetchPickupAlerts();
    }, 100);

    // Sondeo cada 60 segundos
    const interval = setInterval(fetchPickupAlerts, 60000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [canSeeAlerts, fetchPickupAlerts]);

  return {
    notPickedUp,
    dueSoon,
    totalPickupAlerts: notPickedUp.length + dueSoon.length,
    loading,
    fetchPickupAlerts,
  };
}
