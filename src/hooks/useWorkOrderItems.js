import { useState, useCallback } from 'react';
import client from '../api/client';

const INITIAL_SUMMARY = {
  items_count: 0,
  approved_total: 0,
  pending_total: 0,
  rejected_total: 0,
  active_total: 0,
  has_pending_items: false,
};

/**
 * Hook puro para gestionar repuestos y servicios por línea dentro de una OT.
 * No contiene JSX ni lógica visual.
 */
export function useWorkOrderItems() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState(INITIAL_SUMMARY);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const loadItems = useCallback(async (workOrderId) => {
    if (!workOrderId) {
      setItems([]);
      setSummary(INITIAL_SUMMARY);
      return { ok: false, error: 'OT no especificada.' };
    }
    setLoading(true);
    setError('');
    try {
      const { data } = await client.get(`/workorders/${workOrderId}/items`);
      const payload = data?.data ?? {};
      setItems(payload.items ?? []);
      setSummary(payload.summary ?? INITIAL_SUMMARY);
      return { ok: true, data: payload };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'No se pudieron cargar las líneas de la orden.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const searchProducts = useCallback(async (term) => {
    const q = String(term || '').trim();
    if (!q) {
      setSearchResults([]);
      return [];
    }
    setSearchLoading(true);
    try {
      const { data } = await client.get('/inventory', { params: { search: q } });
      const list = data?.data ?? [];
      setSearchResults(list);
      return list;
    } catch {
      setSearchResults([]);
      return [];
    } finally {
      setSearchLoading(false);
    }
  }, []);

  const addProductItem = useCallback(async (workOrderId, { product_id, quantity = 1 }) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await client.post(`/workorders/${workOrderId}/items`, {
        type: 'product',
        product_id: Number(product_id),
        quantity: Number(quantity),
      });
      await loadItems(workOrderId);
      return { ok: true, data: data?.data };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'No se pudo agregar el repuesto.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [loadItems]);

  const addServiceItem = useCallback(async (workOrderId, { description, unit_price, quantity = 1 }) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await client.post(`/workorders/${workOrderId}/items`, {
        type: 'service',
        description: String(description || '').trim(),
        unit_price: Number(unit_price),
        quantity: Number(quantity),
      });
      await loadItems(workOrderId);
      return { ok: true, data: data?.data };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'No se pudo agregar el servicio.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [loadItems]);

  const decideItem = useCallback(async (workOrderId, itemId, { decision, channel }) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await client.patch(`/workorders/${workOrderId}/items/${itemId}/decision`, {
        decision,
        channel,
      });
      await loadItems(workOrderId);
      return { ok: true, data: data?.data };
    } catch (err) {
      const msg = err.response?.data?.error?.message || 'No se pudo registrar la decisión.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, [loadItems]);

  const createNotifyLink = useCallback(async (workOrderId) => {
    setSubmitting(true);
    setError('');
    try {
      const { data } = await client.post(`/workorders/${workOrderId}/items/notify-link`);
      return { ok: true, data: data?.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ||
        'No se pudo preparar el enlace de WhatsApp.';
      return { ok: false, error: msg };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const resetSearch = useCallback(() => {
    setSearchResults([]);
  }, []);

  return {
    items,
    summary,
    loading,
    submitting,
    error,
    searchResults,
    searchLoading,
    loadItems,
    searchProducts,
    resetSearch,
    addProductItem,
    addServiceItem,
    decideItem,
    createNotifyLink,
  };
}
