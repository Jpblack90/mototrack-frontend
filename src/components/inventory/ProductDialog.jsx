import { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import NegativeMarginConfirm from './NegativeMarginConfirm';
import { toast } from 'sonner';
import { Sparkles, Camera, Pencil, AlertCircle, RefreshCw } from 'lucide-react';

const EMPTY_FORM = {
  name: '',
  sku: '',
  brand: '',
  cost_price: '',
  sale_price: '',
  stock: '',
  min_stock: '5',
};

export default function ProductDialog({
  open,
  onClose,
  onSuccess,
  mode = 'create',
  initialData = null,
  defaultTab = 'manual',
}) {
  const isEdit = mode === 'edit';
  const [tab, setTab] = useState(defaultTab);

  // ─── Estado formulario manual / edición ──────────────────────────────────
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [marginError, setMarginError] = useState(null); // { message, pendingPayload, method }

  // ─── Estado escaneo con IA ───────────────────────────────────────────────
  const [scanStep, setScanStep] = useState('select'); // 'select' | 'analyzing' | 'form' | 'scan_error'
  const [imagePreview, setImagePreview] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const [scanError, setScanError] = useState('');
  const [scanForm, setScanForm] = useState(EMPTY_FORM);
  const [scanSubmitting, setScanSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (open) {
      if (isEdit && initialData) {
        setForm({
          name: initialData.name ?? '',
          sku: initialData.sku ?? '',
          brand: initialData.brand ?? '',
          cost_price: initialData.cost_price ?? '',
          sale_price: initialData.sale_price ?? '',
          stock: initialData.stock ?? '',
          min_stock: initialData.min_stock ?? '5',
        });
        setTab('manual');
      } else {
        setForm(EMPTY_FORM);
        setScanForm(EMPTY_FORM);
        setScanStep('select');
        setImagePreview(null);
        setScanResult(null);
        setTab(defaultTab || 'manual');
      }
      setErrorMsg('');
      setScanError('');
      setMarginError(null);
    }
  }, [open, isEdit, initialData, defaultTab]);

  function handleManualChange(e) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  }

  function handleScanFormChange(e) {
    const { name, value } = e.target;
    setScanForm(prev => ({ ...prev, [name]: value }));
  }

  // ─── Envío formulario manual ─────────────────────────────────────────────
  async function submitManual(extraFields = {}) {
    setLoading(true);
    setErrorMsg('');

    const payload = {
      name: form.name.trim(),
      sku: form.sku.trim() || undefined,
      brand: form.brand.trim() || undefined,
      cost_price: Number(form.cost_price),
      sale_price: Number(form.sale_price),
      stock: Number(form.stock) || 0,
      min_stock: Number(form.min_stock) || 5,
      ...extraFields,
    };

    try {
      let res;
      if (isEdit) {
        res = await client.put(`/inventory/${initialData.id}`, payload);
        toast.success('Producto actualizado exitosamente');
      } else {
        res = await client.post('/inventory', payload);
        toast.success('Producto creado exitosamente');
      }
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      const errData = err.response?.data?.error;
      if (err.response?.status === 422) {
        setMarginError({
          message: errData?.message ?? 'Margen negativo.',
          pendingPayload: payload,
          target: 'manual',
        });
      } else {
        const msg = errData?.message ?? 'Error al guardar el producto.';
        setErrorMsg(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }

  // ─── Subida de imagen IA ─────────────────────────────────────────────────
  function fileToDataUrl(file) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const dataUrl = await fileToDataUrl(file);
    setImagePreview(dataUrl);
    setScanStep('analyzing');
    setScanError('');

    const base64 = dataUrl.split(',')[1];

    try {
      const { data } = await client.post('/inventory/scan', {
        image_base64: base64,
        mime_type: file.type,
      });
      const result = data.data;
      setScanResult(result);
      setScanForm({
        name: result.detected_name ?? '',
        brand: result.detected_brand ?? '',
        sku: '',
        cost_price: '',
        sale_price: '',
        stock: '',
        min_stock: '5',
      });
      setScanStep('form');
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        'No se pudo conectar con el servicio de IA. Intenta de nuevo.';
      setScanError(msg);
      setScanStep('scan_error');
    }
  }

  // ─── Envío producto escaneado con IA ─────────────────────────────────────
  async function submitScan(extraFields = {}) {
    setScanSubmitting(true);

    const payload = {
      name: scanForm.name.trim(),
      brand: scanForm.brand.trim() || undefined,
      sku: scanForm.sku.trim() || undefined,
      cost_price: Number(scanForm.cost_price),
      sale_price: Number(scanForm.sale_price),
      stock: Number(scanForm.stock) || 0,
      min_stock: Number(scanForm.min_stock) || 5,
      registration_method: 'ia',
      ai_confidence: scanResult?.confidence ?? null,
      ...extraFields,
    };

    try {
      const res = await client.post('/inventory', payload);
      toast.success('Producto creado vía IA exitosamente');
      onSuccess(res.data.data);
      onClose();
    } catch (err) {
      const errData = err.response?.data?.error;
      if (err.response?.status === 422) {
        setMarginError({
          message: errData?.message ?? 'Margen negativo.',
          pendingPayload: payload,
          target: 'scan',
        });
      } else {
        const msg = errData?.message ?? 'Error al crear el producto.';
        toast.error(msg);
      }
    } finally {
      setScanSubmitting(false);
    }
  }

  // ─── Handlers de margen negativo ─────────────────────────────────────────
  function handleForceMargin() {
    const payload = { ...marginError.pendingPayload, force: true };
    const target = marginError.target;
    setMarginError(null);
    if (target === 'scan') {
      submitScan(payload);
    } else {
      submitManual(payload);
    }
  }

  function handleCorrectMargin() {
    setMarginError(null);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold text-foreground">
              {isEdit ? 'Editar Producto' : 'Gestión de Producto'}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              {isEdit
                ? 'Actualiza los campos de stock, costo o precio de venta.'
                : 'Elige entre registro manual tradicional o escaneo inteligente con IA.'}
            </DialogDescription>
          </DialogHeader>

          {isEdit ? (
            /* Modo Edición: Formulario directo sin tabs */
            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitManual();
              }}
              className="space-y-4 pt-2"
            >
              <div className="space-y-1.5">
                <Label htmlFor="edit_name">
                  Nombre del producto <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="edit_name"
                  name="name"
                  value={form.name}
                  onChange={handleManualChange}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_sku">SKU</Label>
                  <Input
                    id="edit_sku"
                    name="sku"
                    value={form.sku}
                    onChange={handleManualChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_brand">Marca</Label>
                  <Input
                    id="edit_brand"
                    name="brand"
                    value={form.brand}
                    onChange={handleManualChange}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_cost">
                    Precio de Costo (S/) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_cost"
                    name="cost_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost_price}
                    onChange={handleManualChange}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_sale">
                    Precio de Venta (S/) <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="edit_sale"
                    name="sale_price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.sale_price}
                    onChange={handleManualChange}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="edit_stock">Stock Actual</Label>
                  <Input
                    id="edit_stock"
                    name="stock"
                    type="number"
                    min="0"
                    value={form.stock}
                    onChange={handleManualChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="edit_min">Stock Mínimo</Label>
                  <Input
                    id="edit_min"
                    name="min_stock"
                    type="number"
                    min="0"
                    value={form.min_stock}
                    onChange={handleManualChange}
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Guardando…' : 'Guardar Cambios'}
                </Button>
              </div>
            </form>
          ) : (
            /* Modo Creación con Tabs: Entrada Manual / Escaneo IA */
            <Tabs value={tab} onValueChange={setTab} className="flex flex-col w-full pt-1">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual" className="flex items-center gap-2">
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Entrada Manual</span>
                </TabsTrigger>
                <TabsTrigger value="scan" className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-primary" />
                  <span>Escaneo con IA</span>
                </TabsTrigger>
              </TabsList>

              {/* ── Tab: Entrada Manual ── */}
              <TabsContent value="manual" className="space-y-4 pt-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitManual();
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-1.5">
                    <Label htmlFor="new_name">
                      Nombre del producto <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="new_name"
                      name="name"
                      placeholder="Ej: Pastillas de freno Yamaha FZ16"
                      value={form.name}
                      onChange={handleManualChange}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_sku">SKU</Label>
                      <Input
                        id="new_sku"
                        name="sku"
                        placeholder="Ej: FZ-FRENO-01"
                        value={form.sku}
                        onChange={handleManualChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_brand">Marca</Label>
                      <Input
                        id="new_brand"
                        name="brand"
                        placeholder="Ej: Yamaha"
                        value={form.brand}
                        onChange={handleManualChange}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_cost">
                        Precio de Costo (S/) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new_cost"
                        name="cost_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.cost_price}
                        onChange={handleManualChange}
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_sale">
                        Precio de Venta (S/) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="new_sale"
                        name="sale_price"
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="0.00"
                        value={form.sale_price}
                        onChange={handleManualChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="new_stock">Stock Inicial</Label>
                      <Input
                        id="new_stock"
                        name="stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={form.stock}
                        onChange={handleManualChange}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="new_min">Stock Mínimo</Label>
                      <Input
                        id="new_min"
                        name="min_stock"
                        type="number"
                        min="0"
                        placeholder="5"
                        value={form.min_stock}
                        onChange={handleManualChange}
                      />
                    </div>
                  </div>

                  {errorMsg && (
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <div className="flex justify-end gap-3 pt-3 border-t border-border">
                    <Button variant="outline" type="button" onClick={onClose} disabled={loading}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'Creando…' : 'Crear Producto'}
                    </Button>
                  </div>
                </form>
              </TabsContent>

              {/* ── Tab: Escaneo con IA ── */}
              <TabsContent value="scan" className="space-y-4 pt-3">
                {scanStep === 'select' && (
                  <div className="space-y-4">
                    <p className="text-xs text-muted-foreground">
                      Sube una fotografía de la etiqueta o empaque del repuesto. MotoTrack extraerá automáticamente el nombre y marca.
                    </p>
                    <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-colors">
                      <Camera className="w-8 h-8 text-muted-foreground mb-2" />
                      <span className="text-sm font-medium text-foreground">Seleccionar o tomar imagen</span>
                      <span className="text-xs text-muted-foreground mt-1">Formatos soportados: JPG, PNG, WEBP</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFileChange}
                      />
                    </label>
                  </div>
                )}

                {scanStep === 'analyzing' && (
                  <div className="space-y-4 text-center py-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-40 object-contain rounded-lg border border-border bg-muted/20"
                      />
                    )}
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                      <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                      <span>Analizando imagen con modelo Gemini…</span>
                    </div>
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4 mx-auto" />
                      <Skeleton className="h-4 w-1/2 mx-auto" />
                    </div>
                  </div>
                )}

                {scanStep === 'scan_error' && (
                  <div className="space-y-4">
                    {imagePreview && (
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full max-h-32 object-contain rounded-lg border border-border"
                      />
                    )}
                    <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{scanError}</span>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button
                        variant="outline"
                        type="button"
                        onClick={() => {
                          setScanStep('select');
                          setScanError('');
                        }}
                      >
                        <RefreshCw className="w-3.5 h-3.5 mr-1" />
                        Reintentar
                      </Button>
                      <Button type="button" onClick={() => setTab('manual')}>
                        Usar entrada manual
                      </Button>
                    </div>
                  </div>
                )}

                {scanStep === 'form' && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitScan();
                    }}
                    className="space-y-4"
                  >
                    <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
                      <div className="flex items-center gap-2">
                        {imagePreview && (
                          <img
                            src={imagePreview}
                            alt="Miniatura"
                            className="w-12 h-12 object-cover rounded border border-border"
                          />
                        )}
                        <div>
                          <p className="text-xs font-semibold text-foreground">Detección IA completada</p>
                          <p className="text-[11px] text-muted-foreground">Verifica los datos y añade precios</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-emerald-700 bg-emerald-50 border-emerald-300">
                        {scanResult?.confidence ?? 90}% precisión
                      </Badge>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="scan_name">
                        Nombre detectado <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="scan_name"
                        name="name"
                        value={scanForm.name}
                        onChange={handleScanFormChange}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="scan_brand">Marca detectada</Label>
                        <Input
                          id="scan_brand"
                          name="brand"
                          value={scanForm.brand}
                          onChange={handleScanFormChange}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="scan_sku">SKU</Label>
                        <Input
                          id="scan_sku"
                          name="sku"
                          placeholder="Ej: SKU-1234"
                          value={scanForm.sku}
                          onChange={handleScanFormChange}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="scan_cost">
                          Precio Costo (S/) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="scan_cost"
                          name="cost_price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={scanForm.cost_price}
                          onChange={handleScanFormChange}
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="scan_sale">
                          Precio Venta (S/) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="scan_sale"
                          name="sale_price"
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="0.00"
                          value={scanForm.sale_price}
                          onChange={handleScanFormChange}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label htmlFor="scan_stock">Stock</Label>
                        <Input
                          id="scan_stock"
                          name="stock"
                          type="number"
                          min="0"
                          value={scanForm.stock}
                          onChange={handleScanFormChange}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="scan_min">Stock Mínimo</Label>
                        <Input
                          id="scan_min"
                          name="min_stock"
                          type="number"
                          min="0"
                          value={scanForm.min_stock}
                          onChange={handleScanFormChange}
                        />
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-3 border-t border-border">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setScanStep('select');
                          setImagePreview(null);
                        }}
                      >
                        Cambiar foto
                      </Button>
                      <div className="flex gap-2">
                        <Button variant="outline" type="button" onClick={onClose} disabled={scanSubmitting}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={scanSubmitting}>
                          {scanSubmitting ? 'Guardando…' : 'Crear Producto'}
                        </Button>
                      </div>
                    </div>
                  </form>
                )}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Flujo de margen negativo interceptado con AlertDialog */}
      {marginError && (
        <NegativeMarginConfirm
          message={marginError.message}
          onForce={handleForceMargin}
          onCorrect={handleCorrectMargin}
        />
      )}
    </>
  );
}
