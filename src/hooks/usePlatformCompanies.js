import { useState, useEffect, useCallback } from 'react';
import platformClient from '../api/platformClient';
import { extractPlatformError } from '../lib/platformErrors';

/**
 * Lista los talleres registrados en MotoTrack con filtros de estado y búsqueda.
 */
export function usePlatformCompanies(filters = {}) {
  const status = filters?.status && filters.status !== 'all' ? filters.status : '';
  const search = filters?.search?.trim() || '';

  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = `${status}|${search}|${reloadKey}`;
  const [state, setState] = useState({ key: '', data: [], error: null });

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;
    const params = {};
    if (status) params.status = status;
    if (search) params.search = search;

    platformClient
      .get('/platform/companies', { params })
      .then((res) => {
        if (active) {
          setState({ key: requestKey, data: res.data.data || [], error: null });
        }
      })
      .catch((err) => {
        if (active) {
          setState((prev) => ({
            key: requestKey,
            data: prev.data,
            error: extractPlatformError(err, 'No se pudo cargar la lista de talleres.'),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [status, search, requestKey]);

  return {
    companies: state.data,
    loading: state.key !== requestKey,
    error: state.error,
    refresh,
  };
}
