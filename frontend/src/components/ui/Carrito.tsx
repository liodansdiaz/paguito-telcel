import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCarritoStore } from '../../store/carrito.store';
import { toImageUrl } from '../../services/config';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

const Carrito = () => {
  const { items, eliminarDelCarrito, getCantidadTotal, getTotalPrecio } = useCarritoStore();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleEliminar = (tempId: string) => {
    eliminarDelCarrito(tempId);
  };

  const cantidadTotal = getCantidadTotal();
  const totalPrecio = getTotalPrecio();

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón carrito */}
      <button
        onClick={() => setOpen(!open)}
        className="relative flex items-center bg-white/10 hover:bg-white/20 border border-white/20 text-white p-2 rounded-lg transition-colors"
        title="Ver carrito"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        {cantidadTotal > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#13ec6d] text-[#002f87] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {cantidadTotal}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#002f87] to-[#0f49bd] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Carrito de compras</p>
              <p className="text-blue-200 text-xs">
                {cantidadTotal} {cantidadTotal === 1 ? 'producto' : 'productos'}
              </p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lista de productos */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-gray-400 text-sm mb-2">Tu carrito está vacío</p>
                <Link
                  to="/catalogo"
                  onClick={() => setOpen(false)}
                  className="text-[#0f49bd] text-sm font-medium hover:underline"
                >
                  Ver catálogo →
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.tempId} className="p-4">
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-14 h-14 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                      {item.imagen
                        ? <img src={toImageUrl(item.imagen)} alt={item.nombre} className="w-full h-full object-contain" />
                        : <span className="text-xl">📱</span>
                      }
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium uppercase">{item.marca}</p>
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.nombre}</p>
                      
                      {/* Opciones */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        {item.color && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                            {item.color}
                          </span>
                        )}
                        {item.memoria && (
                          <span className="text-xs text-gray-500 bg-gray-50 px-2 py-0.5 rounded">
                            {item.memoria}
                          </span>
                        )}
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          item.tipoPago === 'CREDITO' 
                            ? 'bg-blue-50 text-blue-600' 
                            : 'bg-green-50 text-green-700'
                        }`}>
                          {item.tipoPago === 'CREDITO' ? '📊 Crédito' : '💵 Contado'}
                        </span>
                      </div>
                      
                      {/* Precio */}
                      <p className="text-sm font-bold text-[#002f87] mt-1.5">
                        {formatPrice(item.precio)}
                      </p>
                    </div>
                    
                    {/* Botón eliminar */}
                    <button
                      onClick={() => handleEliminar(item.tempId)}
                      title="Eliminar del carrito"
                      className="flex-shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors self-start"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer con total y botón checkout */}
          {items.length > 0 && (
            <div className="border-t border-gray-200 bg-gray-50">
              <div className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Total</p>
                  <p className="text-xl font-extrabold text-[#002f87]">
                    {formatPrice(totalPrecio)}
                  </p>
                </div>
                <Link
                  to="/carrito"
                  onClick={() => setOpen(false)}
                  className="bg-[#13ec6d] text-[#002f87] px-6 py-3 rounded-xl font-bold text-sm hover:bg-green-400 transition-all shadow-md flex items-center gap-2"
                >
                  Continuar
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
              <div className="px-5 pb-3">
                <p className="text-xs text-gray-400 text-center">
                  💡 Puedes seguir agregando productos
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Carrito;
