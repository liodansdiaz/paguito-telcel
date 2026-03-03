import { useState, useRef, useEffect } from 'react';
import { useCarritoStore } from '../../store/carrito.store';
import api from '../../services/api';

const BACKEND_URL = 'http://localhost:3000';
const toImageUrl = (src: string) => src.startsWith('http') ? src : `${BACKEND_URL}${src}`;

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });

const Carrito = () => {
  const { items, eliminar } = useCarritoStore();
  const [open, setOpen] = useState(false);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [confirmFolio, setConfirmFolio] = useState<string | null>(null);
  const [error, setError] = useState('');
  const panelRef = useRef<HTMLDivElement>(null);

  // Cerrar al hacer click fuera
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
        setConfirmFolio(null);
        setError('');
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleCancelar = async (folio: string) => {
    setCancelando(folio);
    setError('');
    try {
      await api.patch('/reservations/cancelar', { busqueda: folio });
      eliminar(folio);
      setConfirmFolio(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se pudo cancelar la reserva.');
    } finally {
      setCancelando(null);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Botón carrito */}
      <button
        onClick={() => { setOpen(!open); setConfirmFolio(null); setError(''); }}
        className="relative flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-white/20 text-white px-3 py-2 rounded-lg transition-colors"
        title="Mis reservas"
      >
        {/* Ícono bolsa/carrito */}
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
        </svg>
        <span className="text-sm font-medium hidden sm:inline">Mis reservas</span>
        {/* Badge contador */}
        {items.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-[#13ec6d] text-[#002f87] text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
            {items.length}
          </span>
        )}
      </button>

      {/* Panel desplegable */}
      {open && (
        <div className="absolute right-0 top-12 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#002f87] to-[#0f49bd] px-5 py-4 flex items-center justify-between">
            <div>
              <p className="text-white font-bold text-sm">Mis reservas activas</p>
              <p className="text-blue-200 text-xs">{items.length} {items.length === 1 ? 'reserva' : 'reservas'}</p>
            </div>
            <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Lista de reservas */}
          <div className="max-h-96 overflow-y-auto divide-y divide-gray-50">
            {items.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl mb-3">🛍️</div>
                <p className="text-gray-400 text-sm">No tienes reservas activas</p>
              </div>
            ) : (
              items.map((item) => (
                <div key={item.folio} className="p-4">
                  <div className="flex gap-3">
                    {/* Imagen */}
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                      {item.imagen
                        ? <img src={toImageUrl(item.imagen)} alt={item.producto} className="w-full h-full object-contain" />
                        : <span className="text-xl">📱</span>
                      }
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400 font-medium">{item.marca}</p>
                      <p className="font-semibold text-gray-900 text-sm truncate">{item.producto}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${item.tipoPago === 'CREDITO' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>
                          {item.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado'}
                        </span>
                        <span className="text-xs text-gray-400">#{item.folio}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatFecha(item.fecha)} · {item.horario}
                      </p>
                    </div>
                    {/* Botón eliminar */}
                    <button
                      onClick={() => { setConfirmFolio(item.folio); setError(''); }}
                      title="Cancelar reserva"
                      className="flex-shrink-0 p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors self-start"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                      </svg>
                    </button>
                  </div>

                  {/* Mini confirmación inline */}
                  {confirmFolio === item.folio && (
                    <div className="mt-3 bg-red-50 border border-red-100 rounded-xl p-3">
                      <p className="text-red-700 text-xs font-medium mb-2">¿Cancelar esta reserva?</p>
                      {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setConfirmFolio(null); setError(''); }}
                          disabled={cancelando === item.folio}
                          className="flex-1 border border-gray-300 bg-white py-1.5 rounded-lg text-xs font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          No
                        </button>
                        <button
                          onClick={() => handleCancelar(item.folio)}
                          disabled={cancelando === item.folio}
                          className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-xs font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          {cancelando === item.folio ? 'Cancelando...' : 'Sí, cancelar'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer del panel */}
          {items.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-100 bg-gray-50">
              <p className="text-xs text-gray-400 text-center">
                Solo se muestran reservas registradas en este dispositivo
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Carrito;
