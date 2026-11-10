import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';

/**
 * Hook para consultar el historial de pagos de suscripción de la empresa (solo Administradores).
 */
export function usePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/company/payments');
      setPayments(res.data || []);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar el historial de pagos.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  return {
    payments,
    loading,
    error,
    refresh: fetchPayments,
  };
}
