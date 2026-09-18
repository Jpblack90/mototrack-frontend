import { useState, useRef } from 'react';
import client from '../../api/client';
import NegativeMarginConfirm from './NegativeMarginConfirm';

/**
 * Modal de alta por escaneo IA.
 * Flujo: select image → analyzing skeleton → prefilled form → submit
 * onSuccess: callback(savedProduct)
 * onSwitchToManual: el usuario elige registrar manualmente tras un error 503
 */
export default function ScanProductModal({ onSuccess, onClose, onSwitchToManual }) {
  // step: 'select' | 'analyzing' | 'form' | 'scan_error'
  const [step,       setStep]       = useState('select');
  const [imagePreview, setImagePreview] = useState(null); // data URL para mostrar
  const [scanResult, setScanResult] = useState(null);     // respuesta de /scan
  const [scanError,  setScanError]  = useState('');
  const fileInputRef = useRef(null);

  // Form fields (completados tras el escaneo)
  const [form,    setForm]    = useState({
    name: '', brand: '', sku: '', cost_price: '', sale_price: '', stock: '', min_stock: '',
  });
  const [submitError,  setSubmitError]  = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [marginError,   setMarginError]   = useState(null);

  // ─── Paso 1: seleccionar imagen y llamar a /scan ──────────────────────────

  async function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    // Preview
    const dataUrl = await fileToDataUrl(file);
    setImagePreview(dataUrl);
    setStep('analyzing');
    setScanError('');

    // Convertir a base64 puro (sin el prefix data:...;base64,)
    const base64 = dataUrl.split(',')[1];

    try {
      const { data } = await client.post('/inventory/scan', {
        image_base64: base64,
        mime_type: file.type,
      });
      const result = data.data;
      setScanResult(result);
      // Prellenar formulario con datos de la IA
      setForm(f => ({
        ...f,
        name:  result.detected_name  ?? '',
        brand: result.detected_brand ?? '',
      }));
      setStep('form');
    } catch (err) {
      setScanError(
        err.response?.data?.error?.message ??
        'No se pudo conectar con el servicio de IA. Intenta de nuevo.'
      );
      setStep('scan_error');
    }
  }

  // ─── Paso 2: enviar el formulario a /inventory ────────────────────────────

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
    setSubmitError('');
  }

  async function submit(extraFields = {}) {
    setSubmitLoading(true);
    setSubmitError('');
    const payload = {
      name:                form.name.trim(),
      brand:               form.brand.trim() || undefined,
      sku:                 form.sku.trim()   || undefined,
      cost_price:          Number(form.cost_price),
      sale_price:          Number(form.sale_price),
      stock:               Number(form.stock)     || 0,
      min_stock:           Number(form.min_stock) || 5,
      registration_method: 'ia',
      ai_confidence:       scanResult?.confidence ?? null,
      ...extraFields,
    };

    try {
      const res = await client.post('/inventory', payload);
      onSuccess(res.data.data);
    } catch (err) {
      const errData = err.response?.data?.error;
      // 422 en /inventory es exclusivamente NEGATIVE_MARGIN — no mezclar con validaciones (400)
      if (err.response?.status === 422) {
        setMarginError({ message: errData?.message ?? 'Margen negativo.', pendingPayload: payload });
      } else {
        setSubmitError(errData?.message ?? 'Error al crear el producto.');
      }
    } finally {
      setSubmitLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    submit();
  }

  function handleForce() {
    setMarginError(null);
    submit({ ...marginError.pendingPayload, force: true });
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  const confidence = scanResult?.confidence ?? 0;
  const confBadge  = confidence >= 80
    ? 'bg-emerald-50 text-emerald-700'
    : 'bg-amber-50 text-amber-700';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-slate-900/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <h2 className="font-semibold text-slate-900 text-lg">Nuevo repuesto — Escanear con IA</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">✕</button>
          </div>

          <div className="p-6 space-y-5">

            {/* ── STEP: select ── */}
            {step === 'select' && (
              <div className="space-y-4">
                <p className="text-sm text-slate-500">
                  Toma o sube una foto del empaque del repuesto. La IA detectará el nombre
                  y la marca automáticamente.
                </p>
                <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-colors">
                  <span className="text-3xl mb-2">📷</span>
                  <span className="text-sm font-medium text-slate-600">Seleccionar imagen</span>
                  <span className="text-xs text-slate-400 mt-1">JPG, PNG, WEBP</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
            )}

            {/* ── STEP: analyzing ── */}
            {step === 'analyzing' && (
              <div className="space-y-4">
                {/* Preview de la imagen */}
                {imagePreview && (
                  <img src={imagePreview} alt="Imagen seleccionada"
                    className="w-full h-40 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                )}
                <p className="text-sm font-medium text-slate-600 text-center">
                  Analizando imagen con IA…
                </p>
                {/* Skeleton pulsante */}
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3" />
                </div>
              </div>
            )}

            {/* ── STEP: scan_error ── */}
            {step === 'scan_error' && (
              <div className="space-y-4">
                {imagePreview && (
                  <img src={imagePreview} alt="Imagen seleccionada"
                    className="w-full h-32 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                )}
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {scanError}
                </div>
                <div className="flex gap-3">
                  <button onClick={() => { setStep('select'); setScanError(''); }}
                    className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors text-sm">
                    Reintentar
                  </button>
                  <button onClick={onSwitchToManual}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm">
                    Usar registro manual
                  </button>
                </div>
              </div>
            )}

            {/* ── STEP: form (formulario pre-llenado) ── */}
            {step === 'form' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Preview pequeño */}
                {imagePreview && (
                  <img src={imagePreview} alt="Imagen analizada"
                    className="w-full h-32 object-contain rounded-lg border border-slate-200 bg-slate-50" />
                )}

                {/* Resultados de la IA */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-slate-500">Detectado por IA:</span>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confBadge}`}>
                    Confianza {confidence}%
                  </span>
                  {scanResult?.requires_confirmation && (
                    <div className="w-full bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded-lg">
                      ⚠️ Confianza baja — revisa los datos antes de guardar.
                    </div>
                  )}
                </div>

                {/* Nombre (pre-llenado) */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nombre del producto <span className="text-red-500">*</span>
                  </label>
                  <input name="name" value={form.name} onChange={handleChange} required
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                </div>

                {/* Marca + SKU */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Marca</label>
                    <input name="brand" value={form.brand} onChange={handleChange}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">SKU</label>
                    <input name="sku" value={form.sku} onChange={handleChange}
                      placeholder="Opcional"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                  </div>
                </div>

                {/* Precios (el usuario los completa) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio de costo (S/) <span className="text-red-500">*</span>
                    </label>
                    <input name="cost_price" type="number" min="0" step="0.01"
                      value={form.cost_price} onChange={handleChange} required placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Precio de venta (S/) <span className="text-red-500">*</span>
                    </label>
                    <input name="sale_price" type="number" min="0" step="0.01"
                      value={form.sale_price} onChange={handleChange} required placeholder="0.00"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                  </div>
                </div>

                {/* Stock */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock inicial</label>
                    <input name="stock" type="number" min="0"
                      value={form.stock} onChange={handleChange} placeholder="0"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Stock mínimo</label>
                    <input name="min_stock" type="number" min="0"
                      value={form.min_stock} onChange={handleChange} placeholder="5"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-3 py-2 rounded-lg">
                    {submitError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={onClose}
                    className="border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg px-4 py-2 transition-colors text-sm">
                    Cancelar
                  </button>
                  <button type="submit" disabled={submitLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm">
                    {submitLoading ? 'Guardando…' : 'Crear producto'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Modal de margen negativo */}
      {marginError && (
        <NegativeMarginConfirm
          message={marginError.message}
          onForce={handleForce}
          onCorrect={() => setMarginError(null)}
        />
      )}
    </>
  );
}
