# Changelog
Formato basado en Keep a Changelog. Cada entrada indica el integrante responsable entre paréntesis.
Cubre solo el Frontend Web. Backend: ver CHANGELOG.md en mototrack-backend/.

## [Unreleased]
### Added (Fase 12 - Tarea 12.1)
- Hook `src/hooks/usePlan.js`: consulta reactiva del plan comercial y consumo acumulado de recursos (`/company/plan`) con métodos de recarga `refresh()` (Jean Pool)
- Card "Mi Plan" en `SettingsPage.jsx` (restringida a administradores): despliega el nombre del plan comercial, precio mensual (S/ 99.00 / mes), estado comercial (Badge "Activo" o "Prueba: X días restantes"), barras de progreso `Progress` de shadcn/ui con colorimetría condicional (primario, ámbar >=80%, rojo destructivo al 100%) para escaneos IA mensuales y usuarios activos, soporte WhatsApp incluido y enlace directo a soporte vía variable `VITE_SUPPORT_EMAIL` (Jean Pool)
- Gestión de límites de escaneo IA en `ProductDialog.jsx`: indicador dinámico de cupo restante en la pestaña de escaneo ("Te quedan {N} escaneos este mes" o "Escaneos ilimitados"), estado de advertencia y botón deshabilitado ("Cupo mensual agotado") cuando se consumen todos los escaneos del mes, y captura resiliente de respuesta HTTP 403 `PLAN_LIMIT_REACHED` con conmutación automática hacia entrada manual (Jean Pool)
- Control de límite de usuarios en `UsersPage.jsx`: botón "Nuevo Usuario" deshabilitado automáticamente cuando la empresa alcanza el límite de usuarios activos del plan (`users_active >= max_users`), con `Tooltip` informativo explicativo y recarga sincronizada del cupo tras altas, desactivaciones o reactivaciones (Jean Pool)
- Configuración de `VITE_SUPPORT_EMAIL` en `.env.example` y `.env` (Jean Pool)
- Evidencias gráficas obligatorias en `docs/capturas/` (`mi-plan.png` y `escaneo-cupo.png`) (Jean Pool)

### Changed (Fase 12 - Tarea 12.0)
- `ProductDialog.jsx`: conmutación automática y transparente hacia la pestaña de "Entrada Manual" ante códigos de error de IA `AI_NOT_CONFIGURED` y `AI_QUOTA` (además de `AI_TIMEOUT` y `AI_SERVICE_ERROR`) mostrando notificación informativa y preservando la continuidad operativa del taller (Jean Pool)
### Added (Fase 11 - Tarea 11.5)
- Página pública de registro de talleres `/register` (`src/pages/RegisterPage.jsx`) con diseño idéntico al login (tarjeta dividida en 2 columnas, lado oscuro con logo y moto sin scroll a 1440x900) y flujo stepper de 2 pasos ("Datos de tu taller" y "Tu cuenta administradora") (Jean Pool)
- Validación de política de contraseñas en vivo con indicadores de fortaleza y selector de visualización en `RegisterPage.jsx` (Jean Pool)
- Checkbox de aceptación de términos y privacidad en cumplimiento con la Ley N° 29733 (Protección de Datos Personales de Perú) (Jean Pool)
- Redirección post-registro directa al Dashboard integrando autenticación inmediata mediante `login()` de `AuthContext` (Jean Pool)
- Enlace "¿Tienes un taller? Crea tu cuenta gratis" en `LoginPage.jsx` dirigiendo a `/register` y manejo de avisos toast específicos para prueba vencida (403 `TRIAL_EXPIRED`) y exceso de intentos (429) (Jean Pool)
- Badge condicional de periodo de prueba en `Header.jsx` (`Prueba: X días`) con alerta ámbar y pulso cuando restan 3 días o menos (Jean Pool)
- Tarjeta de incorporación "Primeros pasos en tu taller" en `DashboardPage.jsx` para administradores, con barra de progreso y 4 tareas operativas calculadas en base a datos reales (RUC/logo, equipo > 1, 1er repuesto, 1ra venta) con enlaces directos a sus módulos (Jean Pool)
- Registro de ruta pública `/register` en `App.jsx` (Jean Pool)
- Documentación gráfica de registro y onboarding en `docs/capturas/` (`registro-taller.png`, `badge-prueba.png`, `primeros-pasos.png`) (Jean Pool)
### Added (Fase 11 - Tarea 11.4)
- Hook `src/hooks/useAudit.js` para consulta paginada de auditoría y recuperación de historial por entidad (Jean Pool)
- Página `/audit` (`src/pages/AuditPage.jsx`) exclusiva para rol `admin` con tabla de eventos, filtros por entidad, usuario, fechas, paginación y renderizado visual de diferencias (diffs tachados/destacados) (Jean Pool)
- Componente `ProductHistorySheet.jsx` (`src/components/inventory/ProductHistorySheet.jsx`) que despliega una línea de tiempo lateral con el historial de modificaciones del repuesto (Jean Pool)
- Integración de acción "Ver historial" en menú de opciones de `InventoryTable.jsx` visible para administradores (Jean Pool)
- Enlace de navegación "Auditoría" en `Sidebar.jsx` con ícono `ShieldCheck` de lucide y configuración de rol en `ROUTE_ROLES.audit = ['admin']` (Jean Pool)

### Added (Fase 11 - Tarea 11.3)
- Extensión autorizada de `AuthContext.jsx` exponiendo método `markPasswordChanged()` para sincronizar el estado y `localStorage` tras un cambio de contraseña obligatorio (Jean Pool)
- Hook `src/hooks/useUsers.js` con soporte para listar, crear, editar, desactivar, reactivar y restablecer contraseñas (Jean Pool)
- Módulo `src/lib/passwordUtils.js` con validador de políticas de seguridad y generador criptográficamente seguro mediante `crypto.getRandomValues` (Jean Pool)
- Página `/users` (`src/pages/UsersPage.jsx`) exclusiva para rol `admin`, con tabla detallada de colaboradores, badges de estado y roles, formateo de último acceso y menú de acciones (Jean Pool)
- Diálogo modal para "Nuevo Usuario" con selector de rol, generador de contraseñas seguras y botón copiar con feedback toast (Jean Pool)
- Diálogo modal para "Restablecer Contraseña" con generador seguro y botón copiar (Jean Pool)
- Diálogo modal para "Editar Usuario" con protección y Tooltip deshabilitado para auto-modificación de admin y único admin activo (Jean Pool)
- Diálogo de confirmación accesible con `AlertDialog` de shadcn/ui para desactivación lógica de usuarios (Jean Pool)
- Diálogo accesible `ChangePasswordDialog.jsx` disponible desde el menú de usuario en `Header.jsx` para cambio voluntario de contraseña (Jean Pool)
- Vista dedicada `/change-password` (`ChangePasswordPage.jsx`) con bloqueo de navegación forzado vía `ProtectedRoute.jsx` cuando `user.must_change_password === true` (Jean Pool)
- Ítem de navegación "Usuarios" en `Sidebar.jsx` con ícono `Users` de lucide y configuración de rol en `ROUTE_ROLES.users = ['admin']` (Jean Pool)

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