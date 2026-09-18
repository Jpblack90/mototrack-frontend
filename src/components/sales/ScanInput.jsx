import { useRef, useState, useEffect, useCallback } from 'react';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

/**
 * Input de escaneo de código de barras / búsqueda manual.
 *
 * Se mantiene SIEMPRE enfocado (simula lector físico de barras).
 * - Re-enfoca tras Enter.
 * - Re-enfoca tras perder foco, salvo que el nuevo foco sea un input/button/select
 *   dentro de otro panel (no roba foco a modales ni formularios).
 *
 * onScan(code): callback cuando el usuario presiona Enter con texto acumulado.
 *
 * No hace ninguna llamada a la API — el padre decide qué hacer con el código.
 */
export default function ScanInput({ onScan, scanMessage }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  // Foco inicial al montar
  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim()) {
      onScan(value.trim());
      setValue('');
      // Re-enfoca en el siguiente tick para que el submit se complete
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleBlur(e) {
    const newFocus = e.relatedTarget;
    // No roba foco si el usuario está interactuando con otro input/button/select
    if (
      newFocus &&
      ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(newFocus.tagName)
    ) {
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  return (
    <div className="space-y-1">
      <div className="relative">
        <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Escanea o escribe un SKU y presiona Enter…"
          className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 bg-white"
        />
      </div>
      {/* Mensaje breve de resultado de escaneo (desaparece solo) */}
      {scanMessage && (
        <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
          {scanMessage}
        </p>
      )}
    </div>
  );
}
