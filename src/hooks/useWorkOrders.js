import { useState, useCallback } from 'react';
import client from '../api/client';

/**
 * Mapa de transiciones válidas — solo para decidir qué botones mostrar.
 * El backend sigue siendo la fuente de verdad sobre si la transición procede.
 */
export const VALID_TRANSITIONS = {
  recibido:             ['diagnostico'],
  diagnostico:          ['en_reparacion', 'pendiente_aprobacion'],
  pendiente_aprobacion: ['en_reparacion', 'entregado'],
  en_reparacion:        ['terminado'],
  terminado:            ['entregado', 'no_recogido'],
  entregado:            [],
  no_recogido:          [],
};

/**
 * Hook puro de órdenes de trabajo — SOLO lógica y llamadas API, sin JSX.
 *
 * ESTRATEGIA DE SINCRONIZACIÓN:
 *   Después de cualquier mutación (PATCH) exitosa se ejecuta un refetch completo
 *   (fetchAll) en lugar de mezclar la respuesta parcial con el estado local.
 *   Esto garantiza que relaciones populadas como mechanic_name, vehicle, etc.
 *   siempre estén presentes sin depender de lo que devuelva cada PATCH.
 */
export function useWorkOrders() {
  const [orders,  setOrders]  = useState([]);
  const [loading, setLoading] = useState(false);

  // ─── Función interna de recarga — compartida por todas las mutaciones ─────

  /**
   * Obtiene todas las OT activas y actualiza el estado.
   * Se llama tanto desde getAll() (uso externo) como desde las mutaciones.
   */
  const fetchAll = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await client.get('/workorders', { params });
      const list = data.data ?? [];
      setOrders(list);
      return { ok: true, data: list };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al cargar órdenes.' };
    } finally {
      setLoading(false);
    }
  }, []);

  // ─── API pública de lectura ───────────────────────────────────────────────

  /** Carga órdenes con filtro opcional de estado */
  const getAll = useCallback(
    ({ status } = {}) => fetchAll(status ? { status } : {}),
    [fetchAll]
  );

  async function getHistoryByPlaca(placa) {
    try {
      const { data } = await client.get(
        `/workorders/placa/${encodeURIComponent(placa.trim().toUpperCase())}`
      );
      return { ok: true, data: data.data ?? [] };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al buscar historial.' };
    }
  }

  // ─── Creación ─────────────────────────────────────────────────────────────

  async function createWorkOrder(payload) {
    try {
      const { data } = await client.post('/workorders', payload);
      await fetchAll(); // refresca el tablero con la nueva OT ya populada
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al crear orden de trabajo.' };
    }
  }

  // ─── Mecánicos ────────────────────────────────────────────────────────────

  /** Obtiene la lista de mecánicos activos (admin-only, filtra en cliente) */
  async function getMechanics() {
    try {
      const { data } = await client.get('/users');
      const all = data.data ?? [];
      return all.filter(u => u.role === 'mecanico' && u.is_active !== false);
    } catch {
      return [];
    }
  }

  async function assignMechanic(id, mechanic_id) {
    try {
      await client.patch(`/workorders/${id}/assign`, { mechanic_id });
      await fetchAll(); // refetch completo — mechanic_name llega populado
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al asignar mecánico.' };
    }
  }

  // ─── Transiciones de estado ───────────────────────────────────────────────

  async function updateStatus(id, newStatus, extra = {}) {
    try {
      const { data } = await client.patch(`/workorders/${id}/status`, {
        status: newStatus,
        ...extra,
      });
      await fetchAll(); // refetch completo — el estado real puede diferir del solicitado
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al actualizar estado.' };
    }
  }

  async function approveAdditionalWork(id) {
    try {
      const { data } = await client.patch(`/workorders/${id}/approve`);
      await fetchAll();
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al aprobar trabajo adicional.' };
    }
  }

  async function rejectAdditionalWork(id) {
    try {
      const { data } = await client.patch(`/workorders/${id}/reject`);
      await fetchAll();
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al rechazar trabajo adicional.' };
    }
  }

  async function markNotPickedUp(id) {
    try {
      const { data } = await client.patch(`/workorders/${id}/not-picked-up`);
      await fetchAll();
      return { ok: true, data: data.data };
    } catch (err) {
      return { ok: false, error: err.response?.data?.error?.message ?? 'Error al marcar como no recogido.' };
    }
  }

  return {
    orders,
    loading,
    VALID_TRANSITIONS,
    getAll,
    getHistoryByPlaca,
    createWorkOrder,
    getMechanics,
    assignMechanic,
    updateStatus,
    approveAdditionalWork,
    rejectAdditionalWork,
    markNotPickedUp,
  };
}
