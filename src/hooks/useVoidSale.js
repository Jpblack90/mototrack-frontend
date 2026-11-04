import { useState } from 'react';
import client from '../api/client';

/**
 * Hook exclusivo para la anulación de ventas (RF-23).
 * Mantiene desacoplada la lógica de anulación de useSales.js.
 */
export function useVoidSale() {
  const [loading, setLoading] = useState(false);

  async function voidSale(saleId, { void_reason, motivo_code = '01' } = {}) {
    setLoading(true);
    try {
      const { data } = await client.patch(`/sales/${saleId}/void`, {
        void_reason,
        motivo_code,
      });
      return { ok: true, data: data.data };
    } catch (err) {
      const message =
        err.response?.data?.error?.message ??
        err.message ??
        'Error al anular la venta.';
      const code = err.response?.data?.error?.code;
      const status = err.response?.status;
      return { ok: false, error: message, code, status };
    } finally {
      setLoading(false);
    }
  }

  return {
    voidSale,
    loading,
  };
}
