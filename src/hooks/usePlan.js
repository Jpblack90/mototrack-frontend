import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';

/**
 * Hook para consultar el plan comercial asignado a la empresa y su consumo acumulado.
 */
export function usePlan() {
  const [planData, setPlanData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPlan = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/company/plan');
      setPlanData(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar la información del plan.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPlan();
  }, [fetchPlan]);

  return {
    planData,
    loading,
    error,
    refresh: fetchPlan,
  };
}
