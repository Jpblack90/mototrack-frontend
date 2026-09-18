import { useState, useMemo } from 'react';

/**
 * Hook puro de carrito — SOLO lógica, sin JSX.
 *
 * Cada línea: { type: 'product'|'kit', id, name, unit_price, quantity }
 *
 * ⚠️  El total aquí es REFERENCIAL. El total real y definitivo lo devuelve
 *     el backend en la respuesta del POST /api/sales. Nunca usar este valor
 *     como monto final a cobrar.
 */
export function useCart() {
  const [items, setItems] = useState([]);

  /** Agrega 1 unidad de un item; si ya existe suma cantidad */
  function addItem({ type, id, name, unit_price }) {
    setItems(prev => {
      const existing = prev.find(i => i.id === id && i.type === type);
      if (existing) {
        return prev.map(i =>
          i.id === id && i.type === type
            ? { ...i, quantity: i.quantity + 1 }
            : i
        );
      }
      return [...prev, { type, id, name, unit_price: Number(unit_price), quantity: 1 }];
    });
  }

  /** Elimina una línea completa del carrito */
  function removeItem(id, type) {
    setItems(prev => prev.filter(i => !(i.id === id && i.type === type)));
  }

  /** Actualiza la cantidad de una línea; si quantity <= 0 la elimina */
  function updateQuantity(id, type, quantity) {
    if (quantity <= 0) {
      removeItem(id, type);
      return;
    }
    setItems(prev =>
      prev.map(i =>
        i.id === id && i.type === type ? { ...i, quantity: Number(quantity) } : i
      )
    );
  }

  /** Vacía el carrito */
  function clearCart() {
    setItems([]);
  }

  /** Total referencial — solo para display, nunca para lógica de pago */
  const total = useMemo(
    () => items.reduce((acc, i) => acc + i.unit_price * i.quantity, 0),
    [items]
  );

  return { items, addItem, removeItem, updateQuantity, clearCart, total };
}
