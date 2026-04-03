import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { User, Reservation } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';
import AdminPageLayout from '../../components/admin/AdminPageLayout';
import StatusBadge from '../../components/ui/StatusBadge';
import * as XLSX from 'xlsx';

const createSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')),
  zona: z.string().optional(),
  telefono: z.string().optional(),
});
type VendorForm = z.infer<typeof createSchema>;

const VendorsManager = () => {
  const [vendors, setVendors] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingVendor, setEditingVendor] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Modal reservas del vendedor
  const [reservationsModal, setReservationsModal] = useState<{ open: boolean; vendor: User | null }>({ open: false, vendor: null });
  const [vendorReservations, setVendorReservations] = useState<Reservation[]>([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filterZona, setFilterZona] = useState('');
  const [filterEstado, setFilterEstado] = useState('');
  const [zonas, setZonas] = useState<string[]>([]);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<VendorForm>({
    resolver: zodResolver(createSchema),
  });

  const totalPages = Math.ceil(total / limit);

  const fetchVendors = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { 
        rol: 'VENDEDOR',
        page: String(p),
        limit: String(l),
      };
      if (search) params.search = search;
      if (filterZona) params.zona = filterZona;
      if (filterEstado) params.isActive = filterEstado;
      
      const res = await api.get('/admin/users', { params });
      setVendors(res.data.data);
      setTotal(res.data.pagination.total);
      
      // Obtener zonas únicas para el filtro
      if (zonas.length === 0) {
        const allVendors = await api.get('/admin/users', { params: { rol: 'VENDEDOR', limit: '9999' } });
        const uniqueZonas = [...new Set(allVendors.data.data.map((v: User) => v.zona).filter(Boolean))];
        setZonas(uniqueZonas as string[]);
      }
    } catch (err) { 
      console.error('Error fetching vendors:', err);
      setVendors([]);
      setTotal(0);
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchVendors(page, limit); 
  }, [page, limit, search, filterZona, filterEstado]);

   const exportToExcel = async () => {
     setExporting(true);
     try {
       const params: Record<string, string> = { rol: 'VENDEDOR', limit: '9999' };
       if (search) params.search = search;
       if (filterZona) params.zona = filterZona;
       if (filterEstado) params.isActive = filterEstado;
       
       const res = await api.get('/admin/users', { params });
       const rows: User[] = res.data.data;

       // Procesar datos para Excel
       const excelData = rows.map((v) => ({
         'Nombre': v.nombre,
         'Email': v.email,
         'Zona': v.zona ?? '',
         'Teléfono': v.telefono ?? '',
         'Estado': v.isActive ? 'Activo' : 'Inactivo',
         'Reservas': v._count?.reservations ?? 0,
         'Fecha registro': new Date(v.createdAt).toLocaleDateString('es-MX'),
       }));

       // Crear hoja de trabajo
       const worksheet = XLSX.utils.json_to_sheet(excelData);
       const workbook = XLSX.utils.book_new();
       XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendedores');
       
       // Generar archivo Excel
       const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
       const excelBlob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
       const url = window.URL.createObjectURL(excelBlob);
       
       // Crear enlace de descarga
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `vendedores_${new Date().toISOString().slice(0, 10)}.xlsx`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       
       // Liberar memoria
       window.URL.revokeObjectURL(url);
       
       showSuccess('Vendedores exportados correctamente');
     } catch (err) {
       console.error('Error al exportar a Excel:', err);
       showError('No se pudo exportar a Excel. Intenta de nuevo.');
     } finally {
       setExporting(false);
     }
   };

  const openCreate = () => {
    setEditingVendor(null);
    setFormError('');
    reset({ nombre: '', email: '', password: '', zona: '', telefono: '' });
    setShowModal(true);
  };

  const openEdit = (vendor: User) => {
    setEditingVendor(vendor);
    setFormError('');
    reset({ nombre: vendor.nombre, email: vendor.email, password: '', zona: vendor.zona ?? '', telefono: vendor.telefono ?? '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVendor(null);
    reset();
    setFormError('');
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      showSuccess('Vendedor actualizado correctamente');
      fetchVendors(page, limit);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del vendedor');
    }
  };

  const onSubmit = async (data: VendorForm) => {
    setFormError('');
    try {
      if (editingVendor) {
        const payload: Record<string, string> = {
          nombre: data.nombre,
          email: data.email,
          zona: data.zona ?? '',
          telefono: data.telefono ?? '',
        };
        if (data.password) payload.password = data.password;
        await api.put(`/admin/users/${editingVendor.id}`, payload);
        showSuccess('Vendedor actualizado correctamente');
      } else {
        await api.post('/admin/users', { ...data, rol: 'VENDEDOR' });
        showSuccess('Vendedor creado correctamente');
      }
      closeModal();
      fetchVendors(page, limit);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showSuccess('Vendedor eliminado correctamente');
      setDeleteTarget(null);
      fetchVendors(page, limit);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al eliminar vendedor');
    } finally {
      setDeleting(false);
    }
  };

  const openReservationsModal = async (vendor: User) => {
    setReservationsModal({ open: true, vendor });
    setLoadingReservations(true);
    try {
      const res = await api.get('/reservations/admin', { params: { vendorId: vendor.id, limit: '9999' } });
      const allReservations: Reservation[] = res.data.data;
      setVendorReservations(allReservations.filter((r) => r.estado !== 'CANCELADA' && r.estado !== 'COMPLETADA'));
    } catch (err) {
      console.error(err);
      setVendorReservations([]);
    } finally {
      setLoadingReservations(false);
    }
  };

  const closeReservationsModal = () => {
    setReservationsModal({ open: false, vendor: null });
    setVendorReservations([]);
  };

  const activos = vendors.filter((v) => v.isActive).length;

  // Filtros UI
  const filtersUI = (
    <>
      <div className="w-36">
        <label className="text-xs text-gray-500 block mb-1">Zona</label>
        <select
          value={filterZona}
          onChange={(e) => { setFilterZona(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas</option>
          {zonas.map((z) => (
            <option key={z} value={z}>{z}</option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <label className="text-xs text-gray-500 block mb-1">Estado</label>
        <select
          value={filterEstado}
          onChange={(e) => { setFilterEstado(e.target.value); setPage(1); }}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todos</option>
          <option value="true">Activos</option>
          <option value="false">Inactivos</option>
        </select>
      </div>
    </>
  );

  const activeFiltersUI = (
    <>
      {search && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Búsqueda: "{search}"
          <button onClick={() => setSearch('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {filterZona && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Zona: {filterZona}
          <button onClick={() => setFilterZona('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
      {filterEstado && (
        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs px-2 py-0.5 rounded-full">
          Estado: {filterEstado === 'true' ? 'Activo' : 'Inactivo'}
          <button onClick={() => setFilterEstado('')} className="ml-0.5 hover:text-blue-900">×</button>
        </span>
      )}
    </>
  );

  return (
    <>
       <AdminPageLayout
         title="Gestión de Vendedores"
         subtitle={`${activos} activos / ${vendors.length} total`}
         total={total}
         page={page}
         totalPages={totalPages}
         limit={limit}
         loading={loading}
         exporting={exporting}
         onPageChange={setPage}
         onLimitChange={setLimit}
         onExport={exportToExcel}
         onAdd={openCreate}
         addButtonText="+ Nuevo vendedor"
         searchPlaceholder="Buscar por nombre o zona..."
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
                {['Nombre', 'Email', 'Zona', 'Teléfono', 'Estado', 'Reservas', 'Acciones'].map((h) => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                Array.from({ length: limit }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((__, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 bg-gray-100 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : vendors.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400">Sin vendedores</td></tr>
              ) : (
                vendors.map((v) => (
                  <tr key={v.id} className={`hover:bg-gray-50 transition-colors ${!v.isActive ? 'opacity-50' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${v.isActive ? 'bg-[#0f49bd]' : 'bg-gray-300'}`}>
                          {v.nombre.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{v.nombre}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{v.email}</td>
                    <td className="px-4 py-3 text-gray-600">{v.zona || '-'}</td>
                    <td className="px-4 py-3 text-gray-600">{v.telefono || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${v.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {v.isActive ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => openReservationsModal(v)}
                        className="text-[#0f49bd] hover:text-blue-800 hover:underline font-medium transition-colors"
                      >
                        {v._count?.reservations ?? 0}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleToggle(v.id)}
                          title={v.isActive ? 'Desactivar' : 'Activar'}
                          className={`p-1.5 rounded-lg transition-colors ${v.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-600 hover:bg-green-50'}`}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            {v.isActive 
                              ? <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="16" cy="12" r="3" fill="currentColor" /></>
                              : <><rect x="1" y="5" width="22" height="14" rx="7" /><circle cx="8" cy="12" r="3" fill="currentColor" /></>
                            }
                          </svg>
                        </button>
                        <button onClick={() => openEdit(v)} title="Editar" className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536M9 13l6.586-6.586a2 2 0 012.828 2.828L11.828 15.828a2 2 0 01-1.414.586H9v-2a2 2 0 01.586-1.414z" />
                          </svg>
                        </button>
                        <button onClick={() => setDeleteTarget(v)} title="Eliminar" className="p-1.5 rounded-lg text-red-500 hover:bg-red-50">
                          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
                          </svg>
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

      {/* Modal crear / editar vendedor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-5">
              {editingVendor ? 'Editar Vendedor' : 'Nuevo Vendedor'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                <input {...register('nombre')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input {...register('email')} type="email" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contraseña {editingVendor && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input {...register('password')} type="password" placeholder={editingVendor ? '••••••••' : ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Zona</label>
                  <input {...register('zona')} placeholder="Ej: Centro" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                  <input {...register('telefono')} type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">
                  {isSubmitting ? 'Guardando...' : editingVendor ? 'Guardar cambios' : 'Crear vendedor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmar eliminar */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7 0a1 1 0 01-1-1V5a1 1 0 011-1h6a1 1 0 011 1v1a1 1 0 01-1 1H9z" />
              </svg>
            </div>
            <h3 className="font-bold text-gray-900 text-lg mb-1">Eliminar vendedor</h3>
            <p className="text-gray-500 text-sm mb-6">
              ¿Estás seguro de eliminar a <span className="font-semibold text-gray-900">{deleteTarget.nombre}</span>? Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal reservas del vendedor */}
      {reservationsModal.open && reservationsModal.vendor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col">
            <div className="p-6 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-gray-900">Reservas de {reservationsModal.vendor.nombre}</h3>
                  <p className="text-sm text-gray-500">{vendorReservations.length} reserva{vendorReservations.length !== 1 ? 's' : ''} asignada{vendorReservations.length !== 1 ? 's' : ''}</p>
                </div>
                <button onClick={closeReservationsModal} className="text-gray-400 hover:text-gray-600 p-1">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="overflow-y-auto flex-1 p-6 pt-4">
              {loadingReservations ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-gray-100 rounded animate-pulse" />
                  ))}
                </div>
              ) : vendorReservations.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <p className="font-medium">Sin reservas asignadas</p>
                  <p className="text-sm mt-1">Este vendedor no tiene reservas.</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 rounded-lg">
                    <tr>
                      {['Folio', 'Cliente', 'Producto', 'Detalles', 'Dirección', 'Fecha', 'Estado'].map((h) => (
                        <th key={h} className="text-left px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {vendorReservations.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-500">#{r.id.slice(0, 8).toUpperCase()}</td>
                        <td className="px-3 py-2.5">
                          <p className="font-medium text-gray-900 text-xs">{r.nombreCompleto}</p>
                          <p className="text-gray-400 text-xs">{r.telefono}</p>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600">
                          {r.items && r.items.length > 0
                            ? r.items.map((i) => i.product?.nombre).filter(Boolean).join(', ')
                            : 'Sin productos'}
                        </td>
                        <td className="px-3 py-2.5">
                          {r.items && r.items.length > 0 ? (
                            <div className="space-y-1">
                              {r.items.map((i) => {
                                const variantes = [i.color, i.memoria].filter(Boolean).join(', ');
                                return (
                                  <div key={i.id} className="text-xs text-gray-600">
                                    {variantes || <span className="text-gray-400">—</span>}
                                  </div>
                                );
                              })}
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 max-w-[160px]">
                          <span className="line-clamp-2" title={r.direccion}>{r.direccion}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-600 whitespace-nowrap">
                          {new Date(r.fechaPreferida).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' })} {r.horarioPreferido}
                        </td>
                        <td className="px-3 py-2.5">
                          <StatusBadge type="reserva" estado={r.estado} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="p-4 border-t border-gray-100">
              <button onClick={closeReservationsModal} className="w-full border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default VendorsManager;
