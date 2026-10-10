import { useState, useEffect, useCallback } from 'react';
import client from '../api/client';
import InventoryTable from '../components/inventory/InventoryTable';
import ProductDialog from '../components/inventory/ProductDialog';
import DeactivateConfirm from '../components/inventory/DeactivateConfirm';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Plus, ChevronDown, Pencil, Sparkles, Search } from 'lucide-react';

export default function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Modales
  // modal: null | 'product' | 'deactivate'
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState('create'); // 'create' | 'edit'
  const [dialogDefaultTab, setDialogDefaultTab] = useState('manual');
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Estado de desactivación
  const [deactivateModalOpen, setDeactivateModalOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // ─── Carga de productos (GET /api/inventory?search=...) ────────────────────
  const fetchProducts = useCallback(async (q = '') => {
    setLoading(true);
    setFetchError('');
    try {
      const params = q ? { search: q } : {};
      const { data } = await client.get('/inventory', { params });
      setProducts(data.data ?? []);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Error al cargar el inventario.';
      setFetchError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar al montar
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Búsqueda con debounce exacto de 400ms (sin tocar la lógica de negocio)
  useEffect(() => {
    const timer = setTimeout(() => fetchProducts(search), 400);
    return () => clearTimeout(timer);
  }, [search, fetchProducts]);

  // ─── Callbacks de modales ─────────────────────────────────────────────────
  function handleCreated(newProduct) {
    setProducts(prev => [newProduct, ...prev]);
    setDialogOpen(false);
  }

  function handleEdited(updated) {
    setProducts(prev => prev.map(p => (p.id === updated.id ? { ...p, ...updated } : p)));
    setDialogOpen(false);
    setSelectedProduct(null);
  }

  async function handleDeactivate() {
    if (!selectedProduct) return;
    setDeactivating(true);
    try {
      await client.delete(`/inventory/${selectedProduct.id}`);
      setProducts(prev => prev.filter(p => p.id !== selectedProduct.id));
      toast.success(`Producto "${selectedProduct.name}" desactivado`);
      setDeactivateModalOpen(false);
      setSelectedProduct(null);
    } catch (err) {
      const msg = err.response?.data?.error?.message ?? 'Error al desactivar el producto.';
      toast.error(msg);
    } finally {
      setDeactivating(false);
    }
  }

  function openCreate(tab = 'manual') {
    setSelectedProduct(null);
    setDialogMode('create');
    setDialogDefaultTab(tab);
    setDialogOpen(true);
  }

  function openEdit(product) {
    setSelectedProduct(product);
    setDialogMode('edit');
    setDialogDefaultTab('manual');
    setDialogOpen(true);
  }

  function openDeactivate(product) {
    setSelectedProduct(product);
    setDeactivateModalOpen(true);
  }

  return (
    <div className="space-y-6">
      {/* ── Encabezado de sección ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Inventario</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading
              ? 'Cargando catálogo…'
              : `${products.length} producto${products.length !== 1 ? 's' : ''} activo${products.length !== 1 ? 's' : ''}`}
          </p>
        </div>

        {/* Dropdown "+ Nuevo Repuesto" migrado a shadcn DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>Nuevo Repuesto</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => openCreate('manual')} className="cursor-pointer gap-2">
              <Pencil className="w-4 h-4 text-muted-foreground" />
              <span>Registro Manual</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => openCreate('scan')} className="cursor-pointer gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>Escanear con IA</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* ── Barra de búsqueda con Input de shadcn e ícono ── */}
      <div className="bg-card rounded-xl border border-border shadow-sm p-4">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="search"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre o SKU…"
            className="pl-8"
          />
        </div>
      </div>

      {/* ── Error de carga ── */}
      {fetchError && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/10 text-destructive px-4 py-3 text-sm">
          {fetchError}
        </div>
      )}

      {/* ── Tabla de productos migrada ── */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <InventoryTable
          products={products}
          loading={loading}
          onEdit={openEdit}
          onDeactivate={openDeactivate}
        />
      </div>

      {/* ── Dialog de Creación / Edición ── */}
      <ProductDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setSelectedProduct(null);
        }}
        onSuccess={dialogMode === 'edit' ? handleEdited : handleCreated}
        mode={dialogMode}
        initialData={selectedProduct}
        defaultTab={dialogDefaultTab}
      />

      {/* ── AlertDialog de Soft-Delete ── */}
      {deactivateModalOpen && selectedProduct && (
        <DeactivateConfirm
          product={selectedProduct}
          loading={deactivating}
          onConfirm={handleDeactivate}
          onCancel={() => {
            setDeactivateModalOpen(false);
            setSelectedProduct(null);
          }}
        />
      )}
    </div>
  );
}
