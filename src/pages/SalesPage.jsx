import { useState, useEffect } from 'react';
import { useCart } from '../hooks/useCart';
import { useSales } from '../hooks/useSales';
import ScanInput from '../components/sales/ScanInput';
import CartPanel from '../components/sales/CartPanel';
import CheckoutModal from '../components/sales/CheckoutModal';
import KitsSection from '../components/sales/KitsSection';
import AlternativesPopover from '../components/sales/AlternativesPopover';
import client from '../api/client';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Switch } from '../components/ui/switch';
import { Skeleton } from '../components/ui/skeleton';
import { toast } from 'sonner';
import { Search, Plus, Bike, X, AlertTriangle } from 'lucide-react';

function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase().normalize('NFD').replace(/[^a-z0-9]/g, '');
}

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

  // Mapa de stock disponible de productos conocidos para validación de carrito
  const [productStockMap, setProductStockMap] = useState({});

  // Moto del cliente
  const [bikeInput, setBikeInput] = useState('');
  const [selectedBike, setSelectedBike] = useState(null);
  const [bikeLoading, setBikeLoading] = useState(false);
  const [onlyCompatible, setOnlyCompatible] = useState(true);

  // Buscador manual del catálogo
  const [manualSearch, setManualSearch] = useState('');
  const [manualResults, setManualResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    getKits();
  }, [getKits]);

  // ─── Gestión de la Moto del Cliente (RF-20) ─────────────────────────────
  async function handleSetBike(e) {
    if (e) e.preventDefault();
    const val = bikeInput.trim();
    if (!val) return;

    setBikeLoading(true);
    try {
      // 1. Primero consulta GET /api/workorders/placa/:valor
      const { data } = await client.get(`/workorders/placa/${encodeURIComponent(val)}`);
      const orders = data?.data || [];
      if (orders.length > 0 && (orders[0].brand || orders[0].model)) {
        const brandModel = `${orders[0].brand || ''} ${orders[0].model || ''}`.trim();
        setSelectedBike(brandModel || val);
      } else {
        setSelectedBike(val);
      }
    } catch {
      // 2. Si responde 404 o falla, usa el texto ingresado como modelo
      setSelectedBike(val);
    } finally {
      setBikeLoading(false);
      setBikeInput('');
    }
  }

  function handleClearBike() {
    setSelectedBike(null);
    setOnlyCompatible(true);
  }

  // ─── Validación preventiva de stock antes de agregar ─────────────────────
  function handleAddProduct(product) {
    const pStock = product.stock !== undefined ? Number(product.stock) : (productStockMap[product.id] ?? 9999);

    if (pStock <= 0) {
      toast.error(`"${product.name}" está agotado.`);
      return;
    }

    const inCart = items.find((i) => i.type === 'product' && i.id === product.id);
    const currentQty = inCart ? inCart.quantity : 0;

    if (currentQty + 1 > pStock) {
      toast.warning(`Solo hay ${pStock} unidades de ${product.name}`);
      return;
    }

    addItem({
      type: 'product',
      id: product.id,
      name: product.name,
      unit_price: product.sale_price,
    });

    setProductStockMap((prev) => ({ ...prev, [product.id]: pStock }));
    toast.success(`✓ "${product.name}" agregado al carrito`);
  }

  // Interceptor para actualizar cantidad en carrito respetando el stock disponible
  function handleCartUpdate(id, type, newQuantity) {
    if (type === 'product') {
      const stock = productStockMap[id];
      if (stock !== undefined && newQuantity > stock) {
        const item = items.find((i) => i.type === 'product' && i.id === id);
        toast.warning(`Solo hay ${stock} unidades de ${item?.name || 'este producto'}`);
        return;
      }
    }
    updateQuantity(id, type, newQuantity);
  }

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
    handleAddProduct(p);
  }

  function flash(msg, ms = 2500) {
    setScanMessage(msg);
    setTimeout(() => setScanMessage(''), ms);
  }

  // ─── Búsqueda manual por nombre o SKU (con filtro de moto) ───────────────
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!manualSearch.trim()) {
        setManualResults([]);
        return;
      }
      setSearchLoading(true);
      try {
        const params = { search: manualSearch };
        if (selectedBike && onlyCompatible) {
          params.compatible_with = selectedBike;
        }
        const { data } = await client.get('/inventory', { params });
        const prods = data.data ?? [];
        setManualResults(prods);

        // Actualizar el mapa de stock
        setProductStockMap((prev) => {
          const next = { ...prev };
          prods.forEach((p) => {
            next[p.id] = Number(p.stock);
          });
          return next;
        });
      } catch {
        toast.error('Error al consultar el catálogo');
      } finally {
        setSearchLoading(false);
      }
    }, 350);
    return () => clearTimeout(t);
  }, [manualSearch, selectedBike, onlyCompatible]);

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

  // ─── Confirmar venta (RF-24: pagos mixtos, RF-06: alertas de stock) ──────
  async function handleConfirmSale(payments, customerName) {
    const backendItems = items.map((i) =>
      i.type === 'kit'
        ? { kit_id: i.id, quantity: i.quantity }
        : { product_id: i.id, quantity: i.quantity }
    );

    const result = await createSale({
      payments,
      customer_name: customerName || undefined,
      items: backendItems,
    });

    if (result.ok) {
      clearCart();
      toast.success('¡Venta registrada con éxito!');

      // Notificación de alertas de stock cuando cruzaron el umbral
      const stockAlerts = result.data?.stock_alerts || [];
      if (stockAlerts.length > 0) {
        if (stockAlerts.length === 1) {
          const a = stockAlerts[0];
          toast.warning(`Stock bajo: ${a.name} (${a.stock} de ${a.min_stock} mín.)`);
        } else {
          const summary = stockAlerts.map((a) => `${a.name} (${a.stock} de ${a.min_stock} mín.)`).join(', ');
          toast.warning(`Stock bajo tras la venta: ${summary}`);
        }
      }

      // Despachar evento para refrescar la campana del Header
      window.dispatchEvent(new CustomEvent('mototrack:sale-completed', { detail: result.data }));
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
          {/* Buscador de catálogo manual con selector de moto */}
          <Card className="shadow-sm border-border">
            <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2">
                <Search className="w-4 h-4 text-muted-foreground" />
                <CardTitle className="text-sm font-semibold text-foreground">
                  Búsqueda Manual en Catálogo
                </CardTitle>
              </div>

              {/* Interruptor "Solo compatibles" si hay moto seleccionada */}
              {selectedBike && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Switch
                    checked={onlyCompatible}
                    onCheckedChange={setOnlyCompatible}
                    id="only-compatible-toggle"
                  />
                  <label htmlFor="only-compatible-toggle" className="cursor-pointer select-none font-medium">
                    Solo compatibles
                  </label>
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              {/* Campo "Moto del cliente" */}
              <div className="space-y-2">
                {!selectedBike ? (
                  <form onSubmit={handleSetBike} className="flex gap-2">
                    <div className="relative flex-1">
                      <Bike className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        type="text"
                        value={bikeInput}
                        onChange={(e) => setBikeInput(e.target.value)}
                        placeholder="Moto del cliente (ingresa placa o modelo)…"
                        className="pl-8 text-xs"
                        disabled={bikeLoading}
                      />
                    </div>
                    <Button
                      type="submit"
                      variant="secondary"
                      size="sm"
                      disabled={!bikeInput.trim() || bikeLoading}
                      className="text-xs h-9 px-3 gap-1.5 shrink-0"
                    >
                      <Bike className="w-3.5 h-3.5 text-primary" />
                      <span>{bikeLoading ? 'Buscando…' : 'Fijar moto'}</span>
                    </Button>
                  </form>
                ) : (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">Moto seleccionada:</span>
                      <div
                        data-testid="selected-bike-chip"
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/30 text-xs font-semibold text-primary"
                      >
                        <Bike className="w-3.5 h-3.5" />
                        <span>{selectedBike}</span>
                        <button
                          type="button"
                          onClick={handleClearBike}
                          className="ml-1 text-primary/70 hover:text-primary p-0.5 rounded-full hover:bg-primary/20 transition-colors cursor-pointer"
                          aria-label="Quitar moto"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input de búsqueda de repuestos */}
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
                <div className="divide-y divide-border border border-border rounded-lg overflow-hidden max-h-72 overflow-y-auto">
                  {manualResults.map((p) => {
                    const stockNum = Number(p.stock);
                    const isOutOfStock = stockNum === 0;
                    const isLowStock = !isOutOfStock && stockNum <= Number(p.min_stock);

                    // Verificación de compatibilidad visual cuando no está forzado el filtro
                    let compatibleBadge = null;
                    if (selectedBike) {
                      const target = normalizeStr(selectedBike);
                      const isComp = (p.compatible_models || []).some(
                        (m) => normalizeStr(m) === target
                      );
                      if (isComp) {
                        compatibleBadge = (
                          <Badge variant="outline" className="text-[10px] px-1 py-0 border-success/40 text-success bg-success/10">
                            Compatible
                          </Badge>
                        );
                      } else if (!onlyCompatible) {
                        compatibleBadge = (
                          <span className="text-[10px] text-muted-foreground/80 italic flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3 text-warning" />
                            No figura como compatible con {selectedBike}
                          </span>
                        );
                      }
                    }

                    return (
                      <div
                        key={p.id}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left ${
                          isOutOfStock ? 'bg-muted/20 opacity-85' : 'hover:bg-accent/50'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <p className="text-sm font-medium text-foreground truncate">
                            {p.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
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
                            {compatibleBadge}
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-3">
                          <div>
                            <p className="text-sm font-semibold text-foreground tabular-nums">
                              S/ {Number(p.sale_price).toFixed(2)}
                            </p>
                            <div className="flex justify-end mt-0.5">
                              {isOutOfStock ? (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                  Agotado
                                </Badge>
                              ) : (
                                <Badge
                                  variant={isLowStock ? 'warning' : 'secondary'}
                                  className="text-[10px] px-1.5 py-0"
                                >
                                  Stock: {p.stock}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Acción: botón agregar si hay stock, o Ver alternativas si está agotado */}
                          {isOutOfStock ? (
                            <AlternativesPopover
                              product={p}
                              selectedBike={selectedBike}
                              onlyCompatible={onlyCompatible}
                              onSelectAlternative={handleAddProduct}
                            />
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleAddProduct(p)}
                              className="w-7 h-7 rounded-md bg-primary/10 text-primary flex items-center justify-center opacity-80 hover:opacity-100 hover:bg-primary/20 transition-all cursor-pointer"
                              aria-label={`Agregar ${p.name}`}
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
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
            onUpdate={handleCartUpdate}
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
