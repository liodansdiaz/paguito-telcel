import api from './api';

// Tipo genérico para respuestas del backend que usan sendSuccess()
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// Tipos para la configuración del sistema
export interface NotificacionesConfig {
  whatsappCliente: boolean;
  whatsappVendedor: boolean;
}

export interface ResumenConfig {
  habilitado: boolean;
  frecuencia: 'diario' | 'cada_2_dias' | 'semanal';
  hora: string;
  diaSemana: number;
  adminIds: string[];
}

export interface SystemConfig {
  clave: string;
  valor: string;
}

export interface AdminUser {
  id: string;
  nombre: string;
  email: string;
  rol: 'ADMIN' | 'VENDEDOR';
  isActive: boolean;
}

// API para configuraciones del sistema
export const systemConfigApi = {
  // Obtener todas las configuraciones
  getAll: () => api.get<ApiResponse<SystemConfig[]>>('/admin/config'),

  // Obtener configuración por clave
  getByClave: (clave: string) => api.get<ApiResponse<SystemConfig>>(`/admin/config/clave/${clave}`),

  // Actualizar una configuración
  update: (data: { clave: string; valor: string }) =>
    api.put<ApiResponse<SystemConfig>>('/admin/config', data),

  // Actualizar múltiples configuraciones
  bulkUpdate: (configs: Array<{ clave: string; valor: string }>) =>
    api.put<ApiResponse<SystemConfig[]>>('/admin/config/bulk', configs),

  // Configuración de notificaciones
  getNotificaciones: () =>
    api.get<ApiResponse<NotificacionesConfig>>('/admin/config/notificaciones'),

  updateNotificaciones: (data: Partial<NotificacionesConfig>) =>
    api.patch<ApiResponse<NotificacionesConfig>>('/admin/config/notificaciones', data),

  // Configuración del resumen diario
  getResumen: () => api.get<ApiResponse<ResumenConfig>>('/admin/config/resumen'),

  updateResumen: (data: Partial<ResumenConfig>) =>
    api.patch<ApiResponse<ResumenConfig>>('/admin/config/resumen', data),
};

// API para usuarios admin
export const adminUsersApi = {
  getAll: () => api.get<ApiResponse<AdminUser[]>>('/admin/users', { params: { rol: 'ADMIN', limit: 100 } }),
};
