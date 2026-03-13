import toast from 'react-hot-toast';

/**
 * Utilidades para mostrar notificaciones toast
 * Reemplaza el uso de alert() nativo con notificaciones elegantes
 */

interface ToastOptions {
  duration?: number;
  position?: 'top-center' | 'top-right' | 'bottom-center' | 'bottom-right';
}

const defaultOptions: ToastOptions = {
  duration: 4000,
  position: 'top-right',
};

/**
 * Muestra una notificación de éxito
 */
export const showSuccess = (message: string, options?: ToastOptions) => {
  toast.success(message, {
    ...defaultOptions,
    ...options,
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#10b981',
    },
  });
};

/**
 * Muestra una notificación de error
 */
export const showError = (message: string, options?: ToastOptions) => {
  toast.error(message, {
    ...defaultOptions,
    ...options,
    duration: 5000, // Errores se muestran más tiempo
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
    iconTheme: {
      primary: '#fff',
      secondary: '#ef4444',
    },
  });
};

/**
 * Muestra una notificación de información
 */
export const showInfo = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...defaultOptions,
    ...options,
    icon: 'ℹ️',
    style: {
      background: '#3b82f6',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Muestra una notificación de advertencia
 */
export const showWarning = (message: string, options?: ToastOptions) => {
  toast(message, {
    ...defaultOptions,
    ...options,
    icon: '⚠️',
    style: {
      background: '#f59e0b',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Muestra una notificación con carga (loading)
 * Retorna un ID que puede usarse para actualizar o cerrar el toast
 */
export const showLoading = (message: string) => {
  return toast.loading(message, {
    style: {
      background: '#6366f1',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Actualiza un toast existente a éxito
 */
export const updateToSuccess = (toastId: string, message: string) => {
  toast.success(message, {
    id: toastId,
    style: {
      background: '#10b981',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Actualiza un toast existente a error
 */
export const updateToError = (toastId: string, message: string) => {
  toast.error(message, {
    id: toastId,
    style: {
      background: '#ef4444',
      color: '#fff',
      padding: '16px',
      borderRadius: '8px',
    },
  });
};

/**
 * Cierra un toast específico
 */
export const dismissToast = (toastId: string) => {
  toast.dismiss(toastId);
};

/**
 * Cierra todos los toasts
 */
export const dismissAllToasts = () => {
  toast.dismiss();
};

/**
 * Muestra una notificación de promesa
 * Útil para operaciones asíncronas
 */
export const showPromise = <T,>(
  promise: Promise<T>,
  messages: {
    loading: string;
    success: string;
    error: string;
  }
) => {
  return toast.promise(
    promise,
    {
      loading: messages.loading,
      success: messages.success,
      error: messages.error,
    },
    {
      style: {
        padding: '16px',
        borderRadius: '8px',
      },
      success: {
        style: {
          background: '#10b981',
          color: '#fff',
        },
      },
      error: {
        style: {
          background: '#ef4444',
          color: '#fff',
        },
      },
    }
  );
};
