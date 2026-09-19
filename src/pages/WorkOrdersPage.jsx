import { useState, useEffect, useRef } from 'react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  UserCircleIcon,
} from '@heroicons/react/24/outline';
import { useAuth }        from '../context/AuthContext';
import { useWorkOrders }  from '../hooks/useWorkOrders';
import WorkOrderCard       from '../components/workorders/WorkOrderCard';
import NewWorkOrderModal   from '../components/workorders/NewWorkOrderModal';
import AdvanceStatusModal  from '../components/workorders/AdvanceStatusModal';
import Modal               from '../components/ui/Modal';
import Button              from '../components/ui/Button';
import { Dialog }          from '@headlessui/react';

// ─── Columnas del tablero (sin entregado / no_recogido) ──────────────────────
const KANBAN_COLUMNS = [
  { key: 'recibido',             label: 'Recibido',            headerClass: 'bg-slate-100 text-slate-700' },
  { key: 'diagnostico',          label: 'Diagnóstico',         headerClass: 'bg-sky-50 text-sky-700' },
  { key: 'pendiente_aprobacion', label: 'Pend. Aprobación',    headerClass: 'bg-amber-50 text-amber-700' },
  { key: 'en_reparacion',        label: 'En Reparación',       headerClass: 'bg-indigo-50 text-indigo-700' },
  { key: 'terminado',            label: 'Terminado',           headerClass: 'bg-emerald-50 text-emerald-700' },
];

