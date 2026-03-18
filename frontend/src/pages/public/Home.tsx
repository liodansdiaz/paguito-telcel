import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import { useCarritoStore } from '../../store/carrito.store';
import type { Product } from '../../types';

const formatPrice = (p: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(p);

const COLOR_MAP: Record<string, string> = {
  negro: '#1a1a1a', blanco: '#f5f5f5', plata: '#C0C0C0', gris: '#808080',
  azul: '#2563eb', 'azul oscuro': '#1e3a8a', 'azul claro': '#60a5fa',
  verde: '#16a34a', 'verde menta': '#6ee7b7', morado: '#7c3aed',
  rojo: '#dc2626', rosa: '#ec4899', dorado: '#d97706', amarillo: '#eab308',
  naranja: '#ea580c', titanio: '#a0a098', 'titanio negro': '#3a3a3a',
  'titanio natural': '#a0a098', beige: '#d4b896', café: '#92400e', cafe: '#92400e',
};
const getColorHex = (c: string) => COLOR_MAP[c.toLowerCase()] ?? '#9ca3af';

// ─── Íconos ──────────────────────────────────────────────────────────────────
const IconEye = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const IconCart = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1" />
    <circle cx="20" cy="21" r="1" />
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
  </svg>
);

const IconHeart = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const IconStar = ({ filled = false }: { filled?: boolean }) => (
  <svg className="w-3 h-3" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

type CardVariant = 'original' | 'compact' | 'premium' | 'minimal' | 'horizontal' | 'hybrid';

// ─── Tarjeta de producto reutilizable ────────────────────────────────────────
const ProductCard = ({ product, variant = 'original' }: { product: Product; variant?: CardVariant }) => {
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarritoStore();
  const imagen = product.imagenes && product.imagenes.length > 0
    ? toImageUrl(product.imagenes[0])
    : null;

  /**
   * Función inteligente de reserva:
   * - Si el producto tiene opciones (color/memoria) → redirige a ProductDetail
   * - Si no tiene opciones → agrega directo al carrito
   */
  const handleReservar = () => {
    const tieneColores = product.colores && product.colores.length > 0;
    const tieneMemorias = product.memorias && product.memorias.length > 0;

    // Si tiene opciones, redirigir a detalle para que el usuario seleccione
    if (tieneColores || tieneMemorias) {
      navigate(`/producto/${product.id}`);
      return;
    }

    // Agregar al carrito directamente
    try {
      agregarAlCarrito({
        productId: product.id,
        nombre: product.nombre,
        marca: product.marca,
        precio: product.precio,
        imagen: product.imagenes?.[0],
        tipoPago: 'CONTADO', // Default, el usuario puede cambiarlo en el carrito
      });

      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>✅ {product.nombre} agregado al carrito</span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                navigate('/carrito');
              }}
              className="bg-[#0f49bd] text-white px-3 py-1 rounded text-sm font-medium hover:bg-[#002f87] transition-colors"
            >
              Ver carrito
            </button>
          </div>
        ),
        { duration: 4000 }
      );
    } catch (error: any) {
      toast.error(error.message || 'Error al agregar al carrito');
    }
  };

  // Helpers para parsear pagos
  const parsePagos = (text: string) => {
    const engancheMatch = text.match(/Enganche:\s*([^P]+)/);
    const pagosMatch = text.match(/Pagos semanales:\s*(.+)/);
    return { enganche: engancheMatch?.[1]?.trim(), pagos: pagosMatch?.[1]?.trim() };
  };

  // VARIANT 1: ORIGINAL (diseño actual)
  if (variant === 'original') {
    return (
      <div className="bg-white rounded-2xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100 flex flex-col">
        <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 h-44 flex items-center justify-center">
          {imagen ? <img src={imagen} alt={product.nombre} className="h-36 w-36 object-contain" /> : <span className="text-5xl">📱</span>}
        </div>
        <div className="p-4 flex flex-col flex-1">
          <p className="text-xs text-gray-400 font-medium mb-0.5">{product.marca}</p>
          <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">{product.nombre}</h3>
          <span className="text-lg font-bold text-[#002f87] mb-3">{formatPrice(product.precio)}</span>
          <div className="flex gap-2 mt-auto">
            <button onClick={handleReservar} className="flex-1 bg-[#13ec6d] text-[#002f87] py-2.5 px-2 rounded-xl text-xs font-bold">Reservar</button>
            <Link to={`/producto/${product.id}`} className="flex-1 border border-[#0f49bd] text-[#0f49bd] py-2.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"><IconEye />Detalles</Link>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 2: COMPACT (compacto y moderno)
  if (variant === 'compact') {
    const { enganche } = parsePagos(String(product.pagosSemanales || ''));
    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden border border-gray-100">
        <div className="relative bg-gray-50 h-36 flex items-center justify-center">
          {product.precioAnterior && <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded">PROMO</span>}
          {imagen ? <img src={imagen} alt={product.nombre} className="h-28 w-28 object-contain" /> : <span className="text-4xl">📱</span>}
        </div>
        <div className="p-3">
          <p className="text-[9px] text-gray-400 uppercase tracking-wide">{product.marca} | {product.sku}</p>
          <h3 className="font-bold text-gray-900 text-xs mb-2 line-clamp-1">{product.nombre}</h3>
          {product.colores && product.colores.length > 0 && (
            <div className="flex gap-1.5 mb-2 items-center">
              {product.colores.slice(0, 3).map((c, i) => <div key={i} className="w-5 h-5 rounded-full border-2 border-gray-300" style={{ backgroundColor: getColorHex(c) }} />)}
              {product.memorias && <span className="text-[9px] text-gray-500 ml-1">{product.memorias[0]}</span>}
            </div>
          )}
          <div className="mb-2">
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[#0f49bd]">{formatPrice(product.precio)}</span>
              {product.precioAnterior && <span className="text-[10px] text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>}
            </div>
            {enganche && <p className="text-[9px] text-gray-500">💵 Contado • 📊 Desde {enganche} enganche</p>}
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={handleReservar} className="bg-[#0f49bd] text-white py-2 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><IconCart />Reservar</button>
            <Link to={`/producto/${product.id}`} className="border border-gray-300 text-gray-700 py-2 rounded-lg text-[10px] font-medium flex items-center justify-center gap-1"><IconEye />Ver</Link>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 3: PREMIUM (tipo Amazon)
  if (variant === 'premium') {
    return (
      <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200">
        <div className="relative bg-white h-48 flex items-center justify-center group">
          <button className="absolute top-3 right-3 bg-white rounded-full p-2 shadow-md hover:bg-red-50 transition-colors"><IconHeart /></button>
          {product.badge && <span className="absolute top-3 left-3 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-full">{product.badge}</span>}
          {imagen ? <img src={imagen} alt={product.nombre} className="h-40 w-40 object-contain group-hover:scale-105 transition-transform" /> : <span className="text-5xl">📱</span>}
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between mb-1">
            <h3 className="font-bold text-gray-900 text-sm flex-1">{product.nombre}</h3>
            <span className="text-[9px] text-gray-400 ml-2">{product.sku}</span>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1,2,3,4,5].map(i => <IconStar key={i} filled={i <= 4} />)}
            <span className="text-[10px] text-gray-500 ml-1">(120)</span>
          </div>
          <div className="mb-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-[#0f49bd]">{formatPrice(product.precio)}</span>
              {product.precioAnterior && <span className="text-sm text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>}
            </div>
          </div>
          {product.colores && product.colores.length > 0 && (
            <div className="flex gap-1.5 mb-3 items-center">
              <span className="text-[10px] text-gray-600">Color:</span>
              {product.colores.slice(0, 4).map((c, i) => <div key={i} className="w-6 h-6 rounded-full border-2 border-gray-300 hover:border-[#0f49bd] cursor-pointer" style={{ backgroundColor: getColorHex(c) }} />)}
            </div>
          )}
          {product.disponibleCredito && <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-3"><p className="text-[10px] text-blue-700">💳 Opciones de pago: Contado o crédito disponible</p></div>}
          <button onClick={handleReservar} className="w-full bg-[#0f49bd] hover:bg-[#002f87] text-white py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 mb-2"><IconCart />Agregar al carrito</button>
          <Link to={`/producto/${product.id}`} className="block text-center text-[#0f49bd] text-xs hover:underline">Ver detalles completos</Link>
        </div>
      </div>
    );
  }

  // VARIANT 4: MINIMAL (minimalista escandinavo)
  if (variant === 'minimal') {
    return (
      <div className="bg-white rounded-3xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-50">
        <div className="bg-gray-50 h-52 flex items-center justify-center p-6">
          {imagen ? <img src={imagen} alt={product.nombre} className="h-full w-full object-contain" /> : <span className="text-6xl">📱</span>}
        </div>
        <div className="p-6 text-center">
          <h3 className="font-bold text-gray-900 text-base mb-2">{product.nombre}</h3>
          <p className="text-3xl font-bold text-gray-900 mb-3">{formatPrice(product.precio)}</p>
          {product.colores && product.colores.length > 0 && (
            <div className="flex gap-2 justify-center mb-3">
              {product.colores.slice(0, 4).map((c, i) => <div key={i} className="w-7 h-7 rounded-full border border-gray-200" style={{ backgroundColor: getColorHex(c) }} />)}
            </div>
          )}
          {product.disponibleCredito && <span className="inline-block bg-gray-100 text-gray-700 text-[10px] font-medium px-3 py-1 rounded-full mb-4">📊 A crédito disponible</span>}
          <div className="flex gap-3">
            <button onClick={handleReservar} className="flex-1 bg-gray-900 hover:bg-gray-800 text-white py-3 rounded-2xl text-sm font-medium">Agregar</button>
            <Link to={`/producto/${product.id}`} className="flex-1 border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white py-3 rounded-2xl text-sm font-medium flex items-center justify-center transition-colors">Detalles</Link>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 5: HORIZONTAL (lista horizontal)
  if (variant === 'horizontal') {
    return (
      <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex overflow-hidden h-28">
        <div className="bg-gray-50 w-28 flex-shrink-0 flex items-center justify-center">
          {imagen ? <img src={imagen} alt={product.nombre} className="h-20 w-20 object-contain" /> : <span className="text-4xl">📱</span>}
        </div>
        <div className="flex-1 p-3 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-xs line-clamp-1 mb-0.5">{product.nombre}</h3>
            <p className="text-[9px] text-gray-400">{product.marca}</p>
          </div>
          <div className="flex items-center gap-2">
            {product.colores && product.colores.length > 0 && <div className="flex gap-1">{product.colores.slice(0, 3).map((c, i) => <div key={i} className="w-4 h-4 rounded-full border border-gray-300" style={{ backgroundColor: getColorHex(c) }} />)}</div>}
            <span className="text-[9px] text-gray-500">{product.stock > 0 ? 'Disponible' : 'Sin stock'}</span>
          </div>
        </div>
        <div className="w-32 flex-shrink-0 p-3 flex flex-col justify-between items-end border-l border-gray-100">
          <span className="text-lg font-bold text-[#0f49bd]">{formatPrice(product.precio)}</span>
          {product.disponibleCredito && <p className="text-[8px] text-gray-500">💳 Crédito</p>}
          <div className="flex gap-1">
            <button onClick={handleReservar} className="bg-[#0f49bd] text-white p-2 rounded-lg hover:bg-[#002f87]"><IconCart /></button>
            <Link to={`/producto/${product.id}`} className="border border-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-50"><IconEye /></Link>
          </div>
        </div>
      </div>
    );
  }

  // VARIANT 6: HYBRID (recomendada)
  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border border-gray-100">
      <div className="relative bg-gradient-to-br from-blue-50 to-gray-50 h-44 flex items-center justify-center">
        {product.precioAnterior && <span className="absolute top-2 left-2 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg">-{Math.round((1 - product.precio / product.precioAnterior) * 100)}%</span>}
        {imagen ? <img src={imagen} alt={product.nombre} className="h-36 w-36 object-contain drop-shadow-lg" /> : <span className="text-5xl">📱</span>}
      </div>
      <div className="p-4">
        <p className="text-[9px] text-gray-400 uppercase tracking-wider mb-1">{product.marca} | {product.sku}</p>
        <h3 className="font-bold text-gray-900 text-sm mb-3 line-clamp-2 leading-tight">{product.nombre}</h3>
        {product.colores && product.colores.length > 0 && product.memorias && product.memorias.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-[10px] text-gray-600">
            <div className="flex gap-1">{product.colores.slice(0, 3).map((c, i) => <div key={i} className="w-5 h-5 rounded-full border-2 border-gray-300" style={{ backgroundColor: getColorHex(c) }} />)}</div>
            <span>•</span>
            <span>{product.memorias[0]}</span>
          </div>
        )}
        <div className="mb-3">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-2xl font-extrabold text-[#0f49bd]">{formatPrice(product.precio)}</span>
            {product.precioAnterior && <span className="text-xs text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>}
          </div>
          {product.disponibleCredito && <p className="text-[10px] text-gray-600">💳 Desde <span className="font-semibold">${product.pagosSemanales?.toString().match(/\$?\d+/)?.[0] || '350'}</span> enganche</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={handleReservar} className="bg-[#0f49bd] hover:bg-[#002f87] text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"><IconCart />Reservar</button>
          <Link to={`/producto/${product.id}`} className="border-2 border-[#0f49bd] text-[#0f49bd] hover:bg-blue-50 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"><IconEye />Detalles</Link>
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
      comentario: 'Ya llevo dos celulares con Amigo Paguitos Telcel. El trato es muy bueno, los precios justos y los pagos semanales se ajustan perfecto a mi presupuesto.',
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

      {/* ── 1. HERO MEJORADO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#002f87] via-[#0f49bd] to-[#002f87]">
        
        {/* ═══ Pattern Geométrico Abstracto ═══ */}
        <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="geometric-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
              {/* Hexágonos */}
              <path 
                d="M25 10 L40 19 L40 35 L25 44 L10 35 L10 19 Z" 
                fill="none" 
                stroke="white" 
                strokeWidth="1" 
                opacity="0.3"
              />
              {/* Círculos */}
              <circle cx="75" cy="25" r="15" fill="white" opacity="0.1"/>
              <circle cx="15" cy="75" r="10" fill="white" opacity="0.15"/>
              {/* Diamantes */}
              <path 
                d="M60 70 L75 60 L90 70 L75 80 Z" 
                fill="white" 
                opacity="0.15"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#geometric-pattern)" />
        </svg>
        
        {/* ═══ Dots Pattern ═══ */}
        <div 
          className="absolute inset-0 opacity-[0.08]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />
        
        {/* ═══ Formas Flotantes con Blur ═══ */}
        <div className="absolute top-20 right-10 w-64 h-64 bg-[#13ec6d] rounded-full opacity-10 blur-3xl animate-float-slow" />
        <div className="absolute bottom-20 left-10 w-96 h-96 bg-white rounded-full opacity-5 blur-3xl animate-float-slower" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#0f49bd] rounded-full opacity-15 blur-2xl animate-float" />
        
        {/* ═══ Contenido Principal ═══ */}
        <div className="relative z-10 text-white py-20 px-4">
          <div className="max-w-4xl mx-auto text-center animate-fade-in-up">
            
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
        </div>
        
        {/* ═══ Wave Divisor al Final ═══ */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg 
            className="relative block w-full h-16" 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 1440 120"
            preserveAspectRatio="none"
          >
            <path 
              fill="white" 
              d="M0,64L48,69.3C96,75,192,85,288,80C384,75,480,53,576,48C672,43,768,53,864,58.7C960,64,1056,64,1152,58.7C1248,53,1344,43,1392,37.3L1440,32L1440,120L1392,120C1344,120,1248,120,1152,120C1056,120,960,120,864,120C768,120,672,120,576,120C480,120,384,120,288,120C192,120,96,120,48,120L0,120Z"
            />
          </svg>
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
                ? populares.map((p, index) => {
                    const variants: CardVariant[] = ['original', 'compact', 'premium', 'minimal', 'horizontal', 'hybrid'];
                    return <ProductCard key={p.id} product={p} variant={variants[index % 6]} />;
                  })
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
                : ofertas.map((p, index) => {
                    const variants: CardVariant[] = ['hybrid', 'compact', 'premium', 'minimal', 'original', 'horizontal'];
                    return <ProductCard key={p.id} product={p} variant={variants[index % 6]} />;
                  })
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
