import { useState } from 'react';
import { Link } from 'react-router-dom';
import { DayPicker } from 'react-day-picker';
import { addDays, isSunday, isBefore, startOfDay } from 'date-fns';
import 'react-day-picker/style.css';
import { showError, showSuccess } from '../../utils/notifications';
import api from '../../services/api';
import { toImageUrl } from '../../services/config';

const formatFecha = (fecha: string) =>
  new Date(fecha).toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

const formatPrice = (price: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(price);

interface ReservaItem {
  id: string;
  tipoPago: 'CONTADO' | 'CREDITO';
  estado: string;
  precioCapturado: number;
  color?: string;
  memoria?: string;
  product: {
    id: string;
    nombre: string;
    marca: string;
    imagenes: string[];
  };
}

interface ReservaConsulta {
  id: string;
  nombreCompleto: string;
  telefono: string;
  direccion: string;
  fechaPreferida: string;
  horarioPreferido: string;
  estado: string;
  estadoDetalle: {
    total: number;
    pendientes: number;
    enProceso?: number;
    vendidos: number;
    noConcretados?: number;
    cancelados: number;
    sinStock?: number;
  };
  createdAt: string;
  items: ReservaItem[];
  vendor: { nombre: string; telefono?: string } | null;
}

const EstadoBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, string> = {
    NUEVA: 'bg-blue-100 text-blue-700',
    ASIGNADA: 'bg-indigo-100 text-indigo-700',
    EN_VISITA: 'bg-purple-100 text-purple-700',
    PARCIAL: 'bg-yellow-100 text-yellow-700',
    COMPLETADA: 'bg-green-100 text-green-700',
    CANCELADA: 'bg-red-100 text-red-700',
    SIN_STOCK: 'bg-orange-100 text-orange-700',
  };
  const label: Record<string, string> = {
    NUEVA: 'Nueva',
    ASIGNADA: 'Asignada',
    EN_VISITA: 'En visita',
    PARCIAL: 'Parcial',
    COMPLETADA: 'Completada',
    CANCELADA: 'Cancelada',
    SIN_STOCK: 'Sin stock',
  };
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${map[estado] ?? 'bg-gray-100 text-gray-600'}`}>
      {label[estado] ?? estado}
    </span>
  );
};

const EstadoItemBadge = ({ estado }: { estado: string }) => {
  const map: Record<string, string> = {
    PENDIENTE: 'bg-blue-50 text-blue-700 border-blue-200',
    EN_PROCESO: 'bg-purple-50 text-purple-700 border-purple-200',
    VENDIDO: 'bg-green-50 text-green-700 border-green-200',
    NO_CONCRETADO: 'bg-orange-50 text-orange-700 border-orange-200',
    CANCELADO: 'bg-red-50 text-red-700 border-red-200',
    SIN_STOCK: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  const label: Record<string, string> = {
    PENDIENTE: '⏳ Pendiente',
    EN_PROCESO: '🔄 En proceso',
    VENDIDO: '✅ Vendido',
    NO_CONCRETADO: '❌ No concretado',
    CANCELADO: '🚫 Cancelado',
    SIN_STOCK: '📦 Sin stock',
  };
  return (
    <span className={`text-xs font-medium px-2 py-1 rounded border ${map[estado] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
      {label[estado] ?? estado}
    </span>
  );
};

