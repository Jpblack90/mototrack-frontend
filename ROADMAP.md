# ROADMAP — MotoTrack AI (Frontend Web)

Cliente web de MotoTrack AI. El backend (API REST) vive en un repositorio separado, `mototrack-backend/` — completo a la fecha (Fases 1-8), ver su propio ROADMAP.md.

## Estado General

| Sub-fase | Módulo | Estado |
|---|---|---|
| 9.1 | Setup, Autenticación y Layout base | ✅ Completo |
| 9.2 | Inventario (listado, alta manual, alta por IA, manejo de margen) | 🔄 En curso |
| 9.3 | Punto de Venta (POS) y Kits | ⏳ Pendiente |
| 9.4 | Órdenes de Trabajo (tablero por estado) | ⏳ Pendiente |
| 9.5 | Facturación (emisión, consulta, contingencia) | ⏳ Pendiente |

## Fuera de alcance de esta entrega (V2)
- App móvil nativa (React Native) — cubierta por este frontend web responsivo.
- Suite de pruebas automatizadas de frontend.

## Sistema de Diseño (aplica a todas las sub-fases siguientes)
SaaS profesional, inspirado en Stripe/Vercel/Linear — neutros slate/zinc + acento índigo, tarjetas blancas con `border-slate-200` y `shadow-sm`, tipografía con jerarquía clara, espaciado generoso, hover sutil.