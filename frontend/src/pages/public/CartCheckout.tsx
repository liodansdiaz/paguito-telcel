import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCarritoStore } from '../../store/carrito.store';
import { toImageUrl } from '../../services/config';
import api from '../../services/api';

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

const CartCheckout = () => {
  const navigate = useNavigate();
  const { 
    items, 
    eliminarDelCarrito, 
    cambiarTipoPago, 
    getTotalPrecio, 
    vaciarCarrito,
    guardarReservaConfirmada,
    contarProductosCredito 
  } = useCarritoStore();

  const [step, setStep] = useState<'cart' | 'form'>(items.length > 0 ? 'cart' : 'form');
  const [loading, setLoading] = useState(false);

  // Datos del formulario
  const [formData, setFormData] = useState({
    nombreCompleto: '',
    telefono: '',
    curp: '',
    direccion: '',
    fechaPreferida: '',
    horarioPreferido: '10:00',
    notas: '',
  });

  const totalPrecio = getTotalPrecio();
  const productosCredito = contarProductosCredito();

  const handleEliminar = (tempId: string) => {
    eliminarDelCarrito(tempId);
    if (items.length === 1) {
      toast.error('Carrito vacío');
      navigate('/catalogo');
    }
  };

  const handleCambiarTipoPago = (tempId: string, nuevoTipoPago: 'CONTADO' | 'CREDITO') => {
    // Validar: Solo 1 producto a crédito
    if (nuevoTipoPago === 'CREDITO' && productosCredito > 0) {
      const itemActual = items.find(i => i.tempId === tempId);
      if (itemActual?.tipoPago !== 'CREDITO') {
        toast.error('Solo puedes tener un producto a crédito en tu reserva');
        return;
      }
    }
    cambiarTipoPago(tempId, nuevoTipoPago);
  };

  const handleContinuar = () => {
    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      navigate('/catalogo');
      return;
    }
    setStep('form');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0) {
      toast.error('Tu carrito está vacío');
      return;
    }

    setLoading(true);

    try {
      // Preparar datos para el backend
      const reservationData = {
        items: items.map(item => ({
          productId: item.productId,
          color: item.color,
          memoria: item.memoria,
          tipoPago: item.tipoPago,
        })),
        nombreCompleto: formData.nombreCompleto,
        telefono: formData.telefono,
        curp: formData.curp.toUpperCase(),
        direccion: formData.direccion,
        fechaPreferida: new Date(formData.fechaPreferida).toISOString(),
        horarioPreferido: formData.horarioPreferido,
        notas: formData.notas || undefined,
      };

      const { data } = await api.post('/reservations', reservationData);
      const reserva = data.data;

      // Guardar reserva confirmada en el store local
      guardarReservaConfirmada({
        id: reserva.id,
        folio: reserva.id.substring(0, 8).toUpperCase(),
        nombreCompleto: reserva.nombreCompleto,
        telefono: reserva.telefono,
        curp: reserva.curp,
        estado: reserva.estado,
        items: reserva.items.map((item: any) => ({
          id: item.id,
          producto: item.product.nombre,
          marca: item.product.marca,
          imagen: item.product.imagenes?.[0],
          tipoPago: item.tipoPago,
          estado: item.estado,
          precioCapturado: item.precioCapturado,
          color: item.color,
          memoria: item.memoria,
        })),
        fechaPreferida: reserva.fechaPreferida,
        horarioPreferido: reserva.horarioPreferido,
        createdAt: reserva.createdAt,
      });

      // Vaciar el carrito
      vaciarCarrito();

      // Redirigir a página de éxito
      navigate('/reserva/exitosa', { state: { reserva } });
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || 'Error al crear la reserva';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="text-6xl mb-4">🛒</div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Tu carrito está vacío</h2>
        <p className="text-gray-500 mb-6">Agrega productos desde el catálogo para hacer tu reserva</p>
        <Link
          to="/catalogo"
          className="inline-block bg-[#0f49bd] text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Ver catálogo
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-400 mb-6">
        <Link to="/" className="hover:text-blue-600">Inicio</Link>
        <span className="mx-2">/</span>
        <Link to="/catalogo" className="hover:text-blue-600">Catálogo</Link>
        <span className="mx-2">/</span>
        <span className="text-gray-700">Carrito</span>
      </nav>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {step === 'cart' ? 'Tu carrito' : 'Datos de reserva'}
      </h1>

      {/* Progress bar */}
      <div className="flex items-center justify-center mb-10">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 ${step === 'cart' ? 'text-[#0f49bd]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 'cart' ? 'bg-[#0f49bd] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <span className="font-medium hidden sm:inline">Carrito</span>
          </div>
          <div className="w-16 h-0.5 bg-gray-300"></div>
          <div className={`flex items-center gap-2 ${step === 'form' ? 'text-[#0f49bd]' : 'text-gray-400'}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
              step === 'form' ? 'bg-[#0f49bd] text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
            <span className="font-medium hidden sm:inline">Datos</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Columna principal */}
        <div className="lg:col-span-2">
          {step === 'cart' ? (
            /* PASO 1: Lista de productos */
            <div className="space-y-4">
              {items.map((item) => (
                <div key={item.tempId} className="bg-white border border-gray-200 rounded-xl p-5 flex gap-4">
                  {/* Imagen */}
                  <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                    {item.imagen
                      ? <img src={toImageUrl(item.imagen)} alt={item.nombre} className="w-full h-full object-contain" />
                      : <span className="text-3xl">📱</span>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-gray-400 font-medium uppercase mb-1">{item.marca}</p>
                    <h3 className="font-bold text-gray-900 text-lg mb-2">{item.nombre}</h3>
                    
                    {/* Opciones seleccionadas */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {item.color && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          Color: {item.color}
                        </span>
                      )}
                      {item.memoria && (
                        <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                          {item.memoria}
                        </span>
                      )}
                    </div>

                    {/* Selector de tipo de pago */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleCambiarTipoPago(item.tempId, 'CONTADO')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          item.tipoPago === 'CONTADO'
                            ? 'bg-green-50 text-green-700 border-green-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        💵 Contado
                      </button>
                      <button
                        onClick={() => handleCambiarTipoPago(item.tempId, 'CREDITO')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
                          item.tipoPago === 'CREDITO'
                            ? 'bg-blue-50 text-blue-700 border-blue-500'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                        }`}
                        disabled={item.tipoPago !== 'CREDITO' && productosCredito > 0}
                        title={item.tipoPago !== 'CREDITO' && productosCredito > 0 ? 'Ya tienes un producto a crédito' : ''}
                      >
                        📊 A crédito
                      </button>
                    </div>
                  </div>

                  {/* Precio y eliminar */}
                  <div className="flex flex-col items-end justify-between">
                    <button
                      onClick={() => handleEliminar(item.tempId)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                    <p className="text-xl font-extrabold text-[#002f87]">
                      {formatPrice(item.precio)}
                    </p>
                  </div>
                </div>
              ))}

              {/* Advertencia de crédito */}
              {productosCredito > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                  <span className="text-2xl">ℹ️</span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-900 mb-1">Límite de crédito</p>
                    <p className="text-sm text-blue-700">
                      Solo puedes tener un producto a crédito por reserva. Los demás deben ser de contado.
                    </p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* PASO 2: Formulario de datos */
            <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.nombreCompleto}
                    onChange={(e) => setFormData({ ...formData, nombreCompleto: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Juan Pérez García"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="9611234567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CURP <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={18}
                    value={formData.curp}
                    onChange={(e) => setFormData({ ...formData, curp: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                    placeholder="PEGJ900101HCHRRS01"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección completa <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Calle, número, colonia, ciudad"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha preferida <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.fechaPreferida}
                    onChange={(e) => setFormData({ ...formData, fechaPreferida: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Horario preferido <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.horarioPreferido}
                    onChange={(e) => setFormData({ ...formData, horarioPreferido: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="10:00">10:00 AM</option>
                    <option value="11:00">11:00 AM</option>
                    <option value="12:00">12:00 PM</option>
                    <option value="13:00">1:00 PM</option>
                    <option value="14:00">2:00 PM</option>
                    <option value="15:00">3:00 PM</option>
                    <option value="16:00">4:00 PM</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notas adicionales (opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={formData.notas}
                    onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Alguna indicación especial para la visita..."
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setStep('cart')}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
                >
                  ← Volver al carrito
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#13ec6d] text-[#002f87] py-3 rounded-xl font-bold hover:bg-green-400 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Confirmando...' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Sidebar - Resumen */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-gray-200 rounded-xl p-6 sticky top-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resumen</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Productos</span>
                <span className="font-semibold">{items.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span className="font-semibold">{formatPrice(totalPrecio)}</span>
              </div>
              {productosCredito > 0 && (
                <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                  <span>📊</span>
                  <span className="font-medium">{productosCredito} producto a crédito</span>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-4 mb-6">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-700 font-medium">Total</span>
                <span className="text-2xl font-extrabold text-[#002f87]">{formatPrice(totalPrecio)}</span>
              </div>
            </div>

            {step === 'cart' && (
              <button
                onClick={handleContinuar}
                className="w-full bg-[#13ec6d] text-[#002f87] py-3.5 rounded-xl font-bold hover:bg-green-400 transition-all shadow-md"
              >
                Continuar →
              </button>
            )}

            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span>✓</span>
                <span>Visita a domicilio sin costo</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span>✓</span>
                <span>Asesoría personalizada</span>
              </div>
              <div className="flex items-start gap-2 text-xs text-gray-500">
                <span>✓</span>
                <span>Sin compromiso de compra</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartCheckout;
