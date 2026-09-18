/**
 * Modal de confirmación antes de desactivar (soft-delete) un producto.
 */
export default function DeactivateConfirm({ product, onConfirm, onCancel, loading }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onCancel} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">🗑️</span>
          <div>
            <h3 className="font-semibold text-slate-900">Desactivar producto</h3>
            <p className="text-sm text-slate-500 mt-1">
              ¿Desactivar <span className="font-medium text-slate-700">"{product?.name}"</span>?
              El producto dejará de aparecer en el inventario activo pero sus registros
              históricos (ventas, órdenes) se conservan intactos.
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors text-sm"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm"
          >
            {loading ? 'Desactivando…' : 'Sí, desactivar'}
          </button>
        </div>
      </div>
    </div>
  );
}
