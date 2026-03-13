/**
 * Sistema de logging de errores
 * Registra errores en consola y puede enviarlos a servicios externos (Sentry, LogRocket, etc.)
 */

interface ErrorContext {
  componentStack?: string;
  type?: string;
  userId?: string;
  url?: string;
  userAgent?: string;
  timestamp?: string;
  [key: string]: any;
}

interface ErrorLog {
  message: string;
  stack?: string;
  context: ErrorContext;
  timestamp: string;
  severity: 'error' | 'warning' | 'info';
}

// Cola de errores en memoria (últimos 50)
const errorQueue: ErrorLog[] = [];
const MAX_ERROR_QUEUE = 50;

/**
 * Registra un error con contexto adicional
 */
export function logError(
  error: Error | string,
  context: ErrorContext = {},
  severity: 'error' | 'warning' | 'info' = 'error'
): void {
  const errorMessage = typeof error === 'string' ? error : error.message;
  const errorStack = typeof error === 'string' ? undefined : error.stack;

  const errorLog: ErrorLog = {
    message: errorMessage,
    stack: errorStack,
    context: {
      ...context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
    severity,
  };

  // Agregar a la cola
  errorQueue.push(errorLog);
  if (errorQueue.length > MAX_ERROR_QUEUE) {
    errorQueue.shift(); // Remover el más antiguo
  }

  // Log en consola
  if (severity === 'error') {
    console.error('🔴 Error capturado:', {
      message: errorMessage,
      context: errorLog.context,
      stack: errorStack,
    });
  } else if (severity === 'warning') {
    console.warn('🟡 Warning capturado:', {
      message: errorMessage,
      context: errorLog.context,
    });
  } else {
    console.info('🔵 Info:', {
      message: errorMessage,
      context: errorLog.context,
    });
  }

  // Enviar a servicio externo (si está configurado)
  sendToExternalService(errorLog);

  // Guardar en localStorage para debugging (solo últimos 10)
  saveToLocalStorage(errorLog);
}

/**
 * Envía el error a un servicio externo (Sentry, LogRocket, etc.)
 */
function sendToExternalService(_errorLog: ErrorLog): void {
  // TODO: Integrar con Sentry cuando esté disponible
  // if (window.Sentry) {
  //   window.Sentry.captureException(new Error(errorLog.message), {
  //     contexts: {
  //       custom: errorLog.context,
  //     },
  //     level: errorLog.severity,
  //   });
  // }

  // Por ahora, solo verificamos si estamos en producción
  if (import.meta.env.PROD) {
    // En producción, podrías enviar a tu propio endpoint
    // fetch('/api/logs/error', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(errorLog),
    // }).catch(() => {
    //   // Silenciar errores de logging para no crear loops
    // });
  }
}

/**
 * Guarda errores en localStorage para debugging
 */
function saveToLocalStorage(errorLog: ErrorLog): void {
  try {
    const key = 'app_error_logs';
    const existing = localStorage.getItem(key);
    const logs: ErrorLog[] = existing ? JSON.parse(existing) : [];
    
    logs.push(errorLog);
    
    // Mantener solo los últimos 10
    if (logs.length > 10) {
      logs.shift();
    }
    
    localStorage.setItem(key, JSON.stringify(logs));
  } catch (e) {
    // Ignorar errores de localStorage (quota excedida, etc.)
    console.warn('No se pudo guardar error en localStorage:', e);
  }
}

/**
 * Obtiene todos los errores registrados
 */
export function getErrorLogs(): ErrorLog[] {
  return [...errorQueue];
}

/**
 * Obtiene errores de localStorage
 */
export function getErrorLogsFromStorage(): ErrorLog[] {
  try {
    const key = 'app_error_logs';
    const existing = localStorage.getItem(key);
    return existing ? JSON.parse(existing) : [];
  } catch (e) {
    return [];
  }
}

/**
 * Limpia todos los logs
 */
export function clearErrorLogs(): void {
  errorQueue.length = 0;
  try {
    localStorage.removeItem('app_error_logs');
  } catch (e) {
    // Ignorar
  }
}

/**
 * Helper para capturar errores de promesas no manejadas
 */
export function setupGlobalErrorHandlers(): void {
  // Capturar errores no manejados
  window.addEventListener('error', (event) => {
    logError(event.error || event.message, {
      type: 'Uncaught Error',
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
  });

  // Capturar promesas rechazadas no manejadas
  window.addEventListener('unhandledrejection', (event) => {
    logError(
      event.reason instanceof Error ? event.reason : String(event.reason),
      {
        type: 'Unhandled Promise Rejection',
      }
    );
  });

  // Log cuando el usuario sale de la página con errores
  window.addEventListener('beforeunload', () => {
    const errors = getErrorLogs();
    if (errors.length > 0 && import.meta.env.DEV) {
      console.log(`Saliendo de la página con ${errors.length} errores registrados`);
    }
  });
}

/**
 * Helper para capturar errores de API
 */
export function logApiError(
  error: any,
  endpoint: string,
  method: string = 'GET'
): void {
  const message = error.response?.data?.message || error.message || 'Error de API desconocido';
  
  logError(message, {
    type: 'API Error',
    endpoint,
    method,
    statusCode: error.response?.status,
    statusText: error.response?.statusText,
    responseData: error.response?.data,
  });
}

/**
 * Helper para medir performance
 */
export function logPerformance(label: string, duration: number): void {
  if (duration > 3000) { // Más de 3 segundos
    logError(`Operación lenta: ${label}`, {
      type: 'Performance',
      duration: `${duration}ms`,
    }, 'warning');
  }
}

/**
 * Crear un wrapper para async functions con manejo de errores
 */
export function withErrorLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  context: string
): T {
  return (async (...args: any[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, {
        type: 'Async Function Error',
        functionContext: context,
        args: JSON.stringify(args).slice(0, 200), // Limitar tamaño
      });
      throw error; // Re-lanzar para que el caller lo maneje
    }
  }) as T;
}

// Exportar tipos para uso externo
export type { ErrorLog, ErrorContext };
