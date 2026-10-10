<!-- .agents/rules/design-system.md -->
# Sistema de Diseño — MotoTrack AI (SaaS Premium)

Todo componente visual nuevo o modificado DEBE seguir estas reglas sin excepción:

1. **Nunca escribas CSS/HTML desde cero para primitivas de interfaz** (botones, diálogos,
   tablas, dropdowns, tabs, tooltips). Usa `npx shadcn@latest add <componente>` y luego
   edita el archivo generado en `src/components/ui/`. Si el componente no existe en
   shadcn/ui, créalo siguiendo exactamente su mismo patrón (forwardRef, cva para variantes,
   Tailwind puro, sin estilos inline).
2. **Paleta y tokens:** usa EXCLUSIVAMENTE las variables CSS definidas en `src/index.css`
   (@src/index.css) y las clases de Tailwind mapeadas en @tailwind.config.js. Prohibido
   usar colores hexadecimales sueltos o clases como `bg-blue-500`.
3. **Espaciado:** usa la escala por defecto de Tailwind (4, 6, 8, 12, 16px). Prohibido
   usar valores arbitrarios tipo `p-[13px]`.
4. **Bordes y sombras:** `rounded-lg` (var(--radius)) para tarjetas y modales,
   `rounded-md` para inputs y botones. Sombra por defecto `shadow-sm`; `shadow-md` solo
   en estados hover o elementos flotantes (dropdowns, popovers).
5. **Micro-interacciones obligatorias:** toda superficie interactiva (botón, fila de
   tabla, ítem de menú) debe tener una transición de al menos `transition-colors duration-150`
   en su estado hover/focus. Modales y dropdowns usan las animaciones `fade-in`/`slide-up`
   ya definidas.
6. **Tipografía:** familia `font-sans` (Inter). Jerarquía: títulos de sección
   `text-lg font-semibold text-foreground`; texto secundario `text-sm text-muted-foreground`.
7. **Referencia de componentes ya migrados:** antes de generar uno nuevo, revisa
   @src/components/ui/button.jsx como ejemplo canónico de calidad esperada.