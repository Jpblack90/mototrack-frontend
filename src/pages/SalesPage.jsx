import { useState, useEffect } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useCart }  from '../hooks/useCart';
import { useSales } from '../hooks/useSales';
import ScanInput      from '../components/sales/ScanInput';
import CartPanel      from '../components/sales/CartPanel';
import CheckoutModal  from '../components/sales/CheckoutModal';
import KitsSection    from '../components/sales/KitsSection';
import client from '../api/client'; // solo para la búsqueda manual del panel de productos

/**
 * Punto de Venta (POS).
 *
 * REGLA: ninguna llamada directa a axios aquí.
 *   - Toda la lógica de negocio (crear venta, kits, búsqueda por scan)
 *     pasa por useCart / useSales.
 *   - El buscador manual del panel izquierdo usa client vía un efecto local;
 *     podría moverse a un hook propio en un refactor futuro.
 */
export default function SalesPage() {
  // ─── Hooks de lógica ────────────────────────────────────────────────────
  const {
    items, addItem, removeItem, updateQuantity, clearCart, total,
  } = useCart();

  const {
    kits, kitsLoading, getKits, createKit, createSale, searchProduct,
  } = useSales();

  // ─── Estado local de UI ──────────────────────────────────────────────────
  const [scanMessage,   setScanMessage]   = useState('');
  const [checkoutOpen,  setCheckoutOpen]  = useState(false);

  // Buscador manual del panel de productos
  const [manualSearch,  setManualSearch]  = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Cargar kits al montar
  useEffect(() => { getKits(); }, [getKits]);

  // ─── Escaneo (Enter en ScanInput) ────────────────────────────────────────

  async function handleScan(code) {
    const { ok, products } = await searchProduct(code);

    if (!ok || products.length === 0) {
      flash(`Sin resultados para "${code}"`);
      return;
    }
    if (products.length > 1) {
      flash(`"${code}" coincide con varios productos — usa el buscador`);
      return;
    }

    const p = products[0];
    addItem({ type: 'product', id: p.id, name: p.name, unit_price: p.sale_price });
    flash(`✓ ${p.name} agregado`, 1500);
  }

  function flash(msg, ms = 2500) {
    setScanMessage(msg);
    setTimeout(() => setScanMessage(''), ms);
  }

  // ─── Búsqueda manual (panel de productos) ────────────────────────────────

  useEffect(() => {
    if (!manualSearch.trim()) { setManualResults([]); return; }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await client.get('/inventory', { params: { search: manualSearch } });
        setManualResults(data.data ?? []);
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [manualSearch]);

  // ─── Agregar kit al carrito ──────────────────────────────────────────────

  function handleAddKit(kit) {
    addItem({
      type:       'kit',
      id:         kit.id,
      name:       kit.name,
      unit_price: kit.kit_price ?? kit.price ?? 0,
    });
  }

  // ─── Confirmar venta ─────────────────────────────────────────────────────

  /**
   * Convierte las líneas del carrito al formato que espera el backend:
   *   product → { product_id, quantity }
   *   kit     → { kit_id, quantity }
   */
  async function handleConfirmSale(paymentMethod, customerName) {
    const backendItems = items.map(i =>
      i.type === 'kit'
        ? { kit_id: i.id, quantity: i.quantity }
        : { product_id: i.id, quantity: i.quantity }
    );

    const result = await createSale({
      payment_method: paymentMethod,
      customer_name:  customerName || undefined,
      items:          backendItems,
    });

    if (result.ok) {
      clearCart();
    }

    // Devolvemos el resultado estructurado al CheckoutModal
    // — él decide cómo mostrarlo (success o error inline)
    return result;
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="bg-slate-50 min-h-full">
      {/* Header */}
      <div className="mb-4">
        <h1 className="font-semibold text-slate-900 text-2xl">Punto de Venta</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Escanea un código o busca el producto manualmente
        </p>
      </div>

      {/* Input de escaneo — siempre arriba */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 mb-4">
        <ScanInput onScan={handleScan} scanMessage={scanMessage} />
      </div>

      {/* Layout de dos columnas: productos + carrito */}
      <div className="flex flex-col lg:flex-row gap-4">

        {/* ── Columna izquierda: buscador + kits ── */}
        <div className="lg:w-[55%] space-y-4">

          {/* Buscador manual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
              <MagnifyingGlassIcon className="w-4 h-4 text-slate-400" />
              <h2 className="font-semibold text-slate-900 text-sm">Búsqueda de productos</h2>
            </div>
            <input
              type="search"
              value={manualSearch}
              onChange={e => setManualSearch(e.target.value)}
              placeholder="Nombre o SKU…"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
            />

            {/* Resultados */}
            {searchLoading && (
              <div className="mt-3 animate-pulse space-y-2">
                {[1, 2].map(i => <div key={i} className="h-10 bg-slate-100 rounded-lg" />)}
              </div>
            )}
            {!searchLoading && manualResults.length > 0 && (
              <div className="mt-3 divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden">
                {manualResults.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      addItem({ type: 'product', id: p.id, name: p.name, unit_price: p.sale_price });
                      setManualSearch('');
                      setManualResults([]);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 transition-colors text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-slate-900">{p.name}</p>
                      {p.sku && <p className="text-xs text-slate-500">{p.sku}</p>}
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-sm font-semibold text-slate-900">
                        S/ {Number(p.sale_price).toFixed(2)}
                      </p>
                      <p className={`text-xs ${Number(p.stock) <= Number(p.min_stock)
                        ? 'text-amber-600' : 'text-slate-400'}`}>
                        Stock: {p.stock}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Kits */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <KitsSection
              kits={kits}
              kitsLoading={kitsLoading}
              onAddKit={handleAddKit}
              createKit={createKit}
            />
          </div>
        </div>

        {/* ── Columna derecha: carrito ── */}
        <div className="lg:w-[45%]">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm h-full min-h-[400px] flex flex-col">
            <CartPanel
              items={items}
              total={total}
              onUpdate={updateQuantity}
              onRemove={removeItem}
              onCheckout={() => setCheckoutOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Modal de cobro */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartTotal={total}
        onConfirm={handleConfirmSale}
      />
    </div>
  );
}
