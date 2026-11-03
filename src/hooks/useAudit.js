import { useState, useCallback } from 'react';
import client from '../api/client';

/**
 * Hook para la consulta y visualización de registros de auditoría (RF-09).
 * Permite filtrar por entidad, usuario, fechas, paginar y consultar el historial de un recurso.
 */
export function useAudit() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 1,
  });

  const fetchLogs = useCallback(async (filters = {}) => {
    setLoading(true);
    setError('');
    try {
      // Limpiar parámetros vacíos o nulos
      const params = {};
      Object.entries(filters).forEach(([key, val]) => {
        if (val !== undefined && val !== null && String(val).trim() !== '' && val !== 'all') {
          params[key] = val;
        }
      });

      const { data: res } = await client.get('/audit', { params });
      const data = res.data || {};
      setLogs(data.logs || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 });
      return { ok: true, data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar el registro de auditoría.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEntityHistory = useCallback(async (entity, entityId) => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/audit', {
        params: { entity, entity_id: entityId, limit: 50 },
      });
      return { ok: true, logs: res.data?.logs || [] };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar el historial del elemento.';
      return { ok: false, error: msg, logs: [] };
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    logs,
    loading,
    error,
    pagination,
    fetchLogs,
    fetchEntityHistory,
  };
}
