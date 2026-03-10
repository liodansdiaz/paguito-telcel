import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import type { Product } from '../../types';
import { useGeolocation } from '../../hooks/useGeolocation';
import { validateSchedule, getMinTime, getMaxTime } from '../../hooks/useScheduleValidator';

// Fix Leaflet icon default
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// ── Tapachula, Chiapas ──────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [14.9054, -92.2634];
const DEFAULT_ZOOM = 13;

// Bounding box de Tapachula y alrededores (oeste, sur, este, norte)
// cubre desde Huixtla hasta Unión Juárez y la frontera con Guatemala
const TAPACHULA_VIEWBOX = '-92.6,14.6,-91.8,15.2';

// ── Nominatim helpers ───────────────────────────────────────────────────────
const nominatimHeaders = { 'Accept-Language': 'es', 'User-Agent': 'PaguitoTelcel/1.0' };

async function geocodeAddress(query: string): Promise<[number, number] | null> {
  if (!query || query.trim().length < 8) return null;
  try {
    const params = new URLSearchParams({
      q: `${query.trim()}, Tapachula, Chiapas, Mexico`,
      format: 'json',
      limit: '1',
      countrycodes: 'mx',
      viewbox: TAPACHULA_VIEWBOX,
      bounded: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: nominatimHeaders });
    const data = await res.json();
    if (data.length === 0) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch {
    return null;
  }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({ lat: String(lat), lon: String(lon), format: 'json' });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: nominatimHeaders });
    const data = await res.json();
    if (!data.address) return null;
    const a = data.address;
    const parts = [
      a.road,
      a.house_number,
      a.neighbourhood || a.suburb || a.quarter,
      a.city || a.town || a.village || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.length >= 2 ? parts.join(', ') : null;
  } catch {
    return null;
  }
}

// ── Sub-componentes del mapa ────────────────────────────────────────────────

// Escucha clicks en el mapa
const MapClickHandler = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
};

// Mueve la vista del mapa cuando cambian las coords objetivo
const MapPanner = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]);
  return null;
};

// ── Zod schema ──────────────────────────────────────────────────────────────
const schema = z.object({
  nombreCompleto: z.string().min(3, 'Nombre requerido'),
  telefono: z.string().min(10).max(15),
  curp: z.string().length(18, 'CURP debe tener 18 caracteres'),
  tipoPago: z.enum(['CONTADO', 'CREDITO']),
  direccion: z.string().min(10, 'Direccion completa requerida'),
  fechaPreferida: z.string().min(1, 'Selecciona una fecha'),
  horarioPreferido: z.string().min(1, 'Selecciona un horario'),
});
type FormData = z.infer<typeof schema>;

