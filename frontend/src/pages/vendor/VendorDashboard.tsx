import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import type { VendorMetrics, MapReservation } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';

// Fix Leaflet icon default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const MetricCard = ({ label, value, color = 'text-gray-900' }: { label: string; value: number; color?: string }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
    <p className={`text-3xl font-bold ${color}`}>{value}</p>
    <p className="text-xs text-gray-400 mt-1">{label}</p>
  </div>
);

const VendorDashboard = () => {
  const [metrics, setMetrics] = useState<VendorMetrics | null>(null);
  const [mapData, setMapData] = useState<MapReservation[]>([]);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [loadingMap, setLoadingMap] = useState(true);

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

  // Calcular centro del mapa
  const mapCenter: [number, number] = mapData.length > 0
    ? [
        mapData.reduce((s, m) => s + Number(m.latitude), 0) / mapData.length,
        mapData.reduce((s, m) => s + Number(m.longitude), 0) / mapData.length,
      ]
    : [19.4326, -99.1332]; // CDMX por defecto

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

      {/* Mapa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">Mapa de visitas asignadas</h3>
          <span className="text-xs text-gray-400">{mapData.length} ubicaciones</span>
        </div>

        {loadingMap ? (
          <div className="h-80 bg-gray-100 animate-pulse flex items-center justify-center">
            <span className="text-gray-400 text-sm">Cargando mapa...</span>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={mapData.length > 0 ? 11 : 10} className="h-80 w-full z-10">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {mapData.map((r) => (
              <Marker key={r.id} position={[Number(r.latitude), Number(r.longitude)]}>
                <Popup>
                  <div className="text-sm space-y-1 min-w-48">
                    <p className="font-semibold text-gray-900">{r.nombreCompleto}</p>
                    <p className="text-gray-500">{r.product?.nombre}</p>
                    <p className="text-gray-500 text-xs">
                      {new Date(r.fechaPreferida).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })} — {r.horarioPreferido}
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
      </div>

      {/* Lista de reservas en el mapa */}
      {mapData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Reservas activas</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {mapData.map((r) => (
              <div key={r.id} className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{r.nombreCompleto}</p>
                  <p className="text-gray-500 text-xs">{r.product?.nombre}</p>
                  <p className="text-gray-400 text-xs">{r.direccion}</p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-xs text-gray-600 font-medium">
                      {new Date(r.fechaPreferida).toLocaleDateString('es-MX', { weekday: 'short', day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-xs text-gray-400">{r.horarioPreferido}</p>
                  </div>
                  <StatusBadge type="reserva" estado={r.estado} />
                  <a
                    href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors font-medium whitespace-nowrap"
                  >
                    Maps
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VendorDashboard;
