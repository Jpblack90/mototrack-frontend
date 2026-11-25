import { useState, useEffect, useCallback, useMemo } from 'react';
import client from '../api/client';

const BILLABLE_STATUSES = ['terminado', 'no_recogido'];

/**
 * Hook puro para cargar una Orden de Trabajo vinculada al POS (?work_order_id=).
 * Expone los datos de la OT, su estado de carga/error y si está habilitada para cobro.
 *
 * @param {string|number|null|undefined} workOrderId
 */
export function useWorkOrderForSale(workOrderId) {
  const [workOrder, setWorkOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkOrder = useCallback(async () => {
    const parsedId = Number(workOrderId);
    if (!workOrderId || !Number.isInteger(parsedId) || parsedId <= 0) {
      setWorkOrder(null);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await client.get(`/workorders/${parsedId}`);
      setWorkOrder(data?.data ?? null);
    } catch (err) {
      setWorkOrder(null);
      setError(
        err.response?.data?.error?.message ||
          `No se pudo cargar la OT #${parsedId}.`
      );
    } finally {
      setLoading(false);
    }
  }, [workOrderId]);

  useEffect(() => {
    const parsedId = Number(workOrderId);
    if (!workOrderId || !Number.isInteger(parsedId) || parsedId <= 0) {
      return undefined;
    }

    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { data } = await client.get(`/workorders/${parsedId}`);
        if (!cancelled) {
          setWorkOrder(data?.data ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          setWorkOrder(null);
          setError(
            err.response?.data?.error?.message ||
              `No se pudo cargar la OT #${parsedId}.`
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [workOrderId]);

  const parsedId = Number(workOrderId);
  const effectiveWorkOrder =
    workOrderId && Number.isInteger(parsedId) && workOrder?.id === parsedId
      ? workOrder
      : null;

  const blockedReason = useMemo(() => {
    if (!effectiveWorkOrder) return null;
    if (effectiveWorkOrder.is_billed) {
      return `La OT #${effectiveWorkOrder.id} ya fue cobrada.`;
    }
    if (!BILLABLE_STATUSES.includes(effectiveWorkOrder.status)) {
      return `La OT #${effectiveWorkOrder.id} está en estado "${effectiveWorkOrder.status}". Solo se cobran órdenes en "terminado" o "no_recogido".`;
    }
    return null;
  }, [effectiveWorkOrder]);

  const clearWorkOrder = useCallback(() => {
    setWorkOrder(null);
    setError(null);
  }, []);

  return {
    workOrder: effectiveWorkOrder,
    loading,
    error: workOrderId ? error : null,
    blockedReason,
    clearWorkOrder,
    reload: fetchWorkOrder,
  };
}
