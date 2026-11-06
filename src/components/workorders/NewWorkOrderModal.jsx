import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Wrench, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const EMPTY = {
  placa: '',
  brand: '',
  model: '',
  customer_name: '',
  customer_phone: '',
  entry_mileage: '',
  checklist_notes: '',
  whatsapp_opt_in: false,
};

export default function NewWorkOrderModal({ open, onClose, createWorkOrder }) {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
    setError('');
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const payload = {
      placa: form.placa.trim().toUpperCase(),
      brand: form.brand.trim() || undefined,
      model: form.model.trim() || undefined,
      customer_name: form.customer_name.trim(),
      customer_phone: form.customer_phone.trim() || undefined,
      entry_mileage: form.entry_mileage ? Number(form.entry_mileage) : undefined,
      checklist_notes: form.checklist_notes.trim() || undefined,
      whatsapp_opt_in: form.whatsapp_opt_in,
    };
    const res = await createWorkOrder(payload);
    setLoading(false);

    if (res.ok) {
      toast.success(`Orden creada para la placa ${payload.placa}`);
      window.dispatchEvent(new CustomEvent('mototrack:workorder-updated'));
      setForm(EMPTY);
      onClose();
    } else {
      setError(res.error);
      toast.error(res.error);
    }
  }

  function handleClose() {
    setForm(EMPTY);
    setError('');
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold text-foreground">
              Nueva Orden de Trabajo (OT)
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Registra el ingreso del vehículo al taller, datos del cliente y estado inicial.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
          {/* Placa */}
          <div className="space-y-1">
            <Label htmlFor="ot_placa" className="text-xs">
              Placa del Vehículo <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ot_placa"
              name="placa"
              required
              value={form.placa}
              onChange={handleChange}
              placeholder="Ej: ABC-123"
              className="uppercase font-mono font-bold h-9 text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Si la placa ya existe, se asociará al vehículo existente.
            </p>
          </div>

          {/* Marca + Modelo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ot_brand" className="text-xs">Marca</Label>
              <Input
                id="ot_brand"
                name="brand"
                value={form.brand}
                onChange={handleChange}
                placeholder="Ej: Honda"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ot_model" className="text-xs">Modelo</Label>
              <Input
                id="ot_model"
                name="model"
                value={form.model}
                onChange={handleChange}
                placeholder="Ej: CG125"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Cliente + Teléfono */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="ot_cust_name" className="text-xs">
                Nombre del Cliente <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ot_cust_name"
                name="customer_name"
                required
                value={form.customer_name}
                onChange={handleChange}
                placeholder="Ej: Carlos Silva"
                className="h-8 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ot_cust_phone" className="text-xs">Teléfono</Label>
              <Input
                id="ot_cust_phone"
                name="customer_phone"
                value={form.customer_phone}
                onChange={handleChange}
                placeholder="Ej: 987654321"
                className="h-8 text-xs"
              />
              <p className="text-[11px] text-muted-foreground">Celular de 9 dígitos</p>
            </div>
          </div>

          {/* Consentimiento WhatsApp (Ley N° 29733 / RF-15) */}
          <div className="flex items-start space-x-2 pt-1 pb-1">
            <Checkbox
              id="ot_whatsapp_opt_in"
              checked={form.whatsapp_opt_in}
              onCheckedChange={(checked) =>
                setForm((f) => ({ ...f, whatsapp_opt_in: Boolean(checked) }))
              }
            />
            <div className="grid gap-0.5 leading-none">
              <Label
                htmlFor="ot_whatsapp_opt_in"
                className="text-xs font-normal text-foreground cursor-pointer"
              >
                El cliente acepta recibir avisos por WhatsApp sobre su moto (Ley N° 29733)
              </Label>
            </div>
          </div>

          {/* Kilometraje de ingreso */}
          <div className="space-y-1">
            <Label htmlFor="ot_mileage" className="text-xs">Kilometraje de Ingreso (km)</Label>
            <Input
              id="ot_mileage"
              name="entry_mileage"
              type="number"
              min="0"
              value={form.entry_mileage}
              onChange={handleChange}
              placeholder="Ej: 12500"
              className="h-8 text-xs"
            />
          </div>

          {/* Checklist y observaciones */}
          <div className="space-y-1">
            <Label htmlFor="ot_notes" className="text-xs">Checklist / Motivo de Ingreso</Label>
            <Textarea
              id="ot_notes"
              name="checklist_notes"
              value={form.checklist_notes}
              onChange={handleChange}
              placeholder="Rayones previos, estado de combustible, falla reportada…"
              className="text-xs min-h-[60px]"
            />
          </div>

          {error && (
            <div className="flex items-center gap-1.5 rounded-lg bg-destructive/10 p-2.5 text-xs text-destructive">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" disabled={loading}>
              {loading ? 'Creando OT…' : 'Crear Orden'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
