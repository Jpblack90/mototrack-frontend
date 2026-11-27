import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { AlertCircle, AlertTriangle, ArrowRight } from 'lucide-react';

/**
 * Modal para avanzar desde Diagnóstico → En Reparación.
 * Siempre envía 'en_reparacion'; el backend puede redirigir
 * a 'pendiente_aprobacion' si additional_cost supera el umbral.
 */
export default function AdvanceStatusModal({ open, order, onClose, updateStatus }) {
  const [diagnosisNotes, setDiagnosisNotes] = useState('');
  const [additionalCost, setAdditionalCost] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [redirectInfo, setRedirectInfo] = useState(null);

  const hasItems = Number(order?.items_count || 0) > 0;
  const derivedCost = +(Number(order?.approved_total || 0) + Number(order?.pending_total || 0)).toFixed(2);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setRedirectInfo(null);
    setLoading(true);

    const payload = {
      diagnosis_notes: diagnosisNotes.trim() || undefined,
    };
    if (!hasItems && additionalCost) {
      payload.additional_cost = Number(additionalCost);
    }

    const res = await updateStatus(order.id, 'en_reparacion', payload);

    setLoading(false);

    if (!res.ok) {
      setError(res.error);
      return;
    }

    const finalStatus = res.data?.status;
    if (finalStatus === 'pendiente_aprobacion') {
      const shownAmount = hasItems ? derivedCost.toFixed(2) : additionalCost;
      setRedirectInfo(
        `El costo adicional de S/ ${shownAmount} superó el umbral permitido. ` +
        `La OT pasó a "Pendiente Aprobación" para autorización de cliente antes de iniciar reparación.`
      );
      return;
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
    <>
      <Dialog open={open && !redirectInfo} onOpenChange={(val) => !val && handleClose()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <ArrowRight className="w-4 h-4 text-primary" />
              <span>Avanzar Diagnóstico</span>
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Registra las conclusiones técnicas y costos adicionales antes de iniciar reparación.
            </DialogDescription>
          </DialogHeader>

          {/* Contexto de la OT */}
          <div className="rounded-lg border border-border bg-muted/30 p-2.5 text-xs flex justify-between items-center">
            <span className="font-mono font-bold text-foreground">
              {order.vehicle?.placa ?? order.placa}
            </span>
            <span className="text-muted-foreground truncate max-w-[200px]">
              {order.customer_name}
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="diag_notes" className="text-xs">
                Notas de Diagnóstico
              </Label>
              <Textarea
                id="diag_notes"
                value={diagnosisNotes}
                onChange={(e) => setDiagnosisNotes(e.target.value)}
                placeholder="Detalla las fallas encontradas y trabajo a realizar…"
                className="text-xs min-h-[70px]"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="add_cost" className="text-xs">
                {hasItems
                  ? 'Total de repuestos y servicios (sin IGV, solo lectura)'
                  : 'Costo Adicional Estimado (S/)'}
              </Label>
              {hasItems ? (
                <div className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs flex items-center justify-between">
                  <span className="font-semibold text-foreground tabular-nums">
                    S/ {derivedCost.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">
                    Calculado de {order.items_count} {Number(order.items_count) === 1 ? 'línea' : 'líneas'}
                  </span>
                </div>
              ) : (
                <Input
                  id="add_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                  placeholder="0.00"
                  className="text-xs h-8"
                />
              )}
              <p className="text-[11px] text-muted-foreground">
                Si supera el umbral configurado, la orden requerirá aprobación de cliente.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" disabled={loading}>
                {loading ? 'Avanzando…' : 'Confirmar Avance'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* AlertDialog de advertencia cuando supera el umbral y redirige a pendiente_aprobacion */}
      {redirectInfo && (
        <AlertDialog open={true} onOpenChange={handleClose}>
          <AlertDialogContent className="max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-warning text-base font-semibold">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <span>Requiere Aprobación de Costo</span>
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-foreground pt-1 leading-relaxed">
                {redirectInfo}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={handleClose}>
                Entendido
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </>
  );
}
