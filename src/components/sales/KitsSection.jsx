import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import client from '../../api/client';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { EmptyState } from '../ui/empty-state';
import { Plus, ChevronUp, PackagePlus, AlertCircle, Trash2 } from 'lucide-react';

/**
 * Sección de Kits en el POS.
 * Admin puede crear kits con nombre, kit_price, y componentes.
 * Cajero solo puede verlos y agregarlos al carrito.
 */
export default function KitsSection({ kits, kitsLoading, onAddKit, createKit }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PackagePlus className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Kits de Repuestos</h3>
        </div>
        {isAdmin && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCreate((v) => !v)}
            className="h-7 text-xs text-primary gap-1"
          >
            {showCreate ? <ChevronUp className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {showCreate ? 'Cerrar' : 'Nuevo Kit'}
          </Button>
        )}
      </div>

      {/* Formulario de creación (Admin only) */}
      {isAdmin && showCreate && (
        <CreateKitForm
          createKit={createKit}
          onCreated={() => setShowCreate(false)}
        />
      )}

      {/* Lista de Kits */}
      {kitsLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <EmptyState
          icon={PackagePlus}
          title="Sin kits de repuestos"
          description="Aún no se han configurado kits o paquetes en el sistema."
          compact
        />
      ) : (
        <div className="space-y-2 max-h-[220px] overflow-y-auto pr-0.5">
          {kits.map((kit) => {
            const price = kit.kit_price ?? kit.price;
            return (
              <div
                key={kit.id}
                className="flex items-center justify-between bg-card border border-border rounded-lg p-2.5 hover:bg-accent/40 transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{kit.name}</p>
                    <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/30 text-primary">
                      Kit
                    </Badge>
                  </div>
                  {price && (
                    <p className="text-xs font-semibold text-foreground tabular-nums mt-0.5">
                      S/ {Number(price).toFixed(2)}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => onAddKit(kit)}
                  className="h-8 px-2.5 text-xs gap-1 shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar</span>
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Formulario de creación de Kit (Admin) ───────────────────────────────────

function CreateKitForm({ createKit, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [products, setProducts] = useState([]);
  const [kitItems, setKitItems] = useState([{ product_id: '', quantity: 1 }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    client
      .get('/inventory')
      .then(({ data }) => setProducts(data.data ?? []))
      .catch(() => {});
  }, []);

  function addKitItemRow() {
    setKitItems((prev) => [...prev, { product_id: '', quantity: 1 }]);
  }

  function removeKitItemRow(index) {
    setKitItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateKitItem(index, field, value) {
    setKitItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const validItems = kitItems
      .filter((i) => i.product_id)
      .map((i) => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) || 1 }));

    if (validItems.length === 0) {
      setError('Debes agregar al menos un producto al kit.');
      return;
    }

    setLoading(true);
    const res = await createKit({
      name: name.trim(),
      description: description.trim() || undefined,
      kit_price: price ? Number(price) : undefined,
      items: validItems,
    });
    setLoading(false);

    if (res.ok) {
      onCreated();
    } else {
      setError(res.error);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-3 mb-2"
    >
      <p className="text-xs font-semibold text-primary uppercase tracking-wide">
        Configurar Nuevo Kit
      </p>

      <div className="space-y-1">
        <Label htmlFor="kit_name" className="text-xs">
          Nombre del kit <span className="text-destructive">*</span>
        </Label>
        <Input
          id="kit_name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Kit Mantenimiento 10W40"
          className="h-8 text-xs bg-background"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label htmlFor="kit_price" className="text-xs">
            Precio del kit (S/)
          </Label>
          <Input
            id="kit_price"
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            className="h-8 text-xs bg-background"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="kit_desc" className="text-xs">
            Descripción
          </Label>
          <Input
            id="kit_desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Opcional"
            className="h-8 text-xs bg-background"
          />
        </div>
      </div>

      {/* Ítems del kit */}
      <div className="space-y-1.5 pt-1">
        <div className="flex items-center justify-between">
          <Label className="text-xs">Componentes del Kit</Label>
          <button
            type="button"
            onClick={addKitItemRow}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> Añadir repuesto
          </button>
        </div>

        <div className="space-y-1.5 max-h-36 overflow-y-auto">
          {kitItems.map((item, idx) => (
            <div key={idx} className="flex gap-1.5 items-center">
              <select
                value={item.product_id}
                onChange={(e) => updateKitItem(idx, 'product_id', e.target.value)}
                className="flex-1 h-8 rounded-md border border-input bg-background px-2 text-xs focus:ring-1 focus:ring-ring"
              >
                <option value="">Selecciona repuesto…</option>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <Input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) => updateKitItem(idx, 'quantity', e.target.value)}
                className="w-14 h-8 text-xs text-center bg-background"
              />
              {kitItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeKitItemRow(idx)}
                  className="text-muted-foreground hover:text-destructive p-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2 rounded">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Button type="submit" disabled={loading} size="sm" className="w-full h-8 text-xs">
        {loading ? 'Creando kit…' : 'Crear Kit'}
      </Button>
    </form>
  );
}
