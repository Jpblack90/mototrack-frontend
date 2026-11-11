import { useState, useCallback } from 'react';
import platformClient from '../api/platformClient';
import { extractPlatformError } from '../lib/platformErrors';

/**
 * Acciones administrativas de soporte sobre un taller y sus usuarios.
 */
export function usePlatformActions() {
  const [submitting, setSubmitting] = useState(false);

  const runAction = useCallback(async (requestFn, fallbackMessage) => {
    setSubmitting(true);
    try {
      const res = await requestFn();
      return { ok: true, data: res.data.data };
    } catch (err) {
      return {
        ok: false,
        error: extractPlatformError(err, fallbackMessage),
      };
    } finally {
      setSubmitting(false);
    }
  }, []);

  const resetPassword = useCallback(
    (companyId, userId) =>
      runAction(
        () =>
          platformClient.post(
            `/platform/companies/${companyId}/users/${userId}/reset-password`
          ),
        'No se pudo restablecer la contraseña del usuario.'
      ),
    [runAction]
  );

  const setStatus = useCallback(
    (companyId, { is_active, reason }) =>
      runAction(
        () =>
          platformClient.patch(`/platform/companies/${companyId}/status`, {
            is_active,
            reason,
          }),
        'No se pudo actualizar el estado del taller.'
      ),
    [runAction]
  );

  const recordPayment = useCallback(
    (companyId, { amount, method, reference, months, notes }) =>
      runAction(
        () =>
          platformClient.post(`/platform/companies/${companyId}/payments`, {
            amount,
            method,
            reference: reference || undefined,
            months,
            notes: notes || undefined,
          }),
        'No se pudo registrar el pago.'
      ),
    [runAction]
  );

  return {
    submitting,
    resetPassword,
    setStatus,
    recordPayment,
  };
}
