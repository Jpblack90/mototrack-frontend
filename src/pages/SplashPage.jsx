import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Progress } from '../components/ui/progress';
import RootRedirect from '../components/RootRedirect';

const SPLASH_DURATION = 2500;
const SPLASH_DURATION_REDUCED = 800;
const EXIT_DURATION = 300;
const PROGRESS_INTERVAL = 40;

const REDUCED_MOTION =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Pantalla de bienvenida (splash) de MotoTrack AI.
 * Se muestra solo en la ruta "/". Al completarse, delega la redirección
 * por rol a <RootRedirect /> sin duplicar lógica.
 */
export default function SplashPage() {
  const { loading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);

  const duration = REDUCED_MOTION
    ? SPLASH_DURATION_REDUCED
    : SPLASH_DURATION;

  // ── Barra de progreso: avanza de 0 a 100 durante `duration` ms ──
  useEffect(() => {
    const steps = Math.ceil(duration / PROGRESS_INTERVAL);
    const increment = 100 / steps;
    let step = 0;

    const id = setInterval(() => {
      step += 1;
      if (step >= steps) {
        setProgress(100);
        clearInterval(id);
      } else {
        setProgress((prev) => {
          const next = prev + increment;
          return next >= 100 ? 100 : next;
        });
      }
    }, PROGRESS_INTERVAL);

    return () => clearInterval(id);
  }, [duration]);

  // ── Condición de salida derivada en render ──
  const ready = progress >= 100 && !loading;

  // ── Transición de salida: espera EXIT_DURATION y marca done ──
  useEffect(() => {
    if (!ready) return;

    const id = setTimeout(() => setDone(true), REDUCED_MOTION ? 0 : EXIT_DURATION);
    return () => clearTimeout(id);
  }, [ready]);

  // ── Fase final: delegar redirección a RootRedirect ──
  if (done) {
    return <RootRedirect />;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Cargando MotoTrack AI"
      className={`
        relative flex min-h-screen flex-col items-center justify-center
        bg-sidebar text-sidebar-foreground
        ${ready && !REDUCED_MOTION ? 'animate-splash-fade-out' : ''}
      `}
    >
      {/* Logo */}
      <img
        src="/logo.png"
        alt="MotoTrack"
        className={`
          mb-6 w-56 md:w-72
          ${!REDUCED_MOTION ? 'animate-splash-in' : ''}
        `}
      />

      {/* Lema */}
      <p
        className={`
          mb-8 text-sm text-sidebar-foreground/70
          ${!REDUCED_MOTION ? 'animate-splash-tagline' : ''}
        `}
      >
        Controla tu taller, impulsa tu negocio
      </p>

      {/* Barra de progreso */}
      <Progress value={progress} className="mb-2 w-48 bg-sidebar-accent" />
      <p className="text-xs text-sidebar-foreground/70">Cargando sistema…</p>

      {/* Footer */}
      <p className="absolute bottom-6 text-xs text-sidebar-foreground/40">
        MotoTrack AI &middot; v1.0
      </p>
    </div>
  );
}
