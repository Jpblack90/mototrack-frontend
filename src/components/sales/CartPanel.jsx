import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../ui/card';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
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
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';

/**
 * Panel de carrito de compras del POS.
 * Muestra las líneas con ScrollArea y Table, distinguiendo Kits con Badge.
 * El total se muestra tal cual lo entrega useCart (sin recalcular client-side).
 */
export default function CartPanel({ items, total, onUpdate, onRemove, onCheckout }) {
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

      {/* Lista de ítems con ScrollArea y Table */}
      <CardContent className="flex-1 p-0 min-h-[280px]">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-sm">
            <ShoppingCart className="w-8 h-8 mb-2 opacity-30" />
            <span>El carrito está vacío</span>
            <span className="text-xs text-muted-foreground/60 mt-0.5">
              Escanea un producto o selecciona un kit
            </span>
          </div>
        ) : (
          <ScrollArea className="h-[360px] w-full">
            <Table>
              <TableBody>
                {items.map((item) => {
                  const subtotal = (item.unit_price * item.quantity).toFixed(2);
                  const isKit = item.type === 'kit';

                  return (
                    <TableRow key={`${item.type}-${item.id}`} className="transition-colors duration-150">
                      {/* Información del ítem */}
                      <TableCell className="py-2.5 px-3">
                        <div className="flex flex-col gap-0.5 max-w-[170px] sm:max-w-[200px]">
                          <span className="font-medium text-sm text-foreground truncate">
                            {item.name}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isKit && (
                              <Badge variant="outline" className="text-[10px] px-1 py-0 border-primary/40 text-primary">
                                Kit
                              </Badge>
                            )}
                            <span className="text-xs text-muted-foreground tabular-nums">
                              S/ {Number(item.unit_price).toFixed(2)} c/u
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      {/* Stepper de cantidad */}
                      <TableCell className="py-2.5 px-1 text-center">
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
                      </TableCell>

                      {/* Subtotal */}
                      <TableCell className="py-2.5 px-2 text-right tabular-nums font-semibold text-sm text-foreground">
                        S/ {subtotal}
                      </TableCell>

                      {/* Botón quitar */}
                      <TableCell className="py-2.5 px-2 text-right">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7 text-muted-foreground hover:text-destructive"
                              onClick={() => onRemove(item.id, item.type)}
                              aria-label={`Quitar ${item.name} del carrito`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span className="sr-only">Quitar {item.name} del carrito</span>
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Quitar del carrito</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Footer con total y botón de cobro */}
      <CardFooter className="flex flex-col gap-3 p-4 border-t border-border bg-muted/10">
        <div className="flex justify-between items-center w-full">
          <span className="text-sm font-medium text-muted-foreground">Total referencial</span>
          <span className="text-2xl font-bold text-foreground tabular-nums">
            S/ {total.toFixed(2)}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground/70 w-full">
          El monto exacto a cobrar es confirmado por el servidor al registrar la venta.
        </p>
        <Button
          className="w-full h-10 font-semibold gap-2"
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
