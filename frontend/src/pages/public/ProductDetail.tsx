import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { showError, toast } from '../../utils/notifications';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';
import { useCarritoStore } from '../../store/carrito.store';
import type { Product } from '../../types';

const COLOR_MAP: Record<string, string> = {
  negro: '#1a1a1a', blanco: '#f5f5f5', plata: '#C0C0C0', gris: '#808080',
  azul: '#2563eb', 'azul oscuro': '#1e3a8a', 'azul claro': '#60a5fa',
  verde: '#16a34a', 'verde menta': '#6ee7b7', morado: '#7c3aed',
  rojo: '#dc2626', rosa: '#ec4899', dorado: '#d97706', amarillo: '#eab308',
  naranja: '#ea580c', titanio: '#a0a098', 'titanio negro': '#3a3a3a',
  'titanio natural': '#a0a098', beige: '#d4b896', café: '#92400e', cafe: '#92400e',
};

const getColorHex = (c: string) => COLOR_MAP[c.toLowerCase()] ?? '#9ca3af';

const getImageForColor = (imagenes: string[], colores: string[] | undefined, color: string | null): string => {
  // Si no hay imagenes, devolver vacío
  if (!imagenes || imagenes.length === 0) {
    return '';
  }
  
  // Si hay un color seleccionado, buscar imagen que coincida con ese color
  if (color && imagenes.length > 0) {
    const colorLower = color.toLowerCase();
    const matchingImage = imagenes.find(img => 
      img.toLowerCase().includes(colorLower)
    );
    return matchingImage || imagenes[0]; // fallback a primera imagen
  }
  
  // Si no hay color seleccionado pero sí hay colores definidos, usar la imagen del primer color
  if (colores && colores.length > 0 && imagenes.length > 0) {
    const primerColor = colores[0];
    const colorLower = primerColor.toLowerCase();
    const matchingImage = imagenes.find(img => 
      img.toLowerCase().includes(colorLower)
    );
    return matchingImage || imagenes[0]; // fallback a primera imagen
  }
  
  // Caso por defecto: devolver la primera imagen
  return imagenes[0];
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedMemoria, setSelectedMemoria] = useState<string | null>(null);
  const [tipoPago, setTipoPago] = useState<'CONTADO' | 'CREDITO'>('CONTADO');
  
  const { agregarAlCarrito, contarProductosCredito } = useCarritoStore();

   const [colorInitialized, setColorInitialized] = useState(false);
   
   useEffect(() => {
     if (!id) return;
     setLoading(true);
     api.get(`/products/${id}`)
       .then((r) => {
         setProduct(r.data.data);
         setActiveImage(0);
         // Seleccionar automáticamente el primer color disponible si no hay uno seleccionado
         if (r.data.data.colores && r.data.data.colores.length > 0 && !selectedColor && !colorInitialized) {
           setSelectedColor(r.data.data.colores[0]);
           setColorInitialized(true);
         }
       })
       .catch(() => navigate('/catalogo'))
       .finally(() => setLoading(false));
   }, [id]); // Eliminado selectedColor de dependencias para evitar bucles infinitos

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);
  
  const handleAgregarAlCarrito = () => {
    if (!product) return;
    
    // Validar: Solo 1 producto a crédito permitido
    if (tipoPago === 'CREDITO' && contarProductosCredito() > 0) {
      showError('Solo puedes agregar un producto a crédito por reserva');
      return;
    }
    
    agregarAlCarrito({
      productId: product.id,
      nombre: product.nombre,
      marca: product.marca,
      precio: product.precio,
      imagen: product.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : undefined,
      color: selectedColor || undefined,
      memoria: selectedMemoria || undefined,
      tipoPago,
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
    
    // Resetear selecciones
    setSelectedColor(null);
    setSelectedMemoria(null);
    setTipoPago('CONTADO');
  };

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
                src={toImageUrl(getImageForColor(imagenes, product.colores, selectedColor))}
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
            <p className="text-sm font-medium text-gray-700 mb-2">Precio al contado</p>
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-extrabold text-[#002f87]">{formatPrice(product.precio)}</span>
              {product.precioAnterior && (
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>
              )}
            </div>
            {product.disponibleCredito && (product.pagoSemanal || product.enganche) && (
              <div className="mt-3">
                <p className="text-sm font-medium text-gray-700 mb-2">A crédito</p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 inline-block">
                  <div className="text-sm text-[#0f49bd]">
                    {product.enganche && (
                      <p className="mb-1">
                        <span className="font-bold">💰</span> {product.enganche}
                      </p>
                    )}
                    {product.pagoSemanal && (
                      <p>
                        <span className="font-bold">📅</span> {product.pagoSemanal}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Disponibilidad */}
          <div className="mb-6">
            {product.stock > 0 ? (
              <span className="text-green-600 text-sm font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                Disponible
              </span>
            ) : (
              <span className="text-red-600 text-sm font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                No disponible por el momento
              </span>
            )}
          </div>

          {/* Selector de colores */}
          {product.colores && product.colores.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Color: {selectedColor && <span className="font-normal text-gray-500">{selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colores.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => setSelectedColor(selectedColor === c ? null : c)}
                    className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === c ? 'border-[#0f49bd] ring-2 ring-blue-300 scale-110' : 'border-gray-300'}`}
                    style={{ backgroundColor: getColorHex(c) }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selector de memorias */}
          {product.memorias && product.memorias.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Almacenamiento: {selectedMemoria && <span className="font-normal text-gray-500">{selectedMemoria}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.memorias.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMemoria(selectedMemoria === m ? null : m)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${selectedMemoria === m ? 'bg-[#0f49bd] text-white border-[#0f49bd]' : 'bg-white text-gray-700 border-gray-300 hover:border-[#0f49bd]'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de tipo de pago */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 mb-2">Forma de pago</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setTipoPago('CONTADO')}
                className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                  tipoPago === 'CONTADO'
                    ? 'bg-[#0f49bd] text-white border-[#0f49bd]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[#0f49bd]'
                }`}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-lg">💵</span>
                  <span>Contado</span>
                  <span className="text-xs opacity-90">{formatPrice(product.precio)}</span>
                </div>
              </button>
              {product.disponibleCredito && (
                <button
                  type="button"
                  onClick={() => setTipoPago('CREDITO')}
                  className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium border-2 transition-all ${
                    tipoPago === 'CREDITO'
                      ? 'bg-[#0f49bd] text-white border-[#0f49bd]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[#0f49bd]'
                  }`}
                  disabled={contarProductosCredito() > 0}
                  title={contarProductosCredito() > 0 ? 'Ya tienes un producto a crédito en el carrito' : ''}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg">📊</span>
                    <span>A crédito</span>
                    {product.pagoSemanal && (
                      <span className="text-xs opacity-90 whitespace-nowrap">
                        {product.pagoSemanal}
                      </span>
                    )}
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-3">
            <button
              onClick={handleAgregarAlCarrito}
              disabled={unavailable}
              className={`flex-1 py-3.5 rounded-xl font-bold text-center text-base transition-all shadow-md flex items-center justify-center gap-2 ${
                unavailable
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-[#13ec6d] text-[#002f87] hover:bg-green-400'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {unavailable ? 'Sin disponibilidad' : 'Agregar al carrito'}
            </button>
            <Link
              to="/carrito"
              className="border-2 border-[#0f49bd] text-[#0f49bd] px-5 py-3.5 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ver carrito
            </Link>
          </div>
          
          <p className="mt-3 text-xs text-gray-500 text-center">
            💡 Puedes agregar más productos antes de confirmar tu reserva
          </p>
        </div>
      </div>

      {/* Pestaña de Características */}
      {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
        <div className="mt-12 bg-white">
          {/* Encabezado de pestaña */}
          <div className="border-b border-gray-200">
            <button className="inline-flex items-center gap-2 px-4 py-3 border-b-2 border-[#0f49bd] text-[#0f49bd] font-semibold text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Características
            </button>
          </div>

          {/* Contenido de características */}
          <div className="py-8 px-4 sm:px-6">
            <h3 className="text-xl font-bold text-gray-700 mb-8 text-center">Características y especificaciones</h3>
            
            {/* Grid de especificaciones principales */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-6 mb-8 max-w-5xl mx-auto">
              {Object.entries(product.especificaciones).map(([key, value]) => {
                const keyLower = key.toLowerCase();
                let icon = null;
                
                // Iconos según el tipo de especificación
                if (keyLower.includes('red')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  );
                } else if (keyLower.includes('pantalla') || keyLower.includes('display')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  );
                } else if (keyLower.includes('memoria') || keyLower.includes('almacen') || keyLower.includes('ram')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  );
                } else if (keyLower.includes('cámara') || keyLower.includes('camara')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  );
                } else if (keyLower.includes('procesador') || keyLower.includes('cpu') || keyLower.includes('chip')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  );
                } else if (keyLower.includes('sistema') || keyLower.includes('os') || keyLower.includes('operativo')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  );
                } else if (keyLower.includes('conexi') || keyLower.includes('inalám')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0" />
                    </svg>
                  );
                } else if (keyLower.includes('bater')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v1m0 16v1m9-9h1M3 12h1m13.28-7.636l.707.707M5.636 5.636l.707.707m12.02 12.02l.707.707M5.636 18.364l.707.707M17 12a5 5 0 11-10 0 5 5 0 0110 0z" />
                    </svg>
                  );
                } else if (keyLower.includes('dimension')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  );
                } else if (keyLower.includes('peso')) {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  );
                } else {
                  icon = (
                    <svg className="w-6 h-6 text-[#0f49bd]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                }

                return (
                  <div key={key} className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-800 mb-1">{key}</h4>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Descripción adicional si existe */}
            {product.descripcion && (
              <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-100 max-w-5xl mx-auto">
                <p className="text-sm text-gray-700 leading-relaxed">{product.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
