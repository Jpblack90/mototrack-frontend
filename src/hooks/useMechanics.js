import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';

/**
 * Hook de solo lectura para obtener los mecánicos activos de la empresa.
 * Llama a GET /api/users/mechanics (admin y cajero).
 * No modifica useWorkOrders (business-logic-protection).
 */
export function useMechanics() {
  const [mechanics, setMechanics] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/users/mechanics');
      setMechanics(res.data ?? []);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar mecánicos.';
      setError(msg);
      setMechanics([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const { data: res } = await client.get('/users/mechanics');
        if (mounted) setMechanics(res.data ?? []);
      } catch (err) {
        if (mounted) {
          const msg =
            err.response?.data?.error?.message ??
            err.response?.data?.message ??
            'Error al cargar mecánicos.';
          setError(msg);
          setMechanics([]);
        }
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { mechanics, loading, error, refresh };
}
