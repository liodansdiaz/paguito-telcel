import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import type { Customer } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';

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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Link to="/admin/clientes" className="text-sm text-gray-400 hover:text-gray-600">Clientes</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">{customer.nombreCompleto}</span>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col sm:flex-row gap-6">
        <div className="w-16 h-16 rounded-full bg-[#0f49bd] text-white flex items-center justify-center text-2xl font-bold shrink-0">
          {customer.nombreCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('')}
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><p className="text-xs text-gray-400">Nombre</p><p className="font-semibold text-gray-900">{customer.nombreCompleto}</p></div>
          <div><p className="text-xs text-gray-400">Teléfono</p><p className="font-semibold text-gray-900">{customer.telefono}</p></div>
          <div><p className="text-xs text-gray-400">CURP</p><p className="font-mono text-gray-700">{customer.curp}</p></div>
          <div><p className="text-xs text-gray-400">Estado</p><StatusBadge type="cliente" estado={customer.estado} /></div>
          <div><p className="text-xs text-gray-400">Dirección</p><p className="text-gray-700 text-sm">{customer.direccion || 'No registrada'}</p></div>
          <div><p className="text-xs text-gray-400">Registrado</p><p className="text-gray-700 text-sm">{new Date(customer.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' })}</p></div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Historial de Reservas ({customer.reservations?.length ?? 0})</h3>
        </div>
        {customer.reservations?.length === 0 ? (
          <p className="text-center py-12 text-gray-400">Sin reservas</p>
        ) : (
          <div className="divide-y divide-gray-50">
            {customer.reservations?.map((r) => (
              <div key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-gray-900 text-sm">{r.product?.nombre}</p>
                  <p className="text-gray-400 text-xs">
                    #{r.id.slice(0, 8).toUpperCase()} — {new Date(r.fechaPreferida).toLocaleDateString('es-MX')} {r.horarioPreferido}
                  </p>
                  {r.vendor && <p className="text-gray-500 text-xs">Vendedor: {r.vendor.nombre}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium ${r.tipoPago === 'CONTADO' ? 'text-green-600' : 'text-blue-600'}`}>
                    {r.tipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}
                  </span>
                  <StatusBadge type="reserva" estado={r.estado} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerProfile;
