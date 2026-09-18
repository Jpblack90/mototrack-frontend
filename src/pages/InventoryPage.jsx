import { useState, useEffect, useRef, useCallback } from 'react';
import client from '../api/client';
import InventoryTable    from '../components/inventory/InventoryTable';
import ManualProductModal from '../components/inventory/ManualProductModal';
import ScanProductModal   from '../components/inventory/ScanProductModal';
import DeactivateConfirm  from '../components/inventory/DeactivateConfirm';

// ─── Menú desplegable "+ Nuevo Repuesto" ─────────────────────────────────────

function NewProductMenu({ onManual, onScan }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-4 py-2 transition-colors text-sm flex items-center gap-2"
      >
        <span>+</span> Nuevo Repuesto
        <span className="text-indigo-300 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1">
          <button
            onClick={() => { setOpen(false); onManual(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            ✏️ Registro Manual
          </button>
          <button
            onClick={() => { setOpen(false); onScan(); }}
            className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2"
          >
            📷 Escanear con IA
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function InventoryPage() {
  const [products,  setProducts]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [fetchError, setFetchError] = useState('');

  // Modales activos
  const [modal, setModal] = useState(null);
  // modal: null | 'manual' | 'scan' | 'edit' | 'deactivate'
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estado de desactivación
  const [deactivating, setDeactivating] = useState(false);

  // ─── Carga de productos ─────────────────────────────────────────────────

  const fetchProducts = useCallback(async (q = '') => {
    setLoading(true);
    setFetchError('');
    try {
      const params = q ? { search: q } : {};
      const { data } = await client.get('/inventory', { params });
      setProducts(data.data ?? []);
    } catch (err) {
      setFetchError(
        err.response?.data?.error?.message ?? 'Error al cargar el inventario.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // Búsqueda con debounce de 400ms
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search), 400);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  // ─── Callbacks de modales ───────────────────────────────────────────────

  /** Añade el producto nuevo al estado local sin refetch completo */
  function handleCreated(newProduct) {
    setProducts(prev => [newProduct, ...prev]);
    setModal(null);
  }

  /** Reemplaza el producto editado en el estado local */
  function handleEdited(updated) {
    setProducts(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
    setModal(null);
    setSelectedProduct(null);
  }

  /** Quita el producto del estado local (soft-delete: no lo recarga, solo lo saca de la vista) */
  async function handleDeactivate() {
    if (!selectedProduct) return;
    setDeactivating(true);
    try {
      await client.delete(`/inventory/${selectedProduct.id}`);
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      setModal(null);
      setSelectedProduct(null);
    } catch (err) {
      alert(err.response?.data?.error?.message ?? 'Error al desactivar el producto.');
    } finally {
      setDeactivating(false);
    }
  }

  function openEdit(product) {
    setSelectedProduct(product);
    setModal('edit');
  }

  function openDeactivate(product) {
    setSelectedProduct(product);
    setModal('deactivate');
  }

  function closeModal() {
    setModal(null);
    setSelectedProduct(null);
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="bg-slate-50 min-h-full space-y-6">
      {/* Header de sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-semibold text-slate-900 text-2xl">Inventario</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? 'Cargando…' : `${products.length} producto${products.length !== 1 ? 's' : ''} activo${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <NewProductMenu
          onManual={() => setModal('manual')}
          onScan={() => setModal('scan')}
        />
      </div>

      {/* Barra de búsqueda */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <input
          type="search"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nombre o SKU…"
          className="w-full sm:max-w-xs px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900"
        />
      </div>

      {/* Error de carga */}
      {fetchError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
          {fetchError}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <InventoryTable
          products={products}
          loading={loading}
          onEdit={openEdit}
          onDeactivate={openDeactivate}
        />
      </div>

      {/* ── Modales ── */}

      {modal === 'manual' && (
        <ManualProductModal
          mode="create"
          onSuccess={handleCreated}
          onClose={closeModal}
        />
      )}

      {modal === 'scan' && (
        <ScanProductModal
          onSuccess={handleCreated}
          onClose={closeModal}
          onSwitchToManual={() => setModal('manual')}
        />
      )}

      {modal === 'edit' && selectedProduct && (
        <ManualProductModal
          mode="edit"
          initialData={selectedProduct}
          onSuccess={handleEdited}
          onClose={closeModal}
        />
      )}

      {modal === 'deactivate' && selectedProduct && (
        <DeactivateConfirm
          product={selectedProduct}
          loading={deactivating}
          onConfirm={handleDeactivate}
          onCancel={closeModal}
        />
      )}
    </div>
  );
}
