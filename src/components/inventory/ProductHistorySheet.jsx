import { useState, useEffect } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '../ui/sheet';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { useAudit } from '../../hooks/useAudit';
import { History, User, Calendar, ArrowRight, ShieldAlert } from 'lucide-react';

const FIELD_LABELS = {
  sale_price: 'Precio venta',
  cost_price: 'Precio costo',
  stock: 'Stock',
  min_stock: 'Stock mínimo',
  name: 'Nombre',
  category: 'Categoría',
  compatible_models: 'Modelos compatibles',
  is_active: 'Estado activo',
};

const ACTION_LABELS = {
  create: { label: 'Creación', variant: 'outline', color: 'border-success/30 text-success bg-success/10' },
  update: { label: 'Modificación', variant: 'outline', color: 'border-info/30 text-info bg-info/10' },
  deactivate: { label: 'Desactivado', variant: 'destructive', color: '' },
  forced_negative_margin: { label: 'Margen forzado', variant: 'warning', color: '' },
};

function formatValue(key, val) {
  if (val === null || val === undefined) return '—';
  if (key === 'sale_price' || key === 'cost_price') {
    return `S/ ${Number(val).toFixed(2)}`;
  }
  if (key === 'compatible_models' && Array.isArray(val)) {
    return val.length > 0 ? val.join(', ') : 'Ninguno';
  }
  if (typeof val === 'boolean') {
    return val ? 'Sí / Activo' : 'No / Inactivo';
  }
  return String(val);
}

export default function ProductHistorySheet({ open, onClose, product }) {
  const { fetchEntityHistory } = useAudit();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && product?.id) {
      const t = setTimeout(() => {
        setLoading(true);
        fetchEntityHistory('product', product.id).then((res) => {
          if (res.ok) {
            setLogs(res.logs || []);
          }
          setLoading(false);
        });
      }, 0);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => {
        setLogs([]);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [open, product?.id, fetchEntityHistory]);

  return (
    <Sheet open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border">
          <div className="flex items-center gap-2 text-primary">
            <History className="w-5 h-5" />
            <SheetTitle className="text-base font-semibold">Historial del Producto</SheetTitle>
          </div>
          <SheetDescription className="text-xs text-muted-foreground mt-1">
            Registro inmutable de modificaciones para <strong className="text-foreground">{product?.name}</strong> (SKU: {product?.sku || 'S/N'}).
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="p-4 border rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-28" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground space-y-2">
              <History className="w-10 h-10 mx-auto opacity-30" />
              <p className="text-sm font-medium">Sin modificaciones registradas</p>
              <p className="text-xs text-muted-foreground/80">
                Los cambios futuros aparecerán automáticamente aquí.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
              {logs.map((log) => {
                const actionInfo = ACTION_LABELS[log.action] || {
                  label: log.action,
                  variant: 'outline',
                  color: '',
                };
                const changes = log.changes || {};
                const dateStr = new Date(log.created_at).toLocaleString('es-PE', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div key={log.id} className="relative group">
                    {/* Punto del timeline */}
                    <div className="absolute -left-[27px] top-1.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />

                    <div className="bg-card border border-border rounded-lg p-3.5 shadow-xs space-y-2.5">
                      {/* Cabecera del log */}
                      <div className="flex items-center justify-between gap-2">
                        <Badge
                          variant={actionInfo.variant}
                          className={`text-xs px-2 py-0.5 ${actionInfo.color}`}
                        >
                          {actionInfo.label}
                        </Badge>
                        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{dateStr}</span>
                        </div>
                      </div>

                      {/* Usuario responsable */}
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <User className="w-3.5 h-3.5" />
                        <span>Responsable: <strong className="text-foreground">{log.user_name || 'Sistema'}</strong></span>
                      </div>

                      {/* Diff de campos modificados */}
                      {log.action === 'forced_negative_margin' ? (
                        <div className="text-xs bg-warning/10 border border-warning/30 rounded p-2 text-warning flex items-start gap-1.5">
                          <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                          <div>
                            <p className="font-semibold">Margen negativo autorizado</p>
                            <p className="text-[11px] mt-0.5">
                              Costo: S/ {Number(changes.cost_price || 0).toFixed(2)} | Venta: S/ {Number(changes.sale_price || 0).toFixed(2)} (Margen: S/ {Number(changes.margin || 0).toFixed(2)})
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1.5 pt-1 border-t border-border/50 text-xs">
                          {Object.entries(changes).map(([field, diff]) => {
                            const label = FIELD_LABELS[field] || field;
                            const hasOldNew = diff && typeof diff === 'object' && ('old' in diff || 'new' in diff);

                            return (
                              <div key={field} className="flex flex-col gap-0.5">
                                <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                                  {label}
                                </span>
                                {hasOldNew ? (
                                  <div className="flex items-center gap-2 font-mono text-xs">
                                    <span className="line-through text-muted-foreground">
                                      {formatValue(field, diff.old)}
                                    </span>
                                    <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                    <span className="font-semibold text-foreground">
                                      {formatValue(field, diff.new)}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-xs font-mono text-foreground">
                                    {formatValue(field, diff)}
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
