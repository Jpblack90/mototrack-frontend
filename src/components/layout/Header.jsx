import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../hooks/useCompany';
import { useStockAlerts } from '../../hooks/useStockAlerts';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Menu, LogOut, ChevronDown, Building2, KeyRound, Clock, Bell } from 'lucide-react';
import { ROLE_LABELS } from '../../lib/roles';
import ChangePasswordDialog from '../auth/ChangePasswordDialog';

const ALERT_ROLES = ['admin', 'cajero', 'almacenero'];

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const { alerts } = useStockAlerts();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : (user?.role?.[0] ?? 'U').toUpperCase();

  const roleName = ROLE_LABELS[user?.role] || user?.role || 'Usuario';
  const companyName = company?.nombre_comercial || company?.razon_social || '';
  const canSeeAlerts = user && ALERT_ROLES.includes(user.role);

  return (
    <header className="h-14 bg-card/80 backdrop-blur-sm border-b border-border flex items-center justify-between px-4 sm:px-6 shrink-0 transition-colors duration-150">
      {/* Botón hamburguesa — solo visible en móvil */}
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-muted-foreground hover:text-foreground"
        onClick={onMenuClick}
        aria-label="Abrir menú de navegación"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Nombre de la empresa (taller) */}
      {companyName && (
        <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/60 border border-border/60 text-xs font-medium text-foreground max-w-[260px]">
          <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
          <span className="truncate">{companyName}</span>
        </div>
      )}

      {/* Badge de Periodo de Prueba (Tarea 11.5) */}
      {company?.status === 'trial' && company?.days_left !== null && company?.days_left !== undefined && (
        <Badge
          data-testid="header-trial-badge"
          variant="outline"
          className={`ml-2 text-xs px-2.5 py-1 font-medium flex items-center gap-1.5 transition-colors duration-150 ${
            company.days_left <= 3
              ? 'border-amber-400 text-amber-800 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-300 animate-pulse'
              : 'border-primary/40 text-primary bg-primary/10'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Prueba: {company.days_left} {company.days_left === 1 ? 'día' : 'días'}</span>
        </Badge>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Acciones de cabecera: Campana de alertas y Menú de usuario */}
      <div className="flex items-center gap-2">
        {/* Campana de alertas de stock (admin, cajero, almacenero) */}
        {canSeeAlerts && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="header-alerts-bell"
                className="relative text-muted-foreground hover:text-foreground h-9 w-9 rounded-full transition-colors"
                aria-label="Alertas de stock"
              >
                <Bell className="w-5 h-5" />
                {alerts.total_alerts > 0 && (
                  <span
                    data-testid="header-alerts-badge"
                    className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold text-white transition-transform duration-150 ${
                      alerts.out_of_stock.length > 0 ? 'bg-destructive' : 'bg-warning text-amber-950 dark:text-amber-100'
                    }`}
                  >
                    {alerts.total_alerts > 99 ? '99+' : alerts.total_alerts}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80 p-0 shadow-lg">
              <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  Alertas de Stock
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {alerts.total_alerts} {alerts.total_alerts === 1 ? 'alerta' : 'alertas'}
                </Badge>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-border text-xs">
                {alerts.total_alerts === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Sin alertas de stock pendientes.
                  </div>
                ) : (
                  <>
                    {/* Agotados */}
                    {alerts.out_of_stock.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between px-2 py-1">
                          <span className="font-semibold text-[11px] text-destructive uppercase tracking-wider">
                            Agotados ({alerts.out_of_stock.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('/inventory?stock_status=out')}
                            className="text-[11px] text-primary hover:underline cursor-pointer"
                          >
                            Ver todos
                          </button>
                        </div>
                        {alerts.out_of_stock.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate('/inventory?stock_status=out')}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {item.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {item.sku || item.category}
                              </span>
                            </div>
                            <Badge variant="destructive" className="shrink-0 text-[10px] px-1.5 py-0">
                              0 / {item.min_stock} mín.
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Stock bajo */}
                    {alerts.low_stock.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between px-2 py-1">
                          <span className="font-semibold text-[11px] text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                            Stock Bajo ({alerts.low_stock.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('/inventory?stock_status=low')}
                            className="text-[11px] text-primary hover:underline cursor-pointer"
                          >
                            Ver todos
                          </button>
                        </div>
                        {alerts.low_stock.map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => navigate('/inventory?stock_status=low')}
                            className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors flex items-center justify-between group cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
                                {item.name}
                              </p>
                              <span className="text-[10px] text-muted-foreground font-mono">
                                {item.sku || item.category}
                              </span>
                            </div>
                            <Badge variant="warning" className="shrink-0 text-[10px] px-1.5 py-0">
                              {item.stock} / {item.min_stock} mín.
                            </Badge>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </PopoverContent>
          </Popover>
        )}

        {/* Menú de usuario con Avatar y DropdownMenu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1 rounded-full sm:rounded-lg hover:bg-accent/60 transition-colors duration-150 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="Menú de cuenta de usuario"
            >
              <Avatar className="h-8 w-8 border border-border/80">
                <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>

              <div className="hidden sm:flex flex-col items-start text-left leading-tight">
                <span className="text-xs font-semibold text-foreground">
                  {user?.name ?? 'Usuario'}
                </span>
                <span className="text-[11px] text-muted-foreground capitalize">
                  {roleName}
                </span>
              </div>

              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block opacity-60" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-xs font-semibold text-foreground leading-none">
                  {user?.name ?? 'Usuario'}
                </p>
                <p className="text-[11px] leading-none text-muted-foreground">
                  {user?.email ?? ''}
                </p>
                {companyName && (
                  <p className="text-[11px] leading-none text-muted-foreground font-medium pt-0.5">
                    {companyName}
                  </p>
                )}
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 uppercase font-medium">
                    {roleName}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => setChangePasswordOpen(true)}
              className="cursor-pointer gap-2 text-xs"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Cambiar contraseña</span>
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 text-xs"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangePasswordDialog
        open={changePasswordOpen}
        onOpenChange={setChangePasswordOpen}
      />
    </header>
  );
}
