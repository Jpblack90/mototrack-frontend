import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Card,
  CardHeader,
  CardDescription,
  CardContent,
} from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

function defaultRouteFor(role) {
  if (role === 'admin')    return '/dashboard';
  if (role === 'cajero')   return '/sales';
  if (role === 'mecanico') return '/workorders';
  return '/dashboard';
}

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (password === '123') {
      toast.error('Error de credenciales. Correo o contraseña incorrectos.');
      setLoading(false);
      return;
    }
    try {
      const user = await login(email, password);
      toast.success(`¡Bienvenido, ${user?.name || 'Usuario'}!`);
      navigate(defaultRouteFor(user.role), { replace: true });
    } catch (err) {
      // Muestra el mensaje exacto del backend con Sonner toast
      const errorMsg =
        err.response?.data?.error?.message ??
        'Error de conexión. Verifica que el servidor esté activo.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-sm border-border bg-card">
        {/* Logo / Cabecera */}
        <CardHeader className="text-center pb-6">
          <div className="flex items-center justify-center">
            <img
              src="/logo.png"
              alt="MotoTrack"
              className="w-56 h-auto mx-auto object-contain mb-4"
            />
          </div>
          <CardDescription className="text-xs text-muted-foreground">
            Inicia sesión para continuar en el sistema
          </CardDescription>
        </CardHeader>

        {/* Formulario */}
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-medium text-foreground">
                Correo electrónico
              </Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@mototrack.local"
                className="h-9 text-sm"
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-xs font-medium text-foreground">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-9 text-sm"
                autoComplete="current-password"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-9 font-medium text-sm mt-2 transition-colors duration-150"
            >
              {loading ? 'Iniciando sesión…' : 'Iniciar sesión'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
