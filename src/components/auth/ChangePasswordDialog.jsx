import { useState } from 'react';
import client from '../../api/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { KeyRound, Check, X, Eye, EyeOff } from 'lucide-react';
import { validatePasswordPolicy } from '../../lib/passwordUtils';

export default function ChangePasswordDialog({ open, onOpenChange }) {
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

  function resetForm() {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!currentPassword) {
      toast.error('Debes ingresar tu contraseña actual.');
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
      resetForm();
      onOpenChange(false);
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cambiar la contraseña.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) resetForm();
        onOpenChange(val);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-semibold">Cambiar Contraseña</DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Actualiza tu contraseña para mantener la seguridad de tu cuenta.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Contraseña actual */}
          <div className="space-y-1.5">
            <Label htmlFor="current-pwd" className="text-xs font-medium">
              Contraseña actual
            </Label>
            <div className="relative">
              <Input
                id="current-pwd"
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Ingresa tu contraseña actual"
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
              Nueva contraseña
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

          {/* Indicadores de política */}
          <div className="p-3 bg-muted/50 rounded-lg space-y-1.5 text-xs text-muted-foreground border border-border/60">
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

          {/* Confirmar contraseña */}
          <div className="space-y-1.5">
            <Label htmlFor="confirm-pwd" className="text-xs font-medium">
              Confirmar nueva contraseña
            </Label>
            <Input
              id="confirm-pwd"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Vuelve a escribir la nueva contraseña"
              required
              className="text-sm"
            />
            {confirmPassword && (
              <p className={`text-xs mt-1 ${passwordsMatch ? 'text-success' : 'text-destructive'}`}>
                {passwordsMatch ? 'Las contraseñas coinciden' : 'Las contraseñas no coinciden'}
              </p>
            )}
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="text-xs"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !hasMinLength || !hasLetter || !hasNumber || !passwordsMatch}
              className="text-xs"
            >
              {loading ? 'Actualizando...' : 'Cambiar Contraseña'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
