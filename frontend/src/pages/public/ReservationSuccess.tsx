import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { toImageUrl } from '../../services/config';

interface ReservaItem {
  id: string;
  tipoPago: 'CONTADO' | 'CREDITO';
  estado: string;
  precioCapturado: number;
  color?: string;
  memoria?: string;
  product: {
    id: string;
    nombre: string;
    marca: string;
    imagenes?: string[];
  };
}

interface LocationState {
  reserva?: {
    id: string;
    nombreCompleto: string;
    telefono: string;
    curp: string;
    fechaPreferida: string;
    horarioPreferido: string;
    estado: string;
    items: ReservaItem[];
    vendor?: {
      nombre: string;
    };
  };
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const ReservationSuccess = () => {
  const location = useLocation();
  const state = location.state as LocationState;

  const reserva = state?.reserva;
  const folio = reserva?.id?.slice(0, 8).toUpperCase() ?? 'N/A';
  const totalProductos = reserva?.items?.length ?? 0;
  const totalPrecio = reserva?.items?.reduce((sum, item) => sum + item.precioCapturado, 0) ?? 0;

  // Guardar folio en localStorage
  useEffect(() => {
    if (reserva?.id) {
      localStorage.setItem('paguito_last_folio', folio);
    }
  }, [reserva?.id, folio]);

  if (!reserva) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">❓</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Sin información</h1>
          <p className="text-gray-500 text-sm mb-6">
            No se encontró información de la reserva
          </p>
          <Link
            to="/catalogo"
            className="inline-block bg-[primary-500] text-white px-8 py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors"
          >
            Ver catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success header */}
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center mb-6">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">✅</span>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">¡Reserva confirmada!</h1>
          <p className="text-gray-500 text-sm mb-6">
            Tu reserva fue registrada exitosamente. Un vendedor te contactará pronto.
          </p>

          {/* Folio destacado */}
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 mb-6">
            <p className="text-sm text-gray-600 mb-2">Tu número de reserva es</p>
            <p className="text-4xl font-extrabold text-primary-500 mb-2">#{folio}</p>
            <p className="text-xs text-gray-500">
              Guárdalo para consultar o cancelar tu reserva
            </p>
          </div>

          {/* Info general */}
          <div className="bg-gray-50 rounded-xl p-5 text-left space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cliente</span>
              <span className="font-semibold text-gray-900">{reserva.nombreCompleto}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Teléfono</span>
              <span className="font-medium text-gray-900">{reserva.telefono}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Productos reservados</span>
              <span className="font-semibold text-primary-500">{totalProductos}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Visita programada</span>
              <span className="font-medium text-gray-900">
                {formatFecha(reserva.fechaPreferida)} · {reserva.horarioPreferido}
              </span>
            </div>
            {reserva.vendor && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Vendedor asignado</span>
                <span className="font-medium text-gray-900">{reserva.vendor.nombre}</span>
              </div>
            )}
          </div>
        </div>

        {/* Lista de productos */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Productos de tu reserva</h2>
          
          <div className="space-y-4">
            {reserva.items.map((item) => {
              const imagen = item.product.imagenes?.[0] ? toImageUrl(item.product.imagenes[0]) : null;
              
              return (
                <div key={item.id} className="flex gap-4 p-4 bg-gray-50 rounded-xl">
                  {/* Imagen */}
                  <div className="w-16 h-16 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                    {imagen ? (
                      <img src={imagen} alt={item.product.nombre} className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-2xl">📱</span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase">{item.product.marca}</p>
                    <p className="font-bold text-gray-900 mb-1">{item.product.nombre}</p>
                    
                    <div className="flex flex-wrap items-center gap-2">
                      {item.color && (
                        <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {item.color}
                        </span>
                      )}
                      {item.memoria && (
                        <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded border border-gray-200">
                          {item.memoria}
                        </span>
                      )}
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        item.tipoPago === 'CREDITO' 
                          ? 'bg-blue-100 text-blue-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {item.tipoPago === 'CREDITO' ? '📊 Crédito' : '💵 Contado'}
                      </span>
                    </div>
                  </div>

                  {/* Precio */}
                  <div className="text-right flex-shrink-0">
                    <p className="text-lg font-extrabold text-secondary-500">
                      {formatPrice(item.precioCapturado)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Total */}
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <span className="text-gray-700 font-semibold">Total de la reserva</span>
            <span className="text-2xl font-extrabold text-secondary-500">
              {formatPrice(totalPrecio)}
            </span>
          </div>
        </div>

        {/* Importante */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">💡</span>
            <div className="flex-1">
              <p className="text-yellow-900 font-semibold mb-1">Importante</p>
              <p className="text-yellow-700 text-sm">
                Guarda tu número de folio <strong>#{folio}</strong>. Lo necesitarás si quieres consultar o cancelar tu reserva desde la sección "Mi Reserva".
              </p>
            </div>
          </div>
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/catalogo"
            className="flex-1 bg-accent-500 text-secondary-500 py-3.5 rounded-xl font-bold text-center hover:bg-accent-400 transition-colors shadow-md"
          >
            Ver más celulares
          </Link>
          <Link
            to="/mi-reserva"
            className="flex-1 border-2 border-[primary-500] text-primary-500 py-3.5 rounded-xl font-bold text-center hover:bg-blue-50 transition-colors"
          >
            Consultar mi reserva
          </Link>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/"
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            ← Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReservationSuccess;
