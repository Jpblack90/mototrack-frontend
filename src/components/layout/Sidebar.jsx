import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  LayoutDashboard,
  Package,
  Wrench,
  ShoppingCart,
  Receipt,
  X,
} from 'lucide-react';

const NAV_LINK_BASE =
  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150';
const NAV_ACTIVE   = 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs font-semibold';
const NAV_INACTIVE = 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground';

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `${NAV_LINK_BASE} ${isActive ? NAV_ACTIVE : NAV_INACTIVE}`
      }
    >
      <Icon className="w-4 h-4 shrink-0" />
      <span>{label}</span>
    </NavLink>
  );
}

export default function Sidebar({ open, onClose }) {
  const { user } = useAuth();

  return (
    <>
      {/* Overlay móvil con backdrop-blur */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Panel lateral */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-full w-64 bg-sidebar border-r border-sidebar-border flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${open ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:translate-x-0 lg:z-auto
        `}
      >
        {/* Logo / Marca */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border shrink-0">
          <div className="flex items-center min-w-0">
            <img
              src="/logo.png"
              alt="MotoTrack"
              className="w-40 h-auto object-contain"
            />
          </div>

          {/* Botón cerrar solo en móvil */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
            onClick={onClose}
            aria-label="Cerrar menú"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Navegación */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {/* Dashboard solo visible para admin */}
          {user?.role === 'admin' && (
            <NavItem to="/dashboard" label="Dashboard" icon={LayoutDashboard} />
          )}
          <NavItem to="/inventory" label="Inventario" icon={Package} />
          <NavItem to="/workorders" label="Órdenes de Trabajo" icon={Wrench} />
          <NavItem to="/sales" label="Ventas (POS)" icon={ShoppingCart} />
          <NavItem to="/invoicing" label="Facturación" icon={Receipt} />
        </nav>

        {/* Rol del usuario al pie */}
        <div className="px-4 py-3.5 border-t border-sidebar-border flex items-center justify-between">
          <div className="space-y-0.5">
            <p className="text-[10px] text-sidebar-foreground/50 uppercase tracking-wider font-semibold">
              Rol Activo
            </p>
            <p className="text-xs font-medium text-sidebar-foreground capitalize">
              {user?.role}
            </p>
          </div>
          <Badge variant="outline" className="text-[10px] uppercase font-mono px-1.5 py-0 border-sidebar-border text-sidebar-foreground/60">
            v1.0
          </Badge>
        </div>
      </aside>
    </>
  );
}
