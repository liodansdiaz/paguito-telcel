import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import type { Reservation, EstadoReserva, User } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { showSuccess, showError } from '../../utils/notifications';

const ESTADOS: EstadoReserva[] = ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL', 'COMPLETADA', 'CANCELADA', 'SIN_STOCK'];
const estadoLabel: Record<EstadoReserva, string> = {
  NUEVA: 'Nueva', ASIGNADA: 'Asignada', EN_VISITA: 'En visita',
  PARCIAL: 'Parcial', COMPLETADA: 'Completada', CANCELADA: 'Cancelada', SIN_STOCK: 'Sin stock',
};

// ── Exportar a CSV ────────────────────────────────────────────────────────────
const exportCSV = async (filters: {
  estado: string;
  search: string;
  vendorId: string;
  fechaDesde: string;
  fechaHasta: string;
  producto: string;
  tipoPago: string;
}) => {
  try {
    const params: Record<string, string> = { page: '1', limit: '9999' };
    if (filters.estado) params.estado = filters.estado;
    if (filters.search) params.search = filters.search;
    if (filters.vendorId) params.vendorId = filters.vendorId;
    if (filters.fechaDesde) params.fechaDesde = filters.fechaDesde;
    if (filters.fechaHasta) params.fechaHasta = filters.fechaHasta;
    if (filters.producto) params.producto = filters.producto;
    if (filters.tipoPago) params.tipoPago = filters.tipoPago;
    const res = await api.get('/reservations/admin', { params });
    const rows: Reservation[] = res.data.data;

    const headers = ['Folio', 'Nombre', 'Teléfono', 'CURP', 'Total Productos', 'Productos', 'Notas', 'Dirección', 'Fecha preferida', 'Horario', 'Vendedor', 'Estado', 'Fecha creación'];
    const data = rows.map((r) => [
      r.id.slice(0, 8).toUpperCase(),
      r.nombreCompleto,
      r.telefono,
      r.curp,
      r.items?.length ?? 0,
      r.items?.map(i => `${i.product?.nombre} (${i.tipoPago})`).join('; ') ?? '',
      r.notas ?? '',
      r.direccion,
      new Date(r.fechaPreferida).toLocaleDateString('es-MX'),
      r.horarioPreferido,
      r.vendor?.nombre ?? 'Sin asignar',
      estadoLabel[r.estado],
      new Date(r.createdAt).toLocaleDateString('es-MX'),
    ]);

    const csv = [headers, ...data]
      .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Reservas exportadas correctamente');
  } catch (err) {
    console.error('Error al exportar:', err);
    showError('No se pudo exportar. Intenta de nuevo.');
  }
};

// ─────────────────────────────────────────────────────────────────────────────

