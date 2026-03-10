import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import type { Product } from '../../types';

const formatPrice = (p: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

// ─── Tarjeta de producto reutilizable ────────────────────────────────────────
const ProductCard = ({ product }: { product: Product }) => {
  const imagen = product.imagenes && product.imagenes.length > 0
    ? toImageUrl(product.imagenes[0])
    : null;
  const sinStock = product.stock === 0;

  return (
    <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
      {/* Badge */}
      {product.badge && (
        <div className="absolute">
          <span className="bg-[#13ec6d] text-[#002f87] text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-xl">
            {product.badge}
          </span>
        </div>
      )}
      {/* Imagen */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-44 flex items-center justify-center">
        {imagen
          ? <img src={imagen} alt={product.nombre} className="h-36 w-36 object-contain" />
          : <span className="text-5xl">📱</span>
        }
      </div>
      {/* Info */}
      <div className="p-4 flex flex-col flex-1">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{product.marca}</p>
        <h3 className="font-semibold text-gray-900 text-sm leading-tight flex-1 mb-3">{product.nombre}</h3>
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-[#002f87]">{formatPrice(product.precio)}</span>
            {product.precioAnterior && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>
            )}
          </div>
          {product.disponibleCredito && product.pagosSemanales && (
            <p className="text-xs text-gray-500 mt-0.5">
              o desde {formatPrice(product.pagosSemanales)}/semana
            </p>
          )}
        </div>
        <div className="flex gap-2 mt-auto">
          <Link
            to={`/producto/${product.id}`}
            className="flex-1 text-center border border-[#0f49bd] text-[#0f49bd] py-2 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
          >
            Ver detalle
          </Link>
          {!sinStock && (
            <Link
              to={`/reservar/${product.id}`}
              className="flex-1 text-center bg-[#13ec6d] text-[#002f87] py-2 rounded-lg text-xs font-bold hover:bg-green-400 transition-colors"
            >
              Reservar
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── Skeleton de tarjeta ─────────────────────────────────────────────────────
const CardSkeleton = () => (
  <div className="bg-white rounded-2xl p-4 animate-pulse shadow-sm border border-gray-100">
    <div className="bg-gray-200 h-44 rounded-xl mb-4" />
    <div className="h-3 bg-gray-200 rounded mb-2 w-1/3" />
    <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
    <div className="h-5 bg-gray-200 rounded w-1/2" />
  </div>
);

// ─── Componente principal ─────────────────────────────────────────────────────
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

  const confianza = [
    {
      icon: '🚚',
      titulo: 'Entrega a domicilio',
      desc: 'Un vendedor va a tu casa o lugar de trabajo, sin que tengas que moverte.',
    },
    {
      icon: '💳',
      titulo: 'Crédito semanal',
      desc: 'Págalo en cómodas cuotas semanales sin necesidad de tarjeta de crédito.',
    },
    {
      icon: '🛡️',
      titulo: 'Sin aval ni buró',
      desc: 'Proceso sencillo, sin trámites complicados ni consultas al historial crediticio.',
    },
    {
      icon: '📱',
      titulo: 'Equipos originales',
      desc: 'Todos los celulares son originales, nuevos y con garantía Telcel incluida.',
    },
  ];

  const testimonios = [
    {
      nombre: 'María González',
      producto: 'Motorola G24',
      comentario: 'Excelente servicio, el vendedor llegó puntual y muy amable. Me explicó todo sobre el crédito y salí con mi celular el mismo día. Lo recomiendo mucho.',
    },
    {
      nombre: 'Carlos Ramírez',
      producto: 'Samsung A55',
      comentario: 'No tenía historial crediticio y pensé que no me iban a dar el crédito. Me sorprendió lo fácil que fue el trámite. Sin aval, sin buró y con pagos cómodos semanales.',
    },
    {
      nombre: 'Laura Méndez',
      producto: 'Oppo Reno 14',
      comentario: 'Me gustó mucho que el vendedor fue hasta mi trabajo. No tuve que salir ni perder tiempo. El proceso fue rápido y transparente. Muy buena experiencia.',
    },
    {
      nombre: 'Roberto Fuentes',
      producto: 'Redmi Note 14',
      comentario: 'Ya llevo dos celulares con Paguito Telcel. El trato es muy bueno, los precios justos y los pagos semanales se ajustan perfecto a mi presupuesto.',
    },
    {
      nombre: 'Ana Soto',
      producto: 'Redmi A5',
      comentario: 'Dudé al principio porque era a crédito, pero todo fue muy formal. Me dieron contrato, me explicaron las condiciones y el equipo llegó en perfectas condiciones.',
    },
    {
      nombre: 'Miguel Torres',
      producto: 'Samsung A16',
      comentario: 'Lo mejor es que no tienes que ir a ningún lado. Hice la reserva en línea, elegí el horario y listo. El vendedor llegó con el celular y en media hora ya lo tenía configurado.',
    },
  ];

  return (
    <div>

      {/* ── 1. HERO ──────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-br from-[#002f87] to-[#0f49bd] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span className="bg-[#13ec6d] text-[#002f87] text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-6 inline-block">
            Servicio a domicilio
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight">
            Tu próximo celular,<br />
            <span className="text-[#13ec6d]">en la puerta de tu casa</span>
          </h1>
          <p className="text-blue-100 text-lg mb-4 max-w-2xl mx-auto">
            Elige tu celular favorito, agenda una visita y un vendedor te lo lleva.
            Sin filas, sin esperas.
          </p>
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-5 py-3 mb-10">
            <span className="text-[#13ec6d] text-xl">✓</span>
            <span className="text-white text-sm font-medium">
              Disponible a crédito o al contado · Sin aval · Sin buró
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalogo"
              className="bg-[#13ec6d] text-[#002f87] px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-all shadow-lg"
            >
              Ver catálogo
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. CÓMO FUNCIONA ─────────────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold text-[#0f49bd] uppercase tracking-widest mb-1">Fácil y rápido</p>
            <h2 className="text-2xl font-bold text-gray-900">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-sm mt-2 max-w-xl mx-auto">
              En 4 sencillos pasos puedes tener tu celular nuevo sin salir de tu casa
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 md:gap-0">

            {/* Paso 1 */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 relative">
                <span className="absolute -top-2 -right-2 bg-[#13ec6d] text-[#002f87] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">1</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#0f49bd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <rect x="5" y="2" width="14" height="20" rx="2" />
                  <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth={2.5} strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">Elige tu celular</h3>
              <p className="text-gray-500 text-sm leading-relaxed">Explora el catálogo y selecciona el modelo que más te guste</p>
            </div>

            <div className="hidden md:block text-gray-200 text-3xl font-light px-1">→</div>

            {/* Paso 2 */}
            <div className="flex-1 flex flex-col items-center text-center px-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4 relative">
                <span className="absolute -top-2 -right-2 bg-[#13ec6d] text-[#002f87] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">2</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#0f49bd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                <span className="absolute -top-2 -right-2 bg-[#13ec6d] text-[#002f87] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">3</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#0f49bd]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
                <span className="absolute -top-2 -right-2 bg-[#13ec6d] text-[#002f87] text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center">4</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-[#13ec6d]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
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
              className="inline-block bg-[#0f49bd] text-white px-8 py-3 rounded-xl font-semibold text-sm hover:bg-blue-700 transition-all shadow-md"
            >
              Comenzar ahora →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 3. MÁS POPULARES ─────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gradient-to-b from-white to-blue-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-end justify-between mb-8">
            <div>
              <p className="text-xs font-bold text-[#0f49bd] uppercase tracking-widest mb-1">Lo que más se vende</p>
              <h2 className="text-2xl font-bold text-gray-900">Los más populares</h2>
            </div>
            <Link
              to="/catalogo"
              className="text-sm font-semibold text-[#0f49bd] hover:underline hidden sm:block"
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
            <Link to="/catalogo" className="text-sm font-semibold text-[#0f49bd] hover:underline">
              Ver todos los celulares →
            </Link>
          </div>
        </div>
      </section>

      {/* ── 4. OFERTAS ───────────────────────────────────────────────────────── */}
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
                className="text-sm font-semibold text-[#0f49bd] hover:underline hidden sm:block"
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
            <p className="text-xs font-bold text-[#0f49bd] uppercase tracking-widest mb-1">Nuestras ventajas</p>
            <h2 className="text-2xl font-bold text-gray-900">¿Por qué elegir Paguito Telcel?</h2>
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
            <p className="text-xs font-bold text-[#0f49bd] uppercase tracking-widest mb-1">Lo que dicen nuestros clientes</p>
            <h2 className="text-2xl font-bold text-gray-900">Clientes satisfechos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonios.map((t) => (
              <div key={t.nombre} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                {/* Estrellas */}
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                {/* Comentario */}
                <p className="text-gray-600 text-sm leading-relaxed flex-1 mb-4">"{t.comentario}"</p>
                {/* Cliente */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-50">
                  <div className="w-9 h-9 rounded-full bg-[#0f49bd] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {t.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{t.nombre}</p>
                    <p className="text-gray-400 text-xs">{t.producto}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section className="bg-gradient-to-r from-[#002f87] to-[#0f49bd] text-white py-16 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-3">¿Listo para estrenar celular?</h2>
          <p className="text-blue-200 mb-8">
            Explora nuestro catálogo, elige el tuyo y agenda la visita en minutos.
          </p>
          <Link
            to="/catalogo"
            className="bg-[#13ec6d] text-[#002f87] px-10 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-all inline-block shadow-lg"
          >
            Explorar celulares
          </Link>
        </div>
      </section>

    </div>
  );
};

export default Home;
