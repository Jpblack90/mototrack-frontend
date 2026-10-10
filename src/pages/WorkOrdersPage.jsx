import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useWorkOrders } from '../hooks/useWorkOrders';
import WorkOrderCard from '../components/workorders/WorkOrderCard';
import NewWorkOrderModal from '../components/workorders/NewWorkOrderModal';
import AdvanceStatusModal from '../components/workorders/AdvanceStatusModal';
import { Card, CardHeader, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { Skeleton } from '../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import {
  Plus,
  Search,
  Wrench,
  AlertTriangle,
  History,
  SearchX,
} from 'lucide-react';

const KANBAN_COLUMNS = [
  { key: 'recibido',             label: 'Recibido' },
  { key: 'diagnostico',          label: 'Diagnóstico' },
  { key: 'pendiente_aprobacion', label: 'Pend. Aprobación' },
  { key: 'en_reparacion',        label: 'En Reparación' },
  { key: 'terminado',            label: 'Terminado' },
];

const STATUS_META = {
  recibido:             { label: 'Recibido',          variant: 'secondary' },
  diagnostico:          { label: 'Diagnóstico',       variant: 'outline' },
  pendiente_aprobacion: { label: 'Pend. Aprobación',  variant: 'outline' },
  en_reparacion:        { label: 'En Reparación',     variant: 'outline' },
  terminado:            { label: 'Terminado',         variant: 'outline' },
  entregado:            { label: 'Entregado',         variant: 'outline' },
  no_recogido:          { label: 'No Recogido',       variant: 'destructive' },
};

