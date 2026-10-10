import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Skeleton } from '../ui/skeleton';
import { Printer, X } from 'lucide-react';

/**
 * Vista de ticket térmico para comprobantes emitidos.
 *
 * REGLA ESTRICTA: La clase "print-ticket-root" es detectada por @media print
 * en index.css para ocultar toda la UI y mostrar exclusivamente el ticket térmico.
 */
export default function TicketView({ invoiceId, onClose, getTicketData }) {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    setError('');
    getTicketData(invoiceId).then((res) => {
      if (res.ok) setTicket(res.data);
      else setError(res.error);
      setLoading(false);
    });
  }, [invoiceId, getTicketData]);

  const items = ticket?.items ?? ticket?.sale?.items ?? [];

  return (
    /* Overlay de fondo en pantalla */
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-8 px-4">
      {/* Contenedor principal — raíz para impresión */}
      <div className="print-ticket-root w-full max-w-sm">
        {/* Barra de acciones (oculta al imprimir) */}
        <div className="flex items-center justify-between mb-3 print:hidden">
          <Button
            size="sm"
            onClick={() => window.print()}
            className="gap-1.5"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 rounded-full"
            aria-label="Cerrar vista de ticket"
          >
            <X className="w-4 h-4" />
            <span className="sr-only">Cerrar vista de ticket</span>
          </Button>
        </div>

        {/* Formato físico del Ticket Térmico */}
        <div className="bg-white rounded-xl shadow-lg border border-border p-6 font-mono text-xs text-slate-900 space-y-4">
          {loading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-full" />
              ))}
            </div>
          )}

          {error && (
            <p className="text-destructive text-center text-xs py-4">{error}</p>
          )}

          {ticket && !loading && (
            <>
              {/* Cabecera del taller */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-3">
                <p className="font-extrabold text-sm tracking-widest">MOTOTRACK</p>
                <p className="text-[11px] text-slate-500">Gestión Integral de Taller</p>
              </div>

              {/* Tipo y serie */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-3">
                <p className="font-bold uppercase tracking-wider text-xs">
                  {ticket.comprobante_type === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}
                </p>
                {ticket.serie_numero && (
                  <p className="text-slate-700 font-semibold">{ticket.serie_numero}</p>
                )}
                <p className="text-[11px] text-slate-500">
                  {new Date(ticket.created_at ?? ticket.issued_at).toLocaleString('es-PE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Cliente */}
              {(ticket.customer_name || ticket.customer_document_number) && (
                <div className="border-b border-dashed border-slate-300 pb-3 space-y-1">
                  {ticket.customer_name && (
                    <TicketRow label="Cliente" value={ticket.customer_name} />
                  )}
                  {ticket.customer_document_type && ticket.customer_document_number && (
                    <TicketRow
                      label={ticket.customer_document_type}
                      value={ticket.customer_document_number}
                    />
                  )}
                </div>
              )}

              {/* Ítems */}
              {items.length > 0 && (
                <div className="border-b border-dashed border-slate-300 pb-3 space-y-2">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-2 text-[11px] text-slate-500 uppercase font-semibold">
                    <span>Descripción</span>
                    <span className="text-right">Cant</span>
                    <span className="text-right">Total</span>
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-2 text-xs">
                      <div>
                        <p className="truncate font-medium">
                          {item.name ?? item.product_name ?? item.kit_name ?? `Item ${i + 1}`}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          S/ {Number(item.unit_price).toFixed(2)} c/u
                        </p>
                      </div>
                      <span className="text-right self-center tabular-nums">{item.quantity}</span>
                      <span className="text-right self-center font-semibold tabular-nums">
                        S/ {Number(item.subtotal ?? item.unit_price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Totales */}
              <div className="space-y-1">
                {ticket.subtotal != null && (
                  <TicketRow label="Subtotal" value={`S/ ${Number(ticket.subtotal).toFixed(2)}`} />
                )}
                {ticket.igv != null && (
                  <TicketRow label="IGV (18%)" value={`S/ ${Number(ticket.igv).toFixed(2)}`} />
                )}
                <div className="flex justify-between font-bold text-sm border-t border-slate-300 pt-2 mt-1">
                  <span>TOTAL</span>
                  <span>S/ {Number(ticket.sale_total ?? ticket.total_amount ?? ticket.total ?? 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Estado y pie */}
              <div className="text-center text-[11px] text-slate-500 border-t border-dashed border-slate-300 pt-3 space-y-1">
                <p className="font-bold tracking-widest text-emerald-700">
                  {ticket.estado === 'aceptado' || ticket.estado === 'accepted'
                    ? '✓ ACEPTADO SIMULADO'
                    : ticket.estado === 'contingencia' || ticket.estado === 'contingency'
                      ? '⚠ EN CONTINGENCIA'
                      : ticket.estado?.toUpperCase() ?? 'EMITIDO'}
                </p>
                <p className="text-slate-400 pt-1">¡Gracias por su preferencia!</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TicketRow({ label, value }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}:</span>
      <span className="font-medium text-slate-900 truncate max-w-[170px] text-right">{value}</span>
    </div>
  );
}
