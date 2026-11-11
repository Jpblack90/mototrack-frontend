# Changelog
Formato basado en Keep a Changelog. Cada entrada indica el integrante responsable entre paréntesis.
Cubre solo el Frontend Web. Backend: ver CHANGELOG.md en mototrack-backend/.

## [Unreleased]
### Added (Panel de Plataforma - Tarea P2)
- Panel administrativo de plataforma (super-admin) completamente desacoplado de las rutas, sesión y hooks de talleres:
  - Cliente HTTP `src/api/platformClient.js` y contexto `src/context/PlatformAuthContext.jsx` con clave independiente `mototrack_platform_token` / `mototrack_platform_admin`, manejo de sesiones con `must_change_password = true` (HTTP 403 `PASSWORD_CHANGE_REQUIRED`) y sin modificar `AuthContext`, `ProtectedRoute`, `client.js` ni hooks existentes (Jean Pool)
  - Hooks dedicados en `src/hooks/`: `usePlatformAuth`, `usePlatformMetrics`, `usePlatformCompanies`, `usePlatformCompany`, `usePlatformActions` (`resetPassword`, `setStatus`, `recordPayment`) y `usePlatformAudit`, apoyados por utilidades compartidas `src/lib/platformStatus.js` y `src/lib/platformErrors.js` (Jean Pool)
  - Layout propio `src/components/platform/PlatformLayout.jsx` con barra superior oscura, logotipo MotoTrack y etiqueta `Plataforma · Soporte`, sin menú de talleres, protegido por `src/components/platform/PlatformProtectedRoute.jsx` y envuelto por `PlatformAuthShell.jsx` en las pantallas de ingreso (Jean Pool)
  - Pantallas bajo `/plataforma/*` configuradas en `src/App.jsx` con carga diferida (`React.lazy`):
    - `/plataforma/login` (`PlatformLoginPage.jsx`): acceso separado de plataforma (Jean Pool)
    - `/plataforma/change-password` (`PlatformChangePasswordPage.jsx`): cambio obligatorio de contraseña con validación en vivo y `validatePasswordPolicy` (Jean Pool)
    - `/plataforma` (`PlatformSummaryPage.jsx`): tarjetas de ingreso mensual estimado, escaneos IA del mes, registros últimos 30 días, talleres por estado clicables y actividad reciente de soporte (Jean Pool)
    - `/plataforma/talleres` (`PlatformCompaniesPage.jsx`): tabla con búsqueda (300 ms debounce), filtro por estado, badges semánticos, cupo usuarios, escaneos IA, vencimiento y último login (Jean Pool)
    - `/plataforma/talleres/:id` (`PlatformCompanyDetailPage.jsx`): detalle operativo con conteos numéricos del mes, historial de pagos, modales `RecordPaymentDialog`, `CompanyStatusDialog` (motivo obligatorio 10–300 caracteres) y `ResetPasswordDialog` (confirmación + muestra única con botón copiar y advertencia) y bitácora paginada de `platform_audit_logs` (Jean Pool)
  - Evidencias gráficas en `docs/capturas/`: `plataforma-login.png`, `plataforma-cambio-password.png`, `plataforma-resumen.png`, `plataforma-talleres.png` y `plataforma-detalle-taller.png` generadas con `[PRUEBA] Soporte` (Jean Pool)

