import { useState } from 'react';
import { ShieldAlert, ShieldCheck } from 'lucide-react';
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
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';

function CompanyStatusForm({
  company,
  targetActive,
  submitting,
  onSubmit,
  onOpenChange,
  onSuccess,
}) {
  const [reason, setReason] = useState('');
  const [formError, setFormError] = useState('');

  const trimmed = reason.trim();
  const isReactivating = Boolean(targetActive);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (trimmed.length < 10 || trimmed.length > 300) {
      setFormError('El motivo debe tener entre 10 y 300 caracteres.');
      return;
    }

    const result = await onSubmit(company.id, {
      is_active: isReactivating,
      reason: trimmed,
    });

    if (!result.ok) {
      setFormError(result.error?.message || 'No se pudo actualizar el estado del taller.');
      return;
    }

    toast.success(
      isReactivating ? 'Taller reactivado correctamente.' : 'Taller suspendido correctamente.'
    );
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

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="status-reason">Motivo obligatorio</Label>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {trimmed.length}/300
          </span>
        </div>
        <Textarea
          id="status-reason"
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={
            isReactivating
              ? 'Ej. Pago verificado y soporte confirma reactivación del taller.'
              : 'Ej. Suspensión por falta de pago luego del periodo de gracia.'
          }
          maxLength={300}
          required
        />
        <p className="text-[11px] text-muted-foreground">
          Mínimo 10 caracteres. Se registrará en la auditoría de plataforma y del taller.
        </p>
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
        <Button
          type="submit"
          variant={isReactivating ? 'default' : 'destructive'}
          disabled={submitting || trimmed.length < 10}
        >
          {submitting
            ? 'Aplicando...'
            : isReactivating
            ? 'Confirmar reactivación'
            : 'Confirmar suspensión'}
        </Button>
      </DialogFooter>
    </form>
  );
}

/**
 * Modal compartido para suspender o reactivar un taller con motivo obligatorio (10-300 caracteres).
 */
export default function CompanyStatusDialog({
  open,
  onOpenChange,
  company,
  targetActive,
  submitting,
  onSubmit,
  onSuccess,
}) {
  const isReactivating = Boolean(targetActive);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isReactivating ? (
              <ShieldCheck className="w-4 h-4 text-success" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-destructive" />
            )}
            {isReactivating ? 'Reactivar taller' : 'Suspender taller'}
          </DialogTitle>
          <DialogDescription>
            {company?.nombre_comercial || company?.razon_social} · RUC {company?.ruc || '—'}.{' '}
            {isReactivating
              ? 'Los usuarios del taller podrán volver a iniciar sesión según su suscripción.'
              : 'Los usuarios del taller quedarán bloqueados inmediatamente para iniciar sesión.'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <CompanyStatusForm
            company={company}
            targetActive={targetActive}
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
