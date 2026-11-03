import * as React from 'react';
import { cn } from 'cn';
import { Badge } from './badge';
import { X } from 'lucide-react';

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Escribe un modelo (ej. Honda CG125) y pulsa Enter...',
  maxTags = 20,
  disabled = false,
  className,
  ...props
}) {
  const [inputValue, setInputValue] = React.useState('');
  const inputRef = React.useRef(null);

  function addTag(raw) {
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (value.includes(trimmed)) {
      setInputValue('');
      return;
    }
    if (value.length >= maxTags) {
      setInputValue('');
      return;
    }
    onChange?.([...value, trimmed]);
    setInputValue('');
  }

  function removeTag(indexToRemove) {
    if (disabled) return;
    const next = value.filter((_, i) => i !== indexToRemove);
    onChange?.(next);
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      e.preventDefault();
      removeTag(value.length - 1);
    }
  }

  function handleContainerClick() {
    inputRef.current?.focus();
  }

  return (
    <div
      onClick={handleContainerClick}
      className={cn(
        'flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-2xl border border-transparent bg-input/50 p-1.5 px-2.5 text-sm transition-[color,box-shadow] duration-200 outline-none focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30',
        disabled && 'opacity-50 cursor-not-allowed pointer-events-none',
        className
      )}
      {...props}
    >
      {value.map((tag, idx) => (
        <Badge
          key={`${tag}-${idx}`}
          variant="secondary"
          className="h-6 gap-1 pr-1 text-xs font-normal"
        >
          <span>{tag}</span>
          {!disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(idx);
              }}
              className="cursor-pointer rounded-full p-0.5 hover:bg-muted text-muted-foreground hover:text-foreground"
              aria-label={`Quitar ${tag}`}
            >
              <X className="size-3" />
            </button>
          )}
        </Badge>
      ))}

      {value.length < maxTags && (
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            if (inputValue.trim()) addTag(inputValue);
          }}
          placeholder={value.length === 0 ? placeholder : ''}
          disabled={disabled}
          className="flex-1 min-w-[140px] bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none border-none py-0.5 px-1"
        />
      )}
    </div>
  );
}
