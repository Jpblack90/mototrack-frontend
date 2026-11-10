import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCompany } from '../hooks/useCompany';
import { useInvoicing } from '../hooks/useInvoicing';
import { useVoidSale } from '../hooks/useVoidSale';
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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '../components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { EmptyState } from '../components/ui/empty-state';
import { toast } from 'sonner';
import {
  FileText,
  Receipt,
  RotateCw,
  Eye,
  FileCheck2,
  Ban,
  AlertTriangle,
} from 'lucide-react';

const ESTADO_META = {
  aceptado: {
    label: 'Aceptado',
    variant: 'outline',
    badgeClass: 'text-success bg-success/10 border-success/30',
  },
  accepted: {
    label: 'Aceptado',
    variant: 'outline',
    badgeClass: 'text-success bg-success/10 border-success/30',
  },
  contingencia: {
    label: 'Contingencia',
    variant: 'outline',
    badgeClass: 'text-warning bg-warning/10 border-warning/30',
  },
  contingency: {
    label: 'Contingencia',
    variant: 'outline',
    badgeClass: 'text-warning bg-warning/10 border-warning/30',
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
  const { company } = useCompany();
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
    getCreditNoteTicket,
    retryCreditNote,
  } = useInvoicing();

  const { voidSale: executeVoidSale, loading: voiding } = useVoidSale();

  // ─── Modales y Vistas ─────────────────────────────────────────────────────
  const [selectedSale, setSelectedSale] = useState(null);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [ticketInvoiceId, setTicketInvoiceId] = useState(null);
  const [ticketCreditNoteId, setTicketCreditNoteId] = useState(null);
  const [retryingId, setRetryingId] = useState(null);
  const [retryingNcId, setRetryingNcId] = useState(null);

  // ─── Estado del Diálogo de Anulación (RF-23) ──────────────────────────────
  const [voidDialogOpen, setVoidDialogOpen] = useState(false);
  const [voidTarget, setVoidTarget] = useState(null); // { type: 'invoice'|'sale', data: object }
  const [voidReason, setVoidReason] = useState('');
  const [motivoCode, setMotivoCode] = useState('01');

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

  // ─── Reintento de comprobante en contingencia (solo admin) ─────────────────
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

  // ─── Reintento de Nota de Crédito en contingencia (solo admin) ────────────
  async function handleRetryCreditNote(nc) {
    setRetryingNcId(nc.id);
    const res = await retryCreditNote(nc.id);
    setRetryingNcId(null);
    if (!res.ok) {
      toast.error(res.error);
    } else {
      toast.success(`Nota de crédito ${nc.serie}-${String(nc.numero).padStart(8, '0')} sincronizada`);
    }
  }

  // ─── Ejecutar Anulación (con o sin Nota de Crédito) ────────────────────────
  async function handleConfirmVoid() {
    if (!voidReason.trim()) {
      toast.error('La descripción del motivo es obligatoria.');
      return;
    }

    const saleId = voidTarget?.type === 'invoice' ? voidTarget.data.sale_id : voidTarget.data.id;
    const res = await executeVoidSale(saleId, {
      void_reason: voidReason.trim(),
      motivo_code: voidTarget?.type === 'invoice' ? motivoCode : '01',
    });

    if (!res.ok) {
      toast.error(res.error);
      return;
    }

    if (voidTarget?.type === 'invoice') {
      const nc = res.data?.credit_note;
      const ncText = nc ? ` Se emitió la Nota de Crédito ${nc.serie}-${String(nc.numero).padStart(8, '0')}.` : '';
      toast.success(`Venta anulada y stock devuelto.${ncText}`);
    } else {
      toast.success(`Venta #${saleId} anulada y stock devuelto.`);
    }

    setVoidDialogOpen(false);
    setVoidTarget(null);
    setVoidReason('');
    setMotivoCode('01');
    await Promise.all([getAll(), getUninvoicedSales()]);
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Facturación Electrónica</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Emisión de comprobantes tributarios (Boletas y Facturas), notas de crédito y sincronización con SUNAT
          </p>
        </div>
        <div>
          <Badge
            variant="outline"
            className={
              company?.pse_provider === 'nubefact'
                ? 'text-primary border-primary/30 bg-primary/10 text-xs'
                : 'text-muted-foreground text-xs'
            }
          >
            Proveedor PSE: {company?.pse_provider === 'nubefact' ? 'Nubefact' : 'Simulado'}
          </Badge>
        </div>
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
                    <TableHead className="text-right w-36">Acciones</TableHead>
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
                        <div className="flex items-center justify-end gap-1.5">
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
                          {isAdmin && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    setVoidTarget({ type: 'sale', data: sale });
                                    setVoidReason('');
                                    setMotivoCode('01');
                                    setVoidDialogOpen(true);
                                  }}
                                  aria-label={`Anular venta #${sale.id}`}
                                >
                                  <Ban className="w-3.5 h-3.5 mr-1" />
                                  <span>Anular</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Anular venta sin comprobante</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
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
                    <TableHead className="text-right w-28">Acciones</TableHead>
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
                    const hasCreditNote = Boolean(inv.credit_note);

                    return (
                      <TableRow key={inv.id} className="transition-colors duration-150">
                        {/* Serie y Número */}
                        <TableCell className="font-mono text-xs font-semibold text-foreground">
                          {inv.serie_numero ?? (inv.serie && inv.numero ? `${inv.serie}-${String(inv.numero).padStart(8, '0')}` : `#${inv.id}`)}
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
                          <div className="flex flex-col items-center gap-1">
                            {['rejected', 'rechazado'].includes(inv.estado) ? (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Badge
                                    variant={meta.variant}
                                    className={`text-[11px] px-2 py-0.5 cursor-help ${meta.badgeClass}`}
                                  >
                                    {meta.label}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent className="max-w-xs text-xs">
                                  {inv.cdr_response?.sunat_description ||
                                    inv.cdr_response?.description ||
                                    inv.cdr_response?.errors ||
                                    'Comprobante rechazado por SUNAT.'}
                                </TooltipContent>
                              </Tooltip>
                            ) : (
                              <Badge
                                variant={meta.variant}
                                className={`text-[11px] px-2 py-0.5 ${meta.badgeClass}`}
                              >
                                {meta.label}
                              </Badge>
                            )}

                            {/* Badge de Nota de Crédito (RF-23) */}
                            {hasCreditNote && (
                              <div className="flex flex-col items-center gap-0.5 mt-0.5">
                                <Badge
                                  variant="outline"
                                  className="text-[10px] font-mono border-destructive/30 bg-destructive/10 text-destructive"
                                >
                                  Anulada · {inv.credit_note.serie}-{String(inv.credit_note.numero).padStart(8, '0')}
                                </Badge>
                                {inv.credit_note.estado === 'contingency' ? (
                                  <Badge variant="outline" className="text-[9px] text-warning bg-warning/10 border-warning/30">
                                    NC en contingencia
                                  </Badge>
                                ) : inv.credit_note.estado === 'accepted' ? (
                                  <Badge variant="outline" className="text-[9px] text-success bg-success/10 border-success/30">
                                    NC aceptada
                                  </Badge>
                                ) : null}
                              </div>
                            )}
                          </div>
                        </TableCell>

                        {/* Acciones */}
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            {/* Ver ticket térmico del comprobante */}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                  onClick={() => {
                                    setTicketCreditNoteId(null);
                                    setTicketInvoiceId(inv.id);
                                  }}
                                  aria-label={`Ver ticket térmico del comprobante ${inv.serie_numero ?? inv.id}`}
                                >
                                  <Eye className="w-4 h-4" />
                                  <span className="sr-only">Ver ticket</span>
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Ver ticket comprobante</TooltipContent>
                            </Tooltip>

                            {/* Ver ticket térmico de la Nota de Crédito */}
                            {hasCreditNote && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setTicketInvoiceId(null);
                                      setTicketCreditNoteId(inv.credit_note.id);
                                    }}
                                    aria-label={`Ver ticket de Nota de Crédito ${inv.credit_note.serie}-${inv.credit_note.numero}`}
                                  >
                                    <Receipt className="w-4 h-4" />
                                    <span className="sr-only">Ver ticket NC</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Ver ticket Nota de Crédito</TooltipContent>
                              </Tooltip>
                            )}

                            {/* Reintentar contingencia de la NC — solo Administrador */}
                            {inv.credit_note?.estado === 'contingency' && isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-warning hover:text-warning hover:bg-warning/10"
                                    onClick={() => handleRetryCreditNote(inv.credit_note)}
                                    disabled={retryingNcId === inv.credit_note.id}
                                    aria-label="Reintentar sincronización de Nota de Crédito"
                                  >
                                    <RotateCw
                                      className={`w-3.5 h-3.5 ${
                                        retryingNcId === inv.credit_note.id ? 'animate-spin' : ''
                                      }`}
                                    />
                                    <span className="sr-only">Reintentar envío NC</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Reintentar envío NC</TooltipContent>
                              </Tooltip>
                            )}

                            {/* Anular con Nota de Crédito — solo Administrador, comprobante aceptado sin NC previa */}
                            {!hasCreditNote && inv.estado === 'accepted' && isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      setVoidTarget({ type: 'invoice', data: inv });
                                      setVoidReason('');
                                      setMotivoCode('01');
                                      setVoidDialogOpen(true);
                                    }}
                                    aria-label={`Anular con nota de crédito el comprobante ${inv.serie_numero ?? inv.id}`}
                                  >
                                    <Ban className="w-4 h-4" />
                                    <span className="sr-only">Anular con NC</span>
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Anular con nota de crédito</TooltipContent>
                              </Tooltip>
                            )}

                            {/* Reintentar contingencia del comprobante — solo Administrador */}
                            {isContingency && !hasCreditNote && isAdmin && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-warning hover:text-warning hover:bg-warning/10"
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

      {/* ── Diálogo de confirmación de anulación (AlertDialog) ── */}
      <AlertDialog open={voidDialogOpen} onOpenChange={setVoidDialogOpen}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-foreground">
              <Ban className="w-5 h-5 text-destructive" />
              {voidTarget?.type === 'invoice'
                ? 'Anular con Nota de Crédito'
                : `Anular Venta #${voidTarget?.data?.id}`}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground text-xs">
              {voidTarget?.type === 'invoice'
                ? `Se anulará el comprobante ${voidTarget.data.serie_numero ?? (voidTarget.data.serie && voidTarget.data.numero ? `${voidTarget.data.serie}-${String(voidTarget.data.numero).padStart(8, '0')}` : `#${voidTarget.data.id}`)} y la venta #${voidTarget.data.sale_id}.`
                : `Se cancelará la venta de mostrador #${voidTarget?.data?.id} y se devolverá el stock.`}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-2">
            {/* Si es anulación con comprobante: selector de motivo SUNAT Catálogo 09 */}
            {voidTarget?.type === 'invoice' && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-foreground">
                  Motivo SUNAT (Catálogo 09) *
                </Label>
                <Select value={motivoCode} onValueChange={setMotivoCode}>
                  <SelectTrigger className="w-full text-xs">
                    <SelectValue placeholder="Selecciona un motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="01">01 - Anulación de la operación</SelectItem>
                    {(voidTarget.data.comprobante_type === 'factura' ||
                      voidTarget.data.serie?.startsWith('F')) && (
                      <SelectItem value="02">02 - Anulación por error en el RUC</SelectItem>
                    )}
                    <SelectItem value="06">06 - Devolución total</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Motivo descriptivo obligatorio */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-foreground">
                Descripción obligatoria *
              </Label>
              <Textarea
                placeholder="Ingresa la razón detallada de la anulación..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
                className="text-xs min-h-[75px] resize-none"
              />
            </div>

            {/* Aviso destacado */}
            {voidTarget?.type === 'invoice' ? (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-warning text-xs flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Atención fiscal</p>
                  <p className="mt-0.5 leading-relaxed">
                    Se emitirá la nota de crédito{' '}
                    <span className="font-mono font-bold">
                      {voidTarget.data.comprobante_type === 'factura' || voidTarget.data.serie?.startsWith('F')
                        ? 'FC01'
                        : 'BC01'}
                    </span>{' '}
                    por S/{' '}
                    {Number(voidTarget.data.sale_total ?? voidTarget.data.total ?? 0).toFixed(2)} y se devolverá el stock. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-warning text-xs flex gap-2.5 items-start">
                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Devolución de stock</p>
                  <p className="mt-0.5 leading-relaxed">
                    Se restituirá el stock de los productos vendidos y la venta quedará anulada. Esta acción no se puede deshacer.
                  </p>
                </div>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={voiding} onClick={() => setVoidDialogOpen(false)}>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="destructive"
              size="sm"
              disabled={!voidReason.trim() || voiding}
              onClick={handleConfirmVoid}
            >
              {voiding ? 'Anulando...' : 'Confirmar Anulación'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Vista de ticket térmico de comprobante ── */}
      {ticketInvoiceId && (
        <TicketView
          invoiceId={ticketInvoiceId}
          onClose={() => setTicketInvoiceId(null)}
          getTicketData={getTicketData}
        />
      )}

      {/* ── Vista de ticket térmico de Nota de Crédito ── */}
      {ticketCreditNoteId && (
        <TicketView
          creditNoteId={ticketCreditNoteId}
          type="credit_note"
          onClose={() => setTicketCreditNoteId(null)}
          getCreditNoteTicket={getCreditNoteTicket}
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
