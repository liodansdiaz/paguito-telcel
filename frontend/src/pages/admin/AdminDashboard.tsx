import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import type { AdminMetrics, ChartDataPoint, StatusDistribution, VendorRanking } from '../../types';

const COLORS = ['accent-500', 'primary-500', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6b7280'];

const MetricCard = ({ label, value, sub }: { label: string; value: number | string; sub?: string }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
    <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">{label}</p>
    <p className="text-3xl font-bold text-gray-900">{value}</p>
    {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
  </div>
);

const statusLabel: Record<string, string> = {
  NUEVA: 'Nueva', ASIGNADA: 'Asignada', EN_VISITA: 'En visita',
  VENDIDA: 'Vendida', NO_CONCRETADA: 'No concretada', CANCELADA: 'Cancelada', SIN_STOCK: 'Sin stock',
};

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [chart, setChart] = useState<ChartDataPoint[]>([]);
  const [distribution, setDistribution] = useState<StatusDistribution[]>([]);
  const [ranking, setRanking] = useState<VendorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchData = async (desde?: string, hasta?: string) => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (desde) params.fechaDesde = desde;
      if (hasta) params.fechaHasta = hasta;
      
      const [m, c, d, r] = await Promise.all([
        api.get('/dashboard/admin/metrics', { params }),
        api.get('/dashboard/admin/chart', { params }),
        api.get('/dashboard/admin/status-distribution', { params }),
        api.get('/dashboard/admin/vendor-ranking', { params }),
      ]);
      
      setMetrics(m.data.data);
      setChart(c.data.data);
      setDistribution(d.data.data);
      setRanking(r.data.data.slice(0, 10));
      setError(null);
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos del dashboard. Verifica tu conexión e intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta]);

  // Presets de fecha
  const applyPreset = (preset: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    switch (preset) {
      case 'hoy':
        setFechaDesde(todayStr);
        setFechaHasta(todayStr);
        break;
      case 'semana':
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        setFechaDesde(startOfWeek.toISOString().split('T')[0]);
        setFechaHasta(todayStr);
        break;
      case 'mes':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        setFechaDesde(startOfMonth.toISOString().split('T')[0]);
        setFechaHasta(todayStr);
        break;
      case 'ultimos7':
        const startOf7Days = new Date(today);
        startOf7Days.setDate(today.getDate() - 7);
        setFechaDesde(startOf7Days.toISOString().split('T')[0]);
        setFechaHasta(todayStr);
        break;
      case 'todos':
        setFechaDesde('');
        setFechaHasta('');
        break;
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl p-5 animate-pulse h-24 shadow-sm" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4">
        <div className="bg-red-50 border border-red-200 rounded-2xl px-8 py-6 max-w-md text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 text-red-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-red-700 font-semibold text-sm">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); window.location.reload(); }}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabecera con filtros de fecha */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Dashboard General</h2>
          <p className="text-gray-400 text-sm">
            Resumen del sistema 
            {fechaDesde && fechaHasta 
              ? ` (${new Date(fechaDesde).toLocaleDateString('es-MX')} - ${new Date(fechaHasta).toLocaleDateString('es-MX')})`
              : ' en tiempo real'
            }
          </p>
        </div>
        
        {/* Filtros de fecha */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Presets rápidos */}
          <div className="flex gap-1">
            <button
              onClick={() => applyPreset('todos')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                !fechaDesde && !fechaHasta 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => applyPreset('hoy')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                fechaDesde === fechaHasta && fechaDesde
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => applyPreset('semana')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                fechaDesde && !fechaHasta && fechaDesde !== fechaHasta
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Esta semana
            </button>
            <button
              onClick={() => applyPreset('mes')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                fechaDesde && !fechaHasta && fechaDesde !== fechaHasta
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Este mes
            </button>
          </div>
          
          {/* Inputs de fecha */}
          <div className="flex gap-2 items-center ml-2 pl-2 border-l border-gray-200">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Reservas hoy" value={metrics?.reservasHoy ?? 0} />
        <MetricCard label="Esta semana" value={metrics?.reservasSemana ?? 0} />
        <MetricCard label="Este mes" value={metrics?.reservasMes ?? 0} />
        <MetricCard label="Activas" value={metrics?.activas ?? 0} sub="Nueva + Asignada + En visita" />
        <MetricCard label="Completadas" value={metrics?.completadas ?? 0} sub="Vendidas total" />
        <MetricCard label="Canceladas" value={metrics?.canceladas ?? 0} />
        <MetricCard label="Sin stock" value={metrics?.sinStock ?? 0} />
        <MetricCard label="Clientes" value={metrics?.totalClientes ?? 0} />
        <MetricCard label="Vendedores activos" value={metrics?.vendedoresActivos ?? 0} />
        <MetricCard label="Vendedores inactivos" value={metrics?.vendedoresInactivos ?? 0} />
      </div>

      {/* Gráficas */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Línea — últimos 7 días */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Reservas — últimos 7 días</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chart}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="primary-500" strokeWidth={2} dot={{ fill: 'primary-500' }} name="Reservas" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie — distribución por estado */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-4">Por estado</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={distribution}
                dataKey="count"
                nameKey="estado"
                cx="50%"
                cy="50%"
                outerRadius={80}
                label={({ estado, percent }: any) => `${statusLabel[estado] ?? estado} ${((percent ?? 0) * 100).toFixed(0)}%`}
                labelLine={false}
              >
                {distribution.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, statusLabel[name as string] ?? name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Ranking de vendedores */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Ranking de vendedores (por ventas)</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={ranking} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
            <YAxis type="category" dataKey="nombre" tick={{ fontSize: 11 }} width={110} />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalVendidas" name="Vendidas" fill="accent-500" radius={[0, 4, 4, 0]} />
            <Bar dataKey="totalAsignadas" name="Asignadas" fill="primary-500" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
