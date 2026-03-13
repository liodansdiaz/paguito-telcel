import { useRouteError, isRouteErrorResponse, useNavigate } from 'react-router-dom';

/**
 * Error Boundary específico para errores de React Router
 * Se usa en la configuración de rutas
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();

  let errorMessage: string;
  let errorStatus: number | undefined;

  if (isRouteErrorResponse(error)) {
    // Error de respuesta HTTP (404, 500, etc.)
    errorStatus = error.status;
    errorMessage = error.statusText || error.data?.message || 'Error desconocido';
  } else if (error instanceof Error) {
    // Error de JavaScript
    errorMessage = error.message;
  } else {
    // Error desconocido
    errorMessage = 'Ha ocurrido un error inesperado';
  }

  // Casos específicos
  const is404 = errorStatus === 404;
  const is403 = errorStatus === 403;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {/* Icono */}
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          {is404 ? (
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M12 12h.01M12 12h.01M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          ) : is403 ? (
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          ) : (
            <svg className="w-10 h-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          )}
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {is404 ? '404 - Página no encontrada' : is403 ? 'Acceso denegado' : 'Error'}
        </h1>

        {/* Mensaje */}
        <p className="text-gray-600 mb-6">
          {is404
            ? 'La página que buscas no existe o fue movida'
            : is403
            ? 'No tienes permisos para acceder a esta página'
            : errorMessage}
        </p>

        {/* Acciones */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => navigate(-1)}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Volver atrás
          </button>
          <button
            onClick={() => navigate('/')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            Ir al inicio
          </button>
        </div>

        {/* Detalles en desarrollo */}
        {import.meta.env.DEV && !is404 && !is403 && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Detalles técnicos
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded overflow-x-auto">
              {JSON.stringify(error, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}

export default RouteErrorBoundary;
