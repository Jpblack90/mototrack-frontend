import { useState, useEffect, useCallback } from 'react';
import platformClient from '../api/platformClient';
import { extractPlatformError } from '../lib/platformErrors';

/**
 * Obtiene el detalle de un taller, su suscripción, usuarios, pagos y conteos del mes.
 */
export function usePlatformCompany(companyId) {
  const [reloadKey, setReloadKey] = useState(0);
  const requestKey = companyId ? `${companyId}|${reloadKey}` : '';
  const [state, setState] = useState({ key: '', data: null, error: null });

  const refresh = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    if (!requestKey) return undefined;

    let active = true;

    platformClient
      .get(`/platform/companies/${companyId}`)
      .then((res) => {
        if (active) {
          setState({ key: requestKey, data: res.data.data, error: null });
        }
      })
      .catch((err) => {
        if (active) {
          setState({
            key: requestKey,
            data: null,
            error: extractPlatformError(err, 'No se pudo cargar el detalle del taller.'),
          });
        }
      });

    return () => {
      active = false;
    };
  }, [companyId, requestKey]);

  return {
    company: requestKey ? state.data : null,
    loading: Boolean(requestKey) && state.key !== requestKey,
    error: requestKey ? state.error : null,
    refresh,
  };
}
