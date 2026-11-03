import { useState, useEffect, useCallback } from 'react';
import { useAudit } from '../hooks/useAudit';
import { useUsers } from '../hooks/useUsers';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { EmptyState } from '../components/ui/empty-state';
import { Skeleton } from '../components/ui/skeleton';
import {
  ShieldCheck,
  RefreshCw,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Calendar,
  User,
  ShieldAlert,
} from 'lucide-react';

const FIELD_LABELS = {
  sale_price: 'Precio venta',
  cost_price: 'Precio costo',
  stock: 'Stock',
  min_stock: 'Stock mínimo',
  name: 'Nombre',
  category: 'Categoría',
  compatible_models: 'Modelos compatibles',
  role: 'Rol',
  is_active: 'Estado activo',
  ruc: 'RUC',
  razon_social: 'Razón social',
  nombre_comercial: 'Nombre comercial',
  direccion: 'Dirección',
  telefono: 'Teléfono',
  email: 'Email',
  logo_data: 'Logo',
  igv_rate: 'Tasa IGV',
  approval_threshold: 'Umbral aprobación',
  not_picked_up_days: 'Días moto no recogida',
  void_reason: 'Motivo anulación',
  restored_stock: 'Stock restituido',
  password_reset: 'Contraseña temporal',
};

const ENTITY_CONFIG = {
  product: { label: 'Producto', className: 'border-blue-300 text-blue-700 bg-blue-50/50 dark:bg-blue-950 dark:text-blue-300' },
  sale: { label: 'Venta', className: 'border-purple-300 text-purple-700 bg-purple-50/50 dark:bg-purple-950 dark:text-purple-300' },
  invoice: { label: 'Comprobante', className: 'border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950 dark:text-emerald-300' },
  user: { label: 'Usuario', className: 'border-amber-300 text-amber-700 bg-amber-50/50 dark:bg-amber-950 dark:text-amber-300' },
  company: { label: 'Taller', className: 'border-cyan-300 text-cyan-700 bg-cyan-50/50 dark:bg-cyan-950 dark:text-cyan-300' },
};

const ACTION_CONFIG = {
  create: { label: 'Creación', className: 'border-emerald-300 text-emerald-700 bg-emerald-50/50' },
  update: { label: 'Modificación', className: 'border-blue-300 text-blue-700 bg-blue-50/50' },
  deactivate: { label: 'Desactivación', className: 'border-destructive/40 text-destructive bg-destructive/10' },
  reactivate: { label: 'Reactivación', className: 'border-emerald-400 text-emerald-800 bg-emerald-100/50' },
  void: { label: 'Anulación', className: 'border-rose-400 text-rose-800 bg-rose-50' },
  retry_contingency: { label: 'Reintento contingencia', className: 'border-indigo-300 text-indigo-700 bg-indigo-50' },
  role_change: { label: 'Cambio de rol', className: 'border-amber-400 text-amber-800 bg-amber-50' },
  password_reset: { label: 'Reinicio contraseña', className: 'border-orange-400 text-orange-800 bg-orange-50' },
  forced_negative_margin: { label: 'Margen forzado', className: 'border-amber-500 text-amber-900 bg-amber-100 font-semibold' },
};

