import { useState, useEffect, useCallback } from 'react';
import { useSearchParams }    from 'react-router-dom';
import {
  DocumentTextIcon,
  ReceiptPercentIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import { useAuth }       from '../context/AuthContext';
import { useInvoicing }  from '../hooks/useInvoicing';
import InvoiceModal      from '../components/invoicing/InvoiceModal';
import TicketView        from '../components/invoicing/TicketView';
import Button            from '../components/ui/Button';

// ─── Metadata de estado ───────────────────────────────────────────────────────
const ESTADO_META = {
  aceptado:     { label: 'Aceptado',    badge: 'bg-emerald-50 text-emerald-700' },
  accepted:     { label: 'Aceptado',    badge: 'bg-emerald-50 text-emerald-700' },
  contingencia: { label: 'Contingencia',badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  contingency:  { label: 'Contingencia',badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
  rechazado:    { label: 'Rechazado',   badge: 'bg-rose-50 text-rose-700' },
  rejected:     { label: 'Rechazado',   badge: 'bg-rose-50 text-rose-700' },
  pendiente:    { label: 'Pendiente',   badge: 'bg-slate-100 text-slate-600' },
  pending:      { label: 'Pendiente',   badge: 'bg-slate-100 text-slate-600' },
};

export default function InvoicingPage() {
  const { user }  = useAuth();
  const isAdmin   = user?.role === 'admin';
  const [searchParams] = useSearchParams();

  const {
    invoices, uninvoicedSales, loading, loadingUninv,
    getAll, getUninvoicedSales,
    createInvoice, retryContingency, getTicketData,
  } = useInvoicing();

  // ─── Modales ──────────────────────────────────────────────────────────────
  const [selectedSale,    setSelectedSale]    = useState(null); // para InvoiceModal
  const [invoiceOpen,     setInvoiceOpen]     = useState(false);
  const [ticketInvoiceId, setTicketInvoiceId] = useState(null); // para TicketView
  const [retryError,      setRetryError]      = useState('');

  // ─── Carga inicial + preselección desde URL ───────────────────────────────
  useEffect(() => {
    Promise.all([getAll(), getUninvoicedSales()]).then(() => {
      const saleIdParam = searchParams.get('sale_id');
      if (saleIdParam) {
        // Busca la venta en uninvoicedSales por id
        // Como el state aún podría no estar listo, usamos el resultado directo
        getUninvoicedSales().then(res => {
          if (res.ok) {
            const found = res.data.find(s => String(s.id) === String(saleIdParam));
            if (found) { setSelectedSale(found); setInvoiceOpen(true); }
          }
        });
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Retry de contingencia (solo admin) ──────────────────────────────────
  async function handleRetry(invoice) {
    setRetryError('');
    const res = await retryContingency(invoice.id);
    if (!res.ok) setRetryError(res.error);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="bg-slate-50 min-h-full space-y-8">

      <div>
        <h1 className="font-semibold text-slate-900 text-2xl">Facturación Electrónica</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Emisión de boletas y facturas, historial de comprobantes
        </p>
      </div>

      {retryError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl flex justify-between">
          {retryError}
          <button onClick={() => setRetryError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* ── 1. Ventas por Facturar ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Ventas por Facturar</h2>
          {!loadingUninv && (
            <span className="ml-auto text-xs text-slate-500">
              {uninvoicedSales.length} pendiente{uninvoicedSales.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loadingUninv ? (
          <SectionSkeleton rows={3} />
        ) : uninvoicedSales.length === 0 ? (
          <EmptyState text="Todas las ventas completadas ya tienen comprobante." />
        ) : (
          <div className="divide-y divide-slate-100">
            {uninvoicedSales.map(sale => (
              <div key={sale.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    Venta #{sale.id}
                    {sale.customer_name
                      ? ` · ${sale.customer_name}`
                      : <span className="text-slate-400 font-normal"> · Venta de mostrador</span>
                    }
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {new Date(sale.created_at).toLocaleDateString('es-PE', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-4 shrink-0 ml-4">
                  <span className="text-sm font-semibold text-slate-900">
                    S/ {Number(sale.sale_total ?? sale.total_amount ?? sale.total ?? 0).toFixed(2)}
                  </span>
                  <Button
                    variant="primary"
                    icon={<DocumentTextIcon className="w-4 h-4" />}
                    onClick={() => { setSelectedSale(sale); setInvoiceOpen(true); }}
                  >
                    Facturar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── 2. Comprobantes Emitidos ── */}
      <section className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center gap-2">
          <ReceiptPercentIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-slate-900">Comprobantes Emitidos</h2>
          {!loading && (
            <span className="ml-auto text-xs text-slate-500">
              {invoices.length} comprobante{invoices.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <SectionSkeleton rows={4} />
        ) : invoices.length === 0 ? (
          <EmptyState text="Aún no se han emitido comprobantes." />
        ) : (
          <div className="divide-y divide-slate-100">
            {invoices.map(inv => {
              const meta = ESTADO_META[inv.estado] ?? { label: inv.estado ?? 'Emitido', badge: 'bg-slate-100 text-slate-600' };
              const isContingency = ['contingencia', 'contingency'].includes(inv.estado);

              return (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3 hover:bg-slate-50 transition-colors gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-slate-900">
                        {inv.serie_numero ?? `Comprobante #${inv.id}`}
                      </p>
                      <span className={`text-xs font-medium rounded-full px-2 py-0.5 ${meta.badge}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Venta #{inv.sale_id}
                      {inv.customer_name && ` · ${inv.customer_name}`}
                      {' · '}
                      {new Date(inv.created_at ?? inv.issued_at).toLocaleDateString('es-PE', {
                        day: '2-digit', month: 'short', year: 'numeric',
                      })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-sm font-semibold text-slate-900">
                      S/ {Number(inv.sale_total ?? inv.total_amount ?? inv.total ?? 0).toFixed(2)}
                    </span>

                    {/* Ver ticket */}
                    <button
                      onClick={() => setTicketInvoiceId(inv.id)}
                      title="Ver ticket"
                      className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-indigo-600 transition-colors"
                    >
                      <ReceiptPercentIcon className="w-4 h-4" />
                    </button>

                    {/* Reintentar contingencia — solo admin */}
                    {isContingency && isAdmin && (
                      <button
                        onClick={() => handleRetry(inv)}
                        title="Reintentar sincronización SUNAT"
                        className="p-1.5 rounded-lg text-amber-500 hover:bg-amber-50 hover:text-amber-700 transition-colors"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Modal de emisión ── */}
      <InvoiceModal
        open={invoiceOpen}
        onClose={() => { setInvoiceOpen(false); setSelectedSale(null); }}
        sale={selectedSale}
        createInvoice={createInvoice}
      />

      {/* ── Vista de ticket ── */}
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

// ─── Helpers de UI ────────────────────────────────────────────────────────────

function SectionSkeleton({ rows = 3 }) {
  return (
    <div className="divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-6 py-4">
          <div className="space-y-2">
            <div className="h-3.5 bg-slate-200 rounded w-48" />
            <div className="h-3 bg-slate-100 rounded w-32" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-16" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div className="flex items-center justify-center py-12 text-sm text-slate-400">
      {text}
    </div>
  );
}
