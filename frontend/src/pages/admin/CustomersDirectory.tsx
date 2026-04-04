import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Customer, EstadoCliente } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import { showSuccess, showError } from '../../utils/notifications';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import * as XLSX from 'xlsx';

const CustomersDirectory = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoCliente | ''>('');
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const totalPages = Math.ceil(total / limit);

  const fetchCustomers = useCallback(async (p = page, l = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(p), limit: String(l) };
      if (search) params.search = search;
      if (filterEstado) params.estado = filterEstado;
      const res = await api.get('/admin/customers', { params });
      setCustomers(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, limit, search, filterEstado]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleToggleStatus = async (customer: Customer) => {
    const newStatus: EstadoCliente = customer.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
    try {
      await api.patch(`/admin/customers/${customer.id}/status`, { estado: newStatus });
      showSuccess(`Cliente ${newStatus === 'ACTIVO' ? 'activado' : 'bloqueado'} correctamente`);
      fetchCustomers();
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del cliente');
    }
  };

   const exportToExcel = async () => {
     setExporting(true);
     try {
       const params: Record<string, string> = { page: '1', limit: '9999' };
       if (search) params.search = search;
       if (filterEstado) params.estado = filterEstado;
       const res = await api.get('/admin/customers', { params });
       const rows: Customer[] = res.data.data;

       // Procesar datos para Excel
       const excelData = rows.map((c) => ({
         'Nombre': c.nombreCompleto,
         'Teléfono': c.telefono,
         'CURP': c.curp,
         'Email': c.email ?? '',
         'Dirección': c.direccion ?? '',
         'Reservas': c._count?.reservations ?? 0,
         'Estado': c.estado === 'ACTIVO' ? 'Activo' : 'Bloqueado',
         'Fecha registro': new Date(c.createdAt).toLocaleDateString('es-MX'),
       }));

       // Crear hoja de trabajo
       const worksheet = XLSX.utils.json_to_sheet(excelData);
       const workbook = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');
       
       // Generar archivo Excel
       const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
       const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
       const url = window.URL.createObjectURL(excelBlob);
       
       // Crear enlace de descarga
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `clientes_${new Date().toISOString().slice(0, 10)}.xlsx`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       
       // Liberar memoria
       window.URL.revokeObjectURL(url);
       
       showSuccess('Clientes exportados correctamente');
     } catch (err) {
       console.error('Error al exportar a Excel:', err);
       showError('No se pudo exportar a Excel. Intenta de nuevo.');
     } finally {
       setExporting(false);
     }
   };

  // Filtros UI
  const filtersUI = (
    <div className="w-32">
      <label className="text-xs text-gray-500 block mb-1">Estado</label>
      <select
        value={filterEstado}
        onChange={(e) => { setFilterEstado(e.target.value as EstadoCliente | ''); setPage(1); }}
        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos</option>
        <option value="ACTIVO">Activos</option>
        <option value="BLOQUEADO">Bloqueados</option>
      </select>
    </div>
  );

  const activeFiltersUI = (
    <>
      {search && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Búsqueda: "{search}"
          <button onClick={() => setSearch('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {filterEstado && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Estado: {filterEstado === 'ACTIVO' ? 'Activo' : 'Bloqueado'}
          <button onClick={() => setFilterEstado('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
    </>
  );

  return (
       <AdminPageLayout
         title="Directorio de Clientes"
         subtitle={`${total} clientes registrados`}
         total={total}
         page={page}
         totalPages={totalPages}
         limit={limit}
         loading={loading}
         exporting={exporting}
         onPageChange={setPage}
         onLimitChange={setLimit}
         onExport={exportToExcel}
         searchPlaceholder="Buscar por nombre, CURP o teléfono..."
         searchValue={search}
         onSearchChange={setSearch}
         onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
         filters={filtersUI}
         activeFilters={activeFiltersUI}
       >
      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Cliente', 'Teléfono', 'CURP', 'Reservas', 'Estado', 'Acciones'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array.from({ length: limit }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                  ))}
                </tr>
              ))
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin clientes</td></tr>
            ) : (
              customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary-500 text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {c.nombreCompleto.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{c.nombreCompleto}</p>
                        <p className="text-gray-400 text-xs">{new Date(c.createdAt).toLocaleDateString('es-MX')}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{c.telefono}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.curp}</td>
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">{c._count?.reservations ?? 0}</td>
                  <td className="px-4 py-3"><StatusBadge type="cliente" estado={c.estado} /></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link to={`/admin/clientes/${c.id}`} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100">Ver</Link>
                      <button
                        onClick={() => handleToggleStatus(c)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${c.estado === 'ACTIVO' ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      >
                        {c.estado === 'ACTIVO' ? 'Bloquear' : 'Activar'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </AdminPageLayout>
  );
};

export default CustomersDirectory;
