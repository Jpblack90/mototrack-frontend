import { useState } from 'react';
import { useAlternatives } from '../../hooks/useAlternatives';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../ui/popover';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import { Sparkles, Plus, AlertCircle, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function AlternativesPopover({
  product,
  selectedBike,
  onlyCompatible = false,
  onSelectAlternative,
}) {
  const [open, setOpen] = useState(false);
  const { alternatives, loading, fetchAlternatives } = useAlternatives();

  function handleOpenChange(nextOpen) {
    setOpen(nextOpen);
    if (nextOpen) {
      fetchAlternatives(product.id, selectedBike || '');
    }
  }

  const hasBike = Boolean(selectedBike && selectedBike.trim());
  const bikeLabel = hasBike ? selectedBike.trim() : '';

  const compatibleAlts = hasBike
    ? alternatives.filter((a) => a.is_compatible === true || a.matches_client === true)
    : alternatives;

  const otherAlts = hasBike
    ? alternatives.filter((a) => !(a.is_compatible === true || a.matches_client === true))
    : [];

  // Cuando está activo "Solo compatibles", se muestran exclusivamente las compatibles
  const showOnlyCompat = hasBike && onlyCompatible;

  function renderAltItem(alt, isCompatible) {
    return (
      <button
        key={alt.id}
        type="button"
        data-testid={`select-alternative-${alt.id}`}
        onClick={() => {
          onSelectAlternative(alt);
          setOpen(false);
        }}
        className="w-full text-left p-2 rounded-lg hover:bg-accent/60 transition-colors flex items-center justify-between group cursor-pointer border border-transparent hover:border-border"
      >
        <div className="min-w-0 pr-2">
          <p className="font-medium text-foreground truncate group-hover:text-primary transition-colors">
            {alt.name}
          </p>
          <div className="flex items-center gap-2 mt-0.5">
            {alt.brand && (
              <span className="text-[10px] text-muted-foreground">
                {alt.brand}
              </span>
            )}
            {isCompatible && (
              <Badge
                variant="outline"
                className="text-[9px] px-1 py-0 border-success/40 text-success bg-success/10"
              >
                Compatible
              </Badge>
            )}
          </div>
        </div>

        <div className="text-right shrink-0 flex items-center gap-2">
          <div>
            <p className="text-xs font-semibold text-foreground tabular-nums">
              S/ {Number(alt.sale_price).toFixed(2)}
            </p>
            <span className="text-[10px] text-muted-foreground">
              Stock: {alt.stock}
            </span>
          </div>
          <div className="w-6 h-6 rounded bg-primary/10 text-primary flex items-center justify-center opacity-70 group-hover:opacity-100 transition-opacity">
            <Plus className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>
    );
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          data-testid={`btn-alternatives-${product.id}`}
          className="text-xs h-7 px-2.5 gap-1.5 text-primary border-primary/30 hover:bg-primary/10 transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Ver alternativas</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-88 p-0 shadow-lg">
        <div className="p-3 border-b border-border bg-muted/30">
          <p className="font-semibold text-xs text-foreground flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Alternativas disponibles
          </p>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            Para: {product.name}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-2 text-xs">
          {loading && (
            <div className="space-y-2 p-2">
              <Skeleton className="h-10 w-full rounded" />
              <Skeleton className="h-10 w-full rounded" />
            </div>
          )}

          {!loading && (
            <>
              {/* Caso: "Solo compatibles" activo pero sin compatibles */}
              {showOnlyCompat && compatibleAlts.length === 0 && (
                <div className="p-4 text-center text-muted-foreground flex flex-col items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 opacity-40" />
                  <span>No hay alternativas compatibles con stock</span>
                </div>
              )}

              {/* Caso: Catálogo general sin stock en ninguna alternativa */}
              {!showOnlyCompat && alternatives.length === 0 && (
                <div className="p-4 text-center text-muted-foreground flex flex-col items-center gap-1.5">
                  <AlertCircle className="w-5 h-5 opacity-40" />
                  <span>No hay alternativas con stock disponible</span>
                </div>
              )}

              {/* Con moto seleccionada: Grupo "Compatibles con [Moto]" */}
              {hasBike && compatibleAlts.length > 0 && (
                <div>
                  <div className="px-2 py-1 mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-success bg-success/10 rounded">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Compatibles con {bikeLabel}</span>
                  </div>
                  <div className="space-y-1">
                    {compatibleAlts.map((alt) => renderAltItem(alt, true))}
                  </div>
                </div>
              )}

              {/* Con moto seleccionada y "Solo compatibles" desactivado: Grupo "Otras" */}
              {hasBike && !onlyCompatible && otherAlts.length > 0 && (
                <div className="pt-1 border-t border-border/60">
                  <div className="px-2 py-1 mb-1 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground">
                    <span>Otras (no confirmadas para {bikeLabel})</span>
                  </div>
                  <div className="px-2 py-1.5 rounded-md bg-warning/10 border border-warning/20 text-warning text-[11px] flex items-start gap-1.5 mb-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>Verifica dimensiones y encaje antes de vender</span>
                  </div>
                  <div className="space-y-1">
                    {otherAlts.map((alt) => renderAltItem(alt, false))}
                  </div>
                </div>
              )}

              {/* Sin moto seleccionada: Listado plano */}
              {!hasBike && alternatives.length > 0 && (
                <div className="space-y-1">
                  {alternatives.map((alt) => renderAltItem(alt, false))}
                </div>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
