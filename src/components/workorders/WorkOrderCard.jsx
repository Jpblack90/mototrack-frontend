import { useState } from 'react';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Avatar, AvatarFallback } from '../ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '../ui/collapsible';
import { VALID_TRANSITIONS } from '../../hooks/useWorkOrders';
import {
  Wrench,
  User,
  ChevronDown,
  CheckCircle,
  XCircle,
  ArrowRight,
  Truck,
  Clock,
  Car,
  DollarSign,
} from 'lucide-react';

const STATUS_META = {
  recibido: {
    label: 'Recibido',
    variant: 'secondary',
    badgeClass: 'text-slate-700 bg-slate-100 dark:bg-slate-800 dark:text-slate-300',
  },
  diagnostico: {
    label: 'Diagnóstico',
    variant: 'outline',
    badgeClass: 'text-sky-700 bg-sky-50 border-sky-200 dark:bg-sky-950 dark:text-sky-300 dark:border-sky-800',
  },
  pendiente_aprobacion: {
    label: 'Pend. Aprobación',
    variant: 'outline',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  en_reparacion: {
    label: 'En Reparación',
    variant: 'outline',
    badgeClass: 'text-primary bg-primary/10 border-primary/30',
  },
  terminado: {
    label: 'Terminado',
    variant: 'outline',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  entregado: {
    label: 'Entregado',
    variant: 'outline',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300',
  },
  no_recogido: {
    label: 'No Recogido',
    variant: 'destructive',
    badgeClass: '',
  },
};

function getInitials(name) {
  if (!name) return '—';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export default function WorkOrderCard({
  order,
  role,
  onAdvanceDirect,
  onOpenAdvanceModal,
  onOpenAssignModal,
  onApprove,
  onOpenRejectConfirm,
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { status } = order;
  const meta = STATUS_META[status] ?? {
    label: status,
    variant: 'secondary',
    badgeClass: '',
  };
  const transitions = VALID_TRANSITIONS[status] ?? [];

  const placa = order.vehicle?.placa ?? order.placa ?? '—';
  const brand = order.vehicle?.brand ?? '';
  const model = order.vehicle?.model ?? '';
  const mechName = order.mechanic_name ?? order.mechanic?.name ?? null;
  const additCost = order.additional_cost ? Number(order.additional_cost) : null;

  return (
    <Card className="shadow-sm border-border hover:shadow-md transition-shadow">
      {/* Cabecera de la tarjeta: Placa y Badge de estado */}
      <CardHeader className="p-3.5 pb-2 flex flex-row items-start justify-between gap-2 space-y-0">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-foreground text-sm tracking-wider font-mono">
              {placa}
            </span>
            <span className="text-[11px] text-muted-foreground">OT #{order.id}</span>
          </div>
          {(brand || model) && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {[brand, model].filter(Boolean).join(' ')}
            </p>
          )}
        </div>
        <Badge
          variant={meta.variant}
          className={`shrink-0 text-[10px] px-2 py-0.5 font-medium ${meta.badgeClass}`}
        >
          {meta.label}
        </Badge>
      </CardHeader>

      <CardContent className="p-3.5 pt-1 pb-2 space-y-2.5">
        {/* Mecánico asignado con Avatar e iniciales */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 border border-border">
              <AvatarFallback className="text-[10px] bg-muted text-muted-foreground font-semibold">
                {mechName ? getInitials(mechName) : <User className="w-3 h-3" />}
              </AvatarFallback>
            </Avatar>
            <span className="truncate text-foreground font-medium">
              {mechName || <span className="text-muted-foreground italic">Sin asignar</span>}
            </span>
          </div>
        </div>

        {/* Costo adicional si aplica */}
        {additCost && (
          <div className="flex items-center gap-1.5 text-xs rounded-md bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 px-2 py-1">
            <DollarSign className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
            <span className="font-medium">Adicional: S/ {additCost.toFixed(2)}</span>
          </div>
        )}

        {/* Collapsible: Plegar/desplegar datos del vehículo y cliente */}
        <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen} className="pt-0.5">
          <CollapsibleTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="w-full h-6 p-0 text-[11px] text-muted-foreground hover:text-foreground justify-between font-normal"
            >
              <span className="flex items-center gap-1">
                <Car className="w-3 h-3" />
                <span>{detailsOpen ? 'Ocultar detalles' : 'Ver cliente y vehículo'}</span>
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  detailsOpen ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 text-xs space-y-1.5 border-t border-border/50 mt-1">
            <div className="flex justify-between text-muted-foreground">
              <span>Cliente:</span>
              <span className="font-medium text-foreground text-right truncate max-w-[150px]">
                {order.customer_name || '—'}
              </span>
            </div>
            {order.customer_phone && (
              <div className="flex justify-between text-muted-foreground">
                <span>Teléfono:</span>
                <span className="font-medium text-foreground">{order.customer_phone}</span>
              </div>
            )}
            {order.entry_mileage && (
              <div className="flex justify-between text-muted-foreground">
                <span>Kilometraje:</span>
                <span className="font-medium text-foreground tabular-nums">
                  {order.entry_mileage} km
                </span>
              </div>
            )}
            {order.diagnosis_notes && (
              <div className="text-muted-foreground pt-1">
                <p className="font-medium text-[11px] text-foreground">Diagnóstico:</p>
                <p className="italic text-[11px] leading-tight mt-0.5">{order.diagnosis_notes}</p>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      {/* Botones de transición de estado */}
      <CardFooter className="p-3 pt-2 border-t border-border/60">
        <ActionButtons
          order={order}
          role={role}
          status={status}
          transitions={transitions}
          onAdvanceDirect={onAdvanceDirect}
          onOpenAdvanceModal={onOpenAdvanceModal}
          onOpenAssignModal={onOpenAssignModal}
          onApprove={onApprove}
          onOpenRejectConfirm={onOpenRejectConfirm}
        />
      </CardFooter>
    </Card>
  );
}

// ─── Botones de acción según rol y máquina de estados ────────────────────────

function ActionButtons({
  order,
  role,
  status,
  onAdvanceDirect,
  onOpenAdvanceModal,
  onOpenAssignModal,
  onApprove,
  onOpenRejectConfirm,
}) {
  const isAdmin = role === 'admin';
  const isCajero = role === 'cajero';
  const isMec = role === 'mecanico';

  const buttons = [];

  // Asignar mecánico — solo admin
  if (isAdmin) {
    buttons.push(
      <Button
        key="assign"
        variant="outline"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => onOpenAssignModal(order)}
      >
        <Wrench className="w-3 h-3" />
        <span>Asignar</span>
      </Button>
    );
  }

  // Recibido → Diagnóstico (admin, mecánico)
  if (status === 'recibido' && (isAdmin || isMec)) {
    buttons.push(
      <Button
        key="to-diag"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => onAdvanceDirect(order, 'diagnostico')}
      >
        <ArrowRight className="w-3 h-3" />
        <span>Diagnóstico</span>
      </Button>
    );
  }

  // Diagnóstico → En Reparación (abre modal — admin, mecánico)
  if (status === 'diagnostico' && (isAdmin || isMec)) {
    buttons.push(
      <Button
        key="to-rep"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => onOpenAdvanceModal(order)}
      >
        <ArrowRight className="w-3 h-3" />
        <span>Avanzar</span>
      </Button>
    );
  }

  // Pendiente Aprobación → Aprobar/Rechazar (admin, cajero; NO mecánico)
  if (status === 'pendiente_aprobacion' && (isAdmin || isCajero)) {
    buttons.push(
      <Button
        key="approve"
        size="sm"
        className="h-7 text-xs gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
        onClick={() => onApprove(order)}
      >
        <CheckCircle className="w-3 h-3" />
        <span>Aprobar</span>
      </Button>
    );
    buttons.push(
      <Button
        key="reject"
        variant="destructive"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => onOpenRejectConfirm(order)}
      >
        <XCircle className="w-3 h-3" />
        <span>Rechazar</span>
      </Button>
    );
  }

  // En Reparación → Terminado (admin, mecánico)
  if (status === 'en_reparacion' && (isAdmin || isMec)) {
    buttons.push(
      <Button
        key="to-term"
        size="sm"
        className="h-7 text-xs gap-1 bg-emerald-600 text-white hover:bg-emerald-700"
        onClick={() => onAdvanceDirect(order, 'terminado')}
      >
        <CheckCircle className="w-3 h-3" />
        <span>Terminado</span>
      </Button>
    );
  }

  // Terminado → Entregado (todos)
  if (status === 'terminado') {
    buttons.push(
      <Button
        key="to-ent"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => onAdvanceDirect(order, 'entregado')}
      >
        <Truck className="w-3 h-3" />
        <span>Entregado</span>
      </Button>
    );
  }

  // Terminado → No Recogido (solo admin)
  if (status === 'terminado' && isAdmin) {
    buttons.push(
      <Button
        key="to-norec"
        variant="secondary"
        size="sm"
        className="h-7 text-xs gap-1"
        onClick={() => onAdvanceDirect(order, 'no_recogido')}
      >
        <Clock className="w-3 h-3" />
        <span>No recogido</span>
      </Button>
    );
  }

  if (buttons.length === 0) return null;

  return <div className="flex flex-wrap gap-1.5 w-full">{buttons}</div>;
}
