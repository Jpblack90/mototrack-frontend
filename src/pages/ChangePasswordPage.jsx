import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { toast } from 'sonner';
import { KeyRound, ShieldAlert, Check, X, Eye, EyeOff, LogOut } from 'lucide-react';
import { defaultRouteFor } from '../lib/roles';
import { validatePasswordPolicy } from '../lib/passwordUtils';

export default function ChangePasswordPage() {
  const { user, logout, markPasswordChanged } = useAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [loading, setLoading] = useState(false);

  const hasMinLength = newPassword.length >= 8;
  const hasLetter = /[A-Za-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  async function handleSubmit(e) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Debes ingresar tu contraseña actual o temporal.');
      return;
    }

    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      toast.error(policy.message);
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden.');
      return;
    }

    if (currentPassword === newPassword) {
      toast.error('La nueva contraseña no puede ser idéntica a la anterior.');
      return;
    }

    setLoading(true);
    try {
      await client.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      });

      toast.success('Contraseña actualizada con éxito.');
      markPasswordChanged();
      navigate(defaultRouteFor(user?.role), { replace: true });
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al actualizar la contraseña.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="flex flex-col items-center text-center space-y-2">
          <img src="/logo.png?v=3" alt="MotoTrack AI" className="h-10 w-auto object-contain" />
        </div>

        <Card className="border border-border/80 shadow-md">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto w-12 h-12 rounded-full bg-warning/15 text-warning flex items-center justify-center mb-2">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <CardTitle className="text-lg font-bold">Cambio de Contraseña Requerido</CardTitle>
            <CardDescription className="text-xs text-muted-foreground max-w-xs mx-auto">
              Por motivos de seguridad, debes actualizar tu contraseña temporal antes de acceder al sistema.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Contraseña actual (temporal) */}
              <div className="space-y-1.5">
                <Label htmlFor="current-pwd" className="text-xs font-medium">
                  Contraseña temporal o actual
                </Label>
                <div className="relative">
                  <Input
                    id="current-pwd"
                    type={showCurrent ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Ingresa la contraseña con la que accediste"
                    required
                    className="pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Nueva contraseña */}
              <div className="space-y-1.5">
                <Label htmlFor="new-pwd" className="text-xs font-medium">
                  Nueva contraseña definitiva
                </Label>
                <div className="relative">
                  <Input
                    id="new-pwd"
                    type={showNew ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    className="pr-10 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    tabIndex={-1}
                  >
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Checklist de requisitos */}
              <div className="p-3 bg-muted/50 rounded-lg space-y-1 text-xs text-muted-foreground border border-border/60">
                <p className="font-semibold text-foreground text-[11px] uppercase tracking-wider">
                  Requisitos de seguridad:
                </p>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex items-center gap-2">
                    {hasMinLength ? (
                      <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    )}
                    <span className={hasMinLength ? 'text-foreground' : ''}>Mínimo 8 caracteres</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasLetter ? (
                      <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    )}
                    <span className={hasLetter ? 'text-foreground' : ''}>Al menos una letra</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {hasNumber ? (
                      <Check className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    )}
                    <span className={hasNumber ? 'text-foreground' : ''}>Al menos un número</span>
                  </div>
                </div>
              </div>

              {/* Confirmación */}
              <div className="space-y-1.5">
                <Label htmlFor="confirm-pwd" className="text-xs font-medium">
                  Confirmar nueva contraseña
                </Label>
                <Input
                  id="confirm-pwd"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la nueva contraseña"
                  required
                  className="text-sm"
                />
                {confirmPassword && (
                  <p className={`text-xs mt-1 ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                    {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                disabled={loading || !hasMinLength || !hasLetter || !hasNumber || !passwordsMatch}
                className="w-full text-sm font-semibold gap-2"
              >
                <KeyRound className="w-4 h-4" />
                {loading ? 'Actualizando contraseña...' : 'Actualizar y Acceder'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Opción de salir */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Cerrar sesión e ingresar más tarde</span>
          </button>
        </div>
      </div>
    </div>
  );
}
