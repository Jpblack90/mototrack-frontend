<!-- .agents/rules/business-logic-protection.md -->
# Protección de Lógica de Negocio

La fase de refactor visual terminó. Ahora se agregan funcionalidades, pero la lógica ya validada se protege:

1. **Hooks existentes** (`useCart.js`, `useSales.js`, `useWorkOrders.js`, `useInvoicing.js`, `useDashboard.js`): no cambies su firma, sus valores de retorno ni sus nombres de exportación. Solo puedes EXTENDERLOS (agregar algo nuevo sin alterar lo existente) cuando la tarea lo autorice explícitamente.
2. **Lógica nueva** va en hooks nuevos dentro de `src/hooks/` (por ejemplo `useUsers.js`). Los componentes visuales no llaman a la API directamente.
3. **No cambies nombres de campos de la API** (`total_amount`, `sale_total`, `status`, `is_contingency`, etc.) ni la lógica de los interceptores de `src/api/client.js` sin autorización explícita en la tarea.
4. **RBAC en la interfaz:** no elimines condiciones de rol existentes. Las nuevas condiciones de rol deben reflejar exactamente los permisos del backend (ver la tabla de roles en @../.agents/rules/00-contexto-mototrack.md).
5. Si una tarea parece requerir romper alguna de estas reglas, detente y pregunta.
