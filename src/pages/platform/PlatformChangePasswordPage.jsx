import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, Circle, Eye, EyeOff, KeyRound, Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import PlatformAuthShell from '../../components/platform/PlatformAuthShell';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { validatePasswordPolicy } from '../../lib/passwordUtils';

/**
 * Flujo obligatorio de cambio de contraseña para cuentas de plataforma.
 */
export default function PlatformChangePasswordPage() {
  const { admin, logout, changePassword, changingPassword } = usePlatformAuth();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const policy = validatePasswordPolicy(newPassword);
  const matches = Boolean(confirmPassword) && newPassword === confirmPassword;

  const rules = [
    { ok: newPassword.length >= 8, label: 'Mínimo 8 caracteres' },
    { ok: /[A-Za-z]/.test(newPassword), label: 'Al menos una letra (mayúscula o minúscula)' },
    { ok: /\d/.test(newPassword), label: 'Al menos un número' },
    { ok: matches, label: 'Las contraseñas coinciden' },
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!currentPassword) {
      setErrorMsg('Ingresa tu contraseña actual.');
      return;
    }
    if (!policy.valid) {
      setErrorMsg('La nueva contraseña no cumple todos los requisitos de seguridad.');
      return;
    }
    if (!matches) {
      setErrorMsg('Las contraseñas nuevas no coinciden.');
      return;
    }
    if (currentPassword === newPassword) {
      setErrorMsg('La nueva contraseña debe ser diferente a la actual.');
      return;
    }

    const result = await changePassword(currentPassword, newPassword);
    if (!result.ok) {
      setErrorMsg(result.error?.message || 'No se pudo actualizar la contraseña.');
      return;
    }

    toast.success('Contraseña actualizada correctamente.');
    navigate('/plataforma', { replace: true });
  };

  const handleLogout = () => {
    logout();
    navigate('/plataforma/login', { replace: true });
  };

  return (
    <PlatformAuthShell
      maxWidthClass="max-w-md"
      rightAction={
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          className="text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent"
        >
          <LogOut className="w-3.5 h-3.5" />
          Cerrar sesión
        </Button>
      }
    >
      <Card className="shadow-md border-border">
        <CardHeader className="space-y-1.5 text-center pb-4">
          <div className="mx-auto w-11 h-11 rounded-xl bg-warning/15 border border-warning/30 flex items-center justify-center mb-1">
            <KeyRound className="w-5 h-5 text-warning" />
          </div>
          <CardTitle className="text-lg font-semibold text-foreground">
            Cambio obligatorio de contraseña
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {admin?.name ? `Hola, ${admin.name}. ` : ''}
            Por seguridad, actualiza tu contraseña antes de continuar al panel de plataforma.
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
              <Label htmlFor="platform-current-pass">Contraseña actual</Label>
              <div className="relative">
                <Input
                  id="platform-current-pass"
                  type={showCurrent ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Contraseña temporal o actual"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showCurrent ? 'Ocultar contraseña actual' : 'Mostrar contraseña actual'}
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="platform-new-pass">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  id="platform-new-pass"
                  type={showNew ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Crea una contraseña segura"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={showNew ? 'Ocultar nueva contraseña' : 'Mostrar nueva contraseña'}
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <ul className="mt-2 space-y-1 text-xs">
                {rules.map((rule) => (
                  <li
                    key={rule.label}
                    className={
                      rule.ok
                        ? 'flex items-center gap-1.5 text-success'
                        : 'flex items-center gap-1.5 text-muted-foreground'
                    }
                  >
                    {rule.ok ? (
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    ) : (
                      <Circle className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>{rule.label}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="platform-confirm-pass">Confirmar nueva contraseña</Label>
              <Input
                id="platform-confirm-pass"
                type={showNew ? 'text' : 'password'}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                required
              />
              {confirmPassword && !matches && (
                <p className="text-[11px] text-destructive">Las contraseñas no coinciden.</p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={changingPassword || !policy.valid || !matches}
            >
              {changingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                'Actualizar contraseña y continuar'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PlatformAuthShell>
  );
}
