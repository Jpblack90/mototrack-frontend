import { useContext, useState, useCallback } from 'react';
import platformClient from '../api/platformClient';
import { PlatformAuthContext } from '../context/platformAuthStore';
import { extractPlatformError } from '../lib/platformErrors';

/**
 * Hook de autenticación para el panel de plataforma.
 */
export function usePlatformAuth() {
  const context = useContext(PlatformAuthContext);
  if (!context) {
    throw new Error('usePlatformAuth debe usarse dentro de PlatformAuthProvider.');
  }

  const [changingPassword, setChangingPassword] = useState(false);

  const changePassword = useCallback(
    async (currentPassword, newPassword) => {
      setChangingPassword(true);
      try {
        const res = await platformClient.post('/platform/auth/change-password', {
          current_password: currentPassword,
          new_password: newPassword,
        });
        context.markPasswordChanged();
        return { ok: true, data: res.data.data };
      } catch (err) {
        return {
          ok: false,
          error: extractPlatformError(err, 'No se pudo actualizar la contraseña.'),
        };
      } finally {
        setChangingPassword(false);
      }
    },
    [context]
  );

  return {
    ...context,
    changingPassword,
    changePassword,
  };
}
