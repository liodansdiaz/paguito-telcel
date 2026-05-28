import { useState } from 'react';
import { planes, appsIncluidas } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// PLANES COMPARATIVA - Tabla completa como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const PlanesComparativa = () => {
  const [showAppsModal, setShowAppsModal] = useState(false);
  const [showPromoModal, setShowPromoModal] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Planes Telcel Libre
          </h1>
          <p className="text-xl text-blue-100">
            Encuentra el plan perfecto para ti, con la mejor cobertura.
          </p>
        </div>
      </section>

      {/* Tabla completa */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Tabla responsive con scroll horizontal */}
          <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
            <table className="w-full min-w-[1000px]">
              <thead className="bg-primary-500 text-white">
                <tr>
                  <th className="px-4 py-4 text-left font-semibold">Plan Tarifario</th>
                  <th className="px-4 py-4 text-center font-semibold">Tipo</th>
                  <th className="px-4 py-4 text-center font-semibold">Gigas Base</th>
                  <th className="px-4 py-4 text-center font-semibold">Gigas Promo</th>
                  <th className="px-4 py-4 text-center font-semibold">Gigas Totales</th>
                  <th className="px-4 py-4 text-left font-semibold">
                    Beneficios{' '}
                    <button
                      onClick={() => setShowAppsModal(true)}
                      className="text-blue-200 underline text-sm ml-1"
                    >
                      (ver apps)
                    </button>
                  </th>
                  <th className="px-4 py-4 text-center font-semibold">Renta Libre</th>
                  <th className="px-4 py-4 text-center font-semibold">Renta Controlada</th>
                  <th className="px-4 py-4 text-center font-semibold">Acción</th>
                </tr>
              </thead>
              <tbody>
                {planes.map((plan, idx) => (
                  <tr
                    key={plan.id}
                    className={`border-b hover:bg-gray-50 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="px-4 py-4 font-semibold text-gray-900">{plan.nombre}</td>
                    <td className="px-4 py-4 text-center text-sm text-gray-600">{plan.tipo}</td>
                    <td className="px-4 py-4 text-center text-gray-700">{plan.gigasBase} GB</td>
                    <td className="px-4 py-4 text-center text-green-600 font-semibold">
                      +{plan.gigasPromo} GB
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-primary-600 text-lg">
                      {plan.gigasTotales} GB
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">
                      <ul className="space-y-1">
                        {plan.beneficios.slice(0, 2).map((b, i) => (
                          <li key={i} className="flex items-start gap-1">
                            <span className="text-green-500">✓</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-gray-900 text-lg">
                      ${plan.precioLibre}
                    </td>
                    <td className="px-4 py-4 text-center font-bold text-gray-700">
                      ${plan.precioControlado}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <button className="bg-primary-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-primary-600 transition text-sm">
                        Contratar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Notas al pie */}
          <div className="mt-8 bg-blue-50 border-l-4 border-primary-500 p-6 rounded-lg">
            <h3 className="font-bold text-gray-900 mb-2">Notas importantes:</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>
                  <strong>Gigas Promo:</strong> Promoción vigente por 24 meses. Aplica para cambios de plan con incremento de renta.{' '}
                  <button
                    onClick={() => setShowPromoModal(true)}
                    className="text-primary-600 underline font-semibold"
                  >
                    Ver términos completos
                  </button>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>
                  <strong>Apps sin límite:</strong> WhatsApp, Facebook, X, Instagram, Snapchat, Uber (según plan).
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary-500">•</span>
                <span>
                  <strong>Red 5G:</strong> Disponible en zonas de cobertura Telcel. Requiere equipo compatible.
                </span>
              </li>
            </ul>
          </div>

          {/* CTA final */}
          <div className="mt-12 text-center bg-white rounded-lg p-8 shadow-md">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              ¿Necesitas ayuda para elegir?
            </h3>
            <p className="text-gray-600 mb-6">
              Nuestros asesores están listos para ayudarte a encontrar el plan perfecto.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-green-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-green-600 transition">
                💬 Contactar por WhatsApp
              </button>
              <button className="bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition">
                📞 Solicitar llamada
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Modal: Apps incluidas */}
      {showAppsModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowAppsModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-4xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Redes Sociales y Mensajería Instantánea
              </h3>
              <button
                onClick={() => setShowAppsModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            <p className="text-gray-600 mb-6">
              Actividades sin costo incluidas en tu Plan Telcel Libre.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.values(appsIncluidas).map((app, idx) => (
                <div key={idx} className="bg-gray-50 rounded-lg p-6">
                  <h4 className="font-bold text-lg text-gray-900 mb-3">{app.nombre}</h4>
                  <ul className="space-y-2 text-sm text-gray-700">
                    {app.incluye.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-green-500 mt-0.5">✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowAppsModal(false)}
                className="bg-gray-200 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Promoción de datos */}
      {showPromoModal && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto"
          onClick={() => setShowPromoModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-3xl w-full p-8 my-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <h3 className="text-2xl font-bold text-gray-900">
                Promoción de Datos Adicionales
              </h3>
              <button
                onClick={() => setShowPromoModal(false)}
                className="text-gray-400 hover:text-gray-600 text-3xl"
              >
                ×
              </button>
            </div>

            <div className="prose prose-sm max-w-none text-gray-700">
              <h4 className="font-bold text-primary-600">¡Incrementa tu plan y recibe más Gigas!</h4>
              
              <p>
                Incrementa tu plan actual con un <strong>Telcel Libre</strong> o <strong>Internet Libre</strong> y 
                por promoción durante <strong>24 meses</strong> recibe:
              </p>

              <ul>
                <li>Navegación con la mayor velocidad 5G.</li>
                <li>Redes Sociales ilimitadas.</li>
              </ul>

              <h4 className="font-bold mt-6">Datos otorgados por promoción:</h4>
              <ul>
                <li>
                  <strong>Planes Telcel Libre 1 a 4 e Internet Libre 1 y 4:</strong> 50% de la cantidad de datos 
                  para navegación libre incluidos en el plan contratado.
                </li>
                <li>
                  <strong>Planes Telcel Libre 5 o mayor e Internet Libre 6 y 12:</strong> Una cantidad de datos 
                  adicional igual a la cantidad de datos para navegación libre incluidos en el plan contratado 
                  (Doble de Gigas).
                </li>
              </ul>

              <h4 className="font-bold mt-6">Términos y Condiciones:</h4>
              <p className="text-sm">
                Los usuarios Telcel activos, en plazo libre, que soliciten un cambio de plan con incremento de renta 
                (el plan seleccionado siempre debe ser mayor al que tenga contratado), obtendrán por promoción una 
                cantidad de datos para navegación libre adicional a los incluidos en el plan contratado hasta por 24 meses. 
                No aplica en cambio de modalidad CPP-MPP.
              </p>

              <h4 className="font-bold mt-4">Consideraciones:</h4>
              <ul className="text-sm space-y-1">
                <li>Los datos otorgados por promoción tendrán las mismas características que los incluidos en el plan.</li>
                <li>Si el servicio es cancelado por falta de pago la promoción se perderá.</li>
                <li>El usuario debe tener una permanencia mínima de 3 meses antes de renovar.</li>
                <li>Los datos promocionales no son acumulables de un mes a otro.</li>
                <li>No aplica para uso en cobertura marítima ni aérea.</li>
              </ul>
            </div>

            <div className="mt-6 text-center">
              <button
                onClick={() => setShowPromoModal(false)}
                className="bg-primary-500 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-600 transition"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanesComparativa;
