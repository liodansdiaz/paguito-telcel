import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import type { Customer, EstadoCliente } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';

const CustomersDirectory = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState<EstadoCliente | ''>('');
  const [loading, setLoading] = useState(true);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page), limit: '15' };
      if (search) params.search = search;
      if (filterEstado) params.estado = filterEstado;
      const res = await api.get('/admin/customers', { params });
      setCustomers(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCustomers(); }, [page, filterEstado]);

  const handleToggleStatus = async (customer: Customer) => {
    const newStatus: EstadoCliente = customer.estado === 'ACTIVO' ? 'BLOQUEADO' : 'ACTIVO';
    try {
      await api.patch(`/admin/customers/${customer.id}/status`, { estado: newStatus });
      fetchCustomers();
    } catch (err: any) { alert(err.response?.data?.message || 'Error'); }
  };

  const totalPages = Math.ceil(total / 15);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Directorio de Clientes</h2>
          <p className="text-gray-400 text-sm">{total} clientes registrados</p>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar nombre, CURP, tel..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchCustomers()}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
          />
          <select
            value={filterEstado}
            onChange={(e) => { setFilterEstado(e.target.value as any); setPage(1); }}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
          >
            <option value="">Todos</option>
            <option value="ACTIVO">Activos</option>
            <option value="BLOQUEADO">Bloqueados</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
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
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : customers.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-400">Sin clientes</td></tr>
              ) : customers.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0f49bd] text-white flex items-center justify-center text-xs font-bold shrink-0">
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
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 text-sm">
            <span className="text-gray-500">Página {page} de {totalPages}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Anterior</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1 rounded border border-gray-300 disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomersDirectory;
