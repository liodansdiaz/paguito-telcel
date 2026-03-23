import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../../services/api';
import type { User } from '../../types';
import { showSuccess, showError } from '../../utils/notifications';
import AdminPageLayout from '../../components/admin/AdminPageLayout';

const createSchema = z.object({
  nombre: z.string().min(2, 'Nombre requerido'),
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Mínimo 8 caracteres').or(z.literal('')),
  telefono: z.string().optional(),
});
type AdminForm = z.infer<typeof createSchema>;

const AdminsManager = () => {
  const [admins, setAdmins] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<User | null>(null);
  const [formError, setFormError] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Filtros
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('');

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<AdminForm>({
    resolver: zodResolver(createSchema),
  });

  const totalPages = Math.ceil(total / limit);
  const activos = admins.filter((a) => a.isActive).length;

  const fetchAdmins = async (p = page, l = limit) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { 
        rol: 'ADMIN',
        page: String(p),
        limit: String(l),
      };
      if (search) params.search = search;
      if (filterEstado) params.isActive = filterEstado;
      
      const res = await api.get('/admin/users', { params });
      setAdmins(res.data.data);
      setTotal(res.data.pagination.total);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { 
    fetchAdmins(page, limit); 
  }, [page, limit, search, filterEstado]);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const params: Record<string, string> = { rol: 'ADMIN', limit: '9999' };
      if (search) params.search = search;
      if (filterEstado) params.isActive = filterEstado;
      
      const res = await api.get('/admin/users', { params });
      const rows: User[] = res.data.data;

      const headers = ['Nombre', 'Email', 'Teléfono', 'Estado', 'Fecha registro', 'Último acceso'];
      const data = rows.map((a) => [
        a.nombre,
        a.email,
        a.telefono ?? '',
        a.isActive ? 'Activo' : 'Inactivo',
        new Date(a.createdAt).toLocaleDateString('es-MX'),
        a.lastAssignedAt ? new Date(a.lastAssignedAt).toLocaleDateString('es-MX') : 'Nunca',
      ]);

      const csv = [headers, ...data]
        .map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
        .join('\n');

      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `administradores_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showSuccess('Administradores exportados correctamente');
    } catch (err) {
      console.error('Error al exportar:', err);
      showError('No se pudo exportar. Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const openCreate = () => {
    setEditingAdmin(null);
    setFormError('');
    reset({ nombre: '', email: '', password: '', telefono: '' });
    setShowModal(true);
  };

  const openEdit = (admin: User) => {
    setEditingAdmin(admin);
    setFormError('');
    reset({ nombre: admin.nombre, email: admin.email, password: '', telefono: admin.telefono ?? '' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAdmin(null);
    reset();
    setFormError('');
  };

  const handleToggle = async (id: string) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      showSuccess('Administrador actualizado correctamente');
      fetchAdmins(page, limit);
    } catch (err: any) { 
      showError(err.response?.data?.message || 'Error al cambiar estado del administrador');
    }
  };

  const onSubmit = async (data: AdminForm) => {
    setFormError('');
    try {
      if (editingAdmin) {
        const payload: Record<string, string> = {
          nombre: data.nombre,
          email: data.email,
          telefono: data.telefono ?? '',
        };
        if (data.password) payload.password = data.password;
        await api.put(`/admin/users/${editingAdmin.id}`, payload);
        showSuccess('Administrador actualizado correctamente');
      } else {
        await api.post('/admin/users', { ...data, rol: 'ADMIN' });
        showSuccess('Administrador creado correctamente');
      }
      closeModal();
      fetchAdmins(page, limit);
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Error al guardar');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget.id}`);
      showSuccess('Administrador eliminado correctamente');
      setDeleteTarget(null);
      fetchAdmins(page, limit);
    } catch (err: any) {
      showError(err.response?.data?.message || 'Error al eliminar administrador');
    } finally {
      setDeleting(false);
    }
  };

  // Filtros UI
  const filtersUI = (
    <>
      <div className="w-36">
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

  return (
    <>
      <AdminPageLayout
        title="Administradores"
        subtitle={`${total} ${total === 1 ? 'administrador registrado' : 'administradores registrados'} • ${activos} ${activos === 1 ? 'activo' : 'activos'}`}
        total={total}
        page={page}
        totalPages={totalPages}
        limit={limit}
        loading={loading}
        exporting={exporting}
        onPageChange={setPage}
        onLimitChange={setLimit}
        onExport={exportCSV}
        onAdd={openCreate}
        addButtonText="+ Nuevo administrador"
        searchPlaceholder="Nombre o email..."
        searchValue={search}
        onSearchChange={(value) => { setSearch(value); setPage(1); }}
        filters={filtersUI}
      >
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
            <p className="text-gray-500 mt-2 text-sm">Cargando administradores...</p>
          </div>
        ) : admins.length === 0 ? (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay administradores</h3>
            <p className="mt-1 text-sm text-gray-500">Comienza creando un nuevo administrador.</p>
            <div className="mt-6">
              <button
                onClick={openCreate}
                className="px-4 py-2 bg-[#0f49bd] text-white rounded-lg hover:bg-[#002f87] transition-colors text-sm font-medium"
              >
                + Nuevo administrador
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nombre
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Teléfono
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha registro
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {admins.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {admin.nombre.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{admin.nombre}</div>
                          <div className="text-xs text-gray-500">ID: {admin.id.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admin.email}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{admin.telefono || '-'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggle(admin.id)}
                        className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          admin.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {admin.isActive ? '✓ Activo' : '✗ Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.createdAt).toLocaleDateString('es-MX', { 
                        day: '2-digit', 
                        month: 'short', 
                        year: 'numeric' 
                      })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEdit(admin)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setDeleteTarget(admin)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPageLayout>

      {/* Modal crear/editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h3 className="font-bold text-lg text-gray-900 mb-5">
              {editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Nombre completo</label>
                <input {...register('nombre')} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.nombre && <p className="text-red-500 text-xs mt-1">{errors.nombre.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                <input 
                  {...register('email')} 
                  type="email" 
                  disabled={!!editingAdmin}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed" 
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
                {editingAdmin && <p className="text-xs text-gray-500 mt-1">No se puede cambiar el email</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">
                  Contraseña {editingAdmin && <span className="text-gray-400 font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input {...register('password')} type="password" placeholder={editingAdmin ? '••••••••' : ''} className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Teléfono</label>
                <input {...register('telefono')} type="tel" className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={closeModal} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 bg-[#0f49bd] text-white py-2.5 rounded-lg text-sm font-semibold disabled:opacity-50 hover:bg-blue-700">
                  {isSubmitting ? 'Guardando...' : editingAdmin ? 'Guardar cambios' : 'Crear administrador'}
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
            <h3 className="font-bold text-gray-900 text-lg mb-1">Eliminar administrador</h3>
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
    </>
  );
};

export default AdminsManager;
