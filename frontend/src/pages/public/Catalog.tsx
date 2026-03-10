import { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import { getColorHex } from '../../utils/colors';
import { formatPrice } from '../../utils/format';
import type { Product } from '../../types';

const PAGE_SIZE = 12;

// Rangos de precio predefinidos
const PRICE_RANGES = [
  { label: 'Menos de $1,499', min: 0, max: 1499 },
  { label: '$1,500 a $5,499', min: 1500, max: 5499 },
  { label: '$5,500 a $10,499', min: 5500, max: 10499 },
  { label: '$10,500 a $16,499', min: 10500, max: 16499 },
  { label: 'Más de $16,500', min: 16500, max: undefined },
];

// ── Íconos SVG ────────────────────────────────────────────────────────────────
const IconFilter = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
  </svg>
);
const IconX = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconTruck = () => (
  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="1" y="3" width="15" height="13" rx="1" />
    <path d="M16 8h4l3 3v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
  </svg>
);

// ── Sección colapsable del sidebar ────────────────────────────────────────────
const FilterSection = ({ title, children, defaultOpen = true }: {
  title: string; children: React.ReactNode; defaultOpen?: boolean;
}) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
      <button
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-800 mb-3 hover:text-[#0f49bd] transition-colors"
        onClick={() => setOpen(!open)}
      >
        {title}
        <IconChevron open={open} />
      </button>
      {open && children}
    </div>
  );
};

// ── Skeletons ─────────────────────────────────────────────────────────────────
const Skeletons = ({ count = 6 }: { count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white rounded-xl p-4 animate-pulse shadow-sm border border-gray-100">
        <div className="bg-gray-200 h-40 rounded-lg mb-3" />
        <div className="h-2.5 bg-gray-200 rounded mb-2 w-1/3" />
        <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
        <div className="flex gap-1 mb-3">
          {[1, 2, 3].map(j => <div key={j} className="w-4 h-4 rounded-full bg-gray-200" />)}
        </div>
        <div className="h-5 bg-gray-200 rounded w-1/2 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-2/3 mb-4" />
        <div className="h-8 bg-gray-200 rounded-lg" />
      </div>
    ))}
  </>
);

// ── Props del sidebar ─────────────────────────────────────────────────────────
interface SidebarProps {
  marcas: string[];
  colores: string[];
  memorias: string[];
  selectedMarcas: string[];
  selectedColor: string;
  selectedMemoria: string;
  selectedPriceRange: number | null;
  precioMinInput: string;
  precioMaxInput: string;
  searchInput: string;
  onSearchInputChange: (v: string) => void;
  onSearchSubmit: (e: React.FormEvent) => void;
  onToggleMarca: (m: string) => void;
  onPriceRange: (idx: number) => void;
  onClearPriceRange: () => void;
  onPrecioMinInputChange: (v: string) => void;
  onPrecioMaxInputChange: (v: string) => void;
  onApplyPrecioPersonalizado: () => void;
  onColorChange: (c: string) => void;
  onMemoriaChange: (m: string) => void;
}

