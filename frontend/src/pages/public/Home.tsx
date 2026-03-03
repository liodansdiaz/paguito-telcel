import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Product } from '../../types';

const BACKEND_URL = 'http://localhost:3000';
const toImageUrl = (src: string) => src.startsWith('http') ? src : `${BACKEND_URL}${src}`;

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
          {/* Crédito destacado */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-5 py-3 mb-10">
            <span className="text-[#13ec6d] text-xl">✓</span>
            <span className="text-white text-sm font-medium">
              Disponible a crédito desde <strong className="text-[#13ec6d]">$299/semana</strong> · Sin aval · Sin buró
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/catalogo"
              className="bg-[#13ec6d] text-[#002f87] px-8 py-4 rounded-xl font-bold text-lg hover:bg-green-400 transition-all shadow-lg"
            >
              Ver catálogo
            </Link>
            <Link
              to="/login"
              className="bg-white/10 border border-white/30 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-white/20 transition-all"
            >
              Portal vendedores
            </Link>
          </div>
        </div>
      </section>

      {/* ── 2. MÁS POPULARES ─────────────────────────────────────────────────── */}
      <section className="py-14 px-4 bg-gray-50">
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

      {/* ── 3. OFERTAS ───────────────────────────────────────────────────────── */}
      {(loadingOfertas || ofertas.length > 0) && (
        <section className="py-14 px-4 bg-white">
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

      {/* ── 4. ¿POR QUÉ ELEGIRNOS? ───────────────────────────────────────────── */}
      <section className="py-16 px-4 bg-gray-50">
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
