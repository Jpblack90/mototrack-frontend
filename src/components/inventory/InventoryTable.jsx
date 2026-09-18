import { useState, useEffect, useRef } from 'react';
import client from '../../api/client';
import ManualProductModal from './ManualProductModal';
import ScanProductModal   from './ScanProductModal';
import DeactivateConfirm  from './DeactivateConfirm';

// ─── Badges ──────────────────────────────────────────────────────────────────

function LowStockBadge() {
  return (
    <span className="bg-amber-50 text-amber-700 border border-amber-200 rounded-full px-2 py-0.5 text-xs font-medium ml-1">
      Stock bajo
    </span>
  );
}

function OriginBadge({ method, confidence }) {
  if (method === 'ia') {
    const conf = Number(confidence ?? 0);
    const confClass = conf >= 80
      ? 'bg-emerald-50 text-emerald-700'
      : 'bg-amber-50 text-amber-700';
    return (
      <span className="inline-flex items-center gap-1 flex-wrap">
        <span className="bg-indigo-50 text-indigo-700 rounded-full px-2 py-0.5 text-xs font-medium">
          IA
        </span>
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${confClass}`}>
          {conf}%
        </span>
      </span>
    );
  }
  return <span className="text-sm text-slate-500">Manual</span>;
}

// ─── Skeleton de tabla ────────────────────────────────────────────────────────

function TableSkeleton() {
  return (
    <div className="animate-pulse divide-y divide-slate-200">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="flex gap-4 px-6 py-4">
          <div className="flex-1 space-y-2">
            <div className="h-4 bg-slate-200 rounded w-2/3" />
            <div className="h-3 bg-slate-100 rounded w-1/3" />
          </div>
          <div className="h-4 bg-slate-200 rounded w-16 self-center" />
          <div className="h-4 bg-slate-200 rounded w-12 self-center" />
          <div className="h-4 bg-slate-200 rounded w-16 self-center" />
          <div className="h-4 bg-slate-200 rounded w-12 self-center" />
        </div>
      ))}
    </div>
  );
}

// ─── Menú de acciones por fila ────────────────────────────────────────────────

function RowActionsMenu({ onEdit, onDeactivate }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Cerrar al click fuera
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        aria-label="Acciones"
      >
        ⋯
      </button>
      {open && (
        <div className="absolute right-0 z-10 mt-1 w-36 bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            ✏️ Editar
          </button>
          <button
            onClick={() => { setOpen(false); onDeactivate(); }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            🗑️ Desactivar
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Tabla ────────────────────────────────────────────────────────────────────

export default function InventoryTable({ products, loading, onEdit, onDeactivate }) {
  const thClass =
    'px-4 py-3 text-left text-slate-500 text-xs font-medium uppercase tracking-wide bg-slate-50';

  if (loading) return <TableSkeleton />;

  if (products.length === 0) {
    return (
      <div className="px-6 py-12 text-center text-slate-500 text-sm">
        No se encontraron productos.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[600px]">
        <thead>
          <tr className="border-b border-slate-200">
            <th className={thClass}>Producto</th>
            <th className={`${thClass} hidden sm:table-cell`}>Marca</th>
            <th className={thClass}>Stock</th>
            <th className={thClass}>P. Venta</th>
            <th className={`${thClass} hidden md:table-cell`}>Margen</th>
            <th className={`${thClass} hidden sm:table-cell`}>Origen</th>
            <th className={`${thClass} w-10`} />
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {products.map(p => {
            const margin     = Number(p.margin ?? 0);
            const isLowStock = Number(p.stock) <= Number(p.min_stock);
            const marginClass = margin >= 0 ? 'text-emerald-700' : 'text-red-600';

            return (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                {/* Producto */}
                <td className="px-4 py-3">
                  <p className="font-medium text-slate-900 text-sm">{p.name}</p>
                  {p.sku && (
                    <p className="text-xs text-slate-500 mt-0.5">{p.sku}</p>
                  )}
                </td>

                {/* Marca */}
                <td className="px-4 py-3 text-sm text-slate-700 hidden sm:table-cell">
                  {p.brand ?? <span className="text-slate-400">—</span>}
                </td>

                {/* Stock */}
                <td className="px-4 py-3">
                  <span className="text-sm text-slate-900">{p.stock}</span>
                  {isLowStock && <LowStockBadge />}
                </td>

                {/* Precio venta */}
                <td className="px-4 py-3 text-sm text-slate-900">
                  S/ {Number(p.sale_price).toFixed(2)}
                </td>

                {/* Margen */}
                <td className={`px-4 py-3 text-sm font-medium hidden md:table-cell ${marginClass}`}>
                  S/ {margin.toFixed(2)}
                </td>

                {/* Origen */}
                <td className="px-4 py-3 hidden sm:table-cell">
                  <OriginBadge method={p.registration_method} confidence={p.ai_confidence} />
                </td>

                {/* Acciones */}
                <td className="px-4 py-3">
                  <RowActionsMenu
                    onEdit={() => onEdit(p)}
                    onDeactivate={() => onDeactivate(p)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
