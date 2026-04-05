import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { ProductCard, CardSkeleton } from '../../components/product';
import { confianza, testimonios } from './constants';
import type { Product } from '../../types';

// ════════════════════════════════════════════════════════════════════════════
// HOME PAGE - Pagina principal
// ════════════════════════════════════════════════════════════════════════════
const Home = () => {
  const [populares, setPopulares] = useState<Product[]>([]);
  const [ofertas, setOfertas] = useState<Product[]>([]);
  const [loadingPopulares, setLoadingPopulares] = useState(true);
  const [loadingOfertas, setLoadingOfertas] = useState(true);

  useEffect(() => {
    api.get('/products/home/populares')
      .then((r) => setPopulares(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingPopulares(false));

    api.get('/products/home/ofertas')
      .then((r) => setOfertas(r.data.data))
      .catch(() => {})
      .finally(() => setLoadingOfertas(false));
  }, []);

  return (
    <div className="min-h-screen">
      {/* ── HERO SECTION ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-secondary-500 to-primary-500 text-white py-12 sm:py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Texto Principal */}
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold mb-4">
              Bienvenido a <span className="text-accent-500">Amigo Paguito Tapachula</span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-blue-100 mb-6 sm:mb-8">
              Ahora adquiere tu <strong>Amigo Kit a DOMICILIO!</strong>
            </p>
            
            {/* Los 3 iconos con texto */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8 max-w-3xl mx-auto">
              <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center backdrop-blur">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">💰</div>
                <p className="text-xs sm:text-sm font-medium">Paguitos semanales</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center backdrop-blur">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">🛡️</div>
                <p className="text-xs sm:text-sm font-medium">Garantía Telcel</p>
              </div>
              <div className="bg-white/10 rounded-xl p-3 sm:p-4 text-center backdrop-blur">
                <div className="text-2xl sm:text-3xl mb-1 sm:mb-2">📱</div>
                <p className="text-xs sm:text-sm font-medium">¡Los mejores smartphones!</p>
              </div>
            </div>
            
            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <Link
                to="/catalogo"
                className="bg-accent-500 text-secondary-500 px-6 sm:px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent-400 transition-colors shadow-lg"
              >
                Ver catálogo
              </Link>
              <Link
                to="/mi-reserva"
                className="bg-white/10 backdrop-blur text-white px-6 sm:px-8 py-3 rounded-xl font-bold text-sm hover:bg-white/20 transition-colors"
              >
                Consultar mi reserva
              </Link>
            </div>
          </div>
          
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ───────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Proceso simple</p>
            <h2 className="text-2xl font-bold text-gray-900">¿Cómo funciona?</h2>
          </div>

          <div className="flex flex-col md:flex-row items-start justify-center gap-8 md:gap-4">
            {/* Paso 1 */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 relative">
                <span className="absolute -top-2 -right-2 bg-accent-500 text-secondary-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M7 14h10m-3 4h4" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Elige tu celular</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Explora el catálogo y selecciona el modelo que más te guste</p>
            </div>

            <div className="hidden md:block text-gray-200 text-3xl font-light px-1">→</div>

            {/* Paso 2 */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 relative">
                <span className="absolute -top-2 -right-2 bg-accent-500 text-secondary-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6M7 4h10a2 2 0 012 2v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Llena tu reserva</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Ingresa tus datos y elige el día y hora que más te convenga</p>
            </div>

            <div className="hidden md:block text-gray-200 text-3xl font-light px-1">→</div>

            {/* Paso 3 */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 relative">
                <span className="absolute -top-2 -right-2 bg-accent-500 text-secondary-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0h6" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Recibe al vendedor</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Un vendedor va a tu domicilio en la fecha y hora que elegiste</p>
            </div>

            <div className="hidden md:block text-gray-200 text-3xl font-light px-1">→</div>

            {/* Paso 4 */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mb-4 relative">
                <span className="absolute -top-2 -right-2 bg-accent-500 text-secondary-500 text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-accent-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">¡Listo, es tuyo!</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Firma el contrato y lleva tu celular ese mismo día, sin filas ni esperas</p>
            </div>
          </div>

          <div className="text-center mt-10">
            <Link
              to="/catalogo"
              className="inline-block bg-primary-500 text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-primary-600 transition-all shadow-md"
            >
              Ver celulares disponibles
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. POPULARES ───────────────────────────────────────────────────── */}
      <section className="py-14 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Los más pedidos</p>
              <h2 className="text-2xl font-bold text-gray-900">Celulares populares</h2>
            </div>
            <Link
              to="/catalogo"
              className="text-sm font-semibold text-primary-500 hover:underline hidden sm:block"
            >
              Ver todos →
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {loadingPopulares
              ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
              : populares.length > 0
                ? populares.map((p) => <ProductCard key={p.id} product={p} />)
                : (
                  <div className="col-span-6 text-center py-10 text-gray-400">
                    <p className="text-4xl mb-3">📱</p>
                    <p className="text-sm">Pronto habrá productos destacados aquí</p>
                  </div>
                )
            }
          </div>

          <div className="text-center mt-6 sm:hidden">
            <Link to="/catalogo" className="text-sm font-semibold text-primary-500 hover:underline">
              Ver todos los celulares →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. OFERTAS ───────────────────────────────────────────────────── */}
      {(loadingOfertas || ofertas.length > 0) && (
        <section className="py-14 px-4 bg-gradient-to-b from-blue-50 to-white">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">Precios especiales</p>
                <h2 className="text-2xl font-bold text-gray-900">Celulares en oferta</h2>
              </div>
              <Link
                to="/catalogo"
                className="text-sm font-semibold text-primary-500 hover:underline hidden sm:block"
              >
                Ver todos →
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {loadingOfertas
                ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)
                : ofertas.map((p) => <ProductCard key={p.id} product={p} />)
              }
            </div>
          </div>
        </section>
      )}

      {/* ── 5. ¿POR QUÉ ELEGIRNOS? ───────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Nuestras ventajas</p>
            <h2 className="text-2xl font-bold text-gray-900">¿Por qué elegir Amigo Paguitos Telcel?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {confianza.map((item) => (
              <div
                key={item.titulo}
                className="text-center p-6 rounded-2xl bg-white border border-gray-100 hover:shadow-md transition-shadow"
              >
                <span className="text-4xl mb-4 block">{item.icon}</span>
                <h3 className="font-semibold text-gray-900 mb-2">{item.titulo}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 6. TESTIMONIOS ───────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-primary-500 uppercase tracking-widest mb-1">Comentarios de clientes</p>
            <h2 className="text-2xl font-bold text-gray-900">Lo que dicen nuestros clientes</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonios.map((t) => (
              <div key={t.nombre} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-sm font-bold">
                    {t.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.nombre}</p>
                    <p className="text-xs text-primary-500">{t.producto}</p>
                  </div>
                </div>
                <p className="text-gray-600 text-sm leading-relaxed">"{t.comentario}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ───────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-secondary-500 to-primary-500 text-white py-16 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">¿Listo para tu nuevo celular?</h2>
          <p className="text-blue-100 mb-8">
            Encuentra el perfecto para ti. Reserva ahora y un vendedor te visitará en tu domicilio.
          </p>
          <Link
            to="/catalogo"
            className="inline-block bg-accent-500 text-secondary-500 px-8 py-3 rounded-xl font-bold text-sm hover:bg-accent-400 transition-all shadow-lg"
          >
            Ver catálogo de celulares
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Home;
