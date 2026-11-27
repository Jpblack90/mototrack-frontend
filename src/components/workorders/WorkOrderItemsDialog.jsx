import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { ScrollArea } from '../ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Wrench,
  Package,
  Search,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { toast } from 'sonner';
import { useWorkOrderItems } from '../../hooks/useWorkOrderItems';

const ORIGIN_LABELS = {
  recepcion: 'Recepción',
  diagnostico: 'Diagnóstico',
  reparacion: 'Reparación',
};

const CHANNEL_LABELS = {
  presencial: 'Presencial',
  whatsapp: 'WhatsApp',
  telefono: 'Teléfono',
  umbral: 'Aprobación automática',
};

const TYPE_LABELS = {
  product: 'Repuesto',
  kit: 'Kit',
  service: 'Servicio',
};

function calcWithIgv(subtotal, igvRate) {
  const sub = Number(subtotal || 0);
  const igv = +(sub * igvRate).toFixed(2);
  const total = +(sub + igv).toFixed(2);
  return { sub, igv, total };
}

export default function WorkOrderItemsDialog({
  open,
  order,
  role,
  igvRate = 0.18,
  onClose,
  onItemsChanged,
}) {
  const {
    items,
    summary,
    loading,
    submitting,
    error,
    searchResults,
    searchLoading,
    loadItems,
    searchProducts,
    resetSearch,
    addProductItem,
    addServiceItem,
    decideItem,
    createNotifyLink,
  } = useWorkOrderItems();

  const [searchTerm, setSearchTerm] = useState('');
  const [productQty, setProductQty] = useState('1');
  const [serviceDesc, setServiceDesc] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [serviceQty, setServiceQty] = useState('1');
  const [channelByItem, setChannelByItem] = useState({});
  const [stockWarning, setStockWarning] = useState(null);
  const [notifyError, setNotifyError] = useState('');
  const [notifyLinkData, setNotifyLinkData] = useState(null);

  const canManage = ['admin', 'cajero'].includes(role);
  const isOrderOpen =
    order && ['recibido', 'diagnostico', 'pendiente_aprobacion', 'en_reparacion'].includes(order.status);
  const canEditItems = canManage && isOrderOpen;

  useEffect(() => {
    if (!open || !order?.id) return;
    loadItems(order.id);
    const t = setTimeout(() => {
      setStockWarning(null);
      setNotifyError('');
      setNotifyLinkData(null);
      setSearchTerm('');
      setProductQty('1');
      setServiceDesc('');
      setServicePrice('');
      setServiceQty('1');
      resetSearch();
    }, 0);
    return () => clearTimeout(t);
  }, [open, order?.id, loadItems, resetSearch]);

  useEffect(() => {
    if (!open || !canEditItems) return;
    const t = setTimeout(() => {
      searchProducts(searchTerm);
    }, 300);
    return () => clearTimeout(t);
  }, [open, canEditItems, searchTerm, searchProducts]);

  async function handleAddProduct(product) {
    if (!order?.id) return;
    const qty = Math.max(1, parseInt(productQty, 10) || 1);
    const res = await addProductItem(order.id, { product_id: product.id, quantity: qty });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    if (res.data?.stock_warning) {
      setStockWarning(res.data.stock_warning);
      toast.warning(res.data.stock_warning.message);
    } else {
      setStockWarning(null);
      toast.success(`"${product.name}" agregado como pendiente de aprobación`);
    }
    setNotifyError('');
    onItemsChanged?.();
  }

  async function handleAddService(e) {
    e.preventDefault();
    if (!order?.id) return;
    const desc = serviceDesc.trim();
    const price = Number(servicePrice);
    const qty = Math.max(1, parseInt(serviceQty, 10) || 1);

    if (desc.length < 1 || desc.length > 200) {
      toast.error('Ingresa una descripción entre 1 y 200 caracteres.');
      return;
    }
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Ingresa un precio sin IGV mayor a S/ 0.00.');
      return;
    }

    const res = await addServiceItem(order.id, {
      description: desc,
      unit_price: price,
      quantity: qty,
    });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    setServiceDesc('');
    setServicePrice('');
    setServiceQty('1');
    setStockWarning(null);
    setNotifyError('');
    toast.success(`"${desc}" agregado como pendiente de aprobación`);
    onItemsChanged?.();
  }

  async function handleDecision(item, decision) {
    if (!order?.id) return;
    const channel = channelByItem[item.id] || 'presencial';
    const res = await decideItem(order.id, item.id, { decision, channel });
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setNotifyError('');
    if (decision === 'aprobada') {
      toast.success(`"${item.display_name}" aprobado (${CHANNEL_LABELS[channel]})`);
    } else {
      toast.info(`"${item.display_name}" rechazado (${CHANNEL_LABELS[channel]})`);
    }
    onItemsChanged?.();
  }

  async function handleNotifyClient() {
    if (!order?.id) return;
    setNotifyError('');
    setNotifyLinkData(null);
    const res = await createNotifyLink(order.id);
    if (!res.ok) {
      setNotifyError(res.error);
      toast.error(res.error);
      return;
    }
    setNotifyLinkData(res.data);
    window.open(res.data.url, '_blank', 'noopener,noreferrer');
    toast.success('Se preparó el mensaje de WhatsApp para enviar al cliente.');
  }

  if (!order) return null;

  const pendingItems = items.filter((it) => it.status === 'propuesta');
  const approvedItems = items.filter((it) => it.status === 'aprobada');
  const rejectedItems = items.filter((it) => it.status === 'rechazada');

  const igvPct = Math.round(igvRate * 100);
  const approvedTotals = calcWithIgv(summary.approved_total, igvRate);
  const pendingTotals = calcWithIgv(summary.pending_total, igvRate);

  const placa = order.vehicle?.placa ?? order.placa ?? '';
  const bikeLabel = [order.brand ?? order.vehicle?.brand, order.model ?? order.vehicle?.model]
    .filter(Boolean)
    .join(' ');

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="max-w-3xl max-h-[92vh] flex flex-col p-5 sm:p-6 overflow-hidden">
        <DialogHeader className="shrink-0">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold text-foreground">
              Repuestos y servicios · OT #{order.id}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {[placa, bikeLabel, order.customer_name].filter(Boolean).join(' · ')}
            {!canEditItems && ' · Modo solo lectura'}
          </DialogDescription>
        </DialogHeader>

        {/* Resumen financiero y notificación al cliente */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 shrink-0">
          <div className="rounded-lg border border-success/30 bg-success/10 p-3 text-xs">
            <p className="font-semibold text-success">Total aprobado</p>
            <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">
              S/ {approvedTotals.sub.toFixed(2)} + IGV ({igvPct}%) = S/ {approvedTotals.total.toFixed(2)}
            </p>
          </div>
          <div className="rounded-lg border border-warning/30 bg-warning/10 p-3 text-xs flex flex-col justify-between gap-2">
            <div>
              <p className="font-semibold text-warning">Pendiente por aprobar</p>
              <p className="text-sm font-bold text-foreground tabular-nums mt-0.5">
                S/ {pendingTotals.sub.toFixed(2)} + IGV ({igvPct}%) = S/ {pendingTotals.total.toFixed(2)}
              </p>
            </div>
            {canManage && pendingItems.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleNotifyClient}
                disabled={submitting}
                className="h-7 text-xs gap-1.5 bg-success text-success-foreground hover:bg-success/90 w-full sm:w-auto"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>Notificar al cliente</span>
              </Button>
            )}
          </div>
        </div>

        {/* Avisos de WhatsApp o stock sin bloqueo */}
        {notifyError && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs flex items-center gap-2 text-foreground shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>{notifyError}</span>
          </div>
        )}
        {notifyLinkData?.url && (
          <div className="rounded-lg border border-success/40 bg-success/10 p-2.5 text-xs flex items-center justify-between gap-2 shrink-0">
            <span className="text-foreground truncate">
              Enlace listo para {notifyLinkData.phone} (S/ {Number(notifyLinkData.pending_total).toFixed(2)} con IGV).
            </span>
            <a
              href={notifyLinkData.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-success hover:underline shrink-0"
            >
              <span>Abrir WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        )}
        {stockWarning && (
          <div className="rounded-lg border border-warning/40 bg-warning/10 p-2.5 text-xs flex items-center gap-2 text-foreground shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>{stockWarning.message}</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-2.5 text-xs text-destructive shrink-0">
            {error}
          </div>
        )}

        <ScrollArea className="flex-1 min-h-0 pr-2">
          <div className="space-y-4 py-1">
            {/* Formularios de alta (solo admin/cajero mientras OT está abierta) */}
            {canEditItems && (
              <div className="rounded-lg border border-border bg-muted/20 p-3.5 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                    Agregar a la orden
                  </h3>
                  {order.status === 'en_reparacion' && (
                    <span className="text-[11px] text-warning font-medium">
                      En reparación toda línea nueva requiere aprobación del cliente.
                    </span>
                  )}
                </div>

                <Tabs defaultValue="product" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full sm:w-72 h-8">
                    <TabsTrigger value="product" className="text-xs gap-1.5">
                      <Package className="w-3.5 h-3.5" />
                      <span>Repuesto</span>
                    </TabsTrigger>
                    <TabsTrigger value="service" className="text-xs gap-1.5">
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Mano de obra</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="product" className="space-y-2.5 pt-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <Input
                          type="search"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          placeholder="Buscar repuesto por nombre o SKU…"
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Label htmlFor="wo-prod-qty" className="text-xs text-muted-foreground">
                          Cant.
                        </Label>
                        <Input
                          id="wo-prod-qty"
                          type="number"
                          min="1"
                          step="1"
                          value={productQty}
                          onChange={(e) => setProductQty(e.target.value)}
                          className="w-16 h-8 text-xs tabular-nums"
                        />
                      </div>
                    </div>

                    {searchLoading && <Skeleton className="h-14 w-full rounded-lg" />}

                    {!searchLoading && searchTerm.trim() !== '' && searchResults.length === 0 && (
                      <p className="text-xs text-muted-foreground py-2">
                        Sin resultados para "{searchTerm.trim()}".
                      </p>
                    )}

                    {!searchLoading && searchResults.length > 0 && (
                      <div className="divide-y divide-border border border-border rounded-lg max-h-40 overflow-y-auto bg-card">
                        {searchResults.map((p) => {
                          const stockNum = Number(p.stock);
                          return (
                            <div
                              key={p.id}
                              className="flex items-center justify-between gap-2 px-3 py-2 text-xs hover:bg-accent/40 transition-colors duration-150"
                            >
                              <div className="min-w-0">
                                <p className="font-medium text-foreground truncate">{p.name}</p>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                  {p.sku && <span className="font-mono">{p.sku}</span>}
                                  <span>S/ {Number(p.sale_price).toFixed(2)} (sin IGV)</span>
                                  <Badge
                                    variant={stockNum <= 0 ? 'destructive' : 'secondary'}
                                    className="text-[10px] px-1.5 py-0"
                                  >
                                    Stock: {stockNum}
                                  </Badge>
                                </div>
                              </div>
                              <Button
                                type="button"
                                size="sm"
                                variant="secondary"
                                disabled={submitting}
                                onClick={() => handleAddProduct(p)}
                                className="h-7 text-xs gap-1 shrink-0"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Agregar</span>
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="service" className="pt-2">
                    <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                      <div className="sm:col-span-6 space-y-1">
                        <Label htmlFor="wo-svc-desc" className="text-xs">
                          Descripción de mano de obra
                        </Label>
                        <Input
                          id="wo-svc-desc"
                          value={serviceDesc}
                          maxLength={200}
                          onChange={(e) => setServiceDesc(e.target.value)}
                          placeholder="Ej: Cambio de kit de arrastre"
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="sm:col-span-3 space-y-1">
                        <Label htmlFor="wo-svc-price" className="text-xs">
                          Precio sin IGV (S/)
                        </Label>
                        <Input
                          id="wo-svc-price"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={servicePrice}
                          onChange={(e) => setServicePrice(e.target.value)}
                          placeholder="0.00"
                          className="h-8 text-xs tabular-nums"
                        />
                      </div>
                      <div className="sm:col-span-1 space-y-1">
                        <Label htmlFor="wo-svc-qty" className="text-xs">
                          Cant.
                        </Label>
                        <Input
                          id="wo-svc-qty"
                          type="number"
                          min="1"
                          step="1"
                          value={serviceQty}
                          onChange={(e) => setServiceQty(e.target.value)}
                          className="h-8 text-xs tabular-nums"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <Button type="submit" size="sm" disabled={submitting} className="w-full h-8 text-xs gap-1">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Agregar</span>
                        </Button>
                      </div>
                    </form>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Listado agrupado por estado */}
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-16 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
              </div>
            ) : items.length === 0 ? (
              <EmptyState
                icon={Wrench}
                title="Sin repuestos ni servicios por línea"
                description="Esta orden aún no tiene líneas detalladas. Agrega un repuesto o mano de obra para iniciar."
                compact
              />
            ) : (
              <div className="space-y-4">
                {/* 1. Pendientes por aprobar */}
                {pendingItems.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold text-warning uppercase tracking-wider">
                        Por aprobar ({pendingItems.length})
                      </h4>
                    </div>
                    <div className="space-y-2">
                      {pendingItems.map((it) => {
                        const selectedChannel = channelByItem[it.id] || 'presencial';
                        const lowStock =
                          it.item_type === 'product' &&
                          it.current_stock != null &&
                          Number(it.current_stock) < Number(it.quantity);

                        return (
                          <div
                            key={it.id}
                            className="rounded-lg border border-warning/30 bg-card p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-sm font-medium text-foreground">
                                  {it.display_name}
                                </span>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                  {TYPE_LABELS[it.item_type] ?? it.item_type}
                                </Badge>
                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                  {ORIGIN_LABELS[it.origin] ?? it.origin}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground tabular-nums flex-wrap">
                                <span>
                                  {it.quantity} x S/ {Number(it.unit_price).toFixed(2)} ={' '}
                                  <strong className="text-foreground">S/ {Number(it.subtotal).toFixed(2)}</strong> (sin IGV)
                                </span>
                                {lowStock && (
                                  <span className="text-[11px] text-warning font-medium">
                                    · Stock actual: {it.current_stock}
                                  </span>
                                )}
                              </div>
                            </div>

                            {canEditItems && (
                              <div className="flex items-center gap-1.5 flex-wrap shrink-0">
                                <Select
                                  value={selectedChannel}
                                  onValueChange={(val) =>
                                    setChannelByItem((prev) => ({ ...prev, [it.id]: val }))
                                  }
                                >
                                  <SelectTrigger className="h-7 w-28 text-xs" aria-label={`Canal para ${it.display_name}`}>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="presencial">Presencial</SelectItem>
                                    <SelectItem value="whatsapp">WhatsApp</SelectItem>
                                    <SelectItem value="telefono">Teléfono</SelectItem>
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  size="sm"
                                  disabled={submitting}
                                  onClick={() => handleDecision(it, 'aprobada')}
                                  className="h-7 text-xs gap-1 bg-success text-success-foreground hover:bg-success/90"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>Cliente aprobó</span>
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="destructive"
                                  disabled={submitting}
                                  onClick={() => handleDecision(it, 'rechazada')}
                                  className="h-7 text-xs gap-1"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>Rechazó</span>
                                </Button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 2. Aprobadas */}
                {approvedItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-success uppercase tracking-wider">
                      Aprobadas ({approvedItems.length})
                    </h4>
                    <div className="divide-y divide-border border border-success/30 rounded-lg bg-card">
                      {approvedItems.map((it) => (
                        <div key={it.id} className="p-2.5 flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-foreground">{it.display_name}</span>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                {TYPE_LABELS[it.item_type] ?? it.item_type}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-success/40 text-success bg-success/10">
                                {CHANNEL_LABELS[it.decision_channel] ?? 'Aprobada'}
                              </Badge>
                            </div>
                            <p className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                              {it.quantity} x S/ {Number(it.unit_price).toFixed(2)} (sin IGV)
                            </p>
                          </div>
                          <span className="font-semibold text-foreground tabular-nums shrink-0">
                            S/ {Number(it.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Rechazadas */}
                {rejectedItems.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Rechazadas ({rejectedItems.length})
                    </h4>
                    <div className="divide-y divide-border border border-border rounded-lg bg-muted/20">
                      {rejectedItems.map((it) => (
                        <div key={it.id} className="p-2.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="line-through">{it.display_name}</span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                {CHANNEL_LABELS[it.decision_channel] ?? 'Rechazada'}
                              </Badge>
                            </div>
                            <p className="text-[11px] tabular-nums mt-0.5">
                              {it.quantity} x S/ {Number(it.unit_price).toFixed(2)} (sin IGV)
                            </p>
                          </div>
                          <span className="tabular-nums shrink-0 line-through">
                            S/ {Number(it.subtotal).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end pt-2 border-t border-border shrink-0">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