### Added (Fase 13 - Tarea 13.2)
- Gestión y visualización de suscripciones, vigencia y pagos manuales (RF-27):
  - Utilidad regional de fechas `src/lib/dates.js`: funciones `formatDate(dateVal)` para visualización en formato regional peruano `es-PE` (ej. "4 nov. 2026"), `formatDateTime(isoStr)` y `formatDatesInText(text)` para sustitución de fechas YYYY-MM-DD en mensajes del backend (Jean Pool)
  - Card "Mi Plan" en `src/pages/SettingsPage.jsx`:
    - Badge "Pagado hasta" con tokens semánticos: verde (`success`) cuando está al día, ámbar (`warning`) cuando vence en 5 días o menos, y rojo (`destructive`) exclusivamente en estado de gracia o cuenta suspendida (Jean Pool)
    - Fechas formateadas en formato `es-PE` en badge y alertas (Jean Pool)
    - Historial de pagos conectado mediante hook `usePayments`: tabla interactiva mostrando el período sin solapamiento (`formatDate(period_from)` al `formatDate(period_to)`), método de pago, monto en S/ y código de operación (Jean Pool)
  - Banner global de vencimiento en `src/components/layout/AppLayout.jsx`:
    - Alerta superior para rol `admin` cuando la cuenta vence en 5 días o menos (warning) o se encuentra en gracia (destructive) con instrucciones de abono y descarte por sesión diaria (`sessionStorage`) (Jean Pool)
  - Badges contextuales de cabecera en `src/components/layout/Header.jsx`:
    - Indicador de estado que cubre periodo de gracia ("En gracia") y vencimiento próximo ("Vence en N días") (Jean Pool)
  - Manejo de suspensión en pantalla de autenticación `src/pages/LoginPage.jsx`:
    - Intercepción del error HTTP 403 `SUBSCRIPTION_EXPIRED` suprimiendo el Toast y mostrando exclusivamente el recuadro persistente de advertencia bajo el formulario con fecha formateada e instrucciones de pago (Jean Pool)
  - Evidencias gráficas en `docs/capturas/`: `mi-plan-pagos.png`, `banner-vencimiento.png` y `login-suspendido.png` generadas con empresa `[PRUEBA]` (Jean Pool)

### Added (Fase 13 - Tarea 13.1)
- Facturación Electrónica PSE Nubefact (RF-23, RF-28, RF-29):
  - Configuración PSE en `src/pages/SettingsPage.jsx`: Card "Facturación Electrónica (PSE)" con selector Simulado vs Nubefact, enmascaramiento de token, prueba de conexión y tabla interactiva de correlativos con protección ante decrementos (Jean Pool)
  - Ticket con QR dinámico en `src/components/invoicing/TicketView.jsx`: renderizado con librería `qrcode`, hash oficial SUNAT y banner de advertencia si el comprobante es simulado (Jean Pool)
  - Indicador de PSE en `src/pages/InvoicingPage.jsx`: Badge de proveedor y tooltip con descripción de rechazo SUNAT (Jean Pool)
  - Evidencias gráficas en `docs/capturas/`: `configuracion-pse.png` y `ticket-con-qr.png` (Jean Pool)

### Changed (Fase 13 - Tarea 13.0a)
- Pulido visual y rendimiento del frontend sin cambios de lógica de negocio:
  - Sistema de diseño y tokens de color (Regla 2): definición e integración de tokens `--success`, `--warning`, `--info` y sus respectivos `*-foreground` en `src/index.css` (temas claro y oscuro) con modelo `oklch` y contraste WCAG AA; migración del 100 % de clases de paleta fija (`amber-*`, `emerald-*`, `rose-*`, `blue-*`, `slate-*`, etc.) en todo `src/` a tokens semánticos (Jean Pool)
  - Script automatizado de calidad `npm run check:colors` (`scripts/check-colors.mjs`): escaneo estricto de clases de paleta fija en `src/`, pasando con 0 violaciones y código de salida limpio (Jean Pool)
  - Tablero Kanban de órdenes de trabajo (`WorkOrdersPage.jsx`): columnas de ancho fijo `w-72` con contenedor horizontal (`overflow-x-auto snap-x`) para visualización completa y fluida de los 6 estados del flujo sin comprimir tarjetas (Jean Pool)
  - Ergonomía de tarjeta de trabajo (`WorkOrderCard.jsx`): reestructuración del bloque de aviso de WhatsApp en una sola columna vertical (Badge "Aviso pendiente" arriba, botón de WhatsApp a ancho completo y enlace "Ya avisé por otro medio" debajo) (Jean Pool)
  - Code-splitting y optimización de bundle (`App.jsx` y `vite.config.js`): implementación de `React.lazy` y `Suspense` con fallback visual (`Skeleton`) en rutas principales, y división en chunks independientes (`vendor-recharts`, `vendor-radix`, `vendor-lucide`), reduciendo el chunk principal de 1.18 MB a 332 kB y eliminando la advertencia de Vite de chunks > 500 kB (Jean Pool)
  - Armonización de leyenda en `DashboardPage.jsx`: estandarización del texto a "transacciones" en métricas de venta (Jean Pool)
  - Limpieza de linting: extracción de variantes CVA a módulos desacoplados (`badge-variants.js`, `button-variants.js`, `tabs-variants.js`), eliminación de variable no utilizada `savedUser` en `AuthContext.jsx` y resolución de `setState` síncronos en componentes UI, reduciendo a 4 warnings residuales pertenecientes a hooks y contexto protegidos por `business-logic-protection.md` (Jean Pool)
  - Evidencias gráficas en `docs/capturas/`: `tablero-ot-antes.png`, `tablero-ot-despues.png` y `tablero-ot-dark.png` generadas con empresa `[PRUEBA] Taller B` (Jean Pool)
