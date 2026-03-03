import { useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useCarritoStore } from '../../store/carrito.store';

interface LocationState {
  reservationId?: string;
  producto?: string;
  marca?: string;
  tipoPago?: 'CONTADO' | 'CREDITO';
  fechaPreferida?: string;
  horarioPreferido?: string;
  imagen?: string;
  nombre?: string;
}

const ReservationSuccess = () => {
  const location = useLocation();
  const state = location.state as LocationState;
  const { agregar } = useCarritoStore();

  const shortId = state?.reservationId?.slice(0, 8).toUpperCase() ?? 'N/A';

  // Guardar folio en localStorage y agregar al carrito
  useEffect(() => {
    if (state?.reservationId) {
      localStorage.setItem('paguito_last_folio', state.reservationId.slice(0, 8).toUpperCase());

      agregar({
        folio: state.reservationId.slice(0, 8).toUpperCase(),
        producto: state.producto ?? 'Celular',
        marca: state.marca ?? '',
        tipoPago: state.tipoPago ?? 'CONTADO',
        fecha: state.fechaPreferida ?? new Date().toISOString(),
        horario: state.horarioPreferido ?? '',
        imagen: state.imagen,
        createdAt: new Date().toISOString(),
      });
    }
  }, [state?.reservationId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-8 text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="text-4xl">✅</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reserva confirmada</h1>
        <p className="text-gray-500 text-sm mb-6">
          Tu reserva fue registrada exitosamente. Un vendedor te contactará pronto.
        </p>

        <div className="bg-blue-50 rounded-xl p-5 mb-6 text-left space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Número de reserva</span>
            <span className="font-bold text-[#0f49bd]">#{shortId}</span>
          </div>
          {state?.producto && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Celular</span>
              <span className="font-medium text-gray-900">{state.producto}</span>
            </div>
          )}
          {state?.nombre && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Cliente</span>
              <span className="font-medium text-gray-900">{state.nombre}</span>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6 text-xs text-yellow-700 text-left">
          <strong>Importante:</strong> Guarda tu número de folio <strong>#{shortId}</strong>. Lo necesitarás si quieres consultar o cancelar tu reserva.
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/catalogo"
            className="bg-[#13ec6d] text-[#002f87] py-3 rounded-xl font-bold hover:bg-green-400 transition-colors"
          >
            Ver más celulares
          </Link>
          <Link
            to="/mi-reserva"
            className="border border-red-200 text-red-600 py-3 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors"
          >
            ¿Necesitas cancelar? Consulta tu reserva
          </Link>
          <Link
            to="/"
            className="text-gray-500 text-sm hover:text-gray-700 transition-colors"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ReservationSuccess;
