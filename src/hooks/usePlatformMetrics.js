import { useState, useEffect, useCallback } from 'react';
import platformClient from '../api/platformClient';
import { extractPlatformError } from '../lib/platformErrors';

/**
 * Obtiene las métricas agregadas de la plataforma para la pantalla Resumen.
 */
export function usePlatformMetrics() {
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState({ key: -1, data: null, error: null });

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let active = true;

    platformClient
      .get('/platform/metrics')
      .then((res) => {
        if (active) {
          setState({ key: reloadKey, data: res.data.data, error: null });
        }
      })
      .catch((err) => {
        if (active) {
          setState((prev) => ({
            key: reloadKey,
            data: prev.data,
            error: extractPlatformError(err, 'No se pudieron cargar las métricas de plataforma.'),
          }));
        }
      });

    return () => {
      active = false;
    };
  }, [reloadKey]);

  return {
    metrics: state.data,
    loading: state.key !== reloadKey,
    error: state.error,
    refresh,
  };
}
