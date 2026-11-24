import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';

/**
 * Hook de datos para la tendencia de ventas en el Dashboard.
 * Permite consultar la serie temporal por período (7, 30, 60 días)
 * con estados de carga, error y función de reintento.
 */
export function useSalesTrend(initialDays = 30) {
  const [days, setDays] = useState(initialDays);
  const [salesTrend, setSalesTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSalesTrend = useCallback(async (periodDays = days) => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get(`/dashboard/sales-trend?days=${periodDays}`);
      setSalesTrend(res.data);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'No se pudo cargar la tendencia';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchSalesTrend(days);
  }, [days, fetchSalesTrend]);

  return {
    days,
    setDays,
    salesTrend,
    loading,
    error,
    refetch: () => fetchSalesTrend(days),
  };
}
