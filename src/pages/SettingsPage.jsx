import { useState, useEffect, useRef, useCallback } from 'react';
import { useCompany } from '../hooks/useCompany';
import { usePlan } from '../hooks/usePlan';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Skeleton } from '../components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../components/ui/table';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import { toast } from 'sonner';
import { cn } from 'cn';
import {
  Settings,
  Building2,
  Image as ImageIcon,
  Sliders,
  AlertTriangle,
  Upload,
  Trash2,
  Save,
  Loader2,
  CheckCircle2,
  CreditCard,
  Sparkles,
  Users,
  Receipt,
  Globe,
  ShieldCheck,
  RefreshCw,
  Info,
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { company, loading, error, updateCompany } = useCompany();
  const { planData, loading: planLoading } = usePlan();
  const fileInputRef = useRef(null);

  const supportEmail = import.meta.env.VITE_SUPPORT_EMAIL || 'soporte@mototrack.pe';

  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    telefono: '',
    email: '',
    logo_data: null,
    igv_percent: '18',
    approval_threshold: '100',
    not_picked_up_days: '15',
    pse_provider: 'simulado',
    pse_url: '',
    pse_token: '',
    series_boleta: 'B001',
    series_factura: 'F001',
    series_nc_boleta: 'BC01',
    series_nc_factura: 'FC01',
  });

  const [seriesList, setSeriesList] = useState([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [testingPse, setTestingPse] = useState(false);
  const [replacingToken, setReplacingToken] = useState(false);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustSerie, setAdjustSerie] = useState(null);
  const [newLastNumber, setNewLastNumber] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const maxAiScans = planData?.plan?.max_ai_scans_month;
  const currentAiScans = planData?.ai_scans_this_month ?? 0;
  const aiScansPct = maxAiScans ? Math.min(100, Math.round((currentAiScans / maxAiScans) * 100)) : 0;

  const maxUsers = planData?.plan?.max_users;
  const currentUsers = planData?.users_active ?? 0;
  const usersPct = maxUsers ? Math.min(100, Math.round((currentUsers / maxUsers) * 100)) : 0;

  const fetchSeries = useCallback(async () => {
    if (!isAdmin) return;
    setLoadingSeries(true);
    try {
      const { data: res } = await client.get('/company/series');
      setSeriesList(res.data || []);
    } catch (err) {
      console.error('Error al cargar series:', err);
    } finally {
      setLoadingSeries(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    const t = setTimeout(() => {
      fetchSeries();
    }, 0);
    return () => clearTimeout(t);
  }, [fetchSeries]);

  useEffect(() => {
    if (company) {
      const t = setTimeout(() => {
        setForm({
          ruc: company.ruc ?? '',
          razon_social: company.razon_social ?? '',
          nombre_comercial: company.nombre_comercial ?? '',
          direccion: company.direccion ?? '',
          telefono: company.telefono ?? '',
          email: company.email ?? '',
          logo_data: company.logo_data ?? null,
          igv_percent: String(
            Math.round((company.igv_rate != null ? company.igv_rate : 0.18) * 100)
          ),
          approval_threshold: String(
            company.approval_threshold != null ? company.approval_threshold : 100
          ),
          not_picked_up_days: String(
            company.not_picked_up_days != null ? company.not_picked_up_days : 15
          ),
          pse_provider: company.pse_provider || 'simulado',
          pse_url: company.pse_url || '',
          pse_token: '',
          series_boleta: company.series_boleta || 'B001',
          series_factura: company.series_factura || 'F001',
          series_nc_boleta: company.series_nc_boleta || 'BC01',
          series_nc_factura: company.series_nc_factura || 'FC01',
        });
        setReplacingToken(false);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [company]);

  async function handleTestPse() {
    setTestingPse(true);
    try {
      const body = {
        pse_url: form.pse_url?.trim() || undefined,
        pse_token: form.pse_token?.trim() || undefined,
      };
      const { data: res } = await client.post('/company/pse/test', body);
      toast.success(res.data?.data?.message || res.data?.message || 'Conexión con Nubefact establecida correctamente.', {
        icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      });
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message || 'Error al conectar con Nubefact.';
      toast.error(msg);
    } finally {
      setTestingPse(false);
    }
  }

  async function handleAdjustCorrelative() {
    if (!adjustSerie) return;
    const num = parseInt(newLastNumber, 10);
    if (isNaN(num) || num < 0) {
      toast.error('Ingresa un número correlativo válido mayor o igual a 0.');
      return;
    }
    if (num < adjustSerie.last_number) {
      toast.error(`El nuevo correlativo no puede ser menor al actual (${adjustSerie.last_number}).`);
      return;
    }

    setAdjusting(true);
    try {
      await client.put(`/company/series/${adjustSerie.serie}`, { last_number: num });
      toast.success(`Correlativo de la serie ${adjustSerie.serie} actualizado a ${num}.`);
      setAdjustDialogOpen(false);
      setAdjustSerie(null);
      fetchSeries();
    } catch (err) {
      toast.error(err.response?.data?.error?.message || 'Error al actualizar correlativo.');
    } finally {
      setAdjusting(false);
    }
  }

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  // ─── Compresión de Logo en el Navegador con Canvas ────────────────────────
  function handleLogoFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.match(/^image\/(png|jpeg|jpg|webp)$/i)) {
      toast.error('Formato no soportado. Selecciona una imagen PNG, JPEG o WebP.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (loadEvent) => {
      const img = new Image();
      img.onload = () => {
        // Redimensionar si el lado mayor supera 512px
        const maxSide = 512;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP con calidad 0.85
        const base64Data = canvas.toDataURL('image/webp', 0.85);

        // Validar tamaño máx 300 KB
        const payloadBytes = (base64Data.split(',')[1].length * 3) / 4;
        if (payloadBytes > 300 * 1024) {
          toast.error('La imagen optimizada excede los 300 KB permitidos.');
          return;
        }

        handleChange('logo_data', base64Data);
        toast.success('Logo optimizado y cargado correctamente.');
      };
      img.onerror = () => {
        toast.error('No se pudo procesar la imagen seleccionada.');
      };
      img.src = loadEvent.target.result;
    };
    reader.readAsDataURL(file);

    // Resetear input para permitir seleccionar el mismo archivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  function handleRemoveLogo() {
    handleChange('logo_data', null);
    toast.info('Logo eliminado de la configuración.');
  }

  // ─── Guardar Cambios ──────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.razon_social.trim()) {
      toast.error('La Razón Social es obligatoria.');
      return;
    }

    const igvNum = parseFloat(form.igv_percent);
    if (isNaN(igvNum) || igvNum < 0 || igvNum > 30) {
      toast.error('La tasa de IGV debe ser un valor entre 0% y 30%.');
      return;
    }

    const thresholdNum = parseFloat(form.approval_threshold);
    if (isNaN(thresholdNum) || thresholdNum < 0) {
      toast.error('El umbral de aprobación debe ser mayor o igual a 0.');
      return;
    }

    const daysNum = parseInt(form.not_picked_up_days, 10);
    if (isNaN(daysNum) || daysNum < 1 || daysNum > 365) {
      toast.error('Los días para moto no recogida deben estar entre 1 y 365.');
      return;
    }

    setSaving(true);
    const payload = {
      ruc: form.ruc.trim() ? form.ruc.trim() : null,
      razon_social: form.razon_social.trim(),
      nombre_comercial: form.nombre_comercial.trim()
        ? form.nombre_comercial.trim()
        : null,
      direccion: form.direccion.trim() ? form.direccion.trim() : null,
      telefono: form.telefono.trim() ? form.telefono.trim() : null,
      email: form.email.trim() ? form.email.trim() : null,
      logo_data: form.logo_data,
      igv_rate: Number((igvNum / 100).toFixed(3)),
      approval_threshold: thresholdNum,
      not_picked_up_days: daysNum,
    };

    if (isAdmin) {
      payload.pse_provider = form.pse_provider || 'simulado';
      payload.pse_url = form.pse_url?.trim() || null;
      payload.series_boleta = form.series_boleta?.trim() || 'B001';
      payload.series_factura = form.series_factura?.trim() || 'F001';
      payload.series_nc_boleta = form.series_nc_boleta?.trim() || 'BC01';
      payload.series_nc_factura = form.series_nc_factura?.trim() || 'FC01';
      if (form.pse_token?.trim()) {
        payload.pse_token = form.pse_token.trim();
      }
    }

    const res = await updateCompany(payload);
    setSaving(false);

    if (res.ok) {
      setReplacingToken(false);
      setForm((prev) => ({ ...prev, pse_token: '' }));
      fetchSeries();
      toast.success('Configuración guardada exitosamente.', {
        icon: <CheckCircle2 className="w-4 h-4 text-success" />,
      });
    } else {
      toast.error(res.error || 'Error al guardar los cambios.');
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto py-2">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full col-span-full" />
        </div>
      </div>
    );
  }

  const hasMissingRuc = !form.ruc || !form.ruc.trim();

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/60 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Settings className="w-6 h-6 text-primary" />
            Configuración del Taller
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Administra los datos fiscales, identidad visual y parámetros operativos de tu taller.
          </p>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={saving}
          className="gap-2 shrink-0 shadow-xs"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar cambios</span>
            </>
          )}
        </Button>
      </div>

      {/* Banner de advertencia si no tiene RUC configurado */}
      {hasMissingRuc && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-warning/30 bg-warning/10 text-warning">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="text-sm">
            <p className="font-semibold">Completa el RUC para poder emitir comprobantes.</p>
            <p className="text-xs text-warning/90 mt-0.5">
              Sin un RUC y Razón Social válidos registrados, el módulo de facturación bloqueará la emisión de boletas y facturas.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Card: Mi Plan (solo visible para Administradores) */}
      {isAdmin && (
        <Card className="border border-border/80 shadow-xs bg-card">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                  <CreditCard className="w-4 h-4 text-primary" />
                  Mi Plan
                </CardTitle>
                <CardDescription className="text-xs">
                  Detalles de tu suscripción y cupo de recursos asignados a tu taller.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-sm font-bold text-foreground">
                  {planData?.plan?.name || 'Plan MotoTrack'}
                </span>
                <span className="text-xs text-muted-foreground font-semibold">
                  (S/ {Number(planData?.plan?.price_pen || 99).toFixed(2)} / mes)
                </span>
                {planData?.status === 'trial' ? (
                  <Badge variant="outline" className="text-warning bg-warning/10 border-warning/30 text-[11px] font-medium">
                    Prueba: {planData.days_left ?? 0} días restantes
                  </Badge>
                ) : (
                  <Badge variant="default" className="text-[11px] font-medium">
                    Activo
                  </Badge>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {planLoading ? (
              <div className="space-y-3 py-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-2 w-full" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Barra de Progreso 1: Escaneos IA */}
                <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Escaneos de repuestos con IA
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {planData?.ai_scans_this_month ?? 0} / {planData?.plan?.max_ai_scans_month ?? 'Ilimitados'} este mes
                    </span>
                  </div>
                  <Progress
                    value={aiScansPct}
                    className={cn(
                      aiScansPct >= 100
                        ? '[&>[data-slot=progress-indicator]]:bg-destructive'
                        : aiScansPct >= 80
                        ? '[&>[data-slot=progress-indicator]]:bg-warning'
                        : '[&>[data-slot=progress-indicator]]:bg-success'
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {planData?.plan?.max_ai_scans_month
                      ? `${Math.max(0, planData.plan.max_ai_scans_month - (planData.ai_scans_this_month ?? 0))} escaneos disponibles en el periodo actual.`
                      : 'Escaneos ilimitados.'}
                  </p>
                </div>

                {/* Barra de Progreso 2: Usuarios Activos */}
                <div className="space-y-2 p-3 rounded-xl border border-border/60 bg-muted/20">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-primary" />
                      Usuarios activos
                    </span>
                    <span className="font-mono text-muted-foreground">
                      {planData?.users_active ?? 0} / {planData?.plan?.max_users ?? 'Ilimitados'} usuarios
                    </span>
                  </div>
                  <Progress
                    value={usersPct}
                    className={cn(
                      usersPct >= 100
                        ? '[&>[data-slot=progress-indicator]]:bg-destructive'
                        : usersPct >= 80
                        ? '[&>[data-slot=progress-indicator]]:bg-warning'
                        : '[&>[data-slot=progress-indicator]]:bg-success'
                    )}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    {planData?.plan?.max_users
                      ? `${Math.max(0, planData.plan.max_users - (planData.users_active ?? 0))} cupos de usuario activos restantes.`
                      : 'Usuarios ilimitados.'}
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-border/60 text-xs text-muted-foreground">
              <span>
                ¿Necesitas más? Escríbenos a{' '}
                <a
                  href={`mailto:${supportEmail}`}
                  className="font-semibold text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {supportEmail}
                </a>
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1: Datos Fiscales */}
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <Building2 className="w-4 h-4 text-primary" />
                Datos Fiscales y Legales
              </CardTitle>
              <CardDescription className="text-xs">
                Información del emisor que se imprimirá en los comprobantes y XML.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="ruc" className="text-xs font-semibold">
                  RUC <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="ruc"
                  value={form.ruc}
                  onChange={(e) =>
                    handleChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))
                  }
                  placeholder="20123456786 (11 dígitos)"
                  className="font-mono text-sm"
                  maxLength={11}
                />
                <p className="text-[11px] text-muted-foreground">
                  Debe iniciar con 10, 15, 16, 17 o 20 y cumplir algoritmo SUNAT (Módulo 11).
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="razon_social" className="text-xs font-semibold">
                  Razón Social <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="razon_social"
                  value={form.razon_social}
                  onChange={(e) => handleChange('razon_social', e.target.value)}
                  placeholder="MotoTrack S.A.C."
                  maxLength={200}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nombre_comercial" className="text-xs font-semibold">
                  Nombre Comercial
                </Label>
                <Input
                  id="nombre_comercial"
                  value={form.nombre_comercial}
                  onChange={(e) => handleChange('nombre_comercial', e.target.value)}
                  placeholder="MotoTrack Taller & Repuestos"
                  maxLength={150}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="direccion" className="text-xs font-semibold">
                  Dirección Fiscal
                </Label>
                <Input
                  id="direccion"
                  value={form.direccion}
                  onChange={(e) => handleChange('direccion', e.target.value)}
                  placeholder="Av. Principal 123, Lima, Perú"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="telefono" className="text-xs font-semibold">
                    Teléfono
                  </Label>
                  <Input
                    id="telefono"
                    value={form.telefono}
                    onChange={(e) => handleChange('telefono', e.target.value)}
                    placeholder="01-234-5678 / 987654321"
                    maxLength={20}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="contacto@mototrack.pe"
                    maxLength={150}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Logo del Taller */}
          <Card className="border border-border/80 shadow-xs flex flex-col justify-between">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                <ImageIcon className="w-4 h-4 text-primary" />
                Logo del Taller
              </CardTitle>
              <CardDescription className="text-xs">
                Visible en la cabecera del ticket térmico y comprobantes impresos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl bg-muted/20 min-h-[180px]">
                {form.logo_data ? (
                  <div className="space-y-3 text-center">
                    <img
                      src={form.logo_data}
                      alt="Logo del taller"
                      className="max-h-24 max-w-[200px] object-contain mx-auto rounded-md shadow-xs bg-white p-2 border border-border/80"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Vista previa del logo actual
                    </p>
                  </div>
                ) : (
                  <div className="text-center space-y-2 text-muted-foreground">
                    <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center mx-auto text-muted-foreground/60">
                      <ImageIcon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium">Ningún logo configurado</p>
                    <p className="text-[11px] text-muted-foreground/80 max-w-[240px]">
                      PNG, JPEG o WebP optimizado automáticamente a 512px (máx 300 KB).
                    </p>
                  </div>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handleLogoFile}
              />

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="gap-2 flex-1"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{form.logo_data ? 'Cambiar logo' : 'Subir logo'}</span>
                </Button>

                {form.logo_data && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Quitar</span>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Card 3: Parámetros Operativos */}
        <Card className="border border-border/80 shadow-xs">
          <CardHeader className="pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <Sliders className="w-4 h-4 text-primary" />
              Parámetros Operativos del Sistema
            </CardTitle>
            <CardDescription className="text-xs">
              Configura los valores que rigen la facturación, ventas y órdenes de trabajo.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <Label htmlFor="igv_percent" className="text-xs font-semibold">
                Tasa de IGV (%)
              </Label>
              <div className="relative">
                <Input
                  id="igv_percent"
                  type="number"
                  min="0"
                  max="30"
                  step="0.1"
                  value={form.igv_percent}
                  onChange={(e) => handleChange('igv_percent', e.target.value)}
                  className="pr-8 font-mono"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  %
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Tasa legal actual en Perú: 18%. Rige los cálculos de nuevas ventas y tickets.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="approval_threshold" className="text-xs font-semibold">
                Umbral de Aprobación de OT (S/)
              </Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">
                  S/
                </span>
                <Input
                  id="approval_threshold"
                  type="number"
                  min="0"
                  step="1"
                  value={form.approval_threshold}
                  onChange={(e) => handleChange('approval_threshold', e.target.value)}
                  className="pl-8 font-mono"
                />
              </div>
              <p className="text-[11px] text-muted-foreground">
                Reparaciones adicionales que superen este monto pasarán a <i>pendiente_aprobacion</i>.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="not_picked_up_days" className="text-xs font-semibold">
                Días para Marcar Moto No Recogida
              </Label>
              <Input
                id="not_picked_up_days"
                type="number"
                min="1"
                max="365"
                step="1"
                value={form.not_picked_up_days}
                onChange={(e) => handleChange('not_picked_up_days', e.target.value)}
                className="font-mono"
              />
              <p className="text-[11px] text-muted-foreground">
                Días de gracia tras terminación antes de marcar el estado <i>no_recogido</i>.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Card 4: Facturación Electrónica (PSE) */}
        {isAdmin && (
          <Card className="border border-border/80 shadow-xs">
            <CardHeader className="pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
                    <Receipt className="w-4 h-4 text-primary" />
                    Facturación Electrónica (PSE)
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Conecta tu cuenta de Proveedor de Servicios Electrónicos (PSE) bajo el modelo &quot;Trae tu facturador&quot;.
                  </CardDescription>
                </div>
                <Badge variant="outline" className={form.pse_provider === 'nubefact' ? 'text-primary border-primary/30 bg-primary/10' : 'text-muted-foreground'}>
                  {form.pse_provider === 'nubefact' ? 'Nubefact (Producción)' : 'Simulado (Pruebas)'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Selector de Proveedor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="pse_provider" className="text-xs font-semibold">
                    Proveedor de Facturación
                  </Label>
                  <Select
                    value={form.pse_provider}
                    onValueChange={(val) => handleChange('pse_provider', val)}
                  >
                    <SelectTrigger id="pse_provider">
                      <SelectValue placeholder="Selecciona un proveedor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="simulado">Simulado (Desarrollo y pruebas internas)</SelectItem>
                      <SelectItem value="nubefact">Nubefact (API Oficial REST JSON)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-[11px] text-muted-foreground">
                    En modo simulado los comprobantes se generan sin validez tributaria ante SUNAT.
                  </p>
                </div>

                {form.pse_provider === 'nubefact' && (
                  <div className="space-y-1.5 flex flex-col justify-end">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestPse}
                      disabled={testingPse || (!form.pse_url && !company?.pse_url)}
                      className="gap-2 w-full sm:w-auto"
                    >
                      {testingPse ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Verificando conexión...</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3.5 h-3.5 text-primary" />
                          <span>Probar conexión con Nubefact</span>
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </div>

              {form.pse_provider === 'nubefact' && (
                <div className="space-y-5 rounded-lg border border-border/60 bg-muted/20 p-4">
                  <div className="flex items-start gap-2.5 text-xs text-muted-foreground">
                    <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span>
                      Las credenciales y series configuradas deben corresponder exactamente a tu cuenta registrada en Nubefact. El token es almacenado de forma cifrada (AES-256-GCM).
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Ruta / URL */}
                    <div className="space-y-1.5">
                      <Label htmlFor="pse_url" className="text-xs font-semibold">
                        Ruta de API (URL de Nubefact)
                      </Label>
                      <Input
                        id="pse_url"
                        placeholder="https://api.nubefact.com/api/v1/..."
                        value={form.pse_url}
                        onChange={(e) => handleChange('pse_url', e.target.value)}
                        className="font-mono text-xs"
                      />
                      <p className="text-[11px] text-muted-foreground">
                        URL provista en el panel de desarrolladores de Nubefact.
                      </p>
                    </div>

                    {/* Token de autorización */}
                    <div className="space-y-1.5">
                      <Label htmlFor="pse_token" className="text-xs font-semibold">
                        Token de Autorización
                      </Label>
                      {company?.pse_token_set && !replacingToken ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 h-9 px-3 rounded-md border border-input bg-muted/40 text-xs font-mono text-muted-foreground">
                            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                            <span>Token guardado ••••{company.pse_token_last4 || ''}</span>
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setReplacingToken(true)}
                            className="text-xs"
                          >
                            Reemplazar
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Input
                            id="pse_token"
                            type="password"
                            placeholder="Ingresa tu token de Nubefact"
                            value={form.pse_token}
                            onChange={(e) => handleChange('pse_token', e.target.value)}
                            className="font-mono text-xs"
                          />
                          {company?.pse_token_set && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setReplacingToken(false);
                                handleChange('pse_token', '');
                              }}
                              className="text-xs text-muted-foreground"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      )}
                      <p className="text-[11px] text-muted-foreground">
                        Clave privada secreta de tu cuenta. Nunca se expone en el navegador.
                      </p>
                    </div>
                  </div>

                  {/* Configuración de Series */}
                  <div className="pt-2">
                    <Label className="text-xs font-semibold block mb-2">
                      Series de Comprobantes Electrónicos
                    </Label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-medium">Boleta</span>
                        <Input
                          placeholder="B001"
                          maxLength={4}
                          value={form.series_boleta}
                          onChange={(e) => handleChange('series_boleta', e.target.value.toUpperCase())}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-medium">Factura</span>
                        <Input
                          placeholder="F001"
                          maxLength={4}
                          value={form.series_factura}
                          onChange={(e) => handleChange('series_factura', e.target.value.toUpperCase())}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-medium">NC Boleta</span>
                        <Input
                          placeholder="BC01"
                          maxLength={4}
                          value={form.series_nc_boleta}
                          onChange={(e) => handleChange('series_nc_boleta', e.target.value.toUpperCase())}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[11px] text-muted-foreground font-medium">NC Factura</span>
                        <Input
                          placeholder="FC01"
                          maxLength={4}
                          value={form.series_nc_factura}
                          onChange={(e) => handleChange('series_nc_factura', e.target.value.toUpperCase())}
                          className="font-mono text-xs uppercase"
                        />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1.5">
                      Las series deben tener 4 caracteres alfanuméricos (Bxxx para boletas, Fxxx para facturas).
                    </p>
                  </div>
                </div>
              )}

              {/* Gestión de Correlativos Iniciales */}
              <div className="pt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-foreground">
                      Correlativos Numéricos Actuales
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Último número correlativo emitido en cada serie de tu taller.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={fetchSeries}
                    disabled={loadingSeries}
                    className="gap-1.5 text-xs text-muted-foreground"
                  >
                    <RefreshCw className={cn("w-3 h-3", loadingSeries && "animate-spin")} />
                    <span>Actualizar</span>
                  </Button>
                </div>

                <div className="rounded-lg border border-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/40">
                        <TableHead className="text-xs font-semibold">Tipo</TableHead>
                        <TableHead className="text-xs font-semibold">Serie</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Último Número Emitido</TableHead>
                        <TableHead className="text-xs font-semibold text-right">Acción</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {seriesList.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-4">
                            No hay series registradas aún. Se crearán automáticamente con tu primer comprobante.
                          </TableCell>
                        </TableRow>
                      ) : (
                        seriesList.map((s) => (
                          <TableRow key={s.serie}>
                            <TableCell className="text-xs font-medium">{s.label}</TableCell>
                            <TableCell className="text-xs font-mono font-semibold">{s.serie}</TableCell>
                            <TableCell className="text-xs font-mono font-semibold text-right tabular-nums">
                              {String(s.last_number).padStart(8, '0')} ({s.last_number})
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setAdjustSerie(s);
                                  setNewLastNumber(String(s.last_number));
                                  setAdjustDialogOpen(true);
                                }}
                                className="h-7 text-xs"
                              >
                                Ajustar
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botón flotante o al pie */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            disabled={saving}
            size="lg"
            className="gap-2 min-w-[180px] shadow-sm font-semibold"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Guardando cambios...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar cambios</span>
              </>
            )}
          </Button>
        </div>
      </form>

      {/* Modal de confirmación para ajustar correlativo */}
      <AlertDialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajustar correlativo inicial ({adjustSerie?.serie})</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 text-xs">
              <p>
                Esta acción se utiliza al migrar desde otro sistema de facturación electrónica para continuar la numeración consecutiva.
              </p>
              <p className="font-semibold text-destructive">
                El número correlativo solo puede aumentarse y nunca reducirse. Esta acción no se puede deshacer.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-2 space-y-1.5">
            <Label htmlFor="new_correlative" className="text-xs font-semibold">
              Nuevo último número emitido (actual: {adjustSerie?.last_number})
            </Label>
            <Input
              id="new_correlative"
              type="number"
              min={adjustSerie?.last_number ?? 0}
              value={newLastNumber}
              onChange={(e) => setNewLastNumber(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              El siguiente comprobante emitido en esta serie tendrá el número {Number(newLastNumber || 0) + 1}.
            </p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={adjusting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleAdjustCorrelative();
              }}
              disabled={adjusting || !newLastNumber || Number(newLastNumber) < (adjustSerie?.last_number ?? 0)}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {adjusting ? 'Actualizando...' : 'Confirmar ajuste'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
