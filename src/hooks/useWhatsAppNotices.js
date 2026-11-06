import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';

/**
 * Hook para la gestión de avisos de WhatsApp (RF-15 / Fase 1).
 * Consulta y actualiza notificaciones en tiempo real para admin y cajero.
 */
export function useWhatsAppNotices() {
  const { user } = useAuth();
  const canSeeNotices = user && ['admin', 'cajero'].includes(user.role);

  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPending = useCallback(async () => {
    if (!canSeeNotices) {
      setPending([]);
      return;
    }
    setLoading(true);
    try {
      const res = await client.get('/notifications/pending');
      const list = res.data?.data || [];
      setPending(list);
    } catch {
      // Silencioso en caso de error de red o backend temporal
    } finally {
      setLoading(false);
    }
  }, [canSeeNotices]);

  useEffect(() => {
    if (!canSeeNotices) {
      return;
    }

    // Carga diferida no síncrona con el montaje para evitar alertas de oxlint
    const t = setTimeout(() => {
      fetchPending();
    }, 100);

    // Sondeo cada 60 segundos
    const interval = setInterval(fetchPending, 60000);

    // Escuchar eventos globales de actualización de OTs
    const handleRefresh = () => fetchPending();
    window.addEventListener('mototrack:workorder-updated', handleRefresh);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
      window.removeEventListener('mototrack:workorder-updated', handleRefresh);
    };
  }, [fetchPending, canSeeNotices]);

  /**
   * Obtiene el enlace de WhatsApp (wa.me) con el mensaje codificado.
   */
  const getLink = useCallback(async (notificationId) => {
    try {
      const res = await client.get(`/notifications/${notificationId}/whatsapp-link`);
      return { ok: true, data: res.data?.data };
    } catch (err) {
      return {
        ok: false,
        error:
          err.response?.data?.error?.message ||
          'Error al obtener enlace de WhatsApp.',
      };
    }
  }, []);

  /**
   * Marca el aviso como abierto (status = 'opened').
   */
  const markOpened = useCallback(
    async (notificationId) => {
      try {
        const res = await client.patch(`/notifications/${notificationId}/opened`);
        await fetchPending();
        return { ok: true, data: res.data?.data };
      } catch (err) {
        return {
          ok: false,
          error:
            err.response?.data?.error?.message ||
            'Error al marcar aviso como abierto.',
        };
      }
    },
    [fetchPending]
  );

  /**
   * Marca el aviso como omitido (status = 'skipped') cuando se contactó por otro canal.
   */
  const skip = useCallback(
    async (notificationId) => {
      try {
        const res = await client.patch(`/notifications/${notificationId}/skip`);
        await fetchPending();
        return { ok: true, data: res.data?.data };
      } catch (err) {
        return {
          ok: false,
          error:
            err.response?.data?.error?.message ||
            'Error al omitir aviso.',
        };
      }
    },
    [fetchPending]
  );

  return {
    pending,
    loading,
    fetchPending,
    getLink,
    markOpened,
    skip,
  };
}
