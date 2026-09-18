/**
 * Botón con variantes de diseño consistentes con el sistema de Fase 9.2.
 *
 * Variantes: primary | secondary | danger
 * Estados:   disabled (opacity), focus ring, active scale
 *
 * Acepta todos los props nativos de <button> más:
 *   variant   'primary' | 'secondary' | 'danger'
 *   className  clases adicionales (se aplican al final)
 *   icon       elemento React a renderizar antes del children (Heroicon)
 */

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm ' +
  'font-medium transition-all ' +
  'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ' +
  'active:scale-[0.98] ' +
  'disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100';

const VARIANTS = {
  primary:
    'bg-indigo-600 hover:bg-indigo-700 text-white',
  secondary:
    'border border-slate-300 text-slate-700 hover:bg-slate-50',
  danger:
    'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500',
};

export default function Button({
  variant = 'primary',
  icon,
  children,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${BASE} ${VARIANTS[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="w-4 h-4 shrink-0">{icon}</span>}
      {children}
    </button>
  );
}
