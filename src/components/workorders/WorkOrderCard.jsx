import { useState, useEffect } from 'react';
import {
  UserIcon,
  WrenchIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowRightIcon,
  TruckIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { VALID_TRANSITIONS } from '../../hooks/useWorkOrders';

/** Metadata visual por estado */
const STATUS_META = {
  recibido:             { label: 'Recibido',             badge: 'bg-slate-100 text-slate-600' },
  diagnostico:          { label: 'Diagnóstico',          badge: 'bg-sky-50 text-sky-700' },
  pendiente_aprobacion: { label: 'Pend. Aprobación',     badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  en_reparacion:        { label: 'En Reparación',        badge: 'bg-indigo-50 text-indigo-700' },
  terminado:            { label: 'Terminado',            badge: 'bg-emerald-50 text-emerald-700' },
  entregado:            { label: 'Entregado',            badge: 'bg-green-50 text-green-700' },
  no_recogido:          { label: 'No Recogido',          badge: 'bg-red-50 text-red-700' },
};

/**
 * Tarjeta de Orden de Trabajo en el tablero Kanban.
 *
 * Props:
 *   order                 OT
 *   role                  'admin' | 'cajero' | 'mecanico'
 *   onAdvanceDirect       (order, newStatus) => void   — transición sin modal
 *   onOpenAdvanceModal    (order) => void               — abre AdvanceStatusModal
 *   onOpenAssignModal     (order) => void               — abre modal de asignación
 *   onApprove             (order) => void
 *   onOpenRejectConfirm   (order) => void
 */
export default function WorkOrderCard({
  order, role,
  onAdvanceDirect, onOpenAdvanceModal,
  onOpenAssignModal, onApprove, onOpenRejectConfirm,
}) {
  const { status } = order;
  const meta = STATUS_META[status] ?? { label: status, badge: 'bg-slate-100 text-slate-600' };
  const transitions = VALID_TRANSITIONS[status] ?? [];

  const placa        = order.vehicle?.placa ?? order.placa ?? '—';
  const brand        = order.vehicle?.brand ?? '';
  const model        = order.vehicle?.model ?? '';
  const mechName     = order.mechanic_name ?? order.mechanic?.name ?? null;
  const additCost    = order.additional_cost ? Number(order.additional_cost) : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3 hover:shadow-md transition-shadow">
      {/* Cabecera: placa + badge estado */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className="font-bold text-slate-900 text-base tracking-wide">{placa}</span>
          {(brand || model) && (
            <p className="text-xs text-slate-500 mt-0.5">{[brand, model].filter(Boolean).join(' ')}</p>
          )}
        </div>
        <span className={`shrink-0 text-xs font-medium rounded-full px-2 py-0.5 ${meta.badge}`}>
          {meta.label}
        </span>
      </div>

      {/* Cliente */}
      <div className="flex items-center gap-1.5 text-sm text-slate-700">
        <UserIcon className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="truncate">{order.customer_name}</span>
      </div>

      {/* Mecánico asignado */}
      <div className="flex items-center gap-1.5 text-sm">
        <WrenchIcon className="w-4 h-4 text-slate-400 shrink-0" />
        {mechName
          ? <span className="text-slate-700 truncate">{mechName}</span>
          : <span className="text-slate-400 italic">Sin asignar</span>
        }
      </div>

      {/* Costo adicional (si aplica) */}
      {additCost && (
        <div className="text-xs bg-amber-50 text-amber-700 border border-amber-200 rounded-lg px-2 py-1">
          Costo adicional: S/ {additCost.toFixed(2)}
        </div>
      )}

      {/* ─── Botones de acción ─────────────────────────────────────────── */}
      <ActionButtons
        order={order} role={role} status={status} transitions={transitions}
        onAdvanceDirect={onAdvanceDirect}
        onOpenAdvanceModal={onOpenAdvanceModal}
        onOpenAssignModal={onOpenAssignModal}
        onApprove={onApprove}
        onOpenRejectConfirm={onOpenRejectConfirm}
      />
    </div>
  );
}

// ─── Botones de acción según rol + estado ────────────────────────────────────

function ActionButtons({
  order, role, status, transitions,
  onAdvanceDirect, onOpenAdvanceModal,
  onOpenAssignModal, onApprove, onOpenRejectConfirm,
}) {
  const isAdmin   = role === 'admin';
  const isCajero  = role === 'cajero';
  const isMec     = role === 'mecanico';

  const buttons = [];

  // Asignar mecánico — solo admin
  if (isAdmin) {
    buttons.push(
      <ActionBtn key="assign" icon={<WrenchIcon />} label="Asignar mecánico"
        variant="secondary" onClick={() => onOpenAssignModal(order)} />
    );
  }

  // Recibido → Diagnóstico (admin, mecánico)
  if (status === 'recibido' && (isAdmin || isMec)) {
    buttons.push(
      <ActionBtn key="to-diag" icon={<ArrowRightIcon />} label="Iniciar diagnóstico"
        onClick={() => onAdvanceDirect(order, 'diagnostico')} />
    );
  }

  // Diagnóstico → En Reparación (abre modal — admin, mecánico)
  if (status === 'diagnostico' && (isAdmin || isMec)) {
    buttons.push(
      <ActionBtn key="to-rep" icon={<ArrowRightIcon />} label="Avanzar"
        onClick={() => onOpenAdvanceModal(order)} />
    );
  }

  // Pendiente Aprobación → Aprobar/Rechazar (admin, cajero; NO mecánico)
  if (status === 'pendiente_aprobacion' && (isAdmin || isCajero)) {
    buttons.push(
      <ActionBtn key="approve" icon={<CheckCircleIcon />} label="Aprobar"
        variant="emerald" onClick={() => onApprove(order)} />
    );
    buttons.push(
      <ActionBtn key="reject" icon={<XCircleIcon />} label="Rechazar"
        variant="danger" onClick={() => onOpenRejectConfirm(order)} />
    );
  }

  // En Reparación → Terminado (admin, mecánico)
  if (status === 'en_reparacion' && (isAdmin || isMec)) {
    buttons.push(
      <ActionBtn key="to-term" icon={<CheckCircleIcon />} label="Marcar terminado"
        onClick={() => onAdvanceDirect(order, 'terminado')} />
    );
  }

  // Terminado → Entregado (todos)
  if (status === 'terminado') {
    buttons.push(
      <ActionBtn key="to-ent" icon={<TruckIcon />} label="Marcar entregado"
        onClick={() => onAdvanceDirect(order, 'entregado')} />
    );
  }

  // Terminado → No Recogido (solo admin)
  if (status === 'terminado' && isAdmin) {
    buttons.push(
      <ActionBtn key="to-norec" icon={<ClockIcon />} label="No recogido"
        variant="secondary" onClick={() => onAdvanceDirect(order, 'no_recogido')} />
    );
  }

  if (buttons.length === 0) return null;

  return (
    <div className="pt-1 flex flex-wrap gap-2 border-t border-slate-100">
      {buttons}
    </div>
  );
}

// ─── Botón de acción genérico ────────────────────────────────────────────────

const ACTION_STYLES = {
  primary:   'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary: 'border border-slate-300 text-slate-700 hover:bg-slate-50',
  danger:    'bg-red-600 hover:bg-red-700 text-white',
  emerald:   'bg-emerald-600 hover:bg-emerald-700 text-white',
};

function ActionBtn({ icon, label, onClick, variant = 'primary' }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
        transition-all active:scale-[0.97] focus:outline-none focus:ring-2 focus:ring-indigo-400
        ${ACTION_STYLES[variant]}`}
    >
      <span className="w-3.5 h-3.5 shrink-0">{icon}</span>
      {label}
    </button>
  );
}
