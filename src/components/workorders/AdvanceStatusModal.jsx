import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { InformationCircleIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Modal para avanzar desde Diagnóstico → En Reparación.
 * Siempre envía 'en_reparacion' como destino; el backend puede redirigir
 * a 'pendiente_aprobacion' si additional_cost supera el umbral.
 * El resultado real del backend se muestra como aviso informativo, no como error.
 *
 * Props:
 *   open          boolean
 *   order         OT a avanzar
 *   onClose       () => void
 *   updateStatus  función del hook useWorkOrders
 */
export default function AdvanceStatusModal({ open, order, onClose, updateStatus }) {
  const [diagnosisNotes,  setDiagnosisNotes]  = useState('');
  const [additionalCost,  setAdditionalCost]  = useState('');
  const [loading,         setLoading]         = useState(false);
  const [error,           setError]           = useState('');
  // Resultado informativo cuando el backend redirige a pendiente_aprobacion
  const [redirectInfo,    setRedirectInfo]    = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setRedirectInfo(null);
    setLoading(true);

    const res = await updateStatus(order.id, 'en_reparacion', {
      diagnosis_notes: diagnosisNotes.trim() || undefined,
      additional_cost: additionalCost ? Number(additionalCost) : undefined,
    });

    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    const finalStatus = res.data?.status;
    // Si el backend derivó a pendiente_aprobacion, mostramos aviso antes de cerrar
    if (finalStatus === 'pendiente_aprobacion') {
      setRedirectInfo(
        `El costo adicional de S/ ${additionalCost} superó el umbral permitido. ` +
        `La OT pasó a "Pendiente Aprobación" en lugar de "En Reparación".`
      );
      return; // Quedamos en el modal para que el usuario vea el aviso
    }

    handleClose();
  }

  function handleClose() {
    setDiagnosisNotes('');
    setAdditionalCost('');
    setError('');
    setRedirectInfo(null);
    onClose();
  }

  if (!order) return null;

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-md">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
        <Dialog.Title className="font-semibold text-slate-900 text-lg">
          Avanzar diagnóstico
        </Dialog.Title>
      </div>

      <div className="px-6 py-5 space-y-4">
        {/* Contexto de la OT */}
        <div className="bg-slate-50 rounded-lg px-4 py-3 text-sm text-slate-600">
          <span className="font-medium text-slate-900">{order.vehicle?.placa ?? order.placa}</span>
          {' · '}
          {order.customer_name}
        </div>

        {/* Aviso de redirección informativo */}
        {redirectInfo ? (
          <div className="space-y-4">
            <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
              <InformationCircleIcon className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">{redirectInfo}</p>
            </div>
            <div className="flex justify-end">
              <Button variant="primary" onClick={handleClose}>Entendido</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Notas de diagnóstico */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Notas de diagnóstico
              </label>
              <textarea
                rows={3} value={diagnosisNotes}
                onChange={e => { setDiagnosisNotes(e.target.value); setError(''); }}
                placeholder="Describe el diagnóstico y trabajo a realizar…"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none"
              />
            </div>

            {/* Costo adicional */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Costo adicional (S/)
                <span className="ml-1 text-slate-400 font-normal">— opcional</span>
              </label>
              <input
                type="number" min="0" step="0.01" value={additionalCost}
                onChange={e => { setAdditionalCost(e.target.value); setError(''); }}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
              <p className="text-xs text-slate-400 mt-1">
                Si supera el umbral permitido, el backend la enviará a "Pendiente Aprobación" automáticamente.
              </p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" type="button" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'Enviando…' : 'Avanzar a Reparación'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