### Added (Fase 12 - Tarea 12.6)
- Avisos al cliente por WhatsApp - Fase 1 (RF-15):
  - Hook `src/hooks/useWhatsAppNotices.js`: sondeo periódico (cada 60s) y reactivo a eventos globales (`mototrack:workorder-updated`) de avisos pendientes (`GET /api/notifications/pending`), generación segura de enlaces WhatsApp (`GET /api/notifications/:id/whatsapp-link`), apertura asistida (`PATCH /api/notifications/:id/opened`) y omisión de contacto alternativo (`PATCH /api/notifications/:id/skip`) (Jean Pool)
  - Modal `NewWorkOrderModal.jsx`: campo de teléfono con texto de ayuda "Celular de 9 dígitos" y casilla de consentimiento explícito "El cliente acepta recibir avisos por WhatsApp sobre su moto (Ley N° 29733)" desmarcada por defecto, registrando el opt-in del cliente con validación inmediata (Jean Pool)
  - Tarjeta de orden de trabajo `WorkOrderCard.jsx`: bloque visual de "Aviso pendiente" para órdenes con notificaciones sin enviar, con botón destacado "Avisar por WhatsApp" que abre la URL codificada en nueva pestaña segura (`noopener,noreferrer`), marca la notificación como abierta y ofrece el botón secundario "Ya avisé por otro medio" (Jean Pool)
  - Campana unificada en `Header.jsx`: consolidación del contador de avisos pendientes de WhatsApp junto con alertas de inventario y motos por recoger, popover con bloque "Avisos por enviar ({N})" detallando placa, tipo de aviso con badge contextual (Recibido, Trabajo adicional, Listo para recoger, No recogido), cliente y botón de acción directa "Avisar" (Jean Pool)
  - Gestión en `WorkOrdersPage.jsx`: integración completa del flujo de avisos y feedback visual con notificaciones Toast al despachar o descartar avisos de WhatsApp (Jean Pool)
  - Evidencias gráficas en `docs/capturas/` (`nueva-ot-consentimiento.png` y `ot-aviso-whatsapp.png`) generadas con empresa `[PRUEBA] Taller B` (Jean Pool)

