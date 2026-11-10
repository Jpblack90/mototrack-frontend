import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header  from './Header';
import { useAuth } from '../../context/AuthContext';
import { usePlan } from '../../hooks/usePlan';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/button';
import { formatDate } from '../../lib/dates';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { planData } = usePlan();
  const billing = planData?.billing;

  // Clave de sesión por fecha diaria para reaparecer al día siguiente
  const todayKey = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Lima',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());

  const sessionDismissKey = `mototrack_dismissed_billing_banner_${todayKey}`;
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(sessionDismissKey) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(sessionDismissKey, 'true');
    } catch {}
  };

  const isGrace = billing?.status === 'grace';
  const isDueSoon = billing?.status === 'active' && billing?.days_left !== null && billing?.days_left <= 5;
  const showBanner = !dismissed && isAdmin && (isGrace || isDueSoon);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Contenido principal */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        {/* Banner global de suscripción (solo admin) */}
        {showBanner && (
          <div
            data-testid="billing-global-banner"
            className={`px-4 py-2.5 flex items-center justify-between text-xs transition-colors shrink-0 ${
              isGrace
                ? 'bg-destructive/15 text-destructive border-b border-destructive/30'
                : 'bg-warning/15 text-warning border-b border-warning/30'
            }`}
          >
            <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <p className="truncate sm:whitespace-normal leading-tight font-medium">
                {isGrace ? (
                  <>
                    <strong className="font-semibold">Atención:</strong> Tu suscripción venció el{' '}
                    {formatDate(billing.paid_until)}. Tienes {billing.grace_days_left ?? 0}{' '}
                    {billing.grace_days_left === 1 ? 'día' : 'días'} antes de la suspensión.
                    {billing.payment_instructions && ` ${billing.payment_instructions}`}
                  </>
                ) : (
                  <>
                    <strong className="font-semibold">Aviso de vencimiento:</strong> Tu suscripción vence en{' '}
                    {billing.days_left} {billing.days_left === 1 ? 'día' : 'días'}.
                    {billing.payment_instructions && ` ${billing.payment_instructions}`}
                  </>
                )}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Cerrar aviso de facturación"
              onClick={handleDismiss}
              className={`h-6 w-6 shrink-0 rounded-md transition-colors ${
                isGrace ? 'hover:bg-destructive/20 text-destructive' : 'hover:bg-warning/20 text-warning'
              }`}
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}

        {/* relative: contiene elementos absolutos ocultos (p. ej. el <select> nativo de Radix)
            para que no alarguen el documento y aparezca un hueco blanco al hacer scroll */}
        <main className="relative flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
