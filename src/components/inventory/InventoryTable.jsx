import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Button } from '../ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '../ui/tooltip';
import { EmptyState } from '../ui/empty-state';
import { MoreHorizontal, Pencil, Trash2, Sparkles, PackageSearch, History } from 'lucide-react';

function TableSkeleton() {
  return (
    <div className="p-4 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-2 border-b border-border/50">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-40 flex-1" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  );
}

export default function InventoryTable({
  products,
  loading,
  onEdit,
  onDeactivate,
  onViewHistory,
  canEdit = true,
  canDeactivate = true,
  canViewHistory = false,
}) {
  if (loading) return <TableSkeleton />;

  if (products.length === 0) {
    return (
      <EmptyState
        icon={PackageSearch}
        title="No se encontraron repuestos"
        description="No hay productos registrados o coincidentes con los términos de búsqueda."
      />
    );
  }

  return (
    <div className="relative w-full overflow-x-auto touch-pan-x">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead>Marca</TableHead>
            <TableHead>Compatibilidad</TableHead>
            <TableHead className="text-center">Stock</TableHead>
            <TableHead className="text-right">Precio Costo</TableHead>
            <TableHead className="text-right">Precio Venta</TableHead>
            <TableHead className="text-center">Margen</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="w-12 text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((p) => {
            const margin = Number(p.margin ?? 0);
            const stockNum = Number(p.stock);
            const minStockNum = Number(p.min_stock);
            const isOutOfStock = stockNum === 0;
            const isLowStock = !isOutOfStock && stockNum <= minStockNum;
            const isPositiveMargin = margin >= 0;

            return (
              <TableRow key={p.id} className="transition-colors duration-150">
                {/* SKU */}
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {p.sku || '—'}
                </TableCell>

                {/* Nombre */}
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground text-sm">{p.name}</span>
                    {p.registration_method === 'ia' && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 gap-1 border-primary/30 text-primary">
                        <Sparkles className="w-2.5 h-2.5" /> IA
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Categoría */}
                <TableCell>
                  {p.category ? (
                    <Badge variant="outline" className="text-xs font-normal">
                      {p.category}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* Marca */}
                <TableCell className="text-sm text-muted-foreground">
                  {p.brand || '—'}
                </TableCell>

                {/* Compatibilidad */}
                <TableCell>
                  {Array.isArray(p.compatible_models) && p.compatible_models.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1 max-w-[200px]">
                      {p.compatible_models.slice(0, 2).map((m, idx) => (
                        <Badge
                          key={idx}
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0 font-normal shrink-0"
                        >
                          {m}
                        </Badge>
                      ))}
                      {p.compatible_models.length > 2 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge
                              variant="outline"
                              className="text-[10px] px-1.5 py-0 font-medium cursor-pointer shrink-0 hover:bg-muted"
                            >
                              +{p.compatible_models.length - 2}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-xs text-xs">
                            <p className="font-semibold mb-1">Motos compatibles:</p>
                            <p>{p.compatible_models.join(', ')}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </TableCell>

                {/* Stock con badge */}
                <TableCell className="text-center">
                  <div className="inline-flex items-center gap-1.5">
                    <span className="tabular-nums font-semibold text-sm text-foreground">
                      {p.stock}
                    </span>
                    {isOutOfStock ? (
                      <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                        Agotado
                      </Badge>
                    ) : isLowStock ? (
                      <Badge variant="warning" className="text-[10px] px-1.5 py-0">
                        Bajo
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        Normal
                      </Badge>
                    )}
                  </div>
                </TableCell>

                {/* Precio Costo */}
                <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                  S/ {Number(p.cost_price ?? 0).toFixed(2)}
                </TableCell>

                {/* Precio Venta */}
                <TableCell className="text-right tabular-nums text-sm font-semibold text-foreground">
                  S/ {Number(p.sale_price ?? 0).toFixed(2)}
                </TableCell>

                {/* Margen con badge verde/rojo */}
                <TableCell className="text-center">
                  <Badge
                    variant={isPositiveMargin ? 'outline' : 'destructive'}
                    className={
                      isPositiveMargin
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200'
                        : ''
                    }
                  >
                    S/ {margin.toFixed(2)}
                  </Badge>
                </TableCell>

                {/* Estado (activo/inactivo) */}
                <TableCell className="text-center">
                  <Badge
                    variant={p.is_active !== false ? 'outline' : 'secondary'}
                    className={
                      p.is_active !== false
                        ? 'border-emerald-300 text-emerald-700 bg-emerald-50/50 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'text-muted-foreground'
                    }
                  >
                    {p.is_active !== false ? 'Activo' : 'Inactivo'}
                  </Badge>
                </TableCell>

                {/* Acciones */}
                <TableCell className="text-right">
                  {canEdit || canDeactivate || canViewHistory ? (
                    <DropdownMenu>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 p-0"
                              aria-label={`Acciones para ${p.name}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                              <span className="sr-only">Abrir menú de acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                        </TooltipTrigger>
                        <TooltipContent>Acciones</TooltipContent>
                      </Tooltip>
                      <DropdownMenuContent align="end" className="w-36">
                        {canViewHistory && (
                          <DropdownMenuItem
                            onClick={() => onViewHistory && onViewHistory(p)}
                            className="cursor-pointer gap-2"
                          >
                            <History className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Ver historial</span>
                          </DropdownMenuItem>
                        )}
                        {canEdit && (
                          <DropdownMenuItem onClick={() => onEdit(p)} className="cursor-pointer gap-2">
                            <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>Editar</span>
                          </DropdownMenuItem>
                        )}
                        {canDeactivate && (
                          <DropdownMenuItem
                            onClick={() => onDeactivate(p)}
                            className="cursor-pointer gap-2 text-destructive focus:text-destructive"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                            <span>Desactivar</span>
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span className="text-muted-foreground/50 text-xs">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
