import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Item del carrito ANTES de confirmar la reserva
 * Cada item representa un producto que el cliente quiere reservar
 */
export interface CarritoItem {
  // Identificación única temporal (usado para eliminar del carrito)
  tempId: string;
  
  // Datos del producto
  productId: string;
  nombre: string;
  marca: string;
  precio: number;
  imagen?: string;
  
  // Opciones seleccionadas
  color?: string;
  memoria?: string;
  tipoPago: 'CONTADO' | 'CREDITO';
  
  // Metadata
  addedAt: string; // ISO timestamp
}

/**
 * Reserva confirmada (para mostrar en "Mis Reservas")
 */
export interface ReservaConfirmada {
  id: string;           // UUID de la reserva
  folio: string;        // Primeros 8 chars del UUID
  nombreCompleto: string;
  telefono: string;
  curp: string;
  estado: string;
  items: Array<{
    id: string;
    producto: string;
    marca: string;
    imagen?: string;
    tipoPago: 'CONTADO' | 'CREDITO';
    estado: string;
    precioCapturado: number;
    color?: string;
    memoria?: string;
  }>;
  fechaPreferida: string;
  horarioPreferido: string;
  createdAt: string;
}

interface CarritoState {
  // Carrito de compras (productos NO confirmados)
  items: CarritoItem[];
  
  // Reservas confirmadas (para consulta local)
  reservasConfirmadas: ReservaConfirmada[];
  
  // ── Métodos del carrito ──────────────────────────────────────────────────
  
  /**
   * Agregar producto al carrito
   */
  agregarAlCarrito: (item: Omit<CarritoItem, 'tempId' | 'addedAt'>) => void;
  
  /**
   * Eliminar producto del carrito (antes de confirmar)
   */
  eliminarDelCarrito: (tempId: string) => void;
  
  /**
   * Actualizar tipo de pago de un item
   */
  cambiarTipoPago: (tempId: string, tipoPago: 'CONTADO' | 'CREDITO') => void;
  
  /**
   * Vaciar el carrito completamente
   */
  vaciarCarrito: () => void;
  
  /**
   * Obtener cantidad total de productos en el carrito
   */
  getCantidadTotal: () => number;
  
  /**
   * Obtener total en pesos del carrito
   */
  getTotalPrecio: () => number;
  
  /**
   * Verificar si hay productos a crédito en el carrito
   */
  tieneProductosCredito: () => boolean;
  
  /**
   * Contar productos a crédito en el carrito
   */
  contarProductosCredito: () => number;
  
  // ── Métodos de reservas confirmadas ──────────────────────────────────────
  
  /**
   * Guardar una reserva confirmada (después de que el backend la creó)
   */
  guardarReservaConfirmada: (reserva: ReservaConfirmada) => void;
  
  /**
   * Obtener reserva confirmada por folio o CURP
   */
  buscarReservaConfirmada: (busqueda: string) => ReservaConfirmada | undefined;
  
  /**
   * Eliminar reserva confirmada del store local
   */
  eliminarReservaConfirmada: (reservaId: string) => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set, get) => ({
      items: [],
      reservasConfirmadas: [],
      
      // ── Implementación de métodos del carrito ────────────────────────────
      
      agregarAlCarrito: (item) =>
        set((state) => {
          // Generar ID temporal único
          const tempId = `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
          
          const nuevoItem: CarritoItem = {
            ...item,
            tempId,
            addedAt: new Date().toISOString(),
          };
          
          return { items: [...state.items, nuevoItem] };
        }),
      
      eliminarDelCarrito: (tempId) =>
        set((state) => ({
          items: state.items.filter((item) => item.tempId !== tempId),
        })),
      
      cambiarTipoPago: (tempId, tipoPago) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.tempId === tempId ? { ...item, tipoPago } : item
          ),
        })),
      
      vaciarCarrito: () => set({ items: [] }),
      
      getCantidadTotal: () => get().items.length,
      
      getTotalPrecio: () => {
        return get().items.reduce((total, item) => total + item.precio, 0);
      },
      
      tieneProductosCredito: () => {
        return get().items.some((item) => item.tipoPago === 'CREDITO');
      },
      
      contarProductosCredito: () => {
        return get().items.filter((item) => item.tipoPago === 'CREDITO').length;
      },
      
      // ── Implementación de métodos de reservas confirmadas ────────────────
      
      guardarReservaConfirmada: (reserva) =>
        set((state) => {
          // Evitar duplicados
          const yaExiste = state.reservasConfirmadas.some((r) => r.id === reserva.id);
          if (yaExiste) return state;
          
          // Limitar a últimas 10 reservas (para no saturar localStorage)
          const nuevasReservas = [reserva, ...state.reservasConfirmadas].slice(0, 10);
          
          return { reservasConfirmadas: nuevasReservas };
        }),
      
      buscarReservaConfirmada: (busqueda) => {
        const upper = busqueda.toUpperCase().trim();
        return get().reservasConfirmadas.find(
          (r) =>
            r.id === upper ||
            r.folio === upper ||
            r.curp === upper ||
            r.id.startsWith(upper.toLowerCase())
        );
      },
      
      eliminarReservaConfirmada: (reservaId) =>
        set((state) => ({
          reservasConfirmadas: state.reservasConfirmadas.filter((r) => r.id !== reservaId),
        })),
    }),
    {
      name: 'paguito-carrito',
      // Solo persistir el carrito, no las reservas confirmadas (esas se consultan del backend)
      partialize: (state) => ({ items: state.items }),
    }
  )
);
