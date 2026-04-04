import { useEffect, useState, useCallback } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  FunnelChart, Funnel, LabelList,
} from 'recharts';
import api from '../../services/api';
import type { AdminMetrics, ChartDataPoint, StatusDistribution, VendorRanking } from '../../types';
import * as XLSX from 'xlsx';

// Colores reales para Recharts (no clases Tailwind)
const CHART_COLORS = {
  primary: '#0f49bd',      // Azul principal
  secondary: '#002f87',   // Azul oscuro
  accent: '#13ec6d',      // Verde
  warning: '#f59e0b',      // Naranja/amarillo
  danger: '#ef4444',       // Rojo
  purple: '#8b5cf6',      // Morado
  cyan: '#06b6d4',        // Cyan
  gray: '#6b7280',        // Gris
};

// Colores para el pie chart (distribución por estado)
const PIE_COLORS = [
  CHART_COLORS.primary,    // Nueva
  CHART_COLORS.secondary, // Asignada
  CHART_COLORS.cyan,       // En visita
  CHART_COLORS.accent,     // Vendida
  CHART_COLORS.warning,    // No concretada
  CHART_COLORS.danger,    // Cancelada
  CHART_COLORS.gray,       // Sin stock
];

// Iconos SVG para las métricas
const MetricIcons = {
  calendar: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  week: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  month: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  active: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  ),
  check: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  x: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  box: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  ),
  users: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
    </svg>
  ),
  userCheck: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  ),
  userX: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  ),
  star: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.815 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
    </svg>
  ),
  refresh: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  download: () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  ),
};

