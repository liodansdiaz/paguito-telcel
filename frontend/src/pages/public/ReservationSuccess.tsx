import { useLocation, Link } from 'react-router-dom';

interface LocationState {
  reservationId?: string;
  producto?: string;
  nombre?: string;
}

const ReservationSuccess = () => {
  const location = useLocation();
  const state = location.state as LocationState;

  const shortId = state?.reservationId?.slice(0, 8).toUpperCase() ?? 'N/A';

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
          <strong>Importante:</strong> No podrás hacer una nueva reserva mientras esta esté activa.
          Espera a que sea completada o contacta a soporte si necesitas cancelarla.
        </div>

        <div className="flex flex-col gap-3">
          <Link
            to="/catalogo"
            className="bg-[#13ec6d] text-[#002f87] py-3 rounded-xl font-bold hover:bg-green-400 transition-colors"
          >
            Ver más celulares
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
