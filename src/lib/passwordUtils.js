/**
 * Utilidades criptográficas y de validación de contraseñas para MotoTrack AI.
 */

/**
 * Valida la política de contraseñas de MotoTrack AI:
 * - Mínimo 8 caracteres
 * - Al menos una letra (mayúscula o minúscula)
 * - Al menos un número
 *
 * @param {string} password
 * @returns {{ valid: boolean, message?: string }}
 */
export function validatePasswordPolicy(password) {
  if (!password || password.length < 8) {
    return {
      valid: false,
      message: 'La contraseña debe tener al menos 8 caracteres.',
    };
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return {
      valid: false,
      message: 'La contraseña debe contener al menos una letra y un número.',
    };
  }
  return { valid: true };
}

/**
 * Genera una contraseña temporal segura usando crypto.getRandomValues.
 * Evita Math.random() para cumplir con estándares criptográficos.
 * Garantiza cumplimiento de la política de seguridad.
 *
 * @param {number} length
 * @returns {string}
 */
export function generateSecurePassword(length = 12) {
  const charset = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
  const array = new Uint32Array(length);
  window.crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  // Verificar que cumpla con letra y número; si no, regenerar
  const check = validatePasswordPolicy(password);
  if (!check.valid) {
    return generateSecurePassword(length);
  }

  return password;
}
