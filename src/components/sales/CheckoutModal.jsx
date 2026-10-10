import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { ShoppingCart, CheckCircle2, AlertTriangle, FileText } from 'lucide-react';

const PAYMENT_METHODS = [
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'tarjeta',  label: 'Tarjeta (POS)' },
  { value: 'yape',     label: 'Yape' },
  { value: 'plin',     label: 'Plin' },
];

export default function CheckoutModal({ open, onClose, cartTotal, onConfirm }) {
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados de resultado: 'form' | 'success' | 'error'
  const [step, setStep] = useState('form');
  const [result, setResult] = useState(null);
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
      setErrorMsg(res.error);
      setStep('error');
    }
  }

  function handleClose() {
    setStep('form');
    setPaymentMethod('efectivo');
    setCustomerName('');
    setErrorMsg('');
    setResult(null);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold text-foreground">
              {step === 'success' ? 'Venta Completada' : 'Confirmar Cobro'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 'success'
              ? 'Transacción procesada y confirmada en el servidor'
              : 'Selecciona la forma de pago y registra al cliente'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Pantalla de éxito ── */}
        {step === 'success' && result ? (
          <div className="text-center space-y-4 py-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Comprobante de Venta #{result.id}</p>
              <p className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                S/ {Number(result.total_amount ?? result.total ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                Total confirmado por el servidor
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <Button onClick={handleClose} className="w-full">
                Nueva Venta
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  handleClose();
                  navigate(`/invoicing?sale_id=${result.id}`);
                }}
                className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/5"
              >
                <FileText className="w-4 h-4" />
                <span>Facturar esta venta</span>
              </Button>
            </div>
          </div>
        ) : (
          /* ── Formulario de cobro ── */
          <div className="space-y-4 pt-1">
            {/* Total referencial */}
            <div className="rounded-lg border border-border bg-muted/20 p-3.5 flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total referencial</span>
              <span className="text-xl font-bold text-foreground tabular-nums">
                S/ {Number(cartTotal ?? 0).toFixed(2)}
              </span>
            </div>

            {/* Método de pago con Select de shadcn */}
            <div className="space-y-1.5">
              <Label htmlFor="payment_method">Método de pago</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger id="payment_method" className="w-full">
                  <SelectValue placeholder="Selecciona método de pago" />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m.value} value={m.value}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nombre del cliente */}
            <div className="space-y-1.5">
              <Label htmlFor="customer_name">
                Nombre del cliente <span className="text-muted-foreground text-xs font-normal">(opcional)</span>
              </Label>
              <Input
                id="customer_name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Ej: Cliente General / Juan Pérez"
              />
            </div>

            {/* Error de stock o validación (inline sin cerrar modal) */}
            {step === 'error' && errorMsg && (
              <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <p className="font-semibold">Error al procesar la venta</p>
                  <p>{errorMsg}</p>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    El carrito sigue intacto — ajusta las cantidades y vuelve a intentarlo.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleConfirm} disabled={loading}>
                {loading ? 'Procesando…' : 'Confirmar Cobro'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
