import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Building2,
  CalendarPlus,
  Coins,
  RefreshCw,
  ScanLine,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { usePlatformMetrics } from '../../hooks/usePlatformMetrics';
import { usePlatformAudit } from '../../hooks/usePlatformAudit';
import {
  formatPen,
  getCompanyStatusMeta,
  getPlatformAuditActionMeta,
} from '../../lib/platformStatus';
import { formatDateTime } from '../../lib/dates';

const STATUS_ORDER = ['active', 'trial', 'grace', 'suspended', 'inactive'];

/**
 * Pantalla 1: Resumen general de talleres, ingresos estimados, uso IA y altas recientes.
 */
export default function PlatformSummaryPage() {
  const { metrics, loading, error, refresh } = usePlatformMetrics();
  const { logs, loading: auditLoading, refresh: refreshAudit } = usePlatformAudit({ limit: 5 });
  const navigate = useNavigate();

  const handleRefreshAll = () => {
    refresh();
    refreshAudit();
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-9 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
          <Skeleton className="h-32 rounded-xl" />
        </div>
        <Skeleton className="h-44 rounded-xl" />
      </div>
    );
  }

  if (error && !metrics) {
    return (
      <Card>
        <CardContent className="py-10 text-center space-y-3">
          <p className="text-sm font-medium text-destructive">{error.message}</p>
          <Button variant="outline" size="sm" onClick={handleRefreshAll}>
            <RefreshCw className="w-4 h-4" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  const byStatus = metrics?.by_status || {};

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">
            Resumen de plataforma
          </h1>
          <p className="text-sm text-muted-foreground">
            Estado operativo de talleres, suscripciones y consumo mensual de IA
            {metrics?.period?.month ? ` · Periodo ${metrics.period.month}` : ''}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshAll} disabled={loading}>
            <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
            Actualizar
          </Button>
          <Button size="sm" asChild>
            <Link to="/plataforma/talleres">
              Ver talleres
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">
                Ingreso mensual estimado
              </CardDescription>
              <div className="w-8 h-8 rounded-lg bg-success/10 text-success flex items-center justify-center">
                <Coins className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
              {formatPen(metrics?.estimated_monthly_revenue_pen)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Calculado según los planes de {byStatus.active ?? 0} taller(es) con suscripción activa.
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">Escaneos IA del mes</CardDescription>
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <ScanLine className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
              {(metrics?.ai_scans_this_month ?? 0).toLocaleString('es-PE')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Identificaciones exitosas de repuestos registradas en el mes actual (hora Lima).
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardDescription className="text-xs font-medium">
                Registros últimos 30 días
              </CardDescription>
              <div className="w-8 h-8 rounded-lg bg-info/10 text-info flex items-center justify-center">
                <CalendarPlus className="w-4 h-4" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground">
              {(metrics?.new_companies_last_30_days ?? 0).toLocaleString('es-PE')}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground">
            Total acumulado en plataforma: {metrics?.total_companies ?? 0} taller(es).
          </CardContent>
        </Card>
      </div>

      {/* Talleres por estado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Talleres por estado
              </CardTitle>
              <CardDescription className="text-xs">
                Haz clic en cualquier estado para filtrar la cartera de talleres.
              </CardDescription>
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              Total: <strong className="text-foreground">{metrics?.total_companies ?? 0}</strong>
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STATUS_ORDER.map((statusKey) => {
              const meta = getCompanyStatusMeta(statusKey);
              const count = byStatus[statusKey] ?? 0;
              return (
                <button
                  key={statusKey}
                  type="button"
                  onClick={() => navigate(`/plataforma/talleres?status=${statusKey}`)}
                  className="text-left p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/60 transition-colors duration-150 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Badge variant={meta.variant}>{meta.label}</Badge>
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <p className="text-2xl font-bold tabular-nums text-foreground">{count}</p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actividad reciente de soporte */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">Actividad reciente de soporte</CardTitle>
          <CardDescription className="text-xs">
            Últimos eventos administrativos registrados en la auditoría inmutable de plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {auditLoading && logs.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : logs.length === 0 ? (
            <p className="text-xs text-muted-foreground py-4 text-center">
              Aún no hay acciones de soporte registradas.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {logs.map((entry) => {
                const actionMeta = getPlatformAuditActionMeta(entry.action);
                return (
                  <div
                    key={entry.id}
                    className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Badge variant={actionMeta.variant}>{actionMeta.label}</Badge>
                      <span className="font-medium text-foreground truncate">
                        {entry.target_company_name || 'Plataforma'}
                      </span>
                      <span className="text-muted-foreground truncate">
                        {entry.details?.summary || entry.details?.reason || ''}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-muted-foreground shrink-0">
                      <span>{entry.platform_admin_name || entry.platform_admin_email || '—'}</span>
                      <span className="tabular-nums">{formatDateTime(entry.created_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
