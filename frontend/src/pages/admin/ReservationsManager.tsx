import { useEffect, useState } from 'react';
import api from '../../services/api';
import type { Reservation, EstadoReserva, User } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';

const ESTADOS: EstadoReserva[] = ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'VENDIDA', 'NO_CONCRETADA', 'CANCELADA', 'SIN_STOCK'];
const estadoLabel: Record<EstadoReserva, string> = {
  NUEVA: 'Nueva', ASIGNADA: 'Asignada', EN_VISITA: 'En visita',
  VENDIDA: 'Vendida', NO_CONCRETADA: 'No concretada', CANCELADA: 'Cancelada', SIN_STOCK: 'Sin stock',
};

const ReservationsManager = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('');
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<User[]>([]);

  // Modal estados
  const [assignModal, setAssignModal] = useState<{ open: boolean; reservation: Reservation | null }>({ open: false, reservation: null });
  const [statusModal, setStatusModal] = useState<{ open: boolean; reservation: Reservation | null }>({ open: false, reservation: null });
  const [assignVendorId, setAssignVendorId] = useState('');
  const [newStatus, setNewStatus] = useState<EstadoReserva>('VENDIDA');
  const [notas, setNotas] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (filterEstado) params.estado = filterEstado;
      if (search) params.search = search;
      const res = await api.get('/reservations/admin', { params });
      setReservations(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReservations(); }, [page, filterEstado]);
  useEffect(() => {
    api.get('/admin/users', { params: { isActive: 'true', rol: 'VENDEDOR' } })
      .then((r) => setVendors(r.data.data)).catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!assignModal.reservation || !assignVendorId) return;
    setActionLoading(true);
    try {
      await api.patch(`/reservations/admin/${assignModal.reservation.id}/assign`, { vendorId: assignVendorId });
      setAssignModal({ open: false, reservation: null });
      fetchReservations();
    } catch (err: any) { alert(err.response?.data?.message || 'Error al asignar'); }
    finally { setActionLoading(false); }
  };

  const handleStatusChange = async () => {
    if (!statusModal.reservation) return;
    setActionLoading(true);
    try {
      await api.patch(`/reservations/admin/${statusModal.reservation.id}/status`, { estado: newStatus, notas });
      setStatusModal({ open: false, reservation: null });
      setNotas('');
      fetchReservations();
    } catch (err: any) { alert(err.response?.data?.message || 'Error al cambiar estado'); }
    finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-400 text-sm">{total} reservas en total</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            placeholder="Buscar cliente, CURP..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchReservations()}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-48"
          />
          <select
            value={filterEstado}
            onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => <option key={e} value={e}>{estadoLabel[e]}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Cliente', 'Celular', 'Pago', 'Fecha preferida', 'Vendedor', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-12 text-gray-400">Sin reservas</td></tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{r.nombreCompleto}</p>
                      <p className="text-gray-400 text-xs">{r.telefono}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap">{r.product?.nombre}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium ${r.tipoPago === 'CONTADO' ? 'text-green-600' : 'text-blue-600'}`}>
                        {r.tipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap text-xs">
                      {new Date(r.fechaPreferida).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} {r.horarioPreferido}
                    </td>
                    <td className="px-4 py-3 text-gray-700 whitespace-nowrap text-xs">
                      {r.vendor?.nombre ?? <span className="text-orange-500">Sin asignar</span>}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge type="reserva" estado={r.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => { setAssignModal({ open: true, reservation: r }); setAssignVendorId(r.vendorId || ''); }}
                          className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors whitespace-nowrap"
                        >
                          Asignar
                        </button>
                        <button
                          onClick={() => { setStatusModal({ open: true, reservation: r }); setNewStatus('VENDIDA'); setNotas(''); }}
                          className="text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors whitespace-nowrap"
                        >
                          Estado
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className='flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm'>
            <span className='text-gray-500'>Pagina {page} de {totalPages}</span>
            <div className='flex gap-2'>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className='px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50'>Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className='px-3 py-1 rounded border border-gray-300 disabled:opacity-40 hover:bg-gray-50'>Siguiente</button>
            </div>
          </div>
        )}
      </div>

      {assignModal.open && assignModal.reservation && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md p-6'>
            <h3 className='font-bold text-lg text-gray-900 mb-1'>Asignar Vendedor</h3>
            <p className='text-sm text-gray-500 mb-5'>Reserva #{assignModal.reservation.id.slice(0,8).toUpperCase()} — {assignModal.reservation.nombreCompleto}</p>
            <select value={assignVendorId} onChange={(e) => setAssignVendorId(e.target.value)} className='w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4'>
              <option value=''>Selecciona un vendedor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.nombre} — {v.zona || 'Sin zona'}</option>)}
            </select>
            <div className='flex gap-3'>
              <button onClick={() => setAssignModal({ open: false, reservation: null })} className='flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50'>Cancelar</button>
              <button onClick={handleAssign} disabled={!assignVendorId || actionLoading} className='flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700'>{actionLoading ? 'Asignando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {statusModal.open && statusModal.reservation && (
        <div className='fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4'>
          <div className='bg-white rounded-2xl w-full max-w-md p-6'>
            <h3 className='font-bold text-lg text-gray-900 mb-1'>Cambiar Estado</h3>
            <p className='text-sm text-gray-500 mb-5'>Reserva #{statusModal.reservation.id.slice(0,8).toUpperCase()}</p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as EstadoReserva)} className='w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3'>
              {ESTADOS.map((e) => <option key={e} value={e}>{estadoLabel[e]}</option>)}
            </select>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder='Notas (opcional)' rows={3} className='w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4' />
            <div className='flex gap-3'>
              <button onClick={() => setStatusModal({ open: false, reservation: null })} className='flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50'>Cancelar</button>
              <button onClick={handleStatusChange} disabled={actionLoading} className='flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700'>{actionLoading ? 'Guardando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default ReservationsManager;