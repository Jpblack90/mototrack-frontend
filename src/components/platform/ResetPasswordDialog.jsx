import { useState } from 'react';
import { AlertTriangle, Check, Copy, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { ROLE_LABELS } from '../../lib/roles';

function ResetPasswordBody({
  user,
  companyId,
  onClose,
  submitting,
  onConfirmReset,
  onSuccess,
  temporaryPassword,
  onGenerated,
}) {
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleConfirm = async () => {
    if (!user || !companyId) return;
    setErrorMsg('');

    const result = await onConfirmReset(companyId, user.id);
    if (!result.ok) {
      setErrorMsg(result.error?.message || 'No se pudo restablecer la contraseña.');
      return;
    }

    onGenerated(result.data?.temporary_password || '');
    toast.success(`Contraseña restablecida para ${user.name}.`);
    onSuccess?.();
  };

  const handleCopy = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      toast.success('Contraseña temporal copiada al portapapeles.');
    } catch {
      toast.error('No se pudo copiar automáticamente; selecciona y copia el texto.');
    }
  };

  if (!temporaryPassword) {
    return (
      <div className="space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
            {errorMsg}
          </div>
        )}

        <div className="p-3 rounded-lg bg-muted border border-border text-xs text-muted-foreground space-y-1.5">
          <p className="text-foreground font-medium">
            ¿Confirmas generar una nueva contraseña temporal para este usuario?
          </p>
          <p>
            Su contraseña actual dejará de funcionar y se le exigirá crear una nueva al iniciar
            sesión. La acción quedará registrada en auditoría.
          </p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            Cancelar
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Generando...' : 'Sí, restablecer contraseña'}
          </Button>
        </DialogFooter>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="p-3 rounded-lg bg-warning/10 border border-warning/30 text-xs flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-foreground">
            Esta contraseña no se volverá a mostrar
          </p>
          <p className="text-muted-foreground">
            Cópiala y compártela con el usuario por un canal seguro. Al cerrar esta ventana no podrá
            recuperarse.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <code className="flex-1 px-3 py-2.5 rounded-lg bg-muted border border-border font-mono text-sm font-semibold text-foreground tracking-wider select-all">
          {temporaryPassword}
        </code>
        <Button type="button" variant="outline" onClick={handleCopy} className="shrink-0">
          {copied ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          <span>{copied ? 'Copiado' : 'Copiar'}</span>
        </Button>
      </div>

      <DialogFooter>
        <Button type="button" onClick={onClose}>
          Entendido, cerrar
        </Button>
      </DialogFooter>
    </div>
  );
}

/**
 * Modal en dos pasos para restablecer la contraseña de un usuario de taller:
 * 1) Confirmación explícita
 * 2) Visualización única de la contraseña temporal con botón copiar
 */
export default function ResetPasswordDialog({
  user,
  companyId,
  onClose,
  submitting,
  onConfirmReset,
  onSuccess,
}) {
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const open = Boolean(user);

  const handleClose = () => {
    setTemporaryPassword('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-warning" />
            {temporaryPassword ? 'Contraseña temporal generada' : 'Restablecer contraseña'}
          </DialogTitle>
          <DialogDescription>
            {user?.name} ({user?.email}) · {ROLE_LABELS[user?.role] || user?.role}
          </DialogDescription>
        </DialogHeader>

        {user && (
          <ResetPasswordBody
            key={user.id}
            user={user}
            companyId={companyId}
            onClose={handleClose}
            submitting={submitting}
            onConfirmReset={onConfirmReset}
            onSuccess={onSuccess}
            temporaryPassword={temporaryPassword}
            onGenerated={setTemporaryPassword}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
