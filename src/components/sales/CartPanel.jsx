import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableRow,
} from '../ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { ShoppingCart, Plus, Minus, Trash2, Wrench } from 'lucide-react';

function ServicePriceInput({ value, onCommit, itemName }) {
  const [draft, setDraft] = useState(null);
  const isEditing = draft !== null;

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-muted-foreground">S/</span>
      <Input
        type="number"
        min="0.01"
        step="0.01"
        placeholder="0.00"
        value={isEditing ? draft : Number(value || 0).toFixed(2)}
        onFocus={(e) => {
          setDraft(Number(value) > 0 ? String(value) : '');
          e.target.select();
        }}
        onChange={(e) => {
          const raw = e.target.value;
          setDraft(raw);
          const parsed = Number(raw);
          if (raw === '') {
            onCommit(0);
          } else if (Number.isFinite(parsed) && parsed >= 0) {
            onCommit(parsed);
          }
        }}
        onBlur={() => {
          const parsed = Number(draft);
          if (Number.isFinite(parsed) && parsed > 0) {
            onCommit(parsed);
          } else {
            onCommit(0);
          }
          setDraft(null);
        }}
        className="h-7 w-24 text-xs font-mono tabular-nums px-2"
        aria-label={`Precio sin IGV de ${itemName || 'servicio'}`}
      />
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">sin IGV</span>
    </div>
  );
}

/**
 * Panel de carrito de compras del POS.
 * Muestra las líneas con ScrollArea y Table, distinguiendo Kits y Servicios con Badge.
 * Desglose de Subtotal, IGV y Total calculado con la tasa de la empresa (A-01).
 */
