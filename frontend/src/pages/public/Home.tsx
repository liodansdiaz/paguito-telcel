import { Link } from 'react-router-dom';

// ════════════════════════════════════════════════════════════════════════════
// HOME CORPORATIVA ACXOCEL - Placeholder temporal
// ════════════════════════════════════════════════════════════════════════════
// TODO: Implementar hero carousel, historia, planes, equipos, servicios corp.

const Home = () => {
  return (
    <div className="min-h-screen">
      {/* Placeholder temporal */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-32 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-extrabold mb-4">ACXOCEL</h1>
          <p className="text-2xl mb-2">Distribuidor Autorizado Telcel Región 8</p>
          <p className="text-xl text-blue-100 mb-8">
            Quintana Roo • Chiapas • Yucatán • Campeche
          </p>
          
          <div className="flex gap-4 justify-center flex-wrap">
            <Link
              to="/amigo-paguitos"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
            >
              ⭐ Amigo Paguitos
            </Link>
            <Link
              to="/nosotros"
              className="bg-white/20 backdrop-blur text-white px-8 py-3 rounded-lg font-bold hover:bg-white/30 transition"
            >
              Nosotros
            </Link>
          </div>
        </div>
      </section>

      {/* Sección temporal: servicios */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Nuestros Servicios</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link
              to="/amigo-paguitos"
              className="bg-white border-2 border-primary-500 rounded-lg p-6 text-center hover:shadow-xl transition group"
            >
              <div className="text-5xl mb-4">📱</div>
              <h3 className="text-xl font-bold mb-2 group-hover:text-primary-600">Amigo Paguitos</h3>
              <p className="text-gray-600">Crédito sin buró + delivery</p>
              <span className="inline-block mt-3 bg-primary-500 text-white px-4 py-1 rounded-full text-sm font-bold">
                ⭐ MÁS SOLICITADO
              </span>
            </Link>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 text-center opacity-50">
              <div className="text-5xl mb-4">📞</div>
              <h3 className="text-xl font-bold mb-2">Planes Telcel</h3>
              <p className="text-gray-600">Próximamente</p>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 text-center opacity-50">
              <div className="text-5xl mb-4">🏢</div>
              <h3 className="text-xl font-bold mb-2">Corporativo</h3>
              <p className="text-gray-600">Próximamente</p>
            </div>

            <div className="bg-white border-2 border-gray-300 rounded-lg p-6 text-center opacity-50">
              <div className="text-5xl mb-4">📍</div>
              <h3 className="text-xl font-bold mb-2">Sucursales</h3>
              <p className="text-gray-600">Próximamente</p>
            </div>
          </div>
        </div>
      </section>

      {/* Nota de desarrollo */}
      <section className="bg-yellow-50 border-t-4 border-yellow-400 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-800 font-semibold">
            🚧 Sitio corporativo en construcción - Sprint 1 completado 🚧
          </p>
          <p className="text-yellow-700 mt-2">
            Accede a <Link to="/amigo-paguitos" className="underline font-bold">Amigo Paguitos</Link> para ver el sitio completo
          </p>
        </div>
      </section>
    </div>
  );
};

export default Home;
