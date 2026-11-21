import { Component } from 'react';
import { Button } from './ui/button';

/**
 * ErrorBoundary global (A-04).
 * Captura errores de render de cualquier hijo y muestra una UI de recuperación.
 * console.error registra el error para debugging sin exponer datos sensibles.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8 text-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <svg
              className="w-10 h-10 text-destructive"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3m0 3h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-foreground">Algo salió mal 😕</h2>
            <p className="text-sm text-muted-foreground max-w-sm">
              Ocurrió un error inesperado. Puedes intentar recargar la página.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="mt-2"
          >
            Recargar página
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
