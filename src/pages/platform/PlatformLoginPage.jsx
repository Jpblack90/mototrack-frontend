import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import PlatformAuthShell from '../../components/platform/PlatformAuthShell';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { extractPlatformError } from '../../lib/platformErrors';

/**
 * Inicio de sesión separado para administradores de plataforma MotoTrack.
 */
export default function PlatformLoginPage() {
  const { admin, loading, isAuthenticated, login } = usePlatformAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!loading && isAuthenticated) {
    return (
      <Navigate
        to={admin?.must_change_password ? '/plataforma/change-password' : '/plataforma'}
        replace
      />
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMsg('Ingresa tu correo y contraseña de plataforma.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedAdmin = await login(cleanEmail, password);
      if (loggedAdmin?.must_change_password) {
        navigate('/plataforma/change-password', { replace: true });
      } else {
        toast.success(`Bienvenido, ${loggedAdmin?.name || 'Soporte'}.`);
        navigate('/plataforma', { replace: true });
      }
    } catch (err) {
      setErrorMsg(
        extractPlatformError(err, 'No se pudo iniciar sesión. Verifica tus credenciales.').message
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PlatformAuthShell
      rightAction={
        <Link
          to="/login"
          className="text-xs text-sidebar-foreground/75 hover:text-sidebar-foreground transition-colors duration-150"
        >
          Acceso de talleres →
        </Link>
      }
    >
      <Card className="shadow-md border-border">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto w-11 h-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-1">
            <ShieldCheck className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Consola de Plataforma
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Acceso exclusivo para administración y soporte de MotoTrack.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {errorMsg && (
            <div className="mb-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="platform-email">Correo de plataforma</Label>
              <Input
                id="platform-email"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="soporte@mototrack.pe"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="platform-password">Contraseña</Label>
              <div className="relative">
                <Input
                  id="platform-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Ingresar al panel'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PlatformAuthShell>
  );
}