const ReservationsManager = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [filterEstado, setFilterEstado] = useState('');
  const [search, setSearch] = useState('');
  const [vendors, setVendors] = useState<User[]>([]);

  // Filtros de búsqueda avanzada
  const [searchProducto, setSearchProducto] = useState('');
  const [filterTipoPago, setFilterTipoPago] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  // Modal estados
  const [assignModal, setAssignModal] = useState<{ open: boolean; reservation: Reservation | null }>({ open: false, reservation: null });
  const [statusModal, setStatusModal] = useState<{ open: boolean; reservation: Reservation | null }>({ open: false, reservation: null });
  const [assignVendorId, setAssignVendorId] = useState('');
  const [newStatus, setNewStatus] = useState<EstadoReserva>('COMPLETADA');
  const [notas, setNotas] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReservations = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: String(limit) };
      if (filterEstado) params.estado = filterEstado;
      if (search) params.search = search;
      if (filterVendor) params.vendorId = filterVendor;
      if (fechaDesde) params.fechaDesde = fechaDesde;
      if (fechaHasta) params.fechaHasta = fechaHasta;
      if (searchProducto) params.producto = searchProducto;
      if (filterTipoPago) params.tipoPago = filterTipoPago;
      const res = await api.get('/reservations/admin', { params });
      setReservations(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, filterEstado, search, filterVendor, fechaDesde, fechaHasta, searchProducto, filterTipoPago]);

  useEffect(() => { fetchReservations(); }, [fetchReservations]);

  useEffect(() => {
    api.get('/admin/users', { params: { isActive: 'true', rol: 'VENDEDOR' } })
      .then((r) => setVendors(r.data.data)).catch(() => {});
  }, []);

  const handleAssign = async () => {
    if (!assignModal.reservation || !assignVendorId) return;
    setActionLoading(true);
    try {
      await api.patch(`/reservations/admin/${assignModal.reservation.id}/assign`, { vendorId: assignVendorId });
      showSuccess('Vendedor asignado correctamente');
      setAssignModal({ open: false, reservation: null });
      fetchReservations();
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al asignar vendedor');
    }
    finally { setActionLoading(false); }
  };

  const handleStatusChange = async () => {
    if (!statusModal.reservation) return;
    setActionLoading(true);
    try {
      await api.patch(`/reservations/admin/${statusModal.reservation.id}/status`, { estado: newStatus, notas });
      showSuccess('Estado actualizado correctamente');
      setStatusModal({ open: false, reservation: null });
      setNotas('');
      fetchReservations();
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado');
    }
    finally { setActionLoading(false); }
  };

  const handleExport = async () => {
    setExporting(true);
    await exportCSV({
      estado: filterEstado,
      search,
      vendorId: filterVendor,
      fechaDesde,
      fechaHasta,
      producto: searchProducto,
      tipoPago: filterTipoPago,
    });
    setExporting(false);
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Gestión de Reservas</h2>
          <p className="text-gray-400 text-sm">{total} reservas en total</p>
        </div>
        <div className="flex gap-2 items-center">
          <select value={limit} onChange={(e) => setLimit(Number(e.target.value))}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value={10}>Mostrar 10</option>
            <option value={15}>Mostrar 15</option>
            <option value={25}>Mostrar 25</option>
            <option value={50}>Mostrar 50</option>
          </select>
          <button
            onClick={handleExport}
            disabled={exporting || total === 0}
            className="flex items-center gap-1.5 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            title="Exportar a CSV"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            {exporting ? 'Exportando...' : 'CSV'}
          </button>
        </div>
      </div>

      {/* Búsqueda avanzada */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-wrap gap-3 items-end">
          {/* Buscador principal */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Cliente, CURP, teléfono..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filtro por Estado */}
          <div className="w-36">
            <label className="text-xs text-gray-500 block mb-1">Estado</label>
            <select
              value={filterEstado}
              onChange={(e) => setFilterEstado(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {ESTADOS.map((e) => (
                <option key={e} value={e}>{estadoLabel[e]}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro por Vendedor */}
          <div className="w-40">
            <label className="text-xs text-gray-500 block mb-1">Vendedor</label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>{v.nombre}</option>
              ))}
            </select>
          </div>
          
          {/* Filtro por Tipo de Pago */}
          <div className="w-32">
            <label className="text-xs text-gray-500 block mb-1">Pago</label>
            <select
              value={filterTipoPago}
              onChange={(e) => setFilterTipoPago(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="CONTADO">Contado</option>
              <option value="CREDITO">Crédito</option>
            </select>
          </div>
        </div>
        
        {/* Segunda fila: Fechas y búsqueda por producto */}
        <div className="flex flex-wrap gap-3 items-end mt-3">
          {/* Buscador por producto */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-gray-500 block mb-1">Producto</label>
            <input
              type="text"
              placeholder="Buscar por nombre de celular..."
              value={searchProducto}
              onChange={(e) => setSearchProducto(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Fecha Desde */}
          <div className="w-40">
            <label className="text-xs text-gray-500 block mb-1">Fecha Desde</label>
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Fecha Hasta */}
          <div className="w-40">
            <label className="text-xs text-gray-500 block mb-1">Fecha Hasta</label>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Botón limpiar */}
          <button
            onClick={() => {
              setSearch('');
              setFilterEstado('');
              setFilterVendor('');
              setFilterTipoPago('');
              setSearchProducto('');
              setFechaDesde('');
              setFechaHasta('');
            }}
            className="text-sm text-blue-600 hover:text-blue-800 px-2 py-2"
          >
            Limpiar filtros
          </button>
        </div>
        
        {/* Filtros activos */}
        {(search || filterEstado || filterVendor || filterTipoPago || searchProducto || fechaDesde || fechaHasta) && (
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500">Filtros activos:</span>
            {search && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Búsqueda: "{search}"
                <button onClick={() => setSearch('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filterEstado && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Estado: {estadoLabel[filterEstado as EstadoReserva]}
                <button onClick={() => setFilterEstado('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filterVendor && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Vendedor: {vendors.find(v => v.id === filterVendor)?.nombre || ''}
                <button onClick={() => setFilterVendor('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {filterTipoPago && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Pago: {filterTipoPago === 'CONTADO' ? 'Contado' : 'Crédito'}
                <button onClick={() => setFilterTipoPago('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {searchProducto && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Producto: "{searchProducto}"
                <button onClick={() => setSearchProducto('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {fechaDesde && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Desde: {new Date(fechaDesde).toLocaleDateString('es-MX')}
                <button onClick={() => setFechaDesde('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
            {fechaHasta && (
              <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                Hasta: {new Date(fechaHasta).toLocaleDateString('es-MX')}
                <button onClick={() => setFechaHasta('')} className="ml-0.5 hover:text-blue-900">×</button>
              </span>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['ID', 'Cliente', 'Productos', 'Dirección', 'Notas', 'Fecha', 'Vendedor', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-12 text-gray-400">Sin reservas</td></tr>
              ) : (
                reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">#{r.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 whitespace-nowrap">{r.nombreCompleto}</p>
                      <p className="text-gray-400 text-xs">{r.telefono}</p>
                    </td>
                     <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-700 text-xs font-bold">
                          {r.items?.length ?? 0}
                        </span>
                        <div className="text-xs">
                          {r.items && r.items.length > 0 ? (
                            <>
                              <p className="text-gray-900 font-medium">{r.items[0].product?.nombre}</p>
                              {r.items.length > 1 && (
                                <p className="text-gray-400">+{r.items.length - 1} más</p>
                              )}
                            </>
                          ) : (
                            <p className="text-gray-400">Sin productos</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <p className="text-gray-700 text-xs truncate" title={r.direccion}>{r.direccion}</p>
                      {r.latitude !== null && r.longitude !== null && (
                        <a
                          href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 transition-colors mt-0.5"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Ver mapa
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      {r.notas ? (
                        <div className="max-w-[200px]">
                          <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block max-w-full truncate" title={r.notas}>
                            {r.notas}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
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
                          onClick={() => { setStatusModal({ open: true, reservation: r }); setNewStatus(r.estado); setNotas(r.notas || ''); }}
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

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          limit={limit}
          onPageChange={setPage}
          onLimitChange={(l) => { setLimit(l); setPage(1); }}
        />
      </div>

      {/* Modal asignar vendedor */}
      {assignModal.open && assignModal.reservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Asignar Vendedor</h3>
            <p className="text-sm text-gray-500 mb-5">Reserva #{assignModal.reservation.id.slice(0, 8).toUpperCase()} — {assignModal.reservation.nombreCompleto}</p>
            <select value={assignVendorId} onChange={(e) => setAssignVendorId(e.target.value)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4">
              <option value="">Selecciona un vendedor</option>
              {vendors.map((v) => <option key={v.id} value={v.id}>{v.nombre} — {v.zona || 'Sin zona'}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setAssignModal({ open: false, reservation: null })} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleAssign} disabled={!assignVendorId || actionLoading} className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">{actionLoading ? 'Asignando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal cambiar estado */}
      {statusModal.open && statusModal.reservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-1">Cambiar Estado</h3>
            <p className="text-sm text-gray-500 mb-5">Reserva #{statusModal.reservation.id.slice(0, 8).toUpperCase()}</p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as EstadoReserva)} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3">
              {ESTADOS.map((e) => <option key={e} value={e}>{estadoLabel[e]}</option>)}
            </select>
            <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas (opcional)" rows={3} className="w-full border border-gray-300 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setStatusModal({ open: false, reservation: null })} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleStatusChange} disabled={actionLoading} className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">{actionLoading ? 'Guardando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsManager;
