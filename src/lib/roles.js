// =============================================================================
// src/lib/roles.js
// Centralización de roles, etiquetas y rutas por defecto en MotoTrack AI
// =============================================================================

export const ROLE_LABELS = {
  admin: 'Administrador',
  cajero: 'Cajero',
  almacenero: 'Almacenero',
  mecanico: 'Mecánico',
};

export const ROUTE_ROLES = {
  dashboard:  ['admin'],
  inventory:  ['admin', 'cajero', 'almacenero', 'mecanico'],
  workorders: ['admin', 'cajero', 'almacenero', 'mecanico'],
  sales:      ['admin', 'cajero'],
  invoicing:  ['admin', 'cajero'],
  settings:   ['admin'],
};

export const INVENTORY_MANAGERS = ['admin', 'cajero', 'almacenero'];

/**
 * Devuelve la ruta por defecto de cada rol al autenticarse o ante accesos no autorizados.
 * - admin      → /dashboard
 * - cajero     → /sales
 * - almacenero → /inventory
 * - mecanico   → /workorders
 * - default    → /login
 */
export function defaultRouteFor(role) {
  if (role === 'admin') return '/dashboard';
  if (role === 'cajero') return '/sales';
  if (role === 'almacenero') return '/inventory';
  if (role === 'mecanico') return '/workorders';
  return '/login';
}
