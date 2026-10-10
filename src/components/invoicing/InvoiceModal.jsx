import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Info,
  AlertCircle,
} from 'lucide-react';

const DOC_TYPES = {
  boleta:  { label: 'Boleta de Venta',    required: false, docType: 'DNI',  digits: 8  },
  factura: { label: 'Factura Electrónica', required: true,  docType: 'RUC',  digits: 11 },
};

export default function InvoiceModal({ open, onClose, sale, createInvoice }) {
  const [comprobanteType, setComprobanteType] = useState('boleta');
  const [docNumber, setDocNumber] = useState('');
  const [docError, setDocError] = useState('');
  const [loading, setLoading] = useState(false);

  // Estados de resultado: null | 'accepted' | 'contingency' | 'alreadyExists'
  const [resultState, setResultState] = useState(null);
  const [resultData, setResultData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const meta = DOC_TYPES[comprobanteType];

  function validateDoc() {
    const cleaned = docNumber.trim();
    if (!cleaned) {
      if (comprobanteType === 'factura') {
        setDocError('El RUC es obligatorio para Factura.');
        return false;
      }
      return true;
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
      sale_id: sale.id,
      comprobante_type: comprobanteType,
      customer_document_type: docNumber.trim() ? meta.docType : undefined,
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
    <Dialog open={open} onOpenChange={(val) => !val && handleClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <DialogTitle className="text-base font-semibold text-foreground">
              {resultState ? 'Resultado de Emisión' : 'Emitir Comprobante Electrónico'}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {resultState
              ? 'Estado de la comunicación con el PSE / SUNAT'
              : 'Selecciona tipo de comprobante e ingresa datos tributarios'}
          </DialogDescription>
        </DialogHeader>

        {/* ── Resultado: Aceptado ── */}
        {resultState === 'accepted' && resultData && (
          <div className="text-center space-y-4 py-3">
            <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <p className="font-semibold text-foreground text-base">Comprobante emitido con éxito</p>
              {resultData?.serie_numero && (
                <p className="text-sm font-mono font-bold text-foreground mt-1">
                  {resultData.serie_numero}
                </p>
              )}
              <Badge variant="outline" className="mt-2 text-xs border-emerald-300 bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                ✓ ACEPTADO SIMULADO
              </Badge>
            </div>
            <Button onClick={handleClose} className="w-full">
              Cerrar
            </Button>
          </div>
        )}

        {/* ── Resultado: Contingencia ── */}
        {resultState === 'contingency' && resultData && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-amber-900 dark:text-amber-200">
                <p className="font-bold text-sm">Comprobante en Contingencia</p>
                <p className="leading-relaxed">
                  El comprobante fue emitido localmente pero no pudo sincronizarse con SUNAT. Podrá sincronizarse luego desde la sección de comprobantes.
                </p>
                {resultData?.serie_numero && (
                  <p className="font-mono font-semibold pt-1">
                    Serie: {resultData.serie_numero}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Entendido</Button>
            </div>
          </div>
        )}

        {/* ── Resultado: Ya Existía ── */}
        {resultState === 'alreadyExists' && resultData && (
          <div className="space-y-4 py-2">
            <div className="flex items-start gap-3 rounded-lg border border-sky-300 bg-sky-50 p-4 dark:border-sky-800 dark:bg-sky-950">
              <Info className="w-5 h-5 text-sky-600 dark:text-sky-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs text-sky-900 dark:text-sky-200">
                <p className="font-bold text-sm">Comprobante Ya Existente</p>
                <p className="leading-relaxed">
                  Esta venta ya cuenta con un comprobante registrado previamente:
                </p>
                {resultData?.serie_numero && (
                  <p className="font-mono font-bold text-sm pt-1">
                    {resultData.serie_numero}
                  </p>
                )}
                {resultData?.estado && (
                  <p className="capitalize text-[11px] text-sky-700 dark:text-sky-300">
                    Estado: {resultData.estado}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleClose}>Cerrar</Button>
            </div>
          </div>
        )}

        {/* ── Formulario de emisión ── */}
        {!resultState && (
          <div className="space-y-4 pt-1">
            {/* Resumen de la venta */}
            <div className="rounded-lg border border-border bg-muted/20 p-3 flex justify-between items-center text-xs">
              <div>
                <p className="font-semibold text-foreground">
                  Venta #{sale.id}
                  {sale.customer_name && ` · ${sale.customer_name}`}
                </p>
                <p className="text-muted-foreground mt-0.5">
                  {new Date(sale.created_at).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  })}
                </p>
              </div>
              <span className="text-base font-bold text-foreground tabular-nums">
                S/ {Number(sale.sale_total ?? sale.total_amount ?? sale.total ?? 0).toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de comprobante con RadioGroup */}
              <div className="space-y-2">
                <Label className="text-xs">Tipo de Comprobante</Label>
                <RadioGroup
                  value={comprobanteType}
                  onValueChange={(val) => {
                    setComprobanteType(val);
                    setDocNumber('');
                    setDocError('');
                  }}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/40 transition-colors">
                    <RadioGroupItem value="boleta" id="r_boleta" />
                    <Label htmlFor="r_boleta" className="cursor-pointer text-xs font-medium">
                      Boleta de Venta
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 rounded-lg border border-border p-3 cursor-pointer hover:bg-accent/40 transition-colors">
                    <RadioGroupItem value="factura" id="r_factura" />
                    <Label htmlFor="r_factura" className="cursor-pointer text-xs font-medium">
                      Factura Electrónica
                    </Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Documento del cliente */}
              <div className="space-y-1.5">
                <Label htmlFor="doc_number" className="text-xs">
                  {meta.docType}{' '}
                  {meta.required ? (
                    <span className="text-destructive">*</span>
                  ) : (
                    <span className="text-muted-foreground font-normal">(opcional)</span>
                  )}
                </Label>
                <Input
                  id="doc_number"
                  type="text"
                  inputMode="numeric"
                  maxLength={meta.digits}
                  value={docNumber}
                  onChange={(e) => {
                    setDocNumber(e.target.value);
                    setDocError('');
                  }}
                  placeholder={`${meta.digits} dígitos`}
                  className="h-9 text-xs font-mono"
                />
                {docError && (
                  <p className="text-[11px] text-destructive">{docError}</p>
                )}
              </div>

              {errorMsg && (
                <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-2.5 text-xs text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t border-border">
                <Button type="button" variant="outline" size="sm" onClick={handleClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" disabled={loading}>
                  {loading ? 'Emitiendo…' : 'Emitir Comprobante'}
                </Button>
              </div>
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