### Added (Fase 12 - Tarea 12.5)
- Detección y alertas de motos no recogidas (RF-17):
  - Hook `src/hooks/usePickupAlerts.js`: consulta reactiva periódica (cada 60s) a `GET /api/workorders/pickup-alerts` obteniendo listas priorizadas de órdenes en estado `no_recogido` y `due_soon` (vencen en <= 2 días) (Jean Pool)
  - Campana unificada en `Header.jsx`: integra alertas de stock y alertas de motos por recoger en un único indicador consolidado en el encabezado para administradores y cajeros, con enlaces directos a WhatsApp/teléfono (`tel:...`) de clientes y navegación hacia la orden de trabajo (Jean Pool)
  - Tablero Kanban en `WorkOrdersPage.jsx`: nueva columna "No Recogido" (color destructivo) soportando el flujo completo de 6 estados; banner superior de filtro activo cuando se accede mediante parámetro `?status=no_recogido` con botón "Ver todas las columnas" para restaurar la vista completa del taller (Jean Pool)
  - Tarjeta de orden de trabajo `WorkOrderCard.jsx`: alerta visual destacada "Esperando hace {N} días" en rojo destructivo para motos en estado `no_recogido` y botón de acción directa "Entregar" disponible para roles autorizados (`admin`, `cajero`) (Jean Pool)
  - Transición válida en frontend `VALID_TRANSITIONS`: habilitado paso directo `no_recogido -> ['entregado']` reflejando el ciclo de vida del taller cuando el cliente acude tardíamente (Jean Pool)
  - Dashboard operativo en `DashboardPage.jsx`: indicador "Motos no recogidas: {N}" en la tarjeta KPI de órdenes de trabajo y banner de alerta crítica con enlace directo a `/workorders?status=no_recogido` (Jean Pool)
  - Evidencias gráficas en `docs/capturas/` (`campana-motos.png` y `ot-no-recogida.png`) generadas con empresa `[PRUEBA] Taller B` (Jean Pool)

### Added (Fase 12 - Tarea 12.4)
- Alertas de stock en Header (RF-06): campana de notificaciones (`Bell`) en `Header.jsx` visible para admin, cajero y almacenero, con badge reactivo que suma productos agotados y con stock bajo, y popover interactivo con lista priorizada de repuestos críticos y enlaces directos a `/inventory?stock_status=...` (Jean Pool)
- Hook `src/hooks/useStockAlerts.js`: consulta periódica (cada 60s) de `/inventory/alerts` y refresco instantáneo al despachar ventas mediante el evento `mototrack:sale-completed` (Jean Pool)
- Filtros rápidos en `InventoryPage.jsx`: chips táctiles ("Todos", "Stock bajo", "Agotados") sincronizados bidireccionalmente con la URL mediante el parámetro `stock_status` (Jean Pool)
- Distinción de estados en `InventoryTable.jsx`: Badge "Agotado" (`destructive`) para `stock = 0` y Badge "Bajo" (`warning`) exclusivo para `0 < stock <= min_stock` (Jean Pool)
- Compatibilidad por motocicleta en POS (RF-20): selector de moto en `SalesPage.jsx` con resolución automática vía `GET /api/workorders/placa/:valor` (autocompleta marca y modelo) o ingreso libre de modelo, con normalización alfanumérica tolerante (Jean Pool)
- Componente `Switch` (`src/components/ui/switch.jsx` de Radix/shadcn) para filtro "Solo compatibles", limitando la búsqueda a repuestos aptos para la moto seleccionada (Jean Pool)
- Badges visuales de compatibilidad en resultados del POS: indicador "Compatible" verde cuando el repuesto coincide con la moto y advertencia informativa cuando no está registrado para ese modelo (Jean Pool)
- Repuestos alternativos para productos agotados en POS (RF-21): bloqueo de agregado directo a productos con stock 0 y despliegue del botón "Ver alternativas" con popover `AlternativesPopover.jsx` (Jean Pool)
- Agrupación inteligente en `AlternativesPopover.jsx`: cuando hay una moto seleccionada, presenta primero el grupo "Compatibles con [Moto]" y, si el filtro estricto está desactivado, el grupo "Otras (no confirmadas para [Moto])" con banner de advertencia; soporte del mensaje "No hay alternativas compatibles con stock" cuando el filtro "Solo compatibles" está activo (Jean Pool)
- Hook `src/hooks/useAlternatives.js` para consulta bajo demanda a `GET /api/inventory/:id/alternatives` (Jean Pool)
- Adición directa de repuestos alternativos al carrito de ventas desde el popover (Jean Pool)
- Evidencias gráficas en `docs/capturas/` (`campana-alertas.png`, `pos-moto-compatibles.png` y `pos-agotado-alternativas.png`) generadas con empresa `[PRUEBA] Taller B` (Jean Pool)

