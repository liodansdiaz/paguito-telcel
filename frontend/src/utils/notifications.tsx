import toast from 'react-hot-toast';

/**
 * Toast styling consistente para toda la aplicación
 */

const baseStyle: React.CSSProperties = {
  background: '#fff',
  color: '#1f2937',
  padding: '12px 16px',
  borderRadius: '12px',
  border: '1px solid #e5e7eb',
  boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  fontSize: '14px',
  maxWidth: '420px',
  display: 'flex',
  alignItems: 'flex-start',
  gap: '10px',
};

type ToastType = 'success' | 'error' | 'warning' | 'info';

const config: Record<ToastType, { bg: string; color: string; icon: string; duration: number }> = {
  success: { bg: '#f0fdf4', color: '#16a34a', icon: '✓', duration: 3500 },
  error:   { bg: '#fef2f2', color: '#dc2626', icon: '✕', duration: 5000 },
  warning: { bg: '#fffbeb', color: '#d97706', icon: '!', duration: 4000 },
  info:    { bg: '#eff6ff', color: '#2563eb', icon: 'i', duration: 3500 },
};

const render = (message: string, type: ToastType) => {
  const c = config[type];
  return toast.custom(
    (t) => (
      <div
        style={{ ...baseStyle, background: c.bg }}
        className={t.visible ? 'animate-enter' : 'animate-leave'}
      >
        <span
          style={{
            width: 22, height: 22, borderRadius: '50%',
            background: c.color, color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 1,
          }}
        >
          {c.icon}
        </span>
        <p style={{ margin: 0, lineHeight: 1.4 }}>{message}</p>
        <button
          onClick={() => toast.dismiss(t.id)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#9ca3af', padding: 0, marginLeft: 8, flexShrink: 0,
            fontSize: 16, lineHeight: 1,
          }}
        >
          ×
        </button>
      </div>
    ),
    { duration: c.duration }
  );
};

export const showSuccess = (message: string) => render(message, 'success');
export const showError = (message: string) => render(message, 'error');
export const showWarning = (message: string) => render(message, 'warning');
export const showInfo = (message: string) => render(message, 'info');

export const dismissToast = (id: string) => toast.dismiss(id);
export const dismissAll = () => toast.dismiss();

// Re-export original toast para uso avanzado (toasts custom con JSX)
export { default as toast } from 'react-hot-toast';
