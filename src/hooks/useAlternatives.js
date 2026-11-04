import { useState, useCallback } from 'react';
import client from '../api/client';

export function useAlternatives() {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAlternatives = useCallback(async (productId, compatibleWith = '') => {
    if (!productId) return [];
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (compatibleWith && compatibleWith.trim()) {
        params.compatible_with = compatibleWith.trim();
      }
      const { data } = await client.get(`/inventory/${productId}/alternatives`, { params });
      const alts = data?.data || [];
      setAlternatives(alts);
      return alts;
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'Error al cargar alternativas';
      setError(msg);
      setAlternatives([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    alternatives,
    loading,
    error,
    fetchAlternatives,
  };
}
