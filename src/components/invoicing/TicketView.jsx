import { useEffect, useState } from 'react';
import { PrinterIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

/**
 * Vista de ticket térmico.
 * Diseño angosto (max-w-sm), monoespaciada, apta para impresión.
 *
 * La clase "print-ticket-root" es detectada por @media print en index.css
 * para ocultar todo lo demás y mostrar solo el ticket.
 *
 * Props:
 *   invoiceId     ID del comprobante a mostrar
 *   onClose       () => void
 *   getTicketData función del hook useInvoicing
 */
export default function TicketView({ invoiceId, onClose, getTicketData }) {
  const [ticket,  setTicket]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!invoiceId) return;
    setLoading(true);
    setError('');
    getTicketData(invoiceId).then(res => {
      if (res.ok) setTicket(res.data);
      else        setError(res.error);
      setLoading(false);
    });
  }, [invoiceId, getTicketData]);

  const items = ticket?.items ?? ticket?.sale?.items ?? [];

  return (
    /* Overlay de fondo */
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/60 overflow-y-auto py-8 px-4">

      {/* Contenedor principal — también es el root de impresión */}
      <div className="print-ticket-root w-full max-w-sm">

        {/* Barra de acciones (oculta al imprimir) */}
        <div className="flex items-center justify-between mb-3 print:hidden">
          <Button
            variant="primary"
            icon={<PrinterIcon className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white hover:bg-slate-700 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Ticket */}
        <div className="bg-white rounded-xl shadow-xl p-6 font-mono text-sm text-slate-900 space-y-4">
          {loading && (
            <div className="animate-pulse space-y-3">
              {[1,2,3,4,5].map(i => <div key={i} className="h-3 bg-slate-200 rounded" />)}
            </div>
          )}

          {error && (
            <p className="text-red-600 text-center">{error}</p>
          )}

          {ticket && !loading && (
            <>
              {/* Cabecera del negocio */}
              <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-4">
                <p className="font-bold text-base tracking-widest">MOTOTRACK</p>
                <p className="text-xs text-slate-500">Sistema de Gestión de Taller</p>
              </div>

              {/* Tipo y serie */}
              <div className="text-center space-y-1 border-b border-dashed border-slate-300 pb-4">
                <p className="font-bold uppercase tracking-wide">
                  {ticket.comprobante_type === 'factura' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA'}
                </p>
                {ticket.serie_numero && (
                  <p className="text-slate-600">{ticket.serie_numero}</p>
                )}
                <p className="text-xs text-slate-500">
                  {new Date(ticket.created_at ?? ticket.issued_at).toLocaleString('es-PE', {
                    day: '2-digit', month: '2-digit', year: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>

              {/* Cliente */}
              {(ticket.customer_name || ticket.customer_document_number) && (
                <div className="border-b border-dashed border-slate-300 pb-4 space-y-0.5">
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

              {/* Items */}
              {items.length > 0 && (
                <div className="border-b border-dashed border-slate-300 pb-4 space-y-2">
                  <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs text-slate-500 uppercase">
                    <span>Descripción</span>
                    <span className="text-right">Cant</span>
                    <span className="text-right">Total</span>
                  </div>
                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-[1fr_auto_auto] gap-x-3 text-xs">
                      <div>
                        <p className="truncate">{item.name ?? item.product_name ?? item.kit_name ?? `Item ${i+1}`}</p>
                        <p className="text-slate-500">S/ {Number(item.unit_price).toFixed(2)} c/u</p>
                      </div>
                      <span className="text-right self-center">{item.quantity}</span>
                      <span className="text-right self-center font-medium">
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
                <div className="flex justify-between font-bold border-t border-slate-200 pt-2 mt-1">
                  <span>TOTAL</span>
                  <span>S/ {Number(ticket.sale_total ?? ticket.total_amount ?? ticket.total ?? 0).toFixed(2)}</span>
                </div>
              </div>

              {/* Estado */}
              <div className="text-center text-xs text-slate-500 border-t border-dashed border-slate-300 pt-4">
                <p className="font-medium uppercase tracking-widest">
                  {ticket.estado === 'aceptado' || ticket.estado === 'accepted'
                    ? '✓ ACEPTADO SIMULADO'
                    : ticket.estado === 'contingencia' || ticket.estado === 'contingency'
                      ? '⚠ En contingencia'
                      : ticket.estado?.toUpperCase() ?? 'EMITIDO'
                  }
                </p>
                <p className="mt-2">¡Gracias por su preferencia!</p>
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
      <span className="text-slate-500">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
