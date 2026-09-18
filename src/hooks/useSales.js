import { useState, useCallback } from 'react';
import client from '../api/client';

/**
 * Hook puro de ventas — SOLO lógica y llamadas a API, sin JSX.
 *
 * Exporta:
 *  - kits / kitsLoading
 *  - getKits()
 *  - createSale(payload) → { ok, data } | { ok: false, error, status }
 *  - createKit(data)     → { ok, data } | { ok: false, error }
 *  - searchProduct(code) → { ok, products } (para el input de escaneo)
 */
export function useSales() {
  const [kits,        setKits]        = useState([]);
  const [kitsLoading, setKitsLoading] = useState(false);

  // ─── Kits ────────────────────────────────────────────────────────────────

  const getKits = useCallback(async () => {
    setKitsLoading(true);
    try {
      const { data } = await client.get('/sales/kits');
      const list = data.data ?? [];
      setKits(list);
      return list;
    } catch {
      return [];
    } finally {
      setKitsLoading(false);
    }
  }, []);

  async function createKit(kitData) {
    try {
      const { data } = await client.post('/sales/kits', kitData);
      const newKit = data.data;
      setKits(prev => [...prev, newKit]);
      return { ok: true, data: newKit };
    } catch (err) {
      return {
        ok: false,
        error: err.response?.data?.error?.message ?? 'Error al crear el kit.',
      };
    }
  }

  // ─── Ventas ───────────────────────────────────────────────────────────────

  /**
   * Crea una venta. Devuelve un objeto estructurado en lugar de lanzar
   * excepción, para que la UI no necesite try/catch disperso.
   *
   * payload: {
   *   customer_name?: string,
   *   payment_method: 'cash'|'card'|'yape'|'plin',
   *   items: Array<{ product_id?: number, kit_id?: number, quantity: number }>
   * }
   */
  async function createSale(payload) {
    try {
      const { data } = await client.post('/sales', payload);
      return { ok: true, data: data.data };
    } catch (err) {
      return {
        ok: false,
        status: err.response?.status,
        error: err.response?.data?.error?.message ?? 'Error al procesar la venta.',
      };
    }
  }

  // ─── Búsqueda de productos (para input de escaneo/barcode) ───────────────

  /**
   * Busca productos por código/SKU. Usado por el ScanInput — el resultado
   * determina si el código escaneado corresponde a exactamente 1 producto.
   */
  async function searchProduct(code) {
    try {
      const { data } = await client.get('/inventory', { params: { search: code } });
      return { ok: true, products: data.data ?? [] };
    } catch {
      return { ok: false, products: [] };
    }
  }

  return {
    kits,
    kitsLoading,
    getKits,
    createKit,
    createSale,
    searchProduct,
  };
}
