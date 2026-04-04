import { useState, useEffect } from 'react';
import api from '../../services/api';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

// ============================================
// TIPOS
// ============================================

interface LogFile {
  name: string;
  size: string;
  date: string;
  modified: string;
  compressed: boolean;
}

interface LogStats {
  totalFiles: number;
  totalSize: string;
  errorsToday: number;
  warningsToday: number;
}

interface Notification {
  id: string;
  canal: 'EMAIL' | 'WHATSAPP' | 'INTERNAL';
  status: 'PENDING' | 'SENT' | 'FAILED';
  destinatario: string | null;
  destinatarioNombre: string | null;
  asunto: string | null;
  mensaje: string | null;
  error: string | null;
  sentAt: string | null;
  createdAt: string;
  reservation: {
    id: string;
    nombreCompleto: string;
    telefono: string;
    estado: string;
  };
}

interface NotificationStats {
  total: number;
  sent: number;
  failed: number;
  pending: number;
  sentToday: number;
  failedToday: number;
  emailCount: number;
  whatsappCount: number;
}

// ============================================
// COMPONENTES AUXILIARES
// ============================================

const levelColors: Record<string, string> = {
  error: 'text-red-600 bg-red-50 border-red-200',
  warn: 'text-yellow-600 bg-yellow-50 border-yellow-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  debug: 'text-gray-500 bg-gray-50 border-gray-200',
};

const canalColors: Record<string, string> = {
  EMAIL: 'text-blue-600 bg-blue-50 border-blue-200',
  WHATSAPP: 'text-green-600 bg-green-50 border-green-200',
  INTERNAL: 'text-purple-600 bg-purple-50 border-purple-200',
};

const statusColors: Record<string, string> = {
  SENT: 'text-green-600 bg-green-50 border-green-200',
  FAILED: 'text-red-600 bg-red-50 border-red-200',
  PENDING: 'text-yellow-600 bg-yellow-50 border-yellow-200',
};

