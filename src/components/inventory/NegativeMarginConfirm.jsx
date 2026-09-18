import { useAuth } from '../../context/AuthContext';

/**
 * Modal de confirmación cuando el backend responde 422 NEGATIVE_MARGIN.
 * Admin → muestra "Forzar de todas formas".
 * No-admin → solo "Corregir precio" (sin botón de forzar).
 */
export default function NegativeMarginConfirm({ message, onForce, onCorrect }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50" onClick={onCorrect} />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        {/* Icono + título */}
        <div className="flex items-start gap-3">
          <span className="text-2xl shrink-0">⚠️</span>
          <div>
            <h3 className="font-semibold text-slate-900">Margen negativo detectado</h3>
            <p className="text-sm text-slate-500 mt-1">{message}</p>
          </div>
        </div>

        {/* Mensaje condicional por rol */}
        {!isAdmin && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
            Solo un Administrador puede forzar un margen negativo. Corrige el precio
            de costo o venta antes de guardar.
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onCorrect}
            className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors text-sm"
          >
            Corregir precio
          </button>
          {isAdmin && (
            <button
              onClick={onForce}
              className="bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm"
            >
              Forzar de todas formas
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
