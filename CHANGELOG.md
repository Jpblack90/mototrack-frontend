# Changelog
Formato basado en Keep a Changelog. Cada entrada indica el integrante responsable entre paréntesis.
Cubre solo el Frontend Web. Backend: ver CHANGELOG.md en mototrack-backend/.

## [Unreleased]
### Added (Fase 11 - Tarea 11.2b)
- Hook `src/hooks/useCompany.js` para consultar y actualizar la información de la empresa (Jean Pool)
- Página `/settings` (`src/pages/SettingsPage.jsx`) para configuración de datos fiscales, logo del taller y parámetros operativos (Jean Pool)
- Integración de ruta `/settings` con protección RBAC solo `admin` y enlace en `Sidebar.jsx` (Jean Pool)
- Despliegue de nombre comercial o razón social de la empresa activa en `Header.jsx` (Jean Pool)
- Cabecera del ticket térmico en `TicketView.jsx` con datos del emisor, logo y tasa de `IGV (X%)` calculada dinámicamente (Jean Pool)

### Fixed (Fase 11 - Tarea 11.2b)
- `src/hooks/useInvoicing.js`: corrección en `getTicketData` que antes llamaba a `/invoicing/:id` y ahora consulta `/invoicing/:id/ticket` con los datos completos estructurados del ticket (Jean Pool)

## [0.1.0] - Fase 9.1: Setup, Autenticación y Layout
### Added
- Proyecto inicializado con Vite + React, Tailwind CSS (Jean Pool)
- Cliente HTTP (axios) con interceptor de token JWT y manejo de expiración/401 (Jean Pool)
- AuthContext con persistencia de sesión en localStorage (Jean Pool)
- Login con redirección post-login según rol (admin/cajero/mecanico) (Jean Pool)
- Rutas protegidas por rol (ProtectedRoute) (Jean Pool)
- Layout responsivo: Sidebar colapsable, Header con cierre de sesión (Jean Pool)
- Dashboard funcional conectado a GET /api/dashboard con datos reales (Jean Pool)
- Páginas placeholder navegables: Inventario, Órdenes de Trabajo, Ventas, Facturación (Jean Pool)

<!-- Misma disciplina que el backend: cada cambio bajo [Unreleased] antes del commit, con Added/Changed/Fixed/Removed y responsable entre paréntesis. -->