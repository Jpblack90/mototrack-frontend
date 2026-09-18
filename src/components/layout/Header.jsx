import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
      {/* Botón hamburguesa — solo visible en móvil */}
      <button
        className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100"
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Usuario + logout */}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 font-medium">
          👤 {user?.name}
        </span>
        <button
          onClick={handleLogout}
          className="text-sm px-3 py-1.5 rounded-md bg-red-50 text-red-600 hover:bg-red-100 font-medium transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
