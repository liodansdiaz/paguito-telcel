import { useEffect, useRef, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Product } from '../../types';

const BACKEND_URL = 'http://localhost:3000';
const toImageUrl = (src: string) => src.startsWith('http') ? src : `${BACKEND_URL}${src}`;
const PAGE_SIZE = 12;

const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState('reciente');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = products.length < total;

  // Ref para el observador de scroll infinito
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Carga de productos ────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (
    currentPage: number,
    currentMarca: string,
    currentSearch: string,
    currentSort: string,
    append: boolean,
  ) => {
    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const params: Record<string, string> = {
        page: String(currentPage),
        limit: String(PAGE_SIZE),
        sort: currentSort,
      };
      if (currentMarca) params.marca = currentMarca;
      if (currentSearch) params.search = currentSearch;

      const res = await api.get('/products', { params });
      const newData: Product[] = res.data.data;
      const newTotal: number = res.data.pagination.total;

      setTotal(newTotal);
      setProducts((prev) => append ? [...prev, ...newData] : newData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // ── Cargar marcas una sola vez ────────────────────────────────────────────
  useEffect(() => {
    api.get('/products/marcas').then((r) => setMarcas(r.data.data)).catch(() => {});
  }, []);

  // ── Cuando cambian filtros u orden: reiniciar desde página 1 ──────────────
  useEffect(() => {
    setPage(1);
    fetchProducts(1, selectedMarca, search, sort, false);
  }, [selectedMarca, search, sort]);

  // ── Scroll infinito: observador en el sentinel ────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, selectedMarca, search, sort, true);
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, selectedMarca, search, sort]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
  };

  const handleMarca = (marca: string) => {
    setSelectedMarca(marca);
  };

  const handleSort = (value: string) => {
    setSort(value);
  };

  // ── Helpers de formato ────────────────────────────────────────────────────
  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

  const getStockLevel = (stock: number, min: number) => {
    if (stock === 0) return { label: 'Sin stock', color: 'bg-red-100 text-red-700' };
    if (stock <= min) return { label: 'Stock crítico', color: 'bg-orange-100 text-orange-700' };
    if (stock <= min * 3) return { label: 'Stock bajo', color: 'bg-yellow-100 text-yellow-700' };
    return { label: 'Disponible', color: 'bg-green-100 text-green-700' };
  };

  // ── Skeletons ─────────────────────────────────────────────────────────────
  const Skeletons = ({ count = 8 }: { count?: number }) => (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-5 animate-pulse shadow-sm border border-gray-100">
          <div className="bg-gray-200 h-44 rounded-xl mb-4" />
          <div className="h-3 bg-gray-200 rounded mb-2 w-1/3" />
          <div className="h-4 bg-gray-200 rounded mb-4 w-3/4" />
          <div className="h-6 bg-gray-200 rounded w-1/2" />
        </div>
      ))}
    </>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">

      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-1">Catálogo de Equipos</h1>
        <p className="text-gray-500 text-sm">
          {loading ? 'Cargando...' : `${total} celular${total !== 1 ? 'es' : ''} disponible${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Barra de filtros y orden */}
      <div className="flex flex-col gap-3 mb-8">

        {/* Búsqueda + Ordenamiento */}
        <div className="flex flex-col sm:flex-row gap-2">
          <form onSubmit={handleSearch} className="flex gap-2 flex-1">
            <input
              type="text"
              placeholder="Buscar por nombre o marca..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              className="bg-[#0f49bd] text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
          </form>

          {/* Selector de orden */}
          <select
            value={sort}
            onChange={(e) => handleSort(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            <option value="reciente">Más recientes</option>
            <option value="precio_asc">Menor precio</option>
            <option value="precio_desc">Mayor precio</option>
            <option value="nombre_asc">Nombre A–Z</option>
          </select>
        </div>

        {/* Filtros por marca */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleMarca('')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedMarca ? 'bg-[#0f49bd] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
          >
            Todos
          </button>
          {marcas.map((m) => (
            <button
              key={m}
              onClick={() => handleMarca(m)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedMarca === m ? 'bg-[#0f49bd] text-white' : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'}`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de productos */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <Skeletons count={PAGE_SIZE} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-6xl mb-4">📱</p>
          <p className="text-xl font-medium mb-2">Sin resultados</p>
          <p className="text-sm">Prueba con otra búsqueda o filtro</p>
        </div>
      ) : (
        <>
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

                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit mb-3 ${stockLevel.color}`}>
                      {stockLevel.label}
                    </span>

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

            {/* Skeletons al cargar más */}
            {loadingMore && <Skeletons count={4} />}
          </div>

          {/* Sentinel para el scroll infinito */}
          <div ref={sentinelRef} className="h-10 mt-4" />

          {/* Mensaje de fin */}
          {!hasMore && !loading && (
            <p className="text-center text-gray-400 text-sm mt-6">
              Mostrando todos los {total} productos
            </p>
          )}
        </>
      )}
    </div>
  );
};

export default Catalog;
