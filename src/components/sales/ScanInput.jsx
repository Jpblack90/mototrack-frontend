import { useRef, useState, useEffect } from 'react';
import { Input } from '../ui/input';
import { Barcode } from 'lucide-react';

/**
 * Input de escaneo de código de barras / búsqueda directa.
 * Mantiene intacto el patrón de captura de keystrokes rápidos + Enter
 * y la persistencia de foco para lector físico.
 */
export default function ScanInput({ onScan, scanMessage }) {
  const [value, setValue] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  function handleKeyDown(e) {
    if (e.key === 'Enter' && value.trim()) {
      onScan(value.trim());
      setValue('');
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  function handleBlur(e) {
    const newFocus = e.relatedTarget;
    if (
      newFocus &&
      ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA'].includes(newFocus.tagName)
    ) {
      return;
    }
    setTimeout(() => inputRef.current?.focus(), 120);
  }

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Barcode className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          placeholder="Escanea con lector de código de barras o ingresa SKU y presiona Enter…"
          className="pl-9 pr-4 h-10 text-sm bg-background border-border"
        />
      </div>
      {scanMessage && (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800 rounded-md px-3 py-1.5">
          {scanMessage}
        </p>
      )}
    </div>
  );
}
