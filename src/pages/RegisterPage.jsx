import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { Badge } from '../components/ui/badge';
import { toast } from 'sonner';
import { Eye, EyeOff, ArrowRight, ArrowLeft, CheckCircle2, Circle, Sparkles } from 'lucide-react';

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  // Paso actual: 1 (Taller) o 2 (Administrador)
  const [step, setStep] = useState(1);

  // Datos del formulario
  const [formData, setFormData] = useState({
    razon_social: '',
    nombre_comercial: '',
    ruc: '',
    admin_name: '',
    email: '',
    password: '',
    confirm_password: '',
    accept_terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Validación de política de contraseñas en vivo
  const hasMinLength = formData.password.length >= 8;
  const hasLetter = /[a-zA-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const isPasswordValid = hasMinLength && hasLetter && hasNumber;
  const isMatch = formData.password && formData.password === formData.confirm_password;

  function handleChange(field, value) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function handleNextStep(e) {
    e.preventDefault();
    if (!formData.razon_social.trim()) {
      toast.error('Por favor ingresa la razón social de tu taller.');
      return;
    }
    if (formData.ruc.trim() && formData.ruc.trim().length !== 11) {
      toast.error('El RUC debe tener 11 dígitos.');
      return;
    }
    setStep(2);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!formData.admin_name.trim()) {
      toast.error('Ingresa tu nombre completo.');
      return;
    }
    if (!formData.email.trim()) {
      toast.error('Ingresa tu correo electrónico.');
      return;
    }
    if (!isPasswordValid) {
      toast.error('La contraseña debe tener al menos 8 caracteres, una letra y un número.');
      return;
    }
    if (formData.password !== formData.confirm_password) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }
    if (!formData.accept_terms) {
      toast.error('Debes aceptar el tratamiento de datos personales conforme a la Ley N° 29733.');
      return;
    }

    setLoading(true);

    try {
      // 1. Registrar empresa y cuenta admin en backend
      const payload = {
        razon_social: formData.razon_social.trim(),
        nombre_comercial: formData.nombre_comercial.trim() || undefined,
        ruc: formData.ruc.trim() || undefined,
        admin_name: formData.admin_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        accept_terms: true,
      };

      await client.post('/auth/register-company', payload);

      // 2. Iniciar sesión usando la función login() de AuthContext para entrar directo a /dashboard
      await login(formData.email.trim().toLowerCase(), formData.password);

      toast.success('¡Taller registrado exitosamente! Bienvenido a tus 14 días de prueba gratis.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const errorMsg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al registrar el taller. Verifica tus datos de conexión.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background lg:bg-muted flex flex-col lg:flex-row items-stretch lg:items-center justify-start lg:justify-center lg:p-6">
      {/* ── TARJETA DIVIDIDA (desktop lg+) / FLUJO COMPACTO (< lg) ── */}
      <div className="w-full flex-1 lg:flex-initial lg:max-w-4xl lg:h-140 grid lg:grid-cols-2 overflow-hidden lg:rounded-2xl lg:border lg:border-border bg-background lg:bg-card lg:shadow-xl">
        {/* ── PANEL IZQUIERDO — Marca (oscuro) ── */}
        <div className="relative hidden lg:flex flex-col overflow-hidden bg-sidebar">
          {/* Cabecera centrada: logo y lema animado */}
          <div className="flex flex-col items-center pt-8 px-6 text-center z-10 shrink-0">
            <img
              src="/logo.png"
              alt="MotoTrack"
              className="w-44 animate-splash-in"
            />
            <p className="mt-2.5 text-sm font-semibold text-sidebar-foreground animate-splash-tagline leading-snug">
              Controla tu taller,
              <br />
              impulsa tu negocio
            </p>
            <Badge variant="outline" className="mt-3 bg-primary/10 border-primary/30 text-primary text-[11px] px-2.5 py-0.5">
              14 días de prueba gratis
            </Badge>
          </div>

          {/* Moto con neón rojo anclada abajo */}
          <div className="flex-1 min-h-0 w-full flex items-end justify-center overflow-hidden">
            <img
              src="/login-hero.png"
              alt=""
              aria-hidden="true"
              className="h-full w-auto object-contain object-bottom mask-x-from-45% mask-x-to-95% mask-t-from-40% mask-t-to-90%"
            />
          </div>
        </div>

        {/* ── PANEL DERECHO — Formulario Stepper ── */}
        <div className="flex flex-col flex-1 lg:flex-initial lg:h-full justify-between">
          {/* Franja superior solo móvil */}
          <div className="lg:hidden flex items-center justify-between bg-sidebar py-3 px-4 shadow-xs">
            <img src="/logo.png" alt="MotoTrack" className="w-32" />
            <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-[10px]">
              14 días gratis
            </Badge>
          </div>

          <div className="flex flex-1 items-center justify-center p-6 lg:p-8 overflow-y-auto">
            <div className="w-full max-w-sm space-y-5">
              {/* Encabezado y Stepper */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <h1 className="text-xl font-bold tracking-tight text-foreground">
                    Crea tu taller
                  </h1>
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                    Paso {step} de 2
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {step === 1
                    ? 'Ingresa los datos generales de tu taller'
                    : 'Configura tu cuenta de acceso como Administrador'}
                </p>

                {/* Barra de progreso visual */}
                <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full bg-primary transition-all duration-300 ease-in-out ${
                      step === 1 ? 'w-1/2' : 'w-full'
                    }`}
                  />
                </div>
              </div>

              {/* ── PASO 1: DATOS DEL TALLER ── */}
              {step === 1 && (
                <form onSubmit={handleNextStep} className="space-y-3.5">
                  <div className="space-y-1">
                    <Label htmlFor="razon_social" className="text-xs font-medium text-foreground">
                      Razón Social <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="razon_social"
                      type="text"
                      required
                      value={formData.razon_social}
                      onChange={(e) => handleChange('razon_social', e.target.value)}
                      placeholder="Ej. Taller MotoSport S.A.C."
                      className="h-9 text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="nombre_comercial" className="text-xs font-medium text-foreground">
                      Nombre Comercial <span className="text-muted-foreground text-[10px]">(opcional)</span>
                    </Label>
                    <Input
                      id="nombre_comercial"
                      type="text"
                      value={formData.nombre_comercial}
                      onChange={(e) => handleChange('nombre_comercial', e.target.value)}
                      placeholder="Ej. MotoSport Racing"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="ruc" className="text-xs font-medium text-foreground">
                        RUC <span className="text-muted-foreground text-[10px]">(opcional)</span>
                      </Label>
                      <span className="text-[10px] text-muted-foreground">11 dígitos</span>
                    </div>
                    <Input
                      id="ruc"
                      type="text"
                      maxLength={11}
                      value={formData.ruc}
                      onChange={(e) => handleChange('ruc', e.target.value.replace(/\D/g, ''))}
                      placeholder="Ej. 20123456786"
                      className="h-9 text-xs font-mono"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Lo necesitarás para emitir comprobantes electrónicos (puedes configurarlo luego).
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-9 font-medium text-xs flex items-center justify-center gap-2 mt-4"
                  >
                    <span>Continuar</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </form>
              )}

              {/* ── PASO 2: CUENTA ADMINISTRADORA ── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="admin_name" className="text-xs font-medium text-foreground">
                      Tu Nombre Completo <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="admin_name"
                      type="text"
                      required
                      value={formData.admin_name}
                      onChange={(e) => handleChange('admin_name', e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="h-8 text-xs"
                      autoFocus
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="email" className="text-xs font-medium text-foreground">
                      Correo Electrónico <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      placeholder="correo@taller.pe"
                      className="h-8 text-xs"
                      autoComplete="email"
                    />
                  </div>

                  {/* Contraseña y Confirmación en grid compacto */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label htmlFor="password" className="text-[11px] font-medium text-foreground">
                        Contraseña <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          required
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="••••••••"
                          className="h-8 pr-7 text-xs"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword((prev) => !prev)}
                          aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                          className="absolute right-0 top-0 flex h-8 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="confirm_password" className="text-[11px] font-medium text-foreground">
                        Confirmar <span className="text-destructive">*</span>
                      </Label>
                      <div className="relative">
                        <Input
                          id="confirm_password"
                          type={showConfirmPassword ? 'text' : 'password'}
                          required
                          value={formData.confirm_password}
                          onChange={(e) => handleChange('confirm_password', e.target.value)}
                          placeholder="••••••••"
                          className="h-8 pr-7 text-xs"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword((prev) => !prev)}
                          aria-label={showConfirmPassword ? 'Ocultar' : 'Mostrar'}
                          className="absolute right-0 top-0 flex h-8 w-7 items-center justify-center text-muted-foreground hover:text-foreground"
                        >
                          {showConfirmPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Checklist en vivo de seguridad */}
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-0.5">
                    <span className={`flex items-center gap-1 ${hasMinLength ? 'text-emerald-600 font-medium' : ''}`}>
                      {hasMinLength ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Circle className="w-3 h-3" />}
                      8+ caracteres
                    </span>
                    <span className={`flex items-center gap-1 ${hasLetter && hasNumber ? 'text-emerald-600 font-medium' : ''}`}>
                      {hasLetter && hasNumber ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Circle className="w-3 h-3" />}
                      Letra y número
                    </span>
                    {formData.confirm_password && (
                      <span className={`flex items-center gap-1 ${isMatch ? 'text-emerald-600 font-medium' : 'text-destructive font-medium'}`}>
                        {isMatch ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Circle className="w-3 h-3" />}
                        Coinciden
                      </span>
                    )}
                  </div>

                  {/* Checkbox Términos */}
                  <div className="flex items-start gap-2 pt-1">
                    <Checkbox
                      id="terms"
                      checked={formData.accept_terms}
                      onCheckedChange={(checked) => handleChange('accept_terms', !!checked)}
                      className="mt-0.5"
                    />
                    <Label
                      htmlFor="terms"
                      className="text-[11px] font-normal text-muted-foreground cursor-pointer select-none leading-tight"
                    >
                      Acepto el tratamiento de mis datos personales conforme a la <strong>Ley N° 29733</strong>.
                    </Label>
                  </div>

                  {/* Botones Atrás / Registrar */}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      disabled={loading}
                      className="h-9 px-3 text-xs"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || !formData.accept_terms || !isPasswordValid || !isMatch}
                      className="flex-1 h-9 font-medium text-xs flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <span>Creando tu taller…</span>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Crear mi taller — 14 días gratis</span>
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              )}

              {/* Enlace al pie hacia Login */}
              <div className="text-center pt-1 border-t border-border/40">
                <p className="text-xs text-muted-foreground">
                  ¿Ya tienes una cuenta?{' '}
                  <Link
                    to="/login"
                    className="font-semibold text-primary hover:underline transition-colors duration-150"
                  >
                    Iniciar sesión
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
