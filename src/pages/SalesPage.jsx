import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useSales } from '../hooks/useSales';
import ScanInput from '../components/sales/ScanInput';
import CartPanel from '../components/sales/CartPanel';
import CheckoutModal from '../components/sales/CheckoutModal';
import KitsSection from '../components/sales/KitsSection';
import client from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus } from 'lucide-react';

export default function SalesPage() {
  // ─── Hooks de lógica (prohibido modificarlos) ────────────────────────────
  const {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
  } = useCart();

  const {
    kits,
    kitsLoading,
    getKits,
    createKit,
    createSale,
    searchProduct,
  } = useSales();

  // ─── Estado local de UI ──────────────────────────────────────────────────
  const [scanMessage, setScanMessage] = useState('');
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  // Buscador manual del catálogo
  const [manualSearch, setManualSearch] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    getKits();
  }, [getKits]);

  // ─── Escaneo (Enter en ScanInput) ────────────────────────────────────────
  async function handleScan(code) {
    const { ok, products } = await searchProduct(code);

    if (!ok || products.length === 0) {
      const msg = `Sin resultados para "${code}"`;
      flash(msg);
      toast.error(msg);
      return;
    }
    if (products.length > 1) {
      const msg = `"${code}" coincide con varios productos — usa el buscador`;
      flash(msg);
      toast.info(msg);
      return;
    }

    const p = products[0];
    addItem({ type: 'product', id: p.id, name: p.name, unit_price: p.sale_price });
    const msg = `✓ ${p.name} agregado al carrito`;
    flash(msg, 1500);
    toast.success(msg);
  }

  function flash(msg, ms = 2500) {
    setScanMessage(msg);
    setTimeout(() => setScanMessage(''), ms);
  }

  // ─── Búsqueda manual por nombre o SKU ────────────────────────────────────
  useEffect(() => {
    if (!manualSearch.trim()) {
      setManualResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const { data } = await client.get('/inventory', {
          params: { search: manualSearch },
        });
        setManualResults(data.data ?? []);
      } catch {
        toast.error('Error al consultar el catálogo');
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [manualSearch]);

  // ─── Agregar kit al carrito ──────────────────────────────────────────────
  function handleAddKit(kit) {
    addItem({
      type: 'kit',
      id: kit.id,
      name: kit.name,
      unit_price: kit.kit_price ?? kit.price ?? 0,
    });
    toast.success(`Kit "${kit.name}" agregado al carrito`);
  }

  // ─── Confirmar venta ─────────────────────────────────────────────────────
  async function handleConfirmSale(paymentMethod, customerName) {
    const backendItems = items.map((i) =>
      i.type === 'kit'
        ? { kit_id: i.id, quantity: i.quantity }
        : { product_id: i.id, quantity: i.quantity }
    );

    const result = await createSale({
      payment_method: paymentMethod,
      customer_name: customerName || undefined,
      items: backendItems,
    });

    if (result.ok) {
      clearCart();
      toast.success('¡Venta registrada con éxito!');
    }

    return result;
  }

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div>
        <h1 className="text-lg font-semibold text-foreground">Punto de Venta (POS)</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Escanea códigos de barra o busca repuestos para facturar en mostrador
        </p>
      </div>

      {/* ── Input de escaneo rápido — siempre visible ── */}
      <Card className="p-4 shadow-sm border-border">
        <ScanInput onScan={handleScan} scanMessage={scanMessage} />
      </Card>

      {/* ── Layout de dos columnas: Búsqueda/Kits + Carrito ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna izquierda: Búsqueda manual + Kits */}
        <div className="lg:col-span-7 space-y-6">
          {/* Buscador de catálogo manual */}
          <Card className="shadow-sm border-border">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center gap-2 space-y-0">
              <Search className="w-4 h-4 text-muted-foreground" />
              <CardTitle className="text-sm font-semibold text-foreground">
                Búsqueda Manual en Catálogo
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                  value={manualSearch}
                  onChange={(e) => setManualSearch(e.target.value)}
                  placeholder="Escribe nombre o SKU del repuesto…"
                  className="pl-8"
                />
              </div>

              {/* Skeletons de búsqueda */}
              {searchLoading && (
                <div className="space-y-2 pt-1">
                  {Array.from({ length: 2 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </div>
              )}

              {/* Resultados */}
              {!searchLoading && manualResults.length > 0 && (
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                  {manualResults.map((p) => {
                    const isLowStock = Number(p.stock) <= Number(p.min_stock);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          addItem({
                            type: 'product',
                            id: p.id,
                            name: p.name,
                            unit_price: p.sale_price,
                          });
                          toast.success(`"${p.name}" agregado al carrito`);
                          setManualSearch('');
                          setManualResults([]);
                        }}
                        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-accent/50 transition-colors text-left group"
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {p.sku && (
                              <span className="font-mono text-xs text-muted-foreground">
                                {p.sku}
                              </span>
                            )}
                            {p.brand && (
                              <span className="text-xs text-muted-foreground">
                                · {p.brand}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              S/ {Number(p.sale_price).toFixed(2)}
                            </p>
                            <div className="flex justify-end">
                              <Badge
                                variant={isLowStock ? 'destructive' : 'secondary'}
                                className="text-[10px] px-1.5 py-0"
                              >
                                Stock: {p.stock}
                              </Badge>
                            </div>
                          </div>
                          <div className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sección de Kits */}
          <Card className="shadow-sm border-border p-4">
            <KitsSection
              kits={kits}
              kitsLoading={kitsLoading}
              onAddKit={handleAddKit}
              createKit={createKit}
            />
          </Card>
        </div>

        {/* Columna derecha: Carrito */}
        <div className="lg:col-span-5">
          <CartPanel
            items={items}
            total={total}
            onUpdate={updateQuantity}
            onRemove={removeItem}
            onCheckout={() => setCheckoutOpen(true)}
          />
        </div>
      </div>

      {/* Modal de confirmación de cobro */}
      <CheckoutModal
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        cartTotal={total}
        onConfirm={handleConfirmSale}
      />
    </div>
  );
}
