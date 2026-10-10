import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useInvoicing } from '../hooks/useInvoicing';
import InvoiceModal from '../components/invoicing/InvoiceModal';
import TicketView from '../components/invoicing/TicketView';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Skeleton } from '../components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../components/ui/tooltip';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import {
  FileText,
  Receipt,
  RotateCw,
  Eye,
  FileCheck2,
} from 'lucide-react';

const ESTADO_META = {
  aceptado: {
    label: 'Aceptado',
    variant: 'outline',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  accepted: {
    label: 'Aceptado',
    variant: 'outline',
    badgeClass: 'text-emerald-700 bg-emerald-50 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  },
  contingencia: {
    label: 'Contingencia',
    variant: 'outline',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  contingency: {
    label: 'Contingencia',
    variant: 'outline',
    badgeClass: 'text-amber-800 bg-amber-50 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  },
  rechazado: {
    label: 'Rechazado',
    variant: 'destructive',
    badgeClass: '',
  },
  rejected: {
    label: 'Rechazado',
    variant: 'destructive',
    badgeClass: '',
  },
  pendiente: {
    label: 'Pendiente',
    variant: 'secondary',
    badgeClass: '',
  },
  pending: {
    label: 'Pendiente',
    variant: 'secondary',
    badgeClass: '',
  },
};

export default function InvoicingPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [searchParams] = useSearchParams();

  const {
    invoices,
    uninvoicedSales,
    loading,
    loadingUninv,
    getAll,
    getUninvoicedSales,
    createInvoice,
    retryContingency,
    getTicketData,
  } = useInvoicing();

  // ─── Modales ──────────────────────────────────────────────────────────────
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [ticketInvoiceId, setTicketInvoiceId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);

  // ─── Carga inicial y preselección vía query param ?sale_id ────────────────
  useEffect(() => {
    Promise.all([getAll(), getUninvoicedSales()]).then(() => {
      const saleIdParam = searchParams.get('sale_id');
      if (saleIdParam) {
        getUninvoicedSales().then((res) => {
          if (res.ok) {
            const found = res.data.find((s) => String(s.id) === String(saleIdParam));
            if (found) {
              setSelectedSale(found);
              setInvoiceOpen(true);
            }
          }
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Reintento de contingencia (solo admin) ────────────────────────────────
  async function handleRetry(invoice) {
    setRetryingId(invoice.id);
    const res = await retryContingency(invoice.id);
    setRetryingId(null);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(`Comprobante ${invoice.serie_numero ?? invoice.id} sincronizado`);
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Facturación Electrónica</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Emisión de comprobantes tributarios (Boletas y Facturas) y sincronización con SUNAT
        </p>
      </div>

      {/* ── 1. Ventas por Facturar ── */}
      <Card className="shadow-sm border-border">
        <CardHeader className="py-3.5 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Ventas por Facturar
            </CardTitle>
          </div>
          {!loadingUninv && (
            <Badge variant="secondary" className="text-xs">
              {uninvoicedSales.length} pendiente{uninvoicedSales.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loadingUninv ? (
            <TableSkeleton rows={3} />
          ) : uninvoicedSales.length === 0 ? (
            <EmptyState
              icon={FileCheck2}
              title="Todas las ventas están facturadas"
              description="No hay ventas pendientes de comprobante electrónico en este momento."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Venta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto Total</TableHead>
                    <TableHead className="text-right w-28">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {uninvoicedSales.map((sale) => (
                    <TableRow key={sale.id} className="transition-colors duration-150">
                      <TableCell className="font-mono text-xs font-semibold text-foreground">
                        #{sale.id}
                      </TableCell>
                      <TableCell className="text-sm font-medium text-foreground">
                        {sale.customer_name || (
                          <span className="text-muted-foreground italic font-normal">
                            Venta de mostrador
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString('es-PE', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-sm text-foreground">
                        S/ {Number(sale.sale_total ?? sale.total_amount ?? sale.total ?? 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="h-7 text-xs gap-1.5"
                          onClick={() => {
                            setSelectedSale(sale);
                            setInvoiceOpen(true);
                          }}
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>Facturar</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── 2. Comprobantes Emitidos ── */}
      <Card className="shadow-sm border-border">
        <CardHeader className="py-3.5 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold text-foreground">
              Comprobantes Emitidos
            </CardTitle>
          </div>
          {!loading && (
            <Badge variant="secondary" className="text-xs">
              {invoices.length} emitido{invoices.length !== 1 ? 's' : ''}
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <TableSkeleton rows={4} />
          ) : invoices.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Sin comprobantes emitidos"
              description="Aún no se han generado boletas o facturas electrónicas en el sistema."
            />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-36">Serie y Número</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Venta Asoc.</TableHead>
                    <TableHead>Fecha Emisión</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-center">Estado SUNAT</TableHead>
                    <TableHead className="text-right w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invoices.map((inv) => {
                    const meta = ESTADO_META[inv.estado] ?? {
                      label: inv.estado ?? 'Emitido',
                      variant: 'secondary',
                      badgeClass: '',
                    };
                    const isContingency = ['contingencia', 'contingency'].includes(inv.estado);

                    return (
                      <TableRow key={inv.id} className="transition-colors duration-150">
                        {/* Serie y Número */}
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {inv.serie_numero ?? `#${inv.id}`}
                        </TableCell>

                        {/* Tipo */}
                        <TableCell className="text-xs uppercase text-muted-foreground font-medium">
                          {inv.comprobante_type ?? (inv.serie_numero?.startsWith('F') ? 'Factura' : 'Boleta')}
                        </TableCell>

                        {/* Venta */}
                        <TableCell className="text-xs text-muted-foreground">
                          Venta #{inv.sale_id}
                          {inv.customer_name && ` · ${inv.customer_name}`}
                        </TableCell>

                        {/* Fecha */}
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(inv.created_at ?? inv.issued_at).toLocaleDateString('es-PE', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </TableCell>

                        {/* Total con sale_total */}
                        <TableCell className="text-right tabular-nums font-semibold text-sm text-foreground">
                          S/ {Number(inv.sale_total ?? inv.total_amount ?? inv.total ?? 0).toFixed(2)}
                        </TableCell>

                        {/* Estado con Badge */}
                        <TableCell className="text-center">
                          <Badge
                            variant={meta.variant}
                            className={`text-[11px] px-2 py-0.5 ${meta.badgeClass}`}
                          >
                            {meta.label}
                          </Badge>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Ver ticket térmico */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => setTicketInvoiceId(inv.id)}
                                  aria-label={`Ver ticket térmico del comprobante ${inv.serie_numero ?? inv.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">Ver ticket</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver ticket térmico</TooltipContent>
                            </Tooltip>

                            {/* Reintentar contingencia — solo Administrador */}
                            {isContingency && isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
                                    onClick={() => handleRetry(inv)}
                                    disabled={retryingId === inv.id}
                                    aria-label={`Reintentar sincronización con SUNAT para ${inv.serie_numero ?? inv.id}`}
                                  >
                                    <RotateCw
                                      className={`w-3.5 h-3.5 ${
                                        retryingId === inv.id ? 'animate-spin' : ''
                                      }`}
                                    />
                                    <span className="sr-only">Reintentar sincronización SUNAT</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reintentar sincronización SUNAT</TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal de emisión de comprobante ── */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => {
          setInvoiceOpen(false);
          setSelectedSale(null);
        }}
        sale={selectedSale}
        createInvoice={createInvoice}
      />

      {/* ── Vista de ticket térmico ── */}
      {ticketInvoiceId && (
        <TicketView
          invoiceId={ticketInvoiceId}
          onClose={() => setTicketInvoiceId(null)}
          getTicketData={getTicketData}
        />
      )}
    </div>
  );
}

function TableSkeleton({ rows = 3 }) {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-border/50">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-7 w-16 rounded" />
        </div>
      ))}
    </div>
  );
}
