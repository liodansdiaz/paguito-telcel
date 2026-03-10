import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import type { Customer, Reservation } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';

const fmt = (p: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

// ── Modal de detalle de reserva ──────────────────────────────────────────────
const ReservationDetailModal = ({ reservation: r, onClose }: { reservation: Reservation; onClose: () => void }) => {
  const imagen = r.product?.imagenes?.[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002f87] to-[#0f49bd] px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-white font-bold">Detalle de Reserva</p>
            <p className="text-blue-200 text-xs font-mono mt-0.5">#{r.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Producto */}
          <div className="flex items-center gap-4 bg-blue-50 rounded-xl p-4 border border-blue-100">
            <div className="w-14 h-14 rounded-xl bg-white border border-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
              {imagen
                ? <img src={toImageUrl(imagen)} alt={r.product?.nombre} className="w-full h-full object-contain" />
                : <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              }
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-blue-500 font-medium">{r.product?.marca}</p>
              <p className="font-bold text-gray-900 truncate">{r.product?.nombre}</p>
              {r.product?.precio && (
                <p className="text-sm text-[#0f49bd] font-semibold">{fmt(Number(r.product.precio))}</p>
              )}
            </div>
            <div className="shrink-0">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${r.tipoPago === 'CONTADO' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                {r.tipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}
              </span>
            </div>
          </div>

          {/* Estado */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Estado</p>
            <StatusBadge type="reserva" estado={r.estado} />
          </div>

          {/* Separador */}
          <hr className="border-gray-100" />

          {/* Fecha y horario */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-400 mb-1">Fecha preferida</p>
              <p className="text-sm font-medium text-gray-800">
                {new Date(r.fechaPreferida).toLocaleDateString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Horario</p>
              <p className="text-sm font-medium text-gray-800">{r.horarioPreferido}</p>
            </div>
          </div>

          {/* Dirección de entrega */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Dirección de entrega</p>
            <p className="text-sm text-gray-800 leading-relaxed">{r.direccion}</p>
            {r.latitude !== null && r.longitude !== null && (
              <a
                href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Ver ubicación en Google Maps
              </a>
            )}
          </div>

          {/* Vendedor */}
          <div>
            <p className="text-xs text-gray-400 mb-1">Vendedor asignado</p>
            {r.vendor ? (
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-[#0f49bd] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {r.vendor.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.vendor.nombre}</p>
                  {r.vendor.zona && <p className="text-xs text-gray-400">{r.vendor.zona}</p>}
                </div>
              </div>
            ) : (
              <span className="text-sm text-orange-500 font-medium">Sin asignar</span>
            )}
          </div>

          {/* Notas */}
          {r.notas && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-xs text-amber-600 font-medium mb-1">Notas</p>
              <p className="text-sm text-amber-800 leading-relaxed">{r.notas}</p>
            </div>
          )}

          {/* Fechas de registro */}
          <div className="grid grid-cols-2 gap-4 pt-1 border-t border-gray-100">
            <div>
              <p className="text-xs text-gray-400 mb-1">Creada</p>
              <p className="text-xs text-gray-600">
                {new Date(r.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' '}
                {new Date(r.createdAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">Última actualización</p>
              <p className="text-xs text-gray-600">
                {new Date(r.updatedAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                {' '}
                {new Date(r.updatedAt).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
const CustomerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/customers/${id}`)
      .then((r) => setCustomer(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!customer) return <div className="text-center py-20 text-gray-400">Cliente no encontrado</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/admin/clientes" className="text-sm text-gray-400 hover:text-gray-600">Clientes</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">{customer.nombreCompleto}</span>
      </div>

      {/* Tarjeta del cliente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6">
        <div className="w-16 h-16 rounded-full bg-[#0f49bd] text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {customer.nombreCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-400">Nombre</p><p className="font-semibold text-gray-900">{customer.nombreCompleto}</p></div>
          <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-semibold text-gray-900">{customer.telefono}</p></div>
          <div><p className="text-xs text-gray-400">CURP</p><p className="font-mono text-gray-700">{customer.curp}</p></div>
          <div><p className="text-xs text-gray-400">Estado</p><StatusBadge type="cliente" estado={customer.estado} /></div>
          <div><p className="text-xs text-gray-400">Dirección</p><p className="text-gray-700 text-sm">{customer.direccion || 'No registrada'}</p></div>
          <div><p className="text-xs text-gray-400">Registrado</p><p className="text-gray-700 text-sm">{new Date(customer.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
        </div>
      </div>

      {/* Historial de reservas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Historial de Reservas ({customer.reservations?.length ?? 0})</h3>
        </div>
        {customer.reservations?.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Sin reservas</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.reservations?.map((r) => (
              <div key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{r.product?.nombre}</p>
                  <p className="text-gray-400 text-xs">
                    #{r.id.slice(0, 8).toUpperCase()} — {new Date(r.fechaPreferida).toLocaleDateString('es-MX')} {r.horarioPreferido}
                  </p>
                  {r.vendor && <p className="text-gray-500 text-xs">Vendedor: {r.vendor.nombre}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${r.tipoPago === 'CONTADO' ? 'text-green-600' : 'text-blue-600'}`}>
                    {r.tipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}
                  </span>
                  <StatusBadge type="reserva" estado={r.estado} />
                  <button
                    onClick={() => setSelectedReservation(r)}
                    className="text-xs bg-[#0f49bd] text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition-colors font-medium whitespace-nowrap"
                  >
                    Ver detalles
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de detalle */}
      {selectedReservation && (
        <ReservationDetailModal
          reservation={selectedReservation}
          onClose={() => setSelectedReservation(null)}
        />
      )}
    </div>
  );
};

export default CustomerProfile;
