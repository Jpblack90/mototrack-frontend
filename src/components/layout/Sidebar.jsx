import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_LINK_BASE =
  'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors';
const NAV_ACTIVE   = 'bg-indigo-700 text-white';
const NAV_INACTIVE = 'text-indigo-100 hover:bg-indigo-700/60';

function NavItem({ to, label, icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${NAV_LINK_BASE} ${isActive ? NAV_ACTIVE : NAV_INACTIVE}`
      }
    >
      <span className="text-lg">{icon}</span>
      {label}
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay móvil */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Panel */}
      <aside
        className={`
          fixed top-0 left-0 z-30 h-full w-64 bg-indigo-800 flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo / título */}
        <div className="flex items-center justify-between px-5 py-5 border-b border-indigo-700">
          <span className="text-white font-bold text-lg tracking-tight">
            🏍️ MotoTrack AI
          </span>
          {/* Botón cerrar solo en móvil */}
          <button
            className="lg:hidden text-indigo-200 hover:text-white"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard solo visible para admin */}
          {user?.role === 'admin' && (
            <NavItem to="/dashboard"   label="Dashboard"        icon="📊" />
          )}
          <NavItem to="/inventory"     label="Inventario"       icon="📦" />
          <NavItem to="/workorders"    label="Órdenes de Trabajo" icon="🔧" />
          <NavItem to="/sales"         label="Ventas"           icon="🛒" />
          <NavItem to="/invoicing"     label="Facturación"      icon="🧾" />
        </nav>

        {/* Rol del usuario al pie */}
        <div className="px-5 py-4 border-t border-indigo-700">
          <p className="text-xs text-indigo-300 uppercase tracking-wider">
            {user?.role}
          </p>
        </div>
      </aside>
    </>
  );
}
