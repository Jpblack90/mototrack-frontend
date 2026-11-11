import { useState, useEffect, useCallback } from 'react';
import platformClient from '../api/platformClient';
import { extractPlatformError } from '../lib/platformErrors';

/**
 * Consulta la bitácora inmutable de acciones realizadas desde la plataforma.
 */
export function usePlatformAudit(filters = {}) {
  const companyId = filters?.company_id ?? '';
  const action = filters?.action ?? '';
  const page = filters?.page ?? 1;
  const limit = filters?.limit ?? 15;
  const enabled = filters?.enabled ?? true;

  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = enabled ? `${companyId}|${action}|${page}|${limit}|${reloadKey}` : '';
  const [state, setState] = useState({
    key: '',
    logs: [],
    pagination: { total: 0, page: 1, limit, totalPages: 1 },
    error: null,
  });

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!requestKey) return undefined;

    let active = true;
    const params = { page, limit };
    if (companyId) params.company_id = companyId;
    if (action) params.action = action;

    platformClient
      .get('/platform/audit', { params })
      .then((res) => {
        if (!active) return;
        const payload = res.data.data || {};
        setState({
          key: requestKey,
          logs: payload.logs || [],
          pagination: payload.pagination || { total: 0, page, limit, totalPages: 1 },
          error: null,
        });
      })
      .catch((err) => {
        if (active) {
          setState((prev) => ({
            ...prev,
            key: requestKey,
            error: extractPlatformError(err, 'No se pudo cargar la actividad de soporte.'),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [companyId, action, page, limit, requestKey]);

  return {
    logs: requestKey ? state.logs : [],
    pagination: requestKey
      ? state.pagination
      : { total: 0, page: 1, limit, totalPages: 1 },
    loading: Boolean(requestKey) && state.key !== requestKey,
    error: requestKey ? state.error : null,
    refresh,
  };
}
