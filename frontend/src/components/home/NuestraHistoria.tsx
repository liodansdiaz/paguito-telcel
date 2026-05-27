import { institucional } from '../../data';

// ════════════════════════════════════════════════════════════════════════════
// NUESTRA HISTORIA - Sección como Cencel.com.mx
// ════════════════════════════════════════════════════════════════════════════

const NuestraHistoria = () => {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        
        {/* Grid 2 columnas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Columna izquierda: Imagen/Logo */}
          <div className="relative">
            {/* Placeholder: reemplazar con imagen real */}
            <div className="bg-gradient-to-br from-primary-100 to-secondary-100 rounded-2xl p-12 text-center relative overflow-hidden">
              <div className="text-6xl font-extrabold text-primary-500 mb-4">
                ACXOCEL
              </div>
              <div className="text-gray-600 mb-8">
                Distribuidor Autorizado Telcel
              </div>
              
              {/* Badge flotante "Red 5G" */}
              <div className="absolute top-6 right-6 bg-primary-500 text-white font-bold px-4 py-2 rounded-full shadow-lg">
                Red 5G
              </div>
              
              {/* Decoración */}
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-primary-300 rounded-full opacity-20"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-secondary-300 rounded-full opacity-20"></div>
            </div>
          </div>

          {/* Columna derecha: Texto */}
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Nuestra Historia
            </h2>

            <div className="space-y-4 text-gray-700 leading-relaxed">
              <p>{institucional.historia.parrafo1}</p>
              <p>{institucional.historia.parrafo2}</p>
              <p className="text-primary-600 font-semibold text-lg italic">
                {institucional.historia.cierre}
              </p>
            </div>
          </div>
        </div>

        {/* Misión y Visión (grid 2 columnas) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-16">
          
          {/* Misión */}
          <div className="bg-gray-50 rounded-lg p-8 border-l-4 border-primary-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl font-bold text-primary-500">01</span>
              <h3 className="text-2xl font-bold text-gray-900">Misión</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {institucional.mision}
            </p>
          </div>

          {/* Visión */}
          <div className="bg-gray-50 rounded-lg p-8 border-l-4 border-secondary-500">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-5xl font-bold text-secondary-500">02</span>
              <h3 className="text-2xl font-bold text-gray-900">Visión</h3>
            </div>
            <p className="text-gray-700 leading-relaxed">
              {institucional.vision}
            </p>
          </div>
        </div>

        {/* Compromiso ACXOCEL (grid 3 columnas) */}
        <div className="mt-12 bg-primary-50 rounded-xl p-8">
          <h3 className="text-2xl font-bold text-center text-gray-900 mb-8">
            Compromiso ACXOCEL
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {institucional.compromiso.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 bg-white rounded-lg p-4 shadow-sm"
              >
                <span className="text-2xl text-primary-500">✓</span>
                <span className="text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default NuestraHistoria;