const fmt = (p: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

// Mapa de colores — mismo que el catálogo
const COLOR_MAP: Record<string, string> = {
  negro: '#1a1a1a', blanco: '#f5f5f5', plata: '#C0C0C0', plateado: '#C0C0C0',
  gris: '#808080', azul: '#2563eb', 'azul oscuro': '#1e3a8a', 'azul claro': '#60a5fa',
  verde: '#16a34a', 'verde menta': '#6ee7b7', morado: '#7c3aed', violeta: '#7c3aed',
  rojo: '#dc2626', rosa: '#ec4899', dorado: '#d97706', amarillo: '#eab308',
  naranja: '#ea580c', cafe: '#92400e', café: '#92400e', beige: '#d4b896',
  titanio: '#a0a098', 'titanio negro': '#3a3a3a', 'titanio natural': '#a0a098',
};
const getColorHex = (color: string) => COLOR_MAP[color.toLowerCase()] ?? '#9ca3af';

// ── Componente principal ────────────────────────────────────────────────────
const ReservationForm = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedColor = searchParams.get('color');
  const selectedMemoria = searchParams.get('memoria');
  const [product, setProduct] = useState(null as Product | null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [scheduleError, setScheduleError] = useState('');
  const [showMap, setShowMap] = useState(false);

  // Estado del mapa
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [geocoding, setGeocoding] = useState(false);          // buscando dirección → coords
  const [pinConfirmed, setPinConfirmed] = useState(false);    // el cliente hizo clic en el mapa
  const [reverseAddr, setReverseAddr] = useState<string | null>(null); // sugerencia tras clic

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const geo = useGeolocation();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { tipoPago: 'CONTADO' as const },
  });
  const watchedDate = watch('fechaPreferida');
  const watchedTime = watch('horarioPreferido');
  const watchedDireccion = watch('direccion');

  useEffect(() => {
    if (!productId) return;
    api.get('/products/' + productId)
      .then((r: any) => setProduct(r.data.data))
      .catch(() => navigate('/catalogo'))
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (watchedDate && watchedTime) {
      const v = validateSchedule(watchedDate, watchedTime);
      setScheduleError(v.isValid ? '' : (v.message || ''));
    }
  }, [watchedDate, watchedTime]);

  // Debounce: geocodificar la dirección escrita 800ms después de que el cliente deja de escribir
  // Solo si el mapa está abierto y el cliente no ha fijado el pin manualmente
  const handleDireccionChange = useCallback((value: string) => {
    if (!showMap || pinConfirmed) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setGeocoding(true);
      const coords = await geocodeAddress(value);
      setGeocoding(false);
      if (coords) {
        geo.setManual(coords[0], coords[1]);
        setMapCenter(coords);
        setMapZoom(16);
      }
    }, 800);
  }, [showMap, pinConfirmed, geo]);

  // Observar cambios en el campo dirección
  useEffect(() => {
    handleDireccionChange(watchedDireccion || '');
  }, [watchedDireccion]);

  // Cuando el cliente abre el mapa por primera vez, geocodificar la dirección actual
  const handleOpenMap = useCallback(async () => {
    setShowMap(true);
    setReverseAddr(null);
    if (!pinConfirmed && watchedDireccion && watchedDireccion.trim().length >= 8) {
      setGeocoding(true);
      const coords = await geocodeAddress(watchedDireccion);
      setGeocoding(false);
      if (coords) {
        geo.setManual(coords[0], coords[1]);
        setMapCenter(coords);
        setMapZoom(16);
      }
    }
  }, [pinConfirmed, watchedDireccion, geo]);

  // Cuando el cliente hace clic en el mapa
  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    geo.setManual(lat, lng);
    setMapCenter([lat, lng]);
    setMapZoom(16);
    setPinConfirmed(true);
    setReverseAddr(null);
    // Geocodificación inversa para sugerir actualizar el campo de dirección
    const addr = await reverseGeocode(lat, lng);
    if (addr) setReverseAddr(addr);
  }, [geo]);

  // El cliente acepta la sugerencia de dirección
  const handleAcceptReverseAddr = () => {
    if (reverseAddr) {
      setValue('direccion', reverseAddr, { shouldValidate: true });
    }
    setReverseAddr(null);
  };

  // Resetear el pin
  const handleResetPin = () => {
    geo.reset();
    setPinConfirmed(false);
    setReverseAddr(null);
    setMapCenter(DEFAULT_CENTER);
    setMapZoom(DEFAULT_ZOOM);
    setShowMap(false);
  };

  const onSubmit = async (data: FormData) => {
    if (scheduleError) return;
    const v = validateSchedule(data.fechaPreferida, data.horarioPreferido);
    if (!v.isValid) { setScheduleError(v.message || ''); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      // Construir nota automática con la variante seleccionada
      const varianteParts: string[] = [];
      if (selectedColor) varianteParts.push(`Color: ${selectedColor}`);
      if (selectedMemoria) varianteParts.push(`Almacenamiento: ${selectedMemoria}`);
      const notaVariante = varianteParts.length > 0 ? `Variante solicitada — ${varianteParts.join(', ')}` : undefined;

      const res: any = await api.post('/reservations', {
        productId,
        ...data,
        curp: data.curp.toUpperCase(),
        fechaPreferida: new Date(data.fechaPreferida + 'T00:00:00').toISOString(),
        latitude: geo.obtained ? geo.latitude : null,
        longitude: geo.obtained ? geo.longitude : null,
        ...(notaVariante && { notas: notaVariante }),
      });
      navigate('/reserva/exitosa', {
        state: {
          reservationId: res.data.data.id,
          producto: product?.nombre,
          marca: product?.marca,
          tipoPago: data.tipoPago,
          fechaPreferida: data.fechaPreferida,
          horarioPreferido: data.horarioPreferido,
          imagen: product?.imagenes?.[0] ?? undefined,
          nombre: data.nombreCompleto,
        },
      });
    } catch (err: any) {
      setSubmitError(err.response?.data?.message || 'Error al crear la reserva.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  if (!product) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split('T')[0];

  const markerPosition: [number, number] | null =
    geo.obtained && geo.latitude !== null && geo.longitude !== null
      ? [geo.latitude, geo.longitude]
      : null;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Reservar celular</h1>

      {/* Tarjeta del producto */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-8 flex items-center gap-4">
        {product.imagenes?.[0] ? (
          <img src={toImageUrl(product.imagenes[0])} alt={product.nombre} className="w-14 h-14 object-contain" />
        ) : (
          <span className="text-3xl">📱</span>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-blue-500 font-medium">{product.marca}</p>
          <p className="font-bold text-gray-900">{product.nombre}</p>
          <p className="text-[#0f49bd] font-semibold text-sm">{fmt(product.precio)} al contado</p>
          {product.disponibleCredito && product.pagosSemanales && (
            <p className="text-gray-400 text-xs">o desde {fmt(product.pagosSemanales)}/semana a credito</p>
          )}
          <div className="flex flex-wrap gap-1.5 mt-1.5">
            {selectedColor && (
              <span className="inline-flex items-center gap-1 text-xs bg-white border border-blue-200 text-gray-700 px-2 py-0.5 rounded-full">
                <span className="w-2.5 h-2.5 rounded-full inline-block border border-gray-200 flex-shrink-0" style={{ backgroundColor: getColorHex(selectedColor) }} />
                {selectedColor}
              </span>
            )}
            {selectedMemoria && (
              <span className="text-xs bg-white border border-blue-200 text-gray-700 px-2 py-0.5 rounded-full">
                {selectedMemoria}
              </span>
            )}
          </div>
          {/* Aviso si el producto tiene variantes pero no se seleccionó alguna */}
          {((product?.colores?.length ?? 0) > 0 && !selectedColor) && (
            <p className="text-[10px] text-amber-600 mt-1">
              Sin color seleccionado — el vendedor confirmará disponibilidad
            </p>
          )}
          {((product?.memorias?.length ?? 0) > 0 && !selectedMemoria) && (
            <p className="text-[10px] text-amber-600 mt-0.5">
              Sin almacenamiento seleccionado — el vendedor confirmará disponibilidad
            </p>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
          <input {...register('nombreCompleto')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" placeholder="Tu nombre completo" />
          {errors.nombreCompleto && <p className="text-red-500 text-xs mt-1">{errors.nombreCompleto.message}</p>}
        </div>

        {/* Teléfono + CURP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Telefono *</label>
            <input {...register('telefono')} type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" placeholder="55 1234 5678" />
            {errors.telefono && <p className="text-red-500 text-xs mt-1">{errors.telefono.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CURP *</label>
            <input {...register('curp')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm uppercase" placeholder="XXXX000000XXXXXX00" maxLength={18} />
            {errors.curp && <p className="text-red-500 text-xs mt-1">{errors.curp.message}</p>}
          </div>
        </div>

        {/* Tipo de pago */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de pago *</label>
          <div className="flex gap-4">
            {(['CONTADO', 'CREDITO'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input {...register('tipoPago')} type="radio" value={t} className="w-4 h-4" />
                <span className="text-sm text-gray-700">{t === 'CONTADO' ? 'Contado' : 'Credito'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Direccion completa *</label>
          <textarea
            {...register('direccion')}
            rows={3}
            className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
            placeholder="Calle, numero, colonia, ciudad, estado"
          />
          {errors.direccion && <p className="text-red-500 text-xs mt-1">{errors.direccion.message}</p>}
        </div>

        {/* Fecha + Horario */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha preferida *</label>
            <input {...register('fechaPreferida')} type="date" min={minDate} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
            {errors.fechaPreferida && <p className="text-red-500 text-xs mt-1">{errors.fechaPreferida.message}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Horario preferido *</label>
            <input {...register('horarioPreferido')} type="time" min={getMinTime(watchedDate)} max={getMaxTime(watchedDate)} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm" />
            {errors.horarioPreferido && <p className="text-red-500 text-xs mt-1">{errors.horarioPreferido.message}</p>}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-xs text-blue-700">
          Horarios: Lunes-Viernes 9:30-16:30 | Sabados 9:30-14:30 | Domingos no disponible
        </div>
        {scheduleError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">⚠️ {scheduleError}</div>
        )}

        {/* ── Sección mapa — opcional ───────────────────────────────────── */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-gray-700">
              Ubicacion en el mapa
              <span className="ml-2 text-xs font-normal text-gray-400">(opcional)</span>
            </label>
            {(geo.obtained || showMap) && (
              <button type="button" onClick={handleResetPin} className="text-xs text-gray-400 hover:text-gray-600 underline">
                Quitar ubicacion
              </button>
            )}
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Marca en el mapa el lugar exacto donde quieres que el vendedor te visite.
            Al escribir tu direccion intentamos ubicarte automaticamente.
          </p>

          {/* Botón para abrir el mapa (estado inicial) */}
          {!showMap && (
            <button
              type="button"
              onClick={handleOpenMap}
              className="w-full border-2 border-dashed border-[#0f49bd] text-[#0f49bd] hover:bg-blue-50 rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              {geocoding ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-[#0f49bd] border-t-transparent rounded-full animate-spin" />
                  Buscando tu direccion...
                </span>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Elegir ubicacion en el mapa
                </>
              )}
            </button>
          )}

          {/* Mapa abierto */}
          {showMap && (
            <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">

              {/* Header del mapa */}
              <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center justify-between">
                <span className="text-xs text-blue-700 flex items-center gap-1.5">
                  {geocoding ? (
                    <>
                      <span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      Buscando tu direccion en el mapa...
                    </>
                  ) : pinConfirmed ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-green-700">Punto de entrega confirmado — haz clic para moverlo</span>
                    </>
                  ) : geo.obtained ? (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Ubicacion sugerida por tu direccion — haz clic para confirmar el punto exacto
                    </>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
                      </svg>
                      Haz clic en el mapa para marcar tu punto de entrega
                    </>
                  )}
                </span>
              </div>

              {/* Mapa Leaflet */}
              <div className="h-64 w-full">
                <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-10">
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapClickHandler onSelect={handleMapClick} />
                  <MapPanner center={mapCenter} zoom={mapZoom} />
                  {markerPosition && <Marker position={markerPosition} />}
                </MapContainer>
              </div>

              {/* Banner sugerencia de dirección (geocodificación inversa) */}
              {reverseAddr && (
                <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex items-start gap-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                  </svg>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-amber-800 font-medium">¿Actualizar la direccion a esta?</p>
                    <p className="text-xs text-amber-700 mt-0.5 truncate">{reverseAddr}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={handleAcceptReverseAddr}
                      className="text-xs bg-amber-500 text-white px-2.5 py-1 rounded-lg hover:bg-amber-600 font-medium transition-colors"
                    >
                      Si
                    </button>
                    <button
                      type="button"
                      onClick={() => setReverseAddr(null)}
                      className="text-xs text-amber-600 hover:text-amber-800 px-1 transition-colors"
                    >
                      No
                    </button>
                  </div>
                </div>
              )}

              {/* Footer: opcion de usar ubicacion actual */}
              <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={async () => {
                    geo.requestLocation();
                    // Cuando se obtenga la ubicacion actual, centrar el mapa
                  }}
                  disabled={geo.loading}
                  className="text-xs text-gray-500 hover:text-[#0f49bd] transition-colors flex items-center gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                  </svg>
                  {geo.loading ? 'Obteniendo ubicacion...' : 'Usar mi ubicacion actual como referencia'}
                </button>
                {markerPosition && (
                  <span className="text-xs text-gray-400">
                    {geo.latitude?.toFixed(5)}, {geo.longitude?.toFixed(5)}
                  </span>
                )}
              </div>

              {geo.error && (
                <div className="bg-red-50 border-t border-red-200 px-3 py-2 text-xs text-red-700">⚠️ {geo.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Error de envío */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">❌ {submitError}</div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting || !!scheduleError}
          className={'w-full py-4 rounded-xl font-bold text-base transition-all ' + (submitting || !!scheduleError ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-[#13ec6d] text-[#002f87] hover:bg-green-400')}
        >
          {submitting ? 'Enviando...' : 'Confirmar reserva'}
        </button>
      </form>
    </div>
  );
};

export default ReservationForm;
