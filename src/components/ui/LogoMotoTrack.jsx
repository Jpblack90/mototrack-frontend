import * as React from 'react';

/**
 * Logotipo oficial de MotoTrack.
 * Monograma abstracto y minimalista que combina las iniciales "MT" (MotoTrack)
 * con una silueta geométrica de precisión mecánica y aerodinámica.
 *
 * Características:
 * - Puro SVG sin librerías externas.
 * - Hereda el color vía `fill="currentColor"` (compatible con temas claro/oscuro de Tailwind).
 * - Tamaño dinámico controlado por el `className` del padre mediante `viewBox="0 0 24 24"`.
 * - Accesibilidad integrada (`role="img"`, `aria-label="MotoTrack"`).
 */
export function LogoMotoTrack({ className = 'w-6 h-6', ...props }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      role="img"
      aria-label="MotoTrack"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M 4 4 H 20 L 21.5 5.5 L 22.5 19.5 H 19.5 L 18 11 L 13.25 15.5 V 20 H 10.75 V 15.5 L 6 11 L 4.5 19.5 H 1.5 L 2.5 5.5 Z M 7.2 6.5 L 10.75 11.2 V 6.5 Z M 16.8 6.5 L 13.25 11.2 V 6.5 Z"
      />
    </svg>
  );
}

export default LogoMotoTrack;
