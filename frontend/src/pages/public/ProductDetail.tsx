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
    // Dividir el color en palabras (ej: "Azul Oscuro" -> ["azul", "oscuro"])
    const colorWords = colorLower.split(/\s+/);
    
    // Buscar imagen que contenga CUALQUIER palabra del color
    const matchingImage = imagenes.find(img => {
      const imgLower = img.toLowerCase();
      return colorWords.some(word => imgLower.includes(word));
    });
    return matchingImage || imagenes[0]; // fallback a primera imagen
  }
  
  // Si no hay color seleccionado pero sí hay colores definidos, usar la imagen del primer color
  if (colores && colores.length > 0 && imagenes.length > 0) {
    const primerColor = colores[0];
    const colorLower = primerColor.toLowerCase();
    const colorWords = colorLower.split(/\s+/);
    
    const matchingImage = imagenes.find(img => {
      const imgLower = img.toLowerCase();
      return colorWords.some(word => imgLower.includes(word));
    });
    return matchingImage || imagenes[0]; // fallback a primera imagen
  }
  
  // Caso por defecto: devolver la primera imagen
  return imagenes[0];
};

// Función para detectar el color de una imagen basándose en su nombre
const detectColorFromImage = (imagen: string, coloresDisponibles: string[]): string | null => {
  const imagenLower = imagen.toLowerCase();
  for (const color of coloresDisponibles) {
    if (imagenLower.includes(color.toLowerCase())) {
      return color;
    }
  }
  return null;
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
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const { agregarAlCarrito, contarProductosCredito } = useCarritoStore();

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    api.get(`/products/${id}`)
      .then((r) => {
        const prod = r.data.data;
        setProduct(prod);
        
        // Auto-seleccionar primer color si existe
        if (prod.colores && prod.colores.length > 0) {
          setSelectedColor(prod.colores[0]);
        }
        
        // Auto-seleccionar primera memoria SI SOLO HAY UNA opción
        if (prod.memorias && prod.memorias.length === 1) {
          setSelectedMemoria(prod.memorias[0]);
        }
      })
      .catch(() => navigate('/catalogo'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

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
            className="bg-primary-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-secondary-500 transition-colors"
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Breadcrumb */}
      <nav className="text-xs sm:text-sm text-gray-400 mb-4">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link to="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700 truncate">{product.nombre}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-6 md:gap-10">
        {/* Galería de imágenes */}
        <div className="space-y-2 md:space-y-3">
          {/* Imagen principal */}
          <div 
            className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl md:rounded-2xl flex items-center justify-center h-56 sm:h-64 md:h-80 relative overflow-hidden cursor-zoom-in"
            onClick={() => setIsModalOpen(true)}
          >
            {product.badge && (
              <span className="absolute top-4 left-4 bg-accent-500 text-secondary-500 text-xs font-bold px-3 py-1 rounded-full z-10">
                {product.badge}
              </span>
            )}
            {imagenes.length > 0 ? (
              <img
                src={toImageUrl(imagenes[activeImage])}
                alt={product.nombre}
                className="h-40 sm:h-48 md:h-64 object-contain transition-opacity duration-200"
              />
            ) : (
              <span className="text-6xl sm:text-8xl">📱</span>
            )}
          </div>

          {/* Miniaturas */}
          {imagenes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imagenes.map((img, i) => {
                // Usar imagenesColores para obtener el color de esta imagen
                let colorDeImagen: string | null = null;
                
                if (product.imagenesColores && product.imagenesColores.length > 0) {
                  // Usar mapeo directo
                  colorDeImagen = product.imagenesColores[i] || null;
                } else if (product.colores && product.colores.length > i) {
                  // Fallback: usar índice
                  colorDeImagen = product.colores[i];
                }
                
                const isSelected = selectedColor 
                  ? colorDeImagen === selectedColor 
                  : activeImage === i;
                
                return (
                  <button
                    key={i}
                    onClick={() => {
                      // Actualizar la imagen activa
                      setActiveImage(i);
                      // Si esta imagen tiene un color asociado, seleccionarlo
                      if (colorDeImagen) {
                        setSelectedColor(colorDeImagen);
                      }
                    }}
                    className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-primary-500 shadow-md'
                        : 'border-gray-200 hover:border-gray-400'
                    }`}
                  >
                    <img
                      src={toImageUrl(img)}
                      alt={`${product.nombre} ${i + 1}`}
                      className="w-full h-full object-contain bg-gray-50"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Detalles */}
        <div className="space-y-3 md:space-y-4">
          <p className="text-xs sm:text-sm font-semibold text-primary-500 mb-1">{product.marca}</p>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 mb-1 md:mb-2">{product.nombre}</h1>
          <p className="text-xs sm:text-sm text-gray-500 mb-3 md:mb-5">SKU: {product.sku}</p>

          {/* Precio al contado */}
          <div className="mb-2 md:mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1 md:mb-2">Precio al contado</p>
            <div className="flex items-baseline gap-2 md:gap-3">
              <span className="text-2xl sm:text-3xl font-extrabold text-secondary-500">{formatPrice(product.precio)}</span>
              {product.precioAnterior && (
                <span className="text-base sm:text-lg text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>
              )}
            </div>
            {product.disponibleCredito && (product.pagoSemanal || product.enganche) && (
              <div className="mt-2 md:mt-3">
                <p className="text-sm font-medium text-gray-700 mb-1 md:mb-2">A crédito</p>
                <div className="bg-blue-50 border border-blue-100 rounded-lg px-2 md:px-3 py-1.5 md:py-2 inline-block">
                  <div className="text-xs sm:text-sm text-primary-500">
                    {product.enganche && (
                      <p className="mb-0.5 md:mb-1">
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
          <div className="mb-3 md:mb-6">
            {product.stock > 0 ? (
              <span className="text-green-600 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span>
                Disponible
              </span>
            ) : (
              <span className="text-red-600 text-xs sm:text-sm font-medium flex items-center gap-1.5">
                <span className="w-2 h-2 bg-red-500 rounded-full inline-block"></span>
                No disponible por el momento
              </span>
            )}
          </div>

          {/* Selector de colores */}
          {product.colores && product.colores.length > 0 && (
            <div className="mb-3 md:mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Color: {selectedColor && <span className="font-normal text-gray-500">{selectedColor}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.colores.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => {
                      setSelectedColor(c);
                      // Buscar la imagen que corresponde a este color
                      const coloresMap = product.imagenesColores;
                      if (coloresMap && coloresMap.length > 0) {
                        // Usar mapeo directo imagenesColores
                        const matchingImageIndex = coloresMap.findIndex(color => color === c);
                        if (matchingImageIndex !== -1) {
                          setActiveImage(matchingImageIndex);
                        }
                      } else if (product.colores && imagenes.length > 0) {
                        // Fallback: usar índice - assumes imagenes[0] = colores[0], etc.
                        const colorIndex = product.colores.indexOf(c);
                        if (colorIndex !== -1 && colorIndex < imagenes.length) {
                          setActiveImage(colorIndex);
                        }
                      }
                    }}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 transition-all hover:scale-110 ${selectedColor === c ? 'border-primary-500 ring-2 ring-blue-300 scale-110' : 'border-gray-300'}`}
                    style={{ backgroundColor: getColorHex(c) }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Selector de memorias */}
          {product.memorias && product.memorias.length > 0 && (
            <div className="mb-3 md:mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1 md:mb-2">
                Almacenamiento: {selectedMemoria && <span className="font-normal text-gray-500">{selectedMemoria}</span>}
              </p>
              <div className="flex flex-wrap gap-2">
                {product.memorias.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setSelectedMemoria(selectedMemoria === m ? null : m)}
                    className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-lg text-xs sm:text-sm font-medium border transition-all ${selectedMemoria === m ? 'bg-primary-500 text-white border-primary-500' : 'bg-white text-gray-700 border-gray-300 hover:border-primary-500'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selector de tipo de pago */}
          <div className="mb-3 md:mb-5">
            <p className="text-sm font-medium text-gray-700 mb-1 md:mb-2">Forma de pago</p>
            <div className="flex gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setTipoPago('CONTADO')}
                className={`flex-1 px-2 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium border-2 transition-all ${
                  tipoPago === 'CONTADO'
                    ? 'bg-primary-500 text-white border-[primary-500]'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-[primary-500]'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg">💵</span>
                  <span>Al Contado</span>
                </div>
              </button>
              {product.disponibleCredito && (
                <button
                  type="button"
                  onClick={() => setTipoPago('CREDITO')}
                  className={`flex-1 px-2 py-2.5 sm:px-4 sm:py-3 rounded-lg text-xs sm:text-sm font-medium border-2 transition-all ${
                    tipoPago === 'CREDITO'
                      ? 'bg-primary-500 text-white border-[primary-500]'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-[primary-500]'
                  }`}
                  disabled={contarProductosCredito() > 0}
                  title={contarProductosCredito() > 0 ? 'Ya tienes un producto a crédito en el carrito' : ''}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">📊</span>
                    <span>A Crédito</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
            <button
              onClick={handleAgregarAlCarrito}
              disabled={unavailable}
              className={`py-2.5 sm:py-3.5 rounded-xl font-bold text-center text-sm sm:text-base transition-all shadow-md flex items-center justify-center gap-2 ${
                unavailable
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-accent-500 text-secondary-500 hover:bg-green-400'
              }`}
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {unavailable ? 'Sin disponibilidad' : 'Agregar al carrito'}
            </button>
            <Link
              to="/carrito"
              className="border-2 border-[primary-500] text-primary-500 px-4 py-2.5 sm:px-5 sm:py-3.5 rounded-xl font-medium hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Ver carrito
            </Link>
          </div>
          
          <p className="mt-2 md:mt-3 text-xs text-gray-500 text-center">
            💡 Puedes agregar más productos antes de confirmar tu reserva
          </p>
        </div>
      </div>

      {/* Pestaña de Características */}
      {product.especificaciones && Object.keys(product.especificaciones).length > 0 && (
        <div className="mt-8 md:mt-12 bg-white">
          {/* Encabezado de pestaña */}
          <div className="border-b border-gray-200">
            <button className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-3 border-b-2 border-[primary-500] text-primary-500 font-semibold text-xs sm:text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Características
            </button>
          </div>

          {/* Contenido de características */}
          <div className="py-6 sm:py-8 px-3 sm:px-6">
            <h3 className="text-lg sm:text-xl font-bold text-gray-700 mb-6 sm:mb-8 text-center">Características y especificaciones</h3>
            
            {/* Grid de especificaciones principales */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-x-8 sm:gap-y-6 mb-6 sm:mb-8 max-w-5xl mx-auto">
              {Object.entries(product.especificaciones).map(([key, value]) => {
                const keyLower = key.toLowerCase();
                let icon = null;
                
                // Iconos según el tipo de especificación
                if (keyLower.includes('red')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  );
                } else if (keyLower.includes('pantalla') || keyLower.includes('display')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  );
                } else if (keyLower.includes('memoria') || keyLower.includes('almacen') || keyLower.includes('ram')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                    </svg>
                  );
                } else if (keyLower.includes('cámara') || keyLower.includes('camara')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  );
                } else if (keyLower.includes('procesador') || keyLower.includes('cpu') || keyLower.includes('chip')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                    </svg>
                  );
                } else if (keyLower.includes('sistema') || keyLower.includes('os') || keyLower.includes('operativo')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  );
                } else if (keyLower.includes('conexi') || keyLower.includes('inalám')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                    </svg>
                  );
                } else if (keyLower.includes('bater')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 3v1m0 16v1m9-9h1M3 12h1m13.28-7.636l.707.707M5.636 5.636l.707.707m12.02 12.02l.707.707M5.636 18.364l.707.707M17 12a5 5 0 11-10 0 5 5 0 0110 0z" />
                    </svg>
                  );
                } else if (keyLower.includes('dimension')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                  );
                } else if (keyLower.includes('peso')) {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                    </svg>
                  );
                } else {
                  icon = (
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  );
                }

                return (
                  <div key={key} className="flex items-start gap-2 sm:gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      {icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-semibold text-gray-800 mb-0.5 sm:mb-1">{key}</h4>
                      <p className="text-xs sm:text-sm text-gray-600 leading-relaxed whitespace-pre-line">{String(value)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Descripción adicional si existe */}
            {product.descripcion && (
              <div className="mt-6 sm:mt-8 p-4 sm:p-6 bg-gray-50 rounded-lg border border-gray-100 max-w-5xl mx-auto">
                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed">{product.descripcion}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal para ampliar imagen */}
      {isModalOpen && imagenes.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          {/* Botón cerrar */}
          <button 
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white transition-colors"
            onClick={() => setIsModalOpen(false)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Imagen principal */}
          <div className="max-w-4xl max-h-[80vh] p-4">
            <img
              src={toImageUrl(getImageForColor(imagenes, product.colores, selectedColor))}
              alt={product.nombre}
              className="max-w-full max-h-[75vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Miniaturas en el modal */}
          {imagenes.length > 1 && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-xl">
              {imagenes.map((img, i) => {
                const colorDeImagen = product.colores ? detectColorFromImage(img, product.colores) : null;
                const isSelected = selectedColor 
                  ? colorDeImagen === selectedColor 
                  : activeImage === i;
                
                return (
                  <button
                    key={i}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (colorDeImagen && product.colores) {
                        setSelectedColor(colorDeImagen);
                      } else {
                        setActiveImage(i);
                        setSelectedColor(null);
                      }
                    }}
                    className={`w-14 h-14 rounded-lg border-2 overflow-hidden flex-shrink-0 transition-all ${
                      isSelected
                        ? 'border-white shadow-md'
                        : 'border-white/30 hover:border-white/60'
                    }`}
                  >
                    <img
                      src={toImageUrl(img)}
                      alt={`${product.nombre} ${i + 1}`}
                      className="w-full h-full object-contain bg-gray-900"
                    />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
