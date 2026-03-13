import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { logError } from '../utils/errorLogger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary para capturar errores de React y mostrar UI de fallback
 * 
 * Uso:
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 * 
 * Con fallback personalizado:
 * <ErrorBoundary fallback={<CustomError />}>
 *   <Component />
 * </ErrorBoundary>
 * 
 * Con callback de error:
 * <ErrorBoundary onError={(error, info) => console.error(error)}>
 *   <Component />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Actualizar estado para mostrar UI de fallback
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Guardar información del error en el estado
    this.setState({
      error,
      errorInfo,
    });

    // Log del error (consola + servicio externo si está configurado)
    logError(error, {
      componentStack: errorInfo.componentStack ?? undefined,
      type: 'React Error Boundary',
    });

    // Callback personalizado si se provee
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset del error boundary cuando cambian las resetKeys
    if (
      this.state.hasError &&
      this.props.resetKeys &&
      prevProps.resetKeys &&
      !this.arraysEqual(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.resetErrorBoundary();
    }
  }

  arraysEqual(a: Array<string | number>, b: Array<string | number>): boolean {
    if (a.length !== b.length) return false;
    return a.every((val, index) => val === b[index]);
  }

  resetErrorBoundary = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Si hay fallback personalizado, usarlo
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback por defecto
      return (
        <ErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          resetErrorBoundary={this.resetErrorBoundary}
        />
      );
    }

    return this.props.children;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE DE FALLBACK POR DEFECTO
// ══════════════════════════════════════════════════════════════════════════════

interface ErrorFallbackProps {
  error: Error | null;
  errorInfo: ErrorInfo | null;
  resetErrorBoundary: () => void;
}

function ErrorFallback({ error, errorInfo, resetErrorBoundary }: ErrorFallbackProps) {
  const isDev = import.meta.env.DEV;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold">Algo salió mal</h1>
              <p className="text-red-100 text-sm mt-1">
                Lo sentimos, ocurrió un error inesperado
              </p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Mensaje amigable */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <div>
                <p className="text-sm text-blue-900 font-medium">¿Qué puedes hacer?</p>
                <ul className="text-sm text-blue-800 mt-2 space-y-1 list-disc list-inside">
                  <li>Recargar la página e intentar nuevamente</li>
                  <li>Limpiar el caché del navegador</li>
                  <li>Si el problema persiste, contacta a soporte</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Detalles del error (solo en desarrollo) */}
          {isDev && error && (
            <details className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <summary className="cursor-pointer text-sm font-semibold text-gray-700 hover:text-gray-900">
                Detalles técnicos (solo visible en desarrollo)
              </summary>
              <div className="mt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">Error:</p>
                  <pre className="bg-red-50 border border-red-200 rounded p-2 text-xs text-red-900 overflow-x-auto">
                    {error.toString()}
                  </pre>
                </div>
                {error.stack && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Stack trace:</p>
                    <pre className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-800 overflow-x-auto max-h-48 overflow-y-auto">
                      {error.stack}
                    </pre>
                  </div>
                )}
                {errorInfo?.componentStack && (
                  <div>
                    <p className="text-xs font-semibold text-gray-600 mb-1">Component stack:</p>
                    <pre className="bg-gray-100 border border-gray-300 rounded p-2 text-xs text-gray-800 overflow-x-auto max-h-48 overflow-y-auto">
                      {errorInfo.componentStack}
                    </pre>
                  </div>
                )}
              </div>
            </details>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              onClick={resetErrorBoundary}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Intentar de nuevo
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Ir al inicio
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            Si el problema persiste, por favor contacta a soporte técnico
          </p>
        </div>
      </div>
    </div>
  );
}

export default ErrorBoundary;
