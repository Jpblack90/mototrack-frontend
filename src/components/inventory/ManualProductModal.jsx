import { useState, useEffect } from 'react';
import client from '../../api/client';
import NegativeMarginConfirm from './NegativeMarginConfirm';

const EMPTY = {
  name: '', sku: '', brand: '',
  cost_price: '', sale_price: '',
  stock: '', min_stock: '',
};

/**
 * Modal de alta/edición manual de producto.
 * mode: 'create' | 'edit'
 * initialData: producto a editar (solo en modo edit)
 * onSuccess: callback(savedProduct) — la lista actualiza estado local
 */
export default function ManualProductModal({ mode = 'create', initialData, onSuccess, onClose }) {
  const [form,    setForm]    = useState(EMPTY);
  const [errors,  setErrors]  = useState('');
  const [loading, setLoading] = useState(false);
  // Estado del modal de margen negativo
  const [marginError, setMarginError] = useState(null); // null | { message, pendingPayload }

  // Pre-cargar datos al editar
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setForm({
        name:       initialData.name       ?? '',
        sku:        initialData.sku        ?? '',
        brand:      initialData.brand      ?? '',
        cost_price: initialData.cost_price ?? '',
        sale_price: initialData.sale_price ?? '',
        stock:      initialData.stock      ?? '',
        min_stock:  initialData.min_stock  ?? '',
      });
    }
  }, [mode, initialData]);

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setErrors('');
  }

  /** Envía la petición; force: true la agrega al forzar margen negativo */
  async function submit(extraFields = {}) {
    setLoading(true);
    setErrors('');
    const payload = {
      name:       form.name.trim(),
      sku:        form.sku.trim()   || undefined,
      brand:      form.brand.trim() || undefined,
      cost_price: Number(form.cost_price),
      sale_price: Number(form.sale_price),
      stock:      Number(form.stock)     || 0,
      min_stock:  Number(form.min_stock) || 5,
      ...extraFields,
    };

    try {
      let res;
      if (mode === 'edit') {
        res = await client.put(`/inventory/${initialData.id}`, payload);
      } else {
        res = await client.post('/inventory', payload);
      }
      onSuccess(res.data.data);
    } catch (err) {
      const errData = err.response?.data?.error;
      // El backend devuelve 422 EXCLUSIVAMENTE para NEGATIVE_MARGIN en /inventory.
      // Cualquier otro error de validación (campo faltante, SKU duplicado) viene como 400.
      if (err.response?.status === 422) {
        setMarginError({ message: errData?.message ?? 'Margen negativo.', pendingPayload: payload });
      } else {
        setErrors(errData?.message ?? 'Error al guardar el producto.');
      }
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit();
  }

  function handleForce() {
    setMarginError(null);
    submit({ ...marginError.pendingPayload, force: true });
  }

  function handleCorrect() {
    setMarginError(null); // cierra solo el modal de confirmación, deja el formulario abierto
  }

  return (
    <>
      {/* Overlay + panel */}
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 text-lg">
              {mode === 'edit' ? 'Editar producto' : 'Nuevo repuesto — Registro manual'}
            </h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
          </div>

          {/* Formulario */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del producto <span className="text-red-500">*</span>
              </label>
              <input
                name="name" value={form.name} onChange={handleChange} required
                placeholder="Ej: Filtro de aceite Honda CG125"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* SKU + Marca */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                <input
                  name="sku" value={form.sku} onChange={handleChange}
                  placeholder="Ej: FILT-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                <input
                  name="brand" value={form.brand} onChange={handleChange}
                  placeholder="Ej: Honda"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Precio costo + venta */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Precio de costo (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  name="cost_price" type="number" min="0" step="0.01"
                  value={form.cost_price} onChange={handleChange} required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Precio de venta (S/) <span className="text-red-500">*</span>
                </label>
                <input
                  name="sale_price" type="number" min="0" step="0.01"
                  value={form.sale_price} onChange={handleChange} required
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Stock + Stock mínimo */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock inicial</label>
                <input
                  name="stock" type="number" min="0"
                  value={form.stock} onChange={handleChange}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
                <input
                  name="min_stock" type="number" min="0"
                  value={form.min_stock} onChange={handleChange}
                  placeholder="5"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
              </div>
            </div>

            {/* Error backend */}
            {errors && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                {errors}
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={onClose}
                className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors text-sm">
                Cancelar
              </button>
              <button type="submit" disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm">
                {loading ? 'Guardando…' : mode === 'edit' ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal de margen negativo (z-50, encima del modal principal) */}
      {marginError && (
        <NegativeMarginConfirm
          message={marginError.message}
          onForce={handleForce}
          onCorrect={handleCorrect}
        />
      )}
    </>
  );
}
