import { useState, useCallback } from 'react';
import client from '../api/client';

/**
 * Hook puro de facturación — SOLO lógica y llamadas API, sin JSX.
 * Todas las funciones devuelven { ok, data } | { ok: false, error }.
 */
export function useInvoicing() {
  const [invoices,        setInvoices]        = useState([]);
  const [uninvoicedSales, setUninvoicedSales] = useState([]);
  const [loading,         setLoading]         = useState(false);
  const [loadingUninv,    setLoadingUninv]    = useState(false);

  // ─── Lectura ─────────────────────────────────────────────────────────────

  const getAll = useCallback(async ({ estado } = {}) => {
    setLoading(true);
    try {
      const params = estado ? { estado } : {};
      const { data } = await client.get('/invoicing', { params });
      const list = data.data ?? [];
      setInvoices(list);
      return { ok: true, data: list };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al cargar comprobantes.' };
    } finally {
      setLoading(false);
    }
  }, []);

  async function getById(id) {
    try {
      const { data } = await client.get(`/invoicing/${id}`);
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al cargar comprobante.' };
    }
  }

  async function getStatus(id) {
    try {
      const { data } = await client.get(`/invoicing/${id}/status`);
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al obtener estado.' };
    }
  }

  /** Datos completos del comprobante para el ticket de impresión */
  async function getTicketData(id) {
    try {
      const { data } = await client.get(`/invoicing/${id}`);
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al cargar ticket.' };
    }
  }

  async function getPendingContingency() {
    try {
      const { data } = await client.get('/invoicing/pending');
      return { ok: true, data: data.data ?? [] };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al cargar contingencia.' };
    }
  }

  // ─── Ventas sin facturar ──────────────────────────────────────────────────

  /**
   * Combina GET /api/sales con GET /api/invoicing y retorna solo las ventas
   * cuyo id NO aparece como sale_id en ningún comprobante existente.
   * Ordena por fecha descendente.
   */
  const getUninvoicedSales = useCallback(async () => {
    setLoadingUninv(true);
    try {
      const [salesRes, invRes] = await Promise.all([
        client.get('/sales', { params: { status: 'completed' } }),
        client.get('/invoicing'),
      ]);
      const sales    = salesRes.data.data ?? [];
      const invoices = invRes.data.data   ?? [];

      const invoicedIds = new Set(invoices.map(i => i.sale_id).filter(Boolean));

      const uninvoiced = sales
        .filter(s => !s.is_voided && !invoicedIds.has(s.id))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      setUninvoicedSales(uninvoiced);
      return { ok: true, data: uninvoiced };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al cargar ventas pendientes.' };
    } finally {
      setLoadingUninv(false);
    }
  }, []);

  // ─── Mutaciones ───────────────────────────────────────────────────────────

  /**
   * Emite un comprobante.
   * Si la respuesta trae alreadyExists: true, lo retorna como información,
   * NO como error — la UI debe mostrarlo como aviso, no como fallo.
   */
  async function createInvoice({ sale_id, comprobante_type, customer_document_type, customer_document_number }) {
    try {
      const { data } = await client.post('/invoicing', {
        sale_id,
        comprobante_type,
        customer_document_type:   customer_document_type   || undefined,
        customer_document_number: customer_document_number || undefined,
      });
      const invoice = data.data;
      // Refetch para sincronizar ambas listas
      await Promise.all([getAll(), getUninvoicedSales()]);
      return {
        ok:            true,
        data:          invoice,
        alreadyExists: invoice?.alreadyExists ?? false,
      };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al emitir comprobante.' };
    }
  }

  async function retryContingency(id) {
    try {
      const { data } = await client.patch(`/invoicing/${id}/retry`);
      await getAll(); // refetch para actualizar estado del comprobante
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al reintentar sincronización.' };
    }
  }

  return {
    invoices,
    uninvoicedSales,
    loading,
    loadingUninv,
    getAll,
    getById,
    getStatus,
    getTicketData,
    getPendingContingency,
    getUninvoicedSales,
    createInvoice,
    retryContingency,
  };
}
