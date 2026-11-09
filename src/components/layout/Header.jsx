import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCompany } from '../../hooks/useCompany';
import { useStockAlerts } from '../../hooks/useStockAlerts';
import { usePickupAlerts } from '../../hooks/usePickupAlerts';
import { useWhatsAppNotices } from '../../hooks/useWhatsAppNotices';
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
import { Menu, LogOut, ChevronDown, Building2, KeyRound, Clock, Bell, Phone, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { ROLE_LABELS } from '../../lib/roles';
import ChangePasswordDialog from '../auth/ChangePasswordDialog';

const ALERT_ROLES = ['admin', 'cajero', 'almacenero'];
const PICKUP_ROLES = ['admin', 'cajero'];

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const { alerts } = useStockAlerts();
  const { notPickedUp, dueSoon, totalPickupAlerts } = usePickupAlerts();
  const { pending: pendingWhatsApp, getLink: getWhatsAppLink, markOpened: markWhatsAppOpened } = useWhatsAppNotices();
  const navigate = useNavigate();
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  async function handleSendNoticeFromHeader(notice) {
    const res = await getWhatsAppLink(notice.id);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    window.open(res.data.url, '_blank', 'noopener,noreferrer');
    await markWhatsAppOpened(notice.id);
    toast.success('Se abrió WhatsApp. Envía el mensaje desde tu teléfono o WhatsApp Web.');
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
  const canSeePickupAlerts = user && PICKUP_ROLES.includes(user.role);

  // El badge suma las alertas de stock, las motos por recoger y los avisos pendientes de WhatsApp
  const totalWhatsApp = canSeePickupAlerts ? pendingWhatsApp.length : 0;
  const totalAllAlerts = alerts.total_alerts + (canSeePickupAlerts ? totalPickupAlerts : 0) + totalWhatsApp;
  const hasCritical = alerts.out_of_stock.length > 0 || (canSeePickupAlerts && notPickedUp.length > 0);

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
              ? 'border-warning/40 text-warning bg-warning/10 animate-pulse'
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
        {/* Campana de alertas (admin, cajero, almacenero) */}
        {canSeeAlerts && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                data-testid="header-alerts-bell"
                className="relative text-muted-foreground hover:text-foreground h-9 w-9 rounded-full transition-colors"
                aria-label="Alertas del taller"
              >
                <Bell className="w-5 h-5" />
                {totalAllAlerts > 0 && (
                  <span
                    data-testid="header-alerts-badge"
                    className={`absolute -top-0.5 -right-0.5 flex h-4 min-w-4 px-1 items-center justify-center rounded-full text-[10px] font-bold transition-transform duration-150 ${
                      hasCritical ? 'bg-destructive text-destructive-foreground' : 'bg-warning text-warning-foreground'
                    }`}
                  >
                    {totalAllAlerts > 99 ? '99+' : totalAllAlerts}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-88 p-0 shadow-lg">
              <div className="p-3 border-b border-border bg-muted/30 flex items-center justify-between">
                <span className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                  <Bell className="w-3.5 h-3.5 text-primary" />
                  Alertas del Taller
                </span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  {totalAllAlerts} {totalAllAlerts === 1 ? 'alerta' : 'alertas'}
                </Badge>
              </div>
              <div className="max-h-96 overflow-y-auto divide-y divide-border text-xs">
                {totalAllAlerts === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    Sin alertas pendientes.
                  </div>
                ) : (
                  <>
                    {/* ─── Grupo: Avisos por WhatsApp (RF-15, admin y cajero) ─── */}
                    {canSeePickupAlerts && pendingWhatsApp.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between px-2 py-0.5">
                          <span className="font-semibold text-[11px] text-success uppercase tracking-wider flex items-center gap-1">
                            <MessageCircle className="w-3 h-3 text-success" />
                            Avisos por enviar ({pendingWhatsApp.length})
                          </span>
                          <button
                            type="button"
                            onClick={() => navigate('/workorders')}
                            className="text-[11px] text-primary hover:underline cursor-pointer"
                          >
                            Ver OTs
                          </button>
                        </div>
                        {pendingWhatsApp.map((notice) => {
                          const eventMeta = {
                            recibido: { label: 'Recibido', variant: 'secondary' },
                            pendiente_aprobacion: { label: 'Trabajo adicional', variant: 'warning' },
                            terminado: { label: 'Listo para recoger', variant: 'success' },
                            no_recogido: { label: 'No recogido', variant: 'destructive' },
                          }[notice.event] || { label: notice.event, variant: 'outline' };

                          return (
                            <div
                              key={notice.id}
                              className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors flex items-center justify-between gap-2 group"
                            >
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                                    {notice.placa}
                                  </span>
                                  <Badge variant={eventMeta.variant} className="text-[9px] px-1 py-0 font-normal">
                                    {eventMeta.label}
                                  </Badge>
                                </div>
                                <p className="text-[11px] text-muted-foreground truncate">{notice.cliente || 'Cliente'}</p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs gap-1 border-success/30 text-success hover:bg-success/10 shrink-0"
                                onClick={() => handleSendNoticeFromHeader(notice)}
                              >
                                <MessageCircle className="w-3 h-3 text-success" />
                                Avisar
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ─── Grupo: Motos por recoger (RF-17, admin y cajero) ─── */}
                    {canSeePickupAlerts && totalPickupAlerts > 0 && (
                      <div className="p-2 space-y-2">
                        {/* No recogidas */}
                        {notPickedUp.length > 0 && (
                          <div className="space-y-1">
                            <div className="flex items-center justify-between px-2 py-0.5">
                              <span className="font-semibold text-[11px] text-destructive uppercase tracking-wider">
                                No recogidas ({notPickedUp.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate('/workorders?status=no_recogido')}
                                className="text-[11px] text-primary hover:underline cursor-pointer"
                              >
                                Ver tablero
                              </button>
                            </div>
                            {notPickedUp.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => navigate('/workorders?status=no_recogido')}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors flex items-start justify-between group cursor-pointer"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                                      {item.placa}
                                    </span>
                                    <Badge variant="destructive" className="text-[9px] px-1 py-0 font-normal">
                                      No recogida
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">{item.cliente}</p>
                                  {item.telefono && (
                                    <a
                                      href={`tel:${item.telefono}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                      {item.telefono}
                                    </a>
                                  )}
                                </div>
                                <span className="text-[10px] text-destructive shrink-0 font-medium whitespace-nowrap pt-0.5">
                                  Esperando {item.dias_esperando} {item.dias_esperando === 1 ? 'día' : 'días'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Vencen pronto */}
                        {dueSoon.length > 0 && (
                          <div className="space-y-1 pt-1 border-t border-border/50">
                            <div className="flex items-center justify-between px-2 py-0.5">
                              <span className="font-semibold text-[11px] text-warning uppercase tracking-wider">
                                Vencen pronto ({dueSoon.length})
                              </span>
                              <button
                                type="button"
                                onClick={() => navigate('/workorders')}
                                className="text-[11px] text-primary hover:underline cursor-pointer"
                              >
                                Ver tablero
                              </button>
                            </div>
                            {dueSoon.map((item) => (
                              <div
                                key={item.id}
                                onClick={() => navigate('/workorders')}
                                className="w-full text-left px-2 py-1.5 rounded hover:bg-accent/50 transition-colors flex items-start justify-between group cursor-pointer"
                              >
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-mono font-bold text-xs text-foreground group-hover:text-primary transition-colors">
                                      {item.placa}
                                    </span>
                                    <Badge variant="warning" className="text-[9px] px-1 py-0 font-normal">
                                      Vence pronto
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-muted-foreground truncate">{item.cliente}</p>
                                  {item.telefono && (
                                    <a
                                      href={`tel:${item.telefono}`}
                                      onClick={(e) => e.stopPropagation()}
                                      className="text-[10px] text-primary hover:underline flex items-center gap-1 mt-0.5"
                                    >
                                      <Phone className="w-2.5 h-2.5" />
                                      {item.telefono}
                                    </a>
                                  )}
                                </div>
                                <span className="text-[10px] text-warning shrink-0 font-medium whitespace-nowrap pt-0.5">
                                  Terminada hace {item.dias_esperando} {item.dias_esperando === 1 ? 'día' : 'días'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ─── Grupo: Alertas de Stock (Agotados) ─── */}
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

                    {/* ─── Grupo: Alertas de Stock (Stock bajo) ─── */}
                    {alerts.low_stock.length > 0 && (
                      <div className="p-2 space-y-1">
                        <div className="flex items-center justify-between px-2 py-1">
                          <span className="font-semibold text-[11px] text-warning uppercase tracking-wider">
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
