import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';

/**
 * Hook para gestionar la información y configuración de la empresa actual.
 */
export function useCompany() {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchCompany = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/company');
      setCompany(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar la información de la empresa.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCompany = useCallback(async (updateData) => {
    setError('');
    try {
      const { data: res } = await client.put('/company', updateData);
      setCompany(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al actualizar la configuración.';
      setError(msg);
      return { ok: false, error: msg };
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  return {
    company,
    loading,
    error,
    refresh: fetchCompany,
    updateCompany,
  };
}
