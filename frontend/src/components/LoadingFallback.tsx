/**
 * Componente de loading para usar con React Suspense
 */
export function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        {/* Spinner */}
        <div className="inline-block">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
        
        {/* Texto */}
        <p className="mt-4 text-gray-600 font-medium">Cargando...</p>
      </div>
    </div>
  );
}

/**
 * Loading inline para secciones pequeñas
 */
export function LoadingInline() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        <span className="text-sm text-gray-600">Cargando...</span>
      </div>
    </div>
  );
}

/**
 * Loading con mensaje personalizado
 */
export function LoadingWithMessage({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="text-center">
        <div className="inline-block w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        {message && (
          <p className="mt-3 text-sm text-gray-600">{message}</p>
        )}
      </div>
    </div>
  );
}

export default LoadingFallback;
