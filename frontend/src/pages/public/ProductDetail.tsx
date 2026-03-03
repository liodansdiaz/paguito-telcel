import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import type { Product } from '../../types';

const BACKEND_URL = 'http://localhost:3000';
const toImageUrl = (src: string) => src.startsWith('http') ? src : `${BACKEND_URL}${src}`;

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/products/${id}`)
      .then((r) => {
        setProduct(r.data.data);
        setActiveImage(0);
      })
      .catch(() => navigate('/catalogo'))
      .finally(() => setLoading(false));
  }, [id]);

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 animate-pulse">
        <div className="grid md:grid-cols-2 gap-10">
          <div className="space-y-3">
            <div className="bg-gray-200 rounded-2xl h-80" />
            <div className="flex gap-2">
              {[1, 2, 3].map((i) => <div key={i} className="bg-gray-200 rounded-lg h-16 w-16" />)}
            </div>
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-10 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) return null;

  const unavailable = product.stock === 0;
  const imagenes = product.imagenes && product.imagenes.length > 0 ? product.imagenes : [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link to="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">{product.nombre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10">
        {/* Galería de imágenes */}
        <div className="space-y-3">
          {/* Imagen principal */}
          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl flex items-center justify-center h-80 relative overflow-hidden">
            {product.badge && (
              <span className="absolute top-4 left-4 bg-[#13ec6d] text-[#002f87] text-xs font-bold px-3 py-1 rounded-full z-10">
                {product.badge}
              </span>
            )}
            {imagenes.length > 0 ? (
              <img
                src={toImageUrl(imagenes[activeImage])}
                alt={product.nombre}
                className="h-64 object-contain transition-opacity duration-200"
              />
            ) : (
              <span className="text-8xl">📱</span>
            )}
          </div>

          {/* Miniaturas */}
          {imagenes.length > 1 && (
            <div className="flex gap-2">
              {imagenes.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-16 h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                    activeImage === i
                      ? 'border-[#0f49bd] shadow-md'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                >
                  <img
                    src={toImageUrl(img)}
                    alt={`${product.nombre} ${i + 1}`}
                    className="w-full h-full object-contain bg-gray-50"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detalles */}
        <div>
          <p className="text-sm font-semibold text-[#0f49bd] mb-1">{product.marca}</p>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.nombre}</h1>
          <p className="text-sm text-gray-500 mb-5">SKU: {product.sku}</p>

          {/* Precio al contado */}
          <div className="mb-4">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#002f87]">{formatPrice(product.precio)}</span>
              {product.precioAnterior && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">Precio al contado</p>
            {product.disponibleCredito && product.pagosSemanales && (
              <div className="mt-2 bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 inline-block">
                <p className="text-sm text-[#0f49bd] font-medium">
                  A crédito: desde <strong>{formatPrice(product.pagosSemanales)}/semana</strong>
                </p>
              </div>
            )}
          </div>

          {/* Stock */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-green-600 text-sm font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                Disponible — {product.stock} unidades
              </span>
            ) : (
              <span className="text-red-600 text-sm font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                Sin stock actualmente
              </span>
            )}
          </div>

          {/* Descripción */}
          {product.descripcion && (
            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{product.descripcion}</p>
          )}

          {/* CTA */}
          <div className="flex gap-3">
            {!unavailable ? (
              <Link
                to={`/reservar/${product.id}`}
                className="flex-1 bg-[#13ec6d] text-[#002f87] py-3.5 rounded-xl font-bold text-center text-base hover:bg-green-400 transition-all shadow-md"
              >
                Reservar ahora
              </Link>
            ) : (
              <button disabled className="flex-1 bg-gray-200 text-gray-400 py-3.5 rounded-xl font-bold text-base cursor-not-allowed">
                Sin disponibilidad
              </button>
            )}
            <Link
              to="/catalogo"
              className="border border-gray-300 text-gray-600 px-5 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Volver
            </Link>
          </div>
        </div>
      </div>

      {/* Especificaciones */}
      {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Especificaciones técnicas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.entries(product.especificaciones).map(([key, value]) => (
              <div key={key} className="flex justify-between border-b border-gray-100 py-2.5">
                <span className="text-gray-500 text-sm capitalize">{key}</span>
                <span className="text-gray-900 text-sm font-medium text-right">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
