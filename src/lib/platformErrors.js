/**
 * Extrae el mensaje, código y estado HTTP de un error Axios de plataforma.
 */
export function extractPlatformError(err, fallback = 'Ocurrió un error inesperado.') {
  const apiError = err?.response?.data?.error;
  const status = err?.response?.status ?? null;
  const code = apiError?.code ?? null;

  let message = apiError?.message || err?.response?.data?.message || fallback;
  if (status === 503 || code === 'PLATFORM_NOT_CONFIGURED') {
    message =
      apiError?.message ||
      'El panel de plataforma no está habilitado en este servidor.';
  }

  return { message, code, status };
}