const getLevel = (line: string): string => {
  if (line.toLowerCase().includes('[error]')) return 'error';
  if (line.toLowerCase().includes('[warn]')) return 'warn';
  if (line.toLowerCase().includes('[debug]')) return 'debug';
  return 'info';
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('es-MX', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// ============================================
// COMPONENTE: PESTAÑA DE LOGS
// ============================================

const LogsTab = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [files, setFiles] = useState<LogFile[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fecha: '',
    nivel: '',
    busqueda: '',
    page: 1,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: filters.page, limit: 100 };
      if (filters.fecha) params.fecha = filters.fecha;
      if (filters.nivel) params.nivel = filters.nivel;
      if (filters.busqueda) params.busqueda = filters.busqueda;

      const { data } = await api.get('/admin/logs', { params });
      setLogs(data.logs);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Error cargando logs');
    } finally {
      setLoading(false);
    }
  };

  const fetchFiles = async () => {
    try {
      const { data } = await api.get('/admin/logs/files');
      setFiles(data.files);
    } catch {
      toast.error('Error cargando archivos');
    }
  };

  const fetchStats = async () => {
    try {
      const { data } = await api.get('/admin/logs/stats');
      setStats(data);
    } catch {
      toast.error('Error cargando estadísticas');
    }
  };

  useEffect(() => {
    fetchFiles();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchLogs();
  }, [filters]);

   const handleDownload = async (filename: string) => {
     try {
       const response = await api.get(`/admin/logs/download/${filename}`, {
         responseType: 'blob',
       });
       const url = window.URL.createObjectURL(new Blob([response.data]));
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', filename.replace('.gz', ''));
       document.body.appendChild(link);
       link.click();
       link.remove();
     } catch {
       toast.error('Error descargando archivo');
     }
   };

   const exportLogsToExcel = async () => {
     try {
       // Exportar logs actuales con filtros aplicados
       const params: Record<string, string | number> = { 
         page: filters.page, 
         limit: 1000 // Límite alto para obtener todos los logs filtrados
       };
       if (filters.fecha) params.fecha = filters.fecha;
       if (filters.nivel) params.nivel = filters.nivel;
       if (filters.busqueda) params.busqueda = filters.busqueda;

       const { data } = await api.get('/admin/logs', { params });
       
        // Procesar logs para el formato de Excel
        const logData = data.logs.map((line: string) => {
          const level = getLevel(line);
          return {
            'Nivel': level.toUpperCase(),
            'Mensaje': line,
            'Fecha/Hora': new Date().toLocaleString('es-MX')
          };
        });

       // Crear hoja de trabajo
       const worksheet = XLSX.utils.json_to_sheet(logData);
       const workbook = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs del Sistema');
       
        // Generar archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(excelBlob);
       
       // Crear enlace de descarga
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `logs_sistema_${new Date().toISOString().slice(0,10)}.xlsx`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       
       // Liberar memoria
       window.URL.revokeObjectURL(url);
       
       toast.success('Logs exportados a Excel exitosamente');
     } catch (error) {
       console.error('Error exportando logs a Excel:', error);
       toast.error('Error exportando logs a Excel');
     }
   };

   return (
    <div className="space-y-6">
       {/* Estadísticas de logs */}
       {stats && (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
             <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Archivos</p>
             <p className="text-2xl font-bold text-gray-900">{stats.totalFiles}</p>
           </div>
           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
             <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Tamaño total</p>
             <p className="text-2xl font-bold text-gray-900">{stats.totalSize}</p>
           </div>
           <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
             <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Errores hoy</p>
             <p className="text-2xl font-bold text-red-600">{stats.errorsToday}</p>
           </div>
           <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
             <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-1">Warnings hoy</p>
             <p className="text-2xl font-bold text-yellow-600">{stats.warningsToday}</p>
           </div>
         </div>
       )}
       {/* Botón para exportar logs a Excel */}
       <div className="flex justify-end mb-4">
         <button
           onClick={exportLogsToExcel}
           className="bg-[primary-500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
           Exportar logs a Excel
         </button>
       </div>

      {/* Filtros de logs */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fecha</label>
            <select
              value={filters.fecha}
              onChange={(e) => setFilters({ ...filters, fecha: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Hoy (archivo actual)</option>
              {files
                .filter(f => f.name !== 'combined.log')
                .map(f => (
                  <option key={f.name} value={f.date}>
                    {f.date} ({f.size})
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Nivel</label>
            <select
              value={filters.nivel}
              onChange={(e) => setFilters({ ...filters, nivel: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="error">Solo errores</option>
              <option value="warn">Warnings</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar en logs..."
              value={filters.busqueda}
              onChange={(e) => setFilters({ ...filters, busqueda: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              onClick={fetchLogs}
              className="bg-[primary-500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Buscar
            </button>
            {filters.fecha && (
              <button
                onClick={() => handleDownload(`combined-${filters.fecha}.log.gz`)}
                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Descargar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Mostrando {logs.length} de {total} registros
          </span>
          <button onClick={fetchLogs} className="text-[primary-500] text-sm font-medium hover:underline">
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            Cargando logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No se encontraron logs</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide w-24">Nivel</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Mensaje</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((line, i) => {
                  const level = getLevel(line);
                  return (
                    <tr key={i} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium border ${levelColors[level]}`}>
                          {level.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm whitespace-pre-wrap text-gray-700">{line}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button
              key={i}
              onClick={() => setFilters({ ...filters, page: i + 1 })}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                filters.page === i + 1 ? 'bg-[primary-500] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          {totalPages > 10 && <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>}
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE: PESTAÑA DE NOTIFICACIONES
// ============================================

const NotificationsTab = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fecha: '',
    canal: '',
    status: '',
    busqueda: '',
    page: 1,
  });
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page: filters.page, limit: 50 };
      if (filters.fecha) params.fecha = filters.fecha;
      if (filters.canal) params.canal = filters.canal;
      if (filters.status) params.status = filters.status;
      if (filters.busqueda) params.busqueda = filters.busqueda;

      const { data } = await api.get('/admin/notifications', { params });
      setNotifications(data.notifications);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch {
      toast.error('Error cargando notificaciones');
    } finally {
      setLoading(false);
    }
  };

   const fetchStats = async () => {
     try {
       const { data } = await api.get('/admin/notifications/stats');
       setStats(data);
     } catch {
       toast.error('Error cargando estadísticas');
     }
   };

   const exportNotificationsToExcel = async () => {
     try {
       // Exportar notificaciones actuales con filtros aplicados
       const params: Record<string, string | number> = { 
         page: filters.page, 
         limit: 1000 // Límite alto para obtener todas las notificaciones filtradas
       };
       if (filters.fecha) params.fecha = filters.fecha;
       if (filters.canal) params.canal = filters.canal;
       if (filters.status) params.status = filters.status;
       if (filters.busqueda) params.busqueda = filters.busqueda;

       const { data } = await api.get('/admin/notifications', { params });
       
        // Procesar notificaciones para el formato de Excel
        const notificationData = data.notifications.map((notif: any) => ({
         'ID': notif.id.slice(0, 8),
         'Fecha': formatDate(notif.createdAt),
         'Canal': notif.canal,
         'Estado': notif.status,
         'Destinatario Nombre': notif.destinatarioNombre || 'N/A',
         'Destinatario Contacto': notif.destinatario || 'N/A',
         'Asunto': notif.asunto || 'N/A',
         'Mensaje': notif.mensaje || 'N/A',
         'Error': notif.error || 'N/A',
         'Reserva ID': notif.reservation.id.slice(0, 8),
         'Reserva Cliente': notif.reservation.nombreCompleto,
         'Reserva Teléfono': notif.reservation.telefono,
         'Reserva Estado': notif.reservation.estado
       }));

       // Crear hoja de trabajo
       const worksheet = XLSX.utils.json_to_sheet(notificationData);
       const workbook = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Notificaciones');
       
        // Generar archivo Excel
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(excelBlob);
       
       // Crear enlace de descarga
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `notificaciones_${new Date().toISOString().slice(0,10)}.xlsx`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       
       // Liberar memoria
       window.URL.revokeObjectURL(url);
       
       toast.success('Notificaciones exportadas a Excel exitosamente');
     } catch (error) {
       console.error('Error exportando notificaciones a Excel:', error);
       toast.error('Error exportando notificaciones a Excel');
     }
   };

   useEffect(() => {
     fetchStats();
   }, []);

   useEffect(() => {
     fetchNotifications();
   }, [filters]);

  return (
    <div className="space-y-6">
       {/* Estadísticas de notificaciones */}
       {stats && (
         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
             <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Total</p>
             <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
           </div>
           <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-200">
             <p className="text-xs font-medium text-green-600 uppercase tracking-wide mb-1">Enviadas hoy</p>
             <p className="text-2xl font-bold text-green-600">{stats.sentToday}</p>
           </div>
           <div className="bg-red-50 rounded-xl p-4 shadow-sm border border-red-200">
             <p className="text-xs font-medium text-red-600 uppercase tracking-wide mb-1">Fallidas hoy</p>
             <p className="text-2xl font-bold text-red-600">{stats.failedToday}</p>
           </div>
           <div className="bg-yellow-50 rounded-xl p-4 shadow-sm border border-yellow-200">
             <p className="text-xs font-medium text-yellow-600 uppercase tracking-wide mb-1">Pendientes</p>
             <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
           </div>
         </div>
       )}
       {/* Botón para exportar notificaciones a Excel */}
       <div className="flex justify-end mb-4">
         <button
           onClick={exportNotificationsToExcel}
           className="bg-[primary-500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors flex items-center gap-2"
         >
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
           </svg>
           Exportar notificaciones a Excel
         </button>
       </div>

      {/* Filtros de notificaciones */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Fecha</label>
            <input
              type="date"
              value={filters.fecha}
              onChange={(e) => setFilters({ ...filters, fecha: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Canal</label>
            <select
              value={filters.canal}
              onChange={(e) => setFilters({ ...filters, canal: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="EMAIL">Email</option>
              <option value="WHATSAPP">WhatsApp</option>
              <option value="INTERNAL">Interna</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Estado</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="SENT">Enviadas</option>
              <option value="FAILED">Fallidas</option>
              <option value="PENDING">Pendientes</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Buscar</label>
            <input
              type="text"
              placeholder="Buscar por cliente, email, teléfono..."
              value={filters.busqueda}
              onChange={(e) => setFilters({ ...filters, busqueda: e.target.value, page: 1 })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={fetchNotifications}
              className="bg-[primary-500] text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de notificaciones */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">
            Mostrando {notifications.length} de {total} notificaciones
          </span>
          <button onClick={fetchNotifications} className="text-[primary-500] text-sm font-medium hover:underline">
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-400">
            <div className="animate-spin w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            Cargando notificaciones...
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-12 text-gray-400">No se encontraron notificaciones</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Canal</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Estado</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Destinatario</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Reserva</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Mensaje</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((notif) => (
                  <tr key={notif.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {formatDate(notif.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${canalColors[notif.canal]}`}>
                        {notif.canal}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[notif.status]}`}>
                        {notif.status === 'SENT' ? '✓ Enviada' : notif.status === 'FAILED' ? '✗ Fallida' : '⏳ Pendiente'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{notif.destinatarioNombre || 'N/A'}</div>
                      <div className="text-gray-500 text-xs">{notif.destinatario || 'N/A'}</div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{notif.reservation.nombreCompleto}</div>
                      <div className="text-gray-500 text-xs">#{notif.reservation.id.slice(0, 8)}</div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 max-w-xs truncate">
                      {notif.mensaje || notif.asunto || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelectedNotif(notif)}
                        className="text-[primary-500] text-sm font-medium hover:underline"
                      >
                        Ver
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => (
            <button
              key={i}
              onClick={() => setFilters({ ...filters, page: i + 1 })}
              className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                filters.page === i + 1 ? 'bg-[primary-500] text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {i + 1}
            </button>
          ))}
          {totalPages > 10 && <span className="w-10 h-10 flex items-center justify-center text-gray-400">...</span>}
        </div>
      )}

      {/* Modal de detalle */}
      {selectedNotif && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedNotif(null)}>
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg text-gray-900 mb-4">Detalle de Notificación</h3>

            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">ID:</span>
                <span className="text-sm font-mono">{selectedNotif.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Canal:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${canalColors[selectedNotif.canal]}`}>
                  {selectedNotif.canal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Estado:</span>
                <span className={`px-2 py-1 rounded text-xs font-medium border ${statusColors[selectedNotif.status]}`}>
                  {selectedNotif.status}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Destinatario:</span>
                <span className="text-sm">{selectedNotif.destinatarioNombre || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Contacto:</span>
                <span className="text-sm">{selectedNotif.destinatario || 'N/A'}</span>
              </div>
              {selectedNotif.asunto && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Asunto:</span>
                  <span className="text-sm">{selectedNotif.asunto}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Mensaje:</span>
                <p className="text-sm mt-1 bg-gray-50 p-2 rounded">{selectedNotif.mensaje || 'N/A'}</p>
              </div>
              {selectedNotif.error && (
                <div>
                  <span className="text-sm text-red-500">Error:</span>
                  <p className="text-sm mt-1 bg-red-50 p-2 rounded text-red-600">{selectedNotif.error}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Creada:</span>
                <span className="text-sm">{formatDate(selectedNotif.createdAt)}</span>
              </div>
              {selectedNotif.sentAt && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Enviada:</span>
                  <span className="text-sm">{formatDate(selectedNotif.sentAt)}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3">
                <span className="text-sm text-gray-500">Reserva asociada:</span>
                <div className="mt-1 bg-blue-50 p-2 rounded">
                  <div className="font-medium text-sm">#{selectedNotif.reservation.id.slice(0, 8)} - {selectedNotif.reservation.nombreCompleto}</div>
                  <div className="text-xs text-gray-500">Tel: {selectedNotif.reservation.telefono} | Estado: {selectedNotif.reservation.estado}</div>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedNotif(null)}
              className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================
// COMPONENTE PRINCIPAL CON PESTAÑAS
// ============================================

const SystemDashboard = () => {
  const [activeTab, setActiveTab] = useState<'logs' | 'notifications'>('logs');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Sistema</h1>
        <p className="text-sm text-gray-500 mt-1">Logs del sistema y notificaciones enviadas</p>
      </div>

      {/* Pestañas */}
      <div className="flex gap-2 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'logs'
              ? 'border-[primary-500] text-[primary-500]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📝 Logs del Sistema
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'notifications'
              ? 'border-[primary-500] text-[primary-500]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          🔔 Notificaciones
        </button>
      </div>

      {/* Contenido de la pestaña */}
      {activeTab === 'logs' ? <LogsTab /> : <NotificationsTab />}
    </div>
  );
};

export default SystemDashboard;
