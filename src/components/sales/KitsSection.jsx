import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { PlusIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import client from '../../api/client';

/**
 * Sección de Kits en el panel de ventas.
 *
 * Props:
 *  kits         array de kits (del hook useSales)
 *  kitsLoading  boolean
 *  onAddKit     (kit) => void   — agrega al carrito vía useCart
 *  createKit    (data) => Promise — del hook useSales
 */
export default function KitsSection({ kits, kitsLoading, onAddKit, createKit }) {
  const { user } = useAuth();
  const isAdmin  = user?.role === 'admin';

  const [showCreate, setShowCreate] = useState(false);

  return (
    <div>
      {/* Header de sección */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-900 text-sm">Kits</h3>
        {/* Solo admin puede crear kits */}
        {isAdmin && (
          <button
            onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          >
            {showCreate ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <PlusIcon className="w-3.5 h-3.5" />}
            {showCreate ? 'Cancelar' : 'Nuevo kit'}
          </button>
        )}
      </div>

      {/* Formulario de creación (solo admin) */}
      {isAdmin && showCreate && (
        <CreateKitForm
          createKit={createKit}
          onCreated={() => setShowCreate(false)}
        />
      )}

      {/* Lista de kits */}
      {kitsLoading ? (
        <div className="animate-pulse space-y-2">
          {[1, 2].map(i => (
            <div key={i} className="h-12 bg-slate-100 rounded-lg" />
          ))}
        </div>
      ) : kits.length === 0 ? (
        <p className="text-xs text-slate-400 py-2">No hay kits disponibles.</p>
      ) : (
        <div className="space-y-2">
          {kits.map(kit => (
            <div
              key={kit.id}
              className="flex items-center justify-between bg-white border border-slate-200 rounded-lg px-3 py-2.5 hover:bg-slate-50 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{kit.name}</p>
                {(kit.kit_price ?? kit.price) && (
                  <p className="text-xs text-slate-500">S/ {Number(kit.kit_price ?? kit.price).toFixed(2)}</p>
                )}
              </div>
              <button
                onClick={() => onAddKit(kit)}
                className="ml-2 shrink-0 w-7 h-7 flex items-center justify-center rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-colors"
              >
                <PlusIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Formulario de creación de kit (admin only) ───────────────────────────────

function CreateKitForm({ createKit, onCreated }) {
  const [name,        setName]        = useState('');
  const [description, setDescription] = useState('');
  const [price,       setPrice]       = useState('');
  const [products,    setProducts]    = useState([]);
  const [kitItems,    setKitItems]    = useState([{ product_id: '', quantity: 1 }]);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  // Cargar productos para el selector
  useEffect(() => {
    client.get('/inventory').then(({ data }) => setProducts(data.data ?? [])).catch(() => {});
  }, []);

  function addKitItemRow() {
    setKitItems(prev => [...prev, { product_id: '', quantity: 1 }]);
  }

  function removeKitItemRow(index) {
    setKitItems(prev => prev.filter((_, i) => i !== index));
  }

  function updateKitItem(index, field, value) {
    setKitItems(prev => prev.map((item, i) =>
      i === index ? { ...item, [field]: value } : item
    ));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const validItems = kitItems
      .filter(i => i.product_id)
      .map(i => ({ product_id: Number(i.product_id), quantity: Number(i.quantity) || 1 }));

    if (validItems.length === 0) {
      setError('Agrega al menos un producto al kit.');
      return;
    }

    setLoading(true);
    const res = await createKit({
      name:        name.trim(),
      description: description.trim() || undefined,
      kit_price:   price ? Number(price) : undefined,
      items:       validItems,
    });
    setLoading(false);

    if (res.ok) {
      onCreated();
    } else {
      setError(res.error);
    }
  }

  return (
    <form onSubmit={handleSubmit}
      className="mb-4 bg-indigo-50/60 border border-indigo-100 rounded-xl p-4 space-y-3">
      <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">Nuevo kit</p>

      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1">
          Nombre <span className="text-red-500">*</span>
        </label>
        <input required value={name} onChange={e => setName(e.target.value)}
          placeholder="Ej: Kit de mantenimiento básico"
          className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Precio del kit (S/)</label>
          <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">Descripción</label>
          <input value={description} onChange={e => setDescription(e.target.value)}
            placeholder="Opcional"
            className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
        </div>
      </div>

      {/* Productos del kit */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-medium text-slate-700">Productos</label>
          <button type="button" onClick={addKitItemRow}
            className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
            <PlusIcon className="w-3 h-3" /> Agregar fila
          </button>
        </div>
        <div className="space-y-2">
          {kitItems.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <select value={item.product_id} onChange={e => updateKitItem(idx, 'product_id', e.target.value)}
                className="flex-1 px-2 py-1.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900">
                <option value="">Seleccionar producto</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <input type="number" min="1" value={item.quantity}
                onChange={e => updateKitItem(idx, 'quantity', e.target.value)}
                className="w-16 px-2 py-1.5 border border-slate-300 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900" />
              {kitItems.length > 1 && (
                <button type="button" onClick={() => removeKitItemRow(idx)}
                  className="text-red-400 hover:text-red-600 px-1">
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center text-xs py-1.5">
        {loading ? 'Creando kit…' : 'Crear kit'}
      </Button>
    </form>
  );
}
