import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import {
  ShoppingCart,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Banknote,
  CreditCard,
  QrCode,
  Zap,
  Plus,
  Trash2,
} from 'lucide-react';

const METHODS = [
  { value: 'efectivo', label: 'Efectivo', icon: Banknote },
  { value: 'tarjeta', label: 'Tarjeta', icon: CreditCard },
  { value: 'yape', label: 'Yape', icon: QrCode },
  { value: 'plin', label: 'Plin', icon: Zap },
];

const QUICK_AMOUNTS = [
  { label: 'Exacto', value: 'exact' },
  { label: 'S/ 10', value: 10 },
  { label: 'S/ 20', value: 20 },
  { label: 'S/ 50', value: 50 },
  { label: 'S/ 100', value: 100 },
  { label: 'S/ 200', value: 200 },
];

export default function CheckoutModal({ open, onClose, cartTotal, onConfirm }) {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [loading, setLoading] = useState(false);

  // Líneas de pago: [{ id, method, amount, reference, cash_received }]
  const [payments, setPayments] = useState([]);

  // Estados de resultado: 'form' | 'success' | 'error'
  const [step, setStep] = useState('form');
  const [result, setResult] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Total a cobrar en céntimos enteros
  const totalCents = Math.round(Number(cartTotal ?? 0) * 100);

  // Inicializar estado cuando se abre el modal
  useEffect(() => {
    if (open) {
      const initialTotal = Number(cartTotal ?? 0).toFixed(2);
      const t = setTimeout(() => {
        setPayments([
          {
            id: 1,
            method: 'efectivo',
            amount: initialTotal,
            reference: '',
            cash_received: '',
          },
        ]);
        setCustomerName('');
        setStep('form');
        setErrorMsg('');
        setResult(null);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open, cartTotal]);

  // Cálculos en céntimos enteros para evitar errores de coma flotante
  const sumPaymentsCents = payments.reduce((acc, p) => {
    const parsed = parseFloat(p.amount);
    return acc + (isNaN(parsed) ? 0 : Math.round(parsed * 100));
  }, 0);

  const diffCents = totalCents - sumPaymentsCents;
  const isExactCovered = diffCents === 0;
  const isOverpaid = diffCents < 0;
  const isUnderpaid = diffCents > 0;

  // Validación de líneas
  const hasInvalidAmount = payments.some(
    (p) => isNaN(parseFloat(p.amount)) || parseFloat(p.amount) <= 0
  );

  const cashLine = payments.find((p) => p.method === 'efectivo');
  const cashReceivedNum = cashLine?.cash_received ? parseFloat(cashLine.cash_received) : null;
  const cashAmountNum = cashLine ? parseFloat(cashLine.amount) || 0 : 0;
  const isCashInsufficient =
    cashLine &&
    cashReceivedNum !== null &&
    !isNaN(cashReceivedNum) &&
    Math.round(cashReceivedNum * 100) < Math.round(cashAmountNum * 100);

  const canConfirm =
    isExactCovered &&
    !hasInvalidAmount &&
    !isCashInsufficient &&
    payments.length >= 1 &&
    payments.length <= 4 &&
    !loading;

  // Manejo de líneas de pago
  function handleAddLine() {
    if (payments.length >= 4 || isExactCovered) return;

    // Próximo método disponible que no sea efectivo si ya hay uno
    const usedMethods = new Set(payments.map((p) => p.method));
    const nextAvailable = METHODS.find((m) => !usedMethods.has(m.value));
    const defaultMethod = nextAvailable
      ? nextAvailable.value
      : usedMethods.has('efectivo')
        ? 'yape'
        : 'efectivo';

    const remainingAmount = Math.max(0, diffCents / 100).toFixed(2);

    setPayments((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        method: defaultMethod,
        amount: remainingAmount,
        reference: '',
        cash_received: '',
      },
    ]);
  }

  function handleRemoveLine(id) {
    if (payments.length <= 1) return;
    setPayments((prev) => prev.filter((p) => p.id !== id));
  }

  function handleUpdateLine(id, field, value) {
    setPayments((prev) =>
      prev.map((p) => {
        if (p.id !== id) return p;

        const updated = { ...p, [field]: value };

        // Si cambia el método
        if (field === 'method') {
          if (value === 'efectivo') {
            updated.reference = '';
          } else {
            updated.cash_received = '';
          }
        }

        return updated;
      })
    );
  }

  function handleQuickCash(val) {
    if (!cashLine) return;

    let newRec = '';
    if (val === 'exact') {
      newRec = (parseFloat(cashLine.amount) || 0).toFixed(2);
    } else {
      newRec = Number(val).toFixed(2);
    }

    handleUpdateLine(cashLine.id, 'cash_received', newRec);
  }

  async function handleConfirm() {
    if (!canConfirm) return;

    setLoading(true);
    setErrorMsg('');

    // Preparar el payload del nuevo formato payments
    const paymentsPayload = payments.map((p) => {
      const linePayload = {
        method: p.method,
        amount: +(parseFloat(p.amount) || 0).toFixed(2),
      };

      if (p.method === 'efectivo' && p.cash_received && p.cash_received.trim() !== '') {
        linePayload.cash_received = +(parseFloat(p.cash_received) || 0).toFixed(2);
      }

      if (p.method !== 'efectivo' && p.reference && p.reference.trim() !== '') {
        linePayload.reference = p.reference.trim();
      }

      return linePayload;
    });

    const res = await onConfirm(paymentsPayload, customerName.trim() || undefined);
    setLoading(false);

    if (res?.ok) {
      setResult(res.data);
      setStep('success');
    } else {
      setErrorMsg(res?.error ?? 'Error al procesar la venta.');
      setStep('error');
    }
  }

  function handleClose() {
    setStep('form');
    setCustomerName('');
    setErrorMsg('');
    setResult(null);
    onClose();
  }

  // Cálculo de vuelto para efectivo
  let vueltoStr = null;
  if (cashLine && cashReceivedNum !== null && !isNaN(cashReceivedNum)) {
    const cashRecCents = Math.round(cashReceivedNum * 100);
    const cashAmtCents = Math.round(cashAmountNum * 100);
    if (cashRecCents >= cashAmtCents) {
      vueltoStr = ((cashRecCents - cashAmtCents) / 100).toFixed(2);
    }
  }

  const hasCash = payments.some((p) => p.method === 'efectivo');

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-xl max-h-[92vh] flex flex-col p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="shrink-0 pb-1">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold text-foreground">
              {step === 'success' ? 'Venta Completada' : 'Confirmar Cobro'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 'success'
              ? 'Transacción procesada y confirmada en el servidor'
              : 'Configura las formas de pago y verifica el vuelto'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Pantalla de éxito ── */}
        {step === 'success' && result ? (
          <div className="text-center space-y-4 py-4 my-auto">
            <div className="w-14 h-14 bg-success/15 text-success rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Comprobante de Venta #{result.id}</p>
              <p className="text-3xl font-extrabold text-foreground tabular-nums tracking-tight">
                S/ {Number(result.total_amount ?? result.total ?? 0).toFixed(2)}
              </p>
              <p className="text-xs text-success font-medium">
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
          /* ── Formulario táctil de cobro (RNF 6.4) ── */
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-2">
              {/* Total a cobrar grande arriba */}
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 text-center space-y-0.5">
                <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                  Total a Cobrar
                </span>
                <div className="text-3xl sm:text-4xl font-extrabold text-foreground tabular-nums tracking-tight">
                  S/ {Number(cartTotal ?? 0).toFixed(2)}
                </div>
              </div>

              {/* Lista de líneas de pago */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Métodos de Pago ({payments.length}/4)
                  </Label>
                  {payments.length < 4 && !isExactCovered && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddLine}
                      className="h-7 px-2.5 text-xs gap-1 text-primary border-primary/30 hover:bg-primary/5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agregar otro método</span>
                    </Button>
                  )}
                </div>

                {payments.map((p, idx) => {
                  const isCash = p.method === 'efectivo';
                  return (
                    <div
                      key={p.id}
                      className="rounded-lg border border-border bg-card p-3 space-y-2.5 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">
                          Línea #{idx + 1}
                        </span>
                        {payments.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveLine(p.id)}
                            className="h-6 w-6 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            title="Eliminar línea de pago"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="sr-only">Eliminar línea</span>
                          </Button>
                        )}
                      </div>

                      {/* Selector táctil de método con botones grandes */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {METHODS.map((m) => {
                          const Icon = m.icon;
                          const isSelected = p.method === m.value;
                          const isCashDisabled =
                            m.value === 'efectivo' && hasCash && p.method !== 'efectivo';

                          return (
                            <button
                              key={m.value}
                              type="button"
                              disabled={isCashDisabled}
                              onClick={() => handleUpdateLine(p.id, 'method', m.value)}
                              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-md border text-xs font-medium transition-colors duration-150 select-none ${
                                isSelected
                                  ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                                  : isCashDisabled
                                    ? 'opacity-40 cursor-not-allowed bg-muted/40 border-border text-muted-foreground'
                                    : 'bg-background border-border text-foreground hover:bg-accent hover:text-accent-foreground'
                              }`}
                            >
                              <Icon className="w-4 h-4 shrink-0" />
                              <span className="text-[11px] leading-tight">{m.label}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* Monto de la línea */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-0.5">
                        <div className="space-y-1">
                          <Label htmlFor={`amount-${p.id}`} className="text-xs">
                            Monto a cobrar (S/)
                          </Label>
                          <Input
                            id={`amount-${p.id}`}
                            type="number"
                            step="0.01"
                            min="0.01"
                            value={p.amount}
                            onChange={(e) => handleUpdateLine(p.id, 'amount', e.target.value)}
                            placeholder="0.00"
                            className="font-mono tabular-nums font-semibold h-8 text-xs"
                          />
                        </div>

                        {/* Campo dependiente del método */}
                        {isCash ? (
                          <div className="space-y-1">
                            <Label htmlFor={`received-${p.id}`} className="text-xs">
                              Recibido (S/)
                            </Label>
                            <Input
                              id={`received-${p.id}`}
                              type="number"
                              step="0.01"
                              min="0"
                              value={p.cash_received}
                              onChange={(e) =>
                                handleUpdateLine(p.id, 'cash_received', e.target.value)
                              }
                              placeholder="Monto recibido"
                              className="font-mono tabular-nums h-8 text-xs"
                            />
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Label htmlFor={`ref-${p.id}`} className="text-xs">
                              N.º operación <span className="text-muted-foreground text-[10px]">(opcional)</span>
                            </Label>
                            <Input
                              id={`ref-${p.id}`}
                              maxLength={60}
                              value={p.reference}
                              onChange={(e) =>
                                handleUpdateLine(p.id, 'reference', e.target.value)
                              }
                              placeholder="Ej: 123456"
                              className="font-mono text-xs h-8"
                            />
                          </div>
                        )}
                      </div>

                      {/* Botones rápidos y vuelto si es efectivo */}
                      {isCash && (
                        <div className="pt-1 border-t border-border/60 space-y-1.5">
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium mr-1">
                              Billetes:
                            </span>
                            {QUICK_AMOUNTS.map((b) => (
                              <Button
                                key={b.label}
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleQuickCash(b.value)}
                                className="h-6 px-1.5 text-[11px] font-mono font-medium hover:bg-primary/5 hover:border-primary/40"
                              >
                                {b.label}
                              </Button>
                            ))}
                          </div>

                          {/* Visualización destacada del vuelto */}
                          {vueltoStr !== null && (
                            <div className="flex items-center justify-between rounded-md bg-muted/40 px-2.5 py-1.5 border border-border">
                              <span className="text-xs font-medium text-foreground">
                                Vuelto a entregar:
                              </span>
                              <span className="text-sm font-extrabold text-foreground font-mono tabular-nums">
                                S/ {vueltoStr}
                              </span>
                            </div>
                          )}

                          {isCashInsufficient && (
                            <p className="text-[11px] text-destructive font-medium">
                              El monto recibido es menor al monto a cobrar.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Indicador permanente de cuadratura (Falta, Cubierto o Excede) */}
              <div
                className={`rounded-lg p-2.5 border flex items-center justify-between text-xs font-semibold transition-colors duration-150 ${
                  isExactCovered
                    ? 'bg-success/10 text-success border-success/30'
                    : isOverpaid
                      ? 'bg-destructive/10 text-destructive border-destructive/30'
                      : 'bg-warning/10 text-warning border-warning/30'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  {isExactCovered ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>
                    {isExactCovered && 'Monto totalmente cubierto'}
                    {isUnderpaid && `Falta cubrir: S/ ${(diffCents / 100).toFixed(2)}`}
                    {isOverpaid &&
                      `Excede el total en: S/ ${(Math.abs(diffCents) / 100).toFixed(2)}`}
                  </span>
                </div>
                <span className="tabular-nums font-mono text-[11px]">
                  Suma: S/ {(sumPaymentsCents / 100).toFixed(2)}
                </span>
              </div>

              {/* Nombre del cliente */}
              <div className="space-y-1">
                <Label htmlFor="customer_name" className="text-xs">
                  Nombre del cliente <span className="text-muted-foreground text-[10px] font-normal">(opcional)</span>
                </Label>
                <Input
                  id="customer_name"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej: Cliente General / Juan Pérez"
                  className="h-8 text-xs"
                />
              </div>

              {/* Error inline */}
              {step === 'error' && errorMsg && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-semibold">Error al procesar la venta</p>
                    <p>{errorMsg}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer sticky visible siempre */}
            <div className="flex justify-end gap-2 pt-3 border-t border-border shrink-0 mt-1 bg-background">
              <Button variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={handleConfirm}
                disabled={!canConfirm}
                className="px-5 font-semibold"
                id="btn-confirm-sale"
              >
                {loading ? 'Procesando…' : 'Confirmar Cobro'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
