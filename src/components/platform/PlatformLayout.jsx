import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Building2, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import { cn } from 'cn';

const NAV_ITEMS = [
  { to: '/plataforma', label: 'Resumen', icon: LayoutDashboard, end: true },
  { to: '/plataforma/talleres', label: 'Talleres', icon: Building2, end: false },
];

/**
 * Layout independiente del panel de plataforma con franja superior oscura,
 * logo MotoTrack y etiqueta "Plataforma · Soporte", sin menú de talleres.
 */
export default function PlatformLayout() {
  const { admin, logout } = usePlatformAuth();
  const navigate = useNavigate();
  const [logoError, setLogoError] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/plataforma/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-30 bg-sidebar text-sidebar-foreground border-b border-sidebar-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3 py-3">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
              <NavLink to="/plataforma" className="flex items-center gap-2.5 shrink-0">
                {!logoError ? (
                  <img
                    src="/logo.png?v=3"
                    alt="MotoTrack"
                    className="h-8 w-8 rounded-lg object-contain bg-sidebar-accent/70 p-0.5 border border-sidebar-border"
                    onError={() => setLogoError(true)}
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                )}
                <span className="text-sm font-bold tracking-tight text-sidebar-foreground">
                  MotoTrack
                </span>
              </NavLink>

              <Badge
                variant="outline"
                className="border-sidebar-border bg-sidebar-accent/80 text-sidebar-foreground text-[11px] font-medium px-2.5 py-0.5 shrink-0"
              >
                <ShieldCheck className="w-3 h-3 mr-1 text-primary" />
                Plataforma · Soporte
              </Badge>

              <nav
                className="flex items-center gap-1 sm:ml-2"
                aria-label="Navegación de plataforma"
              >
                {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-colors duration-150',
                        isActive
                          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-xs'
                          : 'text-sidebar-foreground/80 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{label}</span>
                  </NavLink>
                ))}
              </nav>
            </div>

            <div className="flex items-center gap-3 ml-auto">
              <div className="hidden md:flex flex-col items-end text-right">
                <span className="text-xs font-medium text-sidebar-foreground leading-tight">
                  {admin?.name || 'Soporte'}
                </span>
                <span className="text-[11px] text-sidebar-foreground/70 leading-tight">
                  {admin?.email || ''}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="border-sidebar-border bg-sidebar-accent/60 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-foreground"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Cerrar sesión</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
}