// ── Sidebar — definido FUERA del componente padre para evitar pérdida de foco ─
const SidebarContent = ({
  marcas, colores, memorias,
  selectedMarcas, selectedColor, selectedMemoria, selectedPriceRange,
  precioMinInput, precioMaxInput,
  searchInput,
  onSearchInputChange, onSearchSubmit,
  onToggleMarca,
  onPriceRange, onClearPriceRange,
  onPrecioMinInputChange, onPrecioMaxInputChange, onApplyPrecioPersonalizado,
  onColorChange, onMemoriaChange,
}: SidebarProps) => (
  <div className="space-y-0">

    {/* Búsqueda */}
    <div className="mb-5">
      <form onSubmit={onSearchSubmit} className="flex gap-2">
        <input
          type="text"
          placeholder="Buscar equipo..."
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f49bd]"
        />
        <button
          type="submit"
          className="bg-[#0f49bd] text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-[#002f87] transition-colors"
        >
          Ir
        </button>
      </form>
    </div>

    {/* Marca */}
    <FilterSection title="Marca">
      <div className="space-y-2">
        {marcas.map((m) => (
          <label key={m} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedMarcas.includes(m)}
              onChange={() => onToggleMarca(m)}
              className="w-4 h-4 accent-[#0f49bd] rounded cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#0f49bd] transition-colors">{m}</span>
          </label>
        ))}
      </div>
    </FilterSection>

    {/* Precio */}
    <FilterSection title="Precio">
      <div className="space-y-2 mb-3">
        {PRICE_RANGES.map((r, idx) => (
          <label key={idx} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name="precio"
              checked={selectedPriceRange === idx}
              onChange={() => onPriceRange(idx)}
              className="w-4 h-4 accent-[#0f49bd] cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#0f49bd] transition-colors">{r.label}</span>
          </label>
        ))}
        {selectedPriceRange !== null && (
          <button onClick={onClearPriceRange} className="text-xs text-[#0f49bd] hover:underline ml-6">
            Limpiar
          </button>
        )}
      </div>
      {/* Rango personalizado */}
      <div className="flex gap-2 items-center">
        <input
          type="number"
          placeholder="Mín."
          value={precioMinInput}
          onChange={(e) => onPrecioMinInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyPrecioPersonalizado()}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0f49bd]"
        />
        <span className="text-gray-400 text-xs flex-shrink-0">–</span>
        <input
          type="number"
          placeholder="Máx."
          value={precioMaxInput}
          onChange={(e) => onPrecioMaxInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onApplyPrecioPersonalizado()}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-[#0f49bd]"
        />
        <button
          onClick={onApplyPrecioPersonalizado}
          className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1.5 rounded text-xs font-medium transition-colors whitespace-nowrap"
        >
          Ok
        </button>
      </div>
    </FilterSection>

    {/* Color */}
    {colores.length > 0 && (
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2">
          {colores.map((c) => {
            const hex = getColorHex(c);
            const active = selectedColor === c;
            return (
              <button
                key={c}
                title={c}
                onClick={() => onColorChange(c)}
                className={`w-7 h-7 rounded-full border-2 transition-all hover:scale-110 ${
                  active
                    ? 'border-[#0f49bd] scale-110 ring-2 ring-blue-300'
                    : 'border-gray-300'
                }`}
                style={{ backgroundColor: hex }}
              />
            );
          })}
        </div>
        {selectedColor && (
          <button
            onClick={() => onColorChange(selectedColor)}
            className="text-xs text-[#0f49bd] hover:underline mt-2 block"
          >
            Limpiar color
          </button>
        )}
      </FilterSection>
    )}

    {/* Memoria */}
    {memorias.length > 0 && (
      <FilterSection title="Memoria">
        <div className="space-y-2">
          {memorias.map((m) => (
            <label key={m} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="radio"
                name="memoria"
                checked={selectedMemoria === m}
                onChange={() => onMemoriaChange(m)}
              className="w-4 h-4 accent-[#0f49bd] cursor-pointer"
            />
            <span className="text-sm text-gray-700 group-hover:text-[#0f49bd] transition-colors">{m}</span>
          </label>
        ))}
        {selectedMemoria && (
          <button onClick={() => onMemoriaChange(selectedMemoria)} className="text-xs text-[#0f49bd] hover:underline ml-6">
              Limpiar
            </button>
          )}
        </div>
      </FilterSection>
    )}

  </div>
);

// ── Helpers ───────────────────────────────────────────────────────────────────
const getBadgeStyle = (badge: string) => {
  const b = badge.toLowerCase();
  if (b.includes('promo') || b.includes('oferta') || b.includes('descuento')) return 'bg-green-100 text-green-800';
  if (b.includes('prev') || b.includes('nuevo')) return 'bg-blue-100 text-blue-800';
  return 'bg-yellow-100 text-yellow-800';
};

