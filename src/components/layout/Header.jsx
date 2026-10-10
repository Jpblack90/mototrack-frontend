import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Menu, LogOut, ChevronDown } from 'lucide-react';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  const roleName =
    user?.role === 'admin'
      ? 'Administrador'
      : user?.role === 'cajero'
        ? 'Cajero'
        : user?.role === 'mecanico'
          ? 'Mecánico'
          : user?.role ?? 'Usuario';

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

      {/* Spacer */}
      <div className="flex-1" />

      {/* Menú de usuario con Avatar y DropdownMenu */}
      <div className="flex items-center gap-2">
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
                <div className="pt-1">
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5 uppercase font-medium">
                    {roleName}
                  </Badge>
                </div>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

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
    </header>
  );
}
