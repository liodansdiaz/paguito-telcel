import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CarritoItem {
  folio: string;       // primeros 8 chars del UUID en mayúsculas
  producto: string;    // nombre del producto
  marca: string;
  tipoPago: 'CONTADO' | 'CREDITO';
  fecha: string;       // fechaPreferida ISO
  horario: string;
  imagen?: string;     // primera imagen del producto (ruta relativa)
  createdAt: string;   // ISO string
}

interface CarritoState {
  items: CarritoItem[];
  agregar: (item: CarritoItem) => void;
  eliminar: (folio: string) => void;
  limpiar: () => void;
}

export const useCarritoStore = create<CarritoState>()(
  persist(
    (set) => ({
      items: [],
      agregar: (item) =>
        set((state) => {
          // Evitar duplicados por folio
          if (state.items.find((i) => i.folio === item.folio)) return state;
          return { items: [...state.items, item] };
        }),
      eliminar: (folio) =>
        set((state) => ({ items: state.items.filter((i) => i.folio !== folio) })),
      limpiar: () => set({ items: [] }),
    }),
    { name: 'paguito-carrito' }
  )
);