// ─── Meta de estado (para historial) ─────────────────────────────────────────
const STATUS_META = {
  recibido:             { label: 'Recibido',          badge: 'bg-slate-100 text-slate-600' },
  diagnostico:          { label: 'Diagnóstico',       badge: 'bg-sky-50 text-sky-700' },
  pendiente_aprobacion: { label: 'Pend. Aprobación',  badge: 'bg-amber-50 text-amber-700' },
  en_reparacion:        { label: 'En Reparación',     badge: 'bg-indigo-50 text-indigo-700' },
  terminado:            { label: 'Terminado',         badge: 'bg-emerald-50 text-emerald-700' },
  entregado:            { label: 'Entregado',         badge: 'bg-green-50 text-green-700' },
  no_recogido:          { label: 'No Recogido',       badge: 'bg-red-50 text-red-700' },
};

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const role = user?.role;

  const {
    orders, loading,
    getAll, getHistoryByPlaca, createWorkOrder,
    getMechanics, assignMechanic,
    updateStatus, approveAdditionalWork, rejectAdditionalWork,
  } = useWorkOrders();

  // ─── Estado de modales ────────────────────────────────────────────────────
  const [newOTOpen,      setNewOTOpen]      = useState(false);
  const [advanceOpen,    setAdvanceOpen]    = useState(false);
  const [selectedOrder,  setSelectedOrder]  = useState(null);

  // Asignar mecánico
  const [assignOpen,    setAssignOpen]    = useState(false);
  const [mechanics,     setMechanics]     = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignError,   setAssignError]   = useState('');
  const [selectedMech,  setSelectedMech]  = useState('');

  // Rechazar confirmación
  const [rejectOpen,    setRejectOpen]    = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // Error genérico de acción directa
  const [actionError, setActionError] = useState('');

  // ─── Historial por placa ──────────────────────────────────────────────────
  const [placaSearch,   setPlacaSearch]   = useState('');
  const [historyResult, setHistoryResult] = useState(null);
  const [historyLoading,setHistoryLoading]= useState(false);
  const [historyError,  setHistoryError]  = useState('');

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => { getAll(); }, [getAll]);

  // ─── Agrupar órdenes por estado para el Kanban ────────────────────────────
  const byStatus = {};
  KANBAN_COLUMNS.forEach(col => { byStatus[col.key] = []; });
  orders.forEach(o => {
    if (byStatus[o.status] !== undefined) byStatus[o.status].push(o);
  });

  // ─── Acciones directas (sin modal) ───────────────────────────────────────
  async function handleAdvanceDirect(order, newStatus) {
    setActionError('');
    const res = await updateStatus(order.id, newStatus);
    if (!res.ok) setActionError(res.error);
  }

  // ─── Aprobar trabajo adicional ────────────────────────────────────────────
  async function handleApprove(order) {
    setActionError('');
    const res = await approveAdditionalWork(order.id);
    if (!res.ok) setActionError(res.error);
  }

  // ─── Rechazar trabajo adicional ───────────────────────────────────────────
  function openRejectConfirm(order) {
    setSelectedOrder(order);
    setRejectOpen(true);
  }

  async function confirmReject() {
    setRejectLoading(true);
    const res = await rejectAdditionalWork(selectedOrder.id);
    setRejectLoading(false);
    if (!res.ok) setActionError(res.error);
    setRejectOpen(false);
    setSelectedOrder(null);
  }

  // ─── Asignar mecánico ─────────────────────────────────────────────────────
  async function openAssignModal(order) {
    setSelectedOrder(order);
    setAssignError('');
    setSelectedMech(order.mechanic_id?.toString() ?? '');
    setAssignOpen(true);
    const list = await getMechanics();
    setMechanics(list);
  }

  async function confirmAssign() {
    if (!selectedMech) return;
    setAssignLoading(true);
    setAssignError('');
    const res = await assignMechanic(selectedOrder.id, Number(selectedMech));
    setAssignLoading(false);
    if (res.ok) {
      setAssignOpen(false);
      setSelectedOrder(null);
    } else {
      setAssignError(res.error);
    }
  }

  // ─── Historial por placa ──────────────────────────────────────────────────
  async function handleSearchHistory(e) {
    e.preventDefault();
    if (!placaSearch.trim()) return;
    setHistoryLoading(true);
    setHistoryError('');
    setHistoryResult(null);
    const res = await getHistoryByPlaca(placaSearch);
    setHistoryLoading(false);
    if (res.ok) {
      setHistoryResult(res.data);
    } else {
      setHistoryError(res.error);
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-slate-50 min-h-full space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-slate-900 text-2xl">Órdenes de Trabajo</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Cargando…' : `${orders.length} orden${orders.length !== 1 ? 'es' : ''} activa${orders.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {/* Nueva OT — admin y cajero */}
        {role !== 'mecanico' && (
          <Button
            variant="primary"
            icon={<PlusIcon className="w-4 h-4" />}
            onClick={() => setNewOTOpen(true)}
          >
            Nueva OT
          </Button>
        )}
      </div>

      {/* Error de acción */}
      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex justify-between">
          {actionError}
          <button onClick={() => setActionError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* ── Tablero Kanban ── */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-[900px]">
          {KANBAN_COLUMNS.map(col => {
            const colOrders = byStatus[col.key] ?? [];
            return (
              <div key={col.key} className="flex-1 min-w-[200px] max-w-xs">
                {/* Encabezado de columna */}
                <div className={`rounded-lg px-3 py-2 mb-3 flex items-center justify-between ${col.headerClass}`}>
                  <span className="text-xs font-semibold uppercase tracking-wide">{col.label}</span>
                  <span className="text-xs font-bold">{colOrders.length}</span>
                </div>

                {/* Tarjetas */}
                <div className="space-y-3 min-h-[120px]">
                  {loading ? (
                    <KanbanSkeleton />
                  ) : colOrders.length === 0 ? (
                    <div className="border-2 border-dashed border-slate-200 rounded-xl h-16 flex items-center justify-center">
                      <span className="text-xs text-slate-400">Sin órdenes</span>
                    </div>
                  ) : (
                    colOrders.map(order => (
                      <WorkOrderCard
                        key={order.id}
                        order={order}
                        role={role}
                        onAdvanceDirect={handleAdvanceDirect}
                        onOpenAdvanceModal={o => { setSelectedOrder(o); setAdvanceOpen(true); }}
                        onOpenAssignModal={openAssignModal}
                        onApprove={handleApprove}
                        onOpenRejectConfirm={openRejectConfirm}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Historial por Placa (RF-14) ── */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <MagnifyingGlassIcon className="w-5 h-5 text-slate-400" />
          <h2 className="font-semibold text-slate-900">Historial por Placa</h2>
        </div>
        <form onSubmit={handleSearchHistory} className="flex gap-3">
          <input
            value={placaSearch}
            onChange={e => setPlacaSearch(e.target.value.toUpperCase())}
            placeholder="Ingresa la placa…"
            className="flex-1 uppercase px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          />
          <Button variant="primary" type="submit" disabled={historyLoading}
            icon={<MagnifyingGlassIcon className="w-4 h-4" />}>
            {historyLoading ? 'Buscando…' : 'Buscar'}
          </Button>
        </form>

        {historyError && (
          <p className="mt-3 text-sm text-red-600">{historyError}</p>
        )}

        {historyResult !== null && (
          <div className="mt-4">
            {historyResult.length === 0 ? (
              <p className="text-sm text-slate-500">No se encontraron órdenes para esa placa.</p>
            ) : (
              <div className="divide-y divide-slate-100">
                {[...historyResult]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map(ot => {
                    const meta = STATUS_META[ot.status] ?? { label: ot.status, badge: 'bg-slate-100' };
                    return (
                      <div key={ot.id} className="py-3 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">
                            OT #{ot.id} · {ot.customer_name}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {new Date(ot.created_at).toLocaleDateString('es-PE', {
                              day: '2-digit', month: 'short', year: 'numeric',
                            })}
                          </p>
                        </div>
                        <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${meta.badge}`}>
                          {meta.label}
                        </span>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Modales ── */}

      {/* Nueva OT */}
      <NewWorkOrderModal
        open={newOTOpen}
        onClose={() => setNewOTOpen(false)}
        createWorkOrder={createWorkOrder}
      />

      {/* Avanzar diagnóstico */}
      <AdvanceStatusModal
        open={advanceOpen}
        order={selectedOrder}
        onClose={() => { setAdvanceOpen(false); setSelectedOrder(null); }}
        updateStatus={updateStatus}
      />

      {/* Asignar mecánico */}
      <Modal open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="max-w-sm">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
          <UserCircleIcon className="w-5 h-5 text-indigo-600" />
          <Dialog.Title className="font-semibold text-slate-900 text-lg">Asignar mecánico</Dialog.Title>
        </div>
        <div className="px-6 py-5 space-y-4">
          <select
            value={selectedMech}
            onChange={e => setSelectedMech(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
          >
            <option value="">Seleccionar mecánico…</option>
            {mechanics.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          {assignError && (
            <p className="text-sm text-red-600">{assignError}</p>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setAssignOpen(false)} disabled={assignLoading}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={confirmAssign} disabled={assignLoading || !selectedMech}>
              {assignLoading ? 'Asignando…' : 'Asignar'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Confirmar rechazo */}
      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="max-w-sm">
        <div className="px-6 py-5 space-y-4">
          <p className="font-semibold text-slate-900">¿Rechazar trabajo adicional?</p>
          <p className="text-sm text-slate-500">
            OT #{selectedOrder?.id} · {selectedOrder?.customer_name}. Esta acción no se puede deshacer.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setRejectOpen(false)} disabled={rejectLoading}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={confirmReject} disabled={rejectLoading}>
              {rejectLoading ? 'Rechazando…' : 'Sí, rechazar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ─── Skeleton de columna Kanban ───────────────────────────────────────────────

function KanbanSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {[1, 2].map(i => (
        <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
          <div className="h-4 bg-slate-200 rounded w-2/3" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="h-3 bg-slate-100 rounded w-3/4" />
        </div>
      ))}
    </div>
  );
}
