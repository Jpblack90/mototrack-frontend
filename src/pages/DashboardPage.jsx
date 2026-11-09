import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  Package,
  Wrench,
  Receipt,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ArrowRight,
  Sparkles,
  Clock,
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
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { Button } from '../components/ui/button';
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
function buildKpiCards({ sales, inventory, workorders, pendingCount, notPickedUpCount = 0 }) {
  return [
    {
      key: 'ventas',
      label: 'Ventas de hoy',
      value: `S/ ${Number(sales?.total_revenue ?? 0).toFixed(2)}`,
      sub: `${sales?.total_sales_count ?? 0} transacciones`,
      icon: TrendingUp,
      iconClass: 'text-success',
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
      sub: notPickedUpCount > 0 ? `${notPickedUpCount} moto${notPickedUpCount > 1 ? 's' : ''} no recogida${notPickedUpCount > 1 ? 's' : ''}` : 'En progreso',
      icon: Wrench,
      iconClass: 'text-warning',
      badge: notPickedUpCount > 0 ? (
        <Badge variant="destructive" className="text-[10px] h-5 px-1.5">
          {notPickedUpCount} no recogida{notPickedUpCount > 1 ? 's' : ''}
        </Badge>
      ) : (
        <Badge variant="outline">En progreso</Badge>
      ),
    },
    {
      key: 'contingencia',
      label: 'Facturas en contingencia',
      value: pendingCount,
      sub: pendingCount > 0 ? 'Requieren reenvío' : 'Todo al día',
      icon: Receipt,
      iconClass: pendingCount > 0 ? 'text-destructive' : 'text-success',
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
  const { user } = useAuth();
  const { company } = useCompany();
  const {
    data,
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

  const notPickedUpCount = data?.workorders?.by_status?.find(
    (s) => s.status === 'no_recogido'
  )?.count ?? 0;

  const kpis = buildKpiCards({ sales, inventory, workorders, pendingCount, notPickedUpCount });

  // ─── Tarea 11.5: Verificación de Primeros Pasos ───
  const isAdmin = user?.role === 'admin';
  const isStep1Done = Boolean(company?.ruc);
  const isStep2Done = Number(data?.onboarding?.active_users_count ?? 1) > 1;
  const isStep3Done = Number(inventory?.total_active_products ?? data?.onboarding?.total_active_products ?? 0) >= 1;
  const isStep4Done = Number(data?.onboarding?.all_time_sales_count ?? 0) >= 1;

  const completedSteps = [isStep1Done, isStep2Done, isStep3Done, isStep4Done];
  const completedCount = completedSteps.filter(Boolean).length;
  const allCompleted = completedCount === 4;

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Resumen operativo y comercial de MotoTrack en tiempo real
        </p>
      </div>

      {/* ── Tarea 11.5: Tarjeta "Primeros Pasos" (Solo Admin) ── */}
      {isAdmin && !allCompleted && (
        <Card data-testid="primeros-pasos-card" className="border-primary/30 bg-primary/5 shadow-xs overflow-hidden">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle className="text-base font-semibold text-foreground">
                    Primeros pasos en tu taller
                  </CardTitle>
                  <CardDescription className="text-xs text-muted-foreground mt-0.5">
                    Completa la configuración inicial para aprovechar al máximo MotoTrack AI.
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="bg-background text-primary border-primary/30 text-xs px-2.5 py-1 font-semibold self-start sm:self-auto">
                {completedCount} de 4 completados
              </Badge>
            </div>
            {/* Barra de progreso */}
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-3">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${(completedCount / 4) * 100}%` }}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              {/* Paso 1: RUC y Logo */}
              <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors duration-150 ${isStep1Done ? 'bg-background/60 border-border/60 text-muted-foreground' : 'bg-background border-border text-foreground font-medium'}`}>
                <div className="flex items-center gap-2.5">
                  {isStep1Done ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={isStep1Done ? 'line-through text-muted-foreground' : ''}>
                    Configura el RUC y el logo de tu taller
                  </span>
                </div>
                {!isStep1Done && (
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary hover:text-primary">
                    <Link to="/settings" className="flex items-center gap-1">
                      <span>Configurar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Paso 2: Equipo */}
              <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors duration-150 ${isStep2Done ? 'bg-background/60 border-border/60 text-muted-foreground' : 'bg-background border-border text-foreground font-medium'}`}>
                <div className="flex items-center gap-2.5">
                  {isStep2Done ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={isStep2Done ? 'line-through text-muted-foreground' : ''}>
                    Agrega a tu equipo de trabajo
                  </span>
                </div>
                {!isStep2Done && (
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary hover:text-primary">
                    <Link to="/users" className="flex items-center gap-1">
                      <span>Agregar</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Paso 3: Primer repuesto */}
              <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors duration-150 ${isStep3Done ? 'bg-background/60 border-border/60 text-muted-foreground' : 'bg-background border-border text-foreground font-medium'}`}>
                <div className="flex items-center gap-2.5">
                  {isStep3Done ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={isStep3Done ? 'line-through text-muted-foreground' : ''}>
                    Registra tu primer repuesto en inventario
                  </span>
                </div>
                {!isStep3Done && (
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary hover:text-primary">
                    <Link to="/inventory" className="flex items-center gap-1">
                      <span>Inventario</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </div>

              {/* Paso 4: Primera venta */}
              <div className={`flex items-center justify-between p-3 rounded-lg border text-xs transition-colors duration-150 ${isStep4Done ? 'bg-background/60 border-border/60 text-muted-foreground' : 'bg-background border-border text-foreground font-medium'}`}>
                <div className="flex items-center gap-2.5">
                  {isStep4Done ? (
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={isStep4Done ? 'line-through text-muted-foreground' : ''}>
                    Realiza tu primera venta en el mostrador
                  </span>
                </div>
                {!isStep4Done && (
                  <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary hover:text-primary">
                    <Link to="/sales" className="flex items-center gap-1">
                      <span>Vender</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Aviso de Motos No Recogidas (RF-17) ── */}
      {notPickedUpCount > 0 && ['admin', 'cajero'].includes(user?.role) && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 bg-destructive/10 border border-destructive/20 rounded-xl text-xs text-foreground">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-destructive shrink-0" />
            <span>
              Atención: hay <strong className="text-destructive font-semibold">{notPickedUpCount} moto{notPickedUpCount > 1 ? 's' : ''} no recogida{notPickedUpCount > 1 ? 's' : ''}</strong> que ha{notPickedUpCount > 1 ? 'n' : ''} superado el plazo de entrega.
            </span>
          </div>
          <Button asChild size="sm" variant="outline" className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10 self-start sm:self-auto">
            <Link to="/workorders?status=no_recogido" className="flex items-center gap-1.5">
              <span>Ver órdenes</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </Button>
        </div>
      )}

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
                  El endpoint actual <code className="font-mono text-primary bg-primary/10 px-1 py-0.5 rounded text-[11px]">/api/dashboard</code> retorna un total acumulado general (S/ {Number(sales?.total_revenue ?? 0).toFixed(2)} en {sales?.total_sales_count ?? 0} transacciones), pero no expone un desglose temporal por intervalos. El gráfico queda preparado para renderizarse en cuanto se añada la serie en el backend.
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
            <AlertTriangle className="w-5 h-5 text-warning" />
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
                    badgeVariant = 'warning';
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
