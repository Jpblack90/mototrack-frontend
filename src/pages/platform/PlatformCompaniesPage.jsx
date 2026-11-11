import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Building2, ChevronRight, RefreshCw, Search } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Skeleton } from '../../components/ui/skeleton';
import { EmptyState } from '../../components/ui/empty-state';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../../components/ui/table';
import { usePlatformCompanies } from '../../hooks/usePlatformCompanies';
import {
  STATUS_FILTER_OPTIONS,
  formatCompanyExpiration,
  formatQuota,
  getCompanyStatusMeta,
} from '../../lib/platformStatus';
import { formatDateTime } from '../../lib/dates';

const VALID_STATUS_VALUES = new Set(STATUS_FILTER_OPTIONS.map((item) => item.value));

/**
 * Pantalla 2: Listado de talleres con buscador, filtro por estado y navegación al detalle.
 */
export default function PlatformCompaniesPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const rawStatus = searchParams.get('status') || 'all';
  const statusFilter = VALID_STATUS_VALUES.has(rawStatus) ? rawStatus : 'all';
  const urlSearch = searchParams.get('search') || '';

  const [draftSearch, setDraftSearch] = useState(null);
  const debounceTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const searchValue = draftSearch !== null ? draftSearch : urlSearch;

  const handleSearchChange = (value) => {
    setDraftSearch(value);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      const trimmed = value.trim();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (trimmed) {
            next.set('search', trimmed);
          } else {
            next.delete('search');
          }
          return next;
        },
        { replace: true }
      );
      setDraftSearch(null);
    }, 300);
  };

  const handleStatusChange = (nextStatus) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (nextStatus && nextStatus !== 'all') {
          next.set('status', nextStatus);
        } else {
          next.delete('status');
        }
        return next;
      },
      { replace: true }
    );
  };

  const handleResetFilters = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    setDraftSearch(null);
    setSearchParams({}, { replace: true });
  };

  const { companies, loading, error, refresh } = usePlatformCompanies({
    status: statusFilter,
    search: urlSearch,
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground tracking-tight">Talleres</h1>
          <p className="text-sm text-muted-foreground">
            Supervisión de suscripciones, cupos de usuarios y escaneos IA por taller.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
          <RefreshCw className={loading ? 'w-4 h-4 animate-spin' : 'w-4 h-4'} />
          Actualizar
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base font-semibold">Cartera de talleres</CardTitle>
              <CardDescription className="text-xs">
                {loading
                  ? 'Consultando talleres...'
                  : `${companies.length} taller(es) encontrado(s). Haz clic en una fila para ver el detalle.`}
              </CardDescription>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative w-full sm:w-72">
                <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <Input
                  value={searchValue}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Buscar razón social, nombre o RUC"
                  className="pl-9"
                  aria-label="Buscar talleres"
                />
              </div>

              <div className="w-full sm:w-48">
                <Select value={statusFilter} onValueChange={handleStatusChange}>
                  <SelectTrigger aria-label="Filtrar por estado">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_FILTER_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {error ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-sm font-medium text-destructive">{error.message}</p>
              <Button variant="outline" size="sm" onClick={refresh}>
                Reintentar
              </Button>
            </div>
          ) : loading && companies.length === 0 ? (
            <div className="space-y-2.5">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : companies.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="Sin talleres para mostrar"
              description={
                statusFilter !== 'all' || urlSearch
                  ? 'Prueba ajustando el filtro de estado o el texto de búsqueda.'
                  : 'Todavía no hay talleres registrados en MotoTrack.'
              }
              action={
                (statusFilter !== 'all' || urlSearch) && (
                  <Button variant="outline" size="sm" onClick={handleResetFilters}>
                    Limpiar filtros
                  </Button>
                )
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Taller</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Usuarios</TableHead>
                  <TableHead>Escaneos IA</TableHead>
                  <TableHead>Vencimiento</TableHead>
                  <TableHead>Último login</TableHead>
                  <TableHead className="w-8 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {companies.map((company) => {
                  const statusMeta = getCompanyStatusMeta(company.subscription_status);
                  const expiration = formatCompanyExpiration(company);

                  return (
                    <TableRow
                      key={company.id}
                      onClick={() => navigate(`/plataforma/talleres/${company.id}`)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-foreground">
                            {company.nombre_comercial || company.razon_social}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {company.razon_social} · RUC {company.ruc || '—'} ·{' '}
                            {company.plan?.name || 'Sin plan'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>
                      </TableCell>
                      <TableCell className="tabular-nums text-foreground">
                        {formatQuota(company.users_active, company.max_users)}
                      </TableCell>
                      <TableCell className="tabular-nums text-foreground">
                        {formatQuota(company.ai_scans_this_month, company.max_ai_scans_month)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-foreground tabular-nums">
                            {expiration.dateLabel}
                          </span>
                          {expiration.detailLabel && (
                            <span className="text-[11px] text-muted-foreground">
                              {expiration.detailLabel}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground tabular-nums">
                        {company.last_user_login_at
                          ? formatDateTime(company.last_user_login_at)
                          : 'Sin ingresos'}
                      </TableCell>
                      <TableCell className="text-right">
                        <ChevronRight className="w-4 h-4 text-muted-foreground inline-block" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
