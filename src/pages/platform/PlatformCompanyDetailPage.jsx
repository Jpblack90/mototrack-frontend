import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  CreditCard,
  History,
  KeyRound,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
import RecordPaymentDialog from '../../components/platform/RecordPaymentDialog';
import CompanyStatusDialog from '../../components/platform/CompanyStatusDialog';
import ResetPasswordDialog from '../../components/platform/ResetPasswordDialog';
import { usePlatformCompany } from '../../hooks/usePlatformCompany';
import { usePlatformActions } from '../../hooks/usePlatformActions';
import { usePlatformAudit } from '../../hooks/usePlatformAudit';
import { ROLE_LABELS } from '../../lib/roles';
import { formatDate, formatDateTime, formatDatesInText } from '../../lib/dates';
import {
  formatCompanyExpiration,
  formatPen,
  formatQuota,
  getCompanyStatusMeta,
  getPaymentMethodLabel,
  getPlatformAuditActionMeta,
} from '../../lib/platformStatus';

/**
 * Pantalla 3: Detalle operativo del taller (suscripción, pagos, usuarios, conteos y auditoría).
 */
export default function PlatformCompanyDetailPage() {
  const { id } = useParams();
  const { company, loading, error, refresh } = usePlatformCompany(id);
  const { submitting, recordPayment, setStatus, resetPassword } = usePlatformActions();

  const [auditPage, setAuditPage] = useState(1);
  const {
    logs: auditLogs,
    pagination: auditPagination,
    loading: auditLoading,
    refresh: refreshAudit,
  } = usePlatformAudit({
    company_id: id,
    page: auditPage,
    limit: 10,
    enabled: Boolean(id),
  });

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [statusDialogState, setStatusDialogState] = useState({ open: false, targetActive: false });
  const [userToReset, setUserToReset] = useState(null);

  const handleActionSuccess = () => {
    refresh();
    refreshAudit();
  };

  if (loading && !company) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Skeleton className="h-36 rounded-xl lg:col-span-2" />
          <Skeleton className="h-36 rounded-xl" />
        </div>
        <Skeleton className="h-56 rounded-xl" />
      </div>
    );
  }

  if (error && !company) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/plataforma/talleres">
            <ArrowLeft className="w-4 h-4" />
            Volver a talleres
          </Link>
        </Button>
        <Card>
          <CardContent className="py-10 text-center space-y-3">
            <p className="text-sm font-medium text-destructive">{error.message}</p>
            <Button variant="outline" size="sm" onClick={refresh}>
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMeta = getCompanyStatusMeta(company?.subscription_status);
  const expiration = formatCompanyExpiration(company);
  const monthlyCounts = company?.monthly_counts || {};
  const users = company?.users || [];
  const payments = company?.payments || [];

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-2 text-muted-foreground">
          <Link to="/plataforma/talleres">
            <ArrowLeft className="w-4 h-4" />
            Volver a talleres
          </Link>
        </Button>

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-xl font-semibold text-foreground tracking-tight">
                {company.nombre_comercial || company.razon_social}
              </h1>
              <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
              {company.plan && (
                <Badge variant="outline">
                  {company.plan.name} · {formatPen(company.plan.price_pen)}/mes
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {company.razon_social} · RUC {company.ruc || '—'} · Alta el{' '}
              {formatDate(company.created_at)}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleActionSuccess} disabled={loading}>
              <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
              Actualizar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setPaymentDialogOpen(true)}
            >
              <CreditCard className="w-4 h-4" />
              Registrar pago
            </Button>
            {company.is_active ? (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => setStatusDialogState({ open: true, targetActive: false })}
              >
                <ShieldAlert className="w-4 h-4" />
                Suspender
              </Button>
            ) : (
              <Button
                size="sm"
                variant="default"
                onClick={() => setStatusDialogState({ open: true, targetActive: true })}
              >
                <ShieldCheck className="w-4 h-4" />
                Reactivar
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Suscripción + conteos del mes (solo números) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              Suscripción y uso del mes
            </CardTitle>
            <CardDescription className="text-xs">
              Datos operativos de la cuenta sin acceso a registros internos del negocio.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">Vencimiento</dt>
                <dd className="font-semibold text-foreground tabular-nums mt-0.5">
                  {expiration.dateLabel}
                </dd>
                {expiration.detailLabel && (
                  <p className="text-[11px] text-muted-foreground">{expiration.detailLabel}</p>
                )}
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Usuarios activos</dt>
                <dd className="font-semibold text-foreground tabular-nums mt-0.5">
                  {formatQuota(company.users_active, company.max_users)}
                </dd>
                <p className="text-[11px] text-muted-foreground">Cupo del plan</p>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Escaneos IA (mes)</dt>
                <dd className="font-semibold text-foreground tabular-nums mt-0.5">
                  {formatQuota(company.ai_scans_this_month, company.max_ai_scans_month)}
                </dd>
                <p className="text-[11px] text-muted-foreground">Uso / cupo</p>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Último login</dt>
                <dd className="font-semibold text-foreground tabular-nums text-xs mt-1">
                  {company.last_user_login_at
                    ? formatDateTime(company.last_user_login_at)
                    : 'Sin ingresos'}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Conteos del mes</CardTitle>
            <CardDescription className="text-xs">
              Solo totales numéricos agregados (sin detalle comercial).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Comprobantes emitidos</span>
              <span className="font-semibold tabular-nums text-foreground">
                {monthlyCounts.invoices_issued ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Órdenes de trabajo</span>
              <span className="font-semibold tabular-nums text-foreground">
                {monthlyCounts.work_orders_created ?? 0}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Productos activos</span>
              <span className="font-semibold tabular-nums text-foreground">
                {monthlyCounts.active_products_count ?? 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Usuarios del taller */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Usuarios del taller ({users.length})
          </CardTitle>
          <CardDescription className="text-xs">
            Soporte puede restablecer contraseñas para desbloquear accesos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <EmptyState
              compact
              icon={Users}
              title="Sin usuarios registrados"
              description="Este taller no tiene usuarios asociados."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead className="text-right">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-foreground">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ROLE_LABELS[user.role] || user.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={user.is_active ? 'success' : 'secondary'}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {user.must_change_password && (
                          <Badge variant="warning">Cambio pendiente</Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground tabular-nums">
                      {user.last_login_at ? formatDateTime(user.last_login_at) : 'Nunca'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setUserToReset(user)}
                      >
                        <KeyRound className="w-3.5 h-3.5" />
                        Restablecer contraseña
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Historial de pagos */}
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" />
              Historial de pagos ({payments.length})
            </CardTitle>
            <CardDescription className="text-xs">
              Pagos de suscripción registrados manualmente por soporte.
            </CardDescription>
          </div>
          <Button size="xs" variant="outline" onClick={() => setPaymentDialogOpen(true)}>
            + Registrar pago
          </Button>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <EmptyState
              compact
              icon={CreditCard}
              title="Sin pagos registrados"
              description="Cuando el taller realice su primer pago, aparecerá aquí con el periodo cubierto."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Periodo cubierto</TableHead>
                  <TableHead>Meses</TableHead>
                  <TableHead>Método</TableHead>
                  <TableHead>Referencia / notas</TableHead>
                  <TableHead className="text-right">Monto</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="text-xs tabular-nums text-muted-foreground">
                      {formatDateTime(payment.created_at)}
                    </TableCell>
                    <TableCell className="text-xs tabular-nums text-foreground">
                      {formatDate(payment.period_from)} → {formatDate(payment.period_to)}
                    </TableCell>
                    <TableCell className="tabular-nums">{payment.months}</TableCell>
                    <TableCell>{getPaymentMethodLabel(payment.method)}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {[payment.reference, payment.notes].filter(Boolean).join(' · ') || '—'}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums text-foreground">
                      {formatPen(payment.amount)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Actividad de soporte (platform_audit_logs) */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <History className="w-4 h-4 text-primary" />
            Actividad de soporte
          </CardTitle>
          <CardDescription className="text-xs">
            Registro inmutable de acciones ejecutadas sobre este taller desde el panel de plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {auditLoading && auditLogs.length === 0 ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : auditLogs.length === 0 ? (
            <EmptyState
              compact
              icon={History}
              title="Sin actividad de soporte"
              description="No hay acciones administrativas registradas todavía para este taller."
            />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Soporte</TableHead>
                    <TableHead>Detalle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.map((log) => {
                    const actionMeta = getPlatformAuditActionMeta(log.action);
                    const detailText = formatDatesInText(
                      log.details?.summary || log.details?.reason || '—'
                    );
                    return (
                      <TableRow key={log.id}>
                        <TableCell className="text-xs text-muted-foreground tabular-nums">
                          {formatDateTime(log.created_at)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={actionMeta.variant}>{actionMeta.label}</Badge>
                        </TableCell>
                        <TableCell className="text-xs text-foreground">
                          {log.platform_admin_name || log.platform_admin_email || '—'}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground whitespace-normal">
                          {detailText}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {auditPagination.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span>
                    Página {auditPagination.page} de {auditPagination.totalPages} (
                    {auditPagination.total} evento(s))
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={auditPage <= 1 || auditLoading}
                      onClick={() => setAuditPage((p) => Math.max(1, p - 1))}
                    >
                      Anterior
                    </Button>
                    <Button
                      size="xs"
                      variant="outline"
                      disabled={auditPage >= auditPagination.totalPages || auditLoading}
                      onClick={() => setAuditPage((p) => p + 1)}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modales administrativos */}
      <RecordPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        company={company}
        submitting={submitting}
        onSubmit={recordPayment}
        onSuccess={handleActionSuccess}
      />

      <CompanyStatusDialog
        open={statusDialogState.open}
        onOpenChange={(open) => setStatusDialogState((prev) => ({ ...prev, open }))}
        company={company}
        targetActive={statusDialogState.targetActive}
        submitting={submitting}
        onSubmit={setStatus}
        onSuccess={handleActionSuccess}
      />

      <ResetPasswordDialog
        user={userToReset}
        companyId={company.id}
        onClose={() => setUserToReset(null)}
        submitting={submitting}
        onConfirmReset={resetPassword}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
