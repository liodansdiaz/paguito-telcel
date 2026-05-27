import { Link } from 'react-router-dom';
import { planes } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// PLANES COMPARADOR - Tabla horizontal como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const PlanesComparador = () => {
  // Mostrar solo primeros 6 planes en home
  const planesDestacados = planes.slice(0, 6);

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Planes Telcel Libre
          </h2>
          <p className="text-xl text-gray-600">
            Compara las rentas y elige la mejor opción para ti.
          </p>
        </div>

        {/* Tabla responsive con scroll horizontal */}
        <div className="overflow-x-auto bg-white rounded-lg shadow-md">
          <table className="w-full min-w-[800px]">
            <thead className="bg-primary-500 text-white">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Plan Tarifario</th>
                <th className="px-4 py-3 text-center font-semibold">Gigas Base</th>
                <th className="px-4 py-3 text-center font-semibold">Gigas Promo</th>
                <th className="px-4 py-3 text-center font-semibold">Gigas Totales</th>
                <th className="px-4 py-3 text-left font-semibold">Beneficios</th>
                <th className="px-4 py-3 text-center font-semibold">Renta Libre</th>
                <th className="px-4 py-3 text-center font-semibold">Renta Controlada</th>
              </tr>
            </thead>
            <tbody>
              {planesDestacados.map((plan, idx) => (
                <tr
                  key={plan.id}
                  className={`border-b hover:bg-gray-50 transition ${
                    idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                  }`}
                >
                  <td className="px-4 py-3 font-semibold text-gray-900">{plan.nombre}</td>
                  <td className="px-4 py-3 text-center text-gray-700">{plan.gigasBase} GB</td>
                  <td className="px-4 py-3 text-center text-green-600 font-semibold">
                    +{plan.gigasPromo} GB
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-primary-600">
                    {plan.gigasTotales} GB
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {plan.beneficios.slice(0, 2).join(', ')}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    ${plan.precioLibre}
                  </td>
                  <td className="px-4 py-3 text-center font-bold text-gray-900">
                    ${plan.precioControlado}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* CTA */}
        <div className="text-center mt-8">
          <Link
            to="/planes-comparativa"
            className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
          >
            Ver todos los planes
          </Link>
        </div>

        {/* Nota sobre promoción */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            * Gigas Promo: Promoción vigente por 24 meses.{' '}
            <button className="text-primary-600 underline hover:text-primary-700">
              Ver términos y condiciones
            </button>
          </p>
        </div>
      </div>
    </section>
  );
};

export default PlanesComparador;
