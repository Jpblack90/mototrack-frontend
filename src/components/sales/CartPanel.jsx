import { XMarkIcon, PlusIcon, MinusIcon, ShoppingCartIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

/**
 * Panel de carrito de compras.
 * Solo renderiza — toda la lógica viene de useCart vía props.
 */
export default function CartPanel({ items, total, onUpdate, onRemove, onCheckout }) {
  const isEmpty = items.length === 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200">
        <ShoppingCartIcon className="w-5 h-5 text-slate-500" />
        <h2 className="font-semibold text-slate-900 text-sm">
          Carrito
          {!isEmpty && (
            <span className="ml-2 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-full px-2 py-0.5">
              {items.length}
            </span>
          )}
        </h2>
      </div>

      {/* Líneas del carrito */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm">
            <ShoppingCartIcon className="w-8 h-8 mb-2 opacity-40" />
            Carrito vacío
          </div>
        ) : (
          items.map(item => (
            <CartLine
              key={`${item.type}-${item.id}`}
              item={item}
              onUpdateQty={qty => onUpdate(item.id, item.type, qty)}
              onRemove={() => onRemove(item.id, item.type)}
            />
          ))
        )}
      </div>

      {/* Footer: total + botón cobrar */}
      <div className="border-t border-slate-200 p-4 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Total referencial</span>
          <span className="text-xl font-bold text-slate-900">
            S/ {total.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-slate-400">
          El monto exacto a cobrar es confirmado por el servidor.
        </p>
        <Button
          variant="primary"
          className="w-full justify-center py-2.5"
          disabled={isEmpty}
          onClick={onCheckout}
          icon={<ShoppingCartIcon className="w-4 h-4" />}
        >
          Cobrar
        </Button>
      </div>
    </div>
  );
}

// ─── Línea individual ────────────────────────────────────────────────────────

function CartLine({ item, onUpdateQty, onRemove }) {
  const subtotal = (item.unit_price * item.quantity).toFixed(2);
  const isKit    = item.type === 'kit';

  return (
    <div className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
        <div className="flex items-center gap-1 mt-0.5">
          {isKit && (
            <span className="bg-indigo-50 text-indigo-700 rounded-full px-1.5 py-0.5 text-xs font-medium">
              Kit
            </span>
          )}
          <span className="text-xs text-slate-500">
            S/ {Number(item.unit_price).toFixed(2)} c/u
          </span>
        </div>
      </div>

      {/* Cantidad */}
      <div className="flex items-center gap-1 shrink-0">
        <button
          onClick={() => onUpdateQty(item.quantity - 1)}
          className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <MinusIcon className="w-3 h-3" />
        </button>
        <span className="w-7 text-center text-sm font-medium text-slate-900">
          {item.quantity}
        </span>
        <button
          onClick={() => onUpdateQty(item.quantity + 1)}
          className="w-6 h-6 flex items-center justify-center rounded border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <PlusIcon className="w-3 h-3" />
        </button>
      </div>

      {/* Subtotal + eliminar */}
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-slate-900">S/ {subtotal}</p>
        <button
          onClick={onRemove}
          className="mt-0.5 text-slate-400 hover:text-red-500 transition-colors"
        >
          <XMarkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
