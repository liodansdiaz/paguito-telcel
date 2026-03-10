import { useEffect, useState } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import api from '../../services/api';
import type { AdminMetrics, ChartDataPoint, StatusDistribution, VendorRanking } from '../../types';

const COLORS = ['#13ec6d', '#0f49bd', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#6b7280'];

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

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/admin/metrics'),
      api.get('/dashboard/admin/chart'),
      api.get('/dashboard/admin/status-distribution'),
      api.get('/dashboard/admin/vendor-ranking'),
    ]).then(([m, c, d, r]) => {
      setMetrics(m.data.data);
      setChart(c.data.data);
      setDistribution(d.data.data);
      setRanking(r.data.data.slice(0, 10));
      setError(null);
    }).catch((err) => {
      console.error(err);
      setError('No se pudieron cargar los datos del dashboard. Verifica tu conexión e intenta de nuevo.');
    }).finally(() => setLoading(false));
  }, []);

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
      <div>
        <h2 className="text-xl font-bold text-gray-900">Dashboard General</h2>
        <p className="text-gray-400 text-sm">Resumen del sistema en tiempo real</p>
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
              <Line type="monotone" dataKey="count" stroke="#0f49bd" strokeWidth={2} dot={{ fill: '#0f49bd' }} name="Reservas" />
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
            <Bar dataKey="totalVendidas" name="Vendidas" fill="#13ec6d" radius={[0, 4, 4, 0]} />
            <Bar dataKey="totalAsignadas" name="Asignadas" fill="#0f49bd" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
