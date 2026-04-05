import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { addDays, isSunday, isBefore, startOfDay } from 'date-fns';
import 'react-day-picker/style.css';
import { showError, showWarning } from '../../utils/notifications';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import '../../utils/leaflet';
import { useCarritoStore } from '../../store/carrito.store';
import { useGeolocation } from '../../hooks/useGeolocation';
import { toImageUrl } from '../../services/config';
import api from '../../services/api';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

// ── Mapa helpers ─────────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [14.9054, -92.2634];
const DEFAULT_ZOOM = 13;
const TAPACHULA_VIEWBOX = '-92.6,14.6,-91.8,15.2';
const nominatimHeaders = { 'Accept-Language': 'es', 'User-Agent': 'AmigoPaguitosTelcel/1.0' };

async function geocodeAddress(query: string): Promise<[number, number] | null> {
  if (!query || query.trim().length < 8) return null;
  try {
    const params = new URLSearchParams({
      q: `${query.trim()}, Tapachula, Chiapas, Mexico`,
      format: 'json', limit: '1', countrycodes: 'mx',
      viewbox: TAPACHULA_VIEWBOX, bounded: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`, { headers: nominatimHeaders });
    const data = await res.json();
    if (data.length === 0) return null;
    return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
  } catch { return null; }
}

async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  try {
    const params = new URLSearchParams({
      lat: String(lat), lon: String(lon), format: 'json', addressdetails: '1',
    });
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params}`, { headers: nominatimHeaders });
    const data = await res.json();
    if (!data.address) return data.display_name || null;
    const a = data.address;
    const parts = [
      a.road, a.house_number,
      a.neighbourhood || a.suburb || a.quarter,
      a.city || a.town || a.village || a.municipality,
      a.state,
    ].filter(Boolean);
    return parts.length >= 2 ? parts.join(', ') : (data.display_name || null);
  } catch { return null; }
}

const MapClickHandler = ({ onSelect }: { onSelect: (lat: number, lng: number) => void }) => {
  useMapEvents({ click(e) { onSelect(e.latlng.lat, e.latlng.lng); } });
  return null;
};

const MapPanner = ({ center, zoom }: { center: [number, number]; zoom: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
    // Forzar que el mapa se contenga después de mover
    setTimeout(() => map.invalidateSize(), 100);
  }, [center, zoom, map]);
  return null;
};

