import { useEffect } from 'react';
import {
  TrendingUp,
  Package,
  Wrench,
  Receipt,
  AlertTriangle,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts';

import { useDashboard } from '../hooks/useDashboard';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../components/ui/card';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '../components/ui/chart';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';

// ─── Configuración del gráfico de ventas (Tarea 1 y Tarea 4) ─────────────────
const chartConfig = {
  ventas: {
    label: 'Ventas',
    color: 'var(--color-ventas)', // Vinculado a --chart-1 vía index.css
  },
};

// ─── Metadata de tarjetas KPI (Tarea 3) ──────────────────────────────────────
function buildKpiCards({ sales, inventory, workorders, pendingCount }) {
  return [
    {
      key: 'ventas',
      label: 'Ventas de hoy',
      value: `S/ ${Number(sales?.total_revenue ?? 0).toFixed(2)}`,
      sub: `${sales?.total_sales_count ?? 0} transacciones`,
      icon: TrendingUp,
      iconClass: 'text-emerald-600',
    },
    {
      key: 'inventario',
      label: 'Valor de inventario',
      value: `S/ ${Number(inventory?.total_inventory_value ?? 0).toFixed(2)}`,
      sub: `${inventory?.total_active_products ?? 0} productos activos`,
      icon: Package,
      iconClass: 'text-primary',
    },
    {
      key: 'ordenes',
      label: 'Órdenes activas',
      value: workorders?.active_count ?? 0,
      sub: 'En progreso',
      icon: Wrench,
      iconClass: 'text-amber-500',
      badge: <Badge variant="outline">En progreso</Badge>,
    },
    {
      key: 'contingencia',
      label: 'Facturas en contingencia',
      value: pendingCount,
      sub: pendingCount > 0 ? 'Requieren reenvío' : 'Todo al día',
      icon: Receipt,
      iconClass: pendingCount > 0 ? 'text-destructive' : 'text-emerald-600',
      badge: (
        <Badge variant={pendingCount > 0 ? 'destructive' : 'secondary'}>
          {pendingCount > 0 ? 'Requieren reenvío' : 'Al día'}
        </Badge>
      ),
    },
  ];
}

// ─── Skeletons para estado de carga (Tarea 6) ────────────────────────────────
function DashboardLoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>

      {/* Skeletons de KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent className="space-y-2">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Skeleton de Gráfico */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-48 w-full rounded-lg" />
        </CardContent>
      </Card>

      {/* Skeleton de Tabla */}
      <Card>
        <CardHeader className="space-y-2">
          <Skeleton className="h-5 w-52" />
          <Skeleton className="h-4 w-60" />
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

// ─── Componente Principal ───────────────────────────────────────────────────
export default function DashboardPage() {
  const {
    loading,
    error,
    fetchDashboard,
    sales,
    inventory,
    workorders,
    pendingCount,
    lowStock,
    salesTimeSeries,
  } = useDashboard();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  if (loading) {
    return <DashboardLoadingSkeleton />;
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
        {error}
      </div>
    );
  }

  const kpis = buildKpiCards({ sales, inventory, workorders, pendingCount });

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen operativo y comercial de MotoTrack en tiempo real
        </p>
      </div>

      {/* ── Tarea 3: Tarjetas KPI con Card de shadcn ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.key} className="transition-colors duration-150">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {kpi.label}
                </CardTitle>
                <Icon className={`w-4 h-4 ${kpi.iconClass}`} />
              </CardHeader>
              <CardContent className="space-y-1">
                <div className="text-2xl font-bold text-foreground tracking-tight">
                  {kpi.value}
                </div>
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>{kpi.sub}</span>
                  {kpi.badge}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* ── Tarea 4: Gráfico de Tendencia de Ventas ── */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold text-foreground">
            Tendencia de Ventas
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {salesTimeSeries
              ? 'Ingresos acumulados en el período analizado'
              : 'Visualización de ventas según el período expuesto por el backend'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {salesTimeSeries && salesTimeSeries.length > 0 ? (
            /* Se activa automáticamente si el backend provee la serie temporal */
            <ChartContainer config={chartConfig} className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesTimeSeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <YAxis tick={{ fontSize: 12 }} stroke="var(--muted-foreground)" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="ventas" fill="var(--color-ventas)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            /* Limitación de API: se reporta sin inventar números */
            <div className="h-48 flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20">
              <div className="text-center space-y-1.5 p-4 max-w-lg">
                <TrendingUp className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-foreground">
                  Limitación de API: Serie temporal no disponible
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  El endpoint actual <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-[11px]">/api/dashboard</code> retorna un total acumulado general (S/ {Number(sales?.total_revenue ?? 0).toFixed(2)} en {sales?.total_sales_count ?? 0} ventas), pero no expone un desglose temporal por intervalos. El gráfico queda preparado para renderizarse en cuanto se añada la serie en el backend.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Tarea 5: Tabla de Stock Bajo con Table y Badges de shadcn ── */}
      {lowStock.length > 0 && (
        <Card>
          <CardHeader className="pb-3 flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <CardTitle className="text-base font-semibold text-foreground">
                Productos con Stock Bajo ({lowStock.length})
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground">
                Artículos que se encuentran en o por debajo del stock mínimo requerido
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead className="text-right">Stock Actual</TableHead>
                  <TableHead className="text-right">Stock Mínimo</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {lowStock.map((p) => {
                  let badgeVariant = 'outline';
                  let badgeLabel = 'Bajo stock';
                  let badgeClass = '';

                  if (p.stock === 0) {
                    badgeVariant = 'destructive';
                    badgeLabel = 'Sin stock';
                  } else if (p.stock <= (p.min_stock || 1) / 2) {
                    badgeClass = 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-200';
                    badgeLabel = 'Crítico';
                  }

                  return (
                    <TableRow key={p.id} className="transition-colors duration-150">
                      <TableCell className="font-medium text-foreground">
                        {p.name}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold">
                        {p.stock}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {p.min_stock}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={badgeVariant} className={badgeClass}>
                          {badgeLabel}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
