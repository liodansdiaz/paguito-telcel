import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Customer } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';

// ── Componente principal ─────────────────────────────────────────────────────
const CustomerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    api.get(`/admin/customers/${id}`)
      .then((r) => setCustomer(r.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" /></div>;
  if (!customer) return <div className="text-center py-20 text-gray-400">Cliente no encontrado</div>;

  const filteredReservations = customer.reservations?.filter(
    (r) => r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA'
  ) ?? [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 mb-2">
        <Link to="/admin/clientes" className="text-sm text-gray-400 hover:text-gray-600">Clientes</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">{customer.nombreCompleto}</span>
      </div>

      {/* Tarjeta del cliente */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6">
        <div className="w-16 h-16 rounded-full bg-primary-500 text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {customer.nombreCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-400">Nombre</p><p className="font-semibold text-gray-900">{customer.nombreCompleto}</p></div>
          <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-semibold text-gray-900">{customer.telefono}</p></div>
          <div><p className="text-xs text-gray-400">CURP</p><p className="font-mono text-gray-700">{customer.curp}</p></div>
          <div><p className="text-xs text-gray-400">Estado</p><StatusBadge type="cliente" estado={customer.estado} /></div>
          <div><p className="text-xs text-gray-400">Registrado</p><p className="text-gray-700 text-sm">{new Date(customer.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
        </div>
      </div>

      {/* Historial de reservas */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Historial de Reservas ({filteredReservations.length})</h3>
        </div>
        {filteredReservations.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Sin reservas</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Folio', 'Dirección', 'Productos', 'Vendedor', 'Estado'].map((h) => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredReservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    {/* Folio */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="font-mono text-xs text-gray-500">#{r.id.slice(0, 8).toUpperCase()}</p>
                      <p className="text-gray-400 text-xs">{new Date(r.fechaPreferida).toLocaleDateString('es-MX')} {r.horarioPreferido}</p>
                    </td>
                    {/* Dirección */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-xs text-gray-700 truncate" title={r.direccion}>{r.direccion}</p>
                    </td>
                    {/* Productos */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        {r.items && r.items.length > 0 ? (
                          r.items.map((item) => (
                            <div key={item.id} className="flex items-center gap-1.5">
                              <span className="text-xs font-medium text-gray-800">{item.product?.nombre}</span>
                              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap ${item.tipoPago === 'CREDITO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                                {item.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado'}
                              </span>
                            </div>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400">Sin productos</span>
                        )}
                      </div>
                    </td>
                    {/* Vendedor */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <p className="text-xs text-gray-700">{r.vendor?.nombre ?? <span className="text-orange-500">Sin asignar</span>}</p>
                    </td>
                    {/* Estado */}
                    <td className="px-4 py-3">
                      <StatusBadge type="reserva" estado={r.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default CustomerProfile;
