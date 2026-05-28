import { useState } from 'react';
import { Link } from 'react-router-dom';

// ════════════════════════════════════════════════════════════════════════════
// EQUIPOS - Buscador de equipos Telcel
// ════════════════════════════════════════════════════════════════════════════
// TODO: Conectar con catálogo real de productos (backend)

const Equipos = () => {
  const [marca, setMarca] = useState<string>('');
  const [modelo, setModelo] = useState<string>('');
  const [almacenamiento, setAlmacenamiento] = useState<string>('');
  const [color, setColor] = useState<string>('');

  const marcas = ['Apple', 'Samsung', 'Motorola', 'Xiaomi', 'OPPO', 'Realme'];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-500 to-secondary-500 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Equipos Telcel
          </h1>
          <p className="text-xl text-blue-100">
            Encuentra tu smartphone perfecto de nuestro catálogo exclusivo.
          </p>
        </div>
      </section>

      {/* Buscador */}
      <section className="py-16 px-4">
        <div className="max-w-7xl mx-auto">
          
          {/* Filtros */}
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Encuentra tu Equipo Ideal
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Marca */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Marca
                </label>
                <select
                  value={marca}
                  onChange={(e) => setMarca(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="">Seleccione</option>
                  {marcas.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              {/* Modelo */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Modelo
                </label>
                <select
                  value={modelo}
                  onChange={(e) => setModelo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!marca}
                >
                  <option value="">Seleccione</option>
                </select>
              </div>

              {/* Almacenamiento */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Almacenamiento
                </label>
                <select
                  value={almacenamiento}
                  onChange={(e) => setAlmacenamiento(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!modelo}
                >
                  <option value="">Seleccione</option>
                  <option value="64GB">64 GB</option>
                  <option value="128GB">128 GB</option>
                  <option value="256GB">256 GB</option>
                  <option value="512GB">512 GB</option>
                  <option value="1TB">1 TB</option>
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Color
                </label>
                <select
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  disabled={!modelo}
                >
                  <option value="">Seleccione</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button className="w-full md:w-auto bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition">
                Buscar Equipos
              </button>
            </div>
          </div>

          {/* Estado inicial */}
          <div className="text-center py-16 bg-white rounded-lg shadow-md">
            <div className="text-6xl mb-4">📱</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Selecciona tus filtros y busca tu Equipo ideal
            </h3>
            <p className="text-gray-600">
              O explora nuestro catálogo completo de Amigo Paguitos
            </p>
            
            <div className="mt-6">
              <Link
                to="/amigo-paguitos/catalogo"
                className="inline-block bg-primary-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
              >
                Ver Catálogo Amigo Paguitos →
              </Link>
            </div>
          </div>

          {/* Opciones de compra */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Compra de contado */}
            <div className="bg-white rounded-lg p-8 shadow-md border-t-4 border-secondary-500">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Compra de Contado
              </h3>
              <ul className="space-y-3 mb-6 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Equipos nuevos y originales</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Garantía Telcel incluida</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Activación inmediata</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Mejores precios del mercado</span>
                </li>
              </ul>
              <button className="w-full bg-secondary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-secondary-600 transition">
                Ver equipos de contado
              </button>
            </div>

            {/* Amigo Paguitos */}
            <div className="bg-white rounded-lg p-8 shadow-md border-t-4 border-primary-500">
              <div className="flex items-center gap-2 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">
                  Amigo Paguitos
                </h3>
                <span className="bg-accent-500 text-secondary-700 text-xs font-bold px-3 py-1 rounded-full">
                  ⭐ MÁS SOLICITADO
                </span>
              </div>
              <ul className="space-y-3 mb-6 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Sin buró de crédito</strong> ni aval</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Pagos <strong>semanales</strong> accesibles</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span><strong>Entrega a domicilio</strong> sin costo</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-1">✓</span>
                  <span>Aprobación <strong>inmediata</strong></span>
                </li>
              </ul>
              <Link
                to="/amigo-paguitos/catalogo"
                className="block text-center w-full bg-primary-500 text-white px-6 py-3 rounded-lg font-bold hover:bg-primary-600 transition"
              >
                Ver catálogo Amigo Paguitos →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Placeholder de desarrollo */}
      <section className="bg-yellow-50 border-t-4 border-yellow-400 py-8 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-yellow-800 font-semibold">
            🚧 Catálogo de equipos de contado en desarrollo 🚧
          </p>
          <p className="text-yellow-700 mt-2">
            Por ahora, explora nuestro catálogo completo en{' '}
            <Link to="/amigo-paguitos" className="underline font-bold">Amigo Paguitos</Link>
          </p>
        </div>
      </section>
    </div>
  );
};

export default Equipos;
