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
import { Trash2 } from 'lucide-react';

/**
 * Modal de confirmación antes de desactivar (soft-delete) un producto.
 */
export default function DeactivateConfirm({ product, onConfirm, onCancel, loading }) {
  return (
    <AlertDialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive text-base font-semibold">
            <Trash2 className="w-5 h-5 shrink-0" />
            Desactivar producto
          </AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground text-sm pt-1">
            ¿Desactivar <span className="font-semibold text-foreground">"{product?.name}"</span>? El producto dejará de aparecer en el inventario activo pero sus registros históricos (ventas, órdenes) se conservan intactos.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel} disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={loading}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {loading ? 'Desactivando…' : 'Sí, desactivar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
