import { Link, useNavigate } from 'react-router-dom';
import { showError, toast } from '../../utils/notifications';
import { toImageUrl } from '../../services/config';
import { useCarritoStore } from '../../store/carrito.store';
import { formatPrice } from '../../utils/format';
import type { Product } from '../../types';

// Color map para mostrar colores en las tarjetas
const COLOR_MAP: Record<string, string> = {
  negro: '#1a1a1a', blanco: '#f5f5f5', plata: '#C0C0C0', gris: '#808080',
  azul: '#2563eb', 'azul oscuro': '#1e3a8a', 'azul claro': '#60a5fa',
  verde: '#16a34a', 'verde menta': '#6ee7b7', morado: '#7c3aed',
  rojo: '#dc2626', rosa: '#ec4899', dorado: '#d97706', amarillo: '#eab308',
  naranja: '#ea580c', titanio: '#a0a098', 'titanio negro': '#3a3a3a',
  'titanio natural': '#a0a098', beige: '#d4b896', café: '#92400e', cafe: '#92400e',
};

const getColorHex = (color: string) => COLOR_MAP[color.toLowerCase()] ?? '#9ca3af';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const navigate = useNavigate();
  const { agregarAlCarrito } = useCarritoStore();
  const imagen = product.imagenes && product.imagenes.length > 0
    ? toImageUrl(product.imagenes[0])
    : null;

  const handleReservar = () => {
    const tieneColores = product.colores && product.colores.length > 0;
    const tieneMemorias = product.memorias && product.memorias.length > 0;

    if (tieneColores || tieneMemorias) {
      navigate(`/producto/${product.id}`);
      return;
    }

    try {
      agregarAlCarrito({
        productId: product.id,
        nombre: product.nombre,
        marca: product.marca,
        precio: product.precio,
        imagen: product.imagenes?.[0],
        tipoPago: 'CONTADO',
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
              className="bg-primary-500 text-white px-3 py-1 rounded text-sm font-medium hover:bg-secondary-600 transition-colors"
            >
              Ver carrito
            </button>
          </div>
        ),
        { duration: 4000 }
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error al agregar al carrito';
      showError(message);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-xl transition-all overflow-hidden border border-gray-200">
      <div className="relative bg-white h-44 flex items-center justify-center group">
        {product.precioAnterior ? (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg z-10">
            Oferta
          </span>
        ) : product.badge ? (
          <span className="absolute top-2 left-2 bg-gradient-to-r from-orange-500 to-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full z-10">
            {product.badge}
          </span>
        ) : null}
        {imagen ? (
          <img src={imagen} alt={product.nombre} className="h-36 w-36 object-contain group-hover:scale-105 transition-transform" />
        ) : (
          <span className="text-5xl">📱</span>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2 line-clamp-2 min-h-[2.5rem]">{product.nombre}</h3>
        
        <div className="mb-1">
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className="text-xl font-extrabold text-primary-500">{formatPrice(product.precio)}</span>
            {product.precioAnterior && <span className="text-xs text-gray-400 line-through">{formatPrice(product.precioAnterior)}</span>}
          </div>
          {product.precioAnterior && (
            <p className="text-[10px] text-green-600 font-semibold">
              Ahorra {formatPrice(product.precioAnterior - product.precio)}
            </p>
          )}
        </div>

        {((product.colores && product.colores.length > 0) || (product.memorias && product.memorias.length > 0)) && (
          <div className="flex items-center gap-2 mb-2">
            {product.colores && product.colores.length > 0 && (
              <div className="flex gap-1">
                {product.colores.slice(0, 4).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-4 h-4 rounded-full border-2 border-gray-300"
                    style={{ backgroundColor: getColorHex(color) }}
                    title={color}
                  />
                ))}
                {product.colores.length > 4 && (
                  <span className="text-[9px] text-gray-400 self-center">+{product.colores.length - 4}</span>
                )}
              </div>
            )}
            {product.colores && product.colores.length > 0 && product.memorias && product.memorias.length > 0 && (
              <span className="text-gray-300">•</span>
            )}
            {product.memorias && product.memorias.length > 0 && (
              <span className="text-[10px] text-gray-600 font-medium">
                {product.memorias.join(' / ')}
              </span>
            )}
          </div>
        )}

        {product.disponibleCredito && (product.pagoSemanal || product.enganche) && (
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-2 mb-2">
            {product.pagoSemanal && (
              <p className="text-[11px] text-blue-700 font-bold leading-tight">
                💳 {product.pagoSemanal}
              </p>
            )}
            {product.enganche && (
              <p className="text-[9px] text-blue-600 leading-tight mt-0.5">
                {product.enganche}
              </p>
            )}
          </div>
        )}

        {product.stock > 0 && (
          <p className="text-[9px] text-green-600 font-semibold mb-2 flex items-center gap-1">
            <span>✓</span> Disponible
          </p>
        )}

        <button 
          onClick={handleReservar} 
          className="w-full bg-primary-500 hover:bg-secondary-600 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mb-1.5 transition-colors"
        >
          Reservar
        </button>
        <Link to={`/producto/${product.id}`} className="block text-center text-primary-500 text-[10px] font-bold hover:underline">
          Ver detalles completos
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
