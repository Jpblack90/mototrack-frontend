/**
 * Utilidades de formateo de fechas para MotoTrack AI en formato regional es-PE.
 */

/**
 * Formatea una fecha o string YYYY-MM-DD / ISO a formato regional peruano (ej. "4 nov. 2026").
 * @param {string|Date|null} dateVal
 * @returns {string}
 */
export function formatDate(dateVal) {
  if (!dateVal) return '';
  let dt;
  if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
    const [y, m, d] = dateVal.slice(0, 10).split('-').map(Number);
    // Usar UTC medio día para evitar cualquier desfase por huso horario
    dt = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  } else if (dateVal instanceof Date) {
    dt = dateVal;
  } else {
    dt = new Date(dateVal);
  }

  if (isNaN(dt.getTime())) return String(dateVal);

  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(dt);
}

/**
 * Formatea una fecha ISO o timestamp con hora en hora local de Lima (es-PE).
 * @param {string|Date|null} isoStr
 * @returns {string}
 */
export function formatDateTime(isoStr) {
  if (!isoStr) return '-';
  const d = new Date(isoStr);
  if (isNaN(d.getTime())) return String(isoStr);
  return new Intl.DateTimeFormat('es-PE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Reemplaza fechas YYYY-MM-DD presentes dentro de un texto por su formato es-PE (ej. "4 nov. 2026").
 * Útil para mensajes generados por el backend como errores de bloqueo o advertencias.
 * @param {string} text
 * @returns {string}
 */
export function formatDatesInText(text) {
  if (!text || typeof text !== 'string') return '';
  return text.replace(/\b\d{4}-\d{2}-\d{2}\b/g, (match) => formatDate(match));
}