export default function WorkOrdersPage() {
  const { user } = useAuth();
  const role = user?.role;

  const {
    orders,
    loading,
    getAll,
    getHistoryByPlaca,
    createWorkOrder,
    getMechanics,
    assignMechanic,
    updateStatus,
    approveAdditionalWork,
    rejectAdditionalWork,
  } = useWorkOrders();

  // ─── Estado de modales ────────────────────────────────────────────────────
  const [newOTOpen, setNewOTOpen] = useState(false);
  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);

  // Asignar mecánico
  const [assignOpen, setAssignOpen] = useState(false);
  const [mechanics, setMechanics] = useState([]);
  const [assignLoading, setAssignLoading] = useState(false);
  const [selectedMech, setSelectedMech] = useState('');

  // Rechazar confirmación
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // ─── Historial por placa ──────────────────────────────────────────────────
  const [placaSearch, setPlacaSearch] = useState('');
  const [historyResult, setHistoryResult] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState('');

  // ─── Carga inicial ────────────────────────────────────────────────────────
  useEffect(() => {
    getAll();
  }, [getAll]);

  // ─── Agrupar órdenes por estado para el Kanban ────────────────────────────
  const byStatus = {};
  KANBAN_COLUMNS.forEach((col) => {
    byStatus[col.key] = [];
  });
  orders.forEach((o) => {
    if (byStatus[o.status] !== undefined) byStatus[o.status].push(o);
  });

  // ─── Acciones directas (sin modal) ────────────────────────────────────────
  async function handleAdvanceDirect(order, newStatus) {
    const res = await updateStatus(order.id, newStatus);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(`OT #${order.id} actualizada a "${newStatus}"`);
    }
  }

  // ─── Aprobar trabajo adicional ────────────────────────────────────────────
  async function handleApprove(order) {
    const res = await approveAdditionalWork(order.id);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(`Trabajo adicional aprobado para OT #${order.id}`);
    }
  }

  // ─── Rechazar trabajo adicional ───────────────────────────────────────────
  function openRejectConfirm(order) {
    setSelectedOrder(order);
    setRejectOpen(true);
  }

  async function confirmReject() {
    setRejectLoading(true);
    const res = await rejectAdditionalWork(selectedOrder.id);
    setRejectLoading(false);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(`Trabajo adicional rechazado para OT #${selectedOrder.id}`);
    }
    setRejectOpen(false);
    setSelectedOrder(null);
  }

  // ─── Asignar mecánico ─────────────────────────────────────────────────────
  async function openAssignModal(order) {
    setSelectedOrder(order);
    setSelectedMech(order.mechanic_id?.toString() ?? '');
    setAssignOpen(true);
    const list = await getMechanics();
    setMechanics(list ?? []);
  }

  async function confirmAssign() {
    if (!selectedMech) return;
    setAssignLoading(true);
    const res = await assignMechanic(selectedOrder.id, Number(selectedMech));
    setAssignLoading(false);
    if (res.ok) {
      toast.success(`Mecánico asignado a OT #${selectedOrder.id}`);
      setAssignOpen(false);
      setSelectedOrder(null);
    } else {
      toast.error(res.error);
    }
  }

  // ─── Historial por placa (RF-14) ──────────────────────────────────────────
  async function handleSearchHistory(e) {
    e.preventDefault();
    if (!placaSearch.trim()) return;
    setHistoryLoading(true);
    setHistoryError('');
    setHistoryResult(null);
    const res = await getHistoryByPlaca(placaSearch);
    setHistoryLoading(false);
    if (res.ok) {
      setHistoryResult(res.data);
    } else {
      setHistoryError(res.error);
      toast.error(res.error);
    }
  }

  const activeOrdersCount = orders.filter(
    (o) => !['entregado', 'no_recogido'].includes(o.status)
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Órdenes de Trabajo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? 'Cargando tablero…'
              : `${activeOrdersCount} orden${activeOrdersCount !== 1 ? 'es' : ''} activa${activeOrdersCount !== 1 ? 's' : ''} en taller`}
          </p>
        </div>

        {/* Botón Nueva OT (admin y cajero) */}
        {role !== 'mecanico' && (
          <Button onClick={() => setNewOTOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Nueva OT</span>
          </Button>
        )}
      </div>

      {/* ── Tablero Kanban con Cards y ScrollArea ── */}
      <div className="overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0 touch-pan-x">
        <div className="flex gap-4 min-w-[1050px]">
          {KANBAN_COLUMNS.map((col) => {
            const colOrders = byStatus[col.key] ?? [];
            return (
              <Card
                key={col.key}
                className="flex-1 min-w-[210px] max-w-xs flex flex-col h-[650px] shadow-sm border-border bg-card/60"
              >
                {/* Encabezado de Columna */}
                <CardHeader className="py-3 px-3.5 border-b border-border flex flex-row items-center justify-between space-y-0 shrink-0">
                  <span className="text-xs font-bold uppercase tracking-wider text-foreground">
                    {col.label}
                  </span>
                  <Badge variant="secondary" className="text-[11px] h-5 px-1.5 tabular-nums">
                    {colOrders.length}
                  </Badge>
                </CardHeader>

                {/* Lista Vertical con ScrollArea */}
                <CardContent className="p-2.5 flex-1 overflow-hidden">
                  <ScrollArea className="h-full pr-1.5">
                    <div className="space-y-3">
                      {loading ? (
                        Array.from({ length: 2 }).map((_, i) => (
                          <Skeleton key={i} className="h-32 w-full rounded-xl" />
                        ))
                      ) : colOrders.length === 0 ? (
                        <div className="border border-dashed border-border/80 bg-muted/15 rounded-xl h-28 flex flex-col items-center justify-center gap-1.5 text-center p-3">
                          <Wrench className="w-4 h-4 text-muted-foreground/40" />
                          <span className="text-xs font-medium text-muted-foreground">Sin órdenes</span>
                        </div>
                      ) : (
                        colOrders.map((order) => (
                          <WorkOrderCard
                            key={order.id}
                            order={order}
                            role={role}
                            onAdvanceDirect={handleAdvanceDirect}
                            onOpenAdvanceModal={(o) => {
                              setSelectedOrder(o);
                              setAdvanceOpen(true);
                            }}
                            onOpenAssignModal={openAssignModal}
                            onApprove={handleApprove}
                            onOpenRejectConfirm={openRejectConfirm}
                          />
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── Historial por Placa (RF-14) ── */}
      <Card className="shadow-sm border-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <History className="w-4 h-4 text-primary" />
          <h2 className="font-semibold text-foreground text-sm">Historial por Placa (Vehículo)</h2>
        </div>

        <form onSubmit={handleSearchHistory} className="flex gap-2.5 max-w-md">
          <Input
            value={placaSearch}
            onChange={(e) => setPlacaSearch(e.target.value.toUpperCase())}
            placeholder="Ingresa placa (ej: ABC-123)…"
            className="uppercase font-mono text-xs"
          />
          <Button type="submit" disabled={historyLoading} size="sm" className="gap-1.5 shrink-0">
            <Search className="w-3.5 h-3.5" />
            <span>{historyLoading ? 'Buscando…' : 'Buscar'}</span>
          </Button>
        </form>

        {historyError && (
          <p className="mt-3 text-xs text-destructive">{historyError}</p>
        )}

        {historyResult !== null && (
          <div className="mt-4 pt-3 border-t border-border">
            {historyResult.length === 0 ? (
              <EmptyState
                icon={SearchX}
                title="Sin historial de órdenes"
                description={`No se encontraron órdenes registradas para el vehículo con placa "${placaSearch}".`}
                compact
              />
            ) : (
              <div className="divide-y divide-border/60 max-h-60 overflow-y-auto">
                {[...historyResult]
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
                  .map((ot) => {
                    const meta = STATUS_META[ot.status] ?? {
                      label: ot.status,
                      variant: 'secondary',
                    };
                    return (
                      <div
                        key={ot.id}
                        className="py-2.5 flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-medium text-foreground">
                            OT #{ot.id} · {ot.customer_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(ot.created_at).toLocaleDateString('es-PE', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </p>
                        </div>
                        <Badge variant={meta.variant} className="text-[10px] px-2 py-0">
                          {meta.label}
                        </Badge>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </Card>

      {/* ── Modales ── */}

      {/* Nueva OT */}
      <NewWorkOrderModal
        open={newOTOpen}
        onClose={() => setNewOTOpen(false)}
        createWorkOrder={createWorkOrder}
      />

      {/* Avanzar diagnóstico */}
      <AdvanceStatusModal
        open={advanceOpen}
        order={selectedOrder}
        onClose={() => {
          setAdvanceOpen(false);
          setSelectedOrder(null);
        }}
        updateStatus={updateStatus}
      />

      {/* Asignar mecánico con Dialog y Select de shadcn */}
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4 text-primary" />
              <DialogTitle className="text-base font-semibold text-foreground">
                Asignar Mecánico
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground">
              Selecciona el técnico responsable para la OT #{selectedOrder?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <Label htmlFor="mech_select" className="text-xs">Técnico Mecánico</Label>
              <Select value={selectedMech} onValueChange={setSelectedMech}>
                <SelectTrigger id="mech_select" className="w-full">
                  <SelectValue placeholder="Selecciona un mecánico…" />
                </SelectTrigger>
                <SelectContent>
                  {mechanics.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAssignOpen(false)}
                disabled={assignLoading}
              >
                Cancelar
              </Button>
              <Button
                size="sm"
                onClick={confirmAssign}
                disabled={assignLoading || !selectedMech}
              >
                {assignLoading ? 'Asignando…' : 'Asignar'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Confirmar rechazo con AlertDialog de shadcn */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive text-base font-semibold">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>¿Rechazar trabajo adicional?</span>
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground pt-1">
              OT #{selectedOrder?.id} · {selectedOrder?.customer_name}. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setRejectOpen(false)}
              disabled={rejectLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmReject}
              disabled={rejectLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejectLoading ? 'Rechazando…' : 'Sí, rechazar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
