import { useAuth } from '../../context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

/**
 * Modal de confirmación cuando el backend responde 422 NEGATIVE_MARGIN.
 * Admin → muestra "Forzar de todas formas".
 * No-admin → solo "Corregir precio" (sin botón de forzar).
 * Muestra el mensaje EXACTO del backend sin inventar texto genérico.
 */
export default function NegativeMarginConfirm({ message, onForce, onCorrect }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onCorrect()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive text-base font-semibold">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            Margen negativo detectado
          </AlertDialogTitle>
          <AlertDialogDescription className="text-foreground text-sm pt-1">
            {message}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Mensaje condicional de RBAC por rol */}
        {!isAdmin && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
            Solo un Administrador puede forzar un margen negativo. Corrige el precio de costo o venta antes de guardar.
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCorrect}>
            Corregir precio
          </AlertDialogCancel>
          {isAdmin && (
            <AlertDialogAction
              onClick={onForce}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Forzar de todas formas
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
