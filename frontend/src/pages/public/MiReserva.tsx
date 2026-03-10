import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

interface ReservaConsulta {
  id: string;
  nombreCompleto: string;
  telefono: string;
  tipoPago: 'CONTADO' | 'CREDITO';
  direccion: string;
  fechaPreferida: string;
  horarioPreferido: string;
  estado: string;
  createdAt: string;
  product: { id: string; nombre: string; marca: string; imagenes: string[] };
  vendor: { nombre: string } | null;
}

const EstadoBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, string> = {
    NUEVA: 'bg-blue-100 text-blue-700',
    ASIGNADA: 'bg-indigo-100 text-indigo-700',
  };
  const label: Record<string, string> = {
    NUEVA: 'Nueva',
    ASIGNADA: 'Asignada',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[estado] ?? 'bg-gray-100 text-gray-600'}`}>
      {label[estado] ?? estado}
    </span>
  );
};

const MiReserva = () => {
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reserva, setReserva] = useState<ReservaConsulta | null>(null);
  const [cancelando, setCancelando] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [cancelada, setCancelada] = useState(false);

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setLoading(true);
    setError('');
    setReserva(null);
    setCancelada(false);
    try {
      const res = await api.post('/reservations/consulta', { busqueda: busqueda.trim() });
      setReserva(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se encontró ninguna reserva activa con ese dato.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelar = async () => {
    if (!reserva) return;
    setCancelando(true);
    try {
      await api.patch('/reservations/cancelar', { busqueda: busqueda.trim() });
      setShowConfirm(false);
      setCancelada(true);
      setReserva(null);
    } catch (err: any) {
      setShowConfirm(false);
      setError(err.response?.data?.message || 'Error al cancelar la reserva.');
    } finally {
      setCancelando(false);
    }
  };

  const imagen = reserva?.product?.imagenes?.[0] ? toImageUrl(reserva.product.imagenes[0]) : null;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#002f87] to-[#0f49bd] text-white py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="bg-[#13ec6d] text-[#002f87] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-4 inline-block">
            Sin necesidad de cuenta
          </span>
          <h1 className="text-3xl font-extrabold mb-2">Consulta tu reserva</h1>
          <p className="text-blue-100 text-sm max-w-md mx-auto">
            Ingresa tu número de folio o tu CURP para ver el estado de tu reserva y cancelarla si lo necesitas.
          </p>
        </div>
      </section>

      {/* Formulario de búsqueda */}
      <section className="py-10 px-4">
        <div className="max-w-lg mx-auto">
          <form onSubmit={handleBuscar} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Número de folio o CURP
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value.toUpperCase())}
                placeholder="Ej: A3F2B1C0 o GOML850101..."
                className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                maxLength={36}
              />
              <button
                type="submit"
                disabled={loading || !busqueda.trim()}
                className="bg-[#0f49bd] text-white px-5 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {loading ? 'Buscando...' : 'Buscar'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
              El folio son los primeros 8 caracteres de tu número de reserva (lo encontrarás en tu pantalla de confirmación).
            </p>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-5 py-4 flex gap-3 items-start">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Cancelación exitosa */}
          {cancelada && (
            <div className="mt-4 bg-green-50 border border-green-200 rounded-2xl p-6 text-center">
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="font-bold text-gray-900 text-lg mb-2">Reserva cancelada</h3>
              <p className="text-gray-500 text-sm mb-5">
                Tu reserva fue cancelada exitosamente. Ya puedes hacer una nueva reserva cuando quieras.
              </p>
              <Link
                to="/catalogo"
                className="inline-block bg-[#13ec6d] text-[#002f87] px-8 py-3 rounded-xl font-bold text-sm hover:bg-green-400 transition-all"
              >
                Ver catálogo
              </Link>
            </div>
          )}

          {/* Tarjeta de reserva */}
          {reserva && (
            <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Header de la tarjeta */}
              <div className="bg-gradient-to-r from-[#002f87] to-[#0f49bd] px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-blue-200 text-xs mb-0.5">Número de folio</p>
                  <p className="text-white font-bold font-mono tracking-wider">#{reserva.id.slice(0, 8).toUpperCase()}</p>
                </div>
                <EstadoBadge estado={reserva.estado} />
              </div>

              {/* Producto */}
              <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-50">
                <div className="w-16 h-16 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                  {imagen
                    ? <img src={imagen} alt={reserva.product.nombre} className="w-full h-full object-contain" />
                    : <span className="text-3xl">📱</span>
                  }
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">{reserva.product.marca}</p>
                  <p className="font-bold text-gray-900">{reserva.product.nombre}</p>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full mt-1 inline-block ${reserva.tipoPago === 'CREDITO' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-700'}`}>
                    {reserva.tipoPago === 'CREDITO' ? 'Pago a crédito' : 'Pago al contado'}
                  </span>
                </div>
              </div>

              {/* Detalles */}
              <div className="px-6 py-5 space-y-3">
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Cliente</p>
                    <p className="text-sm font-medium text-gray-900">{reserva.nombreCompleto}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Fecha y hora preferida</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{formatFecha(reserva.fechaPreferida)} · {reserva.horarioPreferido}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="text-xs text-gray-400">Dirección de entrega</p>
                    <p className="text-sm font-medium text-gray-900">{reserva.direccion}</p>
                  </div>
                </div>
                {reserva.vendor && (
                  <div className="flex items-start gap-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <div>
                      <p className="text-xs text-gray-400">Vendedor asignado</p>
                      <p className="text-sm font-medium text-gray-900">{reserva.vendor.nombre}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Botón cancelar */}
              <div className="px-6 pb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-4">
                  <p className="text-yellow-700 text-xs leading-relaxed">
                    <strong>Nota:</strong> Solo puedes cancelar si el vendedor aún no ha iniciado la visita. Una vez cancelada, podrás hacer una nueva reserva.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirm(true)}
                  className="w-full bg-red-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-red-700 transition-colors"
                >
                  Cancelar mi reserva
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Modal confirmación cancelar */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-2">¿Cancelar tu reserva?</h3>
            <p className="text-gray-500 text-sm mb-6">
              Esta acción no se puede deshacer. El vendedor será notificado y quedará disponible para otro cliente.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={cancelando}
                className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                No, mantener
              </button>
              <button
                onClick={handleCancelar}
                disabled={cancelando}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-red-700 disabled:opacity-50"
              >
                {cancelando ? 'Cancelando...' : 'Sí, cancelar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MiReserva;
