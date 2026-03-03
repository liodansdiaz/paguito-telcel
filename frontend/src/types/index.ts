export type Rol = 'ADMIN' | 'VENDEDOR';
export type EstadoCliente = 'ACTIVO' | 'BLOQUEADO';
export type EstadoReserva = 'NUEVA' | 'ASIGNADA' | 'EN_VISITA' | 'VENDIDA' | 'NO_CONCRETADA' | 'CANCELADA' | 'SIN_STOCK';
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
  badge?: string;
  disponibleCredito: boolean;
  pagosSemanales?: number;
  especificaciones?: Record<string, string>;
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

export interface Reservation {
  id: string;
  customerId: string;
  productId: string;
  vendorId?: string;
  nombreCompleto: string;
  telefono: string;
  curp: string;
  tipoPago: TipoPago;
  direccion: string;
  fechaPreferida: string;
  horarioPreferido: string;
  latitude: number;
  longitude: number;
  estado: EstadoReserva;
  notas?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Pick<Customer, 'id' | 'nombreCompleto' | 'telefono' | 'curp' | 'estado'>;
  product?: Pick<Product, 'id' | 'nombre' | 'marca' | 'precio' | 'imagenes'>;
  vendor?: Pick<User, 'id' | 'nombre' | 'email' | 'telefono' | 'zona'>;
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
  latitude: number;
  longitude: number;
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