export default function CartPanel({
  items,
  subtotal = 0,
  igv = 0,
  igvRate = 0.18,
  total = 0,
  onUpdate,
  onUpdateItem,
  onAddService,
  onRemove,
  onCheckout,
}) {
  const isEmpty = items.length === 0;

  return (
    <Card className="flex flex-col h-full shadow-sm border-border">
      {/* Header */}
      <CardHeader className="py-3 px-4 border-b border-border flex flex-row items-center justify-between space-y-0">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-4 h-4 text-primary" />
          <CardTitle className="text-sm font-semibold text-foreground">
            Carrito de Venta
          </CardTitle>
        </div>
        {!isEmpty && (
          <Badge variant="secondary" className="tabular-nums">
            {items.length} {items.length === 1 ? 'línea' : 'líneas'}
          </Badge>
        )}
      </CardHeader>

      {onAddService && (
        <div className="px-4 py-2 border-b border-border bg-muted/15 flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">
            Servicios y mano de obra (sin IGV)
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAddService}
            className="h-7 text-xs gap-1.5 shrink-0"
          >
            <Wrench className="w-3.5 h-3.5 text-info" />
            <span>Agregar mano de obra</span>
          </Button>
        </div>
      )}

      {/* Lista de ítems con ScrollArea y Table */}
      <CardContent className="flex-1 p-0 min-h-[280px]">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
            <span>El carrito está vacío</span>
            <span className="text-xs text-muted-foreground/60 mt-0.5 text-center px-4">
              Escanea un producto, selecciona un kit o agrega mano de obra
            </span>
          </div>
        ) : (
          <ScrollArea className="h-[360px] w-full">
            <Table>
              <TableBody>
                {items.map((item) => {
                  const lineSubtotal = (Number(item.unit_price || 0) * item.quantity).toFixed(2);
                  const isKit = item.type === 'kit';
                  const isService = item.type === 'service';
                  const isReadOnly = Boolean(item.readOnly || item.work_order_item_id != null);
                  const rowKey = item.work_order_item_id
                    ? `woi-${item.work_order_item_id}`
                    : `${item.type}-${item.id}`;

                  return (
                    <TableRow key={rowKey} className="transition-colors duration-150">
                      {/* Información del ítem */}
                      <TableCell className="py-2.5 px-3">
                        {isService && !isReadOnly ? (
                          <div className="flex flex-col gap-1.5 min-w-[165px] max-w-[230px]">
                            <div className="flex items-center gap-1.5">
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-info/40 text-info bg-info/10">
                                Servicio
                              </Badge>
                              <Input
                                type="text"
                                value={item.name}
                                maxLength={200}
                                placeholder="Descripción de mano de obra…"
                                onChange={(e) =>
                                  onUpdateItem?.(item.id, item.type, { name: e.target.value })
                                }
                                className="h-7 text-xs font-medium px-2"
                                aria-label="Descripción del servicio"
                              />
                            </div>
                            <ServicePriceInput
                              value={item.unit_price}
                              itemName={item.name}
                              onCommit={(unit_price) =>
                                onUpdateItem?.(item.id, item.type, { unit_price })
                              }
                            />
                          </div>
                        ) : (
                          <div className="flex flex-col gap-0.5 max-w-[170px] sm:max-w-[210px]">
                            <span className="font-medium text-sm text-foreground truncate">
                              {item.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {isReadOnly && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-success/40 text-success bg-success/10">
                                  OT aprobada
                                </Badge>
                              )}
                              {isService && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-info/40 text-info bg-info/10">
                                  Servicio
                                </Badge>
                              )}
                              {isKit && (
                                <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/40 text-primary">
                                  Kit
                                </Badge>
                              )}
                              <span className="text-xs text-muted-foreground tabular-nums">
                                S/ {Number(item.unit_price).toFixed(2)} {isService ? 'sin IGV' : 'c/u'}
                              </span>
                            </div>
                          </div>
                        )}
                      </TableCell>

                      {/* Stepper de cantidad o solo lectura para OT */}
                      <TableCell className="py-2.5 px-1 text-center">
                        {isReadOnly ? (
                          <span className="inline-flex items-center justify-center rounded-md border border-border px-2 py-0.5 bg-muted/30 text-xs font-semibold tabular-nums text-foreground">
                            x{item.quantity}
                          </span>
                        ) : (
                          <div className="inline-flex items-center rounded-lg border border-border p-0.5 bg-muted/20">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => onUpdate(item.id, item.type, item.quantity - 1)}
                              disabled={item.quantity <= 1}
                              aria-label={`Disminuir cantidad de ${item.name}`}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-7 text-center text-xs font-semibold tabular-nums text-foreground">
                              {item.quantity}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 rounded p-0 text-muted-foreground hover:text-foreground"
                              onClick={() => onUpdate(item.id, item.type, item.quantity + 1)}
                              aria-label={`Aumentar cantidad de ${item.name}`}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="py-2.5 px-2 text-right tabular-nums font-semibold text-sm text-foreground">
                        S/ {lineSubtotal}
                      </TableCell>

                      {/* Botón quitar (oculto en líneas aprobadas de OT) */}
                      <TableCell className="py-2.5 px-2 text-right">
                        {!isReadOnly && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                onClick={() => onRemove(item.id, item.type, item.work_order_item_id ?? null)}
                                aria-label={`Quitar ${item.name} del carrito`}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                                <span className="sr-only">Quitar {item.name} del carrito</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Quitar del carrito</TooltipContent>
                          </Tooltip>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Footer con desglose Subtotal / IGV / Total y botón de cobro (A-01) */}
      <CardFooter className="flex flex-col gap-2.5 p-4 border-t border-border bg-muted/10">
        <div className="w-full space-y-1 text-xs">
          <div className="flex justify-between items-center text-muted-foreground">
            <span>Subtotal</span>
            <span className="font-mono tabular-nums">S/ {Number(subtotal).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-muted-foreground">
            <span>IGV ({Math.round(igvRate * 100)} %)</span>
            <span className="font-mono tabular-nums">S/ {Number(igv).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center pt-1.5 border-t border-border text-foreground">
            <span className="text-sm font-semibold">Total</span>
            <span className="text-2xl font-bold font-mono tabular-nums text-foreground">
              S/ {Number(total).toFixed(2)}
            </span>
          </div>
        </div>
        <Button
          className="w-full h-10 font-semibold gap-2 mt-1"
          disabled={isEmpty}
          onClick={onCheckout}
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Cobrar Venta</span>
        </Button>
      </CardFooter>
    </Card>
  );
}
