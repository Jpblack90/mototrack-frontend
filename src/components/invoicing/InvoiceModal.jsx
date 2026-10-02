import { useState } from 'react';
import { Dialog } from '@headlessui/react';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
} from '@heroicons/react/24/outline';
import Modal  from '../ui/Modal';
import Button from '../ui/Button';

const DOC_TYPES = {
  boleta:  { label: 'Boleta de Venta',    required: false, docType: 'DNI',  digits: 8  },
  factura: { label: 'Factura Electrónica', required: true,  docType: 'RUC',  digits: 11 },
};

/**
 * Modal de emisión de comprobante.
 *
 * Props:
 *   open          boolean
 *   onClose       () => void
 *   sale          Venta a facturar (con id, total_amount, customer_name)
 *   createInvoice función del hook useInvoicing
 */
export default function InvoiceModal({ open, onClose, sale, createInvoice }) {
  const [comprobanteType, setComprobanteType]   = useState('boleta');
  const [docNumber,       setDocNumber]         = useState('');
  const [docError,        setDocError]          = useState('');
  const [loading,         setLoading]           = useState(false);

  // Resultado de la emisión
  // resultState: null | 'accepted' | 'contingency' | 'alreadyExists' | 'error'
  const [resultState, setResultState] = useState(null);
  const [resultData,  setResultData]  = useState(null);
  const [errorMsg,    setErrorMsg]    = useState('');

  const meta = DOC_TYPES[comprobanteType];

  // ─── Validación local de documento ───────────────────────────────────────

  function validateDoc() {
    const cleaned = docNumber.trim();
    if (!cleaned) {
      if (comprobanteType === 'factura') {
        setDocError(`El RUC es obligatorio para Factura.`);
        return false;
      }
      return true; // Boleta sin documento es válida
    }
    if (!/^\d+$/.test(cleaned)) {
      setDocError('Solo dígitos numéricos.');
      return false;
    }
    if (cleaned.length !== meta.digits) {
      setDocError(`El ${meta.docType} debe tener exactamente ${meta.digits} dígitos.`);
      return false;
    }
    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setDocError('');
    setErrorMsg('');
    if (!validateDoc()) return;

    setLoading(true);
    const res = await createInvoice({
      sale_id:                  sale.id,
      comprobante_type:         comprobanteType,
      customer_document_type:   docNumber.trim() ? meta.docType : undefined,
      customer_document_number: docNumber.trim() || undefined,
    });
    setLoading(false);

    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }

    setResultData(res.data);
    if (res.alreadyExists) {
      setResultState('alreadyExists');
    } else if (res.data?.estado === 'contingencia' || res.data?.estado === 'contingency') {
      setResultState('contingency');
    } else {
      setResultState('accepted');
    }
  }

  function handleClose() {
    setComprobanteType('boleta');
    setDocNumber('');
    setDocError('');
    setErrorMsg('');
    setResultState(null);
    setResultData(null);
    onClose();
  }

  if (!sale) return null;

  return (
    <Modal open={open} onClose={handleClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200">
        <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
        <Dialog.Title className="font-semibold text-slate-900 text-lg">
          Emitir Comprobante
        </Dialog.Title>
      </div>

      <div className="px-6 py-5 space-y-5">

        {/* ── Resultado: Aceptado ── */}
        {resultState === 'accepted' && resultData && (
          <ResultAccepted data={resultData} onClose={handleClose} />
        )}

        {/* ── Resultado: Contingencia ── */}
        {resultState === 'contingency' && resultData && (
          <ResultContingency data={resultData} onClose={handleClose} />
        )}

        {/* ── Resultado: Ya existía ── */}
        {resultState === 'alreadyExists' && resultData && (
          <ResultAlreadyExists data={resultData} onClose={handleClose} />
        )}

        {/* ── Formulario de emisión ── */}
        {!resultState && (
          <>
            {/* Info de la venta */}
            <div className="bg-slate-50 rounded-lg px-4 py-3 flex justify-between items-center">
              <div>
                <p className="text-sm font-medium text-slate-900">
                  Venta #{sale.id}
                  {sale.customer_name && ` · ${sale.customer_name}`}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {new Date(sale.created_at).toLocaleDateString('es-PE', {
                    day: '2-digit', month: 'short', year: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-xl font-bold text-slate-900">
                S/ {Number(sale.total_amount ?? sale.total ?? 0).toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de comprobante */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Tipo de comprobante
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(DOC_TYPES).map(([key, m]) => (
                    <button
                      key={key} type="button"
                      onClick={() => { setComprobanteType(key); setDocNumber(''); setDocError(''); }}
                      className={`py-2.5 rounded-lg text-sm font-medium border transition-all active:scale-[0.98]
                        ${comprobanteType === key
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Documento del cliente */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  {meta.docType}{' '}
                  {meta.required
                    ? <span className="text-red-500">*</span>
                    : <span className="text-slate-400 font-normal">(opcional)</span>
                  }
                </label>
                <input
                  type="text" inputMode="numeric" maxLength={meta.digits}
                  value={docNumber}
                  onChange={e => { setDocNumber(e.target.value); setDocError(''); }}
                  placeholder={`${meta.digits} dígitos`}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
                />
                {docError && (
                  <p className="text-xs text-red-600 mt-1">{docError}</p>
                )}
              </div>

              {/* Error real del backend */}
              {errorMsg && (
                <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{errorMsg}</p>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-1">
                <Button variant="secondary" type="button" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button
                  variant="primary" type="submit" disabled={loading}
                  icon={<DocumentTextIcon className="w-4 h-4" />}
                >
                  {loading ? 'Emitiendo…' : 'Emitir comprobante'}
                </Button>
              </div>
            </form>
          </>
        )}
      </div>
    </Modal>
  );
}

// ─── Sub-pantallas de resultado ───────────────────────────────────────────────

function ResultAccepted({ data, onClose }) {
  return (
    <div className="text-center space-y-4 py-4">
      <CheckCircleIcon className="w-14 h-14 text-emerald-500 mx-auto" />
      <div>
        <p className="font-semibold text-slate-900 text-lg">Comprobante emitido</p>
        {data?.serie_numero && (
          <p className="text-sm text-slate-500 mt-1">{data.serie_numero}</p>
        )}
        <p className="text-xs text-emerald-600 font-medium mt-2 uppercase tracking-wide">
          Aceptado por SUNAT
        </p>
      </div>
      <Button variant="primary" onClick={onClose} className="w-full justify-center">
        Cerrar
      </Button>
    </div>
  );
}

function ResultContingency({ data, onClose }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
        <ExclamationTriangleIcon className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-amber-900">Comprobante en contingencia</p>
          <p className="text-sm text-amber-800 mt-1">
            El comprobante fue guardado pero no pudo sincronizarse con SUNAT en este momento.
            Se reintentará automáticamente. Puedes forzar el reintento desde la lista de comprobantes.
          </p>
          {data?.serie_numero && (
            <p className="text-xs text-amber-700 font-mono mt-2">{data.serie_numero}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>Entendido</Button>
      </div>
    </div>
  );
}

function ResultAlreadyExists({ data, onClose }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 bg-sky-50 border border-sky-200 rounded-xl px-4 py-4">
        <InformationCircleIcon className="w-6 h-6 text-sky-500 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-sky-900">Esta venta ya tiene comprobante</p>
          <p className="text-sm text-sky-800 mt-1">
            No se emitió un nuevo comprobante. Aquí están los datos del existente:
          </p>
          {data?.serie_numero && (
            <p className="text-sm font-mono font-bold text-sky-900 mt-2">{data.serie_numero}</p>
          )}
          {data?.estado && (
            <p className="text-xs text-sky-700 mt-1 capitalize">Estado: {data.estado}</p>
          )}
        </div>
      </div>
      <div className="flex justify-end">
        <Button variant="secondary" onClick={onClose}>Cerrar</Button>
      </div>
    </div>
  );
}