const MetricCard = ({ 
  label, 
  value, 
  sub, 
  icon: Icon,
  variant = 'default'
}: { 
  label: string; 
  value: number | string; 
  sub?: string;
  icon?: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) => {
  const variants = {
    default: 'border-gray-100',
    success: 'border-green-100 bg-green-50',
    warning: 'border-yellow-100 bg-yellow-50',
    danger: 'border-red-100 bg-red-50',
  };
  
  const textColors = {
    default: 'text-gray-900',
    success: 'text-green-700',
    warning: 'text-yellow-700',
    danger: 'text-red-700',
  };
  
  const iconColors = {
    default: 'text-gray-400',
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
  };

  return (
    <div className={`bg-white rounded-xl p-4 shadow-sm border ${variants[variant]} flex items-start gap-3`}>
      {Icon && (
        <div className={`p-2 rounded-lg bg-gray-50 ${iconColors[variant]}`}>
          <Icon />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide truncate">{label}</p>
        <p className={`text-2xl font-bold ${textColors[variant]}`}>{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5 truncate">{sub}</p>}
      </div>
    </div>
  );
};

const statusLabel: Record<string, string> = {
  NUEVA: 'Nueva', ASIGNADA: 'Asignada', EN_VISITA: 'En visita',
  VENDIDA: 'Vendida', NO_CONCRETADA: 'No concretada', CANCELADA: 'Cancelada', SIN_STOCK: 'Sin stock',
};

// Función para exportar a Excel
const exportToExcel = async (metrics: any, distribution: any[], ranking: any[], fechaDesde?: string, fechaHasta?: string) => {
  const wb = XLSX.utils.book_new();
  
  // Hoja de métricas
  const metricsData = [
    ['Métrica', 'Valor'],
    ['Reservas hoy', metrics?.reservasHoy ?? 0],
    ['Esta semana', metrics?.reservasSemana ?? 0],
    ['Este mes', metrics?.reservasMes ?? 0],
    ['Activas', metrics?.activas ?? 0],
    ['Completadas', metrics?.completadas ?? 0],
    ['Canceladas', metrics?.canceladas ?? 0],
    ['Sin stock', metrics?.sinStock ?? 0],
    ['Total clientes', metrics?.totalClientes ?? 0],
    ['Vendedores activos', metrics?.vendedoresActivos ?? 0],
  ];
  const wsMetrics = XLSX.utils.aoa_to_sheet(metricsData);
  XLSX.utils.book_append_sheet(wb, wsMetrics, 'Métricas');
  
  // Hoja de distribución por estado
  const distData = [['Estado', 'Cantidad']];
  distribution.forEach((d: any) => {
    distData.push([statusLabel[d.estado] || d.estado, d.count]);
  });
  const wsDist = XLSX.utils.aoa_to_sheet(distData);
  XLSX.utils.book_append_sheet(wb, wsDist, 'Por Estado');
  
  // Hoja de ranking de vendedores
  const rankData = [['Vendedor', 'Vendidas', 'Asignadas']];
  ranking.forEach((v: any) => {
    rankData.push([v.nombre, v.totalVendidas, v.totalAsignadas]);
  });
  const wsRank = XLSX.utils.aoa_to_sheet(rankData);
  XLSX.utils.book_append_sheet(wb, wsRank, 'Ranking');
  
  // Descargar
  const fileName = `dashboard_${fechaDesde || 'todos'}_${fechaHasta || 'todos'}.xlsx`;
  XLSX.writeFile(wb, fileName);
};

const AdminDashboard = () => {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [chart, setChart] = useState<ChartDataPoint[]>([]);
  const [distribution, setDistribution] = useState<StatusDistribution[]>([]);
  const [ranking, setRanking] = useState<VendorRanking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  
  // Filtros de fecha
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');

  const fetchData = useCallback(async (desde?: string, hasta?: string) => {
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
      setLastRefresh(new Date());
    } catch (err) {
      console.error(err);
      setError('No se pudieron cargar los datos del dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(fechaDesde, fechaHasta);
  }, [fechaDesde, fechaHasta, fetchData]);

  // Auto-refresh cada 30 segundos
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData(fechaDesde, fechaHasta);
    }, 30000);
    return () => clearInterval(interval);
  }, [fechaDesde, fechaHasta, fetchData]);

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

  // Calcular % de conversión
  const conversionRate = metrics && metrics.reservasMes > 0
    ? ((metrics.completadas / metrics.reservasMes) * 100).toFixed(1)
    : '0';
  
  // Vendedor top
  const topVendor = ranking.length > 0 ? ranking[0] : null;

  // Funnel data (conversión de estados) - usando string keys
  const funnelData = [
    { name: 'Nuevas', value: distribution.find(d => d.estado === 'NUEVA' as any)?.count || 0, fill: CHART_COLORS.primary },
    { name: 'Asignadas', value: distribution.find(d => d.estado === 'ASIGNADA' as any)?.count || 0, fill: CHART_COLORS.secondary },
    { name: 'En visita', value: distribution.find(d => d.estado === 'EN_VISITA' as any)?.count || 0, fill: CHART_COLORS.cyan },
    { name: 'Vendidas', value: distribution.find(d => d.estado === 'VENDIDA' as any)?.count || 0, fill: CHART_COLORS.accent },
  ];

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
          <p className="text-gray-400 text-sm flex items-center gap-2">
            Resumen del sistema 
            {fechaDesde && fechaHasta 
              ? ` (${new Date(fechaDesde).toLocaleDateString('es-MX')} - ${new Date(fechaHasta).toLocaleDateString('es-MX')})`
              : ' en tiempo real'
            }
            <span className="text-xs text-gray-400">
              • Actualizado: {lastRefresh.toLocaleTimeString('es-MX')}
            </span>
          </p>
        </div>
        
        {/* Filtros de fecha y acciones */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Botón refresh */}
          <button
            onClick={() => fetchData(fechaDesde, fechaHasta)}
            className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            title="Actualizar datos"
          >
            <MetricIcons.refresh />
          </button>

          {/* Botón exportar */}
          <button
            onClick={() => exportToExcel(metrics, distribution, ranking, fechaDesde, fechaHasta)}
            className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
          >
            <MetricIcons.download />
            Exportar
          </button>

          {/* Presets rápidos */}
          <div className="flex gap-1">
            <button
              onClick={() => applyPreset('todos')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                !fechaDesde && !fechaHasta 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => applyPreset('hoy')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                fechaDesde === fechaHasta && fechaDesde
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Hoy
            </button>
            <button
              onClick={() => applyPreset('semana')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                fechaDesde && !fechaHasta
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => applyPreset('mes')}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                fechaDesde && !fechaHasta
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Mes
            </button>
          </div>
          
          {/* Inputs de fecha */}
          <div className="flex gap-2 items-center ml-2 pl-2 border-l border-gray-200">
            <input
              type="date"
              value={fechaDesde}
              onChange={(e) => setFechaDesde(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setFechaHasta(e.target.value)}
              className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <MetricCard label="Reservas hoy" value={metrics?.reservasHoy ?? 0} icon={MetricIcons.calendar} />
        <MetricCard label="Esta semana" value={metrics?.reservasSemana ?? 0} icon={MetricIcons.week} />
        <MetricCard label="Este mes" value={metrics?.reservasMes ?? 0} icon={MetricIcons.month} />
        <MetricCard label="Activas" value={metrics?.activas ?? 0} sub="Nueva + Asignada + En visita" icon={MetricIcons.active} variant="success" />
        <MetricCard label="Completadas" value={metrics?.completadas ?? 0} sub="Vendidas total" icon={MetricIcons.check} variant="success" />
        <MetricCard label="Canceladas" value={metrics?.canceladas ?? 0} icon={MetricIcons.x} variant="danger" />
        <MetricCard label="Sin stock" value={metrics?.sinStock ?? 0} icon={MetricIcons.box} variant="warning" />
        <MetricCard label="Clientes" value={metrics?.totalClientes ?? 0} icon={MetricIcons.users} />
        <MetricCard label="Vendedores activos" value={metrics?.vendedoresActivos ?? 0} icon={MetricIcons.userCheck} variant="success" />
        <MetricCard label="Vendedores inactivos" value={metrics?.vendedoresInactivos ?? 0} icon={MetricIcons.userX} variant="danger" />
      </div>

      {/* KPIs adicionales - Conversión y Top Vendor */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Tasa de Conversión</p>
              <p className="text-4xl font-bold">{conversionRate}%</p>
              <p className="text-blue-100 text-xs mt-1">Vendidas / Total del mes</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MetricIcons.star />
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-r from-accent-500 to-green-600 rounded-xl p-5 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Vendedor Top</p>
              <p className="text-2xl font-bold truncate">{topVendor?.nombre || 'N/A'}</p>
              <p className="text-green-100 text-xs mt-1">{topVendor?.totalVendidas || 0} ventas concretadas</p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <MetricIcons.star />
            </div>
          </div>
        </div>
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
              <Line type="monotone" dataKey="count" stroke={CHART_COLORS.primary} strokeWidth={2} dot={{ fill: CHART_COLORS.primary }} name="Reservas" />
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
                  <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(val, name) => [val, statusLabel[name as string] ?? name]} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Funnel de conversión */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-800 mb-4">Funnel de conversión</h3>
        <ResponsiveContainer width="100%" height={200}>
          <FunnelChart>
            <Tooltip />
            <Funnel dataKey="value" data={funnelData} isAnimationActive>
              <LabelList position="right" fill="#000" stroke="none" dataKey="name" />
            </Funnel>
          </FunnelChart>
        </ResponsiveContainer>
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
            <Bar dataKey="totalVendidas" name="Vendidas" fill={CHART_COLORS.accent} radius={[0, 4, 4, 0]} />
            <Bar dataKey="totalAsignadas" name="Asignadas" fill={CHART_COLORS.primary} radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AdminDashboard;
