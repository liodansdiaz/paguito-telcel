import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Product } from '../../types';

const BACKEND_URL = 'http://localhost:3000';
const toImageUrl = (src: string) => src.startsWith('http') ? src : `${BACKEND_URL}${src}`;

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedMarca) params.marca = selectedMarca;
      if (search) params.search = search;

      const res = await api.get('/products', { params });
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get('/products/marcas').then((r) => setMarcas(r.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [selectedMarca]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

  const getStockLevel = (stock: number, min: number) => {
    if (stock === 0) return { label: 'Sin stock', color: 'bg-red-100 text-red-700' };
    if (stock <= min) return { label: 'Stock crítico', color: 'bg-orange-100 text-orange-700' };
    if (stock <= min * 3) return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Disponible', color: 'bg-green-100 text-green-700' };
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Equipos</h1>
        <p className="text-gray-500">Encuentra tu próximo celular y resérvalo hoy</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Buscar por nombre o marca..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="bg-[#0f49bd] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Buscar
          </button>
        </form>

        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedMarca('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedMarca ? 'bg-[#0f49bd] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          {marcas.map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMarca(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMarca === m ? 'bg-[#0f49bd] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-5 animate-pulse shadow-sm">
              <div className="bg-gray-200 h-44 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded mb-2 w-3/4" />
              <div className="h-3 bg-gray-100 rounded mb-4 w-1/2" />
              <div className="h-6 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-6xl mb-4">📱</p>
          <p className="text-xl font-medium mb-2">Sin resultados</p>
          <p className="text-sm">Prueba con otra búsqueda o filtro</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {products.map((product) => {
            const stockLevel = getStockLevel(product.stock, product.stockMinimo);
            const unavailable = product.stock === 0;

            return (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
                {/* Badge */}
                {product.badge && (
                  <div className="absolute">
                    <span className="bg-[#13ec6d] text-[#002f87] text-xs font-bold px-3 py-1 rounded-br-xl rounded-tl-xl">
                      {product.badge}
                    </span>
                  </div>
                )}

                {/* Imagen */}
                <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-48 flex items-center justify-center">
                  {product.imagenes && product.imagenes.length > 0 ? (
                    <img
                      src={toImageUrl(product.imagenes[0])}
                      alt={product.nombre}
                      className="h-40 w-40 object-contain"
                    />
                  ) : (
                    <span className="text-6xl">📱</span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 flex flex-col flex-1">
                  <p className="text-xs text-gray-400 font-medium mb-1">{product.marca}</p>
                  <h3 className="font-semibold text-gray-900 text-sm mb-2 leading-tight flex-1">{product.nombre}</h3>

                  {/* Precio al contado (principal) */}
                  <div className="mb-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-[#002f87]">{formatPrice(product.precio)}</span>
                      {product.precioAnterior && (
                        <span className="text-xs text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>
                      )}
                    </div>
                    {product.disponibleCredito && product.pagosSemanales && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        o desde {formatPrice(product.pagosSemanales)}/semana a crédito
                      </p>
                    )}
                  </div>

                  {/* Stock */}
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit mb-3 ${stockLevel.color}`}>
                    {stockLevel.label}
                  </span>

                  {/* Botones */}
                  <div className="flex gap-2 mt-auto">
                    <Link
                      to={`/producto/${product.id}`}
                      className="flex-1 text-center border border-[#0f49bd] text-[#0f49bd] py-2 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors"
                    >
                      Ver detalle
                    </Link>
                    {!unavailable && (
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
          })}
        </div>
      )}
    </div>
  );
};

export default Catalog;