// ── Componente principal ───────────────────────────────────────────────────────
const Catalog = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [marcas, setMarcas] = useState<string[]>([]);
  const [colores, setColores] = useState<string[]>([]);
  const [memorias, setMemorias] = useState<string[]>([]);

  // Filtros aplicados — disparan fetch
  const [selectedMarcas, setSelectedMarcas] = useState<string[]>([]);
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedMemoria, setSelectedMemoria] = useState('');
  const [selectedPriceRange, setSelectedPriceRange] = useState<number | null>(null);
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('reciente');

  // Estados de escritura — solo UI, no disparan fetch
  const [searchInput, setSearchInput] = useState('');
  const [precioMinInput, setPrecioMinInput] = useState('');
  const [precioMaxInput, setPrecioMaxInput] = useState('');

  // Paginación
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const hasMore = products.length < total;

  // Selección de color/memoria por tarjeta (para el botón Reservar directo)
  const [cardSelection, setCardSelection] = useState<Record<string, { color: string; memoria: string }>>({});
  const navigate = useNavigate();

  const getCardColor = (productId: string) => cardSelection[productId]?.color ?? '';
  const getCardMemoria = (productId: string) => cardSelection[productId]?.memoria ?? '';
  const setCardColor = (productId: string, color: string) =>
    setCardSelection(prev => ({ ...prev, [productId]: { ...prev[productId], color, memoria: prev[productId]?.memoria ?? '' } }));
  const setCardMemoria = (productId: string, memoria: string) =>
    setCardSelection(prev => ({ ...prev, [productId]: { color: prev[productId]?.color ?? '', ...prev[productId], memoria } }));

  const handleReservar = (productId: string) => {
    const color = getCardColor(productId);
    const memoria = getCardMemoria(productId);
    const params = new URLSearchParams();
    if (color) params.set('color', color);
    if (memoria) params.set('memoria', memoria);
    const query = params.toString();
    navigate(`/reservar/${productId}${query ? `?${query}` : ''}`);
  };

  // UI móvil
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // ── Construir params ──────────────────────────────────────────────────────
  const buildParams = useCallback((
    currentPage: number,
    currentMarcas: string[],
    currentSearch: string,
    currentSort: string,
    currentColor: string,
    currentMemoria: string,
    currentPriceRange: number | null,
    currentPrecioMin: string,
    currentPrecioMax: string,
  ) => {
    const params: Record<string, string> = {
      page: String(currentPage),
      limit: String(PAGE_SIZE),
      sort: currentSort,
    };
    if (currentMarcas.length === 1) params.marca = currentMarcas[0];
    if (currentSearch) params.search = currentSearch;
    if (currentColor) params.color = currentColor;
    if (currentMemoria) params.memoria = currentMemoria;
    if (currentPriceRange !== null) {
      const range = PRICE_RANGES[currentPriceRange];
      params.precioMin = String(range.min);
      if (range.max !== undefined) params.precioMax = String(range.max);
    } else {
      if (currentPrecioMin) params.precioMin = currentPrecioMin;
      if (currentPrecioMax) params.precioMax = currentPrecioMax;
    }
    return params;
  }, []);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchProducts = useCallback(async (
    currentPage: number,
    currentMarcas: string[],
    currentSearch: string,
    currentSort: string,
    currentColor: string,
    currentMemoria: string,
    currentPriceRange: number | null,
    currentPrecioMin: string,
    currentPrecioMax: string,
    append: boolean,
  ) => {
    if (currentPage === 1) setLoading(true);
    else setLoadingMore(true);
    try {
      const params = buildParams(
        currentPage, currentMarcas, currentSearch, currentSort,
        currentColor, currentMemoria, currentPriceRange, currentPrecioMin, currentPrecioMax,
      );
      const res = await api.get('/products', { params });
      let newData: Product[] = res.data.data;
      const newTotal: number = res.data.pagination.total;
      // Filtro multi-marca en cliente
      if (currentMarcas.length > 1) {
        const lower = currentMarcas.map(m => m.toLowerCase());
        newData = newData.filter(p => lower.includes(p.marca.toLowerCase()));
      }
      setTotal(newTotal);
      setProducts(prev => append ? [...prev, ...newData] : newData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [buildParams]);

  // ── Cargar opciones de filtros ────────────────────────────────────────────
  useEffect(() => {
    api.get('/products/marcas').then(r => setMarcas(r.data.data)).catch(() => {});
    api.get('/products/colores').then(r => setColores(r.data.data)).catch(() => {});
    api.get('/products/memorias').then(r => setMemorias(r.data.data)).catch(() => {});
  }, []);

  // ── Recargar cuando cambian filtros aplicados ─────────────────────────────
  useEffect(() => {
    setPage(1);
    fetchProducts(1, selectedMarcas, search, sort, selectedColor, selectedMemoria,
      selectedPriceRange, precioMin, precioMax, false);
  }, [selectedMarcas, search, sort, selectedColor, selectedMemoria,
      selectedPriceRange, precioMin, precioMax]);

  // ── Scroll infinito ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          const nextPage = page + 1;
          setPage(nextPage);
          fetchProducts(nextPage, selectedMarcas, search, sort, selectedColor, selectedMemoria,
            selectedPriceRange, precioMin, precioMax, true);
        }
      },
      { threshold: 0.1 },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, page, selectedMarcas, search, sort,
      selectedColor, selectedMemoria, selectedPriceRange, precioMin, precioMax]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setSearch(searchInput); };

  const toggleMarca = (marca: string) =>
    setSelectedMarcas(prev => prev.includes(marca) ? prev.filter(m => m !== marca) : [...prev, marca]);

  const handlePriceRange = (idx: number) => {
    setSelectedPriceRange(prev => prev === idx ? null : idx);
    setPrecioMin(''); setPrecioMax('');
    setPrecioMinInput(''); setPrecioMaxInput('');
  };

  const handleApplyPrecioPersonalizado = () => {
    setSelectedPriceRange(null);
    setPrecioMin(precioMinInput);
    setPrecioMax(precioMaxInput);
  };

  const handleColorChange = (c: string) => setSelectedColor(prev => prev === c ? '' : c);

  const handleMemoriaChange = (m: string) => setSelectedMemoria(prev => prev === m ? '' : m);

  const clearFilters = () => {
    setSelectedMarcas([]); setSelectedColor(''); setSelectedMemoria('');
    setSelectedPriceRange(null);
    setPrecioMin(''); setPrecioMax('');
    setPrecioMinInput(''); setPrecioMaxInput('');
    setSearch(''); setSearchInput('');
  };

  const activeFiltersCount =
    selectedMarcas.length +
    (selectedColor ? 1 : 0) +
    (selectedMemoria ? 1 : 0) +
    (selectedPriceRange !== null || precioMin || precioMax ? 1 : 0) +
    (search ? 1 : 0);

  // Props del sidebar compartidas entre instancia desktop y móvil
  const sidebarProps: SidebarProps = {
    marcas, colores, memorias,
    selectedMarcas, selectedColor, selectedMemoria, selectedPriceRange,
    precioMinInput, precioMaxInput,
    searchInput,
    onSearchInputChange: setSearchInput,
    onSearchSubmit: handleSearch,
    onToggleMarca: toggleMarca,
    onPriceRange: handlePriceRange,
    onClearPriceRange: () => setSelectedPriceRange(null),
    onPrecioMinInputChange: setPrecioMinInput,
    onPrecioMaxInputChange: setPrecioMaxInput,
    onApplyPrecioPersonalizado: handleApplyPrecioPersonalizado,
    onColorChange: handleColorChange,
    onMemoriaChange: handleMemoriaChange,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 py-8">

      {/* Cabecera */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Catálogo de Equipos</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Cargando...' : `${total} celular${total !== 1 ? 'es' : ''} disponible${total !== 1 ? 's' : ''}`}
        </p>
      </div>

      {/* Barra superior: chips activos + ordenamiento */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2 flex-wrap">

          {/* Botón abrir sidebar en móvil */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <IconFilter />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="bg-[#0f49bd] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
                {activeFiltersCount}
              </span>
            )}
          </button>

          {/* Chips de filtros activos */}
          {selectedMarcas.map(m => (
            <span key={m} className="inline-flex items-center gap-1 bg-blue-50 text-[#0f49bd] text-xs px-2.5 py-1 rounded-full border border-blue-100">
              {m}
              <button onClick={() => toggleMarca(m)} className="hover:text-[#002f87]"><IconX /></button>
            </span>
          ))}
          {selectedColor && (
            <span className="inline-flex items-center gap-1.5 bg-blue-50 text-[#0f49bd] text-xs px-2.5 py-1 rounded-full border border-blue-100">
              <span className="w-3 h-3 rounded-full inline-block border border-white/50" style={{ backgroundColor: getColorHex(selectedColor) }} />
              {selectedColor}
              <button onClick={() => setSelectedColor('')} className="hover:text-[#002f87]"><IconX /></button>
            </span>
          )}
          {selectedMemoria && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0f49bd] text-xs px-2.5 py-1 rounded-full border border-blue-100">
              {selectedMemoria}
              <button onClick={() => setSelectedMemoria('')} className="hover:text-[#002f87]"><IconX /></button>
            </span>
          )}
          {selectedPriceRange !== null && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0f49bd] text-xs px-2.5 py-1 rounded-full border border-blue-100">
              {PRICE_RANGES[selectedPriceRange].label}
              <button onClick={() => setSelectedPriceRange(null)} className="hover:text-[#002f87]"><IconX /></button>
            </span>
          )}
          {(precioMin || precioMax) && selectedPriceRange === null && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0f49bd] text-xs px-2.5 py-1 rounded-full border border-blue-100">
              ${precioMin || '0'} – ${precioMax || '∞'}
              <button onClick={() => { setPrecioMin(''); setPrecioMax(''); setPrecioMinInput(''); setPrecioMaxInput(''); }} className="hover:text-[#002f87]">
                <IconX />
              </button>
            </span>
          )}
          {search && (
            <span className="inline-flex items-center gap-1 bg-blue-50 text-[#0f49bd] text-xs px-2.5 py-1 rounded-full border border-blue-100">
              "{search}"
              <button onClick={() => { setSearch(''); setSearchInput(''); }} className="hover:text-[#002f87]"><IconX /></button>
            </span>
          )}
          {activeFiltersCount > 0 && (
            <button onClick={clearFilters} className="text-xs text-gray-400 hover:text-red-500 underline transition-colors ml-1">
              Limpiar todo
            </button>
          )}
        </div>

        {/* Ordenamiento */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0f49bd] bg-white self-start sm:self-auto flex-shrink-0"
        >
          <option value="reciente">Más recientes</option>
          <option value="precio_asc">Menor precio</option>
          <option value="precio_desc">Mayor precio</option>
          <option value="nombre_asc">Nombre A–Z</option>
        </select>
      </div>

      {/* Layout: sidebar + grid */}
      <div className="flex gap-6">

        {/* Sidebar desktop */}
        <aside className="hidden lg:block w-56 xl:w-64 flex-shrink-0">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800 text-sm">Filtrar por</h2>
              {activeFiltersCount > 0 && (
                <button onClick={clearFilters} className="text-xs text-[#0f49bd] hover:underline">
                  Limpiar
                </button>
              )}
            </div>
            <SidebarContent {...sidebarProps} />
          </div>
        </aside>

        {/* Sidebar móvil (drawer) */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 flex-shrink-0">
                <h2 className="font-semibold text-gray-800">Filtrar por</h2>
                <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <IconX />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4">
                <SidebarContent {...sidebarProps} />
              </div>
              <div className="p-4 border-t border-gray-100 flex-shrink-0">
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="w-full bg-[#0f49bd] text-white py-3 rounded-xl font-semibold text-sm hover:bg-[#002f87] transition-colors"
                >
                  Ver {total} resultado{total !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Grid de productos */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              <Skeletons count={PAGE_SIZE} />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <p className="text-5xl mb-4">📱</p>
              <p className="text-lg font-medium mb-1 text-gray-600">Sin resultados</p>
              <p className="text-sm">Intenta con otros filtros o búsqueda</p>
              <button onClick={clearFilters} className="mt-4 text-sm text-[#0f49bd] underline hover:no-underline">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((product) => {
                  const unavailable = product.stock === 0;
                  return (
                    <div
                      key={product.id}
                      className={`bg-white rounded-xl shadow-sm hover:shadow-md transition-all border border-gray-100 flex flex-col overflow-hidden ${unavailable ? 'opacity-70' : ''}`}
                    >
                      {product.badge && (
                        <div className="px-3 pt-3 pb-0">
                          <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full ${getBadgeStyle(product.badge)}`}>
                            {product.badge}
                          </span>
                        </div>
                      )}

                      <div className="relative flex items-center justify-center bg-gray-50 h-44 mx-3 mt-2 rounded-lg overflow-hidden">
                        {product.imagenes && product.imagenes.length > 0 ? (
                          <img
                            src={toImageUrl(product.imagenes[0])}
                            alt={product.nombre}
                            className="h-36 w-36 object-contain drop-shadow-sm"
                            loading="lazy"
                          />
                        ) : (
                          <span className="text-5xl">📱</span>
                        )}
                        {unavailable && (
                          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                            <span className="bg-red-100 text-red-700 text-xs font-semibold px-3 py-1 rounded-full">Sin stock</span>
                          </div>
                        )}
                      </div>

                      <div className="p-3 flex flex-col flex-1">
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">
                          {product.marca} | {product.sku}
                        </p>
                        <h3 className="font-bold text-gray-900 text-sm leading-snug mb-2 line-clamp-2">
                          {product.nombre}
                        </h3>

                        {/* Selector de color */}
                        {product.colores && product.colores.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] text-gray-400 mb-1">Color</p>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {product.colores.map((c) => {
                                const selected = getCardColor(product.id) === c;
                                return (
                                  <button
                                    key={c}
                                    title={c}
                                    onClick={() => setCardColor(product.id, selected ? '' : c)}
                                    className={`w-5 h-5 rounded-full border-2 flex-shrink-0 transition-all ${selected ? 'border-[#0f49bd] scale-110 shadow-md' : 'border-gray-300 hover:border-gray-400'}`}
                                    style={{ backgroundColor: getColorHex(c) }}
                                  />
                                );
                              })}
                            </div>
                            {getCardColor(product.id) && (
                              <p className="text-[10px] text-[#0f49bd] mt-0.5 capitalize">{getCardColor(product.id)}</p>
                            )}
                          </div>
                        )}

                        {/* Selector de memoria */}
                        {product.memorias && product.memorias.length > 0 && (
                          <div className="mb-2">
                            <p className="text-[10px] text-gray-400 mb-1">Almacenamiento</p>
                            <div className="flex items-center gap-1 flex-wrap">
                              {product.memorias.map((m) => {
                                const selected = getCardMemoria(product.id) === m;
                                return (
                                  <button
                                    key={m}
                                    onClick={() => setCardMemoria(product.id, selected ? '' : m)}
                                    className={`text-[10px] px-2 py-0.5 rounded border font-medium transition-all ${selected ? 'bg-[#0f49bd] text-white border-[#0f49bd]' : 'border-gray-300 text-gray-600 hover:border-[#0f49bd] hover:text-[#0f49bd]'}`}
                                  >
                                    {m}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        <div className="mb-1.5">
                          <p className="text-[10px] text-gray-500 mb-0.5">En Amigo Kit desde</p>
                          <div className="flex items-baseline gap-2 flex-wrap">
                            <span className="text-lg font-bold text-[#0f49bd]">{formatPrice(product.precio)}</span>
                            {product.precioAnterior && (
                              <span className="text-xs text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>
                            )}
                          </div>
                          {product.disponibleCredito && product.pagosSemanales && (
                            <p className="text-[10px] text-gray-500 mt-0.5">
                              o en pagos de {formatPrice(product.pagosSemanales)}/semana a crédito
                            </p>
                          )}
                        </div>

                        {product.precioAnterior && (
                          <div className="flex items-center gap-1.5 text-[10px] text-gray-500 mb-2 bg-gray-50 rounded px-2 py-1">
                            <IconTruck />
                            Envío gratis
                          </div>
                        )}

                        <div className="mt-auto pt-2 flex flex-col gap-2">
                          {!unavailable ? (
                            <button
                              onClick={() => handleReservar(product.id)}
                              className="w-full text-center bg-[#0f49bd] hover:bg-[#002f87] text-white py-2.5 rounded-lg text-sm font-bold transition-colors"
                            >
                              Reservar
                            </button>
                          ) : (
                            <button disabled className="w-full bg-gray-200 text-gray-400 py-2.5 rounded-lg text-sm font-bold cursor-not-allowed">
                              Sin stock
                            </button>
                          )}
                          <Link
                            to={`/producto/${product.id}`}
                            className="w-full text-center border border-gray-300 text-gray-600 py-2 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                          >
                            Ver detalle
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loadingMore && <Skeletons count={3} />}
              </div>

              <div ref={sentinelRef} className="h-10 mt-4" />

              {!hasMore && !loading && (
                <p className="text-center text-gray-400 text-sm mt-6 pb-4">
                  Mostrando todos los {total} producto{total !== 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Catalog;
