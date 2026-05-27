import { institucional } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// NOSOTROS - Página institucional ACXOCEL
// ════════════════════════════════════════════════════════════════════════════
// TODO: Implementar diseño completo con historia, misión, visión, valores

const Nosotros = () => {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Conoce ACXOCEL
          </h1>
          <p className="text-xl text-blue-100">
            {institucional.slogan}
          </p>
        </div>
      </section>

      {/* Nuestra Historia */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Nuestra Historia</h2>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-gray-700 mb-4">
              {institucional.historia.parrafo1}
            </p>
            <p className="text-gray-700 mb-4">
              {institucional.historia.parrafo2}
            </p>
            <p className="text-primary-600 font-semibold text-center text-xl mt-8">
              {institucional.historia.cierre}
            </p>
          </div>
        </div>
      </section>

      {/* Misión y Visión */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Misión */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-bold text-primary-500">01</span>
                <h3 className="text-2xl font-bold">Misión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {institucional.mision}
              </p>
            </div>

            {/* Visión */}
            <div className="bg-white rounded-lg p-8 shadow-md">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl font-bold text-secondary-500">02</span>
                <h3 className="text-2xl font-bold">Visión</h3>
              </div>
              <p className="text-gray-700 leading-relaxed">
                {institucional.vision}
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Compromiso ACXOCEL */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Compromiso ACXOCEL</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institucional.compromiso.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm border-l-4 border-primary-500">
                <span className="text-2xl">✓</span>
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cobertura */}
      <section className="bg-gray-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Nuestra Cobertura</h2>
          <p className="text-xl text-gray-600 mb-8">{institucional.region}</p>
          
          <div className="flex flex-wrap justify-center gap-4">
            {institucional.estados.map((estado, idx) => (
              <div key={idx} className="bg-white rounded-lg px-6 py-3 shadow-md font-semibold text-primary-600">
                📍 {estado}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Placeholder: completar después */}
      <section className="bg-yellow-50 border-t-4 border-yellow-400 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-800 font-semibold">
            🚧 Página en construcción - Próximamente: valores, certificaciones, equipo 🚧
          </p>
        </div>
      </section>
    </div>
  );
};

export default Nosotros;
