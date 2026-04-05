export type Rol = 'ADMIN' | 'VENDEDOR';
export type EstadoCliente = 'ACTIVO' | 'BLOQUEADO';
export type EstadoReserva = 'NUEVA' | 'ASIGNADA' | 'EN_VISITA' | 'PARCIAL' | 'COMPLETADA' | 'CANCELADA' | 'SIN_STOCK';
export type EstadoReservaItem = 'PENDIENTE' | 'EN_PROCESO' | 'VENDIDO' | 'NO_CONCRETADO' | 'CANCELADO' | 'SIN_STOCK';
export type TipoPago = 'CONTADO' | 'CREDITO';

export interface User {
  id: string;
  nombre: string;
  email: string;
  rol: Rol;
  zona?: string;
  telefono?: string;
  isActive: boolean;
  lastAssignedAt?: string;
  createdAt: string;
  _count?: { reservations: number };
}

export interface Product {
  id: string;
  sku: string;
  nombre: string;
  marca: string;
  descripcion?: string;
  precio: number;
  precioAnterior?: number;
  stock: number;
  stockMinimo: number;
  isActive: boolean;
  imagenes: string[];
  imagenesColores: string[];
  colores: string[];
  memorias: string[];
  badge?: string;
  disponibleCredito: boolean;
  pagosSemanales?: string; // Deprecated
  enganche?: string; // Ej: "Enganche desde $300 a $800"
  pagoSemanal?: string; // Ej: "Desde $150 a $240/semana"
  especificaciones?: Record<string, string>;
  // Mapeo opcional de color a imágenes específicas (para futuro backend)
  colorImagenes?: Record<string, string[]>;
  createdAt: string;
}

export interface Customer {
  id: string;
  nombreCompleto: string;
  telefono: string;
  curp: string;
  email?: string;
  direccion?: string;
  estado: EstadoCliente;
  createdAt: string;
  _count?: { reservations: number };
  reservations?: Reservation[];
}

export interface ReservationItem {
  id: string;
  reservationId: string;
  productId: string;
  color?: string;
  memoria?: string;
  tipoPago: TipoPago;
  estado: 'PENDIENTE' | 'EN_PROCESO' | 'VENDIDO' | 'NO_CONCRETADO' | 'CANCELADO' | 'SIN_STOCK';
  precioCapturado: number;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  product?: Pick<Product, 'id' | 'nombre' | 'marca' | 'precio' | 'imagenes' | 'stock'>;
}

export interface Reservation {
  id: string;
  customerId: string;
  vendorId?: string;
  nombreCompleto: string;
  telefono: string;
  curp: string;
  direccion: string;
  fechaPreferida: string;
  horarioPreferido: string;
  latitude: number | null;
  longitude: number | null;
  estado: EstadoReserva;
  estadoDetalle?: {
    total: number;
    pendientes: number;
    enProceso?: number;
    vendidos: number;
    noConcretados?: number;
    cancelados: number;
    sinStock?: number;
  };
  notas?: string;
  createdAt: string;
  updatedAt: string;
  items: ReservationItem[];
  customer?: Pick<Customer, 'id' | 'nombreCompleto' | 'telefono' | 'curp' | 'estado'>;
  vendor?: Pick<User, 'id' | 'nombre' | 'email' | 'telefono' | 'zona'>;
  
  // Deprecated fields (for backwards compatibility)
  productId?: string;
  tipoPago?: TipoPago;
  product?: Pick<Product, 'id' | 'nombre' | 'marca' | 'precio' | 'imagenes'>;
}

export interface AdminMetrics {
  reservasHoy: number;
  reservasSemana: number;
  reservasMes: number;
  activas: number;
  completadas: number;
  canceladas: number;
  sinStock: number;
  vendedoresActivos: number;
  vendedoresInactivos: number;
  totalClientes: number;
}

export interface VendorMetrics {
  asignadas: number;
  activas: number;
  completadas: number;
  pendientesHoy: number;
}

export interface ChartDataPoint {
  date: string;
  count: number;
}

export interface StatusDistribution {
  estado: EstadoReserva;
  count: number;
}

export interface VendorRanking {
  id: string;
  nombre: string;
  zona?: string;
  isActive: boolean;
  totalAsignadas: number;
  totalVendidas: number;
}

export interface MapReservation {
  id: string;
  nombreCompleto: string;
  fechaPreferida: string;
  horarioPreferido: string;
  estado: EstadoReserva;
  latitude: number | null;
  longitude: number | null;
  direccion: string;
  product?: { nombre: string };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuthState {
  user: Pick<User, 'id' | 'nombre' | 'email' | 'rol' | 'zona'> | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}