const MiReserva = () => {
  const [busqueda, setBusqueda] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reserva, setReserva] = useState<ReservaConsulta | null>(null);
  const [cancelando, setCancelando] = useState<string | null>(null);
  const [showConfirmReserva, setShowConfirmReserva] = useState(false);
  const [showConfirmItem, setShowConfirmItem] = useState<string | null>(null);
  const [cancelada, setCancelada] = useState(false);
  const [editando, setEditando] = useState(false);
  const [guardandoEdicion, setGuardandoEdicion] = useState(false);
  const [showCalendarEdit, setShowCalendarEdit] = useState(false);
  const [editForm, setEditForm] = useState({
    fechaPreferida: '',
    horarioPreferido: '',
    direccion: '',
  });

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setLoading(true);
    setError('');
    setReserva(null);
    setCancelada(false);
    try {
      const res = await api.post('/reservations/consulta', { busqueda: busqueda.trim() });
      setReserva(res.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'No se encontró ninguna reserva activa con ese dato.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarReserva = async () => {
    if (!reserva) return;
    setCancelando('reserva');
    try {
      await api.post('/reservations/cancelar', { busqueda: busqueda.trim() });
      setShowConfirmReserva(false);
      setCancelada(true);
      setReserva(null);
      showSuccess('Reserva cancelada exitosamente');
    } catch (err: any) {
      setShowConfirmReserva(false);
      showError(err.response?.data?.message || 'Error al cancelar la reserva');
    } finally {
      setCancelando(null);
    }
  };

  const handleCancelarItem = async (itemId: string) => {
    if (!reserva) return;
    setCancelando(itemId);
    try {
      await api.post('/reservations/cancelar', { 
        busqueda: busqueda.trim(),
        itemId 
      });
      setShowConfirmItem(null);
      showSuccess('Producto cancelado exitosamente');
      
      // Refrescar la reserva
      const res = await api.post('/reservations/consulta', { busqueda: busqueda.trim() });
      setReserva(res.data.data);
    } catch (err: any) {
      setShowConfirmItem(null);
      showError(err.response?.data?.message || 'Error al cancelar el producto');
    } finally {
      setCancelando(null);
    }
  };

  const handleAbrirEdicion = () => {
    if (!reserva) return;
    setEditForm({
      fechaPreferida: reserva.fechaPreferida.split('T')[0],
      horarioPreferido: reserva.horarioPreferido,
      direccion: reserva.direccion,
    });
    setEditando(true);
  };

  const handleGuardarEdicion = async () => {
    if (!reserva) return;
    setGuardandoEdicion(true);
    try {
      const payload: Record<string, string> = { busqueda: busqueda.trim() };
      if (editForm.fechaPreferida !== reserva.fechaPreferida.split('T')[0]) {
        payload.fechaPreferida = new Date(editForm.fechaPreferida).toISOString();
      }
      if (editForm.horarioPreferido !== reserva.horarioPreferido) {
        payload.horarioPreferido = editForm.horarioPreferido;
      }
      if (editForm.direccion !== reserva.direccion) {
        payload.direccion = editForm.direccion;
      }

      const res = await api.put('/reservations/modificar', payload);
      setReserva(res.data.data);
      setEditando(false);
      showSuccess('Reserva modificada exitosamente');
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al modificar la reserva');
    } finally {
      setGuardandoEdicion(false);
    }
  };

  const folio = reserva?.id.substring(0, 8).toUpperCase();
  const puedeCancelarReserva = reserva && ['NUEVA', 'ASIGNADA'].includes(reserva.estado);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary-500 to-primary-500 text-white py-10 sm:py-14 px-4">
        <div className="max-w-2xl mx-auto text-center">
          <span className="bg-accent-500 text-secondary-500 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide mb-3 sm:mb-4 inline-block">
            Sin necesidad de cuenta
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">Consulta tu reserva</h1>
          <p className="text-blue-100 text-xs sm:text-sm max-w-md mx-auto">
            Ingresa tu número de folio o tu CURP para ver el estado de tu reserva y gestionar tus productos.
          </p>
        </div>
      </section>

      {/* Formulario de búsqueda */}
      <section className="py-6 sm:py-10 px-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleBuscar} className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 border border-gray-100">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Folio o CURP
            </label>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej: A1B2C3D4 o PEGJ900101HCHRRS01"
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm uppercase"
            />
            <button
              type="submit"
              disabled={loading || !busqueda.trim()}
              className="w-full mt-3 sm:mt-4 bg-primary-500 text-white py-2.5 sm:py-3 rounded-xl font-bold hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {loading ? 'Buscando...' : 'Buscar mi reserva'}
            </button>
          </form>

          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {cancelada && (
            <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-green-700 text-sm font-medium">✓ Tu reserva ha sido cancelada exitosamente</p>
            </div>
          )}
        </div>
      </section>

      {/* Resultado */}
      {reserva && (
        <section className="pb-16 px-4">
          <div className="max-w-4xl mx-auto">
            {/* Header de la reserva */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 mb-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-2xl font-bold text-gray-900">Reserva #{folio}</h2>
                    <EstadoBadge estado={reserva.estado} />
                  </div>
                  <p className="text-sm text-gray-500">
                    Creada el {formatFecha(reserva.createdAt)}
                  </p>
                </div>
              </div>

              {/* Estadísticas de items */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{reserva.estadoDetalle.total}</p>
                  <p className="text-xs text-gray-600">Total productos</p>
                </div>
                {reserva.estadoDetalle.pendientes > 0 && (
                  <div className="bg-purple-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-purple-600">{reserva.estadoDetalle.pendientes}</p>
                    <p className="text-xs text-gray-600">Pendientes</p>
                  </div>
                )}
                {reserva.estadoDetalle.vendidos > 0 && (
                  <div className="bg-green-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-green-600">{reserva.estadoDetalle.vendidos}</p>
                    <p className="text-xs text-gray-600">Vendidos</p>
                  </div>
                )}
                {reserva.estadoDetalle.cancelados > 0 && (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <p className="text-2xl font-bold text-red-600">{reserva.estadoDetalle.cancelados}</p>
                    <p className="text-xs text-gray-600">Cancelados</p>
                  </div>
                )}
              </div>

              {/* Info del cliente y visita */}
              <div className="grid sm:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Cliente</p>
                  <p className="font-semibold text-gray-900">{reserva.nombreCompleto}</p>
                  <p className="text-sm text-gray-600">{reserva.telefono}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Visita programada</p>
                  <p className="font-semibold text-gray-900">{formatFecha(reserva.fechaPreferida)}</p>
                  <p className="text-sm text-gray-600">⏰ {reserva.horarioPreferido}</p>
                </div>
                {reserva.vendor && (
                  <div className="sm:col-span-2">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Vendedor asignado</p>
                    <p className="font-semibold text-gray-900">👤 {reserva.vendor.nombre}</p>
                    {reserva.vendor.telefono && (
                      <p className="text-sm text-gray-600">📞 {reserva.vendor.telefono}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Botón cancelar reserva completa */}
              {puedeCancelarReserva && (
                <div className="space-y-2 sm:space-y-3">
                  {!editando && (
                    <button
                      onClick={handleAbrirEdicion}
                      className="w-full sm:w-auto border-2 border-[primary-500] text-[primary-500] px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-blue-50 transition-colors mr-0 sm:mr-3 mb-2 sm:mb-0"
                    >
                      Modificar reserva
                    </button>
                  )}
                  <button
                    onClick={() => setShowConfirmReserva(true)}
                    className="w-full sm:w-auto border-2 border-red-500 text-red-600 px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium hover:bg-red-50 transition-colors"
                  >
                    Cancelar toda la reserva
                  </button>

                  {/* Formulario de edición */}
                  {editando && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-5">
                      <h4 className="font-bold text-blue-900 mb-4">Editar datos de la reserva</h4>

                      <div className="space-y-4">
                        {/* Fecha */}
                        <div className="relative">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Fecha preferida</label>
                          <button
                            type="button"
                            onClick={() => setShowCalendarEdit(!showCalendarEdit)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-left bg-white"
                          >
                            {editForm.fechaPreferida
                              ? new Date(editForm.fechaPreferida + 'T12:00:00Z').toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
                              : 'Selecciona una fecha'}
                          </button>
                          {showCalendarEdit && (
                            <div className="absolute z-50 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg p-3">
                              <DayPicker
                                mode="single"
                                selected={editForm.fechaPreferida ? new Date(editForm.fechaPreferida + 'T12:00:00Z') : undefined}
                                onSelect={(date) => {
                                  if (date) {
                                    const year = date.getUTCFullYear();
                                    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
                                    const day = String(date.getUTCDate()).padStart(2, '0');
                                    setEditForm({ ...editForm, fechaPreferida: `${year}-${month}-${day}` });
                                    setShowCalendarEdit(false);
                                  }
                                }}
                                disabled={(date) => {
                                  const today = startOfDay(new Date());
                                  const minDate = addDays(today, 2);
                                  return isBefore(date, minDate) || isSunday(date);
                                }}
                                fromDate={addDays(startOfDay(new Date()), 2)}
                                style={{ '--rdp-accent-color': 'primary-500' } as React.CSSProperties}
                              />
                              <p className="text-xs text-gray-500 text-center mt-2">No se atiende los domingos</p>
                            </div>
                          )}
                        </div>

                        {/* Horario */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Horario preferido</label>
                          <select
                            value={editForm.horarioPreferido}
                            onChange={(e) => setEditForm({ ...editForm, horarioPreferido: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
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

                        {/* Dirección */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                          <textarea
                            rows={2}
                            value={editForm.direccion}
                            onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => setEditando(false)}
                          disabled={guardandoEdicion}
                          className="flex-1 border border-gray-300 bg-white py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        <button
                          onClick={handleGuardarEdicion}
                          disabled={guardandoEdicion}
                          className="flex-1 bg-primary-500 text-white py-2 rounded-lg font-bold hover:bg-primary-600 disabled:opacity-50"
                        >
                          {guardandoEdicion ? 'Guardando...' : 'Guardar cambios'}
                        </button>
                      </div>
                    </div>
                  )}

                  {showConfirmReserva && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
                      <p className="text-red-800 font-semibold mb-3">
                        ¿Estás seguro de cancelar toda la reserva?
                      </p>
                      <p className="text-red-600 text-sm mb-4">
                        Se cancelarán todos los productos pendientes. Esta acción no se puede deshacer.
                      </p>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowConfirmReserva(false)}
                          disabled={cancelando === 'reserva'}
                          className="flex-1 border border-gray-300 bg-white py-2 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50"
                        >
                          No, mantener
                        </button>
                        <button
                          onClick={handleCancelarReserva}
                          disabled={cancelando === 'reserva'}
                          className="flex-1 bg-red-600 text-white py-2 rounded-lg font-bold hover:bg-red-700 disabled:opacity-50"
                        >
                          {cancelando === 'reserva' ? 'Cancelando...' : 'Sí, cancelar todo'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Lista de productos */}
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Productos de tu reserva</h3>
              {reserva.items.map((item) => {
                const imagen = item.product.imagenes?.[0] ? toImageUrl(item.product.imagenes[0]) : null;
                const puedeCancelarItem = item.estado === 'PENDIENTE';

                return (
                  <div key={item.id} className="bg-white rounded-xl shadow-md border border-gray-100 p-5">
                    <div className="flex gap-4">
                      {/* Imagen */}
                      <div className="w-20 h-20 rounded-lg bg-gray-50 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-100">
                        {imagen ? (
                          <img src={imagen} alt={item.product.nombre} className="w-full h-full object-contain" />
                        ) : (
                          <span className="text-3xl">📱</span>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-400 font-medium uppercase mb-1">{item.product.marca}</p>
                        <h4 className="font-bold text-gray-900 text-lg mb-2">{item.product.nombre}</h4>
                        
                        {/* Opciones y estado */}
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {item.color && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {item.color}
                            </span>
                          )}
                          {item.memoria && (
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {item.memoria}
                            </span>
                          )}
                          <span className={`text-xs font-medium px-2 py-1 rounded ${
                            item.tipoPago === 'CREDITO' 
                              ? 'bg-blue-50 text-blue-600' 
                              : 'bg-green-50 text-green-700'
                          }`}>
                            {item.tipoPago === 'CREDITO' ? '📊 Crédito' : '💵 Contado'}
                          </span>
                          <EstadoItemBadge estado={item.estado} />
                        </div>

                        {/* Precio */}
                        <p className="text-lg font-extrabold text-secondary-500">
                          {formatPrice(item.precioCapturado)}
                        </p>
                      </div>

                      {/* Botón cancelar item */}
                      {puedeCancelarItem && (
                        <div className="flex-shrink-0">
                          <button
                            onClick={() => setShowConfirmItem(item.id)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Cancelar este producto"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Confirmación de cancelación de item */}
                    {showConfirmItem === item.id && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
                        <p className="text-red-700 text-sm font-medium mb-3">
                          ¿Cancelar este producto?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setShowConfirmItem(null)}
                            disabled={cancelando === item.id}
                            className="flex-1 border border-gray-300 bg-white py-1.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                          >
                            No
                          </button>
                          <button
                            onClick={() => handleCancelarItem(item.id)}
                            disabled={cancelando === item.id}
                            className="flex-1 bg-red-600 text-white py-1.5 rounded-lg text-sm font-bold hover:bg-red-700 disabled:opacity-50"
                          >
                            {cancelando === item.id ? 'Cancelando...' : 'Sí, cancelar'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="mt-8 text-center">
              <Link
                to="/catalogo"
                className="inline-block text-[primary-500] font-medium hover:underline"
              >
                ← Volver al catálogo
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MiReserva;
