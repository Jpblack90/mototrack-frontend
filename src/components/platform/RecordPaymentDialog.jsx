import { useState } from 'react';
import { CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../ui/select';
import { PAYMENT_METHODS, formatPen } from '../../lib/platformStatus';

function RecordPaymentForm({ company, submitting, onSubmit, onOpenChange, onSuccess }) {
  const unitPrice = Number(company?.plan?.price_pen ?? 0);
  const [months, setMonths] = useState('1');
  const [amount, setAmount] = useState(() => (unitPrice > 0 ? unitPrice.toFixed(2) : ''));
  const [amountEdited, setAmountEdited] = useState(false);
  const [method, setMethod] = useState('yape');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  const handleMonthsChange = (value) => {
    setMonths(value);
    const parsedMonths = Number(value);
    if (!amountEdited && unitPrice > 0 && Number.isInteger(parsedMonths) && parsedMonths >= 1) {
      setAmount((unitPrice * parsedMonths).toFixed(2));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    const parsedMonths = Number(months);
    const parsedAmount = Number(amount);

    if (!Number.isInteger(parsedMonths) || parsedMonths < 1 || parsedMonths > 12) {
      setFormError('Los meses deben ser un número entero entre 1 y 12.');
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setFormError('Ingresa un monto válido mayor a 0.');
      return;
    }

    const result = await onSubmit(company.id, {
      amount: parsedAmount,
      method,
      reference: reference.trim(),
      months: parsedMonths,
      notes: notes.trim(),
    });

    if (!result.ok) {
      setFormError(result.error?.message || 'No se pudo registrar el pago.');
      return;
    }

    toast.success(`Pago registrado (${formatPen(parsedAmount)} · ${parsedMonths} mes(es)).`);
    onOpenChange(false);
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {formError && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
          {formError}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment-months">Meses pagados</Label>
          <Select value={months} onValueChange={handleMonthsChange}>
            <SelectTrigger id="payment-months">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 6, 12].map((m) => (
                <SelectItem key={m} value={String(m)}>
                  {m} {m === 1 ? 'mes' : 'meses'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-amount">Monto (S/)</Label>
          <Input
            id="payment-amount"
            type="number"
            step="0.01"
            min="0.01"
            value={amount}
            onChange={(e) => {
              setAmountEdited(true);
              setAmount(e.target.value);
            }}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="payment-method">Método de pago</Label>
          <Select value={method} onValueChange={setMethod}>
            <SelectTrigger id="payment-method">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAYMENT_METHODS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="payment-reference">Referencia / operación</Label>
          <Input
            id="payment-reference"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Nro. operación"
            maxLength={100}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="payment-notes">Notas internas (opcional)</Label>
        <Textarea
          id="payment-notes"
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Ej. Renovación confirmada por WhatsApp"
          maxLength={300}
        />
      </div>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting ? 'Guardando...' : 'Registrar pago'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Modal para registrar un pago manual de suscripción de un taller.
 */
export default function RecordPaymentDialog({
  open,
  onOpenChange,
  company,
  submitting,
  onSubmit,
  onSuccess,
}) {
  const unitPrice = Number(company?.plan?.price_pen ?? 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Registrar pago de suscripción
          </DialogTitle>
          <DialogDescription>
            {company?.nombre_comercial || company?.razon_social} ·{' '}
            {company?.plan?.name || 'Sin plan'} ({formatPen(unitPrice)}/mes)
          </DialogDescription>
        </DialogHeader>

        {open && (
          <RecordPaymentForm
            company={company}
            submitting={submitting}
            onSubmit={onSubmit}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