### Added (Fase 12 - Tarea 12.3)
- Corrección de bug en `src/hooks/useInvoicing.js`: cambio de `!s.is_voided` por `s.status !== 'voided'` en `getUninvoicedSales` para excluir ventas anuladas de la lista de ventas por facturar (Jean Pool)
- Métodos añadidos a `useInvoicing.js`: `listCreditNotes`, `getCreditNoteTicket` y `retryCreditNote` para soporte de ciclo de vida de Notas de Crédito (Jean Pool)
- Hook nuevo `src/hooks/useVoidSale.js` con método `voidSale(saleId, { void_reason, motivo_code })` manteniendo desacoplado e intacto el hook `useSales.js` (Jean Pool)
- Modal de anulación en `InvoicingPage.jsx` (`AlertDialog` de shadcn/ui) restringido exclusivamente a rol `admin`:
  - Selector de motivo de anulación según catálogo 09 de SUNAT ('01' Anulación de la operación y '06' Devolución total para boletas; suma '02' Anulación por error en el RUC para facturas) (Jean Pool)
  - Campo de texto obligatorio para detalle del motivo (Jean Pool)
  - Alerta destacada indicando serie de la Nota de Crédito a emitir (`BC01` o `FC01`), monto exacto y devolución automática de stock a inventario (Jean Pool)
- Soporte visual de Notas de Crédito en la tabla de comprobantes emitidos de `InvoicingPage.jsx`: Badge `"Anulada · BC01-00000001"` con indicador de estado (verde para aceptada, ámbar para contingencia con botón de reintento directo) y botón para ver el ticket de la Nota de Crédito (Jean Pool)
- Acción "Anular venta" en la tabla de ventas pendientes de comprobante para administradores (Jean Pool)
- Soporte para tipo `credit_note` en `TicketView.jsx`: encabezado `"NOTA DE CRÉDITO ELECTRÓNICA"`, correlativo `BC01`/`FC01`, referencia al comprobante modificado (`"Documento que modifica: B001-..."`), motivo y montos en crédito con signo negativo manteniendo el formato para impresión térmica (Jean Pool)
- Evidencias gráficas obligatorias en `docs/capturas/` (`anular-con-nc.png` y `ticket-nota-credito.png`) (Jean Pool)

### Added (Fase 12 - Tarea 12.2)
- Rediseño táctil de `CheckoutModal.jsx` (RNF 6.4): visualización destacada del total de la venta, selector táctil de métodos de pago mediante botones tipo pill (Efectivo, Tarjeta, Yape, Plin), líneas de pago dinámicas (hasta 4 medios combinados con botón "+ Agregar otro método" y precarga del saldo restante), cálculo automático de vuelto con botones de billetes rápidos (Exacto, S/ 10, S/ 20, S/ 50, S/ 100, S/ 200), y barra de estado permanente ("Falta S/ X.XX", "Cubierto", "Excede en S/ X.XX") con bloqueo de confirmación hasta cuadre exacto (Jean Pool)
- Adaptación en `SalesPage.jsx`: envío estructurado de `payments` al hook `useSales` para cobros únicos o pagos mixtos (Jean Pool)
- Actualización de documentación JSDoc en `useSales.js` detallando el nuevo contrato de pagos con compatibilidad para `'efectivo'|'tarjeta'|'yape'|'plin'|'mixto'` (Jean Pool)
- Sección "PAGOS" en `TicketView.jsx`: renderizado detallado inmediatamente debajo del total del comprobante con desglose por método, montos parciales, vuelto entregado en efectivo y códigos de operación de pagos digitales (Jean Pool)
- Capturas obligatorias `docs/capturas/cobro-mixto.png` y `docs/capturas/ticket-pago-mixto.png` documentando el modal de cobro mixto con vuelto y el ticket térmico con desglose de pagos (Jean Pool)

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