function formatValue(key, val) {
  if (val === null || val === undefined) return '—';
  if (key === 'sale_price' || key === 'cost_price') {
    return `S/ ${Number(val).toFixed(2)}`;
  }
  if (key === 'igv_rate') {
    return `${(Number(val) * 100).toFixed(0)}%`;
  }
  if (key === 'approval_threshold') {
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

function DiffRenderer({ log }) {
  const { action, changes } = log;
  if (!changes || typeof changes !== 'object') {
    return <span className="text-xs text-muted-foreground">—</span>;
  }

  // Caso especial: Margen negativo forzado
  if (action === 'forced_negative_margin') {
    return (
      <div className="flex items-center gap-2 text-xs bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded px-2.5 py-1 text-amber-900 dark:text-amber-200">
        <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>
          Costo: <strong>S/ {Number(changes.cost_price || 0).toFixed(2)}</strong> | Venta: <strong>S/ {Number(changes.sale_price || 0).toFixed(2)}</strong> (Margen: <strong>S/ {Number(changes.margin || 0).toFixed(2)}</strong>)
        </span>
      </div>
    );
  }

  // Caso especial: Anulación de venta
  if (action === 'void') {
    return (
      <div className="space-y-1 text-xs">
        <p className="font-medium text-foreground">
          Motivo: <span className="text-muted-foreground">{changes.void_reason || 'Sin motivo especificado'}</span>
        </p>
        {Array.isArray(changes.restored_stock) && changes.restored_stock.length > 0 && (
          <p className="text-[11px] text-muted-foreground">
            Stock restituido: {changes.restored_stock.map((rs) => `Prod #${rs.product_id} (+${rs.quantity})`).join(', ')}
          </p>
        )}
      </div>
    );
  }

  // Caso especial: Reinicio de contraseña
  if (action === 'password_reset') {
    return (
      <span className="text-xs text-muted-foreground font-medium">
        Contraseña temporal generada y reseteada por administrador
      </span>
    );
  }

  // Diff general estructurado
  const entries = Object.entries(changes);
  if (entries.length === 0) {
    return <span className="text-xs text-muted-foreground">Sin diferencias detectadas</span>;
  }

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {entries.map(([field, diff]) => {
        const label = FIELD_LABELS[field] || field;
        const hasOldNew = diff && typeof diff === 'object' && ('old' in diff || 'new' in diff);

        return (
          <div key={field} className="flex items-center gap-1.5 py-0.5">
            <span className="font-medium text-muted-foreground">{label}:</span>
            {hasOldNew ? (
              <span className="inline-flex items-center gap-1 font-mono text-xs">
                <span className="line-through text-muted-foreground">
                  {formatValue(field, diff.old)}
                </span>
                <ArrowRight className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="font-semibold text-foreground">
                  {formatValue(field, diff.new)}
                </span>
              </span>
            ) : (
              <span className="font-mono font-medium text-foreground">
                {formatValue(field, diff)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AuditPage() {
  const { logs, loading, error, pagination, fetchLogs } = useAudit();
  const { users } = useUsers();

  const [entityFilter, setEntityFilter] = useState('all');
  const [userFilter, setUserFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);

  // Consultar logs al cambiar filtros o página
  const loadData = useCallback(() => {
    fetchLogs({
      entity: entityFilter !== 'all' ? entityFilter : undefined,
      user_id: userFilter !== 'all' ? userFilter : undefined,
      from: fromDate || undefined,
      to: toDate || undefined,
      page,
      limit: 20,
    });
  }, [entityFilter, userFilter, fromDate, toDate, page, fetchLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleClearFilters() {
    setEntityFilter('all');
    setUserFilter('all');
    setFromDate('');
    setToDate('');
    setPage(1);
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">Registro de Auditoría</h1>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Trazabilidad inmutable de operaciones sensibles, cambios de precios, roles y configuración (RF-09).
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Actualizar</span>
        </Button>
      </div>

      {/* ── Barra de Filtros ── */}
      <Card className="shadow-xs border-border">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            {/* Filtro Entidad */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5" />
                <span>Entidad</span>
              </label>
              <Select value={entityFilter} onValueChange={(val) => { setEntityFilter(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todas las entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas las entidades</SelectItem>
                  <SelectItem value="product">Repuestos (Inventario)</SelectItem>
                  <SelectItem value="sale">Ventas</SelectItem>
                  <SelectItem value="invoice">Comprobantes</SelectItem>
                  <SelectItem value="user">Usuarios</SelectItem>
                  <SelectItem value="company">Taller (Configuración)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Usuario */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Usuario responsable</span>
              </label>
              <Select value={userFilter} onValueChange={(val) => { setUserFilter(val); setPage(1); }}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Todos los usuarios" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los usuarios</SelectItem>
                  {users.map((u) => (
                    <SelectItem key={u.id} value={String(u.id)}>
                      {u.name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Fecha Desde */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Desde</span>
              </label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
                className="h-9 text-xs"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Hasta</span>
              </label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => { setToDate(e.target.value); setPage(1); }}
                className="h-9 text-xs"
              />
            </div>

            {/* Botón Limpiar */}
            <div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="h-9 w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpiar filtros</span>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── Mensaje de Error ── */}
      {error && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* ── Tabla de Auditoría ── */}
      <Card className="shadow-xs border-border overflow-hidden">
        <div className="relative w-full overflow-x-auto touch-pan-x">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Fecha y Hora</TableHead>
                <TableHead className="w-48">Usuario</TableHead>
                <TableHead className="w-32">Entidad</TableHead>
                <TableHead className="w-40">Acción</TableHead>
                <TableHead>Detalle de Cambios</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-36" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-60" /></TableCell>
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-12">
                    <EmptyState
                      icon={ShieldCheck}
                      title="No hay registros de auditoría"
                      description="No se encontraron eventos coincidentes con los filtros aplicados."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const ent = ENTITY_CONFIG[log.entity] || { label: log.entity, className: '' };
                  const act = ACTION_CONFIG[log.action] || { label: log.action, className: '' };
                  const dateStr = new Date(log.created_at).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <TableRow key={log.id} className="transition-colors duration-150">
                      {/* Fecha y Hora */}
                      <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                        {dateStr}
                      </TableCell>

                      {/* Usuario */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <div className="truncate">
                            <span className="font-medium text-xs text-foreground block truncate">
                              {log.user_name || 'Sistema'}
                            </span>
                            {log.user_email && (
                              <span className="text-[10px] text-muted-foreground block truncate">
                                {log.user_email}
                              </span>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Entidad */}
                      <TableCell>
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 font-normal ${ent.className}`}>
                          {ent.label} {log.entity_id ? `#${log.entity_id}` : ''}
                        </Badge>
                      </TableCell>

                      {/* Acción */}
                      <TableCell>
                        <Badge variant="outline" className={`text-xs px-2 py-0.5 ${act.className}`}>
                          {act.label}
                        </Badge>
                      </TableCell>

                      {/* Detalle estructurado */}
                      <TableCell>
                        <DiffRenderer log={log} />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* ── Paginación ── */}
        {!loading && logs.length > 0 && (
          <div className="p-4 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
            <div>
              Mostrando página <strong>{pagination.page}</strong> de <strong>{pagination.totalPages}</strong> ({pagination.total} registros totales)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="h-8 px-2.5 text-xs flex items-center gap-1"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Anterior</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="h-8 px-2.5 text-xs flex items-center gap-1"
              >
                <span>Siguiente</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