const CartCheckout = () => {
  const navigate = useNavigate();
  const { 
    items, 
    eliminarDelCarrito, 
    cambiarTipoPago, 
    getTotalPrecio, 
    vaciarCarrito,
    guardarReservaConfirmada,
    contarProductosCredito 
  } = useCarritoStore();

  const [step, setStep] = useState<'cart' | 'form'>(items.length > 0 ? 'cart' : 'form');
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    curp: '',
    direccion: '',
    fechaPreferida: '',
    horarioPreferido: '10:00',
    notas: '',
  });

  // Estado del mapa
  const [showMap, setShowMap] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [geocoding, setGeocoding] = useState(false);
  const [pinConfirmed, setPinConfirmed] = useState(false);
  const [reverseAddr, setReverseAddr] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const geo = useGeolocation();

  // Cerrar calendario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    };
    if (showCalendar) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showCalendar]);

  const totalPrecio = getTotalPrecio();
  const productosCredito = contarProductosCredito();

  const handleEliminar = (tempId: string) => {
    eliminarDelCarrito(tempId);
    if (items.length === 1) {
      showError('Carrito vacío');
      navigate('/catalogo');
    }
  };

  const handleCambiarTipoPago = (tempId: string, nuevoTipoPago: 'CONTADO' | 'CREDITO') => {
    // Validar: Solo 1 producto a crédito
    if (nuevoTipoPago === 'CREDITO' && productosCredito > 0) {
      const itemActual = items.find(i => i.tempId === tempId);
      if (itemActual?.tipoPago !== 'CREDITO') {
        showError('Solo puedes tener un producto a crédito en tu reserva');
        return;
      }
    }
    cambiarTipoPago(tempId, nuevoTipoPago);
  };

  const handleContinuar = () => {
    if (items.length === 0) {
      showError('Tu carrito está vacío');
      navigate('/catalogo');
      return;
    }
    setStep('form');
  };

  // ── Handlers del mapa ────────────────────────────────────────────────────
  useEffect(() => {
    if (geo.obtained && geo.latitude !== null && geo.longitude !== null && !pinConfirmed) {
      setMapCenter([geo.latitude, geo.longitude]);
      setMapZoom(16);
      // Cancelar debounce de geocodificación de dirección si está corriendo
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setGeocoding(false);
      // Geocodificación inversa para sugerir la dirección desde GPS
      if (showMap) {
        reverseGeocode(geo.latitude, geo.longitude).then((addr) => {
          if (addr) setReverseAddr(addr);
        });
      }
    }
  }, [geo.obtained, geo.latitude, geo.longitude, pinConfirmed, showMap]);

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

  useEffect(() => {
    if (pinConfirmed && debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    handleDireccionChange(formData.direccion);
  }, [formData.direccion, handleDireccionChange, pinConfirmed]);

  const handleOpenMap = useCallback(async () => {
    setShowMap(true);
    setReverseAddr(null);
    if (!pinConfirmed && formData.direccion.trim().length >= 8) {
      setGeocoding(true);
      const coords = await geocodeAddress(formData.direccion);
      setGeocoding(false);
      if (coords) {
        geo.setManual(coords[0], coords[1]);
        setMapCenter(coords);
        setMapZoom(16);
      }
    }
  }, [pinConfirmed, formData.direccion, geo]);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    geo.setManual(lat, lng);
    setMapCenter([lat, lng]);
    setMapZoom(16);
    setPinConfirmed(true);
    setReverseAddr(null);
    const addr = await reverseGeocode(lat, lng);
    if (addr) setReverseAddr(addr);
  }, [geo]);

  const handleAcceptReverseAddr = () => {
    if (reverseAddr) setFormData(prev => ({ ...prev, direccion: reverseAddr }));
    setReverseAddr(null);
    setPinConfirmed(true); // Bloquear geocodificación para evitar ciclo infinito
  };

  const handleResetPin = () => {
    geo.reset();
    setPinConfirmed(false);
    setReverseAddr(null);
    setMapCenter(DEFAULT_CENTER);
    setMapZoom(DEFAULT_ZOOM);
    setShowMap(false);
  };

  const markerPosition: [number, number] | null =
    geo.obtained && geo.latitude !== null && geo.longitude !== null
      ? [geo.latitude, geo.longitude]
      : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      showError('Tu carrito está vacío');
      return;
    }

    // Validación de campos vacíos
    const vacios: string[] = [];
    if (!formData.nombreCompleto.trim()) vacios.push('Nombre completo');
    if (!formData.telefono.trim()) vacios.push('Teléfono');
    if (!formData.curp.trim()) vacios.push('CURP');
    if (!formData.direccion.trim()) vacios.push('Dirección');
    if (!formData.fechaPreferida) vacios.push('Fecha preferida');
    if (!formData.horarioPreferido) vacios.push('Horario preferido');

    if (vacios.length > 0) {
      const msg = vacios.length === 1
        ? `Falta: ${vacios[0]}`
        : `Faltan ${vacios.length} campos: ${vacios.join(', ')}`;
      showWarning(msg);
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para el backend
      const reservationData = {
        items: items.map(item => ({
          productId: item.productId,
          color: item.color,
          memoria: item.memoria,
          tipoPago: item.tipoPago,
        })),
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        curp: formData.curp.toUpperCase(),
        direccion: formData.direccion,
        fechaPreferida: new Date(formData.fechaPreferida).toISOString(),
        horarioPreferido: formData.horarioPreferido,
        notas: formData.notas || undefined,
        latitude: geo.obtained ? geo.latitude : null,
        longitude: geo.obtained ? geo.longitude : null,
      };

      const { data } = await api.post('/reservations', reservationData);
      const reserva = data.data;

      // Guardar reserva confirmada en el store local
      guardarReservaConfirmada({
        id: reserva.id,
        folio: reserva.id.substring(0, 8).toUpperCase(),
        nombreCompleto: reserva.nombreCompleto,
        telefono: reserva.telefono,
        curp: reserva.curp,
        estado: reserva.estado,
        items: reserva.items.map((item: any) => ({
          id: item.id,
          producto: item.product.nombre,
          marca: item.product.marca,
          imagen: item.product.imagenes?.[0],
          tipoPago: item.tipoPago,
          estado: item.estado,
          precioCapturado: item.precioCapturado,
          color: item.color,
          memoria: item.memoria,
        })),
        fechaPreferida: reserva.fechaPreferida,
        horarioPreferido: reserva.horarioPreferido,
        createdAt: reserva.createdAt,
      });

      // Vaciar el carrito
      vaciarCarrito();

      // Redirigir a página de éxito
      navigate('/reserva/exitosa', { state: { reserva } });
    } catch (error: any) {
      const resData = error.response?.data;
      if (resData?.errors && Array.isArray(resData.errors)) {
        resData.errors.forEach((e: { field: string; message: string }) => {
          showError(`${e.field}: ${e.message}`);
        });
      } else {
        showError(resData?.message || 'Error al crear la reserva');
      }
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Agrega productos desde el catálogo para hacer tu reserva</p>
        <Link
          to="/catalogo"
          className="inline-block bg-primary-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
      {/* Breadcrumb */}
      <nav className="text-xs sm:text-sm text-gray-400 mb-4 sm:mb-6">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-1 sm:mx-2">/</span>
        <Link to="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-1 sm:mx-2">/</span>
        <span className="text-gray-700">Carrito</span>
      </nav>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">
        {step === 'cart' ? 'Tu carrito' : 'Datos de reserva'}
      </h1>

      {/* Progress bar */}
      <div className="flex items-center justify-center mb-6 sm:mb-10">
        <div className="flex items-center gap-2 sm:gap-4">
          <div className={`flex items-center gap-1 sm:gap-2 ${step === 'cart' ? 'text-primary-500' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              step === 'cart' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="font-medium hidden sm:inline text-xs sm:text-sm">Carrito</span>
          </div>
          <div className="w-8 sm:w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-1 sm:gap-2 ${step === 'form' ? 'text-primary-500' : 'text-gray-400'}`}>
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              step === 'form' ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="font-medium hidden sm:inline text-xs sm:text-sm">Datos</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2">
          {step === 'cart' ? (
            /* PASO 1: Lista de productos */
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.tempId} className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row gap-3 sm:gap-4">
                  {/* Imagen */}
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                    {item.imagen
                      ? <img src={toImageUrl(item.imagen)} alt={item.nombre} className="w-full h-full object-contain" />
                      : <span className="text-3xl">📱</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">{item.marca}</p>
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">{item.nombre}</h3>
                    
                    {/* Opciones seleccionadas */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {item.color && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          Color: {item.color}
                        </span>
                      )}
                      {item.memoria && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {item.memoria}
                        </span>
                      )}
                    </div>

                    {/* Selector de tipo de pago */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCambiarTipoPago(item.tempId, 'CONTADO')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          item.tipoPago === 'CONTADO'
                            ? 'bg-green-50 text-green-700 border-green-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        💵 Contado
                      </button>
                      <button
                        onClick={() => handleCambiarTipoPago(item.tempId, 'CREDITO')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          item.tipoPago === 'CREDITO'
                            ? 'bg-blue-50 text-blue-700 border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                        disabled={item.tipoPago !== 'CREDITO' && productosCredito > 0}
                        title={item.tipoPago !== 'CREDITO' && productosCredito > 0 ? 'Ya tienes un producto a crédito' : ''}
                      >
                        📊 A crédito
                      </button>
                    </div>
                  </div>

                  {/* Precio y eliminar */}
                  <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-between">
                    <button
                      onClick={() => handleEliminar(item.tempId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <p className="text-lg sm:text-xl font-extrabold text-secondary-500">
                      {formatPrice(item.precio)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Advertencia de crédito */}
              {productosCredito > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Límite de crédito</p>
                    <p className="text-sm text-blue-700">
                      Solo puedes tener un producto a crédito por reserva. Los demás deben ser de contado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PASO 2: Formulario de datos */
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-3 sm:p-6 space-y-4 sm:space-y-5">
              <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="Juan Pérez García"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="9611234567"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    CURP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    maxLength={18}
                    value={formData.curp}
                    onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase text-sm"
                    placeholder="PEGJ900101HCHRRS01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Dirección completa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>

                <div className="relative">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Fecha preferida <span className="text-red-500">*</span>
                  </label>
                  
                  {/* Input que abre el calendario */}
                  <button
                    type="button"
                    onClick={() => setShowCalendar(!showCalendar)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-left bg-white flex items-center justify-between text-sm"
                  >
                    <span className={formData.fechaPreferida ? 'text-gray-900' : 'text-gray-400'}>
                      {formData.fechaPreferida 
                        ? new Date(formData.fechaPreferida + 'T12:00:00Z').toLocaleDateString('es-MX', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })
                        : 'Selecciona una fecha'
                      }
                    </span>
                    <svg className="w-4 sm:w-5 h-4 sm:h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </button>
                  
                  {/* Calendario desplegable */}
                  {showCalendar && (
                    <div ref={calendarRef} className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                      <DayPicker
                        mode="single"
                        selected={formData.fechaPreferida ? new Date(formData.fechaPreferida + 'T12:00:00Z') : undefined}
                        onSelect={(date) => {
                          if (date) {
                            const year = date.getUTCFullYear();
                            const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                            const day = String(date.getUTCDate()).padStart(2, '0');
                            setFormData({ ...formData, fechaPreferida: `${year}-${month}-${day}` });
                            setShowCalendar(false);
                          }
                        }}
                        disabled={(date) => {
                          const today = startOfDay(new Date());
                          const minDate = addDays(today, 2);
                          return isBefore(date, minDate) || isSunday(date);
                        }}
                        fromDate={addDays(startOfDay(new Date()), 2)}
                        locale={undefined}
                        className="mx-auto"
                        style={{ '--rdp-accent-color': 'primary-500' } as React.CSSProperties}
                      />
                      <p className="text-xs text-gray-500 text-center mt-2">
                        No se atiende los domingos
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Horario preferido <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.horarioPreferido}
                    onChange={(e) => setFormData({ ...formData, horarioPreferido: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  >
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
                    placeholder="Alguna indicación especial para la visita..."
                  />
                </div>
              </div>

              {/* ── Sección mapa ─────────────────────────────────────────── */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700">
                    Ubicación en el mapa
                    <span className="ml-1 sm:ml-2 text-xs font-normal text-gray-400">(opcional)</span>
                  </label>
                  {(geo.obtained || showMap) && (
                    <button type="button" onClick={handleResetPin} className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Quitar ubicación
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3">
                  Marca en el mapa el lugar exacto donde quieres que el vendedor te visite.
                  Al escribir tu dirección intentamos ubicarte automáticamente.
                </p>

                {!showMap && (
                  <button
                    type="button"
                    onClick={handleOpenMap}
                    className="w-full border-2 border-dashed border-primary-500 text-primary-500 hover:bg-blue-50 rounded-xl py-4 text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
                  >
                    {geocoding ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                        Buscando tu dirección...
                      </span>
                    ) : (
                      <>
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Elegir ubicación en el mapa
                      </>
                    )}
                  </button>
                )}

                {showMap && (
                  <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm w-full" style={{ maxWidth: '100%' }}>
                    <div className="bg-blue-50 px-3 py-2 border-b border-blue-100 flex items-center justify-between min-w-0">
                      <span className="text-xs text-blue-700 flex items-center gap-1.5 min-w-0 truncate">
                        {geocoding ? (
                          <><span className="w-3 h-3 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />Buscando tu dirección en el mapa...</>
                        ) : pinConfirmed ? (
                          <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg><span className="text-green-700">Punto confirmado — haz clic para moverlo</span></>
                        ) : geo.obtained ? (
                          <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>Ubicación sugerida — haz clic para confirmar</>
                        ) : (
                          <><svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>Haz clic en el mapa para marcar tu punto</>
                        )}
                      </span>
                    </div>

                    <div className="h-48 sm:h-64 overflow-hidden" style={{ contain: 'layout style', maxWidth: '100%' }}>
                      <MapContainer center={mapCenter} zoom={mapZoom} className="h-full w-full z-10" style={{ maxWidth: '100%', width: '100%' }}>
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <MapClickHandler onSelect={handleMapClick} />
                        <MapPanner center={mapCenter} zoom={mapZoom} />
                        {markerPosition && <Marker position={markerPosition} />}
                      </MapContainer>
                    </div>

                    {reverseAddr && (
                      <div className="bg-amber-50 border-t border-amber-200 px-4 py-3 flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-3 overflow-hidden">
                        <div className="flex items-start gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20A10 10 0 0012 2z" />
                          </svg>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-amber-800 font-medium">¿Actualizar la dirección a esta?</p>
                            <p className="text-xs text-amber-700 mt-0.5 truncate">{reverseAddr}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={handleAcceptReverseAddr} className="text-xs bg-amber-500 text-white px-2.5 py-1 rounded-lg hover:bg-amber-600 font-medium transition-colors">Sí</button>
                          <button type="button" onClick={() => setReverseAddr(null)} className="text-xs text-amber-600 hover:text-amber-800 px-1 transition-colors">No</button>
                        </div>
                      </div>
                    )}

                    <div className="bg-gray-50 px-3 py-2 border-t border-gray-100 flex items-center justify-between min-w-0">
                      <button
                        type="button"
                        onClick={() => geo.requestLocation()}
                        disabled={geo.loading}
                        className="text-xs text-gray-500 hover:text-primary-500 transition-colors flex items-center gap-1"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                        </svg>
                        {geo.loading ? 'Obteniendo ubicación...' : 'Usar mi ubicación actual'}
                      </button>
                      {markerPosition && (
                        <span className="hidden sm:inline text-xs text-gray-400">{geo.latitude?.toFixed(5)}, {geo.longitude?.toFixed(5)}</span>
                      )}
                    </div>

                    {geo.error && (
                      <div className="bg-red-50 border-t border-red-200 px-3 py-2 text-xs text-red-700">⚠️ {geo.error}</div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
                >
                  ← Volver al carrito
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-accent-500 text-secondary-500 py-3 rounded-xl font-bold hover:bg-green-400 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? 'Confirmando...' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar - Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Productos</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(totalPrecio)}</span>
              </div>
              {productosCredito > 0 && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <span>📊</span>
                  <span className="font-medium">{productosCredito} producto a crédito</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="text-2xl font-extrabold text-secondary-500">{formatPrice(totalPrecio)}</span>
              </div>
            </div>

            {step === 'cart' && (
              <button
                onClick={handleContinuar}
                className="w-full bg-accent-500 text-secondary-500 py-3.5 rounded-xl font-bold hover:bg-green-400 transition-all shadow-md"
              >
                Continuar →
              </button>
            )}

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span>✓</span>
                <span>Visita a domicilio sin costo</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span>✓</span>
                <span>Asesoría personalizada</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span>✓</span>
                <span>Sin compromiso de compra</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckout;
