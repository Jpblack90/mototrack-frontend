import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useUsers } from '../hooks/useUsers';
import { ROLE_LABELS } from '../lib/roles';
import { generateSecurePassword, validatePasswordPolicy } from '../lib/passwordUtils';

import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '../components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '../components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '../components/ui/dropdown-menu';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '../components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '../components/ui/tooltip';
import { toast } from 'sonner';

import {
  Users,
  UserPlus,
  MoreHorizontal,
  Pencil,
  KeyRound,
  UserX,
  UserCheck,
  Dices,
  Copy,
  Check,
  AlertCircle,
  Clock,
} from 'lucide-react';

const VALID_ROLES = [
  { value: 'admin', label: 'Administrador' },
  { value: 'cajero', label: 'Cajero' },
  { value: 'almacenero', label: 'Almacenero' },
  { value: 'mecanico', label: 'Mecánico' },
];

function formatLastLogin(dateStr) {
  if (!dateStr) return 'Nunca';
  try {
    return new Intl.DateTimeFormat('es-PE', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(dateStr));
  } catch {
    return 'Nunca';
  }
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const {
    users,
    loading,
    createUser,
    updateUser,
    deactivateUser,
    reactivateUser,
    resetPassword,
  } = useUsers();

  // Estados para diálogos
  const [newDialogOpen, setNewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false);

  // Estados de formularios
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('cajero');
  const [newPassword, setNewPassword] = useState('');
  const [copiedNew, setCopiedNew] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('cajero');

  const [resetNewPassword, setResetNewPassword] = useState('');
  const [copiedReset, setCopiedReset] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  // Conteo de administradores activos para reglas de protección
  const activeAdminsCount = users.filter(
    (u) => u.role === 'admin' && u.is_active
  ).length;

  // ─── Generadores de contraseña ─────────────────────────────────────────────
  function handleGenerateNew() {
    const pwd = generateSecurePassword();
    setNewPassword(pwd);
    setCopiedNew(false);
  }

  function handleCopyNew() {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopiedNew(true);
    toast.success('Contraseña temporal copiada al portapapeles.');
    setTimeout(() => setCopiedNew(false), 2000);
  }

  function handleGenerateReset() {
    const pwd = generateSecurePassword();
    setResetNewPassword(pwd);
    setCopiedReset(false);
  }

  function handleCopyReset() {
    if (!resetNewPassword) return;
    navigator.clipboard.writeText(resetNewPassword);
    setCopiedReset(true);
    toast.success('Contraseña copiada al portapapeles.');
    setTimeout(() => setCopiedReset(false), 2000);
  }

  // ─── Acciones de Apertura de Diálogos ──────────────────────────────────────
  function openNewDialog() {
    setNewName('');
    setNewEmail('');
    setNewRole('cajero');
    const pwd = generateSecurePassword();
    setNewPassword(pwd);
    setCopiedNew(false);
    setNewDialogOpen(true);
  }

  function openEditDialog(user) {
    setSelectedUser(user);
    setEditName(user.name);
    setEditRole(user.role);
    setEditDialogOpen(true);
  }

  function openResetDialog(user) {
    setSelectedUser(user);
    const pwd = generateSecurePassword();
    setResetNewPassword(pwd);
    setCopiedReset(false);
    setResetDialogOpen(true);
  }

  function openDeactivateDialog(user) {
    setSelectedUser(user);
    setDeactivateDialogOpen(true);
  }

  // ─── Handlers de Envío ────────────────────────────────────────────────────
  async function handleCreateSubmit(e) {
    e.preventDefault();
    const policy = validatePasswordPolicy(newPassword);
    if (!policy.valid) {
      toast.error(policy.message);
      return;
    }

    setSubmitting(true);
    const res = await createUser({
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      password: newPassword,
    });
    setSubmitting(false);

    if (res.ok) {
      toast.success(`Usuario "${res.data.name}" registrado exitosamente.`);
      setNewDialogOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    const res = await updateUser(selectedUser.id, {
      name: editName.trim(),
      role: editRole,
    });
    setSubmitting(false);

    if (res.ok) {
      toast.success('Usuario actualizado correctamente.');
      setEditDialogOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleResetSubmit(e) {
    e.preventDefault();
    if (!selectedUser) return;

    const policy = validatePasswordPolicy(resetNewPassword);
    if (!policy.valid) {
      toast.error(policy.message);
      return;
    }

    setSubmitting(true);
    const res = await resetPassword(selectedUser.id, resetNewPassword);
    setSubmitting(false);

    if (res.ok) {
      toast.success(`Contraseña de ${selectedUser.name} restablecida exitosamente.`);
      setResetDialogOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleDeactivateConfirm() {
    if (!selectedUser) return;
    setSubmitting(true);
    const res = await deactivateUser(selectedUser.id);
    setSubmitting(false);

    if (res.ok) {
      toast.success(`Usuario "${selectedUser.name}" desactivado.`);
      setDeactivateDialogOpen(false);
    } else {
      toast.error(res.error);
    }
  }

  async function handleReactivateClick(user) {
    const res = await reactivateUser(user.id);
    if (res.ok) {
      toast.success(`Usuario "${user.name}" reactivado correctamente.`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Gestión de Usuarios
            </h1>
          </div>
          <p className="text-xs text-muted-foreground">
            Administra las cuentas de acceso, roles y contraseñas del personal del taller.
          </p>
        </div>

        <Button onClick={openNewDialog} className="text-xs font-semibold gap-2">
          <UserPlus className="w-4 h-4" />
          <span>Nuevo Usuario</span>
        </Button>
      </div>

      {/* Tabla Principal */}
      <Card className="border border-border/80 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Usuarios del Taller</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Lista completa de colaboradores registrados en esta sucursal.
          </CardDescription>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px]">Nombre</TableHead>
                <TableHead>Correo Electrónico</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Acceso</TableHead>
                <TableHead className="w-[70px] text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                    Cargando usuarios...
                  </TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-xs text-muted-foreground">
                    No hay usuarios registrados.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((u) => {
                  const isSelf = Number(u.id) === Number(currentUser?.id);
                  const isLastAdmin = u.role === 'admin' && u.is_active && activeAdminsCount <= 1;

                  return (
                    <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                      <TableCell className="font-medium text-xs text-foreground">
                        <div className="flex items-center gap-2">
                          <span>{u.name}</span>
                          {isSelf && (
                            <Badge variant="outline" className="text-[10px] py-0 px-1 font-normal text-muted-foreground">
                              Tú
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.email}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={u.role === 'admin' ? 'default' : 'secondary'}
                          className="text-[11px] font-medium"
                        >
                          {ROLE_LABELS[u.role] || u.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                            <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground" />
                            Inactivo
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 opacity-60" />
                          <span>{formatLastLogin(u.last_login_at)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            >
                              <MoreHorizontal className="w-4 h-4" />
                              <span className="sr-only">Acciones</span>
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem
                              onClick={() => openEditDialog(u)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                              <span>Editar usuario</span>
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              onClick={() => openResetDialog(u)}
                              className="cursor-pointer gap-2 text-xs"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                              <span>Restablecer contraseña</span>
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {u.is_active ? (
                              isSelf ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground/50 flex items-center gap-2 cursor-not-allowed">
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Desactivar</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">No puedes desactivar tu propia cuenta</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : isLastAdmin ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="px-2 py-1.5 text-xs text-muted-foreground/50 flex items-center gap-2 cursor-not-allowed">
                                      <UserX className="w-3.5 h-3.5" />
                                      <span>Desactivar</span>
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs">No puedes desactivar al único administrador activo</p>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => openDeactivateDialog(u)}
                                  className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer gap-2 text-xs"
                                >
                                  <UserX className="w-3.5 h-3.5" />
                                  <span>Desactivar</span>
                                </DropdownMenuItem>
                              )
                            ) : (
                              <DropdownMenuItem
                                onClick={() => handleReactivateClick(u)}
                                className="text-emerald-600 focus:text-emerald-600 focus:bg-emerald-50 cursor-pointer gap-2 text-xs"
                              >
                                <UserCheck className="w-3.5 h-3.5" />
                                <span>Reactivar usuario</span>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* ─── Diálogo: Nuevo Usuario ────────────────────────────────────────── */}
      <Dialog open={newDialogOpen} onOpenChange={setNewDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Nuevo Colaborador</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa los datos para crear una nueva cuenta en tu taller.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="create-name" className="text-xs font-medium">
                Nombre y apellido
              </Label>
              <Input
                id="create-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ej. Juan Pérez"
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="create-email" className="text-xs font-medium">
                Correo electrónico
              </Label>
              <Input
                id="create-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="juan@mototrack.local"
                required
                className="text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Rol en el taller</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger className="text-sm">
                  <SelectValue placeholder="Selecciona un rol" />
                </SelectTrigger>
                <SelectContent>
                  {VALID_ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value} className="text-xs">
                      {r.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Contraseña temporal */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="create-pwd" className="text-xs font-medium">
                  Contraseña temporal
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateNew}
                    className="h-7 px-2 text-xs text-primary gap-1"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Generar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyNew}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    {copiedNew ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </Button>
                </div>
              </div>
              <Input
                id="create-pwd"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-amber-500/90 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>El usuario deberá cambiarla obligatoriamente en su primer ingreso.</span>
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setNewDialogOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="text-xs">
                {submitting ? 'Registrando...' : 'Registrar Usuario'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Diálogo: Editar Usuario ────────────────────────────────────────── */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Editar Usuario</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Modifica los datos del colaborador seleccionado.
            </DialogDescription>
          </DialogHeader>

          {selectedUser && (
            <form onSubmit={handleEditSubmit} className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-name" className="text-xs font-medium">
                  Nombre y apellido
                </Label>
                <Input
                  id="edit-name"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Correo electrónico</Label>
                <Input value={selectedUser.email} disabled className="text-sm bg-muted/50" />
              </div>

              {/* Rol con protección */}
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Rol en el taller</Label>
                {Number(selectedUser.id) === Number(currentUser?.id) ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select value={editRole} disabled>
                          <SelectTrigger className="text-sm opacity-60">
                            <SelectValue />
                          </SelectTrigger>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">No puedes cambiar tu propio rol de administrador</p>
                    </TooltipContent>
                  </Tooltip>
                ) : selectedUser.role === 'admin' && selectedUser.is_active && activeAdminsCount <= 1 ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <Select value={editRole} disabled>
                          <SelectTrigger className="text-sm opacity-60">
                            <SelectValue />
                          </SelectTrigger>
                        </Select>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="text-xs">No puedes cambiar el rol del único administrador activo</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Select value={editRole} onValueChange={setEditRole}>
                    <SelectTrigger className="text-sm">
                      <SelectValue placeholder="Selecciona un rol" />
                    </SelectTrigger>
                    <SelectContent>
                      {VALID_ROLES.map((r) => (
                        <SelectItem key={r.value} value={r.value} className="text-xs">
                          {r.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditDialogOpen(false)}
                  disabled={submitting}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={submitting} className="text-xs">
                  {submitting ? 'Guardando...' : 'Guardar Cambios'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ─── Diálogo: Restablecer Contraseña ────────────────────────────────── */}
      <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Restablecer Contraseña</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Genera una nueva contraseña temporal para{' '}
              <span className="font-semibold text-foreground">{selectedUser?.name}</span>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleResetSubmit} className="space-y-4 py-2">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="reset-pwd" className="text-xs font-medium">
                  Nueva contraseña temporal
                </Label>
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleGenerateReset}
                    className="h-7 px-2 text-xs text-primary gap-1"
                  >
                    <Dices className="w-3.5 h-3.5" />
                    <span>Generar</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleCopyReset}
                    className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground gap-1"
                  >
                    {copiedReset ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>Copiar</span>
                  </Button>
                </div>
              </div>
              <Input
                id="reset-pwd"
                value={resetNewPassword}
                onChange={(e) => setResetNewPassword(e.target.value)}
                required
                className="font-mono text-xs"
              />
              <p className="text-[11px] text-amber-500/90 flex items-center gap-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>El usuario deberá cambiarla obligatoriamente en su próximo ingreso.</span>
              </p>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setResetDialogOpen(false)}
                disabled={submitting}
                className="text-xs"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={submitting} className="text-xs">
                {submitting ? 'Restableciendo...' : 'Restablecer Contraseña'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── Diálogo: Confirmación de Desactivación ─────────────────────────── */}
      <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-base font-semibold">
              ¿Desactivar al usuario?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              El colaborador{' '}
              <span className="font-semibold text-foreground">{selectedUser?.name}</span> perderá
              el acceso al sistema inmediatamente. Podrás reactivarlo en cualquier momento.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting} className="text-xs">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateConfirm}
              disabled={submitting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 text-xs"
            >
              {submitting ? 'Desactivando...' : 'Desactivar Usuario'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
