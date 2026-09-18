# Changelog
Formato basado en Keep a Changelog. Cada entrada indica el integrante responsable entre paréntesis.
Cubre solo el Frontend Web. Backend: ver CHANGELOG.md en mototrack-backend/.

## [Unreleased]

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