import { useState, useMemo, useCallback } from 'react';

/**
 * Hook puro de carrito — SOLO lógica, sin JSX.
 *
 * Cada línea: { type: 'product'|'kit'|'service', id, name, unit_price, quantity }
 *
 * ⚠️  El total aquí es REFERENCIAL. El total real y definitivo lo devuelve
 *     el backend en la respuesta del POST /api/sales. Nunca usar este valor
 *     como monto final a cobrar.
 */
export function useCart() {
  const [items, setItems] = useState([]);

  /** Agrega una línea o incrementa su cantidad si ya existe en el carrito (líneas de OT aprobadas nunca se fusionan ni editan) */
  const addItem = useCallback(({
    type,
    id,
    name,
    unit_price,
    quantity = 1,
    work_order_item_id = null,
    readOnly = false,
  }) => {
    const qty = Math.max(1, Number(quantity) || 1);
    const woKey = work_order_item_id ?? null;
    const resolvedId =
      id ?? (type === 'service' ? `svc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}` : id);

    setItems(prev => {
      const existing = prev.find(
        i => i.id === resolvedId && i.type === type && (i.work_order_item_id ?? null) === woKey
      );
      if (existing) {
        if (woKey !== null || existing.readOnly) {
          return prev;
        }
        return prev.map(i =>
          i.id === resolvedId && i.type === type && (i.work_order_item_id ?? null) === woKey
            ? { ...i, quantity: i.quantity + qty }
            : i
        );
      }
      return [
        ...prev,
        {
          type,
          id: resolvedId,
          name,
          unit_price: Number(unit_price) || 0,
          quantity: qty,
          ...(woKey !== null ? { work_order_item_id: woKey } : {}),
          ...(readOnly ? { readOnly: true } : {}),
        },
      ];
    });
  }, []);

  /** Actualiza campos editables de una línea (ignora líneas solo lectura provenientes de OT) */
  const updateItem = useCallback((id, type, patch) => {
    setItems(prev =>
      prev.map(i => (i.id === id && i.type === type && !i.readOnly ? { ...i, ...patch } : i))
    );
  }, []);

  /** Elimina una línea completa del carrito */
  const removeItem = useCallback((id, type, workOrderItemId = null) => {
    setItems(prev =>
      prev.filter(
        i => !(i.id === id && i.type === type && (i.work_order_item_id ?? null) === workOrderItemId)
      )
    );
  }, []);

  /** Actualiza la cantidad de una línea; si quantity <= 0 la elimina (ignora líneas solo lectura) */
  const updateQuantity = useCallback((id, type, quantity) => {
    if (quantity <= 0) {
      setItems(prev => prev.filter(i => !(i.id === id && i.type === type && !i.readOnly)));
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === id && i.type === type && !i.readOnly
          ? { ...i, quantity: Number(quantity) }
          : i
      )
    );
  }, []);

  /** Vacía el carrito */
  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  /** Total referencial — solo para display, nunca para lógica de pago */
  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0),
    [items]
  );

  return { items, addItem, removeItem, updateQuantity, updateItem, clearCart, total };
}
