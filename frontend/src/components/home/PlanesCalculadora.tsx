import { useState } from 'react';
import { Link } from 'react-router-dom';
import { planes } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// PLANES CALCULADORA - Buscador interactivo como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const PlanesCalculadora = () => {
  const [tipoPlan, setTipoPlan] = useState<string>('Todos');
  const [tipoRenta, setTipoRenta] = useState<string>('Todos');
  const [presupuesto, setPresupuesto] = useState<number>(1500);
  const [busqueda, setBusqueda] = useState<string>('');

  // Filtrar planes
  const planesFiltrados = planes.filter((plan) => {
    const cumpleTipo = tipoPlan === 'Todos' || plan.tipo === tipoPlan;
    const cumpleRenta = tipoRenta === 'Todos' || plan.renta === tipoRenta;
    const cumplePresupuesto = plan.precioLibre <= presupuesto;
    const cumpleBusqueda = busqueda === '' || plan.nombre.toLowerCase().includes(busqueda.toLowerCase());

    return cumpleTipo && cumpleRenta && cumplePresupuesto && cumpleBusqueda;
  });

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Título */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Encuentra tu Plan Ideal
          </h2>
          <p className="text-xl text-gray-600">
            Configura tu plan perfecto con nuestra herramienta inteligente.
          </p>
        </div>

        {/* Filtros */}
        <div className="bg-gray-50 rounded-lg p-8 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Tipo de Plan */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Plan
              </label>
              <select
                value={tipoPlan}
                onChange={(e) => setTipoPlan(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Todos">Todos</option>
                <option value="Masivo">Masivo</option>
                <option value="Profamily">Profamily</option>
              </select>
            </div>

            {/* Tipo de Renta */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Renta
              </label>
              <select
                value={tipoRenta}
                onChange={(e) => setTipoRenta(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="Todos">Todos</option>
                <option value="Abierto">Abierto</option>
                <option value="Controlado">Controlado</option>
              </select>
            </div>

            {/* Presupuesto */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Presupuesto Máximo: ${presupuesto}
              </label>
              <input
                type="range"
                min="299"
                max="1500"
                step="50"
                value={presupuesto}
                onChange={(e) => setPresupuesto(Number(e.target.value))}
                className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer accent-primary-500"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>$299</span>
                <span>$1,500</span>
              </div>
            </div>

            {/* Búsqueda por nombre */}
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Buscar por nombre
              </label>
              <input
                type="text"
                placeholder="Ej: Telcel Libre 3"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Botón (opcional, el filtro es en tiempo real) */}
            <div className="md:col-span-2 flex items-end">
              <button
                onClick={() => {
                  setTipoPlan('Todos');
                  setTipoRenta('Todos');
                  setPresupuesto(1500);
                  setBusqueda('');
                }}
                className="w-full bg-gray-200 text-gray-700 px-6 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>

        {/* Resultados */}
        {planesFiltrados.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {planesFiltrados.map((plan) => (
              <div
                key={plan.id}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-primary-500 hover:shadow-lg transition"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.nombre}</h3>
                
                <div className="mb-4">
                  <div className="text-3xl font-extrabold text-primary-600">
                    {plan.gigasTotales} GB
                  </div>
                  <div className="text-sm text-gray-500">
                    {plan.gigasBase} GB base + {plan.gigasPromo} GB promo
                  </div>
                </div>

                <ul className="space-y-1 mb-4 text-sm text-gray-600">
                  {plan.beneficios.slice(0, 3).map((beneficio, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-green-500">✓</span>
                      <span>{beneficio}</span>
                    </li>
                  ))}
                </ul>

                <div className="border-t pt-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm text-gray-600">Renta Libre:</span>
                    <span className="text-xl font-bold text-gray-900">${plan.precioLibre}/mes</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Renta Controlada:</span>
                    <span className="text-lg font-semibold text-gray-700">${plan.precioControlado}/mes</span>
                  </div>
                </div>

                <Link
                  to="/planes-comparativa"
                  className="block mt-4 text-center bg-primary-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-primary-600 transition"
                >
                  Contratar →
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              No encontramos planes con esos filtros
            </h3>
            <p className="text-gray-600">
              Intenta ajustar tu presupuesto o los tipos de plan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

export default PlanesCalculadora;
