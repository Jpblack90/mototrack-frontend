import { useEffect, useState } from 'react';
import client from '../api/client';

// ─── Tarjeta de métrica ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, color = 'indigo', icon }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-700 border-indigo-100',
    green:  'bg-green-50  text-green-700  border-green-100',
    amber:  'bg-amber-50  text-amber-700  border-amber-100',
    red:    'bg-red-50    text-red-700    border-red-100',
  };
  return (
    <div className={`rounded-xl border p-5 ${colors[color]}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">{icon}</span>
        <span className="text-sm font-medium opacity-80">{label}</span>
      </div>
      <p className="text-3xl font-bold">{value}</p>
      {sub && <p className="text-sm mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

// ─── Skeleton de carga ────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-5 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-2/3 mb-3" />
      <div className="h-8 bg-gray-200 rounded w-1/2 mb-2" />
      <div className="h-3 bg-gray-200 rounded w-1/3" />
    </div>
  );
}

export default function DashboardPage() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    client.get('/dashboard')
      .then(({ data: res }) => setData(res.data))
      .catch((err) =>
        setError(err.response?.data?.error?.message ?? 'Error al cargar el dashboard.')
      )
      .finally(() => setLoading(false));
  }, []);

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  const sales     = data?.sales;
  const inventory = data?.inventory;
  const workorders= data?.workorders;
  const invoicing = data?.invoicing;

  const pendingCount = invoicing?.pending_contingency?.length ?? 0;
  const lowStock     = inventory?.low_stock_products ?? [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {loading ? (
          <>
            <SkeletonCard /><SkeletonCard /><SkeletonCard /><SkeletonCard />
          </>
        ) : (
          <>
            <StatCard
              label="Ventas de hoy"
              value={`S/ ${Number(sales?.total_revenue ?? 0).toFixed(2)}`}
              sub={`${sales?.total_sales_count ?? 0} transacciones`}
              color="green"
              icon="💰"
            />
            <StatCard
              label="Valor de inventario"
              value={`S/ ${Number(inventory?.total_inventory_value ?? 0).toFixed(2)}`}
              sub={`${inventory?.total_active_products ?? 0} productos activos`}
              color="indigo"
              icon="📦"
            />
            <StatCard
              label="Órdenes activas"
              value={workorders?.active_count ?? 0}
              sub="En progreso"
              color="amber"
              icon="🔧"
            />
            <StatCard
              label="Facturas en contingencia"
              value={pendingCount}
              sub={pendingCount > 0 ? 'Requieren reenvío' : 'Todo al día'}
              color={pendingCount > 0 ? 'red' : 'green'}
              icon="🧾"
            />
          </>
        )}
      </div>

      {/* Alerta de stock bajo */}
      {!loading && lowStock.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5">
          <h2 className="font-semibold text-amber-800 mb-3 flex items-center gap-2">
            ⚠️ Productos con stock bajo ({lowStock.length})
          </h2>
          <ul className="divide-y divide-amber-100">
            {lowStock.map((p) => (
              <li key={p.id} className="py-2 flex justify-between text-sm text-amber-900">
                <span className="font-medium">{p.name}</span>
                <span>
                  Stock: <b>{p.stock}</b> / Mínimo: {p.min_stock}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
