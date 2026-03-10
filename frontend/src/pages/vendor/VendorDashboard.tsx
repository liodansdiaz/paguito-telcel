import { useEffect, useState, useCallback } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import type { VendorMetrics, MapReservation, Reservation, EstadoReserva } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';

// Fix Leaflet icon default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Estados que el vendedor puede asignar desde su panel
const ESTADOS_VENDEDOR: { value: EstadoReserva; label: string; color: string }[] = [
  { value: 'EN_VISITA',      label: 'En visita',      color: 'bg-purple-100 text-purple-700' },
  { value: 'VENDIDA',        label: 'Vendida',         color: 'bg-green-100 text-green-700' },
  { value: 'NO_CONCRETADA',  label: 'No concretada',   color: 'bg-gray-100 text-gray-600' },
  { value: 'CANCELADA',      label: 'Cancelada',       color: 'bg-red-100 text-red-600' },
];

const fmt = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' });

const MetricCard = ({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

// ── Modal para cambiar estado ─────────────────────────────────────────────────
interface StatusModalProps {
  reservation: Reservation;
  onClose: () => void;
  onSaved: () => void;
}

const StatusModal = ({ reservation: r, onClose, onSaved }: StatusModalProps) => {
  const [estado, setEstado] = useState<EstadoReserva>(r.estado);
  const [notas, setNotas] = useState(r.notas ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      await api.patch(`/reservations/vendor/${r.id}/status`, { estado, notas });
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar. Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg text-gray-900 mb-1">Actualizar reserva</h3>
        <p className="text-sm text-gray-500 mb-1">
          #{r.id.slice(0, 8).toUpperCase()} — <span className="font-medium text-gray-700">{r.nombreCompleto}</span>
        </p>
        <p className="text-xs text-gray-400 mb-5">{r.product?.nombre}</p>

        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Nuevo estado</p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {ESTADOS_VENDEDOR.map(({ value, label, color }) => (
            <button
              key={value}
              onClick={() => setEstado(value)}
              className={`py-2.5 px-3 rounded-xl text-sm font-medium border-2 transition-all ${
                estado === value
                  ? `${color} border-current`
                  : 'bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 block">
          Notas internas
        </label>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Resultado de la visita, observaciones del cliente..."
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4 resize-none"
        />

        {error && <p className="text-red-600 text-sm mb-3">{error}</p>}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || estado === r.estado && notas === (r.notas ?? '')}
            className="flex-1 bg-[#002f87] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-900 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

const VendorDashboard = () => {
  // Métricas y mapa
  const [metrics, setMetrics] = useState<VendorMetrics | null>(null);
  const [mapData, setMapData] = useState<MapReservation[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);

  // Lista de reservas
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [filterEstado, setFilterEstado] = useState('');
  const [loadingList, setLoadingList] = useState(true);

  // Modal de cambio de estado
  const [statusModal, setStatusModal] = useState<Reservation | null>(null);

  // Pestaña activa: 'mapa' | 'lista'
  const [tab, setTab] = useState<'mapa' | 'lista'>('mapa');

  useEffect(() => {
    api.get('/dashboard/vendor')
      .then((r) => setMetrics(r.data.data))
      .catch(console.error)
      .finally(() => setLoadingMetrics(false));

    api.get('/reservations/vendor/map')
      .then((r) => setMapData(r.data.data))
      .catch(console.error)
      .finally(() => setLoadingMap(false));
  }, []);

  const fetchReservations = useCallback(async () => {
    setLoadingList(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (filterEstado) params.estado = filterEstado;
      const res = await api.get('/reservations/vendor/my', { params });
      setReservations(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoadingList(false); }
  }, [page, limit, filterEstado]);

  useEffect(() => {
    if (tab === 'lista') fetchReservations();
  }, [tab, fetchReservations]);

  const handleSaved = () => {
    // Refrescar lista y métricas tras cambio de estado
    fetchReservations();
    api.get('/dashboard/vendor').then((r) => setMetrics(r.data.data)).catch(() => {});
    api.get('/reservations/vendor/map').then((r) => setMapData(r.data.data)).catch(() => {});
  };

  // Solo reservas con coordenadas válidas para el mapa
  const mapDataWithCoords = mapData.filter((m) => m.latitude !== null && m.longitude !== null);

  const mapCenter: [number, number] = mapDataWithCoords.length > 0
    ? [
        mapDataWithCoords.reduce((s, m) => s + Number(m.latitude), 0) / mapDataWithCoords.length,
        mapDataWithCoords.reduce((s, m) => s + Number(m.longitude), 0) / mapDataWithCoords.length,
      ]
    : [14.9054, -92.2630]; // Tapachula, Chiapas

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Mi Dashboard</h2>
        <p className="text-gray-400 text-sm">Resumen de tu actividad</p>
      </div>

      {/* Métricas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {loadingMetrics ? Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-4 animate-pulse h-20 shadow-sm" />
        )) : (
          <>
            <MetricCard label="Total asignadas" value={metrics?.asignadas ?? 0} />
            <MetricCard label="Activas" value={metrics?.activas ?? 0} color="text-blue-600" />
            <MetricCard label="Completadas" value={metrics?.completadas ?? 0} color="text-green-600" />
            <MetricCard label="Hoy pendientes" value={metrics?.pendientesHoy ?? 0} color="text-orange-500" />
          </>
        )}
      </div>

      {/* Tabs: Mapa / Mis Reservas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('mapa')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'mapa'
                ? 'text-[#002f87] border-b-2 border-[#002f87] bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mapa de visitas
          </button>
          <button
            onClick={() => setTab('lista')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              tab === 'lista'
                ? 'text-[#002f87] border-b-2 border-[#002f87] bg-blue-50/50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            Mis reservas
            {total > 0 && tab === 'lista' && (
              <span className="ml-1.5 bg-blue-100 text-blue-700 text-xs px-1.5 py-0.5 rounded-full">{total}</span>
            )}
          </button>
        </div>

        {/* ── TAB: MAPA ─────────────────────────────────────────────────── */}
        {tab === 'mapa' && (
          <>
            <div className="px-5 py-3 flex items-center justify-between border-b border-gray-50">
              <span className="text-sm text-gray-500">{mapDataWithCoords.length} ubicaciones activas</span>
            </div>
            {loadingMap ? (
              <div className="h-80 bg-gray-100 animate-pulse flex items-center justify-center">
                <span className="text-gray-400 text-sm">Cargando mapa...</span>
              </div>
            ) : (
              <MapContainer center={mapCenter} zoom={mapDataWithCoords.length > 0 ? 13 : 12} className="h-80 w-full z-10">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {mapDataWithCoords.map((r) => (
                  <Marker key={r.id} position={[Number(r.latitude), Number(r.longitude)]}>
                    <Popup>
                      <div className="text-sm space-y-1 min-w-48">
                        <p className="font-semibold text-gray-900">{r.nombreCompleto}</p>
                        <p className="text-gray-500">{r.product?.nombre}</p>
                        <p className="text-gray-500 text-xs">
                          {fmt(r.fechaPreferida)} — {r.horarioPreferido}
                        </p>
                        <p className="text-gray-400 text-xs">{r.direccion}</p>
                        <div className="flex items-center justify-between pt-1">
                          <StatusBadge type="reserva" estado={r.estado} />
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 text-xs underline hover:text-blue-800"
                          >
                            Abrir Maps
                          </a>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </>
        )}

        {/* ── TAB: LISTA DE RESERVAS ────────────────────────────────────── */}
        {tab === 'lista' && (
          <>
            {/* Filtro de estado */}
            <div className="px-4 py-3 border-b border-gray-50 flex items-center gap-3">
              <span className="text-xs text-gray-500 font-medium">Filtrar:</span>
              <div className="flex gap-1.5 flex-wrap">
                {[
                  { value: '', label: 'Todas' },
                  { value: 'ASIGNADA', label: 'Asignada' },
                  { value: 'EN_VISITA', label: 'En visita' },
                  { value: 'VENDIDA', label: 'Vendida' },
                  { value: 'NO_CONCRETADA', label: 'No concretada' },
                ].map(({ value, label }) => (
                  <button
                    key={value}
                    onClick={() => { setFilterEstado(value); setPage(1); }}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      filterEstado === value
                        ? 'bg-[#002f87] text-white border-[#002f87]'
                        : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {['Folio', 'Cliente', 'Celular', 'Dirección', 'Fecha', 'Estado', 'Acción'].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {loadingList ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i}>
                        {Array.from({ length: 7 }).map((__, j) => (
                          <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                        ))}
                      </tr>
                    ))
                  ) : reservations.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12">
                        <p className="text-gray-400 text-sm">Sin reservas{filterEstado ? ' con este estado' : ''}</p>
                      </td>
                    </tr>
                  ) : reservations.map((r) => (
                    <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">
                        #{r.id.slice(0, 8).toUpperCase()}
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900 whitespace-nowrap">{r.nombreCompleto}</p>
                        <p className="text-gray-400 text-xs">{r.telefono}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700 text-xs whitespace-nowrap">
                        {r.product?.nombre}
                      </td>
                      <td className="px-4 py-3 max-w-[180px]">
                        <p className="text-gray-600 text-xs truncate" title={r.direccion}>{r.direccion}</p>
                        {r.latitude != null && r.longitude != null && (
                          <a
                            href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:text-blue-700"
                          >
                            Ver Maps
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-600">
                        <p>{fmt(r.fechaPreferida)}</p>
                        <p className="text-gray-400">{r.horarioPreferido}</p>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge type="reserva" estado={r.estado} />
                        {r.notas && (
                          <p className="text-xs text-gray-400 mt-1 max-w-[140px] truncate" title={r.notas}>
                            {r.notas}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {!['VENDIDA', 'CANCELADA', 'NO_CONCRETADA', 'SIN_STOCK'].includes(r.estado) && (
                          <button
                            onClick={() => setStatusModal(r)}
                            className="text-xs bg-[#002f87] text-white px-3 py-1.5 rounded-lg hover:bg-blue-900 transition-colors whitespace-nowrap"
                          >
                            Actualizar
                          </button>
                        )}
                        {['VENDIDA', 'NO_CONCRETADA'].includes(r.estado) && (
                          <button
                            onClick={() => setStatusModal(r)}
                            className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-200 transition-colors whitespace-nowrap"
                          >
                            Editar nota
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              totalPages={totalPages}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(l) => { setLimit(l); setPage(1); }}
              limitOptions={[10, 20, 50]}
            />
          </>
        )}
      </div>

      {/* Modal cambio de estado */}
      {statusModal && (
        <StatusModal
          reservation={statusModal}
          onClose={() => setStatusModal(null)}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
};

export default VendorDashboard;
