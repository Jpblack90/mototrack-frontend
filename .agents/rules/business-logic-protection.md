<!-- .agents/rules/business-logic-protection.md -->
# Protección de Lógica de Negocio — NO TOCAR

Este refactor es EXCLUSIVAMENTE visual. Las siguientes reglas son bloqueantes:

1. **Nunca modifiques la lógica interna, firma, parámetros de retorno ni nombres de
   exportación** de los hooks en `src/hooks/` (`useCart.js`, `useSales.js`,
   `useWorkOrders.js`, `useInvoicing.js`). Estos hooks ya están validados end-to-end
   contra la API real. Si una vista necesita un dato que el hook no expone, PREGUNTA
   antes de tocar el hook — no asumas que puedes extenderlo tú mismo.
2. **Nunca cambies nombres de campos consumidos de la API** (`total_amount`,
   `sale_total`, `status`, `is_contingency`, etc.) ni la lógica de los interceptores de
   `src/api/client.js`.
3. **Nunca elimines ni alteres la lógica condicional de RBAC en la interfaz** (p. ej. el
   botón de reintento de contingencia visible solo para `admin`). Puedes rediseñar
   visualmente el botón; la condición que decide si se renderiza no se toca.
4. Si una tarea de diseño requiere cambiar algo de `src/hooks/` o `src/api/`, detente y
   repórtalo como una pregunta en vez de resolverlo de forma autónoma.