/**
 * Envoltorio visual común para las vistas de autenticación de plataforma (login y cambio obligatorio).
 */
export default function PlatformAuthShell({ rightAction, maxWidthClass = 'max-w-sm', children }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png?v=3"
              alt="MotoTrack"
              className="h-7 w-7 rounded-md object-contain bg-sidebar-accent/70 p-0.5 border border-sidebar-border"
            />
            <span className="text-sm font-bold tracking-tight">MotoTrack</span>
            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-sidebar-accent border border-sidebar-border text-sidebar-foreground/90">
              Plataforma · Soporte
            </span>
          </div>
          {rightAction}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <div className={`w-full ${maxWidthClass}`}>{children}</div>
      </div>
    </div>
  );
}
