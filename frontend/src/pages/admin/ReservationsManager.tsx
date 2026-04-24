import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import type { Reservation, EstadoReserva, User } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import Pagination from '../../components/ui/Pagination';
import { showSuccess, showError } from '../../utils/notifications';
import * as XLSX from 'xlsx';

const ESTADOS: EstadoReserva[] = ['NUEVA', 'ASIGNADA', 'EN_VISITA', 'PARCIAL', 'COMPLETADA', 'CANCELADA', 'SIN_STOCK'];
const estadoLabel: Record<EstadoReserva, string> = {
  NUEVA: 'Nueva', ASIGNADA: 'Asignada', EN_VISITA: 'En visita',
  PARCIAL: 'Parcial', COMPLETADA: 'Completada', CANCELADA: 'Cancelada', SIN_STOCK: 'Sin stock',
};

// ── Exportar a XLSX ────────────────────────────────────────────────────────────
const exportToExcel = async (filters: {
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

    const data = rows.map((r) => ({
      Folio: r.id.slice(0, 8).toUpperCase(),
      Nombre: r.nombreCompleto,
      Teléfono: r.telefono,
      CURP: r.curp,
      'Total Productos': r.items?.length ?? 0,
      Productos: r.items?.map(i => `${i.product?.nombre} (${i.tipoPago})`).join('; ') ?? '',
      Variante: r.items?.map(i => [i.color, i.memoria].filter(Boolean).join(', ') || '—').join('; ') ?? '',
      Notas: r.notas ?? '',
      Dirección: r.direccion,
      'Fecha preferida': new Date(r.fechaPreferida).toLocaleDateString('es-MX'),
      Horario: r.horarioPreferido,
      Vendedor: r.vendor?.nombre ?? 'Sin asignar',
      Estado: estadoLabel[r.estado],
      'Fecha creación': new Date(r.createdAt).toLocaleDateString('es-MX'),
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reservas');

    // Ajustar ancho de columnas
    const wscols = [
      { wch: 10 },  // Folio
      { wch: 20 },  // Nombre
      { wch: 15 },  // Teléfono
      { wch: 15 },  // CURP
      { wch: 12 },  // Total Productos
      { wch: 30 },  // Productos
      { wch: 20 },  // Variante
      { wch: 30 },  // Notas
      { wch: 30 },  // Dirección
      { wch: 12 },  // Fecha preferida
      { wch: 10 },  // Horario
      { wch: 20 },  // Vendedor
      { wch: 12 },  // Estado
      { wch: 12 },  // Fecha creación
    ];
    worksheet['!cols'] = wscols;

    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reservas_${new Date().toISOString().slice(0, 10)}.xlsx`;
    a.click();
    URL.revokeObjectURL(url);
    showSuccess('Reservas exportadas correctamente a Excel');
  } catch (err) {
    console.error('Error al exportar a Excel:', err);
    showError('No se pudo exportar a Excel. Intenta de nuevo.');
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
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; reservation: Reservation | null }>({ open: false, reservation: null });
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

  // Asignación rápida inline (modo manual)
  const handleQuickAssign = async (reservationId: string, vendorId: string) => {
    if (!vendorId) return;
    try {
      await api.patch(`/reservations/admin/${reservationId}/assign-vendor`, { vendorId });
      showSuccess('Vendedor asignado correctamente');
      fetchReservations();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al asignar vendedor');
    }
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

  const handleDelete = async () => {
    if (!deleteModal.reservation) return;
    setActionLoading(true);
    try {
      await api.delete(`/reservations/admin/${deleteModal.reservation.id}`);
      showSuccess('Reserva eliminada correctamente');
      setDeleteModal({ open: false, reservation: null });
      fetchReservations();
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al eliminar reserva');
    }
    finally { setActionLoading(false); }
  };

   const handleExport = async () => {
     setExporting(true);
     await exportToExcel({
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
             title="Exportar a Excel"
           >
             <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
               <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
             </svg>
             {exporting ? 'Exportando...' : 'Exportar a Excel'}
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
                {['ID', 'Cliente', 'Producto', 'Variante', 'Tipo Pago', 'Dirección', 'Notas', 'F. Reserva', 'F. Entrega', 'Vendedor', 'Estado', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 12 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : reservations.length === 0 ? (
                <tr><td colSpan={12} className="text-center py-12 text-gray-400">Sin reservas</td></tr>
              ) : (
                reservations.flatMap((r) => {
                  const items = r.items && r.items.length > 0 ? r.items : [null];
                  return items.map((item, idx) => {
                    const isFirst = idx === 0;
                    return (
                      <tr
                        key={`${r.id}-${item?.id ?? 'empty'}`}
                        className={`hover:bg-gray-50 transition-colors ${!isFirst ? 'bg-gray-50/50' : ''}`}
                      >
                        {/* ID */}
                        <td className={`px-4 py-3 font-mono text-xs text-gray-500 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst ? `#${r.id.slice(0, 8).toUpperCase()}` : (
                            <span className="text-gray-300 pl-3">└</span>
                          )}
                        </td>
                        {/* Cliente */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
                            <>
                              <p className="font-medium text-gray-900 whitespace-nowrap">{r.nombreCompleto}</p>
                              <p className="text-gray-400 text-xs">{r.telefono}</p>
                            </>
                          )}
                        </td>
                        {/* Producto */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {item ? (
                            <span className="text-xs text-gray-900 font-medium">{item.product?.nombre}</span>
                          ) : (
                            <span className="text-xs text-gray-400">Sin productos</span>
                          )}
                        </td>
                        {/* Variante */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {item ? (
                            <div className="flex flex-wrap gap-1">
                              {item.color && (
                                <span className="text-[10px] font-medium bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                  {item.color}
                                </span>
                              )}
                              {item.memoria && (
                                <span className="text-[10px] font-medium bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                                  {item.memoria}
                                </span>
                              )}
                              {!item.color && !item.memoria && <span className="text-xs text-gray-400">—</span>}
                            </div>
                          ) : '—'}
                        </td>
                        {/* Tipo Pago */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {item ? (
                            <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.tipoPago === 'CREDITO' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                              {item.tipoPago === 'CREDITO' ? 'Crédito' : 'Contado'}
                            </span>
                          ) : '—'}
                        </td>
                        {/* Dirección */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
                            <>
                              <p className="text-gray-700 text-xs">{r.direccion}</p>
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
                            </>
                          )}
                        </td>
                        {/* Notas */}
                        <td className={`px-4 py-3 max-w-[140px] ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
                            r.notas ? (
                              <div className="max-w-[140px]">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded inline-block max-w-full truncate" title={r.notas}>
                                  {r.notas}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )
                          )}
                        </td>
                        {/* F. Reserva */}
                        <td className={`px-4 py-3 text-gray-500 whitespace-nowrap text-xs ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
                            new Date(r.createdAt).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })
                          )}
                        </td>
                        {/* F. Entrega */}
                        <td className={`px-4 py-3 text-gray-600 whitespace-nowrap text-xs ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
                            <>{new Date(r.fechaPreferida).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} {r.horarioPreferido}</>
                          )}
                        </td>
                        {/* Vendedor */}
                        <td className={`px-4 py-3 text-gray-700 whitespace-nowrap text-xs ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
                            r.vendor ? (
                              <span className="text-gray-700">{r.vendor.nombre}</span>
                            ) : (
                              <div className="flex items-center gap-1">
                                <select
                                  onChange={(e) => handleQuickAssign(r.id, e.target.value)}
                                  className="text-xs border border-orange-300 rounded px-1 py-1 bg-orange-50 text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-400"
                                  defaultValue=""
                                >
                                  <option value="" disabled>⚠️ Sin asignar</option>
                                  {vendors.map((v) => (
                                    <option key={v.id} value={v.id}>
                                      {v.nombre}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            )
                          )}
                        </td>
                        {/* Estado */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && <StatusBadge type="reserva" estado={r.estado} />}
                        </td>
                        {/* Acciones */}
                        <td className={`px-4 py-3 ${!isFirst ? 'border-t border-dashed border-gray-200' : ''}`}>
                          {isFirst && (
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
                              <button
                                onClick={() => setDeleteModal({ open: true, reservation: r })}
                                className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded hover:bg-red-100 transition-colors whitespace-nowrap"
                              >
                                Borrar
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  });
                })
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
              <button onClick={handleAssign} disabled={!assignVendorId || actionLoading} className="flex-1 bg-primary-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">{actionLoading ? 'Asignando...' : 'Confirmar'}</button>
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
              <button onClick={handleStatusChange} disabled={actionLoading} className="flex-1 bg-primary-500 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50">{actionLoading ? 'Guardando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminación */}
      {deleteModal.open && deleteModal.reservation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900">Eliminar Reserva</h3>
                <p className="text-sm text-gray-500">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <div className="bg-red-50 border border-red-100 rounded-lg p-3 mb-5">
              <p className="text-sm text-red-800">
                Se eliminará permanentemente la reserva <span className="font-semibold">#{deleteModal.reservation.id.slice(0, 8).toUpperCase()}</span> de <span className="font-semibold">{deleteModal.reservation.nombreCompleto}</span> junto con todos sus items y notificaciones.
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteModal({ open: false, reservation: null })} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancelar</button>
              <button onClick={handleDelete} disabled={actionLoading} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-red-700">{actionLoading ? 'Eliminando...' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReservationsManager;
