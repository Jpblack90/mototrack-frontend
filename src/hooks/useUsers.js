import { useState, useCallback, useEffect } from 'react';
import client from '../api/client';

/**
 * Hook para la gestión de usuarios del taller (exclusivo para administradores).
 * Provee operaciones para listar, crear, editar, desactivar, reactivar y restablecer contraseñas.
 */
export function useUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data: res } = await client.get('/users');
      setUsers(res.data || []);
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al cargar el listado de usuarios.';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData) => {
    setError('');
    try {
      const { data: res } = await client.post('/users', userData);
      await fetchUsers();
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al registrar el nuevo usuario.';
      return { ok: false, error: msg, status: err.response?.status };
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (id, updateData) => {
    setError('');
    try {
      const { data: res } = await client.patch(`/users/${id}`, updateData);
      await fetchUsers();
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al actualizar el usuario.';
      return { ok: false, error: msg, status: err.response?.status };
    }
  }, [fetchUsers]);

  const deactivateUser = useCallback(async (id) => {
    setError('');
    try {
      const { data: res } = await client.delete(`/users/${id}`);
      await fetchUsers();
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al desactivar el usuario.';
      return { ok: false, error: msg, status: err.response?.status };
    }
  }, [fetchUsers]);

  const reactivateUser = useCallback(async (id) => {
    return updateUser(id, { is_active: true });
  }, [updateUser]);

  const resetPassword = useCallback(async (id, newPassword) => {
    setError('');
    try {
      const { data: res } = await client.post(`/users/${id}/reset-password`, {
        new_password: newPassword,
      });
      await fetchUsers();
      return { ok: true, data: res.data };
    } catch (err) {
      const msg =
        err.response?.data?.error?.message ??
        err.response?.data?.message ??
        'Error al restablecer la contraseña.';
      return { ok: false, error: msg, status: err.response?.status };
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    loading,
    error,
    refresh: fetchUsers,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    resetPassword,
  };
}
