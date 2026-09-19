import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import { WrenchScrewdriverIcon } from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

/**
 * Modal para crear una nueva Orden de Trabajo.
 * onSuccess(newOrder): callback — la página actualiza el tablero.
 * createWorkOrder: función del hook useWorkOrders.
 */
export default function NewWorkOrderModal({ open, onClose, createWorkOrder }) {
  const EMPTY = {
    placa: '', brand: '', model: '',
    customer_name: '', customer_phone: '',
    entry_mileage: '', checklist_notes: '',
  };

  const [form,    setForm]    = useState(EMPTY);
  const [error,   setError]   = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      placa:           form.placa.trim().toUpperCase(),
      brand:           form.brand.trim()  || undefined,
      model:           form.model.trim()  || undefined,
      customer_name:   form.customer_name.trim(),
      customer_phone:  form.customer_phone.trim() || undefined,
      entry_mileage:   form.entry_mileage ? Number(form.entry_mileage) : undefined,
      checklist_notes: form.checklist_notes.trim() || undefined,
    };
    const res = await createWorkOrder(payload);
    setLoading(false);

    if (res.ok) {
      setForm(EMPTY);
      onClose();
    } else {
      setError(res.error);
    }
  }

  function handleClose() {
    setForm(EMPTY);
    setError('');
    onClose();
  }

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-lg">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
        <WrenchScrewdriverIcon className="w-5 h-5 text-indigo-600" />
        <Dialog.Title className="font-semibold text-slate-900 text-lg">
          Nueva Orden de Trabajo
        </Dialog.Title>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
        {/* Placa — obligatorio */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Placa <span className="text-red-500">*</span>
          </label>
          <input name="placa" required value={form.placa} onChange={handleChange}
            placeholder="Ej: ABC-123"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
          <p className="text-xs text-slate-400 mt-1">
            Si ya existe, se reutiliza el vehículo registrado.
          </p>
        </div>

        {/* Marca + Modelo */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
            <input name="brand" value={form.brand} onChange={handleChange}
              placeholder="Ej: Honda"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Modelo</label>
            <input name="model" value={form.model} onChange={handleChange}
              placeholder="Ej: CG125"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
          </div>
        </div>

        {/* Cliente */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre del cliente <span className="text-red-500">*</span>
            </label>
            <input name="customer_name" required value={form.customer_name} onChange={handleChange}
              placeholder="Juan Pérez"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input name="customer_phone" value={form.customer_phone} onChange={handleChange}
              placeholder="987654321"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
          </div>
        </div>

        {/* Kilometraje de entrada */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Kilometraje de entrada
          </label>
          <input name="entry_mileage" type="number" min="0" value={form.entry_mileage} onChange={handleChange}
            placeholder="Ej: 15000"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
        </div>

        {/* Notas de checklist */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Notas de checklist (revisión inicial)
          </label>
          <textarea name="checklist_notes" rows={3} value={form.checklist_notes} onChange={handleChange}
            placeholder="Estado visible al ingreso, accesorios, observaciones…"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 resize-none" />
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
          <Button variant="primary" type="submit" disabled={loading}
            icon={<WrenchScrewdriverIcon className="w-4 h-4" />}>
            {loading ? 'Creando…' : 'Crear orden'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
