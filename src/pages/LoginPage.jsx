import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { defaultRouteFor } from '../lib/roles';

const REMEMBER_EMAIL_KEY = 'mototrack_remember_email';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  // Precarga segura de localStorage si el usuario guardó su correo
  const [email, setEmail] = useState(() => {
    try {
      return localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    } catch {
      return '';
    }
  });

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(() => {
    try {
      return !!localStorage.getItem(REMEMBER_EMAIL_KEY);
    } catch {
      return false;
    }
  });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);

      // Persistencia de correo según checkbox "Recordarme"
      try {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      } catch {
        // Ignora fallos de cuota o modo privado
      }

      toast.success(`¡Bienvenido, ${user?.name || 'Usuario'}!`);
      navigate(defaultRouteFor(user.role), { replace: true });
    } catch (err) {
      // Muestra el mensaje exacto del backend con Sonner toast
      const errorMsg =
        err.response?.data?.error?.message ??
        'Error de conexión. Verifica que el servidor esté activo.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background lg:bg-muted flex flex-col lg:flex-row items-stretch lg:items-center justify-start lg:justify-center lg:p-6">
      {/* ── TARJETA (desktop lg+) / FLUJO NORMAL (móvil < lg) ── */}
      <div className="w-full flex-1 lg:flex-initial lg:max-w-4xl lg:h-140 grid lg:grid-cols-2 overflow-hidden lg:rounded-2xl lg:border lg:border-border bg-background lg:bg-card lg:shadow-xl">
        {/* ── MITAD IZQUIERDA — Panel de marca (oscuro, desktop) ── */}
        <div className="relative hidden lg:flex flex-col overflow-hidden bg-sidebar">
          {/* Cabecera centrada: logo y lema animado */}
          <div className="flex flex-col items-center pt-10 px-6 text-center z-10 shrink-0">
            <img
              src="/logo.png"
              alt="MotoTrack"
              className="w-48 animate-splash-in"
            />
            <p className="mt-3 text-base font-semibold text-sidebar-foreground animate-splash-tagline leading-snug">
              Controla tu taller,
              <br />
              impulsa tu negocio
            </p>
          </div>

          {/* Moto con neón rojo anclada abajo con máscara */}
          <div className="flex-1 min-h-0 w-full flex items-end justify-center overflow-hidden">
            <img
              src="/login-hero.png"
              alt=""
              aria-hidden="true"
              className="h-full w-auto object-contain object-bottom mask-x-from-45% mask-x-to-95% mask-t-from-40% mask-t-to-90%"
            />
          </div>
        </div>

        {/* ── MITAD DERECHA — Formulario ── */}
        <div className="flex flex-col flex-1 lg:flex-initial lg:h-full">
          {/* Franja superior solo en móvil/tablet (< lg) para contrastar el logo blanco */}
          <div className="lg:hidden flex items-center justify-center bg-sidebar py-4 px-4 shadow-xs">
            <img src="/logo.png" alt="MotoTrack" className="w-40" />
          </div>

          {/* Formulario: en móvil arriba con pt-10, en desktop centrado con p-10 */}
          <div className="flex flex-1 items-start lg:items-center justify-center p-6 pt-10 lg:p-10">
            <div className="w-full max-w-xs space-y-6">
              {/* Título y subtítulo */}
              <div className="space-y-1.5">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  Iniciar sesión
                </h1>
                <p className="text-sm text-muted-foreground">
                  Accede a tu cuenta para continuar
                </p>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo Correo electrónico */}
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-medium text-foreground">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Ingresa tu correo"
                    className="h-10 text-sm"
                    autoComplete="email"
                  />
                </div>

                {/* Campo Contraseña con botón de ojo */}
                <div className="space-y-1.5">
                  <Label htmlFor="password" className="text-xs font-medium text-foreground">
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Ingresa tu contraseña"
                      className="h-10 pr-10 text-sm"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                      aria-pressed={showPassword}
                      className="absolute right-0 top-0 flex h-10 w-10 items-center justify-center text-muted-foreground hover:text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md"
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Checkbox Recordarme */}
                <div className="flex items-center gap-2 pt-1">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal text-muted-foreground cursor-pointer select-none"
                  >
                    Recordarme
                  </Label>
                </div>

                {/* Botón de envío */}
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-10 font-medium text-sm transition-colors duration-150"
                >
                  {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
