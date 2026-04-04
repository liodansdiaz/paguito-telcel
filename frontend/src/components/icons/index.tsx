/**
 * ════════════════════════════════════════════════════════════════════════════
 * BIBLIOTECA DE ICONOS - Paguito Telcel
 * ════════════════════════════════════════════════════════════════════════════
 * Iconos SVG reutilizables para todo el proyecto.
 * Uso: import { IconName } from '@/components/icons';
 * 
 * Cada icon acepta props de clase para customizacion:
 * <IconCart className="w-5 h-5 text-primary-500" />
 * ════════════════════════════════════════════════════════════════════════════
 */

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

// ════════════════════════════════════════════════════════════════════════════
// ICONOS DE UI COMUNES
// ════════════════════════════════════════════════════════════════════════════

/** Carrito de compras */
export const IconCart = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

/** Ojo abierto */
export const IconEye = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

/** Ojo cerrado */
export const IconEyeOff = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

/** Cerrar (X) */
export const IconX = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

/** Menu hamburguesa */
export const IconMenu = ({ className = "w-6 h-6", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="3" y1="12" x2="21" y2="12" />
    <line x1="3" y1="6" x2="21" y2="6" />
    <line x1="3" y1="18" x2="21" y2="18" />
  </svg>
);

/** Chevron hacia abajo */
export const IconChevronDown = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

/** Chevron hacia la derecha */
export const IconChevronRight = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

/** Chevron hacia la izquierda */
export const IconChevronLeft = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="15 18 9 12 15 6" />
  </svg>
);

/** Filtro */
export const IconFilter = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);

/** Busqueda */
export const IconSearch = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

/** Loading / Spinner */
export const IconSpinner = ({ className = "w-5 h-5 animate-spin", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle className="opacity-25" cx="12" cy="12" r="10" />
    <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// ICONOS DE NAVEGACION
// ════════════════════════════════════════════════════════════════════════════

/** Inicio / Home */
export const IconHome = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M3 12l2-2m0 0l7-7 7 7m-9 5v6h4v-6m-4 0H9m6 0h-2" />
  </svg>
);

/** Usuario */
export const IconUser = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

/** Cerrar sesion */
export const IconLogout = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

/** Login / Ingresar */
export const IconLogin = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// ICONOS DE ESTADO Y ACCION
// ════════════════════════════════════════════════════════════════════════════

/** Check / Exito */
export const IconCheck = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

/** Error / Advertencia */
export const IconAlertCircle = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

/** Informacion */
export const IconInfo = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <line x1="12" y1="16" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12.01" y2="8" />
  </svg>
);

/** Editar */
export const IconEdit = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

/** Eliminar / Basura */
export const IconTrash = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </svg>
);

/** Descargar */
export const IconDownload = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/** Subir / Upload */
export const IconUpload = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="17 8 12 3 7 8" />
    <line x1="12" y1="3" x2="12" y2="15" />
  </svg>
);

/** Agregar / Plus */
export const IconPlus = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// ICONOS DE ADMINISTRACION
// ════════════════════════════════════════════════════════════════════════════

/** Dashboard */
export const IconDashboard = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="3" width="7" height="9" />
    <rect x="14" y="3" width="7" height="5" />
    <rect x="14" y="12" width="7" height="9" />
    <rect x="3" y="16" width="7" height="5" />
  </svg>
);

/** Lista / Menu */
export const IconList = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

/** Inventario / Caja */
export const IconPackage = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
    <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
    <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
    <line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

/** Configuracion / Engranaje */
export const IconSettings = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

/** Personas / Grupo */
export const IconUsers = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

/** Vendedor */
export const IconUserCheck = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="8.5" cy="7" r="4" />
    <polyline points="17 11 19 13 23 9" />
  </svg>
);

/** Resenna / Documento */
export const IconClipboard = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
  </svg>
);

/** Ubicacion */
export const IconMapPin = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

/** Telefono */
export const IconPhone = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

/** Email / Correo */
export const IconMail = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

/** Calendario */
export const IconCalendar = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

/** Reloj */
export const IconClock = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

/** Toggle On */
export const IconToggleOn = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="1" y="5" width="22" height="14" rx="7" />
    <circle cx="16" cy="12" r="3" fill="currentColor" />
  </svg>
);

/** Toggle Off */
export const IconToggleOff = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <rect x="1" y="5" width="22" height="14" rx="7" />
    <circle cx="8" cy="12" r="3" fill="currentColor" />
  </svg>
);

/** Exportar / Excel */
export const IconFileExcel = ({ className = "w-5 h-5", ...props }: IconProps) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} {...props}>
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="16" y2="17" />
  </svg>
);

// ════════════════════════════════════════════════════════════════════════════
// EXPORT DEFAULT
// ════════════════════════════════════════════════════════════════════════════

/** Objeto con todos los iconos para acceso dinamico */
export const icons = {
  cart: IconCart,
  eye: IconEye,
  eyeOff: IconEyeOff,
  x: IconX,
  menu: IconMenu,
  chevronDown: IconChevronDown,
  chevronRight: IconChevronRight,
  chevronLeft: IconChevronLeft,
  filter: IconFilter,
  search: IconSearch,
  spinner: IconSpinner,
  home: IconHome,
  user: IconUser,
  logout: IconLogout,
  login: IconLogin,
  check: IconCheck,
  alertCircle: IconAlertCircle,
  info: IconInfo,
  edit: IconEdit,
  trash: IconTrash,
  download: IconDownload,
  upload: IconUpload,
  plus: IconPlus,
  dashboard: IconDashboard,
  list: IconList,
  package: IconPackage,
  settings: IconSettings,
  users: IconUsers,
  userCheck: IconUserCheck,
  clipboard: IconClipboard,
  mapPin: IconMapPin,
  phone: IconPhone,
  mail: IconMail,
  calendar: IconCalendar,
  clock: IconClock,
  toggleOn: IconToggleOn,
  toggleOff: IconToggleOff,
  fileExcel: IconFileExcel,
};

export default icons;
