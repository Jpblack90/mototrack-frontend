import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  ShoppingCartIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta',  label: 'Tarjeta'  },
  { value: 'yape',     label: 'Yape'     },
  { value: 'plin',     label: 'Plin'     },
];

/**
 * Modal de cobro.
 *
 * Props:
 *  open            boolean
 *  onClose         () => void
 *  cartTotal       number  (referencial)
 *  onConfirm       (paymentMethod, customerName) => Promise<void>
 *                  — el padre llama a createSale y retorna el resultado
 */
export default function CheckoutModal({ open, onClose, cartTotal, onConfirm }) {
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [customerName,  setCustomerName]  = useState('');
  const [loading,       setLoading]       = useState(false);

  // estado del resultado
  // step: 'form' | 'success' | 'error'
  const [step,     setStep]     = useState('form');
  const [result,   setResult]   = useState(null); // { saleId, total } on success
  const [errorMsg, setErrorMsg] = useState('');

  async function handleConfirm() {
    setLoading(true);
    setErrorMsg('');
    const res = await onConfirm(paymentMethod, customerName.trim() || undefined);
    setLoading(false);

    if (res.ok) {
      setResult(res.data);
      setStep('success');
    } else {
      // 422 de stock insuficiente u otro error — no cerrar el modal, mostrar inline
      setErrorMsg(res.error);
      setStep('error');
    }
  }

  function handleClose() {
    // Resetear estado al cerrar
    setStep('form');
    setPaymentMethod('cash');
    setCustomerName('');
    setErrorMsg('');
    setResult(null);
    onClose();
  }

  return (
    <Modal open={open} onClose={step === 'success' ? handleClose : handleClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
        <ShoppingCartIcon className="w-5 h-5 text-indigo-600" />
        <Dialog.Title className="font-semibold text-slate-900 text-lg">
          {step === 'success' ? 'Venta registrada' : 'Confirmar cobro'}
        </Dialog.Title>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* ── Pantalla de éxito ── */}
        {step === 'success' && result && (
          <div className="text-center space-y-4 py-4">
            <CheckCircleIcon className="w-14 h-14 text-emerald-500 mx-auto" />
            <div>
              <p className="text-sm text-slate-500">Venta #{result.id}</p>
              <p className="text-3xl font-bold text-slate-900 mt-1">
                S/ {Number(result.total_amount ?? result.total ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Total confirmado por el servidor
              </p>
            </div>
            <Button variant="primary" onClick={handleClose} className="w-full justify-center">
              Nueva venta
            </Button>
          </div>
        )}

        {/* ── Formulario / Error ── */}
        {step !== 'success' && (
          <>
            {/* Total referencial */}
            <div className="bg-slate-50 rounded-lg p-4 flex justify-between items-center">
              <span className="text-sm text-slate-500">Total referencial</span>
              <span className="text-xl font-bold text-slate-900">
                S/ {cartTotal.toFixed(2)}
              </span>
            </div>

            {/* Método de pago */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Método de pago
              </label>
              <div className="grid grid-cols-4 gap-2">
                {PAYMENT_METHODS.map(m => (
                  <button
                    key={m.value}
                    type="button"
                    onClick={() => setPaymentMethod(m.value)}
                    className={`py-2 rounded-lg text-sm font-medium border transition-all active:scale-[0.98]
                      ${paymentMethod === m.value
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Nombre de cliente (opcional) */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nombre del cliente <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder="Ej: Juan Pérez"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
              />
            </div>

            {/* Error de stock insuficiente — se muestra inline sin cerrar el modal */}
            {step === 'error' && errorMsg && (
              <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Error al procesar la venta</p>
                  <p className="text-sm text-red-700 mt-0.5">{errorMsg}</p>
                  <p className="text-xs text-red-600 mt-1">
                    El carrito sigue intacto — ajusta las cantidades y vuelve a intentarlo.
                  </p>
                </div>
              </div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-3 pt-1">
              <Button variant="secondary" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirm}
                disabled={loading}
                icon={<ShoppingCartIcon className="w-4 h-4" />}
              >
                {loading ? 'Procesando…' : 'Confirmar cobro'}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
